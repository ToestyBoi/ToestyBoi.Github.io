import { StrictMode } from 'react'
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import './index.css'
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import App from './App'
import { DataProvider } from './context/DataContext';

ModuleRegistry.registerModules([AllCommunityModule]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <DataProvider>
          <HashRouter>
              <App />
          </HashRouter>
      </DataProvider>
  </StrictMode>,
)
