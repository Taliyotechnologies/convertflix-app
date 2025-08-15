import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderOpen, 
  ArrowRight, 
  Zap, 
  Rocket, 
  Shield, 
  Globe, 
  Monitor, 
  Target,

} from 'lucide-react';
import styles from './Home.module.css';

const Home: React.FC = () => {
  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Compress & Convert Any File
              <span className={styles.highlight}> Instantly</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Professional-grade file compression and conversion tools. Reduce file sizes, 
              convert formats, and optimize your media files with our advanced algorithms.
            </p>
            <div className={styles.heroButtons}>
              <Link to="/tools/compress-image" className={styles.primaryButton}>
                Start Compressing
              </Link>
              <Link to="/tools/convert-image" className={styles.secondaryButton}>
                Try Conversion
              </Link>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.heroIllustration}>
              <div className={styles.fileIcon}>
                <FolderOpen size={48} />
              </div>
              <div className={styles.arrow}>
                <ArrowRight size={32} />
              </div>
              <div className={styles.optimizedIcon}>
                <Zap size={48} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Why Choose ConvertFlix?</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Rocket size={32} />
              </div>
              <h3>Smart Compression</h3>
              <p>
                Advanced algorithms that maintain quality while reducing file sizes 
                by up to 80%. Perfect for web optimization and storage savings.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Zap size={32} />
              </div>
              <h3>Lightning Fast</h3>
              <p>
                Process files in seconds, not minutes. Our optimized infrastructure 
                ensures quick results without compromising on quality.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Shield size={32} />
              </div>
              <h3>Secure & Private</h3>
              <p>
                Your files are processed locally and never stored on our servers. 
                Complete privacy and security for your sensitive documents.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Globe size={32} />
              </div>
              <h3>Universal Support</h3>
              <p>
                Support for 100+ file formats including images, videos, PDFs, 
                and audio files. Convert between any supported format.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Monitor size={32} />
              </div>
              <h3>No Installation</h3>
              <p>
                Works directly in your browser. No software downloads or 
                installations required. Access from any device, anywhere.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Target size={32} />
              </div>
              <h3>Batch Processing</h3>
              <p>
                Process multiple files at once. Save time with our efficient 
                batch processing capabilities for large projects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>10M+</div>
              <div className={styles.statLabel}>Files Processed</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>50+</div>
              <div className={styles.statLabel}>File Formats</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>99.9%</div>
              <div className={styles.statLabel}>Uptime</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>24/7</div>
              <div className={styles.statLabel}>Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <h2>Ready to Get Started?</h2>
          <p>
            Join millions of users who trust ConvertFlix for their file optimization needs.
          </p>
          <div className={styles.ctaButtons}>
            <Link to="/tools/compress-image" className={styles.ctaPrimary}>
              Start Compressing Now
            </Link>
            <Link to="/about" className={styles.ctaSecondary}>
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
