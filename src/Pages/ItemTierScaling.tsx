import {useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import type {NavState, TierStat} from '../types';
import {getRarityColor, RARITY_COLORS} from '../colors';
import {useData} from '../context/DataContext';
import {getTitleWithFilename} from '../utils/getTitleWithFilename';

const RARITY_ORDER = Object.keys(RARITY_COLORS);
const LOW_SAMPLE_SIMS = 200;

interface TierRow {
    tier: number;
    [key: string]: number | undefined;
}

interface TooltipProps {
    active?: boolean;
    payload?: Array<{payload: TierRow}>;
    rarities: string[];
}

const TierScalingTooltip = ({active, payload, rarities}: TooltipProps) => {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return (
        <div style={{background: '#fff', border: '1px solid #ccc', padding: '8px 12px', fontSize: 13, borderRadius: 4}}>
            <div style={{fontWeight: 'bold', marginBottom: 4}}>Tier {row.tier}</div>
            {rarities.map(r => {
                const delta = row[r] as number | undefined;
                const winRate = row[r + '_winrate'] as number | undefined;
                const sims = (row[r + '_sims'] ?? 0) as number;
                if (delta == null) return null;
                const low = sims < LOW_SAMPLE_SIMS;
                return (
                    <div key={r} style={{color: getRarityColor(r)}}>
                        {r}: {delta >= 0 ? '+' : ''}{delta.toFixed(1)}pp
                        {winRate != null && (
                            <span style={{color: '#888', marginLeft: 6, fontSize: 11}}>({winRate.toFixed(1)}% win)</span>
                        )}
                        <span style={{color: low ? '#e57373' : '#888', marginLeft: 6, fontSize: 11}}>
                            {sims} sims{low ? ' ⚠' : ''}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

const makeDot = (color: string, simsKey: string) => (props: {cx?: number; cy?: number; payload?: TierRow}) => {
    const {cx, cy, payload} = props;
    const sims = (payload?.[simsKey] as number) ?? 0;
    if (!sims || cx == null || cy == null) return <g/>;
    const opacity = sims >= 500 ? 1 : sims >= LOW_SAMPLE_SIMS ? 0.65 : 0.35;
    return <circle cx={cx} cy={cy} r={5} fill={color} fillOpacity={opacity} stroke="white" strokeWidth={1}/>;
};

const makeActiveDot = (color: string) => (props: {cx?: number; cy?: number}) => {
    const {cx, cy} = props;
    if (cx == null || cy == null) return <g/>;
    return <circle cx={cx} cy={cy} r={7} fill={color} stroke="white" strokeWidth={2}/>;
};

const isBoss = (id: number) => id % 5 === 0;

export default function ItemTierScaling() {
    const navigate = useNavigate();
    const location = useLocation();
    const {json, file_name, getFilteredTrials} = useData();
    const {item_name: stateItemName, trial_id: stateTrialId} = (location.state as NavState) || {};

    const allItems = (json?.items ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
    const [selectedName, setSelectedName] = useState<string>(stateItemName ?? allItems[0]?.name ?? '');
    const [selectedTrialId, setSelectedTrialId] = useState<number | 'all'>(stateTrialId ?? 'all');
    const item_name = selectedName || stateItemName;

    const globalItem = json?.items?.find(i => i.name === item_name);

    const filteredTrials = getFilteredTrials();
    const allTrialIds = Object.keys(json?.items_by_trial ?? {}).map(Number).filter(id => filteredTrials.some(t => t.trial_id === id)).sort((a, b) => a - b);

    const trialClearRateMap = new Map<number, number>();
    for (const trial of filteredTrials) {
        trialClearRateMap.set(trial.trial_id, trial.clear_rate * 100);
    }

    let baselineClearRate: number;
    let activeTiers: TierStat[];

    if (selectedTrialId === 'all') {
        baselineClearRate = filteredTrials.length > 0
            ? filteredTrials.reduce((sum, t) => sum + t.clear_rate * 100, 0) / filteredTrials.length
            : 0;
        activeTiers = globalItem?.tiers ?? [];
    } else {
        baselineClearRate = trialClearRateMap.get(selectedTrialId) ?? 0;
        const trialItem = (json?.items_by_trial?.[String(selectedTrialId)] ?? []).find(i => i.name === item_name);
        activeTiers = trialItem?.tiers ?? [];
    }

    const tierMap = new Map<number, TierRow>();
    const rarities = new Set<string>();

    for (const t of activeTiers) {
        if (!t.rarity || !(t.sims ?? 0)) continue;
        rarities.add(t.rarity);
        const row = tierMap.get(t.tier) ?? {tier: t.tier};
        const clears = t.clears ?? 0;
        const sims = t.sims!;
        const winRate = (clears / sims) * 100;
        row[t.rarity] = winRate - baselineClearRate;
        row[t.rarity + '_winrate'] = winRate;
        row[t.rarity + '_sims'] = sims;
        tierMap.set(t.tier, row);
    }

    const chartData = Array.from(tierMap.values()).sort((a, b) => a.tier - b.tier);

    const sortedRarities = Array.from(rarities).sort((a, b) => {
        const iA = RARITY_ORDER.indexOf(a);
        const iB = RARITY_ORDER.indexOf(b);
        if (iA === -1 && iB === -1) return a.localeCompare(b);
        if (iA === -1) return 1;
        if (iB === -1) return -1;
        return iA - iB;
    });

    const overallDelta = globalItem?.delta;

    return (
        <div style={{width: '100%'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0 10px'}}>
                {stateTrialId != null && (
                    <button onClick={() => navigate('/SingleItemTrials', {state: {item_name, trial_id: stateTrialId}})}>← Back</button>
                )}
            </div>
            <div style={{display: 'flex', justifyContent: 'center', gap: 12, margin: '12px 0 4px'}}>
                <select
                    value={selectedName}
                    onChange={e => setSelectedName(e.target.value)}
                    style={{fontSize: 15, padding: '4px 8px', minWidth: 200}}
                >
                    {allItems.map(item => (
                        <option key={item.name} value={item.name}>{item.name}</option>
                    ))}
                </select>
                <select
                    value={selectedTrialId === 'all' ? 'all' : String(selectedTrialId)}
                    onChange={e => setSelectedTrialId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    style={{fontSize: 15, padding: '4px 8px'}}
                >
                    <option value="all">All Trials</option>
                    {allTrialIds.map(id => (
                        <option key={id} value={String(id)}>Trial {id}{isBoss(id) ? ' ★' : ''}</option>
                    ))}
                </select>
            </div>
            <h2 style={{textAlign: 'center', marginBottom: 4, marginTop: 6}}>{getTitleWithFilename(`${item_name} — Tier Scaling`, file_name)}</h2>
            <p style={{textAlign: 'center', margin: '0 0 4px', fontSize: 13, color: '#555'}}>
                {selectedTrialId === 'all'
                    ? `Baseline: avg trial clear rate (${baselineClearRate.toFixed(1)}%)`
                    : `Baseline: Trial ${selectedTrialId} clear rate (${baselineClearRate.toFixed(1)}%)`}
                {overallDelta != null && (
                    <span style={{color: overallDelta >= 0 ? '#4caf50' : '#e57373', marginLeft: 8}}>
                        · overall delta {overallDelta >= 0 ? '+' : ''}{overallDelta.toFixed(1)}pp
                    </span>
                )}
            </p>
            <p style={{textAlign: 'center', margin: '0 0 12px', fontSize: 12, color: '#888'}}>
                dot opacity ∝ sample size · dashed line = item's overall delta (all trials)
            </p>
            {chartData.length === 0 ? (
                <p style={{textAlign: 'center', color: '#888', marginTop: 40}}>
                    No tier/rarity data available for this item{selectedTrialId !== 'all' ? ' in this trial' : ''}.
                </p>
            ) : (
                <ResponsiveContainer height={480}>
                    <ComposedChart data={chartData} margin={{top: 10, right: 80, left: 50, bottom: 20}}>
                        <XAxis
                            dataKey="tier"
                            tickFormatter={(v) => `T${v}`}
                            label={{value: 'Tier', position: 'insideBottom', offset: -10, fontSize: 12, fill: '#666'}}
                        />
                        <YAxis
                            domain={[(min: number) => Math.min(min, 0) - 5, (max: number) => Math.max(max, 0) + 5]}
                            tickFormatter={(v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}pp`}
                            label={{value: 'Delta vs Trial Avg', angle: -90, position: 'insideLeft', offset: -30, fontSize: 12, fill: '#666'}}
                        />
                        <Tooltip content={(props) => (
                            <TierScalingTooltip
                                active={props.active}
                                payload={props.payload as unknown as Array<{payload: TierRow}>}
                                rarities={sortedRarities}
                            />
                        )}/>
                        <ReferenceLine
                            y={0}
                            stroke="#aaa"
                            strokeDasharray="4 3"
                            label={{value: 'trial avg', position: 'right', fontSize: 11, fill: '#aaa'}}
                        />
                        {overallDelta != null && selectedTrialId === 'all' && (
                            <ReferenceLine
                                y={overallDelta}
                                stroke="#999"
                                strokeDasharray="4 3"
                                label={{value: `overall ${overallDelta >= 0 ? '+' : ''}${overallDelta.toFixed(1)}pp`, position: 'right', fontSize: 11, fill: '#999'}}
                            />
                        )}
                        {sortedRarities.map(r => (
                            <Line
                                key={r}
                                dataKey={r}
                                name={r}
                                stroke={getRarityColor(r)}
                                strokeWidth={2}
                                connectNulls={false}
                                dot={makeDot(getRarityColor(r), r + '_sims')}
                                activeDot={makeActiveDot(getRarityColor(r))}
                                isAnimationActive={false}
                            />
                        ))}
                    </ComposedChart>
                </ResponsiveContainer>
            )}
            <div style={{textAlign: 'center', marginTop: 8, fontSize: 13}}>
                {sortedRarities.map(r => (
                    <span key={r} style={{color: getRarityColor(r), marginRight: 16}}>
                        ● {r}
                    </span>
                ))}
            </div>
        </div>
    );
}
