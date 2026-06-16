import { StrictMode } from 'react'
import './index.css'
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App'
import { DataProvider } from './context/DataContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <DataProvider>
          <HashRouter>
              <App />
          </HashRouter>
      </DataProvider>
  </StrictMode>,
)
