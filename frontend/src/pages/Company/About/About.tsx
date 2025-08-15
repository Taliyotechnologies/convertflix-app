import React from 'react';
import { 
  Target, 
  BookOpen, 
  Shield, 
  Zap, 
  Palette, 
  Globe, 
  User, 
  Users,
  Code,

} from 'lucide-react';
import styles from './About.module.css';

const About: React.FC = () => {
  return (
    <div className={styles.about}>
      <div className={styles.container}>
        {/* Hero Section */}
        <div className={styles.hero}>
          <h1>About ConvertFlix</h1>
          <p className={styles.subtitle}>
            Empowering users worldwide with professional-grade file optimization tools
          </p>
        </div>

        {/* Mission Section */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <div className={styles.sectionText}>
              <h2>Our Mission</h2>
              <p>
                At ConvertFlix, we believe that file optimization shouldn't be complicated or expensive. 
                Our mission is to provide users with powerful, easy-to-use tools that make file compression 
                and conversion accessible to everyone.
              </p>
              <p>
                Whether you're a professional designer, a student working on projects, or someone who just 
                wants to save storage space, our tools are designed to meet your needs with simplicity and efficiency.
              </p>
            </div>
            <div className={styles.sectionVisual}>
              <div className={styles.missionIcon}>
                <Target size={48} />
              </div>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <div className={styles.sectionVisual}>
              <div className={styles.storyIcon}>
                <BookOpen size={48} />
              </div>
            </div>
            <div className={styles.sectionText}>
              <h2>Our Story</h2>
              <p>
                ConvertFlix was born from a simple observation: existing file optimization tools were either 
                too expensive, too complicated, or too limited in functionality. We saw an opportunity to 
                create something better.
              </p>
              <p>
                Starting as a small team of developers and designers, we've grown into a trusted platform 
                serving millions of users worldwide. Our commitment to quality, security, and user experience 
                has remained constant throughout our journey.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Our Values</h2>
          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <Shield size={32} />
              </div>
              <h3>Privacy First</h3>
              <p>
                We believe your files are private. That's why we process everything locally and never 
                store your data on our servers.
              </p>
            </div>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <Zap size={32} />
              </div>
              <h3>Performance</h3>
              <p>
                Speed and efficiency are at the core of everything we do. We optimize our tools to 
                deliver results in seconds, not minutes.
              </p>
            </div>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <Palette size={32} />
              </div>
              <h3>Quality</h3>
              <p>
                We maintain the highest standards for output quality. Your files deserve the best, 
                and we deliver nothing less.
              </p>
            </div>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <Globe size={32} />
              </div>
              <h3>Accessibility</h3>
              <p>
                Great tools should be available to everyone. We're committed to making file optimization 
                accessible and affordable.
              </p>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Our Team</h2>
          <div className={styles.teamGrid}>
            <div className={styles.teamMember}>
              <div className={styles.memberAvatar}>
                <User size={48} />
              </div>
              <h3>Alex Chen</h3>
              <p className={styles.memberRole}>Founder & CEO</p>
              <p className={styles.memberBio}>
                Former software engineer at major tech companies, passionate about creating user-friendly tools.
              </p>
            </div>
            <div className={styles.teamMember}>
              <div className={styles.memberAvatar}>
                <Users size={48} />
              </div>
              <h3>Sarah Kim</h3>
              <p className={styles.memberRole}>Head of Design</p>
              <p className={styles.memberBio}>
                UX/UI expert with 8+ years of experience in creating intuitive digital experiences.
              </p>
            </div>
            <div className={styles.teamMember}>
              <div className={styles.memberAvatar}>
                <Code size={48} />
              </div>
              <h3>Mike Rodriguez</h3>
              <p className={styles.memberRole}>Lead Developer</p>
              <p className={styles.memberBio}>
                Full-stack developer specializing in performance optimization and scalable architecture.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>By The Numbers</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>10M+</div>
              <div className={styles.statLabel}>Files Processed</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>150+</div>
              <div className={styles.statLabel}>Countries Served</div>
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
        </section>

        {/* CTA Section */}
        <section className={styles.cta}>
          <h2>Ready to Get Started?</h2>
          <p>
            Join millions of users who trust ConvertFlix for their file optimization needs.
          </p>
          <div className={styles.ctaButtons}>
            <a href="/tools/compress-image" className={styles.ctaPrimary}>
              Try Our Tools
            </a>
            <a href="/contact" className={styles.ctaSecondary}>
              Get in Touch
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
