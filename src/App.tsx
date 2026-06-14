import { Routes, Route } from 'react-router-dom';
import { Home } from './Pages/Home';
import TrialChart from './Pages/TrialChart';
import AllTrialsChart from './Pages/AllTrialsChart';
import SingleItemTrials from './Pages/SingleItemTrials';

function App() {
    return (
        <div style={{ width: '100%', height: 400 }}>

            {/* Pages */}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/TrialChart" element={<TrialChart />} />
                <Route path="/AllTrialsChart" element={<AllTrialsChart />} />
                <Route path="/SingleItemTrials" element={<SingleItemTrials />} />
            </Routes>
        </div>
    );
}

export default App;
