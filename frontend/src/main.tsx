import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider, LoadingOverlay } from '@mantine/core';

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
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <Suspense 
        fallback={
          <div style={{ width: '100vw', height: '100vh' }}>
            <LoadingOverlay visible overlayBlur={2} />
          </div>
        }
      >
        <App />
      </Suspense>
    </MantineProvider>
  </StrictMode>
);
