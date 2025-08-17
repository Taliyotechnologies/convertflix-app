import React from 'react';
import { 
  User, 
  Target, 
  Shield, 
  Zap, 
  Mountain
} from 'lucide-react';
import styles from './Owner.module.css';

const Owner: React.FC = () => {
  return (
    <div className={styles.owner}>
      <div className={styles.container}>
        {/* Hero Section */}
        <div className={styles.hero}>
          <h1>Taliyo Technologies</h1>
          <p className={styles.subtitle}>
            Building simple, fast and reliable file tools. ConvertFlix is crafted by
            <a href="https://taliyotechnologies.com/" target="_blank" rel="noopener noreferrer"> Taliyo Technologies</a>.
          </p>
        </div>

        {/* Owner Profile */}
        <section className={styles.ownerProfile}>
          <div className={styles.profileCard}>
            <div className={styles.avatarSection}>
              <div className={styles.avatar}>
                <User size={64} />
              </div>
              <div className={styles.socialLinks}>
                <a href="#" className={styles.socialLink}>LinkedIn</a>
                <a href="#" className={styles.socialLink}>Twitter</a>
                <a href="#" className={styles.socialLink}>GitHub</a>
              </div>
            </div>
            <div className={styles.profileContent}>
              <h2>Harsh Budhauliya</h2>
              <p className={styles.title}>Founder, Taliyo Technologies</p>
              <p className={styles.bio}>
                Harsh Budhauliya leads <a href="https://taliyotechnologies.com/" target="_blank" rel="noopener noreferrer">Taliyo Technologies</a> with a builder’s mindset and product-first
                approach. Taliyo focuses on creating practical, high‑quality web tools that feel fast,
                look clean and work reliably for everyone.
              </p>
              <p className={styles.bio}>
                ConvertFlix is a <a href="https://taliyotechnologies.com/" target="_blank" rel="noopener noreferrer">Taliyo Technologies</a> initiative — a modern suite for compression and conversion that
                makes heavy files lighter without compromising on quality.
              </p>
            </div>
          </div>
        </section>

        {/* Background Section */}
        <section className={styles.section}>
          <h2>Professional Background</h2>
          <div className={styles.timeline}>
            <div className={styles.timelineItem}>
              <div className={styles.timelineYear}>2022 - Present</div>
              <div className={styles.timelineContent}>
                <h3>Founder, Taliyo Technologies</h3>
                <p>Driving product vision and engineering standards across Taliyo’s toolset, including ConvertFlix.</p>
              </div>
            </div>
            <div className={styles.timelineItem}>
              <div className={styles.timelineYear}>2019 - 2022</div>
              <div className={styles.timelineContent}>
                <h3>Product & Engineering</h3>
                <p>Built and shipped multiple web apps and internal platforms with a focus on performance and UX.</p>
              </div>
            </div>
            <div className={styles.timelineItem}>
              <div className={styles.timelineYear}>2016 - 2019</div>
              <div className={styles.timelineContent}>
                <h3>Full‑stack Development</h3>
                <p>Hands‑on experience across frontend, backend and cloud — delivering robust, scalable systems.</p>
              </div>
            </div>
            <div className={styles.timelineItem}>
              <div className={styles.timelineYear}>2012 - 2016</div>
              <div className={styles.timelineContent}>
                <h3>Computer Science</h3>
                <p>Strong fundamentals in algorithms, systems and product thinking.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className={styles.section}>
          <h2>Vision & Philosophy</h2>
          <div className={styles.visionGrid}>
            <div className={styles.visionCard}>
              <div className={styles.visionIcon}>
                <Target size={32} />
              </div>
              <h3>Accessibility First</h3>
              <p>
                Powerful tools should be accessible to everyone. This belief drives our interface,
                performance and pricing decisions.
              </p>
            </div>
            <div className={styles.visionCard}>
              <div className={styles.visionIcon}>
                <Shield size={32} />
              </div>
              <h3>Privacy by Design</h3>
              <p>
                We prioritize user trust. ConvertFlix processes files securely and only as long as
                needed for your task.
              </p>
            </div>
            <div className={styles.visionCard}>
              <div className={styles.visionIcon}>
                <Zap size={32} />
              </div>
              <h3>Performance Excellence</h3>
              <p>
                We obsess over speed and reliability so your workflow stays smooth, even with heavy files.
              </p>
            </div>
          </div>
        </section>

        {/* Personal Section */}
        <section className={styles.section}>
          <h2>Beyond the Code</h2>
          <div className={styles.personalContent}>
            <div className={styles.personalText}>
              <p>
                Outside of shipping products, Harsh enjoys learning, mentoring and exploring new tech.
              </p>
              <p>
                Taliyo is community‑minded — we believe in sharing knowledge and giving back.
              </p>
            </div>
            <div className={styles.personalVisual}>
              <div className={styles.personalIcon}>
                <Mountain size={48} />
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className={styles.contactSection}>
          <h2>Get in Touch</h2>
          <p>
            We love hearing from users and partners. Reach out and we’ll get back shortly.
          </p>
          <div className={styles.contactButtons}>
            <a href="/contact" className={styles.contactButtonSecondary}>
              Contact Us
            </a>
          </div>
        </section>

        <p className={styles.madeBy}>Made by <a href="https://taliyotechnologies.com/" target="_blank" rel="noopener noreferrer">Taliyo Technologies</a></p>
      </div>
    </div>
  );
};

export default Owner;
