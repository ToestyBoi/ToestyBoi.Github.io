import {useNavigate} from 'react-router-dom';
import {useState} from "react";
import type {ClearRateData} from "../types";
import {handleFileUpload} from "./HandleFileUpload.tsx";


export function Home() {
    const navigate = useNavigate();
    const [, setData] = useState<ClearRateData | null>(null);
    const handleUpload = handleFileUpload(setData, navigate);

    return (
        <div>
            <input
                type="file"
                accept=".json,application/json"
                onChange={handleUpload}
            />
        </div>
    );
}
