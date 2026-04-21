import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/auth';
import Navigation from '../../components/shared/Navigation';
import Footer from '../../components/shared/Footer';
import {
  User, Mail, MapPin, Lock, Eye, EyeOff,
  ArrowLeft, Loader2, CheckCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import './EditProfile.css';

const EditProfile = () => {
  const { user, updateUser, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    full_name:        user?.full_name        || '',
    email:            user?.email            || '',
    phone_number:     user?.phone_number     || '',
    business_address: user?.business_address || '',
  });

  // Force-fetch fresh profile from API on mount so phone_number (and other
  // fields added after the user last logged in) are always up to date.
  useEffect(() => {
    refreshProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync form fields whenever the user object updates
  useEffect(() => {
    if (user) {
      setProfileData({
        full_name:        user.full_name        || '',
        email:            user.email            || '',
        phone_number:     user.phone_number     || '',
        business_address: user.business_address || '',
      });
    }
  }, [user]);

  const [pwData, setPwData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirm: '',
  });

  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwOpen, setPwOpen] = useState(false);

  const [profileErrors, setProfileErrors] = useState({});
  const [pwErrors, setPwErrors] = useState({});

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const [profileSuccess, setProfileSuccess] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  /* ---- Profile form ---- */
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    if (profileErrors[name]) setProfileErrors(prev => ({ ...prev, [name]: '' }));
    setProfileSuccess(false);
  };

  const validateProfile = () => {
    const errs = {};
    if (!profileData.full_name.trim()) {
      errs.full_name = 'Full name is required';
    } else if (profileData.full_name.trim().split(/\s+/).length < 2) {
      errs.full_name = 'Full name must contain at least 2 words';
    }
    if (!profileData.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (profileData.phone_number && !/^\+?[\d\s\-()+]+$/.test(profileData.phone_number)) {
      errs.phone_number = 'Please enter a valid phone number';
    }
    return errs;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const errs = validateProfile();
    if (Object.keys(errs).length > 0) { setProfileErrors(errs); return; }

    setSavingProfile(true);
    setProfileErrors({});

    try {
      const updated = await authService.updateProfile(profileData);
      updateUser(updated);
      setProfileSuccess(true);
    } catch (err) {
      try {
        const parsed = JSON.parse(err.message);
        const fieldErrors = {};
        Object.entries(parsed).forEach(([key, val]) => {
          fieldErrors[key] = Array.isArray(val) ? val[0] : val;
        });
        setProfileErrors(fieldErrors);
      } catch {
        setProfileErrors({ general: 'Failed to save changes. Please try again.' });
      }
    } finally {
      setSavingProfile(false);
    }
  };

  /* ---- Password form ---- */
  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwData(prev => ({ ...prev, [name]: value }));
    if (pwErrors[name]) setPwErrors(prev => ({ ...prev, [name]: '' }));
    setPwSuccess(false);
  };

  const validatePw = () => {
    const errs = {};
    if (!pwData.current_password) errs.current_password = 'Current password is required';
    if (!pwData.new_password) {
      errs.new_password = 'New password is required';
    } else if (pwData.new_password.length < 8) {
      errs.new_password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(pwData.new_password)) {
      errs.new_password = 'Must contain at least one uppercase letter';
    } else if (!/[0-9]/.test(pwData.new_password)) {
      errs.new_password = 'Must contain at least one number';
    }
    if (!pwData.new_password_confirm) {
      errs.new_password_confirm = 'Please confirm your new password';
    } else if (pwData.new_password !== pwData.new_password_confirm) {
      errs.new_password_confirm = 'Passwords do not match';
    }
    return errs;
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    const errs = validatePw();
    if (Object.keys(errs).length > 0) { setPwErrors(errs); return; }

    setSavingPw(true);
    setPwErrors({});

    try {
      await authService.changePassword(
        pwData.current_password,
        pwData.new_password,
        pwData.new_password_confirm
      );
      setPwSuccess(true);
      setPwData({ current_password: '', new_password: '', new_password_confirm: '' });
    } catch (err) {
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error) {
          setPwErrors({ general: parsed.error });
        } else {
          const fieldErrors = {};
          Object.entries(parsed).forEach(([key, val]) => {
            fieldErrors[key] = Array.isArray(val) ? val[0] : val;
          });
          setPwErrors(fieldErrors);
        }
      } catch {
        setPwErrors({ general: 'Failed to change password. Please try again.' });
      }
    } finally {
      setSavingPw(false);
    }
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : '?';

  return (
    <>
      <Navigation />
      <div className="ep-page">
        <div className="ep-container">

          {/* Header */}
          <div className="ep-page-header">
            <Link to="/profile" className="ep-back-link">
              <ArrowLeft size={16} />
              Back to Profile
            </Link>
            <h1 className="ep-page-title">Edit Profile</h1>
          </div>

          <div className="ep-layout">

            {/* Sidebar */}
            <aside className="ep-sidebar">
              <div className="ep-identity-card">
                <div className="ep-avatar">{initials}</div>
                <h3 className="ep-sidebar-name">{user?.full_name}</h3>
                <p className="ep-sidebar-email">{user?.email}</p>
                <p className="ep-sidebar-note">
                  Update your name, email, and contact details below.
                </p>
              </div>
            </aside>

            {/* Main Forms */}
            <main className="ep-main">

              {/* Profile Information Form */}
              <section className="ep-section">
                <div className="ep-section-header">
                  <User size={18} className="ep-section-icon" />
                  <h3 className="ep-section-title">Personal Information</h3>
                </div>
                <div className="ep-section-body">

                  {profileSuccess && (
                    <div className="ep-success-banner">
                      <CheckCircle size={16} />
                      Profile updated successfully
                    </div>
                  )}
                  {profileErrors.general && (
                    <div className="ep-error-banner">{profileErrors.general}</div>
                  )}

                  <form onSubmit={handleProfileSubmit} className="ep-form">
                    <div className="ep-form-row">
                      <div className="ep-form-group">
                        <label className="ep-label">Full Name</label>
                        <div className="ep-input-wrapper">
                          <User className="ep-input-icon" size={18} />
                          <input
                            type="text"
                            name="full_name"
                            className={`ep-input ${profileErrors.full_name ? 'ep-input-error' : ''}`}
                            placeholder="Your full name"
                            value={profileData.full_name}
                            onChange={handleProfileChange}
                            disabled={savingProfile}
                          />
                        </div>
                        {profileErrors.full_name && (
                          <span className="ep-field-error">{profileErrors.full_name}</span>
                        )}
                      </div>

                      <div className="ep-form-group">
                        <label className="ep-label">Email Address</label>
                        <div className="ep-input-wrapper">
                          <Mail className="ep-input-icon" size={18} />
                          <input
                            type="email"
                            name="email"
                            className={`ep-input ${profileErrors.email ? 'ep-input-error' : ''}`}
                            placeholder="your@email.com"
                            value={profileData.email}
                            onChange={handleProfileChange}
                            disabled={savingProfile}
                          />
                        </div>
                        {profileErrors.email && (
                          <span className="ep-field-error">{profileErrors.email}</span>
                        )}
                      </div>
                    </div>

                    {user?.role === 'vendor' && (
                      <div className="ep-form-group ep-full-width">
                        <label className="ep-label">Business Address</label>
                        <div className="ep-input-wrapper ep-textarea-wrapper">
                          <MapPin className="ep-input-icon ep-input-icon-top" size={18} />
                          <textarea
                            name="business_address"
                            className={`ep-textarea ${profileErrors.business_address ? 'ep-input-error' : ''}`}
                            placeholder="Your business address"
                            value={profileData.business_address}
                            onChange={handleProfileChange}
                            disabled={savingProfile}
                            rows={3}
                          />
                        </div>
                        {profileErrors.business_address && (
                          <span className="ep-field-error">{profileErrors.business_address}</span>
                        )}
                      </div>
                    )}

                    <div className="ep-form-actions">
                      <Link to="/profile" className="ep-cancel-btn">Cancel</Link>
                      <button type="submit" className="ep-save-btn" disabled={savingProfile}>
                        {savingProfile
                          ? <><Loader2 className="ep-spinner" size={16} /><span>Saving...</span></>
                          : 'Save Changes'
                        }
                      </button>
                    </div>
                  </form>
                </div>
              </section>

              {/* Change Password Section */}
              <section className="ep-section">
                <button
                  className="ep-section-header ep-section-toggle"
                  onClick={() => { setPwOpen(p => !p); setPwErrors({}); setPwSuccess(false); }}
                  type="button"
                >
                  <div className="ep-section-header-left">
                    <Lock size={18} className="ep-section-icon" />
                    <h3 className="ep-section-title">Change Password</h3>
                  </div>
                  {pwOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {pwOpen && (
                  <div className="ep-section-body">
                    {pwSuccess && (
                      <div className="ep-success-banner">
                        <CheckCircle size={16} />
                        Password changed successfully
                      </div>
                    )}
                    {pwErrors.general && (
                      <div className="ep-error-banner">{pwErrors.general}</div>
                    )}

                    <form onSubmit={handlePwSubmit} className="ep-form">
                      <div className="ep-form-group ep-full-width">
                        <label className="ep-label">Current Password</label>
                        <div className="ep-input-wrapper">
                          <Lock className="ep-input-icon" size={18} />
                          <input
                            type={showPw.current ? 'text' : 'password'}
                            name="current_password"
                            className={`ep-input ep-input-pw ${pwErrors.current_password ? 'ep-input-error' : ''}`}
                            placeholder="Enter current password"
                            value={pwData.current_password}
                            onChange={handlePwChange}
                            disabled={savingPw}
                          />
                          <button
                            type="button"
                            className="ep-pw-toggle"
                            onClick={() => setShowPw(p => ({ ...p, current: !p.current }))}
                          >
                            {showPw.current ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {pwErrors.current_password && (
                          <span className="ep-field-error">{pwErrors.current_password}</span>
                        )}
                      </div>

                      <div className="ep-form-row">
                        <div className="ep-form-group">
                          <label className="ep-label">New Password</label>
                          <div className="ep-input-wrapper">
                            <Lock className="ep-input-icon" size={18} />
                            <input
                              type={showPw.new ? 'text' : 'password'}
                              name="new_password"
                              className={`ep-input ep-input-pw ${pwErrors.new_password ? 'ep-input-error' : ''}`}
                              placeholder="Min 8 characters"
                              value={pwData.new_password}
                              onChange={handlePwChange}
                              disabled={savingPw}
                            />
                            <button
                              type="button"
                              className="ep-pw-toggle"
                              onClick={() => setShowPw(p => ({ ...p, new: !p.new }))}
                            >
                              {showPw.new ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          {pwErrors.new_password && (
                            <span className="ep-field-error">{pwErrors.new_password}</span>
                          )}
                        </div>

                        <div className="ep-form-group">
                          <label className="ep-label">Confirm New Password</label>
                          <div className="ep-input-wrapper">
                            <Lock className="ep-input-icon" size={18} />
                            <input
                              type={showPw.confirm ? 'text' : 'password'}
                              name="new_password_confirm"
                              className={`ep-input ep-input-pw ${pwErrors.new_password_confirm ? 'ep-input-error' : ''}`}
                              placeholder="Repeat new password"
                              value={pwData.new_password_confirm}
                              onChange={handlePwChange}
                              disabled={savingPw}
                            />
                            <button
                              type="button"
                              className="ep-pw-toggle"
                              onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                            >
                              {showPw.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          {pwErrors.new_password_confirm && (
                            <span className="ep-field-error">{pwErrors.new_password_confirm}</span>
                          )}
                        </div>
                      </div>

                      <div className="ep-form-actions">
                        <button
                          type="button"
                          className="ep-cancel-btn"
                          onClick={() => { setPwOpen(false); setPwData({ current_password: '', new_password: '', new_password_confirm: '' }); setPwErrors({}); }}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="ep-save-btn" disabled={savingPw}>
                          {savingPw
                            ? <><Loader2 className="ep-spinner" size={16} /><span>Updating...</span></>
                            : 'Update Password'
                          }
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </section>

            </main>
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
};

export default EditProfile;
