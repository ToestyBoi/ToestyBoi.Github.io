import type {ClearRateData} from "../types.ts";
import {NavigateFunction} from "react-router-dom";
import type {ChangeEvent} from "react";

export function handleFileUpload(setData: (value: (((prevState: (ClearRateData | null)) => (ClearRateData | null)) | ClearRateData | null)) => void, navigate: NavigateFunction) {
    return async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) return;

        try {
            const text = await file.text();
            const json: ClearRateData = JSON.parse(text);

            setData(json);
            navigate('/AllTrialsChart', {
                state: {
                    json: json,
                    file_name: file.name
                }
            });
        } catch (error) {
            console.error("Invalid JSON file", error);
        }
    };
}