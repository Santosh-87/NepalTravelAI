import React from 'react';
import { MessageSquare, Car, MapPin } from 'lucide-react';
import './Features.css';

const Features = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "AI Travel Assistant",
      description: "Ask questions about Nepal destinations, get itinerary suggestions, and receive travel tips powered by AI."
    },
    {
      icon: Car,
      title: "NATTA Vehicle Marketplace",
      description: "Browse certified vehicles with official NATTA rates. Transparent pricing for cars, SUVs, vans, and buses."
    },
    {
      icon: MapPin,
      title: "Destination Information",
      description: "Explore popular destinations, treks, and attractions with detailed guides and practical travel information."
    }
  ];

  return (
    <section className="features">
      <div className="container">
        <div className="features-header">
          <h2 className="features-title">How It Works</h2>
          <p className="features-subtitle">
            Simple tools to help you plan your Nepal trip
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                <feature.icon size={28} />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;