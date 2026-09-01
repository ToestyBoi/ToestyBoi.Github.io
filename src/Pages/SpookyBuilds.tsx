import { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import spookyBuilds from '../spooky-data/spooky-builds.json';
import type { PartyBuildRecord } from '../types';
import SpookyBuildsPartyCell from './SpookyBuildsPartyCell';
import SpookyBuildsSeasonFilter from './SpookyBuildsSeasonFilter';

const ALL_SEASONS = Array.from(new Set((spookyBuilds as PartyBuildRecord[]).map(b => b.season))).sort();

const flattenItemNames = (row: PartyBuildRecord): string =>
    row.items.flat().map(item => item.name).join(', ');

const styles = {
    container: {
        padding: '16px',
        display: 'flex' as const,
        flexDirection: 'column' as const,
        height: 'calc(100svh - 60px)',
    } as React.CSSProperties,

    header: {
        fontSize: 20,
        fontWeight: 600,
        marginBottom: 16,
    } as React.CSSProperties,

    gridContainer: {
        flex: 1,
        minHeight: 0,
        width: '100%',
    } as React.CSSProperties,

    emptyState: {
        textAlign: 'center' as const,
        marginTop: 60,
        color: 'var(--text-h)',
        fontSize: 15,
    } as React.CSSProperties,
};

export default function SpookyBuilds() {
    const rowData = spookyBuilds as PartyBuildRecord[];

    const columnDefs = useMemo<ColDef<PartyBuildRecord>[]>(() => [
        {
            headerName: 'Season',
            field: 'season',
            filter: SpookyBuildsSeasonFilter,
            filterParams: { values: ALL_SEASONS },
            sortable: true,
            sort: 'desc',
            sortIndex: 0,
            width: 160,
        },
        {
            headerName: 'Trial',
            field: 'trial_id',
            filter: 'agNumberColumnFilter',
            sortable: true,
            sort: 'desc',
            sortIndex: 1,
            width: 130,
        },
        {
            headerName: 'Attempts',
            colId: 'attempts',
            valueGetter: params => params.data?.attempts ?? 0,
            filter: 'agNumberColumnFilter',
            sortable: false,
            width: 130,
        },
        {
            headerName: 'Party, Stats, Items & Souls',
            colId: 'partyItems',
            valueGetter: params => flattenItemNames(params.data!),
            filter: 'agTextColumnFilter',
            cellRenderer: SpookyBuildsPartyCell,
            autoHeight: true,
            wrapText: true,
            sortable: false,
            flex: 1,
            minWidth: 400,
        },
    ], []);

    if (rowData.length === 0) {
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

            <div className="ag-theme-quartz" style={styles.gridContainer}>
                <AgGridReact<PartyBuildRecord>
                    theme="legacy"
                    rowData={rowData}
                    columnDefs={columnDefs}
                />
            </div>
        </div>
    );
}
