export const webVitals = () => {
  const reportWebVitals = (onPerfEntry?: any) => {
    if (onPerfEntry && onPerfEntry instanceof Function) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(onPerfEntry);
        getFID(onPerfEntry);
        getFCP(onPerfEntry);
        getLCP(onPerfEntry);
        getTTFB(onPerfEntry);
      });
    }
  };

  // Log web vitals to console in development
  if (process.env.NODE_ENV === 'development') {
    reportWebVitals((metric: any) => {
      console.log(metric);
    });
  }

  return { reportWebVitals };
};

export default webVitals;
