// Shared data model for the lurkers-lab-data trial/item analytics JSON.

export interface TierStat {
    tier: number;
    rate: number;
    rarity?: string;
    clears?: number;
    sims?: number;
}

export interface CoEquipped {
    name: string;
    rate: number;
    clears?: number;
    sims?: number;
}

export interface Item {
    name: string;
    win_rate: number;
    overall_rate?: number;
    delta?: number;
    total_clears?: number;
    total_sims?: number;
    tiers: TierStat[];
    co_equipped: CoEquipped[];
}

export interface Trial {
    trial_id: number;
    clear_rate: number;
    avg_level: number;
    avg_tier: number;
    total_clears: number;
    total_sims: number;
    unique_builds: number;
    [key: string]: unknown;
}

export interface ClearRateData {
    items?: Item[];
    trials?: Trial[];
    items_by_trial?: Record<string, Item[]>;
    [key: string]: unknown;
}

// Shape of the `state` object passed between pages via react-router navigation.
// Dataset (json, file_name) lives in DataContext — only page-specific params go here.
export interface NavState {
    trial_id?: number;
    item_name?: string;
}
