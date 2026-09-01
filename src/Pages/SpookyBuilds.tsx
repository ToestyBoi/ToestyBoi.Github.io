import { useMemo, useState } from 'react';
import spookyBuilds from '../spooky-data/spooky-builds.json';
import type { PartyBuildRecord } from '../types';
import { getRarityColor, getClassColor } from '../colors';

type SortColumn = 'season' | 'trial_id' | 'attempts' | 'avg_level' | 'avg_tier';
type SortDir = 'asc' | 'desc';

const ALL_SEASONS = Array.from(new Set((spookyBuilds as PartyBuildRecord[]).map(b => b.season))).sort();

export default function SpookyBuilds() {
    const [sortColumn, setSortColumn] = useState<SortColumn>('season');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [selectedSeasons, setSelectedSeasons] = useState<Set<string>>(new Set(ALL_SEASONS));
    const [minLevel, setMinLevel] = useState<string>('');
    const [maxLevel, setMaxLevel] = useState<string>('');
    const [minAttempts, setMinAttempts] = useState<string>('');
    const [maxAttempts, setMaxAttempts] = useState<string>('');
    const [buildFilter, setBuildFilter] = useState<string>('');

    const toggleSeason = (season: string) => {
        const newSet = new Set(selectedSeasons);
        if (newSet.has(season)) {
            newSet.delete(season);
        } else {
            newSet.add(season);
        }
        setSelectedSeasons(newSet);
    };

    const handleSort = (col: SortColumn) => {
        if (sortColumn === col) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(col);
            setSortDir('asc');
        }
    };

    const filtered = useMemo(() => {
        let rows = (spookyBuilds as PartyBuildRecord[]).slice();

        if (selectedSeasons.size > 0 && selectedSeasons.size < ALL_SEASONS.length) {
            rows = rows.filter(r => selectedSeasons.has(r.season));
        }

        if (minLevel) {
            const min = parseInt(minLevel, 10);
            if (!isNaN(min)) rows = rows.filter(r => r.avg_level >= min);
        }
        if (maxLevel) {
            const max = parseInt(maxLevel, 10);
            if (!isNaN(max)) rows = rows.filter(r => r.avg_level <= max);
        }

        if (minAttempts) {
            const min = parseInt(minAttempts, 10);
            if (!isNaN(min)) rows = rows.filter(r => (r.attempts ?? 0) >= min);
        }
        if (maxAttempts) {
            const max = parseInt(maxAttempts, 10);
            if (!isNaN(max)) rows = rows.filter(r => (r.attempts ?? 0) <= max);
        }

        if (buildFilter) {
            const lowerFilter = buildFilter.toLowerCase();
            rows = rows.filter(r => {
                return r.items.some(slot =>
                    slot.some(item => item.name.toLowerCase().includes(lowerFilter))
                );
            });
        }

        rows.sort((a, b) => {
            let cmp = 0;
            if (sortColumn === 'season') {
                cmp = a.season.localeCompare(b.season);
                if (cmp === 0) {
                    // Secondary sort by trial_id ascending
                    cmp = a.trial_id - b.trial_id;
                }
            } else if (sortColumn === 'trial_id') {
                cmp = a.trial_id - b.trial_id;
            } else if (sortColumn === 'attempts') {
                cmp = (a.attempts ?? 0) - (b.attempts ?? 0);
            } else if (sortColumn === 'avg_level') {
                cmp = a.avg_level - b.avg_level;
            } else if (sortColumn === 'avg_tier') {
                cmp = a.avg_tier - b.avg_tier;
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });

        return rows;
    }, [sortColumn, sortDir, selectedSeasons, minLevel, maxLevel, minAttempts, maxAttempts, buildFilter]);

    const SortArrow = ({col}: {col: SortColumn}) => {
        if (sortColumn !== col) return null;
        return <span style={{marginLeft: 4}}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
    };

    const headerStyle = {
        padding: '12px 16px',
        textAlign: 'left' as const,
        fontWeight: 600,
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        userSelect: 'none' as const,
        backgroundColor: '#333333',
        color: '#ffffff',
        fontSize: 14,
    };

    const cellStyle = {
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        fontSize: 13,
    };

    const inputStyle = {
        width: 70,
        padding: '6px 8px',
        fontSize: 13,
        border: '1px solid var(--border)',
        borderRadius: 3,
    };

    if (filtered.length === 0 && spookyBuilds.length === 0) {
        return (
            <div style={{ textAlign: 'center', marginTop: 60, color: '#888', fontSize: 15 }}>
                <h2>Spooky Builds</h2>
                No data available — run the extraction script to populate spooky-builds.json.
            </div>
        );
    }

    return (
        <div style={{ padding: '16px' }}>
            <h2>Spooky Builds</h2>

            <div style={{ marginBottom: 16, padding: 16, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 4 }}>
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-h)' }}>Season:</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {ALL_SEASONS.map(season => (
                            <button
                                key={season}
                                onClick={() => toggleSeason(season)}
                                style={{
                                    padding: '6px 14px',
                                    fontSize: 13,
                                    border: selectedSeasons.has(season) ? '2px solid #4caf50' : '1px solid var(--border)',
                                    borderRadius: 3,
                                    cursor: 'pointer',
                                    backgroundColor: selectedSeasons.has(season) ? '#e8f5e9' : 'var(--bg, #fff)',
                                    color: 'var(--text)',
                                    fontWeight: selectedSeasons.has(season) ? 600 : 400,
                                }}
                            >
                                {season}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--text-h)' }}>
                            Avg Level
                        </label>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <input
                                type="number"
                                min="0"
                                value={minLevel}
                                onChange={(e) => setMinLevel(e.target.value)}
                                placeholder="Min"
                                style={{...inputStyle as any, flex: 1}}
                            />
                            <input
                                type="number"
                                min="0"
                                value={maxLevel}
                                onChange={(e) => setMaxLevel(e.target.value)}
                                placeholder="Max"
                                style={{...inputStyle as any, flex: 1}}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--text-h)' }}>
                            Attempts
                        </label>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <input
                                type="number"
                                min="0"
                                value={minAttempts}
                                onChange={(e) => setMinAttempts(e.target.value)}
                                placeholder="Min"
                                style={{...inputStyle as any, flex: 1}}
                            />
                            <input
                                type="number"
                                min="0"
                                value={maxAttempts}
                                onChange={(e) => setMaxAttempts(e.target.value)}
                                placeholder="Max"
                                style={{...inputStyle as any, flex: 1}}
                            />
                        </div>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--text-h)' }}>
                            Build Item (substring):
                        </label>
                        <input
                            type="text"
                            value={buildFilter}
                            onChange={(e) => setBuildFilter(e.target.value)}
                            placeholder="e.g., 'Void', 'Arcane'"
                            style={{...inputStyle as any, width: '100%'}}
                        />
                    </div>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: 40, color: '#888', fontSize: 15 }}>
                    No builds match the current filters.
                </div>
            ) : (
                <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 400px)' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: 15,
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                    }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr style={{ backgroundColor: '#333333', color: '#ffffff' }}>
                                <th style={headerStyle} onClick={() => handleSort('season')}>
                                    Season <SortArrow col="season" />
                                </th>
                                <th style={headerStyle} onClick={() => handleSort('trial_id')}>
                                    Trial <SortArrow col="trial_id" />
                                </th>
                                <th style={headerStyle} onClick={() => handleSort('attempts')}>
                                    Attempts <SortArrow col="attempts" />
                                </th>
                                <th style={headerStyle} onClick={() => handleSort('avg_level')}>
                                    Avg Level <SortArrow col="avg_level" />
                                </th>
                                <th style={headerStyle} onClick={() => handleSort('avg_tier')}>
                                    Avg Tier <SortArrow col="avg_tier" />
                                </th>
                                <th style={headerStyle}>Party, Stats & Items</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row, idx) => (
                                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.15)', color: 'var(--text)' }}>
                                    <td style={cellStyle}>{row.season}</td>
                                    <td style={cellStyle}>{row.trial_id}</td>
                                    <td style={cellStyle}>{row.attempts ?? '—'}</td>
                                    <td style={cellStyle}>{row.avg_level}</td>
                                    <td style={cellStyle}>{row.avg_tier.toFixed(2)}</td>
                                    <td style={{...cellStyle, maxWidth: 700, overflowX: 'auto', padding: 0}}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                            {(row.party || []).map((member, memberIdx) => (
                                                <div key={memberIdx} style={{
                                                    padding: '12px 16px',
                                                    borderBottom: memberIdx < (row.party?.length ?? 1) - 1 ? '1px solid var(--border)' : 'none',
                                                    display: 'grid',
                                                    gridTemplateColumns: '140px 1fr',
                                                    gap: 16,
                                                    alignItems: 'start',
                                                }}>
                                                    {/* Player info */}
                                                    <div style={{ fontSize: 13 }}>
                                                        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                                                            {member.name === 'Spooky' ? <strong style={{ color: '#4caf50' }}>{member.name}</strong> : member.name}
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, fontSize: 12, color: 'var(--text-h, #666)' }}>
                                                            <div>HP: {member.hp}</div>
                                                            <div>STR: {member.str_}</div>
                                                            <div>DEX: {member.dex}</div>
                                                            <div>INT: {member.int}</div>
                                                        </div>
                                                    </div>

                                                    {/* Player's items */}
                                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                                        {(row.items[memberIdx] || []).map((item, itemIdx) => (
                                                            <div
                                                                key={itemIdx}
                                                                style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    padding: '6px 8px',
                                                                    backgroundColor: getClassColor(item.name),
                                                                    color: '#fff',
                                                                    borderRadius: 3,
                                                                    fontSize: 12,
                                                                    fontWeight: 500,
                                                                    border: `2px solid ${getRarityColor(item.rarity)}`,
                                                                    minWidth: 'fit-content',
                                                                    textAlign: 'center',
                                                                }}
                                                                title={`${item.name} - Tier ${item.tier}, ${item.rarity}`}
                                                            >
                                                                <div style={{ fontSize: 11, lineHeight: 1.2, fontWeight: 600 }}>{item.name}</div>
                                                                <div style={{ fontSize: 10, opacity: 0.9, lineHeight: 1 }}>T{item.tier} {item.rarity}</div>
                                                            </div>
                                                        ))}
                                                        {(row.items[memberIdx]?.length ?? 0) === 0 && (
                                                            <span style={{ fontSize: 12, color: 'var(--text-h, #999)', fontStyle: 'italic' }}>no items</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
