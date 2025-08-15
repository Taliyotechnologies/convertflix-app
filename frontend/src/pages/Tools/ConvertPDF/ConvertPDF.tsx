import React from 'react';
import styles from './ConvertPDF.module.css';

const ConvertPDF: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.comingSoon}>
        <div className={styles.icon}>📄</div>
        <h1>PDF to Image Converter</h1>
        <h2>Coming Soon!</h2>
        <p>We're working hard to bring you the best PDF to image conversion experience.</p>
        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.checkmark}>✓</span>
            <span>High-quality PDF rendering</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.checkmark}>✓</span>
            <span>Multiple format support (JPEG, PNG)</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.checkmark}>✓</span>
            <span>Batch page conversion</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.checkmark}>✓</span>
            <span>Preserve original quality</span>
          </div>
        </div>
        <div className={styles.notification}>
          <p>🔔 Get notified when this feature is ready!</p>
          <button className={styles.notifyButton}>Notify Me</button>
        </div>
      </div>
    </div>
  );
};

export default ConvertPDF;
