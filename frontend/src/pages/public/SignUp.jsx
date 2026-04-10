import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Store, Eye, EyeOff, Check, ArrowLeft, Loader2 } from 'lucide-react';
import Navigation from '../../components/shared/Navigation';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/auth';
import logoSvg from '../../assets/logo.svg';
import './SignUp.css';

const SignUpPage = () => {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone_number: '',
    business_name: '',
    pan_number: '',
    business_address: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});

  const roles = [
    {
      id: 'tourist',
      title: 'Tourist',
      icon: User,
      description: 'Explore Nepal with AI-powered trip planning',
      features: [
        'Create personalized itineraries',
        'Book NATTA-approved vehicles',
        'Save and share your trips',
        'Access travel community',
      ],
    },
    {
      id: 'vendor',
      title: 'Vehicle Vendor',
      icon: Store,
      description: 'Grow your vehicle rental business',
      features: [
        'List your fleet of vehicles',
        'Receive booking requests',
        'Manage availability calendar',
        'Track earnings and analytics',
      ],
    },
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setStep(2);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else {
      const parts = formData.full_name.trim().split(/\s+/);
      if (parts.length < 2) newErrors.full_name = 'Please enter first and last name';
      else if (parts.some(p => p.length < 2)) newErrors.full_name = 'Each name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!emailRegex.test(formData.email)) newErrors.email = 'Please enter a valid email';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password))
      newErrors.password = 'Password must include uppercase, lowercase, and number';

    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    if (!formData.phone_number) newErrors.phone_number = 'Phone number is required';
    else if (!/^\+?[\d\s\-()]+$/.test(formData.phone_number))
      newErrors.phone_number = 'Please enter a valid phone number';

    if (selectedRole === 'vendor') {
      if (!formData.business_name.trim()) newErrors.business_name = 'Business name is required';
      if (!formData.pan_number.trim()) newErrors.pan_number = 'PAN number is required';
      else if (!/^\d{9}$/.test(formData.pan_number)) newErrors.pan_number = 'PAN must be exactly 9 digits';
      if (!formData.business_address.trim()) newErrors.business_address = 'Business address is required';
    }

    if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Build payload — matches Django backend field names
      const userData = {
        email: formData.email,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        role: selectedRole,
        ...(selectedRole === 'vendor' && {
          business_name: formData.business_name,
          pan_number: formData.pan_number,
          business_address: formData.business_address,
        }),
      };

      // Register and store tokens, but don't update AuthContext yet
      // so GuestRoute won't redirect before the success message shows.
      const newUser = await authService.register(userData);

      // Show success message
      setShowSuccess(true);

      // After a brief delay, update context and navigate to dashboard
      setTimeout(() => {
        updateUser(newUser);

        if (newUser.is_staff) navigate('/admin/dashboard', { replace: true });
        else if (newUser.role === 'vendor') navigate(newUser.is_vendor_approved ? '/vendor/dashboard' : '/vendor/pending', { replace: true });
        else navigate('/tourist/dashboard', { replace: true });
      }, 2000);

    } catch (error) {
      console.error('Signup error:', error);
      setIsLoading(false);

      const errorMsg = error.message || 'Something went wrong. Please try again.';

      if (errorMsg.toLowerCase().includes('email') && errorMsg.toLowerCase().includes('exist')) {
        setErrors({ email: 'This email is already registered. Please sign in.' });
      } else if (errorMsg.toLowerCase().includes('password')) {
        setErrors({ password: errorMsg });
      } else if (errorMsg.toLowerCase().includes('email:')) {
        setErrors({ email: errorMsg.replace('email: ', '') });
      } else if (errorMsg.toLowerCase().includes('full_name:')) {
        setErrors({ full_name: errorMsg.replace('full_name: ', '') });
      } else if (errorMsg.toLowerCase().includes('phone_number:')) {
        setErrors({ phone_number: errorMsg.replace('phone_number: ', '') });
      } else if (errorMsg.toLowerCase().includes('business_name:')) {
        setErrors({ business_name: errorMsg.replace('business_name: ', '') });
      } else if (errorMsg.toLowerCase().includes('pan_number:')) {
        setErrors({ pan_number: errorMsg.replace('pan_number: ', '') });
      } else if (errorMsg.toLowerCase().includes('business_address:')) {
        setErrors({ business_address: errorMsg.replace('business_address: ', '') });
      } else {
        setErrors({ general: errorMsg });
      }
    }
  };

  return (
    <div className="signup-page">
      <Navigation />

      <div className="signup-container">

        {/* STEP 1 — Role Selection */}
        {step === 1 && (
          <div className="role-selection">
            <div className="signup-header">
              <img src={logoSvg} alt="NepalTravelAI" className="header-icon" />
              <h1 className="signup-title">Join NepalTravel AI</h1>
              <p className="signup-subtitle">Choose your account type to get started</p>
            </div>

            <div className="roles-grid">
              {roles.map((role) => (
                <div key={role.id} className="role-card" onClick={() => handleRoleSelect(role.id)}>
                  <div className="role-icon-box"><role.icon className="role-icon" /></div>
                  <h3 className="role-title">{role.title}</h3>
                  <p className="role-description">{role.description}</p>
                  <ul className="role-features-list">
                    {role.features.map((feature, idx) => (
                      <li key={idx}><Check size={18} /><span>{feature}</span></li>
                    ))}
                  </ul>
                  <button className="role-button">Get Started</button>
                </div>
              ))}
            </div>

            <div className="signup-footer">
              <p>Already have an account? <Link to="/login">Sign in</Link></p>
            </div>
          </div>
        )}

        {/* STEP 2 — Registration Form */}
        {step === 2 && (
          <div className="registration-form">
            <button className="back-btn" onClick={() => setStep(1)} disabled={isLoading}>
              <ArrowLeft size={20} /><span>Back</span>
            </button>

            <div className="form-header">
              <div className="role-badge">
                {React.createElement(roles.find(r => r.id === selectedRole)?.icon, { size: 24 })}
                <span>Sign up as {roles.find(r => r.id === selectedRole)?.title}</span>
              </div>
              <h2 className="form-title">Create your account</h2>
              <p className="form-subtitle">Fill in your details to get started</p>
            </div>

            {errors.general && (
              <div className="alert alert-error">{errors.general}</div>
            )}

            <form onSubmit={handleSubmit} className="signup-form">

              {/* Full Name */}
              <div className="form-group">
                <label htmlFor="full_name">Full Name <span className="required">*</span></label>
                <input
                  type="text" id="full_name" name="full_name"
                  className={`form-input ${errors.full_name ? 'error' : ''}`}
                  placeholder="e.g., Ram Sharma"
                  value={formData.full_name} onChange={handleInputChange} disabled={isLoading}
                />
                {errors.full_name && <span className="error-text">{errors.full_name}</span>}
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="email">Email Address <span className="required">*</span></label>
                <input
                  type="email" id="email" name="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="your.email@example.com"
                  value={formData.email} onChange={handleInputChange} disabled={isLoading}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              {/* Phone */}
              <div className="form-group">
                <label htmlFor="phone_number">Phone Number <span className="required">*</span></label>
                <input
                  type="tel" id="phone_number" name="phone_number"
                  className={`form-input ${errors.phone_number ? 'error' : ''}`}
                  placeholder="+977 98XXXXXXXX"
                  value={formData.phone_number} onChange={handleInputChange} disabled={isLoading}
                />
                {errors.phone_number && <span className="error-text">{errors.phone_number}</span>}
              </div>

              {/* Vendor-only fields */}
              {selectedRole === 'vendor' && (
                <>
                  <div className="form-group">
                    <label htmlFor="business_name">Business Name <span className="required">*</span></label>
                    <input
                      type="text" id="business_name" name="business_name"
                      className={`form-input ${errors.business_name ? 'error' : ''}`}
                      placeholder="e.g., Himalayan Vehicle Rentals"
                      value={formData.business_name} onChange={handleInputChange} disabled={isLoading}
                    />
                    {errors.business_name && <span className="error-text">{errors.business_name}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="pan_number">PAN Number <span className="required">*</span></label>
                    <input
                      type="text" id="pan_number" name="pan_number"
                      className={`form-input ${errors.pan_number ? 'error' : ''}`}
                      placeholder="123456789" maxLength="9"
                      value={formData.pan_number} onChange={handleInputChange} disabled={isLoading}
                    />
                    {errors.pan_number && <span className="error-text">{errors.pan_number}</span>}
                    <span className="input-hint">9-digit PAN number</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="business_address">Business Address <span className="required">*</span></label>
                    <textarea
                      id="business_address" name="business_address"
                      className={`form-input ${errors.business_address ? 'error' : ''}`}
                      placeholder="e.g., Thamel, Kathmandu"
                      rows="2"
                      value={formData.business_address} onChange={handleInputChange} disabled={isLoading}
                    />
                    {errors.business_address && <span className="error-text">{errors.business_address}</span>}
                  </div>
                </>
              )}

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password">Password <span className="required">*</span></label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'} id="password" name="password"
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="Create a strong password"
                    value={formData.password} onChange={handleInputChange} disabled={isLoading}
                  />
                  <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(p => !p)} disabled={isLoading}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <span className="error-text">{errors.password}</span>}
                <span className="input-hint">Min 8 chars, with uppercase, lowercase, and number</span>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password <span className="required">*</span></label>
                <div className="password-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword"
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword} onChange={handleInputChange} disabled={isLoading}
                  />
                  <button type="button" className="password-toggle-btn" onClick={() => setShowConfirmPassword(p => !p)} disabled={isLoading}>
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>

              {/* Terms */}
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox" name="agreeToTerms"
                    checked={formData.agreeToTerms} onChange={handleInputChange} disabled={isLoading}
                  />
                  <span>I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link></span>
                </label>
                {errors.agreeToTerms && <span className="error-text">{errors.agreeToTerms}</span>}
              </div>

              {/* Submit */}
              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading
                  ? <><Loader2 className="spinner" size={20} /><span>Creating Account...</span></>
                  : 'Create Account'
                }
              </button>

              <div className="form-footer">
                <p>Already have an account? <Link to="/login">Sign in</Link></p>
              </div>
            </form>

            {/* Success Message */}
            {showSuccess && (
              <div className="success-overlay">
                <div className="success-message">
                  <div className="success-icon">✓</div>
                  <h3>Account Created Successfully!</h3>
                  <p>Welcome to NepalTravel AI. Redirecting to your dashboard...</p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default SignUpPage;