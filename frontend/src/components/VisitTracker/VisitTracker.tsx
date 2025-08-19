import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { publicAPI } from '../../services/api';

function classifyDevice(ua: string): 'phone' | 'tablet' | 'laptop' {
  try {
    const s = String(ua || '').toLowerCase();
    const isTablet = /tablet|ipad|playbook|silk|kindle|sm\-t|nexus 7|nexus 10/.test(s);
    const isMobile = /mobi|iphone|ipod|android(?!.*tablet)|phone/.test(s);
    if (isTablet) return 'tablet';
    if (isMobile) return 'phone';
    return 'laptop';
  } catch {
    return 'laptop';
  }
}

function getOrCreateDeviceId(): string {
  const keys = ['cf_device_id', 'deviceId'];
  try {
    for (const k of keys) {
      const v = typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null;
      if (v && v.length >= 8) return v;
    }
  } catch {}
  // generate
  let id = '';
  try {
    if (typeof crypto !== 'undefined' && (crypto as any).getRandomValues) {
      const arr = new Uint8Array(16);
      (crypto as any).getRandomValues(arr);
      id = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
  } catch {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  try { if (typeof localStorage !== 'undefined') localStorage.setItem('cf_device_id', id); } catch {}
  return id;
}

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
        const deviceType = classifyDevice(ua);
        const deviceId = getOrCreateDeviceId();
        publicAPI.trackVisit(path, referrer, ua, 'frontend', deviceId, deviceType);
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
