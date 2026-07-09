import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { getClassColor, getRarityColor, RARITY_COLORS, CLASS_CATEGORIES } from '../colors';
import type { Item } from '../types';
import { getTitleWithFilename } from '../utils/getTitleWithFilename';

interface CellData {
    itemName: string;
    trialId: number;
    delta: number;
    winRate: number;
    sims: number | undefined;
    hasData: boolean;
}

interface TooltipState {
    x: number;
    y: number;
    cell: CellData;
}

const isBoss = (id: number) => id % 5 === 0;
const LOW_SIMS = 200;
const CELL_W = 38;
const CELL_H = 24;
const LABEL_W = 172;
const HEADER_H = 54;

const ALL_RARITIES = Object.keys(RARITY_COLORS);

const CLASS_ORDER = Object.keys(CLASS_CATEGORIES);

function getItemClass(name: string): string {
    return CLASS_ORDER.find(cls => CLASS_CATEGORIES[cls].includes(name)) ?? 'zzz';
}

// Maps a delta (pp vs trial avg) to a diverging red→gray→green color. Caps at ±40pp.
function getDeltaColor(delta: number): string {
    const CAP = 40;
    const t = Math.min(1, Math.max(-1, delta / CAP));
    if (t <= 0) {
        const u = 1 + t; // 0=red, 1=neutral
        return `rgb(220,${Math.round(50 + 170 * u)},${Math.round(50 + 170 * u)})`;
    } else {
        const u = t; // 0=neutral, 1=green
        return `rgb(${Math.round(220 - 170 * u)},${Math.round(220 - 40 * u)},${Math.round(220 - 170 * u)})`;
    }
}

// Returns the filtered win rate, delta vs trial avg, and sims for the selected rarities.
// Returns null if the item has no data for those rarities.
function computeCellData(
    item: Item,
    selected: Set<string>,
    trialClearRate: number,
): { rate: number; delta: number; sims: number | undefined } | null {
    if (selected.size === 0) return null;

    if (selected.size === ALL_RARITIES.length) {
        const delta = item.delta ?? (item.win_rate - trialClearRate);
        return { rate: item.win_rate, delta, sims: item.total_sims };
    }

    const matching = item.tiers.filter(t => t.rarity && selected.has(t.rarity));
    if (matching.length === 0) return null;

    const totalSims = matching.reduce((sum, t) => sum + (t.sims ?? 0), 0);
    const totalClears = matching.reduce((sum, t) => sum + (t.clears ?? 0), 0);

    let rate: number;
    let sims: number | undefined;
    if (totalSims > 0) {
        rate = (totalClears / totalSims) * 100;
        sims = totalSims;
    } else {
        rate = matching.reduce((s, t) => s + t.rate, 0) / matching.length;
        sims = undefined;
    }
    return { rate, delta: rate - trialClearRate, sims };
}

const btnStyle = (active: boolean, color?: string): React.CSSProperties => ({
    padding: '3px 10px',
    fontSize: 12,
    border: `1px solid ${color ?? '#ccc'}`,
    borderRadius: 3,
    cursor: 'pointer',
    background: active ? (color ?? '#444') : 'transparent',
    color: active ? '#fff' : (color ?? '#555'),
    fontWeight: active ? 600 : 400,
});

