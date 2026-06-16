import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ClearRateData } from '../types';
import { useData } from '../context/DataContext';

export function useFileUpload() {
    const { setJson, setFileName } = useData();
    const navigate = useNavigate();

    return async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const json: ClearRateData = JSON.parse(text);
            setJson(json);
            setFileName(file.name);
            navigate('/AllTrialsChart');
        } catch (error) {
            console.error("Invalid JSON file", error);
        }
    };
}
