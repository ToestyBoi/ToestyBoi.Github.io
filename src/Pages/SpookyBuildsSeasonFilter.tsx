import { useState } from 'react';
import type { CustomFilterProps } from 'ag-grid-react';
import { useGridFilter } from 'ag-grid-react';
import type { PartyBuildRecord } from '../types';

export interface SeasonFilterModel {
    values: string[];
}

export default function SpookyBuildsSeasonFilter(
    props: CustomFilterProps<PartyBuildRecord, unknown, SeasonFilterModel>
) {
    const { model, onModelChange, colDef } = props;
    const allSeasons: string[] = (colDef.filterParams?.values as string[] | undefined) ?? [];
    const [selected, setSelected] = useState<Set<string>>(new Set(model?.values ?? allSeasons));

    useGridFilter({
        doesFilterPass: params => selected.has((params.data as PartyBuildRecord).season),
    });

    const toggle = (season: string) => {
        const next = new Set(selected);
        if (next.has(season)) {
            next.delete(season);
        } else {
            next.add(season);
        }
        setSelected(next);
        onModelChange(next.size === allSeasons.length ? null : { values: Array.from(next) });
    };

    const selectAll = () => {
        setSelected(new Set(allSeasons));
        onModelChange(null);
    };

    return (
        <div style={{ padding: 8, minWidth: 160 }}>
            {allSeasons.map(season => (
                <label key={season} style={{ display: 'block', fontSize: 13, padding: '2px 0', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={selected.has(season)}
                        onChange={() => toggle(season)}
                        style={{ marginRight: 6 }}
                    />
                    {season}
                </label>
            ))}
            <button onClick={selectAll} style={{ marginTop: 8, fontSize: 12 }}>
                Select all
            </button>
        </div>
    );
}
