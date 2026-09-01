import { useMemo, useState } from 'react';
import spookyBuilds from '../spooky-data/spooky-builds.json';
import type { PartyBuildRecord } from '../types';
import { getRarityColor, getClassColor } from '../colors';

type SortColumn = 'season' | 'trial_id' | 'attempts';
type SortDir = 'asc' | 'desc';

const ALL_SEASONS = Array.from(new Set((spookyBuilds as PartyBuildRecord[]).map(b => b.season))).sort();

// Stat colors for character stats display
const STAT_COLORS = {
    hp: '#e8a13c',
    str: '#e94560',
    dex: '#4ecca3',
    int: '#4ea8de',
} as const;

const SortArrow = ({ col, sortColumn, sortDir }: { col: SortColumn; sortColumn: SortColumn; sortDir: SortDir }) => {
    if (sortColumn !== col) return null;
    return <span style={{marginLeft: 4}}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
};

const createStyles = () => ({
    container: {
        padding: '16px',
    } as React.CSSProperties,

    header: {
        fontSize: 20,
        fontWeight: 600,
        marginBottom: 16,
    } as React.CSSProperties,

    filterSection: {
        marginBottom: 16,
        padding: 16,
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 4,
    } as React.CSSProperties,

    filterLabel: {
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 8,
        color: 'var(--text-h)',
    } as React.CSSProperties,

    seasonButtonsContainer: {
        display: 'flex' as const,
        gap: 6,
        flexWrap: 'wrap' as const,
        marginBottom: 16,
    },

    seasonButton: (isSelected: boolean) => ({
        padding: '6px 14px',
        fontSize: 13,
        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
        borderRadius: 3,
        cursor: 'pointer' as const,
        backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg)',
        color: 'var(--text)',
        fontWeight: isSelected ? 600 : 400,
        transition: 'all 0.2s ease',
    } as React.CSSProperties),

    filterGrid: {
        display: 'grid' as const,
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
    },

    filterFieldLabel: {
        fontSize: 13,
        fontWeight: 600,
        display: 'block' as const,
        marginBottom: 6,
        color: 'var(--text-h)',
    } as React.CSSProperties,

    filterFieldInputs: {
        display: 'flex' as const,
        gap: 6,
    },

    input: {
        width: 70,
        padding: '6px 8px',
        fontSize: 13,
        border: '1px solid var(--border)',
        borderRadius: 3,
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
    } as React.CSSProperties,

    inputFull: {
        width: '100%',
        padding: '6px 8px',
        fontSize: 13,
        border: '1px solid var(--border)',
        borderRadius: 3,
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
    } as React.CSSProperties,

    emptyState: {
        textAlign: 'center' as const,
        marginTop: 60,
        color: 'var(--text-h)',
        fontSize: 15,
    } as React.CSSProperties,

    tableContainer: {
        overflowX: 'auto' as const,
        maxHeight: 'calc(100vh - 400px)',
    } as React.CSSProperties,

    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        fontSize: 15,
        border: '1px solid var(--border)',
        borderRadius: 4,
    } as React.CSSProperties,

    tableHead: {
        position: 'sticky' as const,
        top: 0,
        zIndex: 10,
    } as React.CSSProperties,

    tableHeaderRow: {
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text)',
    } as React.CSSProperties,

    tableHeaderCell: {
        padding: '12px 16px',
        textAlign: 'left' as const,
        fontWeight: 600,
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        userSelect: 'none' as const,
        fontSize: 14,
    } as React.CSSProperties,

    tableCell: {
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        fontSize: 13,
        color: 'var(--text)',
    } as React.CSSProperties,

    tableRow: (isEven: boolean) => ({
        backgroundColor: isEven ? 'transparent' : 'var(--bg-row-alt)',
        color: 'var(--text)',
    } as React.CSSProperties),

    memberContainer: (isLastMember: boolean) => ({
        padding: '12px 16px',
        borderBottom: isLastMember ? 'none' : '1px solid var(--border)',
        display: 'flex' as const,
        flexDirection: 'column' as const,
        gap: 8,
    } as React.CSSProperties),

    memberName: {
        fontWeight: 600,
        fontSize: 14,
        textAlign: 'left' as const,
    } as React.CSSProperties,

    statsContainer: {
        display: 'flex' as const,
        gap: 16,
        fontSize: 12,
        color: 'var(--text-h)',
    } as React.CSSProperties,

    statItem: (color: string) => ({
        color: color,
    } as React.CSSProperties),

    soulContainer: {
        fontSize: 11,
        textAlign: 'left' as const,
    } as React.CSSProperties,

    soulLabel: {
        fontWeight: 500,
    } as React.CSSProperties,

    itemsContainer: {
        display: 'flex' as const,
        gap: 6,
        flexWrap: 'wrap' as const,
        alignItems: 'flex-start' as const,
    },

    itemBadge: (rarity: string) => ({
        display: 'flex' as const,
        flexDirection: 'column' as const,
        alignItems: 'center' as const,
        padding: '6px 8px',
        color: '#fff',
        borderRadius: 3,
        fontSize: 12,
        fontWeight: 500,
        border: `3px solid ${rarity}`,
        minWidth: 'fit-content',
        textAlign: 'center' as const,
    } as React.CSSProperties),

    itemName: {
        fontSize: 14,
        lineHeight: 1.2,
        fontWeight: 700,
        color: '#000',
    } as React.CSSProperties,

    itemTier: {
        fontSize: 12,
        opacity: 0.9,
        lineHeight: 1,
        fontWeight: 700,
        color: '#000',
    } as React.CSSProperties,

    noItems: {
        fontSize: 12,
        color: 'var(--text-h)',
        fontStyle: 'italic',
    } as React.CSSProperties,

    noBuilds: {
        textAlign: 'center' as const,
        marginTop: 40,
        color: 'var(--text-h)',
        fontSize: 15,
    } as React.CSSProperties,
});

