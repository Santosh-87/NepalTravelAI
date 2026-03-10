import React from 'react';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-background">
        <div className="hero-overlay"></div>
      </div>

      <div className="container hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            Plan Your Nepal Journey
            <span className="hero-title-accent"> with AI Guidance</span>
          </h1>

          <p className="hero-description">
            Get personalized travel recommendations, find NATTA-certified vehicles,
            and explore Nepal with confidence. Your AI-powered travel assistant for the Himalayas.
          </p>

          <div className="hero-actions">
            <Link to="/chat" className="btn btn-primary">
              <MessageSquare size={20} />
              <span>Start Planning</span>
            </Link>
            <Link to="/marketplace" className="btn btn-outline">
              Browse Vehicles
            </Link>
          </div>

          <div className="hero-trust">
            <div className="trust-badge">
              <span className="badge-icon">✓</span>
              <span>NATTA Certified Vehicles</span>
            </div>
            <div className="trust-badge">
              <span className="badge-icon">✓</span>
              <span>Transparent Pricing</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="chat-preview">
            <div className="chat-header">
              <div className="chat-status">
                <span className="status-dot"></span>
                <span>AI Assistant</span>
              </div>
            </div>
            <div className="chat-body">
              <div className="message user">
                I need transport from Kathmandu to Pokhara for 4 people
              </div>
              <div className="message assistant">
                I recommend an SUV for your group. The trip takes 6-7 hours.
                NATTA rate: NPR 18,000 for round trip. Would you like to see
                available vehicles?
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;