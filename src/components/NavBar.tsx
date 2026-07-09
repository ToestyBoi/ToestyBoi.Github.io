import {useEffect, useRef, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import type {NavState} from '../types';
import {useData} from '../context/DataContext';

const CHARTS = [
    {label: 'All Trials', path: '/AllTrialsChart'},
    {label: 'Build Diversity', path: '/BuildDiversity'},
    {label: 'Item Heatmap', path: '/ItemHeatmap'},
    {label: 'Item Scatter', path: '/ItemScatter'},
    {label: 'Item Tier Scaling', path: '/ItemTierScaling'},
    {label: 'Item Pairing', path: '/ItemPairing'},
];

const inputStyle = {
    width: 60,
    padding: '4px 6px',
    fontSize: 12,
    border: '1px solid #ccc',
    borderRadius: 3,
};

const filterButtonStyle = {
    padding: '4px 10px',
    fontSize: 12,
    border: '1px solid #ccc',
    borderRadius: 3,
    cursor: 'pointer' as const,
    background: '#f5f5f5',
    color: '#555',
    marginLeft: 4,
};

export default function NavBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const {file_name, minTrial, maxTrial, json, setTrialRange} = useData();
    const {trial_id, item_name} = (location.state as NavState) || {};
    const [menuOpen, setMenuOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [inputMin, setInputMin] = useState<string>('');
    const [inputMax, setInputMax] = useState<string>('');
    const menuRef = useRef<HTMLDivElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    // Sync input values with context when filter dropdown opens
    const handleFilterOpen = () => {
        if (minTrial != null) setInputMin(String(minTrial));
        if (maxTrial != null) setInputMax(String(maxTrial));
        setFilterOpen(true);
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setFilterOpen(false);
            }
        };
        if (menuOpen || filterOpen) {
            document.addEventListener('mousedown', handler);
            return () => document.removeEventListener('mousedown', handler);
        }
    }, [menuOpen, filterOpen]);

    const maxAvailableTrial = json?.trials ? Math.max(...json.trials.map(t => t.trial_id)) : 0;

    const handleApplyFilter = () => {
        const min = inputMin ? parseInt(inputMin, 10) : null;
        const max = inputMax ? parseInt(inputMax, 10) : null;
        setTrialRange(min, max);
        setFilterOpen(false);
    };

    const handleResetFilter = () => {
        setTrialRange(null, null);
        setInputMin('');
        setInputMax('');
        setFilterOpen(false);
    };

    const drillCrumbs: {label: string; onClick: () => void}[] = [];
    if (trial_id != null) {
        drillCrumbs.push({
            label: `Trial ${trial_id}`,
            onClick: () => navigate('/TrialChart', {state: {trial_id}}),
        });
    }
    if (item_name) {
        drillCrumbs.push({label: item_name, onClick: () => {}});
    }

    const currentChart = CHARTS.find(c => c.path === location.pathname);

    return (
        <nav style={{
            padding: '8px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
        }}>
            <button onClick={() => navigate('/')} style={{marginRight: 4}}>Home</button>

            {location.pathname !== '/' && (
                <div ref={filterRef} style={{position: 'relative'}}>
                    <button
                        onClick={() => filterOpen ? setFilterOpen(false) : handleFilterOpen()}
                        style={{
                            ...filterButtonStyle,
                            fontWeight: (minTrial != null || maxTrial != null) ? 600 : 400,
                            background: (minTrial != null || maxTrial != null) ? '#e8f5e9' : '#f5f5f5',
                        }}
                    >
                        {minTrial != null && maxTrial != null
                            ? `Trials ${minTrial}–${maxTrial}`
                            : 'Filter Trials'
                        }
                    </button>
                    {filterOpen && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            background: 'var(--bg, #fff)',
                            border: '1px solid var(--border)',
                            borderRadius: 4,
                            zIndex: 100,
                            padding: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            minWidth: 240,
                        }}>
                            <div style={{marginBottom: 8, fontSize: 12, color: '#666'}}>
                                Min trial (inclusive):
                            </div>
                            <input
                                type="number"
                                min="1"
                                value={inputMin}
                                onChange={(e) => setInputMin(e.target.value)}
                                placeholder="1"
                                style={{...inputStyle, width: '100%', marginBottom: 12}}
                            />
                            <div style={{marginBottom: 8, fontSize: 12, color: '#666'}}>
                                Max trial (inclusive):
                            </div>
                            <input
                                type="number"
                                min="1"
                                max={maxAvailableTrial}
                                value={inputMax}
                                onChange={(e) => setInputMax(e.target.value)}
                                placeholder={String(maxAvailableTrial)}
                                style={{...inputStyle, width: '100%', marginBottom: 12}}
                            />
                            <div style={{fontSize: 11, color: '#999', marginBottom: 8}}>
                                Available: 1–{maxAvailableTrial}
                            </div>
                            <div style={{display: 'flex', gap: 6}}>
                                <button
                                    onClick={handleApplyFilter}
                                    style={{
                                        flex: 1,
                                        padding: '6px 10px',
                                        fontSize: 12,
                                        border: '1px solid #4caf50',
                                        borderRadius: 3,
                                        cursor: 'pointer',
                                        background: '#4caf50',
                                        color: '#fff',
                                    }}
                                >
                                    Apply
                                </button>
                                {(minTrial != null || maxTrial != null) && (
                                    <button
                                        onClick={handleResetFilter}
                                        style={{
                                            flex: 1,
                                            padding: '6px 10px',
                                            fontSize: 12,
                                            border: '1px solid #999',
                                            borderRadius: 3,
                                            cursor: 'pointer',
                                            background: '#fff',
                                            color: '#555',
                                        }}
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {location.pathname !== '/' && (
                <div ref={menuRef} style={{position: 'relative'}}>
                    <button
                        onClick={() => setMenuOpen(v => !v)}
                        style={{fontWeight: currentChart ? 600 : 400}}
                    >
                        {currentChart ? currentChart.label : 'Charts'} ▾
                    </button>
                    {menuOpen && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            background: 'var(--bg, #fff)',
                            border: '1px solid var(--border)',
                            borderRadius: 4,
                            zIndex: 100,
                            minWidth: 160,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        }}>
                            {file_name && (
                                <div style={{
                                    padding: '6px 12px 4px',
                                    fontSize: 11,
                                    color: '#888',
                                    borderBottom: '1px solid var(--border)',
                                }}>
                                    {file_name}
                                </div>
                            )}
                            {CHARTS.map(chart => (
                                <button
                                    key={chart.path}
                                    onClick={() => {
                                        navigate(chart.path);
                                        setMenuOpen(false);
                                    }}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '8px 12px',
                                        border: 'none',
                                        background: location.pathname === chart.path ? 'rgba(128,128,128,0.12)' : 'transparent',
                                        cursor: 'pointer',
                                        fontWeight: location.pathname === chart.path ? 600 : 400,
                                    }}
                                >
                                    {chart.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {drillCrumbs.map((crumb, i) => (
                <span key={i} style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    <span style={{color: 'var(--border)'}}>{'›'}</span>
                    <button
                        onClick={crumb.onClick}
                        disabled={i === drillCrumbs.length - 1}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: i === drillCrumbs.length - 1 ? 'default' : 'pointer',
                            padding: 0,
                            color: i === drillCrumbs.length - 1 ? 'var(--text-h)' : 'var(--accent)',
                            fontWeight: i === drillCrumbs.length - 1 ? 600 : 400,
                        }}
                    >
                        {crumb.label}
                    </button>
                </span>
            ))}
        </nav>
    );
}
