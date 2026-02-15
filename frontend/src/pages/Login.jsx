import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mountain, Mail, Lock } from 'lucide-react';
import Navigation from '../components/Navigation';
import '../components/Login.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsLoading(true);
      
      // TODO: Replace with actual API call
      console.log('Login attempt:', formData);
      
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        
        // Mock authentication - check if user exists
        // In real app, this would be an API response
        if (formData.email && formData.password) {
          // Store auth token (in real app)
          localStorage.setItem('auth_token', 'mock_token_' + Date.now());
          localStorage.setItem('user_email', formData.email);
          
          alert('Login successful!');
          navigate('/chat'); // Redirect to chat/dashboard
        } else {
          setErrors({ general: 'Invalid email or password' });
        }
      }, 1000);
    }
  };

  return (
    <div className="login-page">
      <Navigation />
      
      <div className="login-container">
        <div className="login-content">
          {/* Left Side - Branding */}
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

          </div>

          {/* Right Side - Login Form */}
          <div className="login-form-wrapper fade-in-up delay-1">
            <div className="login-form-container">
              <div className="form-header">
                <h2 className="form-title">Sign in to your account</h2>
                <p className="form-subtitle">Continue your Nepal adventure</p>
              </div>

              {errors.general && (
                <div className="alert alert-error">
                  {errors.general}
                </div>
              )}

              <form onSubmit={handleSubmit} className="login-form">
                {/* Email */}
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" size={20} />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className={`form-input ${errors.email ? 'input-error' : ''}`}
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                {/* Password */}
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      className={`form-input ${errors.password ? 'input-error' : ''}`}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="form-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                    <span>Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="forgot-link">
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>

                {/* Divider */}
                <div className="divider">
                  <span>or</span>
                </div>

                {/* Social Login (Optional) */}
                <div className="social-login">
                  <button type="button" className="social-btn google-btn" disabled={isLoading}>
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </div>

                {/* Sign Up Link */}
                <div className="form-footer">
                  <p>
                    Don't have an account? <Link to="/signup">Create one</Link>
                  </p>
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