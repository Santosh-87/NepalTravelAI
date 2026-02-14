import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Mountain } from 'lucide-react';
import './Navigation.css';

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

          {/* Desktop Menu */}
          <div className="nav-menu desktop-menu">
            <Link to="/features" className="nav-link">Features</Link>
            <Link to="/marketplace" className="nav-link">Vehicle Marketplace</Link>
            <Link to="/community" className="nav-link">Community</Link>
            <Link to="/about" className="nav-link">About</Link>
          </div>

          {/* CTA Buttons */}
          <div className="nav-actions desktop-menu">
            <Link to="/login" className="nav-link">Sign In</Link>
            <Link to="/get-started" className="btn btn-accent">Get Started</Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="mobile-menu">
            <Link to="/features" className="mobile-nav-link">Features</Link>
            <Link to="/marketplace" className="mobile-nav-link">Vehicle Marketplace</Link>
            <Link to="/community" className="mobile-nav-link">Community</Link>
            <Link to="/about" className="mobile-nav-link">About</Link>
            <div className="mobile-nav-actions">
              <Link to="/login" className="btn btn-secondary">Sign In</Link>
              <Link to="/chat" className="btn btn-accent">Get Started</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;