import {useLocation, useNavigate} from 'react-router-dom';
import {Bar, BarChart, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import type {BarShapeProps} from "recharts";
import type {Item, NavState} from "../types";
import {getItemColor, getClassColor} from "../colors";

interface XAxisTickProps {
    x?: number;
    y?: number;
    payload?: { value: string };
}

const renderItemBar = ({x, y, width, height, payload}: BarShapeProps) => (
    <Rectangle x={x} y={y} width={width} height={height} fill={getItemColor((payload as Item).name)}/>
);

const XAxisTick = ({x, y, payload}: XAxisTickProps) => (
    <g transform={`translate(${x},${y})`}>
        <text
            x={0}
            y={0}
            dy={16}
            textAnchor="end"
            fill={getClassColor(payload?.value ?? "")}
            transform="rotate(-45)"
        >
            {payload?.value}
        </text>
    </g>
);

export default function TrialChart() {
    const navigate = useNavigate();
    const location = useLocation();
    const {trial_id, json, file_name} = (location.state as NavState) || {};

    const trialData: Item[] = (trial_id != null && json?.items_by_trial?.[trial_id]) || [];
    const trialSummary = json?.trials?.find((trial) => trial.trial_id === trial_id);

    const trials = json?.trials ?? [];
    const currentIndex = trials.findIndex((trial) => trial.trial_id === trial_id);
    const prevTrial = currentIndex > 0 ? trials[currentIndex - 1] : undefined;
    const nextTrial = currentIndex >= 0 && currentIndex < trials.length - 1
        ? trials[currentIndex + 1]
        : undefined;

    const goToTrial = (id: number) => {
        navigate('/TrialChart', {
            state: {
                json: json,
                file_name: file_name,
                trial_id: id
            }
        });
    };

    const handleItemClick = (item: Item) => {
        navigate('/SingleItemTrials', {
            state: {
                json: json,
                file_name: file_name,
                trial_id: trial_id,
                item_name: item.name
            }
        });
    };

    return (
        <div style={{width: '100%', height: 400}}>
            <button onClick={() =>
                navigate('/AllTrialsChart', {
                    state: {
                        json: json,
                        file_name: file_name
                    }
                })}>
                Back
            </button>
            <button
                onClick={() => prevTrial && goToTrial(prevTrial.trial_id)}
                disabled={!prevTrial}
                style={{marginLeft: 8}}
            >
                Previous
            </button>
            <button
                onClick={() => nextTrial && goToTrial(nextTrial.trial_id)}
                disabled={!nextTrial}
                style={{marginLeft: 8}}
            >
                Next
            </button>
            <h2 style={{textAlign: 'center', marginBottom: 10, marginTop: 10}}>
                Trial {trial_id}
            </h2>
            <h4 style={{textAlign: 'center', marginBottom: 10, marginTop: 10}}>
                {trialSummary && `Clear Rate: ${Math.trunc(trialSummary.clear_rate * 100)}%, Total Clears: ${trialSummary.total_clears}, Total Sims: ${trialSummary.total_sims}`}
            </h4>
            <h4 style={{textAlign: 'center', marginBottom: 10, marginTop: 10}}>
                {trialSummary && `Avg. Level: ${trialSummary.avg_level}, Avg. Tier: ${trialSummary.avg_tier}, Unique Builds: ${trialSummary.unique_builds}`}
            </h4>
            <ResponsiveContainer>
                <BarChart
                    data={trialData}
                    margin={{top: 5, right: 30, left: 20, bottom: 100}}
                >
                    <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        height={100}
                        tick={<XAxisTick/>}
                    />
                    <YAxis domain={[0, "dataMax"]} tickFormatter={(value) => `${value}%`}/>
                    <Tooltip formatter={(value) => `${value}%`}/>
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
