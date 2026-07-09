import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { CLASS_CATEGORIES, CLASS_COLORS, getClassColor } from '../colors';
import type { Build } from '../types';
import { getTitleWithFilename } from '../utils/getTitleWithFilename';

type Mode = 'character' | 'team';
type SortBy = 'class' | 'frequency';

const CELL = 22;
const LABEL_W = 160;
const HEADER_H = 160;

const CLASS_ORDER = ['attack', 'tank', 'support', 'spell', 'utility'];

function getItemClass(name: string): string | null {
    for (const [cls, items] of Object.entries(CLASS_CATEGORIES)) {
        if (items.includes(name)) return cls;
    }
    return null;
}

function heatColor(t: number): string {
    // 0 = light gray, 1 = deep blue
    const r = Math.round(240 - t * 219);
    const g = Math.round(240 - t * 139);
    const b = Math.round(240 - t * 48);
    return `rgb(${r},${g},${b})`;
}

interface PairingData {
    items: string[];
    matrix: number[][];
    appearances: number[];
    totalBuilds: number;
}

function computeMatrix(builds: Build[], mode: Mode, sortBy: SortBy): PairingData {
    const itemSet = new Set<string>();
    for (const build of builds) {
        for (const charItems of build.items) {
            for (const item of charItems) itemSet.add(item.name);
        }
    }

    const appearances = new Map<string, number>();
    const rawMatrix = new Map<string, Map<string, number>>();
    for (const name of itemSet) {
        appearances.set(name, 0);
        rawMatrix.set(name, new Map());
    }

    for (const build of builds) {
        if (mode === 'character') {
            for (const charItems of build.items) {
                for (const item of charItems) {
                    appearances.set(item.name, (appearances.get(item.name) ?? 0) + 1);
                }
                for (let a = 0; a < charItems.length; a++) {
                    for (let b = a + 1; b < charItems.length; b++) {
                        const na = charItems[a].name;
                        const nb = charItems[b].name;
                        rawMatrix.get(na)!.set(nb, (rawMatrix.get(na)!.get(nb) ?? 0) + 1);
                        rawMatrix.get(nb)!.set(na, (rawMatrix.get(nb)!.get(na) ?? 0) + 1);
                    }
                }
            }
        } else {
            const allNames: string[] = [];
            for (const charItems of build.items) {
                for (const item of charItems) allNames.push(item.name);
            }
            for (const name of allNames) {
                appearances.set(name, (appearances.get(name) ?? 0) + 1);
            }
            for (let a = 0; a < allNames.length; a++) {
                for (let b = a + 1; b < allNames.length; b++) {
                    if (allNames[a] === allNames[b]) continue;
                    const na = allNames[a];
                    const nb = allNames[b];
                    rawMatrix.get(na)!.set(nb, (rawMatrix.get(na)!.get(nb) ?? 0) + 1);
                    rawMatrix.get(nb)!.set(na, (rawMatrix.get(nb)!.get(na) ?? 0) + 1);
                }
            }
        }
    }

    const items = [...itemSet].sort((a, b) => {
        if (sortBy === 'class') {
            const ca = getItemClass(a) ?? 'z';
            const cb = getItemClass(b) ?? 'z';
            const oi = CLASS_ORDER.indexOf(ca);
            const oj = CLASS_ORDER.indexOf(cb);
            if (oi !== oj) return oi - oj;
            return a.localeCompare(b);
        }
        return (appearances.get(b) ?? 0) - (appearances.get(a) ?? 0);
    });

    const idx = new Map(items.map((name, i) => [name, i]));
    const n = items.length;
    const matrix = Array.from({ length: n }, () => new Array<number>(n).fill(0));
    const appsArr = items.map(name => appearances.get(name) ?? 0);

    for (let ri = 0; ri < n; ri++) {
        for (const [col, count] of rawMatrix.get(items[ri])!.entries()) {
            const ci = idx.get(col);
            if (ci !== undefined) matrix[ri][ci] = count;
        }
    }

    return { items, matrix, appearances: appsArr, totalBuilds: builds.length };
}

interface TooltipData {
    x: number;
    y: number;
    rowItem: string;
    colItem: string;
    count: number;
    rowApps: number;
    colApps: number;
    isDiag: boolean;
}

const btnStyle = (active: boolean, color?: string): React.CSSProperties => ({
    padding: '3px 12px',
    fontSize: 12,
    border: `1px solid ${color ?? '#ccc'}`,
    borderRadius: 3,
    cursor: 'pointer',
    background: active ? (color ?? '#444') : 'transparent',
    color: active ? '#fff' : (color ?? '#555'),
    fontWeight: active ? 600 : 400,
});

