import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import authService from '../../services/auth';
import logoSvg from '../../assets/logo.svg';
import './ForgotPassword.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setIsLoading(true);
    setError('');

    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fp-page">
      <div className="fp-container">

        <div className="fp-card">
          <div className="fp-brand">
            <img src={logoSvg} alt="NepalTravelAI" className="fp-brand-icon" />
            <span className="fp-brand-name">NepalTravel AI</span>
          </div>

          {submitted ? (
            <div className="fp-success">
              <div className="fp-success-icon">
                <CheckCircle size={48} />
              </div>
              <h2 className="fp-success-title">Check your inbox</h2>
              <p className="fp-success-text">
                We've sent a password reset link to <strong>{email}</strong>.
                Check your inbox and follow the instructions.
              </p>
              <p className="fp-success-note">
                Didn't receive it? Check your spam folder or{' '}
                <button
                  className="fp-resend-btn"
                  onClick={() => setSubmitted(false)}
                >
                  try again
                </button>
                .
              </p>
              <Link to="/login" className="fp-back-link">
                <ArrowLeft size={16} />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="fp-header">
                <h2 className="fp-title">Forgot your password?</h2>
                <p className="fp-subtitle">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {error && <div className="fp-alert">{error}</div>}

              <form onSubmit={handleSubmit} className="fp-form">
                <div className="fp-form-group">
                  <label htmlFor="email" className="fp-label">Email Address</label>
                  <div className="fp-input-wrapper">
                    <Mail className="fp-input-icon" size={20} />
                    <input
                      type="email"
                      id="email"
                      className={`fp-input ${error ? 'fp-input-error' : ''}`}
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                </div>

                <button type="submit" className="fp-submit-btn" disabled={isLoading}>
                  {isLoading
                    ? <><Loader2 className="fp-spinner" size={20} /><span>Sending...</span></>
                    : 'Send Reset Link'
                  }
                </button>
              </form>

              <Link to="/login" className="fp-back-link">
                <ArrowLeft size={16} />
                Back to Sign In
              </Link>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default ForgotPasswordPage;
