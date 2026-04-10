import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import authService from '../../services/auth';
import logoSvg from '../../assets/logo.svg';
import './ResetPassword.css';

const ResetPasswordPage = () => {
  const { token } = useParams();

  const [formData, setFormData] = useState({ new_password: '', new_password_confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [invalidLink, setInvalidLink] = useState(!token);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.new_password) {
      newErrors.new_password = 'Password is required';
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.new_password)) {
      newErrors.new_password = 'Password must contain at least one uppercase letter';
    } else if (!/[0-9]/.test(formData.new_password)) {
      newErrors.new_password = 'Password must contain at least one number';
    }
    if (!formData.new_password_confirm) {
      newErrors.new_password_confirm = 'Please confirm your password';
    } else if (formData.new_password !== formData.new_password_confirm) {
      newErrors.new_password_confirm = 'Passwords do not match';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }

    setIsLoading(true);
    setErrors({});

    try {
      await authService.resetPassword(token, formData.new_password, formData.new_password_confirm);
      setSuccess(true);
    } catch (err) {
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error) {
          setErrors({ general: parsed.error });
          if (parsed.error.toLowerCase().includes('invalid') || parsed.error.toLowerCase().includes('expired')) {
            setInvalidLink(true);
          }
        } else {
          setErrors({ general: 'Something went wrong. Please try again.' });
        }
      } catch {
        setErrors({ general: err.message || 'Something went wrong. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (invalidLink) {
    return (
      <div className="rp-page">
        <div className="rp-container">
          <div className="rp-card">
            <div className="rp-brand">
              <img src={logoSvg} alt="NepalTravelAI" className="rp-brand-icon" />
              <span className="rp-brand-name">NepalTravel AI</span>
            </div>
            <div className="rp-invalid">
              <div className="rp-invalid-icon"><AlertCircle size={48} /></div>
              <h2 className="rp-invalid-title">Invalid or expired link</h2>
              <p className="rp-invalid-text">
                This password reset link is invalid or has expired.
                Reset links are valid for 1 hour.
              </p>
              <Link to="/forgot-password" className="rp-action-btn">
                Request a new link
              </Link>
              <Link to="/login" className="rp-back-link">
                <ArrowLeft size={16} />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rp-page">
        <div className="rp-container">
          <div className="rp-card">
            <div className="rp-brand">
              <img src={logoSvg} alt="NepalTravelAI" className="rp-brand-icon" />
              <span className="rp-brand-name">NepalTravel AI</span>
            </div>
            <div className="rp-success">
              <div className="rp-success-icon"><CheckCircle size={48} /></div>
              <h2 className="rp-success-title">Password reset!</h2>
              <p className="rp-success-text">
                Your password has been successfully reset.
                You can now sign in with your new password.
              </p>
              <Link to="/login" className="rp-action-btn">Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rp-page">
      <div className="rp-container">
        <div className="rp-card">
          <div className="rp-brand">
            <img src={logoSvg} alt="NepalTravelAI" className="rp-brand-icon" />
            <span className="rp-brand-name">NepalTravel AI</span>
          </div>

          <div className="rp-header">
            <h2 className="rp-title">Set a new password</h2>
            <p className="rp-subtitle">
              Choose a strong password with at least 8 characters, one uppercase letter, and one number.
            </p>
          </div>

          {errors.general && <div className="rp-alert">{errors.general}</div>}

          <form onSubmit={handleSubmit} className="rp-form">
            <div className="rp-form-group">
              <label htmlFor="new_password" className="rp-label">New Password</label>
              <div className="rp-input-wrapper">
                <Lock className="rp-input-icon" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="new_password"
                  name="new_password"
                  className={`rp-input ${errors.new_password ? 'rp-input-error' : ''}`}
                  placeholder="Min 8 characters"
                  value={formData.new_password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <button type="button" className="rp-toggle" onClick={() => setShowPassword(p => !p)} disabled={isLoading}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.new_password && <span className="rp-error">{errors.new_password}</span>}
            </div>

            <div className="rp-form-group">
              <label htmlFor="new_password_confirm" className="rp-label">Confirm New Password</label>
              <div className="rp-input-wrapper">
                <Lock className="rp-input-icon" size={20} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="new_password_confirm"
                  name="new_password_confirm"
                  className={`rp-input ${errors.new_password_confirm ? 'rp-input-error' : ''}`}
                  placeholder="Repeat your password"
                  value={formData.new_password_confirm}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <button type="button" className="rp-toggle" onClick={() => setShowConfirm(p => !p)} disabled={isLoading}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.new_password_confirm && <span className="rp-error">{errors.new_password_confirm}</span>}
            </div>

            <button type="submit" className="rp-submit-btn" disabled={isLoading}>
              {isLoading
                ? <><Loader2 className="rp-spinner" size={20} /><span>Resetting...</span></>
                : 'Reset Password'
              }
            </button>
          </form>

          <Link to="/login" className="rp-back-link">
            <ArrowLeft size={16} />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
