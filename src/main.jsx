import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AdminProvider } from './context/AdminContext.jsx';
import { AppProvider } from './context/AppContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AdminProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AdminProvider>
  </StrictMode>,
);
