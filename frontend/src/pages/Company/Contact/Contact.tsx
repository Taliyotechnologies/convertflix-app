import React, { useState } from 'react';
import { 
  CheckCircle, 
  Mail, 
  Globe, 
  Clock, 
  MessageCircle, 
  Smartphone, 
  BookOpen,
  AlertCircle
} from 'lucide-react';
import styles from './Contact.module.css';
import { publicAPI } from '../../../services/api';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setSubmitStatus('idle');
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await publicAPI.submitContact(
        formData.name,
        formData.email,
        formData.subject,
        formData.message
      );
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      const msg = (err && err.message) ? String(err.message) : 'Failed to send message';
      setErrorMsg(msg);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.contact}>
      <div className={styles.container}>
        {/* Hero Section */}
        <div className={styles.hero}>
          <h1>Get in Touch</h1>
          <p className={styles.subtitle}>
            Have questions, feedback, or need support? We'd love to hear from you.
          </p>
        </div>

        <div className={styles.mainContent}>
          {/* Contact Form */}
          <div className={styles.formSection}>
            <h2>Send us a Message</h2>
            <form onSubmit={handleSubmit} className={styles.contactForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your email address"
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="subject">Subject *</label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="feature">Feature Request</option>
                  <option value="bug">Bug Report</option>
                  <option value="partnership">Partnership</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  placeholder="Tell us how we can help you..."
                />
              </div>
              
              <button
                type="submit"
                className={`${styles.submitButton} ${isSubmitting ? styles.submitting : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
              
              {submitStatus === 'success' && (
                <div className={styles.successMessage}>
                  <CheckCircle size={20} />
                  Thank you! Your message has been sent successfully. We'll get back to you within 24 hours.
                </div>
              )}
              {submitStatus === 'error' && (
                <div className={styles.errorMessage}>
                  <AlertCircle size={20} />
                  {errorMsg || "Sorry, we couldn't send your message. Please try again later."}
                </div>
              )}
            </form>
          </div>

          {/* Contact Information */}
          <div className={styles.infoSection}>
            <h2>Contact Information</h2>
            
            <div className={styles.contactMethods}>
              <div className={styles.contactMethod}>
                <div className={styles.methodIcon}>
                  <Mail size={24} />
                </div>
                <div className={styles.methodContent}>
                  <h3>Email</h3>
                  <p>hello@convertflix.com</p>
                  <p>support@convertflix.com</p>
                </div>
              </div>
              
              <div className={styles.contactMethod}>
                <div className={styles.methodIcon}>
                  <Globe size={24} />
                </div>
                <div className={styles.methodContent}>
                  <h3>Website</h3>
                  <p>www.convertflix.com</p>
                </div>
              </div>
              
              <div className={styles.contactMethod}>
                <div className={styles.methodIcon}>
                  <Clock size={24} />
                </div>
                <div className={styles.methodContent}>
                  <h3>Response Time</h3>
                  <p>Within 24 hours</p>
                  <p>Monday - Friday</p>
                </div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <h3>Office Hours</h3>
              <div className={styles.officeHours}>
                <div className={styles.hourRow}>
                  <span>Monday - Friday:</span>
                  <span>9:00 AM - 6:00 PM EST</span>
                </div>
                <div className={styles.hourRow}>
                  <span>Saturday:</span>
                  <span>10:00 AM - 4:00 PM EST</span>
                </div>
                <div className={styles.hourRow}>
                  <span>Sunday:</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <h3>Frequently Asked Questions</h3>
              <p>
                Before reaching out, you might find answers to common questions in our{' '}
                <a href="/faq" className={styles.faqLink}>FAQ section</a>.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Contact Options */}
        <section className={styles.additionalOptions}>
          <h2>Other Ways to Connect</h2>
          <div className={styles.optionsGrid}>
            <div className={styles.optionCard}>
              <div className={styles.optionIcon}>
                <MessageCircle size={32} />
              </div>
              <h3>Live Chat</h3>
              <p>Get instant help from our support team during business hours.</p>
              <button className={styles.optionButton}>Start Chat</button>
            </div>
            
            <div className={styles.optionCard}>
              <div className={styles.optionIcon}>
                <Smartphone size={32} />
              </div>
              <h3>Social Media</h3>
              <p>Follow us for updates, tips, and community discussions.</p>
              <div className={styles.socialLinks}>
                <a href="#" className={styles.socialLink}>Twitter</a>
                <a href="#" className={styles.socialLink}>LinkedIn</a>
                <a href="#" className={styles.socialLink}>Facebook</a>
              </div>
            </div>
            
            <div className={styles.optionCard}>
              <div className={styles.optionIcon}>
                <BookOpen size={32} />
              </div>
              <h3>Documentation</h3>
              <p>Browse our comprehensive guides and tutorials.</p>
              <a href="/docs" className={styles.optionButton}>View Docs</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Contact;
