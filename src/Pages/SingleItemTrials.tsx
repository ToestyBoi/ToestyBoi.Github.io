import {useLocation, useNavigate} from 'react-router-dom';
import {useState} from "react";
import {Bar, ComposedChart, Line, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import type {BarShapeProps} from "recharts";
import type {NavState} from "../types";
import {getRarityColor, RARITY_COLORS} from "../colors";

interface TrialRow {
    trial: number;
    clear_rate?: number;
    [rarity: string]: number | undefined;
}

const RARITY_ORDER = Object.keys(RARITY_COLORS);

const renderRarityBar = (rarity: string) => ({x, y, width, height}: BarShapeProps) => (
    <Rectangle x={x} y={y} width={width} height={height} fill={getRarityColor(rarity)}/>
);

export default function SingleItemTrials() {
    const navigate = useNavigate();
    const location = useLocation();
    const {json, file_name, item_name, trial_id} = (location.state as NavState) || {};

    const trials = json?.trials ?? [];
    const itemsByTrial = json?.items_by_trial ?? {};

    const rarities = new Set<string>();
    const chartData: TrialRow[] = trials.map((trial) => {
        const row: TrialRow = {trial: trial.trial_id};
        const trialItem = itemsByTrial[String(trial.trial_id)]?.find((i) => i.name === item_name);

        const totalsByRarity = new Map<string, { clears: number; sims: number }>();
        for (const tier of trialItem?.tiers ?? []) {
            if (!tier.rarity) continue;
            const totals = totalsByRarity.get(tier.rarity) ?? {clears: 0, sims: 0};
            totals.clears += tier.clears ?? 0;
            totals.sims += tier.sims ?? 0;
            totalsByRarity.set(tier.rarity, totals);
        }

        for (const [rarity, {clears, sims}] of totalsByRarity) {
            rarities.add(rarity);
            row[rarity] = sims > 0 ? (clears / sims) * 100 : undefined;
        }

        row.clear_rate = trial.clear_rate * 100;

        return row;
    });

    const sortedRarities = Array.from(rarities).sort((a, b) => {
        const orderA = RARITY_ORDER.indexOf(a);
        const orderB = RARITY_ORDER.indexOf(b);
        if (orderA === -1 && orderB === -1) return a.localeCompare(b);
        if (orderA === -1) return 1;
        if (orderB === -1) return -1;
        return orderA - orderB;
    });

    const [hiddenRarities, setHiddenRarities] = useState<Set<string>>(new Set());

    const toggleRarity = (rarity: string) => {
        setHiddenRarities((prev) => {
            const next = new Set(prev);
            if (next.has(rarity)) {
                next.delete(rarity);
            } else {
                next.add(rarity);
            }
            return next;
        });
    };

    return (
        <div style={{width: '100%', height: 400}}>
            <button onClick={() =>
                navigate('/TrialChart', {
                    state: {
                        json: json,
                        file_name: file_name,
                        trial_id: trial_id
                    }
                })}>
                Back
            </button>
            <h2 style={{textAlign: 'center', marginBottom: 10, marginTop: 10}}>
                {item_name}
            </h2>
            <div style={{textAlign: 'center', marginBottom: 10}}>
                {sortedRarities.map((rarity) => (
                    <label key={rarity} style={{marginRight: 12, color: getRarityColor(rarity)}}>
                        <input
                            type="checkbox"
                            checked={!hiddenRarities.has(rarity)}
                            onChange={() => toggleRarity(rarity)}
                        />
                        {rarity}
                    </label>
                ))}
            </div>
            <ResponsiveContainer>
                <ComposedChart
                    data={chartData}
                    margin={{top: 5, right: 30, left: 20, bottom: 20}}
                >
                    <XAxis dataKey="trial"/>
                    <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`}/>
                    <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`}/>
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
