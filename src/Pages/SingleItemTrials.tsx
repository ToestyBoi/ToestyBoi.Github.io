import {useLocation, useNavigate} from 'react-router-dom';
import {Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import type {NavState, TierStat} from "../types";

interface FloorRate {
    floor: number;
    rate: number;
}

export default function SingleItemTrials() {
    const navigate = useNavigate();
    const location = useLocation();
    const {json, file_name, item_name} = (location.state as NavState) || {};
    const ItemData = json?.items_by_trial ?? {};
    const winrates: Record<string, number[]> = {};
    const itemTiersPerFloor: Record<string, TierStat[][]> = {};
    Object.values(ItemData).forEach(array => {
        array.forEach(item => {
            if (!winrates[item.name]) {
                winrates[item.name] = [];
            }

            winrates[item.name].push(item.win_rate);
        });
    });

    Object.values(ItemData).forEach(array => {
        array.forEach(item => {
            if (!itemTiersPerFloor[item.name]) {
                itemTiersPerFloor[item.name] = [];
            }

            itemTiersPerFloor[item.name].push(item.tiers);
        });
    });
    const temp1 = itemTiersPerFloor[item_name ?? ""] ?? [];
    const tierData: Record<number, FloorRate[]> = {};

    Object.entries(temp1).forEach(([floor, tiers]) => {
        tiers.forEach(tierInfo => {
            const tier = tierInfo.tier;

            if (!tierData[tier]) {
                tierData[tier] = [];
            }

            tierData[tier].push({
                floor: Number(floor),
                rate: tierInfo.rate
            });
        });
    });
    console.log(tierData)
    const temp2 = winrates[item_name ?? ""] ?? [];
    const itemWinRates = temp2.map((winrate, index) => ({
        trial: index + 1,
        winrate
    }));
    const Length = itemWinRates.length;
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
            <h2 style={{textAlign: 'center', marginBottom: 10, marginTop: 10}}>
                Trial win rates for {item_name}
            </h2>
            {Object.entries(tierData).map(([tier, data]) => (
                <div key={tier} style={{ width: "100%", height: 300 }}>
                    <h3>Tier {tier}</h3>

                    <ResponsiveContainer>
                        <BarChart data={data}>
                            <XAxis dataKey="floor" domain = {[1,Length]}/>
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Bar dataKey="rate" fill="#8884d8"/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ))}
        </div>

    );
}
