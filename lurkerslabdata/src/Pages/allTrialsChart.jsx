import {Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {useLocation, useNavigate} from 'react-router-dom';
import {useState} from "react";

export default function AllTrialsChart() {
    const navigate = useNavigate();
    const location = useLocation();
    const {json, file_name} = location.state || {};
    const [data, setData] = useState(null);
    const [search, setSearch] = useState("");
    const ItemData = json?.items || [];
    const items = ItemData.map(item => item.name);
    const filteredOptions = items.filter(item =>
        item.toLowerCase().includes(search.toLowerCase())
    );

    const trialData = json?.trials || [];
    const handleUpload = async (event) => {
        const file = event.target.files[0];

        if (!file) return;

        try {
            const text = await file.text();
            const json = JSON.parse(text);

            setData(json);
            navigate('/allTrialsChart', {
                state: {
                    json: json,
                    file_name: file.name
                }
            });
        } catch (error) {
            console.error("Invalid JSON file", error);
        }
    };
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
        <div style={{ position: "relative", width: '100%', height: 400}}>
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
                style={{ width: "10%" }}
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
                    {filteredOptions.map(option => (
                        <li
                            key={option}
                            onClick={() => {
                                navigate('/SingleItemTrials', {
                                    state: {
                                        json: json,
                                        file_name: file_name,
                                        item_name: option
                                    }
                                });
                            }}
                            style={{
                                padding: "8px",
                                cursor: "pointer"
                            }}
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            )}
            <h2 style={{ textAlign: 'center', marginBottom: 10, marginTop: 10 }}>
                {file_name}
            </h2>
            <ResponsiveContainer>
                <BarChart data={trialData}>
                    <XAxis dataKey="trial_id" />
                    <YAxis/>
                    <Tooltip />
                    <Bar
                        dataKey="clear_rate" fill="#8884d8"
                        onClick={(data) => handleClick(data.payload)}/>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}