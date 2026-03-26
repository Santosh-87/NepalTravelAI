import React from 'react';
import Navigation from '../../components/shared/Navigation';
import Hero from '../../components/home/Hero';
import Features from '../../components/home/Features';
import VehicleShowcase from '../../components/home/VehicleShowcase';
import Footer from '../../components/shared/Footer';

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