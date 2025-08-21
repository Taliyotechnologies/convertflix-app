export const webVitals = () => {
  if (import.meta.env.DEV) {
    // Stubbed for development; no external dependency on 'web-vitals'
    console.debug('[webVitals] dev stub active');
  }
  return {};
};

export default webVitals;
