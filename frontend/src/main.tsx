import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';

// Lazy load the main App component
const App = lazy(() => import('./App'));

// Add performance monitoring in development
if (import.meta.env.DEV) {
  const { webVitals } = await import('./utils/webVitals');
  webVitals();
}

// Create root with concurrent mode
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
