
import { Routes, Route } from 'react-router-dom';
import {Home} from './pages/Home';
import TrialChart from './Pages/TrialChart.jsx';
import AllTrialsChart from './Pages/allTrialsChart.jsx';
import SingleItemTrials from './Pages/SingleItemTrials.jsx';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import TrialItemChart from "./Pages/TrialItemChart.jsx";

// register modules ONCE
ModuleRegistry.registerModules([AllCommunityModule]);

function App() {
    return (
        <div style={{ width: '100%', height: 400 }}>

            {/* Pages */}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/TrialChart" element={<TrialChart />} />
                <Route path="/allTrialsChart" element={<AllTrialsChart />} />
                <Route path="/TrialItemChart" element={<TrialItemChart />} />
                <Route path="/singleItemTrials" element={<SingleItemTrials />} />
            </Routes>
        </div>
    );
}

export default App;