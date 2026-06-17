import {useState} from 'react';
import {
    Bar,
    ComposedChart,
    Line,
    ReferenceArea,
    ReferenceLine,
    Rectangle,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import type {BarShapeProps} from "recharts";
import {useNavigate} from 'react-router-dom';
import type {Item, Trial} from "../types";
import {getRgbBarColor, RARITY_COLORS} from "../colors";
import {useData} from "../context/DataContext";

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic'] as const;

const isBossTrial = (id: number) => id % 5 === 0;

// Generates the idealized difficulty curve described in CLAUDE.md:
// trials 1-3 ~100%, 4-5 slightly harder, then groups of 5 with a decreasing
// clear rate ending in a boss spike, recovering after each boss.
const computeExpectedRate = (trialId: number): number => {
    if (trialId <= 3) return 1.0;
    if (trialId === 4) return 0.90;
    const group = Math.floor((trialId - 1) / 5);
    const posInGroup = ((trialId - 1) % 5) + 1;
    if (group === 0) return 0.30; // trial 5, first boss
    const isBoss = posInGroup === 5;
    const recovery = Math.max(0.35, 0.82 - (group - 1) * 0.04);
    const bossRate = Math.max(0.12, 0.56 - (group - 1) * 0.02);
    const preBoss = bossRate + 0.12;
    const base = isBoss ? bossRate : recovery - ((posInGroup - 1) / 3) * (recovery - preBoss);
    return Math.max(0, base - 0.40);
};

type EnrichedTrial = Trial & {
    expected_rate: number;
    deviation: number;
    avg_tier_Common?: number;
    avg_tier_Uncommon?: number;
    avg_tier_Rare?: number;
    avg_tier_Epic?: number;
};

const renderTrialBar = ({x, y, width, height, payload}: BarShapeProps) => (
    <Rectangle x={x} y={y} width={width} height={height} fill={getRgbBarColor((payload as Trial).clear_rate)}/>
);

const renderDeviationBar = ({x, y, width, height, payload}: BarShapeProps) => {
    const dev = (payload as EnrichedTrial).deviation;
    return <Rectangle x={x} y={y} width={width} height={height} fill={dev >= 0 ? "#4caf50" : "#e57373"}/>;
};

interface XAxisTickProps {
    x?: number;
    y?: number;
    payload?: { value: number };
}

const XAxisTick = ({x, y, payload}: XAxisTickProps) => {
    const id = Number(payload?.value ?? 0);
    const boss = isBossTrial(id);
    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={16}
                textAnchor="end"
                fill={boss ? "#FFD700" : "#666"}
                fontWeight={boss ? "bold" : "normal"}
                transform="rotate(-45)"
            >
                {boss ? `${id} ★` : String(id)}
            </text>
        </g>
    );
};

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ payload: EnrichedTrial }>;
}

const CustomTooltip = ({active, payload}: CustomTooltipProps) => {
    if (!active || !payload?.length) return null;
    const trial = payload[0].payload;
    const playerCount = trial.unique_builds;
    const lowSample = playerCount <= 15;
    return (
        <div style={{background: "#fff", border: "1px solid #ccc", padding: "8px 12px", fontSize: 13, borderRadius: 4}}>
            <div style={{fontWeight: "bold", marginBottom: 4}}>
                Trial {trial.trial_id}{isBossTrial(trial.trial_id) ? " ★ Boss" : ""}
            </div>
            <div>Clear rate: {(trial.clear_rate * 100).toFixed(1)}%</div>
            <div style={{color: "#FFA500"}}>Expected: {(trial.expected_rate * 100).toFixed(1)}%</div>
            <div style={{color: trial.deviation >= 0 ? "#4caf50" : "#e57373"}}>
                Deviation: {trial.deviation >= 0 ? "+" : ""}{trial.deviation.toFixed(1)}pp
            </div>
            {RARITIES.map(r => {
                const v = trial[`avg_tier_${r}` as keyof EnrichedTrial] as number | undefined;
                return v != null ? (
                    <div key={r} style={{color: RARITY_COLORS[r]}}>
                        {r} avg tier: {v.toFixed(2)}
                    </div>
                ) : null;
            })}
            <div>Clears: {trial.total_clears.toLocaleString()} / {trial.total_sims.toLocaleString()} sims</div>
            <div style={{color: lowSample ? "#e57373" : "#888", marginTop: 2}}>
                Players: {playerCount}{lowSample ? " ⚠ low sample" : ""}
            </div>
        </div>
    );
};

