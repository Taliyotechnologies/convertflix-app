import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import GoogleOAuth from '../../../components/GoogleOAuth/GoogleOAuth';
import { 
  AlertTriangle, 
  Shield, 
  Zap, 
  Globe
} from 'lucide-react';
import styles from './Login.module.css';
import { useSEO } from '../../../hooks/useSEO';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
 
  useSEO({ noindex: true });

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (error) {
      setErrors({ general: 'Invalid email or password. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = () => {
    navigate('/');
  };

  const handleGoogleError = (error: string) => {
    setErrors({ general: error });
  };

  return (
    <div className={styles.login}>
      <div className={styles.container}>
        <div className={styles.formCard}>
          <div className={styles.header}>
            <h1>Welcome Back</h1>
            <p>Sign in to your ConvertFlix account</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? styles.error : ''}
                placeholder="Enter your email"
              />
              {errors.email && <span className={styles.errorText}>{errors.email}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? styles.error : ''}
                placeholder="Enter your password"
              />
              {errors.password && <span className={styles.errorText}>{errors.password}</span>}
            </div>

            {errors.general && (
              <div className={styles.generalError}>
                <AlertTriangle size={20} />
                {errors.general}
              </div>
            )}

            <div className={styles.formOptions}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" />
                <span className={styles.checkboxText}>Remember me</span>
              </label>
              <Link to="/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className={`${styles.loginButton} ${isSubmitting ? styles.submitting : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <GoogleOAuth
            mode="login"
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />

          <div className={styles.signupPrompt}>
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className={styles.signupLink}>
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <Shield size={32} />
            </div>
            <h3>Secure & Private</h3>
            <p>
              Your data is encrypted and never shared with third parties. 
              We prioritize your privacy above all else.
            </p>
          </div>
          
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <Zap size={32} />
            </div>
            <h3>Fast & Reliable</h3>
            <p>
              Access your files instantly from anywhere. Our platform is 
              designed for speed and reliability.
            </p>
          </div>
          
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <Globe size={32} />
            </div>
            <h3>Access Anywhere</h3>
            <p>
              Use ConvertFlix on any device, anywhere in the world. 
              Your tools are always within reach.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
