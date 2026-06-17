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

export default function NavBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const {file_name} = useData();
    const {trial_id, item_name} = (location.state as NavState) || {};
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

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
