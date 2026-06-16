import {Bar, ComposedChart, ReferenceArea, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import type {BarShapeProps} from "recharts";
import {useNavigate} from 'react-router-dom';
import type {Trial} from "../types";
import {useFileUpload} from "./HandleFileUpload.tsx";
import {getRgbBarColor} from "../colors";
import {useData} from "../context/DataContext";

const isBossTrial = (id: number) => id % 5 === 0;

const renderTrialBar = ({x, y, width, height, payload}: BarShapeProps) => (
    <Rectangle x={x} y={y} width={width} height={height} fill={getRgbBarColor((payload as Trial).clear_rate)}/>
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
    payload?: Array<{payload: Trial}>;
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
            <div>Clears: {trial.total_clears.toLocaleString()} / {trial.total_sims.toLocaleString()} sims</div>
            <div style={{color: lowSample ? "#e57373" : "#888", marginTop: 2}}>
                Players: {playerCount}{lowSample ? " ⚠ low sample" : ""}
            </div>
        </div>
    );
};

export default function AllTrialsChart() {
    const navigate = useNavigate();
    const {json, file_name} = useData();
    const handleUpload = useFileUpload();

    const trialData: Trial[] = json?.trials ?? [];
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
            <input type="file" accept=".json,application/json" onChange={handleUpload}/>
            <h2 style={{textAlign: 'center', marginBottom: 4, marginTop: 10}}>{file_name}</h2>
            <p style={{textAlign: 'center', margin: '0 0 10px', color: '#888', fontSize: 13}}>
                ★ Boss trials (every 5th) — shaded bands group every 5 trials
            </p>
            <ResponsiveContainer height={500}>
                <ComposedChart data={trialData} margin={{top: 5, right: 30, left: 20, bottom: 100}}>
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
                    <YAxis tickFormatter={(value) => `${Math.round(value * 100)}%`}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Bar
                        dataKey="clear_rate"
                        shape={renderTrialBar}
                        onClick={(data) => handleClick(data.payload)}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
