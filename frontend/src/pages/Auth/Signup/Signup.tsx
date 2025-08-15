import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import GoogleOAuth from '../../../components/GoogleOAuth/GoogleOAuth';
import { 
  AlertTriangle, 
  Rocket, 
  HardDrive, 
  Shield
} from 'lucide-react';
import styles from './Signup.module.css';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

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
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await signup(formData.name, formData.email, formData.password);
      navigate('/');
    } catch (error) {
      setErrors({ general: 'Account creation failed. Please try again.' });
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
    <div className={styles.signup}>
      <div className={styles.container}>
        <div className={styles.formCard}>
          <div className={styles.header}>
            <h1>Create Account</h1>
            <p>Join ConvertFlix and start optimizing your files today</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.signupForm}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={errors.name ? styles.error : ''}
                placeholder="Enter your full name"
              />
              {errors.name && <span className={styles.errorText}>{errors.name}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? styles.error : ''}
                placeholder="Enter your email address"
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
                placeholder="Create a strong password"
              />
              {errors.password && <span className={styles.errorText}>{errors.password}</span>}
              <div className={styles.passwordHint}>
                Password must be at least 8 characters with uppercase, lowercase, and number
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={errors.confirmPassword ? styles.error : ''}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
            </div>

            {errors.general && (
              <div className={styles.generalError}>
                <AlertTriangle size={20} />
                {errors.general}
              </div>
            )}

            <div className={styles.termsAgreement}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" required />
                <span className={styles.checkboxText}>
                  I agree to the{' '}
                  <Link to="/terms" className={styles.termsLink}>Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className={styles.termsLink}>Privacy Policy</Link>
                </span>
              </label>
            </div>

            <button
              type="submit"
              className={`${styles.signupButton} ${isSubmitting ? styles.submitting : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <GoogleOAuth
            mode="signup"
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />

          <div className={styles.loginPrompt}>
            <p>
              Already have an account?{' '}
              <Link to="/login" className={styles.loginLink}>
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <Rocket size={32} />
            </div>
            <h3>Get Started Fast</h3>
            <p>
              Create your account in seconds and immediately access all our 
              file optimization tools. No waiting, no delays.
            </p>
          </div>
          
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <HardDrive size={32} />
            </div>
            <h3>Unlimited Access</h3>
            <p>
              Enjoy unlimited file processing with no hidden fees or restrictions. 
              Process as many files as you need, whenever you need.
            </p>
          </div>
          
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <Shield size={32} />
            </div>
            <h3>100% Secure</h3>
            <p>
              Your files are processed locally and never stored on our servers. 
              Complete privacy and security guaranteed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
