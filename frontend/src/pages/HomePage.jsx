import React from 'react';
import Navigation from '../components/Navigation';
import Hero from '../components/Hero';
import Features from '../components/Features';
import VehicleShowcase from '../components/VehicleShowcase';
import Footer from '../components/Footer';

const HomePage = () => {
  return (
    <div className="homepage">
      <Navigation />
      <Hero />
      <Features />
      <VehicleShowcase />
      <Footer />
    </div>
  );
};

export default HomePage;