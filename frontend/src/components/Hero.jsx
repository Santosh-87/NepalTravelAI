import React, { useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Map, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  const heroRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.scrollY;
        const layers = heroRef.current.querySelectorAll('.parallax-layer');
        
        layers.forEach((layer, index) => {
          const speed = (index + 1) * 0.15;
          layer.style.transform = `translateY(${scrolled * speed}px)`;
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="hero" ref={heroRef}>
      {/* Parallax Background Layers */}
      <div className="hero-background">
        <div className="parallax-layer layer-1"></div>
        <div className="parallax-layer layer-2"></div>
        <div className="parallax-layer layer-3"></div>
        <div className="hero-overlay"></div>
      </div>

      {/* Content */}
      <div className="container hero-content">
        <div className="hero-text">
          <div className="hero-badge fade-in-up">
            <Sparkles size={16} />
            <span>AI-Powered Travel Planning</span>
          </div>
          
          <h1 className="hero-title fade-in-up delay-1">
            Discover Nepal
            <span className="hero-title-accent"> Like Never Before</span>
          </h1>
          
          <p className="hero-description fade-in-up delay-2">
            Your intelligent companion for exploring the Himalayas. Get personalized 
            itineraries, NATTA-approved vehicles, and connect with fellow travelers 
            - all powered by advanced AI technology.
          </p>

          <div className="hero-features fade-in-up delay-3">
            <div className="hero-feature">
              <Map size={20} />
              <span>Smart Itineraries</span>
            </div>
            <div className="hero-feature">
              <Shield size={20} />
              <span>NATTA Certified</span>
            </div>
          </div>

          <div className="hero-actions fade-in-up delay-4">
            <Link to="/chat" className="btn btn-accent hero-btn-primary">
              <span>Start Planning</span>
              <ArrowRight size={20} />
            </Link>
            <Link to="/explore" className="btn btn-secondary hero-btn-secondary">
              <span>Explore Features</span>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="hero-trust fade-in-up delay-4">
            <div className="trust-item">
              <div className="trust-number">500+</div>
              <div className="trust-label">Vehicles</div>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <div className="trust-number">NATTA</div>
              <div className="trust-label">Approved</div>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <div className="trust-number">24/7</div>
              <div className="trust-label">AI Support</div>
            </div>
          </div>
        </div>

        {/* Hero Visual - AI Chat Preview */}
        <div className="hero-visual fade-in-up delay-2">
          <div className="chat-preview">
            <div className="chat-header">
              <div className="chat-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="chat-title">NepalTravel AI Assistant</div>
            </div>
            <div className="chat-messages">
              <div className="chat-message user-message">
                Plan a 7-day trek to Everest Base Camp for 4 people
              </div>
              <div className="chat-message ai-message">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                I'll create a personalized itinerary with NATTA-approved 
                vehicles and accommodation options...
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="scroll-indicator">
        <div className="scroll-line"></div>
        <span>Scroll to explore</span>
      </div>
    </section>
  );
};

export default Hero;