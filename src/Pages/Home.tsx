import { useNavigate } from 'react-router-dom';
import { useFileUpload } from './HandleFileUpload';
import { useData } from '../context/DataContext';

const CHARTS = [
    { label: 'All Trials', path: '/AllTrialsChart', desc: 'Clear rate per trial, drill into individual trials' },
    { label: 'Item Heatmap', path: '/ItemHeatmap', desc: 'Item win rates across trials as a heatmap' },
    { label: 'Item Scatter', path: '/ItemScatter', desc: 'Item win rate vs. trial difficulty scatter plot' },
    { label: 'Item Tier Scaling', path: '/ItemTierScaling', desc: 'How item win rates scale with tier and rarity' },
    { label: 'Item Pairing', path: '/ItemPairing', desc: 'How often items are paired together in builds' },
    { label: 'Build Diversity', path: '/BuildDiversity', desc: 'Variety of builds used across trials' },
];

export function Home() {
    const { json, file_name, setJson, setFileName } = useData();
    const handleUpload = useFileUpload();
    const navigate = useNavigate();

    if (json) {
        return (
            <div style={{ padding: '32px 24px', maxWidth: 600, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{file_name}</span>
                    <label style={{ fontSize: 13, color: 'var(--accent)', cursor: 'pointer' }}>
                        Load new file
                        <input
                            type="file"
                            accept=".json,application/json"
                            onChange={handleUpload}
                            style={{ display: 'none' }}
                        />
                    </label>
                    <button
                        onClick={() => { setJson(null); setFileName(null); }}
                        style={{ fontSize: 13, marginLeft: 'auto', cursor: 'pointer' }}
                    >
                        Clear data
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {CHARTS.map(({ label, path, desc }) => (
                        <button
                            key={path}
                            onClick={() => navigate(path)}
                            style={{
                                textAlign: 'left',
                                padding: '12px 16px',
                                border: '1px solid var(--border)',
                                borderRadius: 6,
                                background: 'none',
                                cursor: 'pointer',
                                width: '100%',
                            }}
                        >
                            <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
                            <div style={{ fontSize: 12, color: '#888' }}>{desc}</div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '32px 24px' }}>
            <input type="file" accept=".json,application/json" onChange={handleUpload} />
        </div>
    );
}
