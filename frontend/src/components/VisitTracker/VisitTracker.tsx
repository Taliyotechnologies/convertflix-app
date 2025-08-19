import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { publicAPI } from '../../services/api';

const VisitTracker = () => {
  const location = useLocation();

  useEffect(() => {
    try {
      const path = `${location.pathname}${location.search}${location.hash}`;
      const referrer = typeof document !== 'undefined' ? document.referrer : '';
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      // Fire and forget; errors are swallowed in API layer
      publicAPI.trackVisit(path, referrer, ua, 'frontend');
    } catch {
      // no-op
    }
  }, [location.pathname, location.search, location.hash]);

  return null;
};

export default VisitTracker;
