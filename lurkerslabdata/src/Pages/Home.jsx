import {useLocation, useNavigate} from 'react-router-dom';
import {useState} from "react";


export function Home() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
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

    return (
        <div>
            <input
                type="file"
                accept=".json,application/json"
                onChange={handleUpload}
            />
            <h1>Home Page</h1>
        </div>
    );
}
