import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { publicAPI } from '../../services/api';

const VisitTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Only count a new visit once per browser session
    try {
      const key = 'visitTracked';
      const already = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : '1';
      if (!already) {
        const path = `${location.pathname}${location.search}${location.hash}`;
        const referrer = typeof document !== 'undefined' ? document.referrer : '';
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
        publicAPI.trackVisit(path, referrer, ua, 'frontend');
        try { sessionStorage.setItem(key, '1'); } catch {}
      }
    } catch {
      // no-op
    }
    // run only on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default VisitTracker;
