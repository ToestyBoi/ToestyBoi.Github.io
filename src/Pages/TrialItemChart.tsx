import {useLocation, useNavigate} from 'react-router-dom';
import {Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import type {NavState} from "../types";

export default function TrialItemChart() {
    const navigate = useNavigate();
    const location = useLocation();
    const {trial_id, json, file_name, item_name, co_equipped} = (location.state as NavState) || {};
    const handleClick = () => {
        navigate('/', {
            state: {}
        });
    }
    return (
        <div style={{width: '100%', height: 400}}>
            <button onClick={() =>
                navigate('/TrialChart', {
                    state: {
                        trial_id: trial_id,
                        json: json,
                        file_name: file_name
                    }
                })}>
                Back
            </button>
            <h2 style={{textAlign: 'center', marginBottom: 10, marginTop: 10}}>
                Trial {trial_id} for {item_name}
            </h2>
            <ResponsiveContainer>
                <BarChart data={co_equipped}>
                    <XAxis dataKey="name"/>
                    <YAxis domain = {[0, 100]}/>
                    <Tooltip/>
                    <Bar
                        dataKey="rate" fill="#8884d8"
                        onClick={() => handleClick()}/>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
