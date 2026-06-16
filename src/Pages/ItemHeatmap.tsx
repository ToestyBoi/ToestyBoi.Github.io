import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { getClassColor, getRarityColor, getRgbBarColor, RARITY_COLORS } from '../colors';
import type { Item } from '../types';

interface CellData {
    itemName: string;
    trialId: number;
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

// Returns the win rate and sims for an item filtered to the selected rarities.
// Returns null if the item has no data for those rarities.
function computeCellRate(item: Item, selected: Set<string>): { rate: number; sims: number | undefined } | null {
    if (selected.size === 0) return null;
    if (selected.size === ALL_RARITIES.length) {
        return { rate: item.win_rate, sims: item.total_sims };
    }

    const matching = item.tiers.filter(t => t.rarity && selected.has(t.rarity));
    if (matching.length === 0) return null;

    const totalSims = matching.reduce((sum, t) => sum + (t.sims ?? 0), 0);
    const totalClears = matching.reduce((sum, t) => sum + (t.clears ?? 0), 0);

    if (totalSims > 0) {
        return { rate: (totalClears / totalSims) * 100, sims: totalSims };
    }
    // No sims data — fall back to simple average of rates
    return { rate: matching.reduce((s, t) => s + t.rate, 0) / matching.length, sims: undefined };
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
    const { json } = useData();
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);
    const [selectedRarities, setSelectedRarities] = useState<Set<string>>(new Set(ALL_RARITIES));

    const itemsByTrial = json?.items_by_trial ?? {};
    const globalItems: Item[] = json?.items ?? [];

    const trialIds = Object.keys(itemsByTrial).map(Number).sort((a, b) => a - b);

    const sortedItems = [...globalItems].sort((a, b) => {
        const ra = a.overall_rate ?? a.win_rate;
        const rb = b.overall_rate ?? b.win_rate;
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
            <h2 style={{ textAlign: 'center', marginBottom: 4, marginTop: 10 }}>Item × Trial Heatmap</h2>
            <p style={{ textAlign: 'center', margin: '0 0 10px', color: '#888', fontSize: 13 }}>
                Win rate per item per trial · sorted by overall win rate (top = highest) · dim = low sample (&lt;{LOW_SIMS} sims)
                · click cell → trial · click name → item detail
            </p>

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
                <span>0%</span>
                <div style={{
                    width: 140,
                    height: 12,
                    background: 'linear-gradient(to right, rgb(255,0,0), rgb(160,80,0), rgb(0,180,0))',
                    borderRadius: 2,
                    border: '1px solid #ccc',
                }} />
                <span>100%</span>
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
                        const overallRate = item.overall_rate ?? item.win_rate;
                        return (
                            <React.Fragment key={item.name}>
                                {/* Row label */}
                                <div
                                    onClick={() => handleLabelClick(item.name)}
                                    title={`${item.name} — overall ${overallRate.toFixed(1)}%`}
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
                                    const computed = trialItem ? computeCellRate(trialItem, selectedRarities) : null;
                                    const hasData = computed !== null;
                                    const winRate = computed?.rate ?? 0;
                                    const sims = computed?.sims;
                                    const lowSample = hasData && (sims ?? 999) < LOW_SIMS;
                                    return (
                                        <div
                                            key={trialId}
                                            style={{
                                                height: CELL_H,
                                                background: hasData ? getRgbBarColor(winRate / 100) : '#222',
                                                cursor: hasData ? 'pointer' : 'default',
                                                border: '1px solid rgba(0,0,0,0.2)',
                                                boxSizing: 'border-box',
                                                opacity: lowSample ? 0.45 : 1,
                                            }}
                                            onClick={() => hasData && handleCellClick(trialId)}
                                            onMouseEnter={(e) => setTooltip({
                                                x: e.clientX + 14,
                                                y: e.clientY + 14,
                                                cell: { itemName: item.name, trialId, winRate, sims, hasData },
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
                            <div>Win rate: {tooltip.cell.winRate.toFixed(1)}%</div>
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
