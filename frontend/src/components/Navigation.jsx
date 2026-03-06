import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Mountain, LogOut, User, ChevronDown, Settings } from 'lucide-react';
import authService from '../services/auth';
import './Navigation.css';

const Navigation = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileRef = useRef(null);

  // Load user profile from Django
  const loadProfile = async () => {
    try {
      const profileData = await authService.getProfile();
      setUser(profileData);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Scroll handler
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    // Check if user is authenticated on mount
    if (authService.isAuthenticated()) {
      loadProfile();
    } else {
      setLoading(false);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Logout handler
  const handleLogout = async () => {
    console.log('Logging out...');

    await authService.logout();

    setUser(null);
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);

    console.log('Redirecting to homepage...');
    navigate('/');
  };

  // Get user initial for avatar
  const getInitial = () => {
    if (user?.full_name) return user.full_name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  // Get user first name
  const getFirstName = () => {
    if (user?.full_name) return user.full_name.split(' ')[0];
    return user?.email?.split('@')[0] || 'User';
  };

  // Show loading state briefly
  if (loading) {
    return (
      <nav className="navigation">
        <div className="container">
          <div className="nav-content">
            <Link to="/" className="logo">
              <Mountain className="logo-icon" />
              <span className="logo-text">
                <span className="logo-nepal">Nepal</span>
                <span className="logo-travel">Travel</span>
                <span className="logo-ai">AI</span>
              </span>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={`navigation ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="nav-content">

          {/* Logo */}
          <Link to="/" className="logo">
            <Mountain className="logo-icon" />
            <span className="logo-text">
              <span className="logo-nepal">Nepal</span>
              <span className="logo-travel">Travel</span>
              <span className="logo-ai">AI</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="nav-menu desktop-menu">
            <Link to="/features" className="nav-link">Features</Link>
            <Link to="/marketplace" className="nav-link">Vehicle Marketplace</Link>
            <Link to="/community" className="nav-link">Community</Link>
            <Link to="/about" className="nav-link">About</Link>
          </div>

          {/* NOT logged in */}
          {!user && (
            <div className="nav-actions desktop-menu">
              <Link to="/login" className="nav-link">Sign In</Link>
              <Link to="/signup" className="btn btn-accent">Get Started</Link>
            </div>
          )}

          {/* Logged in → profile dropdown */}
          {user && (
            <div className="nav-actions desktop-menu">
              <div className="profile-dropdown" ref={profileRef}>
                <button
                  className="profile-trigger"
                  onClick={() => setIsProfileOpen(prev => !prev)}
                >
                  <div className="profile-avatar">{getInitial()}</div>
                  <span className="profile-name">{getFirstName()}</span>
                  <ChevronDown
                    size={16}
                    className={`chevron ${isProfileOpen ? 'chevron-open' : ''}`}
                  />
                </button>

                {isProfileOpen && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <div className="dropdown-avatar">{getInitial()}</div>
                      <div className="dropdown-user-info">
                        <span className="dropdown-name">{user.full_name || 'User'}</span>
                        <span className="dropdown-email">{user.email}</span>
                        <span className="dropdown-role">
                          {user.role === 'vendor' ? '🏪 Vendor' : '🧭 Tourist'}
                        </span>
                      </div>
                    </div>
                    <div className="dropdown-divider" />
                    <Link
                      to="/profile"
                      className="dropdown-item"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User size={16} />
                      <span>View Profile</span>
                    </Link>
                    <Link
                      to="/profile/edit"
                      className="dropdown-item"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings size={16} />
                      <span>Edit Profile</span>
                    </Link>
                    <div className="dropdown-divider" />
                    <button
                      className="dropdown-item dropdown-logout"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="mobile-menu">
            <Link
              to="/features"
              className="mobile-nav-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              to="/marketplace"
              className="mobile-nav-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Vehicle Marketplace
            </Link>
            <Link
              to="/community"
              className="mobile-nav-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Community
            </Link>
            <Link
              to="/about"
              className="mobile-nav-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>

            <div className="mobile-nav-actions">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="btn btn-secondary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="btn btn-accent"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <>
                  <div className="mobile-user-info">
                    <div className="mobile-avatar">{getInitial()}</div>
                    <div>
                      <div className="mobile-user-name">{user.full_name || 'User'}</div>
                      <div className="mobile-user-role">
                        {user.role === 'vendor' ? '🏪 Vendor' : '🧭 Tourist'}
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    className="btn btn-secondary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    View Profile
                  </Link>
                  <Link
                    to="/profile/edit"
                    className="btn btn-secondary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Edit Profile
                  </Link>
                  <button
                    className="btn btn-accent"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;