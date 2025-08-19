import type { FC } from 'react';
import styles from './Maintenance.module.css';

type MaintenanceProps = {
  siteName?: string;
};

const Maintenance: FC<MaintenanceProps> = ({ siteName = 'ConvertFlix' }) => {
  const refresh = () => window.location.reload();

  return (
    <div className={styles.wrapper}>
      <div className={styles.vignette} />
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 2a1 1 0 0 1 1 1v1.05a7.966 7.966 0 0 1 3.516 1.458l.744-.744a1 1 0 1 1 1.414 1.414l-.744.744A7.966 7.966 0 0 1 20.95 11H22a1 1 0 1 1 0 2h-1.05a7.966 7.966 0 0 1-1.458 3.516l.744.744a1 1 0 0 1-1.414 1.414l-.744-.744A7.966 7.966 0 0 1 13 19.95V21a1 1 0 1 1-2 0v-1.05a7.966 7.966 0 0 1-3.516-1.458l-.744.744a1 1 0 1 1-1.414-1.414l.744-.744A7.966 7.966 0 0 1 3.05 13H2a1 1 0 1 1 0-2h1.05a7.966 7.966 0 0 1 1.458-3.516l-.744-.744a1 1 0 1 1 1.414-1.414l.744.744A7.966 7.966 0 0 1 11 4.05V3a1 1 0 0 1 1-1Zm0 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" fill="#93c5fd"/>
            </svg>
            {siteName}
            <span className={styles.badge}>Scheduled</span>
          </div>
          <h1 className={styles.title}>{siteName} is under maintenance</h1>
          <p className={styles.subtitle}>
            We’re upgrading our infrastructure to improve your experience. The site will be back shortly.
          </p>
        </div>

        <div className={styles.illustration}>
          <div className={styles.glow} />
          <div className={styles.spinner} />
        </div>

        <div className={styles.meta}>
          <span>Auto-checking status</span>
          <span className={styles.dot} />
          <span>Typically a few minutes</span>
        </div>

        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.primary}`} onClick={refresh}>Refresh now</button>
          <a className={`${styles.btn} ${styles.secondary}`} href="mailto:support@convertflix.com">Contact support</a>
        </div>

        <div className={styles.footerNote}>Thank you for your patience.</div>
      </div>
    </div>
  );
};

export default Maintenance;