export default function ItemHeatmap() {
    const navigate = useNavigate();
    const { json, file_name } = useData();
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);
    const [selectedRarities, setSelectedRarities] = useState<Set<string>>(new Set(ALL_RARITIES));
    const [sortMode, setSortMode] = useState<'delta' | 'class'>('delta');

    const itemsByTrial = json?.items_by_trial ?? {};
    const globalItems: Item[] = json?.items ?? [];

    const trialIds = Object.keys(itemsByTrial).map(Number).sort((a, b) => a - b);

    const trialClearRateMap = new Map<number, number>();
    for (const trial of (json?.trials ?? [])) {
        trialClearRateMap.set(trial.trial_id, trial.clear_rate * 100);
    }

    const sortedItems = [...globalItems].sort((a, b) => {
        if (sortMode === 'class') {
            const ca = CLASS_ORDER.indexOf(getItemClass(a.name));
            const cb = CLASS_ORDER.indexOf(getItemClass(b.name));
            if (ca !== cb) return ca - cb;
            return a.name.localeCompare(b.name);
        }
        const ra = a.delta ?? -Infinity;
        const rb = b.delta ?? -Infinity;
        return rb - ra;
    });

    const lookup = new Map<number, Map<string, Item>>();
    for (const trialId of trialIds) {
        const map = new Map<string, Item>();
        for (const item of (itemsByTrial[String(trialId)] ?? [])) {
            map.set(item.name, item);
        }
        lookup.set(trialId, map);
    }

    const toggleRarity = (rarity: string) => {
        setSelectedRarities(prev => {
            const next = new Set(prev);
            if (next.has(rarity)) {
                next.delete(rarity);
            } else {
                next.add(rarity);
            }
            return next;
        });
    };

    const handleCellClick = (trialId: number) => {
        navigate('/TrialChart', { state: { trial_id: trialId } });
    };

    const handleLabelClick = (itemName: string) => {
        navigate('/SingleItemTrials', { state: { item_name: itemName } });
    };

    const onMove = (e: React.MouseEvent) => {
        setTooltip(prev => prev ? { ...prev, x: e.clientX + 14, y: e.clientY + 14 } : null);
    };

    if (trialIds.length === 0 || sortedItems.length === 0) {
        return (
            <div style={{ textAlign: 'center', marginTop: 60, color: '#888' }}>
                No data available — upload a data file from Home.
            </div>
        );
    }

    return (
        <div style={{ width: '100%', padding: '0 16px 24px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: 4, marginTop: 10 }}>{getTitleWithFilename('Item × Trial Heatmap', file_name)}</h2>
            <p style={{ textAlign: 'center', margin: '0 0 10px', color: '#888', fontSize: 13 }}>
                Delta vs trial avg per item per trial · sorted by overall delta (top = most OP) · dim = low sample (&lt;{LOW_SIMS} sims)
                · click cell → trial · click name → item detail
            </p>

            {/* Sort mode */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#666' }}>Sort:</span>
                {(['delta', 'class'] as const).map(mode => (
                    <button
                        key={mode}
                        style={btnStyle(sortMode === mode)}
                        onClick={() => setSortMode(mode)}
                    >
                        {mode === 'delta' ? 'By Delta' : 'By Class'}
                    </button>
                ))}
            </div>

            {/* Rarity filter */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
                {ALL_RARITIES.map(rarity => (
                    <button
                        key={rarity}
                        style={btnStyle(selectedRarities.has(rarity), getRarityColor(rarity))}
                        onClick={() => toggleRarity(rarity)}
                    >
                        {rarity}
                    </button>
                ))}
            </div>

            {/* Color scale legend */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 12, color: '#666' }}>
                <span>−40pp</span>
                <div style={{
                    width: 140,
                    height: 12,
                    background: 'linear-gradient(to right, rgb(220,50,50), rgb(220,220,220), rgb(50,180,50))',
                    borderRadius: 2,
                    border: '1px solid #ccc',
                }} />
                <span>+40pp</span>
                <span style={{ marginLeft: 16, color: '#444' }}>■</span>
                <span style={{ color: '#444' }}>not in trial / no data for rarity</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `${LABEL_W}px repeat(${trialIds.length}, ${CELL_W}px)`,
                        width: LABEL_W + trialIds.length * CELL_W,
                    }}
                >
                    {/* Corner cell — sticky so it stays put when scrolling */}
                    <div style={{ height: HEADER_H, position: 'sticky', left: 0, zIndex: 2, background: 'var(--bg, #fff)' }} />

                    {/* Trial ID column headers */}
                    {trialIds.map(id => (
                        <div
                            key={id}
                            style={{
                                height: HEADER_H,
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                paddingBottom: 4,
                                fontSize: 10,
                                color: isBoss(id) ? '#FFD700' : '#555',
                                fontWeight: isBoss(id) ? 'bold' : 'normal',
                                writingMode: 'vertical-rl',
                                transform: 'rotate(180deg)',
                                userSelect: 'none',
                            }}
                        >
                            {isBoss(id) ? `${id}★` : String(id)}
                        </div>
                    ))}

                    {/* Item rows */}
                    {sortedItems.map(item => {
                        const overallDelta = item.delta;
                        return (
                            <React.Fragment key={item.name}>
                                {/* Row label */}
                                <div
                                    onClick={() => handleLabelClick(item.name)}
                                    title={overallDelta != null ? `${item.name} — overall delta ${overallDelta >= 0 ? '+' : ''}${overallDelta.toFixed(1)}pp` : item.name}
                                    style={{
                                        height: CELL_H,
                                        display: 'flex',
                                        alignItems: 'center',
                                        paddingRight: 8,
                                        fontSize: 11,
                                        color: getClassColor(item.name),
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        justifyContent: 'flex-end',
                                        cursor: 'pointer',
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 1,
                                        background: 'var(--bg, #fff)',
                                    }}
                                >
                                    {item.name}
                                </div>

                                {/* Trial cells */}
                                {trialIds.map(trialId => {
                                    const trialItem = lookup.get(trialId)?.get(item.name);
                                    const trialClearRate = trialClearRateMap.get(trialId) ?? 0;
                                    const computed = trialItem ? computeCellData(trialItem, selectedRarities, trialClearRate) : null;
                                    const hasData = computed !== null;
                                    const delta = computed?.delta ?? 0;
                                    const winRate = computed?.rate ?? 0;
                                    const sims = computed?.sims;
                                    const lowSample = hasData && (sims ?? 999) < LOW_SIMS;
                                    return (
                                        <div
                                            key={trialId}
                                            style={{
                                                height: CELL_H,
                                                background: hasData ? getDeltaColor(delta) : '#222',
                                                cursor: hasData ? 'pointer' : 'default',
                                                border: '1px solid rgba(0,0,0,0.2)',
                                                boxSizing: 'border-box',
                                                opacity: lowSample ? 0.45 : 1,
                                            }}
                                            onClick={() => hasData && handleCellClick(trialId)}
                                            onMouseEnter={(e) => setTooltip({
                                                x: e.clientX + 14,
                                                y: e.clientY + 14,
                                                cell: { itemName: item.name, trialId, delta, winRate, sims, hasData },
                                            })}
                                            onMouseMove={onMove}
                                            onMouseLeave={() => setTooltip(null)}
                                        />
                                    );
                                })}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Hover tooltip */}
            {tooltip && (
                <div style={{
                    position: 'fixed',
                    left: tooltip.x,
                    top: tooltip.y,
                    background: '#fff',
                    border: '1px solid #ccc',
                    padding: '8px 12px',
                    fontSize: 13,
                    borderRadius: 4,
                    pointerEvents: 'none',
                    zIndex: 1000,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    minWidth: 160,
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4, color: getClassColor(tooltip.cell.itemName) }}>
                        {tooltip.cell.itemName}
                    </div>
                    <div style={{ color: '#555', marginBottom: 2 }}>
                        Trial {tooltip.cell.trialId}{isBoss(tooltip.cell.trialId) ? ' ★ Boss' : ''}
                    </div>
                    {tooltip.cell.hasData ? (
                        <>
                            <div style={{ color: tooltip.cell.delta >= 0 ? '#4caf50' : '#e57373' }}>
                                Delta: {tooltip.cell.delta >= 0 ? '+' : ''}{tooltip.cell.delta.toFixed(1)}pp vs trial avg
                            </div>
                            <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
                                Win rate: {tooltip.cell.winRate.toFixed(1)}%
                            </div>
                            {tooltip.cell.sims != null && (
                                <div style={{
                                    color: tooltip.cell.sims < LOW_SIMS ? '#e57373' : '#888',
                                    marginTop: 2,
                                    fontSize: 12,
                                }}>
                                    Sims: {tooltip.cell.sims.toLocaleString()}{tooltip.cell.sims < LOW_SIMS ? ' ⚠ low sample' : ''}
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ color: '#888', fontSize: 12 }}>Not available in this trial / rarity</div>
                    )}
                </div>
            )}
        </div>
    );
}
