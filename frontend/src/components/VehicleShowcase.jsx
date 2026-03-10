import React from 'react';
import { Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './VehicleShowcase.css';

const VehicleShowcase = () => {
  const vehicles = [
    {
      type: "Car / SUV",
      image: "/images/car-suv.jpg", 
      capacity: "1-5 passengers",
      description: "Ideal for small groups and families",
      useCase: "Airport transfers, city tours, short trips"
    },
    {
      type: "Hiace / Van",
      image: "/images/hiace.jpg",
      capacity: "6-12 passengers",
      description: "Perfect for group travel",
      useCase: "Trekking groups, family trips, tours"
    },
    {
      type: "Coaster",
      image: "/images/coaster.jpg",
      capacity: "15-25 passengers",
      description: "Comfortable for larger groups",
      useCase: "Group tours, long-distance travel"
    },
    {
      type: "Bus",
      image: "/images/bus.jpg",
      capacity: "25-45 passengers",
      description: "Best for large tour groups",
      useCase: "Corporate trips, school tours, events"
    }
  ];

  return (
    <section className="vehicle-showcase">
      <div className="container">
        <div className="showcase-header">
          <h2 className="showcase-title">NATTA Certified Vehicles</h2>
          <p className="showcase-subtitle">
            All vehicles follow official NATTA rates with verified vendors
          </p>
        </div>

        <div className="vehicle-grid">
          {vehicles.map((vehicle, index) => (
            <div key={index} className="vehicle-card">
              <div className="vehicle-image-container">
                <img 
                  src={vehicle.image} 
                  alt={vehicle.type}
                  className="vehicle-image"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x250?text=' + vehicle.type;
                  }}
                />
              </div>

              <div className="vehicle-content">
                <h3 className="vehicle-type">{vehicle.type}</h3>
                
                <div className="vehicle-capacity">
                  <Users size={18} />
                  <span>{vehicle.capacity}</span>
                </div>

                <p className="vehicle-description">{vehicle.description}</p>
                <p className="vehicle-use-case">{vehicle.useCase}</p>

                <Link 
                  to="/marketplace" 
                  className="vehicle-link"
                >
                  View Options
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="showcase-cta">
          <p>Need help choosing? <Link to="/chat">Ask our AI assistant</Link></p>
        </div>
      </div>
    </section>
  );
};

export default VehicleShowcase;