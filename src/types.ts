// Shared data model for the lurkers-lab-data trial/item analytics JSON.

export interface TierStat {
    tier: number;
    rate: number;
    rarity: string;
    clears: number;
    sims: number;
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
}

export interface BuildItem {
    name: string;
    rarity: string;
    tier: number;
}

export interface Build {
    items: BuildItem[][];
    clear_rate: number;
    clears: number;
    avg_tier: number;
    avg_level: number;
    max_tier: number;
    min_tier: number;
    death_waves: Record<string, number>;
}

export interface DeathWave {
    wave: number;
    reached: number;
    deaths: number;
    conditional: number;
    share: number;
}

export interface Trial {
    trial_id: number;
    clear_rate: number;
    avg_level: number;
    avg_tier: number;
    total_clears: number;
    total_sims: number;
    total_losses: number;
    unique_builds: number;
    num_waves: number;
    max_tier: number;
    min_tier: number;
    death_waves: DeathWave[];
    builds?: Build[];
}

export interface ClearRateData {
    items?: Item[];
    trials?: Trial[];
    items_by_trial?: Record<string, Item[]>;
    sims_per_build?: number;
    trials_version?: string;
}

// Shape of the `state` object passed between pages via react-router navigation.
// Dataset (json, file_name) lives in DataContext — only page-specific params go here.
export interface NavState {
    trial_id?: number;
    item_name?: string;
}
