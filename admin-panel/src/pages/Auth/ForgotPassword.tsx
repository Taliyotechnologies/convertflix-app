import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../Login/Login.module.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('harshbudhauliya882@gmail.com');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const API_BASE: string = (import.meta as any).env?.VITE_API_BASE_URL || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        // Still show generic message to avoid leaking user existence
        console.warn('Forgot-password request failed with status', res.status);
      }
      setMessage('If an account exists, a reset email has been sent. Please check your inbox.');
    } catch (e) {
      console.error('Forgot-password error:', e);
      setError('Unable to send reset email right now. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Forgot Password</h2>
          <p className={styles.subtitle}>Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          {message && (
            <div style={{
              background: 'rgba(34,197,94,0.1)',
              color: 'var(--accent-success, #22c55e)',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(34,197,94,0.2)'
            }}>
              {message}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="you@example.com"
              required
              disabled={isLoading}
            />
          </div>

          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--accent-primary)' }}>Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
