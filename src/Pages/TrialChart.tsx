import {useLocation, useNavigate} from 'react-router-dom';
import {Bar, BarChart, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import type {BarShapeProps} from "recharts";
import type {Item, NavState, TierStat, Trial} from "../types";
import {CLASS_COLORS, ITEM_CATEGORY_COLORS, getClassColor, getItemCategoryColor} from "../colors";
import {useData} from "../context/DataContext";

interface XAxisTickProps {
    x?: number;
    y?: number;
    payload?: {value: string};
}

const CATEGORY_MARKER_HEIGHT = 4;

const renderItemBar = ({x, y, width, height, payload}: BarShapeProps) => {
    const item = payload as Item;
    const categoryColor = getItemCategoryColor(item.name);
    return (
        <g>
            <Rectangle x={x} y={y} width={width} height={height} fill={getClassColor(item.name)}/>
            {categoryColor && (
                <rect
                    x={x}
                    y={(y ?? 0) + (height ?? 0) + 2}
                    width={width}
                    height={CATEGORY_MARKER_HEIGHT}
                    fill={categoryColor}
                />
            )}
        </g>
    );
};

const XAxisTick = ({x, y, payload}: XAxisTickProps) => (
    <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-45)">
            {payload?.value}
        </text>
    </g>
);

const Legend = () => (
    <div style={{display: 'flex', justifyContent: 'center', gap: 16, fontSize: 12, marginBottom: 8, flexWrap: 'wrap'}}>
        {Object.entries(CLASS_COLORS).map(([cls, color]) => (
            <span key={cls} style={{color}}>■ {cls.charAt(0).toUpperCase() + cls.slice(1)}</span>
        ))}
        <span style={{color: '#ccc', margin: '0 4px'}}>|</span>
        {Object.entries(ITEM_CATEGORY_COLORS).map(([cat, color]) => (
            <span key={cat} style={{color}}>▬ {cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
        ))}
    </div>
);

const RARITY_SORT_ORDER = ['Common', 'Uncommon', 'Rare', 'Epic'];

const sortTierStats = (tiers: TierStat[]) =>
    [...tiers].sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return RARITY_SORT_ORDER.indexOf(a.rarity ?? '') - RARITY_SORT_ORDER.indexOf(b.rarity ?? '');
    });

interface ItemTooltipProps {
    active?: boolean;
    payload?: Array<{payload: Item}>;
}

const ItemTooltip = ({active, payload}: ItemTooltipProps) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    const lowSample = (item.total_sims ?? 0) <= 200;
    const categoryColor = getItemCategoryColor(item.name);
    const categoryName = categoryColor
        ? Object.entries(ITEM_CATEGORY_COLORS).find(([, c]) => c === categoryColor)?.[0]
        : null;
    const sortedTiers = item.tiers && item.tiers.length > 1 ? sortTierStats(item.tiers) : null;
    return (
        <div style={{background: "#fff", border: "1px solid #ccc", padding: "8px 12px", fontSize: 13, borderRadius: 4, maxWidth: 260}}>
            <div style={{fontWeight: "bold", marginBottom: 4, color: getClassColor(item.name)}}>
                {item.name}
                {categoryName && <span style={{color: categoryColor ?? undefined, fontWeight: "normal", marginLeft: 6, fontSize: 11}}>▬ {categoryName}</span>}
            </div>
            <div>Win rate: {item.win_rate.toFixed(1)}%</div>
            {item.delta != null && (
                <div style={{color: item.delta >= 0 ? "#4caf50" : "#e57373"}}>
                    vs trial avg: {item.delta >= 0 ? "+" : ""}{item.delta.toFixed(1)}%
                </div>
            )}
            <div style={{color: lowSample ? "#e57373" : "#888", marginTop: 2}}>
                Sims: {item.total_sims?.toLocaleString() ?? "—"}{lowSample ? " ⚠ low sample" : ""}
            </div>
            {sortedTiers && (
                <div style={{marginTop: 6, paddingTop: 6, borderTop: "1px solid #eee"}}>
                    {sortedTiers.map((t, i) => (
                        <div key={i} style={{fontSize: 11, color: "#555", display: "flex", justifyContent: "space-between", gap: 8}}>
                            <span>T{t.tier} {t.rarity}: {(t.rate ?? 0).toFixed(1)}%</span>
                            <span style={{color: "#aaa"}}>{(t.sims ?? 0).toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function TrialChart() {
    const navigate = useNavigate();
    const location = useLocation();
    const {json, file_name} = useData();
    const {trial_id} = (location.state as NavState) || {};

    const rawItems: Item[] = (trial_id != null && json?.items_by_trial?.[trial_id]) || [];
    const trialData = [...rawItems].sort((a, b) => b.win_rate - a.win_rate);
    const trialSummary: Trial | undefined = json?.trials?.find((t) => t.trial_id === trial_id);

    const trials = json?.trials ?? [];
    const currentIndex = trials.findIndex((t) => t.trial_id === trial_id);
    const prevTrial = currentIndex > 0 ? trials[currentIndex - 1] : undefined;
    const nextTrial = currentIndex >= 0 && currentIndex < trials.length - 1 ? trials[currentIndex + 1] : undefined;

    const goToTrial = (id: number) => navigate('/TrialChart', {state: {trial_id: id}});

    const handleItemClick = (item: Item) => {
        navigate('/SingleItemTrials', {state: {trial_id, item_name: item.name}});
    };

    return (
        <div style={{width: '100%'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0 10px'}}>
                <button onClick={() => navigate('/AllTrialsChart')}>← Back</button>
            </div>
            <div style={{display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 10}}>
                <button onClick={() => prevTrial && goToTrial(prevTrial.trial_id)} disabled={!prevTrial}>
                    ← Previous
                </button>
                <button onClick={() => nextTrial && goToTrial(nextTrial.trial_id)} disabled={!nextTrial}>
                    Next →
                </button>
            </div>
            <h2 style={{textAlign: 'center', marginBottom: 10, marginTop: 10}}>
                {file_name} — Trial {trial_id}
            </h2>
            <h4 style={{textAlign: 'center', marginBottom: 4, marginTop: 4}}>
                {trialSummary && `Clear Rate: ${(trialSummary.clear_rate * 100).toFixed(1)}%  ·  Clears: ${trialSummary.total_clears.toLocaleString()} / ${trialSummary.total_sims.toLocaleString()} sims  ·  Players: ${trialSummary.unique_builds}`}
            </h4>
            <h4 style={{textAlign: 'center', marginBottom: 10, marginTop: 4}}>
                {trialSummary && `Avg. Level: ${trialSummary.avg_level}  ·  Avg. Tier: ${trialSummary.avg_tier}  ·  Unique Builds: ${trialSummary.unique_builds}`}
            </h4>
            <Legend/>
            <ResponsiveContainer height={500}>
                <BarChart data={trialData} margin={{top: 5, right: 30, left: 20, bottom: 100}}>
                    <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        height={100}
                        tick={<XAxisTick/>}
                    />
                    <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`}/>
                    <Tooltip content={<ItemTooltip/>}/>
                    <Bar
                        dataKey="win_rate"
                        shape={renderItemBar}
                        onClick={(data) => handleItemClick(data.payload)}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