interface DeviationTooltipProps {
    active?: boolean;
    payload?: Array<{ payload: EnrichedTrial }>;
}

const DeviationTooltip = ({active, payload}: DeviationTooltipProps) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div style={{background: "#fff", border: "1px solid #ccc", padding: "8px 12px", fontSize: 13, borderRadius: 4}}>
            <div style={{fontWeight: "bold", marginBottom: 4}}>
                Trial {d.trial_id}{isBossTrial(d.trial_id) ? " ★ Boss" : ""}
            </div>
            <div>Actual: {(d.clear_rate * 100).toFixed(1)}%</div>
            <div style={{color: "#FFA500"}}>Expected: {(d.expected_rate * 100).toFixed(1)}%</div>
            <div style={{color: d.deviation >= 0 ? "#4caf50" : "#e57373", fontWeight: "bold"}}>
                {d.deviation >= 0 ? "+" : ""}{d.deviation.toFixed(1)}pp
            </div>
        </div>
    );
};

const btnStyle = (active: boolean) => ({
    padding: '3px 10px',
    fontSize: 12,
    border: '1px solid #ccc',
    borderRadius: 3,
    cursor: 'pointer' as const,
    background: active ? '#444' : '#f5f5f5',
    color: active ? '#fff' : '#555',
    marginRight: 6,
});

