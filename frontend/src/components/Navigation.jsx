import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Mountain, LogOut, User, ChevronDown, Settings } from 'lucide-react';
import { supabase } from '../config/supabase';
import './Navigation.css';

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const profileRef = useRef(null);

  // Load Profile from DB
  const loadProfile = async (userId) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) setProfile(data);
  };

  useEffect(() => {
    // Scroll handler
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    // Check existing session on page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      }
    });

    // Listen for login / logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  // Close dropdown outside of click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Logout
  const handleLogout = () => {
    console.log('🔴 LOGOUT CLICKED');
    
    supabase.auth.signOut(); // Fire and forget
    
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    setProfile(null);
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    
    console.log('🔴 Redirecting to homepage...');
    window.location.href = '/';
  };


  const getInitial = () => {
    if (profile?.full_name) return profile.full_name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const getFirstName = () => {
    if (profile?.full_name) return profile.full_name.split(' ')[0];
    return user?.email?.split('@')[0] || 'User';
  };

  // Render
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
                  <ChevronDown size={16} className={`chevron ${isProfileOpen ? 'chevron-open' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <div className="dropdown-avatar">{getInitial()}</div>
                      <div className="dropdown-user-info">
                        <span className="dropdown-name">{profile?.full_name || 'User'}</span>
                        <span className="dropdown-email">{user.email}</span>
                        <span className="dropdown-role">
                          {profile?.role === 'vendor' ? '🏪 Vendor' : '🧭 Tourist'}
                        </span>
                      </div>
                    </div>
                    <div className="dropdown-divider" />
                    <Link to="/profile" className="dropdown-item" onClick={() => setIsProfileOpen(false)}>
                      <User size={16} /><span>View Profile</span>
                    </Link>
                    <Link to="/profile/edit" className="dropdown-item" onClick={() => setIsProfileOpen(false)}>
                      <Settings size={16} /><span>Edit Profile</span>
                    </Link>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                      <LogOut size={16} /><span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile hamburger */}
          <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(prev => !prev)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="mobile-menu">
            <Link to="/features" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Features</Link>
            <Link to="/marketplace" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Vehicle Marketplace</Link>
            <Link to="/community" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Community</Link>
            <Link to="/about" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>About</Link>

            <div className="mobile-nav-actions">
              {!user ? (
                <>
                  <Link to="/login" className="btn btn-secondary" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
                  <Link to="/signup" className="btn btn-accent" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
                </>
              ) : (
                <>
                  <div className="mobile-user-info">
                    <div className="mobile-avatar">{getInitial()}</div>
                    <div>
                      <div className="mobile-user-name">{profile?.full_name || 'User'}</div>
                      <div className="mobile-user-role">
                        {profile?.role === 'vendor' ? '🏪 Vendor' : '🧭 Tourist'}
                      </div>
                    </div>
                  </div>
                  <Link to="/profile" className="btn btn-secondary" onClick={() => setIsMobileMenuOpen(false)}>View Profile</Link>
                  <Link to="/profile/edit" className="btn btn-secondary" onClick={() => setIsMobileMenuOpen(false)}>Edit Profile</Link>
                  <button className="btn btn-accent" onClick={handleLogout}>Logout</button>
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