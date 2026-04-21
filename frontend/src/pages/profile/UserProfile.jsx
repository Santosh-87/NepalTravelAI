import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navigation from '../../components/shared/Navigation';
import Footer from '../../components/shared/Footer';
import {
  User, Mail, Phone, Calendar, Shield, Building2, Hash,
  MapPin, CheckCircle, Clock, Edit3, ChevronRight
} from 'lucide-react';
import './UserProfile.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
};

const UserProfile = () => {
  const { user } = useAuth();

  if (!user) return null;

  const initials = user.full_name
    ? user.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : '?';

  const roleBadge = user.is_staff
    ? { label: 'Admin', className: 'badge-admin' }
    : user.role === 'vendor'
    ? { label: 'Vendor', className: 'badge-vendor' }
    : { label: 'Tourist', className: 'badge-tourist' };

  return (
    <>
      <Navigation />
      <div className="up-page">
        <div className="up-container">

          {/* Page Header */}
          <div className="up-page-header">
            <h1 className="up-page-title">My Profile</h1>
            <Link to="/profile/edit" className="up-edit-btn">
              <Edit3 size={16} />
              Edit Profile
            </Link>
          </div>

          <div className="up-layout">

            {/* Left — Identity Card */}
            <aside className="up-sidebar">
              <div className="up-identity-card">
                <div className="up-avatar">{initials}</div>
                <h2 className="up-name">{user.full_name}</h2>
                <p className="up-email">{user.email}</p>
                <span className={`up-role-badge ${roleBadge.className}`}>
                  {roleBadge.label}
                </span>

                {user.role === 'vendor' && (
                  <div className="up-approval-status">
                    {user.is_vendor_approved ? (
                      <span className="up-status-approved">
                        <CheckCircle size={14} />
                        Account Approved
                      </span>
                    ) : (
                      <span className="up-status-pending">
                        <Clock size={14} />
                        Pending Approval
                      </span>
                    )}
                  </div>
                )}

                <div className="up-member-since">
                  <Calendar size={14} />
                  <span>Member since {formatDate(user.created_at)}</span>
                </div>

                <Link to="/profile/edit" className="up-sidebar-edit-link">
                  Edit Profile
                  <ChevronRight size={14} />
                </Link>
              </div>
            </aside>

            {/* Right — Details */}
            <main className="up-main">

              {/* Personal Information */}
              <section className="up-section">
                <div className="up-section-header">
                  <User size={18} className="up-section-icon" />
                  <h3 className="up-section-title">Personal Information</h3>
                </div>
                <div className="up-fields">
                  <div className="up-field">
                    <span className="up-field-label">Full Name</span>
                    <span className="up-field-value">{user.full_name}</span>
                  </div>
                  <div className="up-field">
                    <span className="up-field-label">Email Address</span>
                    <span className="up-field-value">{user.email}</span>
                  </div>
                  {user.phone_number && (
                    <div className="up-field">
                      <span className="up-field-label">Phone Number</span>
                      <span className="up-field-value">{user.phone_number}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Account Details */}
              <section className="up-section">
                <div className="up-section-header">
                  <Shield size={18} className="up-section-icon" />
                  <h3 className="up-section-title">Account Details</h3>
                </div>
                <div className="up-fields">
                  <div className="up-field">
                    <span className="up-field-label">Account Type</span>
                    <span className="up-field-value up-capitalize">
                      {user.is_staff ? 'Administrator' : user.role}
                    </span>
                  </div>
                  <div className="up-field">
                    <span className="up-field-label">Member Since</span>
                    <span className="up-field-value">{formatDate(user.created_at)}</span>
                  </div>
                  <div className="up-field">
                    <span className="up-field-label">Last Updated</span>
                    <span className="up-field-value">{formatDate(user.updated_at)}</span>
                  </div>
                </div>
              </section>

              {/* Vendor Information */}
              {user.role === 'vendor' && (
                <section className="up-section">
                  <div className="up-section-header">
                    <Building2 size={18} className="up-section-icon" />
                    <h3 className="up-section-title">Vendor Information</h3>
                  </div>
                  <div className="up-fields">
                    <div className="up-field">
                      <span className="up-field-label">PAN Number</span>
                      <span className="up-field-value up-monospace">
                        {user.pan_number || '—'}
                      </span>
                    </div>
                    <div className="up-field">
                      <span className="up-field-label">Business Address</span>
                      <span className="up-field-value">
                        {user.business_address || '—'}
                      </span>
                    </div>
                    <div className="up-field">
                      <span className="up-field-label">Approval Status</span>
                      <span className={`up-inline-status ${user.is_vendor_approved ? 'up-inline-approved' : 'up-inline-pending'}`}>
                        {user.is_vendor_approved ? (
                          <><CheckCircle size={14} /> Approved</>
                        ) : (
                          <><Clock size={14} /> Pending Review</>
                        )}
                      </span>
                    </div>
                  </div>
                </section>
              )}

            </main>
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
};

export default UserProfile;
