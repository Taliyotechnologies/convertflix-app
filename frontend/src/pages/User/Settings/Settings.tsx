import React, { useEffect, useState } from 'react';
import styles from './Settings.module.css';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { authAPI } from '../../../services/api';

import { useSEO } from '../../../hooks/useSEO';

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
 
  useSEO({ noindex: true });

  // Notifications preference (local only)
  const [emailNotifications, setEmailNotifications] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('settings');
      const s = raw ? JSON.parse(raw) : {};
      setEmailNotifications(!!s.emailNotifications);
    } catch {}
  }, []);
  const saveSettings = (updates: Record<string, any>) => {
    try {
      const raw = localStorage.getItem('settings');
      const s = raw ? JSON.parse(raw) : {};
      const next = { ...s, ...updates };
      localStorage.setItem('settings', JSON.stringify(next));
    } catch {}
  };
  const toggleEmailNotifications = () => {
    const next = !emailNotifications;
    setEmailNotifications(next);
    saveSettings({ emailNotifications: next });
  };

  // Password reset
  const [sendingReset, setSendingReset] = useState(false);
  const [resetStatus, setResetStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const sendReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    setResetStatus('idle');
    setResetMsg(null);
    try {
      await authAPI.forgotPassword(user.email);
      setResetStatus('success');
      setResetMsg('Reset link sent to your email.');
    } catch (err: any) {
      setResetStatus('error');
      setResetMsg(err?.message || 'Failed to send reset email');
    } finally {
      setSendingReset(false);
    }
  };

  // Clear non-auth cache
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState<string | null>(null);
  const clearCache = () => {
    setClearing(true);
    setClearMsg(null);
    try {
      const preserve = new Set(['token', 'user']);
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (preserve.has(k)) continue;
        keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
      setClearMsg(`Cleared ${keys.length} item(s).`);
    } catch {
      setClearMsg('Failed to clear cache.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className={styles.settingsPage}>
      <h1 className={styles.title}>Settings</h1>

      {/* Appearance */}
      <section className={styles.section}>
        <div className={styles.row}>
          <div>
            <div className={styles.sectionTitle}>Appearance</div>
            <div className={styles.desc}>Current theme: {theme}</div>
          </div>
          <button className={`${styles.button} ${styles.primary}`} onClick={toggleTheme}>
            Toggle Theme
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className={styles.section}>
        <div className={styles.row}>
          <div>
            <div className={styles.sectionTitle}>Notifications</div>
            <div className={styles.desc}>Email notifications: {emailNotifications ? 'On' : 'Off'}</div>
          </div>
          <button className={`${styles.button} ${styles.secondary}`} onClick={toggleEmailNotifications}>
            {emailNotifications ? 'Turn Off' : 'Turn On'}
          </button>
        </div>
        <div className={styles.helper}>Preference is saved on this device.</div>
      </section>

      {/* Security */}
      <section className={styles.section}>
        <div className={styles.row}>
          <div>
            <div className={styles.sectionTitle}>Security</div>
            <div className={styles.desc}>Send a password reset link to your email.</div>
          </div>
          <button
            className={`${styles.button} ${styles.secondary}`}
            onClick={sendReset}
            disabled={sendingReset || !user?.email}
          >
            {sendingReset ? 'Sending...' : 'Send reset link'}
          </button>
        </div>
        {resetStatus === 'success' && (
          <div className={`${styles.helper} ${styles.statusSuccess}`}>{resetMsg}</div>
        )}
        {resetStatus === 'error' && (
          <div className={`${styles.helper} ${styles.statusError}`}>{resetMsg}</div>
        )}
      </section>

      {/* Data & Privacy */}
      <section className={styles.section}>
        <div className={styles.row}>
          <div>
            <div className={styles.sectionTitle}>Data & Privacy</div>
            <div className={styles.desc}>Clear local cache (keeps you signed in).</div>
          </div>
          <button className={`${styles.button} ${styles.secondary} ${styles.danger}`} onClick={clearCache} disabled={clearing}>
            {clearing ? 'Clearing...' : 'Clear local cache'}
          </button>
        </div>
        {clearMsg && <div className={styles.helper}>{clearMsg}</div>}
      </section>

      {/* Account */}
      <section className={styles.section}>
        <div className={styles.row}>
          <div>
            <div className={styles.sectionTitle}>Account</div>
            <div className={styles.desc}>Manage your account preferences and security.</div>
          </div>
          <div className={styles.linkRow}>
            <Link to="/profile" className={`${styles.button} ${styles.secondary}`}>Profile</Link>
            <button className={`${styles.button} ${styles.secondary}`} onClick={logout}>Logout</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Settings;
