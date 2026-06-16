import {useLocation, useNavigate} from 'react-router-dom';
import {useState} from "react";
import {Bar, ComposedChart, Line, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import type {BarShapeProps} from "recharts";
import type {NavState} from "../types";
import {getRarityColor, RARITY_COLORS} from "../colors";
import {useData} from "../context/DataContext";

interface TrialRow {
    trial: number;
    clear_rate?: number;
    player_count?: number;
    [key: string]: number | undefined;
}

const RARITY_ORDER = Object.keys(RARITY_COLORS);
const LOW_SAMPLE_SIMS = 200;

const renderRarityBar = (rarity: string) => ({x, y, width, height, payload}: BarShapeProps) => {
    const row = payload as TrialRow;
    const sims = row[rarity + '_sims'] ?? 0;
    const opacity = sims >= 500 ? 1 : sims >= LOW_SAMPLE_SIMS ? 0.65 : sims > 0 ? 0.4 : 1;
    return (
        <Rectangle x={x} y={y} width={width} height={height} fill={getRarityColor(rarity)} fillOpacity={opacity}/>
    );
};

interface TooltipPayloadEntry {
    payload: TrialRow;
}

interface SingleItemTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
    rarities: string[];
}

const SingleItemTooltip = ({active, payload, rarities}: SingleItemTooltipProps) => {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    const lowPlayers = (row.player_count ?? 0) <= 15;
    return (
        <div style={{background: "#fff", border: "1px solid #ccc", padding: "8px 12px", fontSize: 13, borderRadius: 4}}>
            <div style={{fontWeight: "bold", marginBottom: 4}}>Trial {row.trial}</div>
            <div style={{color: lowPlayers ? "#e57373" : "#888", marginBottom: 4}}>
                Players: {row.player_count ?? "—"}{lowPlayers ? " ⚠ low sample" : ""}
            </div>
            {row.clear_rate != null && (
                <div style={{marginBottom: 4}}>Trial clear rate: {row.clear_rate.toFixed(1)}%</div>
            )}
            {rarities.map(rarity => {
                const rate = row[rarity];
                const sims = row[rarity + '_sims'];
                if (rate == null) return null;
                const lowSims = (sims ?? 0) < LOW_SAMPLE_SIMS;
                return (
                    <div key={rarity} style={{color: getRarityColor(rarity)}}>
                        {rarity}: {rate.toFixed(1)}%
                        <span style={{color: lowSims ? "#e57373" : "#888", marginLeft: 6, fontSize: 11}}>
                            ({sims ?? 0} sims{lowSims ? " ⚠" : ""})
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default function SingleItemTrials() {
    const navigate = useNavigate();
    const location = useLocation();
    const {json} = useData();
    const {item_name, trial_id} = (location.state as NavState) || {};

    const trials = json?.trials ?? [];
    const itemsByTrial = json?.items_by_trial ?? {};
    const globalItem = json?.items?.find(i => i.name === item_name);

    const rarities = new Set<string>();
    const chartData: TrialRow[] = trials.map((trial) => {
        const row: TrialRow = {
            trial: trial.trial_id,
            clear_rate: trial.clear_rate * 100,
            player_count: trial.unique_builds,
        };
        const trialItem = itemsByTrial[String(trial.trial_id)]?.find((i) => i.name === item_name);

        const totalsByRarity = new Map<string, {clears: number; sims: number}>();
        for (const tier of trialItem?.tiers ?? []) {
            if (!tier.rarity) continue;
            const acc = totalsByRarity.get(tier.rarity) ?? {clears: 0, sims: 0};
            acc.clears += tier.clears ?? 0;
            acc.sims += tier.sims ?? 0;
            totalsByRarity.set(tier.rarity, acc);
        }

        for (const [rarity, {clears, sims}] of totalsByRarity) {
            rarities.add(rarity);
            row[rarity] = sims > 0 ? (clears / sims) * 100 : undefined;
            row[rarity + '_sims'] = sims;
        }

        return row;
    });

    const sortedRarities = Array.from(rarities).sort((a, b) => {
        const iA = RARITY_ORDER.indexOf(a);
        const iB = RARITY_ORDER.indexOf(b);
        if (iA === -1 && iB === -1) return a.localeCompare(b);
        if (iA === -1) return 1;
        if (iB === -1) return -1;
        return iA - iB;
    });

    const [hiddenRarities, setHiddenRarities] = useState<Set<string>>(new Set());

    const toggleRarity = (rarity: string) => {
        setHiddenRarities((prev) => {
            const next = new Set(prev);
            next.has(rarity) ? next.delete(rarity) : next.add(rarity);
            return next;
        });
    };

    return (
        <div style={{width: '100%'}}>
            <button onClick={() => navigate('/TrialChart', {state: {trial_id}})}>Back</button>
            <h2 style={{textAlign: 'center', marginBottom: 4, marginTop: 10}}>{item_name}</h2>
            {globalItem && (
                <p style={{textAlign: 'center', margin: '0 0 8px', fontSize: 13, color: '#555'}}>
                    Overall win rate: {globalItem.overall_rate?.toFixed(1)}%
                    {globalItem.delta != null && (
                        <span style={{color: globalItem.delta >= 0 ? "#4caf50" : "#e57373", marginLeft: 8}}>
                            ({globalItem.delta >= 0 ? "+" : ""}{globalItem.delta.toFixed(1)}% vs trial avg)
                        </span>
                    )}
                    <span style={{color: '#888', marginLeft: 12}}>
                        {globalItem.total_clears?.toLocaleString()} clears / {globalItem.total_sims?.toLocaleString()} sims
                    </span>
                </p>
            )}
            <div style={{textAlign: 'center', marginBottom: 8, fontSize: 13}}>
                {sortedRarities.map((rarity) => (
                    <label key={rarity} style={{marginRight: 12, color: getRarityColor(rarity), cursor: 'pointer'}}>
                        <input
                            type="checkbox"
                            checked={!hiddenRarities.has(rarity)}
                            onChange={() => toggleRarity(rarity)}
                        />
                        {' '}{rarity}
                    </label>
                ))}
                <span style={{color: '#888', marginLeft: 12, fontSize: 11}}>bar opacity ∝ sample size</span>
            </div>
            <ResponsiveContainer height={500}>
                <ComposedChart data={chartData} margin={{top: 5, right: 30, left: 20, bottom: 20}}>
                    <XAxis dataKey="trial"/>
                    <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`}/>
                    <Tooltip content={(props) => (
                        <SingleItemTooltip
                            active={props.active}
                            payload={props.payload as unknown as TooltipPayloadEntry[]}
                            rarities={sortedRarities}
                        />
                    )}/>
                    {sortedRarities.map((rarity) => (
                        <Bar
                            key={rarity}
                            dataKey={rarity}
                            name={rarity}
                            hide={hiddenRarities.has(rarity)}
                            shape={renderRarityBar(rarity)}
                        />
                    ))}
                    <Line
                        dataKey="clear_rate"
                        name="Clear Rate"
                        stroke="none"
                        dot={{fill: "#FFC000", stroke: "none"}}
                        isAnimationActive={false}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
