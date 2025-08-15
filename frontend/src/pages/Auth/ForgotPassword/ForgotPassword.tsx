import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  CheckCircle, 
  Clock, 
  Mail,
  AlertTriangle
} from 'lucide-react';
import styles from './ForgotPassword.module.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={styles.forgotPassword}>
        <div className={styles.container}>
          <div className={styles.successCard}>
                          <CheckCircle size={20} />
            <h1>Check Your Email</h1>
            <p>
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <div className={styles.instructions}>
              <h3>What to do next:</h3>
              <ol>
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the password reset link in the email</li>
                <li>Create a new password for your account</li>
                <li>Sign in with your new password</li>
              </ol>
            </div>
            <div className={styles.actions}>
              <Link to="/login" className={styles.backToLogin}>
                Back to Login
              </Link>
              <button 
                onClick={() => setIsSubmitted(false)}
                className={styles.resendButton}
              >
                Resend Email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.forgotPassword}>
      <div className={styles.container}>
        <div className={styles.formCard}>
          <div className={styles.header}>
            <h1>Forgot Password?</h1>
            <p>No worries! Enter your email and we'll send you reset instructions.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.resetForm}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className={error ? styles.error : ''}
              />
              {error && <span className={styles.errorText}>{error}</span>}
            </div>

            <button
              type="submit"
              className={`${styles.resetButton} ${isSubmitting ? styles.submitting : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className={styles.backToLogin}>
            <Link to="/login" className={styles.loginLink}>
              ← Back to Login
            </Link>
          </div>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>🔐</div>
            <h3>Secure Reset Process</h3>
            <p>
              Our password reset process is completely secure. We use industry-standard 
              encryption to protect your account information.
            </p>
          </div>
          
          <div className={styles.infoCard}>
            <Clock size={20} />
            <h3>Quick & Easy</h3>
            <p>
              Get back to optimizing your files in minutes. The reset link expires 
              in 1 hour for your security.
            </p>
          </div>
          
          <div className={styles.infoCard}>
            <Mail size={20} />
            <h3>Check Your Inbox</h3>
            <p>
              We'll send you a secure link via email. Make sure to check your 
              spam folder if you don't see it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
