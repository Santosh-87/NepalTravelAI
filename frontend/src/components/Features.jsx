import React from 'react';
import { Bot, Car, Users, Map, Shield, TrendingUp } from 'lucide-react';
import './Features.css';

const Features = () => {
  const features = [
    {
      icon: Bot,
      title: "AI-Powered Itineraries",
      description: "Get personalized trip plans based on your preferences, budget, and travel style. Our AI assistant crafts the perfect Himalayan adventure.",
      highlights: ["Smart recommendations", "Real-time updates", "Budget optimization"],
      color: "primary"
    },
    {
      icon: Car,
      title: "NATTA Vehicle Marketplace",
      description: "Access 500+ certified vehicles with transparent pricing. Browse, compare, and book NATTA-approved transportation with confidence.",
      highlights: ["Verified vendors", "Instant booking", "Competitive rates"],
      color: "accent"
    },
    {
      icon: Users,
      title: "Community Hub",
      description: "Connect with fellow travelers, share experiences, and discover authentic itineraries from people who've explored Nepal.",
      highlights: ["Trip sharing", "Local insights", "Travel stories"],
      color: "secondary"
    }
  ];

  const stats = [
    { icon: Map, value: "10,000+", label: "Itineraries Created" },
    { icon: Shield, value: "NATTA", label: "Certified Platform" },
    { icon: TrendingUp, value: "98%", label: "Satisfaction Rate" }
  ];

  return (
    <section className="features section">
      <div className="container">
        {/* Section Header */}
        <div className="features-header">
          <div className="section-label fade-in-up">Why Choose Us</div>
          <h2 className="section-title fade-in-up delay-1">
            Everything You Need for
            <span className="title-accent"> Perfect Nepal Journey</span>
          </h2>
          <p className="section-description fade-in-up delay-2">
            Combining AI intelligence with local expertise to deliver exceptional travel experiences
          </p>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`feature-card fade-in-up delay-${index + 1}`}
              data-color={feature.color}
            >
              <div className="feature-icon-wrapper">
                <feature.icon className="feature-icon" />
                <div className="feature-icon-bg"></div>
              </div>
              
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              
              <ul className="feature-highlights">
                {feature.highlights.map((highlight, idx) => (
                  <li key={idx}>
                    <span className="highlight-dot"></span>
                    {highlight}
                  </li>
                ))}
              </ul>

              <div className="feature-card-hover-effect"></div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="features-stats fade-in-up delay-4">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-icon-wrapper">
                <stat.icon className="stat-icon" />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="features-bg-decoration"></div>
    </section>
  );
};

export default Features;