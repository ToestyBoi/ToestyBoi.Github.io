import {createContext, useContext, useState, useMemo} from 'react';
import type {ReactNode} from 'react';
import type {ClearRateData, Trial, Item} from '../types';

interface DataContextValue {
    json: ClearRateData | null;
    file_name: string | null;
    minTrial: number | null;
    maxTrial: number | null;
    setJson: (json: ClearRateData | null) => void;
    setFileName: (name: string | null) => void;
    setTrialRange: (min: number | null, max: number | null) => void;
    getFilteredTrials: () => Trial[];
    getFilteredItemsByTrial: (trialId: number) => Item[];
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({children}: { children: ReactNode }) {
    const [json, setJson] = useState<ClearRateData | null>(null);
    const [file_name, setFileName] = useState<string | null>(null);
    const [minTrial, setMinTrial] = useState<number | null>(null);
    const [maxTrial, setMaxTrial] = useState<number | null>(null);

    const setTrialRange = (min: number | null, max: number | null) => {
        setMinTrial(min);
        setMaxTrial(max);
    };

    const getFilteredTrials = useMemo(
        () => () => {
            if (!json?.trials) return [];
            return json.trials.filter(t => {
                if (minTrial != null && t.trial_id < minTrial) return false;
                if (maxTrial != null && t.trial_id > maxTrial) return false;
                return true;
            });
        },
        [json?.trials, minTrial, maxTrial]
    );

    const getFilteredItemsByTrial = useMemo(
        () => (trialId: number) => {
            if (!json?.items_by_trial) return [];
            const items = json.items_by_trial[String(trialId)];
            return items || [];
        },
        [json?.items_by_trial]
    );

    return (
        <DataContext.Provider value={{
            json,
            file_name,
            minTrial,
            maxTrial,
            setJson,
            setFileName,
            setTrialRange,
            getFilteredTrials,
            getFilteredItemsByTrial,
        }}>
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
