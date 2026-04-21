import React from 'react';
import { MessageSquare, Car, MapPin, Users } from 'lucide-react';
import './Features.css';

/**
 * Features Component
 * Design: Modern Mountain Minimalism
 * - Alternating card layout for visual interest
 * - Strong typography hierarchy
 * - Hover effects and smooth transitions
 */
const Features = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "AI Travel Assistant",
      description: "Ask questions about Nepal destinations, get personalized itinerary suggestions, and receive travel tips powered by advanced AI technology.",
      color: "accent"
    },
    {
      icon: Car,
      title: "NATTA Vehicle Marketplace",
      description: "Browse certified vehicles with official NATTA rates. Transparent pricing for cars, SUVs, vans, and buses with verified vendors.",
      color: "primary"
    },
    {
      icon: MapPin,
      title: "Trip Catalogs & Destinations",
      description: "Explore curated trip templates and popular destinations with detailed guides, practical travel information, and local insights.",
      color: "accent"
    },
    {
      icon: Users,
      title: "Traveler Community",
      description: "Connect with fellow travelers, share experiences, discover itineraries, exchange tips, and build lasting travel memories together.",
      color: "primary"
    }
  ];

  return (
    <section className="features">
      <div className="features-container">
        <div className="features-header">
          <h2 className="features-title">How It Works</h2>
          <div className="features-title-underline"></div>
          <p className="features-subtitle">
            Simple yet powerful tools to help you plan your Nepal adventure
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className={`feature-card feature-card-${index}`}>
              <div className={`feature-icon feature-icon-${feature.color}`}>
                <feature.icon size={32} />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <div className="feature-accent-line"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;