import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Store, Eye, EyeOff, Check, Mountain, ArrowLeft } from 'lucide-react';
import Navigation from '../components/Navigation';
import '../components/SignUp.css';

const SignUpPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    businessName: '',
    businessLicense: '',
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
        'Access travel community'
      ]
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
        'Track earnings and analytics'
      ]
    }
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setStep(2);
  };

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

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, and number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (selectedRole === 'vendor') {
      if (!formData.businessName.trim()) {
        newErrors.businessName = 'Business name is required';
      }
      if (!formData.businessLicense.trim()) {
        newErrors.businessLicense = 'Business license number is required';
      }
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      console.log('Form submitted:', { ...formData, role: selectedRole });
      
      setTimeout(() => {
        alert('Account created successfully! Please check your email for verification.');
        navigate('/login');
      }, 500);
    }
  };

  return (
    <div className="signup-page">
      <Navigation />
      
      <div className="signup-container">
        {step === 1 && (
          <div className="role-selection">
            <div className="signup-header">
              <Mountain className="header-icon" />
              <h1 className="signup-title">Join NepalTravel AI</h1>
              <p className="signup-subtitle">Choose your account type to get started</p>
            </div>

            <div className="roles-grid">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="role-card"
                  onClick={() => handleRoleSelect(role.id)}
                >
                  <div className="role-icon-box">
                    <role.icon className="role-icon" />
                  </div>
                  
                  <h3 className="role-title">{role.title}</h3>
                  <p className="role-description">{role.description}</p>
                  
                  <ul className="role-features-list">
                    {role.features.map((feature, idx) => (
                      <li key={idx}>
                        <Check size={18} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button className="role-button">
                    Get Started
                  </button>
                </div>
              ))}
            </div>

            <div className="signup-footer">
              <p>Already have an account? <Link to="/login">Sign in</Link></p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="registration-form">
            <button className="back-btn" onClick={() => setStep(1)}>
              <ArrowLeft size={20} />
              <span>Back to account selection</span>
            </button>

            <div className="form-header">
              <div className="role-badge">
                {React.createElement(roles.find(r => r.id === selectedRole)?.icon, { size: 24 })}
                <span>Sign up as {roles.find(r => r.id === selectedRole)?.title}</span>
              </div>
              <h2 className="form-title">Create your account</h2>
              <p className="form-subtitle">Fill in your details to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="signup-form">
              <div className="form-group">
                <label htmlFor="fullName">Full Name <span className="required">*</span></label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  className={`form-input ${errors.fullName ? 'error' : ''}`}
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                />
                {errors.fullName && <span className="error-text">{errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address <span className="required">*</span></label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number <span className="required">*</span></label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  className={`form-input ${errors.phoneNumber ? 'error' : ''}`}
                  placeholder="+977 XXX XXXX"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />
                {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
              </div>

              {selectedRole === 'vendor' && (
                <>
                  <div className="form-group">
                    <label htmlFor="businessName">Business Name <span className="required">*</span></label>
                    <input
                      type="text"
                      id="businessName"
                      name="businessName"
                      className={`form-input ${errors.businessName ? 'error' : ''}`}
                      placeholder="Your company or business name"
                      value={formData.businessName}
                      onChange={handleInputChange}
                    />
                    {errors.businessName && <span className="error-text">{errors.businessName}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="businessLicense">NATTA License Number <span className="required">*</span></label>
                    <input
                      type="text"
                      id="businessLicense"
                      name="businessLicense"
                      className={`form-input ${errors.businessLicense ? 'error' : ''}`}
                      placeholder="Your NATTA registration number"
                      value={formData.businessLicense}
                      onChange={handleInputChange}
                    />
                    {errors.businessLicense && <span className="error-text">{errors.businessLicense}</span>}
                    <span className="input-hint">We verify all vendors with NATTA</span>
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="password">Password <span className="required">*</span></label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <span className="error-text">{errors.password}</span>}
                <span className="input-hint">At least 8 characters with uppercase, lowercase, and number</span>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password <span className="required">*</span></label>
                <div className="password-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                  />
                  <span>
                    I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
                  </span>
                </label>
                {errors.agreeToTerms && <span className="error-text">{errors.agreeToTerms}</span>}
              </div>

              <button type="submit" className="submit-button">
                Create Account
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