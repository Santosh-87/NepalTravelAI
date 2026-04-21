import React from 'react';
import { ArrowRight, MessageSquare, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hs-root">
      {/* Background layers */}
      <div className="hs-bg-base" />
      <div className="hs-bg-radial" />
      <div className="hs-bg-glow" />

      <div className="hs-container">
        <div className="hs-grid">

          {/* LEFT — Text column */}
          <div className="hs-text-col">

            <div className="hs-badge">
              <span>✨ AI-Powered Travel Planning</span>
            </div>

            <h1 className="hs-title">
              Plan Your Nepal Journey
              <span className="hs-title-gold">with Confidence</span>
            </h1>

            <p className="hs-desc">
              Get personalized travel recommendations, discover NATTA-certified vehicles,
              and explore Nepal's hidden gems with your AI-powered travel companion.
            </p>

            <div className="hs-actions">
              <Link to="/chat" className="hs-btn-primary">
                <MessageSquare size={20} />
                <span>Start Planning</span>
              </Link>
              <Link to="/marketplace" className="hs-btn-outline">
                <span>Browse Vehicles</span>
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="hs-trust-row">
              <div className="hs-trust-item">
                <CheckCircle size={18} />
                <span>NATTA Certified</span>
              </div>
              <div className="hs-trust-item">
                <CheckCircle size={18} />
                <span>Transparent Pricing</span>
              </div>
            </div>

          </div>

          {/* RIGHT — Chat preview column */}
          <div className="hs-visual-col">
            <div className="hs-chat-card">

              <div className="hs-chat-topbar">
                <div className="hs-chat-online">
                  <span className="hs-dot-pulse" />
                  <span>AI Assistant</span>
                </div>
              </div>

              <div className="hs-chat-messages">
                <div className="hs-msg hs-msg-user">
                  Generate a Mustang trip itinerary for my friends trip
                </div>
                <div className="hs-msg hs-msg-ai">
                  Perfect! Here's a 3-day Mustang trip itinerary for your group:
                </div>
                <div className="hs-msg hs-msg-ai">
                  Day 1: Kathmandu → Chame (scenic drives)
                  Day 2: Chame → Jomsom (hiking)
                  Day 3: Jomsom → Marpha → Kathmandu

                  Total: NPR 25,000 per person. Jeep recommended for 8 friends.
                </div>
              </div>

              <div className="hs-chat-input-bar">
                <span className="hs-chat-placeholder">Ask about your trip...</span>
                <button className="hs-chat-send" aria-label="Send">
                  <ArrowRight size={16} />
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
