import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mountain, Mail, Lock } from 'lucide-react';
import Navigation from '../components/Navigation';
import { supabase } from '../config/supabase';
import { Loader2 } from 'lucide-react';
import '../components/Login.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      console.log('Attempting login...');

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        console.error('Login error:', authError);
        throw authError;
      }

      console.log('Login successful:', authData);

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw new Error('Could not load user profile');
      }

      console.log('User profile:', profile);

      const userData = {
        id: authData.user.id,
        email: authData.user.email,
        fullName: profile.full_name,
        role: profile.role,
        isVendorApproved: profile.is_vendor_approved,
      };
      localStorage.setItem('user', JSON.stringify(userData));

      // CORRECTED REDIRECT LOGIC
      if (profile.role === 'tourist') {
        console.log('Redirecting tourist to homepage');
        navigate('/');
      } else if (profile.role === 'vendor') {
        if (profile.is_vendor_approved) {
          console.log('Redirecting approved vendor to dashboard');
          navigate('/vendor/dashboard');
        } else {
          console.log('Vendor pending approval');
          navigate('/vendor/pending');
        }
      } else {
        // Fallback
        navigate('/');
      }

    } catch (error) {
      console.error('Login error:', error);

      if (error.message?.includes('Invalid login credentials')) {
        setErrors({
          general: 'Invalid email or password. Please try again.'
        });
      } else if (error.message?.includes('Email not confirmed')) {
        setErrors({
          general: 'Please verify your email address before signing in.'
        });
      } else {
        setErrors({
          general: error.message || 'An error occurred during login. Please try again.'
        });
      }
    } finally {
      setIsLoading(false);
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

            <div className="branding-testimonial">
              <p className="testimonial-text">
                "NepalTravelAI made planning my Everest Base Camp trek incredibly easy.
                The AI recommendations were spot-on!"
              </p>
              <div className="testimonial-author">
                - Sarah M., Trekker from USA
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
                  {isLoading ? (
                    <>
                      <Loader2 className="spinner" size={20} />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>

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