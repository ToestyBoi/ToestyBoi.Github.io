import { Routes, Route } from 'react-router-dom';
import { Home } from './Pages/Home';
import TrialChart from './Pages/TrialChart';
import AllTrialsChart from './Pages/AllTrialsChart';
import SingleItemTrials from './Pages/SingleItemTrials';
import NavBar from './components/NavBar';

function App() {
    return (
        <div style={{ width: '100%' }}>
            <NavBar />
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
