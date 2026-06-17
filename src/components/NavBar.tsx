import {useLocation, useNavigate} from 'react-router-dom';
import type {NavState} from '../types';
import {useData} from '../context/DataContext';

export default function NavBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const {file_name} = useData();
    const {trial_id, item_name} = (location.state as NavState) || {};

    const reset = () => {
        navigate('/');
    };

    const crumbs: { label: string; onClick: () => void }[] = [];

    if (location.pathname !== '/') {
        crumbs.push({
            label: file_name ?? 'All Trials',
            onClick: () => navigate('/AllTrialsChart'),
        });
    }
    if (location.pathname === '/ItemScatter') {
        crumbs.push({label: 'Item Scatter', onClick: () => {}});
    } else if (location.pathname === '/ItemHeatmap') {
        crumbs.push({label: 'Item Heatmap', onClick: () => {}});
    } else if (location.pathname === '/ItemPairing') {
        crumbs.push({label: 'Item Pairing', onClick: () => {}});
    } else if (location.pathname === '/BuildDiversity') {
        crumbs.push({label: 'Build Diversity', onClick: () => {}});
    } else if (location.pathname === '/ItemTierScaling') {
        crumbs.push({label: 'Item Tier Scaling', onClick: () => {}});
    } else {
        if (trial_id != null) {
            crumbs.push({
                label: `Trial ${trial_id}`,
                onClick: () => navigate('/TrialChart', {state: {trial_id}}),
            });
        }
        if (item_name) {
            crumbs.push({
                label: item_name,
                onClick: () => {},
            });
        }
    }

    return (
        <nav style={{
            padding: '8px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
        }}>
            <button onClick={reset} style={{marginRight: 8}}>Home</button>
            {crumbs.map((crumb, i) => (
                <span key={i} style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    <span style={{color: 'var(--border)'}}>{'›'}</span>
                    <button
                        onClick={crumb.onClick}
                        disabled={i === crumbs.length - 1}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: i === crumbs.length - 1 ? 'default' : 'pointer',
                            padding: 0,
                            color: i === crumbs.length - 1 ? 'var(--text-h)' : 'var(--accent)',
                            fontWeight: i === crumbs.length - 1 ? 600 : 400
                        }}
                    >
                        {crumb.label}
                    </button>
                </span>
            ))}
        </nav>
    );
}
