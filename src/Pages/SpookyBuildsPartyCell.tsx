import type { CustomCellRendererProps } from 'ag-grid-react';
import type { PartyBuildRecord } from '../types';
import { getRarityColor, getClassColor } from '../colors';

const STAT_COLORS = {
    hp: '#e8a13c',
    str: '#e94560',
    dex: '#4ecca3',
    int: '#4ea8de',
} as const;

const styles = {
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
};

export default function SpookyBuildsPartyCell(props: CustomCellRendererProps<PartyBuildRecord, string>) {
    const row = props.data;
    if (!row) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {(row.party || []).map((member, memberIdx) => (
                <div key={memberIdx} style={styles.memberContainer(memberIdx === (row.party?.length ?? 1) - 1)}>
                    <div style={styles.memberName}>{member.name}</div>

                    <div style={styles.statsContainer}>
                        <div>
                            <span style={{...styles.statItem(STAT_COLORS.hp), fontWeight: 500}}>HP:</span>
                            <span style={{...styles.statItem(STAT_COLORS.hp), fontWeight: 500}}> {member.hp}</span>
                            {member.soul?.hp_bonus?.Flat != null && member.soul.hp_bonus.Flat !== 0 && (
                                <span style={styles.statItem(STAT_COLORS.hp)}>
                                    {' '}({member.soul.hp_bonus!.Flat > 0 ? '+' : ''}{member.soul.hp_bonus!.Flat})
                                </span>
                            )}
                        </div>
                        <div>
                            <span style={{...styles.statItem(STAT_COLORS.str), fontWeight: 500}}>STR:</span>
                            <span style={{...styles.statItem(STAT_COLORS.str), fontWeight: 500}}> {member.str_}</span>
                            {member.soul?.str_bonus?.Flat != null && member.soul.str_bonus.Flat !== 0 && (
                                <span style={styles.statItem(STAT_COLORS.str)}>
                                    {' '}({member.soul.str_bonus!.Flat > 0 ? '+' : ''}{member.soul.str_bonus!.Flat})
                                </span>
                            )}
                        </div>
                        <div>
                            <span style={{...styles.statItem(STAT_COLORS.dex), fontWeight: 500}}>DEX:</span>
                            <span style={{...styles.statItem(STAT_COLORS.dex), fontWeight: 500}}> {member.dex}</span>
                            {member.soul?.dex_bonus?.Flat != null && member.soul.dex_bonus.Flat !== 0 && (
                                <span style={styles.statItem(STAT_COLORS.dex)}>
                                    {' '}({member.soul.dex_bonus!.Flat > 0 ? '+' : ''}{member.soul.dex_bonus!.Flat})
                                </span>
                            )}
                        </div>
                        <div>
                            <span style={{...styles.statItem(STAT_COLORS.int), fontWeight: 500}}>INT:</span>
                            <span style={{...styles.statItem(STAT_COLORS.int), fontWeight: 500}}> {member.int}</span>
                            {member.soul?.int_bonus?.Flat != null && member.soul.int_bonus.Flat !== 0 && (
                                <span style={styles.statItem(STAT_COLORS.int)}>
                                    {' '}({member.soul.int_bonus!.Flat > 0 ? '+' : ''}{member.soul.int_bonus!.Flat})
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
    );
}
