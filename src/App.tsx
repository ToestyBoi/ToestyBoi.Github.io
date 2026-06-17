import { Routes, Route } from 'react-router-dom';
import { Home } from './Pages/Home';
import TrialChart from './Pages/TrialChart';
import AllTrialsChart from './Pages/AllTrialsChart';
import SingleItemTrials from './Pages/SingleItemTrials';
import ItemScatterPlot from './Pages/ItemScatterPlot';
import ItemTierScaling from './Pages/ItemTierScaling';
import ItemHeatmap from './Pages/ItemHeatmap';
import ItemPairingHeatmap from './Pages/ItemPairingHeatmap';
import BuildDiversityChart from './Pages/BuildDiversityChart';
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
                <Route path="/ItemScatter" element={<ItemScatterPlot />} />
                <Route path="/ItemTierScaling" element={<ItemTierScaling />} />
                <Route path="/ItemHeatmap" element={<ItemHeatmap />} />
                <Route path="/ItemPairing" element={<ItemPairingHeatmap />} />
                <Route path="/BuildDiversity" element={<BuildDiversityChart />} />
            </Routes>
        </div>
    );
}

export default App;
