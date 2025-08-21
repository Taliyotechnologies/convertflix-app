import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Non-blocking web vitals in dev
if (import.meta.env.DEV) {
  import('./utils/webVitals').then(m => m.webVitals && m.webVitals());
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
