import React from 'react';
import styles from './Terms.module.css';

const Terms: React.FC = () => {
  return (
    <div className={styles.terms}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Terms of Service</h1>
          <p className={styles.lastUpdated}>Last updated: December 2024</p>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using ConvertFlix ("the Service"), you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Description of Service</h2>
            <p>
              ConvertFlix provides online file compression and conversion tools. Our services include but are not 
              limited to image compression, video compression, PDF compression, audio compression, and format conversion 
              between various file types.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. User Responsibilities</h2>
            <p>As a user of ConvertFlix, you agree to:</p>
            <ul>
              <li>Use the service only for lawful purposes</li>
              <li>Not upload files that contain malicious code or violate intellectual property rights</li>
              <li>Not attempt to reverse engineer or compromise the service</li>
              <li>Not use the service for any commercial purposes without written permission</li>
              <li>Respect the privacy and rights of other users</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>4. File Processing and Privacy</h2>
            <p>
              All file processing is performed locally in your browser. We do not store, transmit, or have access 
              to your files. Your files remain completely private and secure during the compression or conversion process.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Service Availability</h2>
            <p>
              We strive to maintain high service availability but cannot guarantee uninterrupted access. The service 
              may be temporarily unavailable due to maintenance, updates, or technical issues beyond our control.
            </p>
          </section>

          <section className={styles.section}>
            <h2>6. Limitation of Liability</h2>
            <p>
              ConvertFlix is provided "as is" without warranties of any kind. We are not liable for any damages 
              arising from the use of our service, including but not limited to data loss, file corruption, or 
              service interruption.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Intellectual Property</h2>
            <p>
              The ConvertFlix service, including its design, code, and content, is protected by intellectual 
              property laws. Users retain ownership of their uploaded files and processed results.
            </p>
          </section>

          <section className={styles.section}>
            <h2>8. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon 
              posting. Continued use of the service constitutes acceptance of modified terms.
            </p>
          </section>

          <section className={styles.section}>
            <h2>9. Contact Information</h2>
            <p>
              If you have questions about these terms, please contact us at{' '}
              <a href="mailto:legal@convertflix.com" className={styles.contactLink}>
                legal@convertflix.com
              </a>
            </p>
          </section>
        </div>

        <div className={styles.footer}>
          <p>
            By using ConvertFlix, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
