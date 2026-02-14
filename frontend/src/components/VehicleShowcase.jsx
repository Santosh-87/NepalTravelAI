import React from 'react';
import { Car, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import './VehicleShowcase.css';

const VehicleShowcase = () => {
  const vehicles = [
    {
      type: "Car",
      image: "🚗",
      capacity: "1-3 passengers",
      rate: "NPR 1,200",
      features: ["Airport transfers", "City tours", "Comfortable seating"],
      popular: false
    },
    {
      type: "SUV",
      image: "🚙",
      capacity: "3-5 passengers",
      rate: "NPR 1,800",
      features: ["Mountain roads", "Extra luggage space", "Premium comfort"],
      popular: true
    },
    {
      type: "Hiace/Jeep",
      image: "🚐",
      capacity: "6-10 passengers",
      rate: "NPR 2,500",
      features: ["Group travel", "Trekking trips", "Spacious interior"],
      popular: false
    },
    {
      type: "Coaster",
      image: "🚌",
      capacity: "15-25 passengers",
      rate: "NPR 3,000",
      features: ["Large groups", "Long distance", "AC available"],
      popular: false
    }
  ];

  return (
    <section className="vehicle-showcase section">
      <div className="container">
        {/* Section Header */}
        <div className="showcase-header">
          <div className="section-label fade-in-up">NATTA Certified</div>
          <h2 className="section-title fade-in-up delay-1">
            Choose Your Perfect
            <span className="title-accent"> Travel Companion</span>
          </h2>
          <p className="section-description fade-in-up delay-2">
            All vehicles are NATTA-approved with transparent pricing and verified vendors
          </p>
        </div>

        {/* Vehicle Grid */}
        <div className="vehicle-grid">
          {vehicles.map((vehicle, index) => (
            <div 
              key={index} 
              className={`vehicle-card fade-in-up delay-${index + 1} ${vehicle.popular ? 'popular' : ''}`}
            >
              {vehicle.popular && (
                <div className="popular-badge">
                  Most Popular
                </div>
              )}

              <div className="vehicle-image">
                <span className="vehicle-emoji">{vehicle.image}</span>
              </div>

              <div className="vehicle-info">
                <h3 className="vehicle-type">{vehicle.type}</h3>
                
                <div className="vehicle-capacity">
                  <Users size={18} />
                  <span>{vehicle.capacity}</span>
                </div>

                <div className="vehicle-rate">
                  <span className="rate-amount">{vehicle.rate}</span>
                  <span className="rate-period">/ base rate</span>
                </div>

                <ul className="vehicle-features">
                  {vehicle.features.map((feature, idx) => (
                    <li key={idx}>
                      <CheckCircle2 size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link to={`/vehicles/${vehicle.type.toLowerCase()}`} className="vehicle-cta">
                  <span>View Details</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="showcase-cta fade-in-up delay-4">
          <div className="cta-content">
            <Car className="cta-icon" />
            <div className="cta-text">
              <h3>Need help choosing the right vehicle?</h3>
              <p>Our AI assistant can recommend the perfect vehicle based on your trip details</p>
            </div>
            <Link to="/get-started" className="btn btn-accent">
              Ask AI Assistant
            </Link>
          </div>
        </div>

        {/* Info Banner */}
        <div className="info-banner fade-in-up delay-4">
          <div className="info-item">
            <div className="info-icon">✓</div>
            <div className="info-text">
              <strong>NATTA Certified</strong>
              <span>All vehicles approved by Nepal Tourist Vehicle Association</span>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">✓</div>
            <div className="info-text">
              <strong>Transparent Pricing</strong>
              <span>No hidden fees, official NATTA rates</span>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">✓</div>
            <div className="info-text">
              <strong>Instant Booking</strong>
              <span>Book directly with verified vendors</span>
            </div>
          </div>
        </div>
      </div>

      {/* Background Element */}
      <div className="showcase-bg"></div>
    </section>
  );
};

export default VehicleShowcase;