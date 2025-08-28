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
import { useSEO } from '../../../hooks/useSEO';

const About: React.FC = () => {
  useSEO({
    title: 'About ConvertFlix – Taliyo Technologies',
    description: 'Learn about ConvertFlix by Taliyo Technologies. Our mission: fast, secure, privacy‑first file compression and conversion tools for everyone.',
    keywords: ['about convertflix','taliyo technologies','file compression','file conversion','privacy first','fast tools'],
    path: '/about'
  });
  return (
    <div className={styles.about}>
      <div className={styles.container}>
        {/* Hero Section */}
        <div className={styles.hero}>
          <h1>About ConvertFlix</h1>
          <p className={styles.subtitle}>
            Built by <a href="https://taliyotechnologies.com/" target="_blank" rel="noopener noreferrer">Taliyo Technologies</a> — a leading IT company in India for web/app development, design and digital marketing.
          </p>
        </div>

        {/* Mission Section */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <div className={styles.sectionText}>
              <h2>Our Mission</h2>
              <p>
                ConvertFlix is part of the <a href="https://taliyotechnologies.com/" target="_blank" rel="noopener noreferrer">Taliyo Technologies</a> product family. We make file optimization fast, secure and simple — so anyone can compress and convert without hassle.
              </p>
              <p>
                From professionals to students and teams, Taliyo’s engineering focuses on speed, quality and privacy to keep your workflow smooth and your files safe.
              </p>
            </div>
            <div className={styles.sectionVisual}>
              <div className={styles.missionIcon}>
                <Target size={120} />
              </div>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <div className={styles.sectionVisual}>
              <div className={styles.storyIcon}>
                <BookOpen size={120} />
              </div>
            </div>
            <div className={styles.sectionText}>
              <h2>Our Story</h2>
              <p>
                ConvertFlix was crafted at <a href="https://taliyotechnologies.com/" target="_blank" rel="noopener noreferrer">Taliyo Technologies</a> to solve a common problem: heavy files that slow you down. We set out to build tools that are powerful yet feel effortless.
              </p>
              <p>
                Led by founder Harsh Budhauliya, the Taliyo team builds clean, reliable products that prioritize user experience, security and performance.
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
              <h3>Harsh Budhauliya</h3>
              <p className={styles.memberRole}>Founder, Taliyo Technologies</p>
              <p className={styles.memberBio}>
                Leads product and engineering at Taliyo — crafting practical tools with a focus on speed, privacy and great UX.
              </p>
            </div>
            <div className={styles.teamMember}>
              <div className={styles.memberAvatar}>
                <Users size={48} />
              </div>
              <h3>Taliyo Engineering</h3>
              <p className={styles.memberRole}>Product & Platform</p>
              <p className={styles.memberBio}>
                Full‑stack developers focused on reliability, scale and performance across ConvertFlix and other Taliyo products.
              </p>
            </div>
            <div className={styles.teamMember}>
              <div className={styles.memberAvatar}>
                <Code size={48} />
              </div>
              <h3>Taliyo Design</h3>
              <p className={styles.memberRole}>Design & Experience</p>
              <p className={styles.memberBio}>
                Product designers crafting clean, accessible interfaces that help you get work done faster.
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
