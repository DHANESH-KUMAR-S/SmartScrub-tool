import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../UI/Button';
import styles from './AuthModal.module.css';

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        const result = await login({
          email: formData.email,
          password: formData.password
        });
        
        if (result.success) {
          setSuccess('Login successful! Welcome back! 🎉');
          setTimeout(() => {
            onClose();
            navigate('/dashboard');
          }, 1500);
        } else {
          setError(result.error);
        }
      } else {
        // Registration validation
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        const result = await register({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName
        });

        if (result.success) {
          setSuccess('Account created successfully! Please login. ✨');
          setIsLogin(true);
          setFormData({ email: formData.email, password: '', fullName: '', confirmPassword: '' });
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ email: '', password: '', fullName: '', confirmPassword: '' });
    setError('');
    setSuccess('');
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <span className={styles.closeIcon}>✕</span>
        </button>

        <div className={styles.modalHeader}>
          <div className={styles.logoSection}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>✨</span>
              <span className={styles.logoText}>SmartScrub</span>
            </div>
            <p className={styles.subtitle}>
              {isLogin ? 'Welcome back! 👋' : 'Join the data revolution! 🚀'}
            </p>
          </div>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.tabSwitcher}>
            <button
              className={`${styles.tab} ${isLogin ? styles.active : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Sign In
            </button>
            <button
              className={`${styles.tab} ${!isLogin ? styles.active : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {!isLogin && (
              <div className={styles.inputGroup}>
                <label className={styles.label}>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Enter your full name"
                  required={!isLogin}
                />
              </div>
            )}

            <div className={styles.inputGroup}>
              <label className={styles.label}>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Enter your password"
                required
              />
            </div>

            {!isLogin && (
              <div className={styles.inputGroup}>
                <label className={styles.label}>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Confirm your password"
                  required={!isLogin}
                />
              </div>
            )}

            {error && (
              <div className={styles.errorMessage}>
                <span className={styles.errorIcon}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className={styles.successMessage}>
                <span className={styles.successIcon}>✅</span>
                <span>{success}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="large"
              loading={loading}
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <div className={styles.switchMode}>
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={toggleMode}
                className={styles.switchButton}
              >
                {isLogin ? 'Sign up here' : 'Sign in here'}
              </button>
            </p>
          </div>

          <div className={styles.guestOption}>
            <div className={styles.divider}>
              <span>or</span>
            </div>
            <Button
              variant="ghost"
              size="large"
              onClick={() => {
                onClose();
                navigate('/dashboard');
              }}
              className={styles.guestButton}
            >
              Try without sign-in 👤
            </Button>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <p className={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;