export default function AllTrialsChart() {
    const navigate = useNavigate();
    const {json, file_name} = useData();
    const [showExpected, setShowExpected] = useState(true);
    const [showDeviation, setShowDeviation] = useState(false);
    const [showAvgTier, setShowAvgTier] = useState(true);

    const trialData: EnrichedTrial[] = (json?.trials ?? []).map(t => {
        const items = (json?.items_by_trial?.[String(t.trial_id)] ?? []) as Item[];
        const accum: Record<string, { tierSimSum: number; simSum: number }> = {};
        for (const item of items) {
            for (const ts of item.tiers) {
                if (!ts.rarity || !ts.sims) continue;
                if (!accum[ts.rarity]) accum[ts.rarity] = {tierSimSum: 0, simSum: 0};
                accum[ts.rarity].tierSimSum += ts.tier * ts.sims;
                accum[ts.rarity].simSum += ts.sims;
            }
        }
        return {
            ...t,
            expected_rate: computeExpectedRate(t.trial_id),
            deviation: (t.clear_rate - computeExpectedRate(t.trial_id)) * 100,
            avg_tier_Common: accum.Common?.simSum ? accum.Common.tierSimSum / accum.Common.simSum : undefined,
            avg_tier_Uncommon: accum.Uncommon?.simSum ? accum.Uncommon.tierSimSum / accum.Uncommon.simSum : undefined,
            avg_tier_Rare: accum.Rare?.simSum ? accum.Rare.tierSimSum / accum.Rare.simSum : undefined,
            avg_tier_Epic: accum.Epic?.simSum ? accum.Epic.tierSimSum / accum.Epic.simSum : undefined,
        };
    });
    const maxTrialId = trialData.length > 0 ? Math.max(...trialData.map(t => t.trial_id)) : 0;

    const groupBands = [];
    for (let start = 1; start <= maxTrialId; start += 5) {
        const groupIndex = Math.floor((start - 1) / 5);
        if (groupIndex % 2 === 1) {
            groupBands.push({x1: start, x2: Math.min(start + 4, maxTrialId)});
        }
    }

    const handleClick = (data: Trial) => {
        navigate('/TrialChart', {state: {trial_id: data.trial_id}});
    };

    return (
        <div style={{position: "relative", width: '100%'}}>
            <h2 style={{textAlign: 'center', marginBottom: 4, marginTop: 10}}>{file_name}</h2>
            <p style={{textAlign: 'center', margin: '0 0 6px', color: '#888', fontSize: 13}}>
                ★ Boss trials (every 5th) · shaded bands group every 5 trials
                {showAvgTier && (
                    <> · avg tier by rarity (right axis):&nbsp;
                        {RARITIES.map((r, i) => (
                            <span key={r} style={{color: RARITY_COLORS[r]}}>
                                {r}{i < RARITIES.length - 1 ? ', ' : ''}
                            </span>
                        ))}
                    </>
                )}
                {showExpected && <> · <span style={{color: '#FFA500'}}>--- expected curve</span></>}
            </p>
            <div style={{textAlign: 'center', marginBottom: 8}}>
                <button style={btnStyle(showExpected)} onClick={() => setShowExpected(v => !v)}>
                    {showExpected ? 'Hide' : 'Show'} Expected Curve
                </button>
                <button style={btnStyle(showDeviation)} onClick={() => setShowDeviation(v => !v)}>
                    {showDeviation ? 'Hide' : 'Show'} Deviation
                </button>
                <button style={btnStyle(showAvgTier)} onClick={() => setShowAvgTier(v => !v)}>
                    {showAvgTier ? 'Hide' : 'Show'} Avg Tier
                </button>
            </div>
            <ResponsiveContainer height={500}>
                <ComposedChart data={trialData} margin={{top: 5, right: 50, left: 20, bottom: 100}}>
                    {groupBands.map(({x1, x2}) => (
                        <ReferenceArea key={x1} x1={x1} x2={x2} fill="#888" fillOpacity={0.08} stroke="none"/>
                    ))}
                    <XAxis
                        dataKey="trial_id"
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        height={100}
                        tick={<XAxisTick/>}
                    />
                    <YAxis yAxisId="left" tickFormatter={(value) => `${Math.round(value * 100)}%`}/>
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 'auto']}
                        tickFormatter={(v) => `T${Math.round(v)}`}
                        tick={{fill: '#888', fontSize: 11}}
                    />
                    <Tooltip content={<CustomTooltip/>}/>
                    <Bar
                        yAxisId="left"
                        dataKey="clear_rate"
                        shape={renderTrialBar}
                        onClick={(data) => handleClick(data.payload)}
                    />
                    {showExpected && (
                        <Line
                            yAxisId="left"
                            dataKey="expected_rate"
                            name="Expected"
                            stroke="#FFA500"
                            strokeWidth={2}
                            strokeDasharray="4 2"
                            dot={false}
                            isAnimationActive={false}
                        />
                    )}
                    {showAvgTier && RARITIES.map(r => (
                        <Line
                            key={r}
                            yAxisId="right"
                            dataKey={`avg_tier_${r}`}
                            name={r}
                            stroke={RARITY_COLORS[r]}
                            strokeWidth={2}
                            strokeDasharray="5 3"
                            dot={false}
                            isAnimationActive={false}
                            connectNulls={false}
                        />
                    ))}
                </ComposedChart>
            </ResponsiveContainer>
            {showDeviation && (
                <>
                    <h3 style={{textAlign: 'center', margin: '16px 0 4px', fontSize: 14, color: '#555'}}>
                        Deviation from Expected (actual − expected)
                    </h3>
                    <ResponsiveContainer height={400}>
                        <ComposedChart data={trialData} margin={{top: 5, right: 50, left: 20, bottom: 60}}>
                            {groupBands.map(({x1, x2}) => (
                                <ReferenceArea key={x1} x1={x1} x2={x2} fill="#888" fillOpacity={0.08} stroke="none"/>
                            ))}
                            <XAxis
                                dataKey="trial_id"
                                angle={-45}
                                textAnchor="end"
                                interval={0}
                                height={60}
                                tick={<XAxisTick/>}
                            />
                            <YAxis tickFormatter={(v) => `${v > 0 ? "+" : ""}${Math.round(v)}pp`}/>
                            <ReferenceLine y={0} stroke="#999" strokeDasharray="3 3"/>
                            <Tooltip content={<DeviationTooltip/>}/>
                            <Bar
                                dataKey="deviation"
                                shape={renderDeviationBar}
                                onClick={(data) => handleClick(data.payload)}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </>
            )}
        </div>
    );
}