export default function ItemPairingHeatmap() {
    const { file_name, getFilteredTrials } = useData();
    const [mode, setMode] = useState<Mode>('character');
    const [sortBy, setSortBy] = useState<SortBy>('class');
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);

    const allBuilds: Build[] = useMemo(
        () => getFilteredTrials().flatMap(t => t.builds ?? []),
        [getFilteredTrials]
    );

    const { items, matrix, appearances, totalBuilds } = useMemo(
        () => computeMatrix(allBuilds, mode, sortBy),
        [allBuilds, mode, sortBy]
    );

    const maxVal = useMemo(
        () => matrix.reduce((m, row) => Math.max(m, ...row), 1),
        [matrix]
    );

    const onMove = (e: React.MouseEvent) => {
        setTooltip(prev => prev ? { ...prev, x: e.clientX + 14, y: e.clientY + 14 } : null);
    };

    if (allBuilds.length === 0) {
        return (
            <div style={{ textAlign: 'center', marginTop: 60, color: '#888' }}>
                No builds data — upload a data file from Home.
            </div>
        );
    }

    const n = items.length;

    return (
        <div style={{ width: '100%', padding: '0 16px 24px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: 4, marginTop: 10 }}>{getTitleWithFilename('Item Co-Occurrence Heatmap', file_name)}</h2>
            <p style={{ textAlign: 'center', margin: '0 0 10px', color: '#888', fontSize: 13 }}>
                How often items are paired together · {totalBuilds.toLocaleString()} builds across all trials · hover for details
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#666' }}>Scope:</span>
                    <button style={btnStyle(mode === 'character')} onClick={() => setMode('character')}>
                        Per Character
                    </button>
                    <button style={btnStyle(mode === 'team')} onClick={() => setMode('team')}>
                        Per Team
                    </button>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#666' }}>Sort:</span>
                    <button style={btnStyle(sortBy === 'class')} onClick={() => setSortBy('class')}>
                        By Class
                    </button>
                    <button style={btnStyle(sortBy === 'frequency')} onClick={() => setSortBy('frequency')}>
                        By Frequency
                    </button>
                </div>
            </div>

            {/* Color scale legend */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 12, color: '#666' }}>
                <span>0</span>
                <div style={{
                    width: 120,
                    height: 12,
                    background: `linear-gradient(to right, ${heatColor(0)}, ${heatColor(0.5)}, ${heatColor(1)})`,
                    borderRadius: 2,
                    border: '1px solid #ccc',
                }} />
                <span>{maxVal.toLocaleString()} co-occurrences</span>
            </div>

            {/* Class legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 12, fontSize: 11 }}>
                {CLASS_ORDER.map(cls => (
                    <span key={cls} style={{ color: CLASS_COLORS[cls] }}>■ {cls}</span>
                ))}
                <span style={{ color: '#999' }}>■ other</span>
            </div>

            <div style={{ overflowX: 'auto', overflowY: 'auto' }}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `${LABEL_W}px repeat(${n}, ${CELL}px)`,
                        width: LABEL_W + n * CELL,
                    }}
                    onMouseMove={onMove}
                >
                    {/* Corner */}
                    <div style={{ height: HEADER_H, position: 'sticky', left: 0, zIndex: 2, background: 'var(--bg, #fff)' }} />

                    {/* Column headers */}
                    {items.map((name) => (
                        <div
                            key={name}
                            style={{
                                height: HEADER_H,
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                paddingBottom: 4,
                                fontSize: 11,
                                color: getClassColor(name),
                                writingMode: 'vertical-rl',
                                transform: 'rotate(180deg)',
                                userSelect: 'none',
                            }}
                        >
                            {name}
                        </div>
                    ))}

                    {/* Rows */}
                    {items.map((rowItem, ri) => (
                        <React.Fragment key={rowItem}>
                            <div
                                style={{
                                    height: CELL,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    paddingRight: 6,
                                    fontSize: 11,
                                    color: getClassColor(rowItem),
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 1,
                                    background: 'var(--bg, #fff)',
                                    boxSizing: 'border-box',
                                }}
                            >
                                {rowItem}
                            </div>

                            {items.map((colItem, ci) => {
                                const isDiag = ri === ci;
                                const count = matrix[ri][ci];
                                const normalized = isDiag ? 0 : count / maxVal;
                                const bg = isDiag ? '#d8d8d8' : heatColor(normalized);
                                return (
                                    <div
                                        key={colItem}
                                        style={{
                                            width: CELL,
                                            height: CELL,
                                            background: bg,
                                            border: '1px solid rgba(0,0,0,0.08)',
                                            boxSizing: 'border-box',
                                            cursor: isDiag ? 'default' : 'crosshair',
                                        }}
                                        onMouseEnter={(e) => setTooltip({
                                            x: e.clientX + 14,
                                            y: e.clientY + 14,
                                            rowItem,
                                            colItem,
                                            count: isDiag ? appearances[ri] : count,
                                            rowApps: appearances[ri],
                                            colApps: appearances[ci],
                                            isDiag,
                                        })}
                                        onMouseLeave={() => setTooltip(null)}
                                    />
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>

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
                    minWidth: 200,
                }}>
                    {tooltip.isDiag ? (
                        <>
                            <div style={{ fontWeight: 'bold', color: getClassColor(tooltip.rowItem), marginBottom: 4 }}>
                                {tooltip.rowItem}
                            </div>
                            <div style={{ color: '#555' }}>
                                Appears in {tooltip.count.toLocaleString()} {mode === 'character' ? 'character slots' : 'builds'}
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ fontWeight: 'bold', marginBottom: 6 }}>
                                <span style={{ color: getClassColor(tooltip.rowItem) }}>{tooltip.rowItem}</span>
                                <span style={{ color: '#888' }}> + </span>
                                <span style={{ color: getClassColor(tooltip.colItem) }}>{tooltip.colItem}</span>
                            </div>
                            <div style={{ marginBottom: 4 }}>Co-occurrences: <strong>{tooltip.count.toLocaleString()}</strong></div>
                            {tooltip.rowApps > 0 && (
                                <div style={{ color: '#666', fontSize: 12 }}>
                                    {tooltip.rowItem}: {((tooltip.count / tooltip.rowApps) * 100).toFixed(1)}% of appearances include {tooltip.colItem}
                                </div>
                            )}
                            {tooltip.colApps > 0 && tooltip.rowItem !== tooltip.colItem && (
                                <div style={{ color: '#666', fontSize: 12 }}>
                                    {tooltip.colItem}: {((tooltip.count / tooltip.colApps) * 100).toFixed(1)}% of appearances include {tooltip.rowItem}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
