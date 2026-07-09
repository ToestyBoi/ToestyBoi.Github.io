import {useState} from 'react';
import {
    Bar,
    ComposedChart,
    Line,
    ReferenceArea,
    Rectangle,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type {BarShapeProps} from 'recharts';
import {useNavigate} from 'react-router-dom';
import type {Trial} from '../types';
import {useData} from '../context/DataContext';
import {getRgbBarColor} from '../colors';
import {getTitleWithFilename} from '../utils/getTitleWithFilename';

const isBossTrial = (id: number) => id % 5 === 0;

type EnrichedTrial = Trial & {
    approx_players: number;
    diversity_ratio: number;
};

const renderTrialBar = ({x, y, width, height, payload}: BarShapeProps) => (
    <Rectangle x={x} y={y} width={width} height={height} fill={getRgbBarColor((payload as Trial).clear_rate)} />
);

interface XAxisTickProps {
    x?: number;
    y?: number;
    payload?: {value: number};
}

const XAxisTick = ({x, y, payload}: XAxisTickProps) => {
    const id = Number(payload?.value ?? 0);
    const boss = isBossTrial(id);
    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0} y={0} dy={16}
                textAnchor="end"
                fill={boss ? '#FFD700' : '#666'}
                fontWeight={boss ? 'bold' : 'normal'}
                transform="rotate(-45)"
            >
                {boss ? `${id} ★` : String(id)}
            </text>
        </g>
    );
};

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{payload: EnrichedTrial}>;
    showRaw: boolean;
}

const CustomTooltip = ({active, payload, showRaw}: CustomTooltipProps) => {
    if (!active || !payload?.length) return null;
    const t = payload[0].payload;
    const lowSample = t.approx_players <= 15;
    const forcedStrategy = t.diversity_ratio < 0.5 && t.clear_rate < 0.5;
    return (
        <div style={{background: '#fff', border: '1px solid #ccc', padding: '8px 12px', fontSize: 13, borderRadius: 4}}>
            <div style={{fontWeight: 'bold', marginBottom: 4}}>
                Trial {t.trial_id}{isBossTrial(t.trial_id) ? ' ★ Boss' : ''}
            </div>
            <div>Clear rate: {(t.clear_rate * 100).toFixed(1)}%</div>
            <div style={{color: '#00bcd4'}}>
                Unique builds: {t.unique_builds}
                {!showRaw && ` (${(t.diversity_ratio * 100).toFixed(0)}% of ~${t.approx_players} players)`}
            </div>
            <div style={{color: lowSample ? '#e57373' : '#888', marginTop: 2}}>
                ~{t.approx_players} players{lowSample ? ' ⚠ low sample' : ''}
            </div>
            {forcedStrategy && (
                <div style={{color: '#e57373', marginTop: 4, fontWeight: 'bold'}}>
                    ⚠ Hard + low diversity
                </div>
            )}
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

export default function BuildDiversityChart() {
    const navigate = useNavigate();
    const {json, file_name} = useData();
    const [showRaw, setShowRaw] = useState(false);

    const trialData: EnrichedTrial[] = (json?.trials ?? []).map(t => {
        const approx_players = Math.max(1, Math.round(t.total_sims / 100));
        const unique_builds = t.builds
            ? new Set(t.builds.map(b =>
                b.items.flatMap(slot => slot.map(i => i.name)).sort().join('|')
              )).size
            : t.unique_builds;
        return {
            ...t,
            unique_builds,
            approx_players,
            diversity_ratio: unique_builds / approx_players,
        };
    });

    const maxTrialId = trialData.length > 0 ? Math.max(...trialData.map(t => t.trial_id)) : 0;
    const maxBuilds = Math.max(...trialData.map(t => t.unique_builds), 1);

    const groupBands: {x1: number; x2: number}[] = [];
    for (let start = 1; start <= maxTrialId; start += 5) {
        if (Math.floor((start - 1) / 5) % 2 === 1) {
            groupBands.push({x1: start, x2: Math.min(start + 4, maxTrialId)});
        }
    }

    const handleClick = (data: Trial) => {
        navigate('/TrialChart', {state: {trial_id: data.trial_id}});
    };

    return (
        <div style={{position: 'relative', width: '100%'}}>
            <h2 style={{textAlign: 'center', marginBottom: 4, marginTop: 10}}>{getTitleWithFilename('Build Diversity', file_name)}</h2>
            <p style={{textAlign: 'center', margin: '0 0 6px', color: '#888', fontSize: 13}}>
                Build Diversity vs. Difficulty · ★ Boss trials · shaded bands group every 5 trials
                {' · '}<span style={{color: '#00bcd4'}}>
                    — {showRaw ? 'unique build count' : 'diversity ratio (unique builds ÷ ~players)'}
                </span>
            </p>
            <div style={{textAlign: 'center', marginBottom: 8}}>
                <button style={btnStyle(!showRaw)} onClick={() => setShowRaw(false)}>Diversity Ratio</button>
                <button style={btnStyle(showRaw)} onClick={() => setShowRaw(true)}>Raw Build Count</button>
            </div>
            <ResponsiveContainer height={500}>
                <ComposedChart data={trialData} margin={{top: 5, right: 60, left: 20, bottom: 100}}>
                    {groupBands.map(({x1, x2}) => (
                        <ReferenceArea key={x1} x1={x1} x2={x2} fill="#888" fillOpacity={0.08} stroke="none" />
                    ))}
                    <XAxis
                        dataKey="trial_id"
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        height={100}
                        tick={<XAxisTick />}
                    />
                    <YAxis
                        yAxisId="left"
                        domain={[0, 1]}
                        tickFormatter={(v) => `${Math.round(v * 100)}%`}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={showRaw ? [0, maxBuilds] : [0, 1]}
                        tickFormatter={showRaw ? (v) => String(v) : (v) => `${Math.round(v * 100)}%`}
                        tick={{fill: '#00bcd4', fontSize: 11}}
                    />
                    <Tooltip content={<CustomTooltip showRaw={showRaw} />} />
                    <Bar
                        yAxisId="left"
                        dataKey="clear_rate"
                        shape={renderTrialBar}
                        onClick={(data) => handleClick(data.payload)}
                    />
                    <Line
                        yAxisId="right"
                        dataKey={showRaw ? 'unique_builds' : 'diversity_ratio'}
                        name="Build Diversity"
                        stroke="#00bcd4"
                        strokeWidth={2}
                        dot={{r: 3, fill: '#00bcd4'}}
                        isAnimationActive={false}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
