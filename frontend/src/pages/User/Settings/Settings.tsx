import React from 'react';
import styles from './Settings.module.css';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();

  return (
    <div className={styles.settingsPage}>
      <h1 className={styles.title}>Settings</h1>

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
