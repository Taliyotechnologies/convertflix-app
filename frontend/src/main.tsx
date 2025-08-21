import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';

// Lazy load the main App component
const App = lazy(() => import('./App'));

// Non-blocking web vitals in dev
if (import.meta.env.DEV) {
  import('./utils/webVitals').then(m => m.webVitals && m.webVitals());
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense
      fallback={
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>Loading...</div>
        </div>
      }
    >
      <App />
    </Suspense>
  </StrictMode>
);
