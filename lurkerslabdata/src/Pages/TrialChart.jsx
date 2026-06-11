import {useLocation, useNavigate} from 'react-router-dom';
import {Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {useState} from "react";

export default function TrialChart() {
    const navigate = useNavigate();
    const location = useLocation();
    const {trial_id, json, file_name} = location.state || {};
    const [onClick] = useState(0);

    const trialData = json?.items_by_trial?.[trial_id] || [];
    const handleClick = (data) => {
        console.log(data)
        navigate('/TrialItemChart', {
            state: {
                json: json,
                file_name: file_name,
                trial_id: trial_id,
                item_name: data.name,
                co_equipped: data.co_equipped
            }
        });
    }
        return (
            <div style={{width: '100%', height: 400}}>
                <button onClick={() => onClick(
                    navigate('/allTrialsChart', {
                        state: {
                            json: json,
                            file_name: file_name
                        }
                    }))}>
                    Back
                </button>
                <h2 style={{textAlign: 'center', marginBottom: 10, marginTop: 10}}>
                    Trial {trial_id}
                </h2>
                <ResponsiveContainer>
                    <BarChart data={trialData}>
                        <XAxis dataKey="name"/>
                        <YAxis domain = {[0, 100]}/>
                        <Tooltip/>
                        <Bar
                            dataKey="win_rate" fill="#8884d8"
                            onClick={(data) => handleClick(data.payload)}/>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
}