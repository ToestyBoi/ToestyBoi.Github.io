import {useLocation, useNavigate} from 'react-router-dom';
import {Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {useState} from "react";

export default function SingleItemTrials() {
    const navigate = useNavigate();
    const location = useLocation();
    const {json, file_name, item_name} = location.state || {};
    const ItemData = json?.items_by_trial || [];
    const winrates = {};

    Object.values(ItemData).forEach(array => {
        array.forEach(item => {
            if (!winrates[item.name]) {
                winrates[item.name] = [];
            }

            winrates[item.name].push(item.win_rate);
        });
    });
    const temp = winrates[item_name]
    const itemWinRates = temp.map((winrate, index) => ({
        trial: index + 1,
        winrate
    }))
    console.log(itemWinRates);
    const [onClick] = useState(0);
    const handleClick = (data) => {
        navigate('/', {
            state: {}
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
                Trial win rates for {item_name}
            </h2>
            <ResponsiveContainer>
                <BarChart data={itemWinRates}>
                    <XAxis dataKey="trial"/>
                    <YAxis domain = {[0, 100]}/>
                    <Tooltip/>
                    <Bar
                        dataKey="winrate" fill="#8884d8"
                        onClick={(data) => handleClick(data.payload)}/>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}