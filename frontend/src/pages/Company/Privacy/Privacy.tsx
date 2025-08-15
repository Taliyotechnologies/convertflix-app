import React from 'react';
import styles from './Privacy.module.css';

const Privacy: React.FC = () => {
  return (
    <div className={styles.privacy}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Privacy Policy</h1>
          <p className={styles.lastUpdated}>Last updated: December 2024</p>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>1. Information We Collect</h2>
            <p>
              ConvertFlix is committed to protecting your privacy. We collect minimal information to provide 
              and improve our services:
            </p>
            <ul>
              <li><strong>Usage Data:</strong> Information about how you use our service</li>
              <li><strong>Technical Data:</strong> Browser type, device information, and IP address</li>
              <li><strong>Account Data:</strong> Email address and name (if you create an account)</li>
            </ul>
            <p>
              <strong>Important:</strong> We do NOT collect, store, or have access to the files you upload 
              for compression or conversion. All processing happens locally in your browser.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide and maintain our file optimization services</li>
              <li>Improve user experience and service performance</li>
              <li>Send important service updates and notifications</li>
              <li>Respond to customer support requests</li>
              <li>Analyze usage patterns to enhance our tools</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>3. File Privacy and Security</h2>
            <p>
              Your files are completely private and secure when using ConvertFlix:
            </p>
            <ul>
              <li>Files are processed entirely in your browser</li>
              <li>No files are uploaded to our servers</li>
              <li>We cannot see, access, or store your files</li>
              <li>All processing is done locally on your device</li>
              <li>No file data is transmitted over the internet</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>4. Data Sharing and Disclosure</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third parties, 
              except in the following circumstances:
            </p>
            <ul>
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With trusted service providers who assist in operating our service</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>5. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your information:
            </p>
            <ul>
              <li>Encryption of data in transit using HTTPS</li>
              <li>Secure authentication systems</li>
              <li>Regular security audits and updates</li>
              <li>Limited access to personal information by staff</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>6. Cookies and Tracking</h2>
            <p>
              We use essential cookies to:
            </p>
            <ul>
              <li>Remember your preferences and settings</li>
              <li>Maintain your login session</li>
              <li>Analyze service performance</li>
            </ul>
            <p>
              We do not use tracking cookies or third-party analytics that could compromise your privacy.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Your Rights and Choices</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Control cookie preferences</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>8. Data Retention</h2>
            <p>
              We retain your information only as long as necessary to provide our services:
            </p>
            <ul>
              <li>Account data: Until you delete your account</li>
              <li>Usage data: Up to 2 years for service improvement</li>
              <li>Support communications: Up to 3 years for reference</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>9. Children's Privacy</h2>
            <p>
              ConvertFlix is not intended for children under 13. We do not knowingly collect personal 
              information from children under 13. If you believe we have collected such information, 
              please contact us immediately.
            </p>
          </section>

          <section className={styles.section}>
            <h2>10. International Data Transfers</h2>
            <p>
              Our services are hosted in the United States. If you access our service from outside the US, 
              your information may be transferred to and processed in the US, where privacy laws may differ 
              from those in your country.
            </p>
          </section>

          <section className={styles.section}>
            <h2>11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by 
              posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className={styles.section}>
            <h2>12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className={styles.contactInfo}>
              <p><strong>Email:</strong> <a href="mailto:privacy@convertflix.com" className={styles.contactLink}>privacy@convertflix.com</a></p>
              <p><strong>Address:</strong> ConvertFlix Inc., 123 Tech Street, San Francisco, CA 94105</p>
            </div>
          </section>
        </div>

        <div className={styles.footer}>
          <p>
            By using ConvertFlix, you acknowledge that you have read and understood this Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
