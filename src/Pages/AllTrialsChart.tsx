import {Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {useLocation, useNavigate} from 'react-router-dom';
import {useState} from "react";
import type {ClearRateData, NavState, Trial} from "../types";
import {handleFileUpload} from "./HandleFileUpload.tsx";

const getBarColor = (value: number) => {
    const normalizedValue = Math.max(0, Math.min(1, Number(value) || 0));
    const red = Math.round(255 * (1 - normalizedValue));
    const green = Math.round(180 * normalizedValue);

    return `rgb(${red}, ${green}, 0)`;
};

export default function AllTrialsChart() {
    const navigate = useNavigate();
    const location = useLocation();
    const {json, file_name} = (location.state as NavState) || {};
    const [, setData] = useState<ClearRateData | null>(null);
    const [search, setSearch] = useState("");

    const trialData = json?.trials || [];
    const handleUpload = handleFileUpload(setData, navigate);

    const handleClick = (data: Trial) => {
        navigate('/TrialChart', {
            state: {
                trial_id: data.trial_id,
                json: json,
                file_name: file_name
            }
        });
    };
    return (
        <div style={{position: "relative", width: '100%', height: 400}}>
            <input
                type="file"
                accept=".json,application/json"
                onChange={handleUpload}
            />
            <input
                type="text"
                value={search}
                placeholder="Search..."
                onChange={(e) => setSearch(e.target.value)}
                style={{width: "10%"}}
            />
            {search && (
                <ul
                    style={{
                        position: "relative",
                        width: "10%",
                        border: "1px solid #ccc",
                        background: "white",
                        listStyle: "none",
                        margin: 0,
                        padding: 0,
                        maxHeight: "200px",
                        overflowY: "auto"
                    }}
                >
                </ul>
            )}
            <h2 style={{textAlign: 'center', marginBottom: 10, marginTop: 10}}>
                {file_name}
            </h2>
            <ResponsiveContainer>
                <BarChart
                    data={trialData}
                    margin={{top: 5, right: 30, left: 20, bottom: 100}}
                >
                    <XAxis
                        dataKey="trial_id"
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        height={100}
                    />
                    <YAxis tickFormatter={(value) => `${value * 100}%`}/>
                    <Tooltip
                        formatter={(value, name) =>
                            name === "clear_rate" && typeof value === "number"
                                ? [`${(value * 100).toFixed(2)}%`, name]
                                : [value, name]
                        }
                    />
                    <Bar
                        dataKey="clear_rate"
                        onClick={(data) => handleClick(data.payload)}
                    >
                        {trialData.map((trial) => (
                            <Cell key={trial.trial_id} fill={getBarColor(trial.clear_rate)}/>
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
