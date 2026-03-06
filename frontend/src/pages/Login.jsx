import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mountain, Mail, Lock, Loader2 } from 'lucide-react';
import Navigation from '../components/Navigation';
import authService from '../services/auth';
import './Login.css';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!emailRegex.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      console.log('🔐 Starting login...');

      // Attempt to log in the user
      const user = await authService.login(formData.email, formData.password);

      console.log('✅ Auth successful');
      console.log('📋 User:', user);
      console.log('📋 Role:', user.role);

      // Redirect based on role
      if (user.role === 'vendor') {
        console.log('🚚 User is VENDOR');
        if (user.isVendorApproved === true) {
          console.log('✅ Vendor APPROVED → redirecting to /vendor/dashboard');
          navigate('/vendor/dashboard');
        } else {
          console.log('⏳ Vendor NOT approved → redirecting to /vendor/pending');
          navigate('/vendor/pending');
        }
      } else if (user.role === 'tourist') {
        console.log('🧭 User is TOURIST → redirecting to homepage');
        navigate('/');
      } else {
        console.log('❓ Unknown role:', user.role, '→ redirecting to homepage');
        navigate('/');
      }

    } catch (error) {
      console.error('❌ Login error:', error);
      setIsLoading(false);

      if (error.message?.toLowerCase().includes('invalid') || error.message?.toLowerCase().includes('credentials') || error.message?.toLowerCase().includes('password')) {
        setErrors({ general: 'Wrong email or password. Please try again.' });
      } else if (error.message?.toLowerCase().includes('not confirmed') || error.message?.toLowerCase().includes('verify')) {
        setErrors({ general: 'Please verify your email before signing in.' });
      } else {
        setErrors({ general: error.message || 'Something went wrong. Please try again.' });
      }
    }
  };

  return (
    <div className="login-page">
      <Navigation />

      <div className="login-container">
        <div className="login-content">

          {/* Left — Branding */}
          <div className="login-branding fade-in-up">
            <div className="branding-header">
              <Mountain className="branding-icon" />
              <h1 className="branding-title">
                Welcome Back to
                <span className="branding-highlight"> NepalTravel AI</span>
              </h1>
            </div>
            <p className="branding-description">
              Your intelligent companion for exploring the Himalayas.
              Plan personalized itineraries and discover NATTA-approved vehicles.
            </p>
            <div className="branding-features">
              <div className="branding-feature">
                <div className="feature-number">10K+</div>
                <div className="feature-label">Itineraries Created</div>
              </div>
              <div className="branding-feature">
                <div className="feature-number">500+</div>
                <div className="feature-label">Vehicles Available</div>
              </div>
              <div className="branding-feature">
                <div className="feature-number">98%</div>
                <div className="feature-label">Satisfaction Rate</div>
              </div>
            </div>
            <div className="branding-testimonial">
              <p className="testimonial-text">
                "NepalTravelAI made planning my Everest Base Camp trek incredibly easy.
                The AI recommendations were spot-on!"
              </p>
              <div className="testimonial-author">- Sarah M., Trekker from USA</div>
            </div>
          </div>

          {/* Right — Login Form */}
          <div className="login-form-wrapper fade-in-up delay-1">
            <div className="login-form-container">
              <div className="form-header">
                <h2 className="form-title">Sign in to your account</h2>
                <p className="form-subtitle">Continue your Nepal adventure</p>
              </div>

              {errors.general && (
                <div className="alert alert-error">{errors.general}</div>
              )}

              <form onSubmit={handleSubmit} className="login-form">

                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" size={20} />
                    <input
                      type="email" id="email" name="email"
                      className={`form-input ${errors.email ? 'input-error' : ''}`}
                      placeholder="your.email@example.com"
                      value={formData.email} onChange={handleInputChange} disabled={isLoading}
                    />
                  </div>
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'} id="password" name="password"
                      className={`form-input ${errors.password ? 'input-error' : ''}`}
                      placeholder="Enter your password"
                      value={formData.password} onChange={handleInputChange} disabled={isLoading}
                    />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(p => !p)} disabled={isLoading}>
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                <div className="form-options">
                  <label className="checkbox-label">
                    <input type="checkbox" name="rememberMe" checked={formData.rememberMe} onChange={handleInputChange} disabled={isLoading} />
                    <span>Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
                </div>

                <button type="submit" className="submit-btn" disabled={isLoading}>
                  {isLoading
                    ? <><Loader2 className="spinner" size={20} /><span>Signing in...</span></>
                    : 'Sign In'
                  }
                </button>

                <div className="form-footer">
                  <p>Don't have an account? <Link to="/signup">Create one</Link></p>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;