import {createContext, useContext, useState} from 'react';
import type {ReactNode} from 'react';
import type {ClearRateData} from '../types';

interface DataContextValue {
    json: ClearRateData | null;
    file_name: string | null;
    setJson: (json: ClearRateData | null) => void;
    setFileName: (name: string | null) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({children}: { children: ReactNode }) {
    const [json, setJson] = useState<ClearRateData | null>(null);
    const [file_name, setFileName] = useState<string | null>(null);
    return (
        <DataContext.Provider value={{json, file_name, setJson, setFileName}}>
            {children}
        </DataContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData(): DataContextValue {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error('useData must be used inside DataProvider');
    return ctx;
}
