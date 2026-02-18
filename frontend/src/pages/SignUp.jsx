import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Store, Eye, EyeOff, Check, Mountain, ArrowLeft, Loader2 } from 'lucide-react';
import Navigation from '../components/Navigation';
import { supabase } from '../config/supabase';
import '../components/SignUp.css';

const SignUpPage = () => {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    businessName: '',
    panNumber: '',
    businessAddress: '',
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

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else {
      const parts = formData.fullName.trim().split(/\s+/);
      if (parts.length < 2) newErrors.fullName = 'Please enter first and last name';
      else if (parts.some(p => p.length < 2)) newErrors.fullName = 'Each name must be at least 2 characters';
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

    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    else if (!/^\+?[\d\s\-()]+$/.test(formData.phoneNumber))
      newErrors.phoneNumber = 'Please enter a valid phone number';

    if (selectedRole === 'vendor') {
      if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
      if (!formData.panNumber.trim()) newErrors.panNumber = 'PAN number is required';
      else if (!/^\d{9}$/.test(formData.panNumber)) newErrors.panNumber = 'PAN must be exactly 9 digits';
      if (!formData.businessAddress.trim()) newErrors.businessAddress = 'Business address is required';
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
    setSuccessMessage('');

    try {
      // Step 1: Create the account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          shouldCreateSession: false,
          data: {
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
            role: selectedRole,
            business_name: selectedRole === 'vendor' ? formData.businessName : null,
            pan_number: selectedRole === 'vendor' ? formData.panNumber : null,
            business_address: selectedRole === 'vendor' ? formData.businessAddress : null,
          },
        },
      });

      if (authError) throw authError;

      // Email already exists
      if (authData?.user?.identities?.length === 0) {
        setErrors({ email: 'This email is already registered. Please sign in.' });
        setIsLoading(false);
        return;
      }

      if (!authData?.user) throw new Error('Account creation failed. Please try again.');

      // Step 2: Sign out immediately — kills any temp session Supabase created
      await supabase.auth.signOut();

      // Step 3: Show success, then redirect
      setIsLoading(false);
      setSuccessMessage(`Welcome, ${formData.fullName.split(' ')[0]}! Account created. Redirecting to login...`);

      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);

    } catch (error) {
      console.error('Signup error:', error);
      setIsLoading(false);

      if (error.message?.includes('already registered')) {
        setErrors({ email: 'This email is already registered. Please sign in.' });
      } else if (error.message?.includes('Password')) {
        setErrors({ password: error.message });
      } else {
        setErrors({ general: error.message || 'Something went wrong. Please try again.' });
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
              <Mountain className="header-icon" />
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

            {/* Success message */}
            {successMessage && (
              <div className="alert alert-success">
                ✅ {successMessage}
              </div>
            )}

            {/* General error */}
            {errors.general && (
              <div className="alert alert-error">{errors.general}</div>
            )}

            <form onSubmit={handleSubmit} className="signup-form">

              {/* Full Name */}
              <div className="form-group">
                <label htmlFor="fullName">Full Name <span className="required">*</span></label>
                <input
                  type="text" id="fullName" name="fullName"
                  className={`form-input ${errors.fullName ? 'error' : ''}`}
                  placeholder="e.g., Ram Sharma"
                  value={formData.fullName} onChange={handleInputChange} disabled={isLoading}
                />
                {errors.fullName && <span className="error-text">{errors.fullName}</span>}
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
                <label htmlFor="phoneNumber">Phone Number <span className="required">*</span></label>
                <input
                  type="tel" id="phoneNumber" name="phoneNumber"
                  className={`form-input ${errors.phoneNumber ? 'error' : ''}`}
                  placeholder="+977 98XXXXXXXX"
                  value={formData.phoneNumber} onChange={handleInputChange} disabled={isLoading}
                />
                {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
              </div>

              {/* Vendor-only fields */}
              {selectedRole === 'vendor' && (
                <>
                  <div className="form-group">
                    <label htmlFor="businessName">Business Name <span className="required">*</span></label>
                    <input
                      type="text" id="businessName" name="businessName"
                      className={`form-input ${errors.businessName ? 'error' : ''}`}
                      placeholder="e.g., Himalayan Vehicle Rentals"
                      value={formData.businessName} onChange={handleInputChange} disabled={isLoading}
                    />
                    {errors.businessName && <span className="error-text">{errors.businessName}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="panNumber">PAN Number <span className="required">*</span></label>
                    <input
                      type="text" id="panNumber" name="panNumber"
                      className={`form-input ${errors.panNumber ? 'error' : ''}`}
                      placeholder="123456789" maxLength="9"
                      value={formData.panNumber} onChange={handleInputChange} disabled={isLoading}
                    />
                    {errors.panNumber && <span className="error-text">{errors.panNumber}</span>}
                    <span className="input-hint">9-digit PAN number</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="businessAddress">Business Address <span className="required">*</span></label>
                    <textarea
                      id="businessAddress" name="businessAddress"
                      className={`form-input ${errors.businessAddress ? 'error' : ''}`}
                      placeholder="e.g., Thamel, Kathmandu"
                      rows="2" style={{ resize: 'vertical' }}
                      value={formData.businessAddress} onChange={handleInputChange} disabled={isLoading}
                    />
                    {errors.businessAddress && <span className="error-text">{errors.businessAddress}</span>}
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
              <button type="submit" className="submit-button" disabled={isLoading || !!successMessage}>
                {isLoading ? (
                  <><Loader2 className="spinner" size={20} /><span>Creating Account...</span></>
                ) : (
                  'Create Account'
                )}
              </button>

              <div className="form-footer">
                <p>Already have an account? <Link to="/login">Sign in</Link></p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUpPage;