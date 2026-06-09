import {Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {useLocation, useNavigate} from 'react-router-dom';

export default function AllTrialsChart() {
    const navigate = useNavigate();
    const location = useLocation();
    const {json, file_name} = location.state || {};
    const trialData = json?.trials || [];
    const handleClick = (data) => {
        navigate('/TrialChart', {
            state: {
                trial_id: data.trial_id,
                json: json,
                file_name: file_name
            }
        });
    };
    return (
        <div style={{ width: '100%', height: 400 }}>
            <h2 style={{ textAlign: 'center', marginBottom: 10, marginTop: 10 }}>
                {file_name}
            </h2>
            <ResponsiveContainer>
                <BarChart data={trialData}>
                    <XAxis dataKey="trial_id" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                        dataKey="clear_rate" fill="#8884d8"
                        onClick={(data) => handleClick(data.payload)}/>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}