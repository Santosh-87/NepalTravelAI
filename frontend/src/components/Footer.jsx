import React from 'react';
import { Link } from 'react-router-dom';
import { Mountain, Mail, MapPin, Phone, Facebook, Instagram, Twitter } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-section footer-brand">
            <Link to="/" className="footer-logo">
              <Mountain className="footer-logo-icon" />
              <span className="footer-logo-text">
                <span>Nepal</span>
                <span>Travel</span>
                <span>AI</span>
              </span>
            </Link>
            <p className="footer-tagline">
              Your intelligent companion for exploring the Himalayas with AI-powered 
              itineraries and NATTA-certified vehicles.
            </p>
            <div className="footer-social">
              <a href="#" aria-label="Facebook"><Facebook size={20} /></a>
              <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
              <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/features">Features</Link></li>
              <li><Link to="/marketplace">Vehicle Marketplace</Link></li>
              <li><Link to="/community">Community</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/pricing">Pricing</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-section">
            <h4 className="footer-title">Resources</h4>
            <ul className="footer-links">
              <li><Link to="/blog">Travel Blog</Link></li>
              <li><Link to="/guides">Trip Guides</Link></li>
              <li><Link to="/help">Help Center</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/natta">NATTA Info</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-section">
            <h4 className="footer-title">Contact</h4>
            <ul className="footer-contact">
              <li>
                <MapPin size={18} />
                <span>Kathmandu, Nepal</span>
              </li>
              <li>
                <Mail size={18} />
                <span>info@nepaltravelai.com</span>
              </li>
              <li>
                <Phone size={18} />
                <span>+977 XXX XXXX</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="footer-copyright">
              © {currentYear} NepalTravelAI. All rights reserved.
            </p>
            <div className="footer-legal">
              <Link to="/privacy">Privacy Policy</Link>
              <span className="footer-divider">•</span>
              <Link to="/terms">Terms of Service</Link>
              <span className="footer-divider">•</span>
              <Link to="/cookies">Cookie Policy</Link>
            </div>
          </div>
          <p className="footer-credit">
            Built with ❤️ for Nepal Tourism
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;