export default function SpookyBuilds() {
    const [sortColumn, setSortColumn] = useState<SortColumn>('season');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [selectedSeasons, setSelectedSeasons] = useState<Set<string>>(new Set(ALL_SEASONS));
    const [minTrial, setMinTrial] = useState<string>('');
    const [maxTrial, setMaxTrial] = useState<string>('');
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
            setSortDir('desc');
        }
    };

    const filtered = useMemo(() => {
        let rows = (spookyBuilds as PartyBuildRecord[]).slice();

        if (selectedSeasons.size > 0 && selectedSeasons.size < ALL_SEASONS.length) {
            rows = rows.filter(r => selectedSeasons.has(r.season));
        }

        if (minTrial) {
            const min = parseInt(minTrial, 10);
            if (!isNaN(min)) rows = rows.filter(r => r.trial_id >= min);
        }
        if (maxTrial) {
            const max = parseInt(maxTrial, 10);
            if (!isNaN(max)) rows = rows.filter(r => r.trial_id <= max);
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
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });

        return rows;
    }, [sortColumn, sortDir, selectedSeasons, minTrial, maxTrial, buildFilter]);

    const styles = createStyles();

    if (filtered.length === 0 && spookyBuilds.length === 0) {
        return (
            <div style={styles.container}>
                <h2 style={styles.header}>Spooky Builds</h2>
                <div style={styles.emptyState}>
                    No data available — run the extraction script to populate spooky-builds.json.
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>Spooky Builds</h2>

            <div style={styles.filterSection}>
                <div style={{ marginBottom: 16 }}>
                    <div style={styles.filterLabel}>Season:</div>
                    <div style={styles.seasonButtonsContainer}>
                        {ALL_SEASONS.map(season => (
                            <button
                                key={season}
                                onClick={() => toggleSeason(season)}
                                style={styles.seasonButton(selectedSeasons.has(season))}
                            >
                                {season}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={styles.filterGrid}>
                    <div>
                        <label style={styles.filterFieldLabel}>Trial</label>
                        <div style={styles.filterFieldInputs}>
                            <input
                                type="number"
                                min="1"
                                value={minTrial}
                                onChange={(e) => setMinTrial(e.target.value)}
                                placeholder="Min"
                                style={{...styles.input, flex: 1}}
                            />
                            <input
                                type="number"
                                min="1"
                                value={maxTrial}
                                onChange={(e) => setMaxTrial(e.target.value)}
                                placeholder="Max"
                                style={{...styles.input, flex: 1}}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={styles.filterFieldLabel}>Build Item (substring):</label>
                        <input
                            type="text"
                            value={buildFilter}
                            onChange={(e) => setBuildFilter(e.target.value)}
                            placeholder="e.g., 'Void', 'Arcane'"
                            style={styles.inputFull}
                        />
                    </div>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div style={styles.noBuilds}>No builds match the current filters.</div>
            ) : (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead style={styles.tableHead}>
                            <tr style={styles.tableHeaderRow}>
                                <th style={styles.tableHeaderCell} onClick={() => handleSort('season')}>
                                    Season <SortArrow col="season" sortColumn={sortColumn} sortDir={sortDir} />
                                </th>
                                <th style={styles.tableHeaderCell} onClick={() => handleSort('trial_id')}>
                                    Trial <SortArrow col="trial_id" sortColumn={sortColumn} sortDir={sortDir} />
                                </th>
                                <th style={styles.tableHeaderCell} onClick={() => handleSort('attempts')}>
                                    Attempts <SortArrow col="attempts" sortColumn={sortColumn} sortDir={sortDir} />
                                </th>
                                <th style={styles.tableHeaderCell}>Party, Stats, Items & Souls</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row, idx) => (
                                <tr key={idx} style={styles.tableRow(idx % 2 === 0)}>
                                    <td style={styles.tableCell}>{row.season}</td>
                                    <td style={styles.tableCell}>{row.trial_id}</td>
                                    <td style={styles.tableCell}>{row.attempts ?? '—'}</td>
                                    <td style={{...styles.tableCell, maxWidth: 700, overflowX: 'auto', padding: 0}}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                            {(row.party || []).map((member, memberIdx) => (
                                                <div key={memberIdx} style={styles.memberContainer(memberIdx === (row.party?.length ?? 1) - 1)}>
                                                    <div style={styles.memberName}>{member.name}</div>

                                                    <div style={styles.statsContainer}>
                                                        <div>
                                                            <span style={{...styles.statItem(STAT_COLORS.hp), fontWeight: 500}}>HP:</span>
                                                            <span style={{...styles.statItem(STAT_COLORS.hp), fontWeight: 500}}> {member.hp}</span>
                                                            {member.soul?.hp_bonus?.Flat && (
                                                                <span style={styles.statItem(STAT_COLORS.hp)}>
                                                                    {' '}({member.soul.hp_bonus.Flat > 0 ? '+' : ''}{member.soul.hp_bonus.Flat})
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span style={{...styles.statItem(STAT_COLORS.str), fontWeight: 500}}>STR:</span>
                                                            <span style={{...styles.statItem(STAT_COLORS.str), fontWeight: 500}}> {member.str_}</span>
                                                            {member.soul?.str_bonus?.Flat && (
                                                                <span style={styles.statItem(STAT_COLORS.str)}>
                                                                    {' '}({member.soul.str_bonus.Flat > 0 ? '+' : ''}{member.soul.str_bonus.Flat})
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span style={{...styles.statItem(STAT_COLORS.dex), fontWeight: 500}}>DEX:</span>
                                                            <span style={{...styles.statItem(STAT_COLORS.dex), fontWeight: 500}}> {member.dex}</span>
                                                            {member.soul?.dex_bonus?.Flat && (
                                                                <span style={styles.statItem(STAT_COLORS.dex)}>
                                                                    {' '}({member.soul.dex_bonus.Flat > 0 ? '+' : ''}{member.soul.dex_bonus.Flat})
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span style={{...styles.statItem(STAT_COLORS.int), fontWeight: 500}}>INT:</span>
                                                            <span style={{...styles.statItem(STAT_COLORS.int), fontWeight: 500}}> {member.int}</span>
                                                            {member.soul?.int_bonus?.Flat && (
                                                                <span style={styles.statItem(STAT_COLORS.int)}>
                                                                    {' '}({member.soul.int_bonus.Flat > 0 ? '+' : ''}{member.soul.int_bonus.Flat})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {member.soul && member.soul.skill_names && member.soul.skill_names.length > 0 && (
                                                        <div style={styles.soulContainer}>
                                                            <div style={{...styles.soulLabel, color: getRarityColor(member.soul.rarity)}}>
                                                                Soul: {member.soul.skill_names.join(', ')}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div style={styles.itemsContainer}>
                                                        {(row.items[memberIdx] || []).map((item, itemIdx) => (
                                                            <div
                                                                key={itemIdx}
                                                                style={{...styles.itemBadge(getRarityColor(item.rarity)), backgroundColor: getClassColor(item.name)}}
                                                                title={`${item.name} - Tier ${item.tier}, ${item.rarity}`}
                                                            >
                                                                <div style={styles.itemName}>{item.name}</div>
                                                                <div style={styles.itemTier}>T{item.tier} {item.rarity}</div>
                                                            </div>
                                                        ))}
                                                        {(row.items[memberIdx]?.length ?? 0) === 0 && (
                                                            <span style={styles.noItems}>no items</span>
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
