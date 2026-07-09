import {useState} from 'react';
import {CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis} from "recharts";
import {useNavigate} from 'react-router-dom';
import type {Item} from '../types';
import {CLASS_CATEGORIES, CLASS_COLORS, getClassColor} from '../colors';
import {useData} from '../context/DataContext';
import {getTitleWithFilename} from '../utils/getTitleWithFilename';

interface ScatterPoint {
    x: number; // delta (overperformance vs trial average)
    y: number; // total_sims (data reliability)
    name: string;
    win_rate: number;
    delta: number;
    total_sims: number;
}

interface ScatterTooltipProps {
    active?: boolean;
    payload?: Array<{payload: ScatterPoint}>;
}

const ScatterTooltip = ({active, payload}: ScatterTooltipProps) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const lowSample = d.total_sims < 200;
    return (
        <div style={{background: "#fff", border: "1px solid #ccc", padding: "8px 12px", fontSize: 13, borderRadius: 4}}>
            <div style={{fontWeight: "bold", marginBottom: 4, color: getClassColor(d.name)}}>{d.name}</div>
            <div>Win rate: {d.win_rate.toFixed(1)}%</div>
            <div style={{color: d.delta >= 0 ? "#4caf50" : "#e57373"}}>
                Delta: {d.delta >= 0 ? "+" : ""}{d.delta.toFixed(1)}pp
            </div>
            <div style={{color: lowSample ? "#e57373" : "#888", marginTop: 2}}>
                Sims: {d.total_sims.toLocaleString()}{lowSample ? " ⚠ low sample" : ""}
            </div>
        </div>
    );
};

export default function ItemScatterPlot() {
    const navigate = useNavigate();
    const {json, file_name} = useData();
    const [selectedTrial, setSelectedTrial] = useState<number | null>(null);

    const trials = json?.trials ?? [];
    const trialIds = trials.map(t => t.trial_id).sort((a, b) => a - b);

    const items: Item[] = selectedTrial != null
        ? (json?.items_by_trial?.[String(selectedTrial)] ?? [])
        : (json?.items ?? []);

    const avgWinRate: number | null = selectedTrial != null
        ? ((trials.find(t => t.trial_id === selectedTrial)?.clear_rate ?? null) !== null
            ? (trials.find(t => t.trial_id === selectedTrial)!.clear_rate * 100)
            : null)
        : (() => {
            const visible = items.filter(i => i.delta != null && i.total_sims != null);
            return visible.length > 0 ? visible.reduce((s, i) => s + i.win_rate, 0) / visible.length : null;
        })();

    const classBuckets: Record<string, ScatterPoint[]> = Object.fromEntries(
        Object.keys(CLASS_COLORS).map(cls => [cls, [] as ScatterPoint[]])
    );
    const other: ScatterPoint[] = [];

    for (const item of items) {
        if (item.delta == null || item.total_sims == null) continue;
        const point: ScatterPoint = {
            x: item.delta,
            y: item.total_sims,
            name: item.name,
            win_rate: item.win_rate,
            delta: item.delta,
            total_sims: item.total_sims,
        };
        const cls = Object.entries(CLASS_CATEGORIES).find(([, names]) => names.includes(item.name))?.[0];
        if (cls && classBuckets[cls]) {
            classBuckets[cls].push(point);
        } else {
            other.push(point);
        }
    }

    const handleClick = (point: ScatterPoint) => {
        navigate('/SingleItemTrials', {state: {item_name: point.name}});
    };

    return (
        <div style={{width: '100%'}}>
            <h2 style={{textAlign: 'center', marginBottom: 4, marginTop: 10}}>{getTitleWithFilename('Item Outlier Scatter', file_name)}</h2>
            <p style={{textAlign: 'center', margin: '0 0 8px', color: '#888', fontSize: 13}}>
                X: delta vs trial avg · Y: total sims (data reliability) · top-right = reliably OP · top-left = reliably weak · click to drill in
            </p>
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap'}}>
                <label htmlFor="trial-select" style={{fontSize: 13, color: '#555'}}>Trial:</label>
                <select
                    id="trial-select"
                    value={selectedTrial ?? ''}
                    onChange={e => setSelectedTrial(e.target.value === '' ? null : Number(e.target.value))}
                    style={{fontSize: 13, padding: '2px 6px', borderRadius: 4, border: '1px solid #ccc'}}
                >
                    <option value="">All Trials</option>
                    {trialIds.map(id => (
                        <option key={id} value={id}>Trial {id}</option>
                    ))}
                </select>
                {avgWinRate != null && (
                    <span style={{fontSize: 13, color: '#555'}}>
                        {selectedTrial != null ? 'Trial clear rate' : 'Avg item win rate'}:
                        {' '}<strong>{avgWinRate.toFixed(1)}%</strong>
                    </span>
                )}
            </div>
            <div style={{display: 'flex', justifyContent: 'center', gap: 16, fontSize: 12, marginBottom: 8, flexWrap: 'wrap'}}>
                {Object.entries(CLASS_COLORS).map(([cls, color]) => (
                    <span key={cls} style={{color}}>■ {cls.charAt(0).toUpperCase() + cls.slice(1)}</span>
                ))}
            </div>
            <ResponsiveContainer height={520}>
                <ScatterChart margin={{top: 20, right: 40, left: 50, bottom: 50}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee"/>
                    <XAxis
                        type="number"
                        dataKey="x"
                        name="Delta"
                        domain={['auto', 'auto']}
                        tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v}pp`}
                        label={{value: 'Delta vs trial avg (pp)', position: 'insideBottom', offset: -30, fontSize: 11, fill: '#888'}}
                    />
                    <YAxis
                        type="number"
                        dataKey="y"
                        name="Sims"
                        tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                        label={{value: 'Total sims', angle: -90, position: 'insideLeft', offset: -30, fontSize: 11, fill: '#888'}}
                    />
                    <ReferenceLine x={0} stroke="#999" strokeDasharray="4 2"/>
                    <Tooltip content={<ScatterTooltip/>}/>
                    {Object.entries(CLASS_COLORS).map(([cls, color]) => (
                        <Scatter
                            key={cls}
                            name={cls}
                            data={classBuckets[cls]}
                            fill={color}
                            style={{cursor: 'pointer'}}
                            onClick={(data) => handleClick(data as unknown as ScatterPoint)}
                        />
                    ))}
                    {other.length > 0 && (
                        <Scatter
                            name="other"
                            data={other}
                            fill="#999"
                            style={{cursor: 'pointer'}}
                            onClick={(data) => handleClick(data as unknown as ScatterPoint)}
                        />
                    )}
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}
