import { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import {Home} from './pages/Home';
import TrialChart from './Pages/TrialChart.jsx';
import AllTrialsChart from './Pages/allTrialsChart.jsx';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

// register modules ONCE
ModuleRegistry.registerModules([AllCommunityModule]);

function App() {
    return (
        <div style={{ width: '100%', height: 400 }}>
            {/* Navigation */}
            <nav style={{ display: 'flex', gap: 10 }}>
                <Link to="/">Home</Link>
                <Link to="/TrialChart">Dashboard</Link>
                <Link to="/allTrialsChart">Charts</Link>
            </nav>

            <hr />

            {/* Pages */}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/TrialChart" element={<TrialChart />} />
                <Route path="/allTrialsChart" element={<AllTrialsChart />} />
            </Routes>
        </div>
    );
}

export default App;