import React from 'react';
import { Link } from 'react-router-dom';
import {
  Mountain,
  Sparkles,
  ShieldCheck,
  Users,
  Heart,
  Compass,
  MessageSquare,
  Car,
  Map,
  Star,
  ArrowRight,
  CheckCircle2,
  Globe,
  Award,
  Target,
  Lightbulb,
} from 'lucide-react';
import Navigation from '../../components/shared/Navigation';
import Footer from '../../components/shared/Footer';
import './About.css';

const About = () => {
  const values = [
    {
      icon: ShieldCheck,
      title: 'Trust & Transparency',
      description:
        'Every vendor is NATTA-certified and every price is visible upfront. No hidden fees, no surprises — just honest service you can count on.',
    },
    {
      icon: Heart,
      title: 'Local at Heart',
      description:
        'We empower Nepali vendors, drivers, and guides by putting them directly in front of travelers — keeping tourism rupees in local communities.',
    },
    {
      icon: Lightbulb,
      title: 'Intelligent Planning',
      description:
        'Our AI assistant helps you cut through the noise, compare options, and design a trip that fits your time, budget, and taste.',
    },
    {
      icon: Compass,
      title: 'Responsible Travel',
      description:
        'We promote sustainable routes, verified operators, and a traveler community that shares honest experiences — the good and the real.',
    },
  ];

  const offerings = [
    {
      icon: MessageSquare,
      title: 'AI Travel Assistant',
      text: 'A conversational planner that builds itineraries, answers Nepal-specific questions, and estimates real costs in NPR.',
    },
    {
      icon: Car,
      title: 'Verified Vehicle Marketplace',
      text: 'Cars, jeeps, SUVs, vans and buses from certified vendors — with transparent NATTA rates and direct price negotiation.',
    },
    {
      icon: Map,
      title: 'Curated Trip Templates',
      text: 'Ready-to-book routes across Annapurna, Mustang, Everest, Chitwan and beyond — tailored for every difficulty level.',
    },
    {
      icon: Users,
      title: 'Traveler Community',
      text: 'Real stories, tips, and photos from people who just returned — not generic listicles from people who never went.',
    },
  ];

  const stats = [
    { number: '100%', label: 'NATTA-Certified Vendors' },
    { number: '50+', label: 'Curated Trip Routes' },
    { number: '3', label: 'Roles, One Platform' },
    { number: '24/7', label: 'AI Travel Assistant' },
  ];

  const steps = [
    {
      num: '01',
      title: 'Plan with AI',
      text: 'Chat with our AI assistant to design a trip based on your dates, group size, and interests.',
    },
    {
      num: '02',
      title: 'Compare & Negotiate',
      text: 'Browse verified vehicles, review ratings, and negotiate fair prices directly with vendors.',
    },
    {
      num: '03',
      title: 'Book with Confidence',
      text: 'Confirm your booking, pay securely, and receive transparent NATTA-backed documentation.',
    },
    {
      num: '04',
      title: 'Travel & Share',
      text: 'Experience Nepal, then share your story with the community to help future travelers.',
    },
  ];

  return (
    <div className="about-page">
      <Navigation />

      {/* ============ HERO ============ */}
      <section className="ab-hero">
        <div className="ab-hero-bg" />
        <div className="ab-hero-glow" />

        <div className="ab-container">
          <div className="ab-hero-content">
            <div className="ab-hero-badge">
              <Mountain size={16} />
              <span>About NepalTravelAI</span>
            </div>

            <h1 className="ab-hero-title">
              Making Nepal travel
              <span className="ab-hero-title-accent"> simple, honest, and personal.</span>
            </h1>

            <p className="ab-hero-desc">
              We combine artificial intelligence, a NATTA-certified vehicle marketplace, and a
              community of real travelers to help you explore Nepal with clarity and confidence.
            </p>

            <div className="ab-hero-cta">
              <Link to="/trips" className="ab-btn ab-btn-primary">
                <span>Explore Trip Packages</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/marketplace" className="ab-btn ab-btn-outline">
                <span>Browse Vehicles</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ OUR STORY ============ */}
      <section className="ab-story">
        <div className="ab-container">
          <div className="ab-story-grid">
            <div className="ab-story-visual">
              <div className="ab-story-card">
                <Mountain size={48} className="ab-story-icon" />
                <div className="ab-story-card-text">
                  <span className="ab-story-card-label">Est. 2026</span>
                  <span className="ab-story-card-title">Born in Kathmandu</span>
                </div>
              </div>
              <div className="ab-story-card ab-story-card-alt">
                <Sparkles size={48} className="ab-story-icon" />
                <div className="ab-story-card-text">
                  <span className="ab-story-card-label">Built with</span>
                  <span className="ab-story-card-title">AI &amp; Local Insight</span>
                </div>
              </div>
            </div>

            <div className="ab-story-content">
              <span className="ab-eyebrow">Our Story</span>
              <h2 className="ab-section-title">
                A better way to plan your <span className="ab-underline">Nepal adventure</span>
              </h2>
              <p className="ab-story-para">
                Travelers visiting Nepal too often face the same problems — unclear vehicle pricing,
                scattered information across dozens of websites, and uncertainty about which
                operators are actually licensed. At the same time, many honest local vendors
                struggle to reach travelers directly.
              </p>
              <p className="ab-story-para">
                NepalTravelAI was built to close that gap. We bring NATTA-certified vendors, curated
                trip templates, and an AI travel assistant onto a single platform — so tourists
                book with confidence and local businesses get the visibility they deserve.
              </p>

              <div className="ab-story-checks">
                <div className="ab-story-check">
                  <CheckCircle2 size={20} />
                  <span>Certified vendors only</span>
                </div>
                <div className="ab-story-check">
                  <CheckCircle2 size={20} />
                  <span>Transparent NATTA pricing</span>
                </div>
                <div className="ab-story-check">
                  <CheckCircle2 size={20} />
                  <span>AI-powered planning</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MISSION & VISION ============ */}
      <section className="ab-mission">
        <div className="ab-container">
          <div className="ab-mission-grid">
            <div className="ab-mission-card">
              <div className="ab-mission-icon ab-mission-icon-primary">
                <Target size={28} />
              </div>
              <h3 className="ab-mission-title">Our Mission</h3>
              <p className="ab-mission-text">
                To make travel in Nepal transparent, trustworthy, and accessible — by connecting
                tourists with verified local vendors through intelligent, human-centered technology.
              </p>
            </div>

            <div className="ab-mission-card">
              <div className="ab-mission-icon ab-mission-icon-accent">
                <Globe size={28} />
              </div>
              <h3 className="ab-mission-title">Our Vision</h3>
              <p className="ab-mission-text">
                To become Nepal's most trusted travel companion — where every traveler feels
                informed, every vendor feels empowered, and every journey leaves a positive mark on
                the communities that host it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CORE VALUES ============ */}
      <section className="ab-values">
        <div className="ab-container">
          <div className="ab-section-header">
            <span className="ab-eyebrow">What We Stand For</span>
            <h2 className="ab-section-title">Our Core Values</h2>
            <div className="ab-title-underline" />
            <p className="ab-section-subtitle">
              Four principles that guide every product decision we make.
            </p>
          </div>

          <div className="ab-values-grid">
            {values.map((v, i) => (
              <div key={i} className="ab-value-card" style={{ animationDelay: `${0.1 * i}s` }}>
                <div className="ab-value-icon">
                  <v.icon size={26} />
                </div>
                <h4 className="ab-value-title">{v.title}</h4>
                <p className="ab-value-desc">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHAT WE OFFER ============ */}
      <section className="ab-offer">
        <div className="ab-container">
          <div className="ab-section-header">
            <span className="ab-eyebrow">What We Offer</span>
            <h2 className="ab-section-title">One platform. Every step of your trip.</h2>
            <div className="ab-title-underline" />
          </div>

          <div className="ab-offer-grid">
            {offerings.map((o, i) => (
              <div key={i} className="ab-offer-card">
                <div className="ab-offer-icon">
                  <o.icon size={24} />
                </div>
                <div className="ab-offer-body">
                  <h4 className="ab-offer-title">{o.title}</h4>
                  <p className="ab-offer-text">{o.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="ab-stats">
        <div className="ab-container">
          <div className="ab-stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="ab-stat">
                <span className="ab-stat-number">{s.number}</span>
                <span className="ab-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="ab-how">
        <div className="ab-container">
          <div className="ab-section-header">
            <span className="ab-eyebrow">How It Works</span>
            <h2 className="ab-section-title">From idea to itinerary — in four steps</h2>
            <div className="ab-title-underline" />
          </div>

          <div className="ab-steps">
            {steps.map((s, i) => (
              <div key={i} className="ab-step">
                <span className="ab-step-num">{s.num}</span>
                <h4 className="ab-step-title">{s.title}</h4>
                <p className="ab-step-text">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="ab-cta">
        <div className="ab-container">
          <div className="ab-cta-card">
            <div className="ab-cta-badge">
              <Award size={16} />
              <span>Trusted by travelers across Nepal</span>
            </div>
            <h2 className="ab-cta-title">Ready to plan your Nepal journey?</h2>
            <p className="ab-cta-text">
              Start a conversation with our AI assistant or browse certified vehicles — your next
              adventure is a few clicks away.
            </p>
            <div className="ab-cta-actions">
              <Link to="/signup" className="ab-btn ab-btn-primary">
                <span>Create Free Account</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/marketplace" className="ab-btn ab-btn-outline-light">
                <span>Browse Marketplace</span>
              </Link>
            </div>

            <div className="ab-cta-trust">
              <div className="ab-cta-trust-item">
                <Star size={16} /> NATTA Certified
              </div>
              <div className="ab-cta-trust-item">
                <Star size={16} /> Transparent Pricing
              </div>
              <div className="ab-cta-trust-item">
                <Star size={16} /> Local-First Platform
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
