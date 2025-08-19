import React, { useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import styles from '../Login/Login.module.css';

const ResetPassword: React.FC = () => {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => search.get('token') || '', [search]);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const API_BASE: string = (import.meta as any).env?.VITE_API_BASE_URL || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    if (!token) {
      setError('Invalid or missing reset token');
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        setMessage('Password reset successful. You can now sign in.');
        // After short delay, redirect to login
        setTimeout(() => navigate('/login'), 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || 'Reset link is invalid or expired');
      }
    } catch (e) {
      console.error('Reset-password error:', e);
      setError('Unable to reset password right now. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Reset Password</h2>
          <p className={styles.subtitle}>Enter a new password for your account</p>
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
            <label htmlFor="password" className={styles.label}>New Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="Enter new password"
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirm" className={styles.label}>Confirm Password</label>
            <input
              type="password"
              id="confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={styles.input}
              placeholder="Confirm new password"
              required
              disabled={isLoading}
            />
          </div>

          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--accent-primary)' }}>Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
