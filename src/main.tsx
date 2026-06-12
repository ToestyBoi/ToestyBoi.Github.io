import { StrictMode } from 'react'
import './index.css'
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <HashRouter>
          <App />
      </HashRouter>
  </StrictMode>,
)
