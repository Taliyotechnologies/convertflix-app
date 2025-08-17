import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Film, 
  Twitter, 
  Linkedin, 
  Facebook, 
  Github
} from 'lucide-react';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          {/* Company Info */}
          <div className={styles.companySection}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>
                <Film size={24} />
              </span>
              <span className={styles.logoText}>ConvertFlix</span>
            </div>
            <p className={styles.companyDescription}>
              Professional-grade file compression and conversion tools. 
              Optimize your files with ease and security.
            </p>
            <div className={styles.socialLinks}>
              <a href="#" className={styles.socialLink} aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" className={styles.socialLink} aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
              <a href="#" className={styles.socialLink} aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="#" className={styles.socialLink} aria-label="GitHub">
                <Github size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className={styles.linksSection}>
            <h3>Quick Links</h3>
            <ul className={styles.footerLinks}>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/tools/compress-image">Compress Image</Link></li>
              <li><Link to="/tools/compress-video">Compress Video</Link></li>
              <li><Link to="/tools/convert-image">Convert Image</Link></li>
              <li><Link to="/tools/convert-video">Convert Video</Link></li>
            </ul>
          </div>

          {/* Tools */}
          <div className={styles.linksSection}>
            <h3>Tools</h3>
            <ul className={styles.footerLinks}>
              <li><Link to="/tools/compress-pdf">Compress PDF</Link></li>
              <li><Link to="/tools/compress-audio">Compress Audio</Link></li>
              <li><Link to="/tools/convert-pdf">Convert PDF</Link></li>
              <li><Link to="/tools/convert-audio">Convert Audio</Link></li>
              <li><Link to="/tools/compress-image">Image Compression</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className={styles.linksSection}>
            <h3>Company</h3>
            <ul className={styles.footerLinks}>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/owner">Our Team</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className={styles.linksSection}>
            <h3>Support</h3>
            <ul className={styles.footerLinks}>
              <li><Link to="/contact">Help Center</Link></li>
              <li><Link to="/contact">Contact Support</Link></li>
              <li><Link to="/terms">Legal</Link></li>
              <li><Link to="/privacy">Privacy</Link></li>
              <li><Link to="/contact">Feedback</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={styles.bottomSection}>
          <div className={styles.copyright}>
            <p>&copy; {currentYear} ConvertFlix. All rights reserved.</p>
          </div>
          <div className={styles.credit}>
            <p>made by <span className={styles.brandName}>taliyo technologies</span></p>
          </div>
          <div className={styles.bottomLinks}>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
