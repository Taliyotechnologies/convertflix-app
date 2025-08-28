import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  AlertTriangle, 
  CheckCircle,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import styles from './ResetPassword.module.css';

import { useSEO } from '../../../hooks/useSEO';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
 
  useSEO({ noindex: true });
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !token) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await resetPassword(token, formData.password);
      setIsSuccess(true);
    } catch (error: any) {
      setErrors({ general: error.message || 'Password reset failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={styles.resetPassword}>
        <div className={styles.container}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>
              <CheckCircle size={48} />
            </div>
            <h1>Password Reset Successful!</h1>
            <p>Your password has been successfully reset. You can now sign in with your new password.</p>
            <div className={styles.actions}>
              <Link to="/login" className={styles.loginButton}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.resetPassword}>
      <div className={styles.container}>
        <div className={styles.formCard}>
          <div className={styles.header}>
            <div className={styles.icon}>
              <Lock size={32} />
            </div>
            <h1>Reset Your Password</h1>
            <p>Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.resetForm}>
            <div className={styles.formGroup}>
              <label htmlFor="password">New Password</label>
              <div className={styles.passwordInput}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={errors.password ? styles.error : ''}
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <span className={styles.errorText}>{errors.password}</span>}
              <div className={styles.passwordHint}>
                Password must be at least 8 characters with uppercase, lowercase, and number
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <div className={styles.passwordInput}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={errors.confirmPassword ? styles.error : ''}
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
            </div>

            {errors.general && (
              <div className={styles.generalError}>
                <AlertTriangle size={20} />
                {errors.general}
              </div>
            )}

            <button
              type="submit"
              className={`${styles.resetButton} ${isSubmitting ? styles.submitting : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
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
            <h3>Secure Reset</h3>
            <p>
              Your new password will be securely encrypted and stored. 
              Make sure to choose a strong, unique password.
            </p>
          </div>
          
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>⚡</div>
            <h3>Quick Access</h3>
            <p>
              Once you reset your password, you'll be able to access 
              all your ConvertFlix tools immediately.
            </p>
          </div>
          
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>🛡️</div>
            <h3>Account Security</h3>
            <p>
              This reset link is valid for 1 hour only. If you didn't 
              request this reset, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
