import {useLocation, useNavigate} from 'react-router-dom';
import React, {useState} from "react";
import {ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import type {NavState} from "../types";
import {getRarityColor, RARITY_COLORS} from "../colors";
import {useData} from "../context/DataContext";

interface TrialRow {
    trial: number;
    clear_rate?: number;
    player_count?: number;
    [key: string]: number | undefined;
}

type ViewMode = 'rarity' | 'tier';

const RARITY_ORDER = Object.keys(RARITY_COLORS);
const LOW_SAMPLE_SIMS = 200;

const renderDot = (key: string, color: string) => (props: {cx?: number; cy?: number; payload?: TrialRow}) => {
    const {cx, cy, payload} = props;
    if (cx == null || cy == null || !payload) return null;
    const sims = payload[key + '_sims'] ?? 0;
    if (!sims) return null;
    const r = sims >= 500 ? 4 : sims >= LOW_SAMPLE_SIMS ? 3 : 2;
    const opacity = sims >= 500 ? 1 : sims >= LOW_SAMPLE_SIMS ? 0.65 : 0.35;
    return <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={opacity} stroke={color} strokeOpacity={opacity * 0.5} strokeWidth={1}/>;
};

interface DataSeries {
    key: string;
    label: string;
    color: string;
}

interface SingleItemTooltipProps {
    active?: boolean;
    payload?: Array<{payload: TrialRow}>;
    series: DataSeries[];
    viewMode: ViewMode;
    allRarities: string[];
}

const SingleItemTooltip = ({active, payload, series, viewMode, allRarities}: SingleItemTooltipProps) => {
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
            {series.map(({key, label, color}) => {
                const rate = row[key];
                const sims = row[key + '_sims'];
                if (rate == null) return null;
                const lowSims = (sims ?? 0) < LOW_SAMPLE_SIMS;
                const rarityDetail = viewMode === 'tier'
                    ? allRarities.flatMap(rarity => {
                        const r = row[`${key}_${rarity}`];
                        const s = row[`${key}_${rarity}_sims`];
                        return r != null ? [{rarity, rate: r, sims: s ?? 0}] : [];
                    })
                    : [];
                return (
                    <div key={key} style={{marginBottom: rarityDetail.length ? 2 : 0}}>
                        <span style={{color}}>{label}: {rate.toFixed(1)}%</span>
                        <span style={{color: lowSims ? "#e57373" : "#888", marginLeft: 6, fontSize: 11}}>
                            ({sims ?? 0} sims{lowSims ? " ⚠" : ""})
                        </span>
                        {rarityDetail.map(({rarity, rate: r, sims: s}) => (
                            <div key={rarity} style={{fontSize: 11, marginLeft: 10, color: getRarityColor(rarity)}}>
                                {rarity}: {r.toFixed(1)}%
                                <span style={{color: s < LOW_SAMPLE_SIMS ? "#e57373" : "#aaa", marginLeft: 4}}>
                                    ({s} sims{s < LOW_SAMPLE_SIMS ? " ⚠" : ""})
                                </span>
                            </div>
                        ))}
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
    const tierNums = new Set<number>();
    const tierRarityPairs = new Set<string>(); // "tier_N_Rarity"

    const chartData: TrialRow[] = trials.map((trial) => {
        const row: TrialRow = {
            trial: trial.trial_id,
            clear_rate: trial.clear_rate * 100,
            player_count: trial.unique_builds,
        };
        const trialItem = itemsByTrial[String(trial.trial_id)]?.find((i) => i.name === item_name);

        const byRarity = new Map<string, {clears: number; sims: number}>();
        const byTier = new Map<number, {clears: number; sims: number}>();

        for (const t of trialItem?.tiers ?? []) {
            if (t.rarity) {
                const acc = byRarity.get(t.rarity) ?? {clears: 0, sims: 0};
                acc.clears += t.clears ?? 0;
                acc.sims += t.sims ?? 0;
                byRarity.set(t.rarity, acc);
            }
            const acc = byTier.get(t.tier) ?? {clears: 0, sims: 0};
            acc.clears += t.clears ?? 0;
            acc.sims += t.sims ?? 0;
            byTier.set(t.tier, acc);
        }

        for (const [rarity, {clears, sims}] of byRarity) {
            rarities.add(rarity);
            row[rarity] = sims > 0 ? (clears / sims) * 100 : undefined;
            row[rarity + '_sims'] = sims;
        }

        for (const [tier, {clears, sims}] of byTier) {
            tierNums.add(tier);
            row[`tier_${tier}`] = sims > 0 ? (clears / sims) * 100 : undefined;
            row[`tier_${tier}_sims`] = sims;
        }

        for (const t of trialItem?.tiers ?? []) {
            if (!t.rarity || !(t.sims ?? 0)) continue;
            const subKey = `tier_${t.tier}_${t.rarity}`;
            tierRarityPairs.add(subKey);
            row[subKey] = (t.clears ?? 0) / t.sims! * 100;
            row[subKey + '_sims'] = t.sims!;
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

    const [viewMode, setViewMode] = useState<ViewMode>('rarity');
    const [hidden, setHidden] = useState<Set<string>>(new Set());

    const toggleHidden = (key: string) => {
        setHidden(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const raritySeries: DataSeries[] = sortedRarities.map(r => ({key: r, label: r, color: getRarityColor(r)}));
    const tierSeries: DataSeries[] = Array.from(tierRarityPairs)
        .sort((a, b) => {
            const [, aTierStr, aRarity] = a.split('_');
            const [, bTierStr, bRarity] = b.split('_');
            const rarityDiff = RARITY_ORDER.indexOf(aRarity) - RARITY_ORDER.indexOf(bRarity);
            if (rarityDiff !== 0) return rarityDiff;
            return Number(aTierStr) - Number(bTierStr);
        })
        .map(key => {
            const [, tierStr, rarity] = key.split('_');
            return {key, label: `T${tierStr} ${rarity}`, color: getRarityColor(rarity)};
        });
    const activeSeries = viewMode === 'rarity' ? raritySeries : tierSeries;

    const toggleButtonStyle = (active: boolean): React.CSSProperties => ({
        padding: '3px 12px',
        fontSize: 12,
        border: '1px solid #ccc',
        borderRadius: 3,
        cursor: 'pointer',
        background: active ? '#444' : '#f5f5f5',
        color: active ? '#fff' : '#555',
        marginRight: 4,
    });

    return (
        <div style={{width: '100%'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0 10px'}}>
                <button onClick={() => trial_id != null ? navigate('/TrialChart', {state: {trial_id}}) : navigate('/ItemScatter')}>← Back</button>
                <button
                    onClick={() => navigate('/ItemTierScaling', {state: {item_name, trial_id}})}
                    style={{marginLeft: 'auto', fontSize: 12, padding: '3px 10px', cursor: 'pointer'}}
                >
                    Tier Scaling →
                </button>
            </div>
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
                <button style={toggleButtonStyle(viewMode === 'rarity')} onClick={() => setViewMode('rarity')}>
                    By Rarity
                </button>
                <button style={toggleButtonStyle(viewMode === 'tier')} onClick={() => setViewMode('tier')}>
                    By Tier
                </button>
                <span style={{marginLeft: 16}}>
                    {activeSeries.map(({key, label, color}) => (
                        <label key={key} style={{marginRight: 10, color, cursor: 'pointer'}}>
                            <input
                                type="checkbox"
                                checked={!hidden.has(key)}
                                onChange={() => toggleHidden(key)}
                            />
                            {' '}{label}
                        </label>
                    ))}
                </span>
                <span style={{color: '#888', marginLeft: 8, fontSize: 11}}>dot size ∝ sample size</span>
            </div>
            <ResponsiveContainer height={500}>
                <ComposedChart data={chartData} margin={{top: 5, right: 30, left: 20, bottom: 20}}>
                    <XAxis dataKey="trial"/>
                    <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`}/>
                    <Tooltip content={(props) => (
                        <SingleItemTooltip
                            active={props.active}
                            payload={props.payload as unknown as Array<{payload: TrialRow}>}
                            series={activeSeries}
                            viewMode={viewMode}
                            allRarities={sortedRarities}
                        />
                    )}/>
                    <Line
                        dataKey="clear_rate"
                        name="Trial Clear Rate"
                        stroke="#FFC000"
                        strokeWidth={1.5}
                        strokeDasharray="5 4"
                        dot={{fill: "#FFC000", r: 3, stroke: "none"}}
                        activeDot={{r: 4}}
                        isAnimationActive={false}
                    />
                    {activeSeries.map(({key, label, color}) => (
                        <Line
                            key={key}
                            dataKey={key}
                            name={label}
                            stroke={color}
                            strokeWidth={2}
                            hide={hidden.has(key)}
                            dot={renderDot(key, color)}
                            activeDot={{r: 5}}
                            connectNulls={false}
                            isAnimationActive={false}
                        />
                    ))}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
