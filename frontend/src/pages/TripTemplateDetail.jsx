import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import tripsService from '../services/trips';
import {
    Mountain, Calendar, TrendingUp, DollarSign, Sun, ArrowLeft,
    Check, X, ChevronDown, ChevronUp, MessageCircle, Clock, Star
} from 'lucide-react';
import './TripTemplateDetail.css';

const TripTemplateDetail = () => {
    const { slug } = useParams();
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedDays, setExpandedDays] = useState({});
    const [relatedTrips, setRelatedTrips] = useState([]);

    useEffect(() => {
        loadTrip();
    }, [slug]);

    const loadTrip = async () => {
        try {
            setLoading(true);
            const data = await tripsService.getTemplateDetail(slug);
            setTrip(data);

            // Load related trips (same category)
            const allTrips = await tripsService.getTemplates({ category: data.category });
            setRelatedTrips(allTrips.filter(t => t.slug !== slug).slice(0, 3));
        } catch (err) {
            console.error('Failed to load trip:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (day) => {
        setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
    };

    const expandAll = () => {
        if (!trip) return;
        const allExpanded = {};
        trip.itinerary_days.forEach((_, i) => { allExpanded[i] = true; });
        setExpandedDays(allExpanded);
    };

    const collapseAll = () => {
        setExpandedDays({});
    };

    const getImgSrc = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `http://localhost:8000${url.startsWith('/') ? url : `/${url}`}`;
    };

    const getDifficultyColor = (diff) => {
        const colors = { easy: '#22c55e', moderate: '#f59e0b', challenging: '#f97316', strenuous: '#ef4444' };
        return colors[diff] || '#6b7280';
    };

    if (loading) {
        return (
            <div className="trip-detail-page">
                <Navigation />
                <div className="loading-state">
                    <div className="loader"></div>
                    <p>Loading trip details...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="trip-detail-page">
                <Navigation />
                <div className="empty-state">
                    <Mountain size={48} />
                    <h3>Trip not found</h3>
                    <Link to="/trips" className="btn btn-primary">Browse All Trips</Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="trip-detail-page">
            <Navigation />

            {/* Hero Image */}
            <div className="trip-detail-hero" style={trip.cover_image ? { backgroundImage: `url(${getImgSrc(trip.cover_image)})` } : {}}>
                <div className="trip-detail-hero-overlay">
                    <div className="trip-detail-hero-content">
                        <Link to="/trips" className="back-link"><ArrowLeft size={18} /> All Trip Packages</Link>
                        <div className="trip-detail-badges">
                            <span className="badge-category">{trip.category}</span>
                            <span className="badge-difficulty" style={{ backgroundColor: getDifficultyColor(trip.difficulty) }}>
                                {trip.difficulty}
                            </span>
                        </div>
                        <h1 className="trip-detail-title">{trip.title}</h1>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="trip-stats-bar">
                <div className="trip-stats-container">
                    <div className="stat-item">
                        <Calendar size={20} />
                        <div>
                            <span className="stat-value">{trip.duration_days} Days</span>
                            <span className="stat-label">Duration</span>
                        </div>
                    </div>
                    <div className="stat-item">
                        <TrendingUp size={20} />
                        <div>
                            <span className="stat-value">{trip.max_altitude.toLocaleString()}m</span>
                            <span className="stat-label">Max Altitude</span>
                        </div>
                    </div>
                    <div className="stat-item">
                        <Sun size={20} />
                        <div>
                            <span className="stat-value">{trip.best_season}</span>
                            <span className="stat-label">Best Season</span>
                        </div>
                    </div>
                    <div className="stat-item">
                        <DollarSign size={20} />
                        <div>
                            <span className="stat-value">${trip.starting_price.toLocaleString()}</span>
                            <span className="stat-label">From / person</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="trip-detail-container">
                <div className="trip-detail-main">

                    {/* Description */}
                    <section className="trip-section">
                        <h2 className="section-title">Overview</h2>
                        <div className="trip-description-text">
                            {trip.description.split('\n\n').map((p, i) => (
                                <p key={i}>{p}</p>
                            ))}
                        </div>
                    </section>

                    {/* Highlights */}
                    {trip.highlights && trip.highlights.length > 0 && (
                        <section className="trip-section">
                            <h2 className="section-title">Trip Highlights</h2>
                            <div className="highlights-grid">
                                {trip.highlights.map((h, i) => (
                                    <div key={i} className="highlight-item">
                                        <Star size={16} className="highlight-icon" />
                                        <span>{h}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Itinerary */}
                    {trip.itinerary_days && trip.itinerary_days.length > 0 && (
                        <section className="trip-section">
                            <div className="section-title-row">
                                <h2 className="section-title">Day-by-Day Itinerary</h2>
                                <div className="itinerary-actions">
                                    <button onClick={expandAll} className="itinerary-toggle-btn">Expand All</button>
                                    <button onClick={collapseAll} className="itinerary-toggle-btn">Collapse All</button>
                                </div>
                            </div>
                            <div className="itinerary-timeline">
                                {trip.itinerary_days.map((day, i) => (
                                    <div key={i} className={`itinerary-day ${expandedDays[i] ? 'expanded' : ''}`}>
                                        <div className="day-header" onClick={() => toggleDay(i)}>
                                            <div className="day-marker">
                                                <span className="day-number">Day {day.day}</span>
                                            </div>
                                            <div className="day-info">
                                                <h4 className="day-title">{day.title}</h4>
                                                {day.altitude && <span className="day-altitude">{day.altitude}</span>}
                                            </div>
                                            <div className="day-chevron">
                                                {expandedDays[i] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </div>
                                        </div>
                                        {expandedDays[i] && (
                                            <div className="day-content">
                                                <p>{day.description}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Included / Excluded */}
                    <section className="trip-section">
                        <h2 className="section-title">What's Included & Excluded</h2>
                        <div className="inclusions-grid">
                            <div className="inclusions-col included">
                                <h3><Check size={18} /> Included</h3>
                                <ul>
                                    {trip.included_services?.map((s, i) => (
                                        <li key={i}><Check size={14} className="icon-check" /> {s}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="inclusions-col excluded">
                                <h3><X size={18} /> Excluded</h3>
                                <ul>
                                    {trip.excluded_services?.map((s, i) => (
                                        <li key={i}><X size={14} className="icon-x" /> {s}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar */}
                <aside className="trip-detail-sidebar">
                    <div className="booking-cta-card">
                        <div className="cta-price">
                            <span className="cta-price-label">Starting from</span>
                            <span className="cta-price-amount">${trip.starting_price.toLocaleString()}</span>
                            <span className="cta-price-note">per person</span>
                        </div>
                        <Link to="/chat" className="cta-button">
                            <MessageCircle size={18} />
                            Plan This Trip with AI
                        </Link>
                        <p className="cta-note">Chat with our AI to customize this itinerary and get instant recommendations</p>

                        <div className="cta-details">
                            <div className="cta-detail-item">
                                <Calendar size={16} />
                                <span>{trip.duration_days} days</span>
                            </div>
                            <div className="cta-detail-item">
                                <TrendingUp size={16} />
                                <span>{trip.difficulty} difficulty</span>
                            </div>
                            <div className="cta-detail-item">
                                <Mountain size={16} />
                                <span>{trip.max_altitude.toLocaleString()}m max altitude</span>
                            </div>
                            <div className="cta-detail-item">
                                <Sun size={16} />
                                <span>{trip.best_season}</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Related Trips */}
            {relatedTrips.length > 0 && (
                <div className="related-trips-section">
                    <div className="related-trips-container">
                        <h2 className="section-title">Similar Trip Packages</h2>
                        <div className="related-trips-grid">
                            {relatedTrips.map(t => (
                                <Link key={t.id} to={`/trips/${t.slug}`} className="related-trip-card">
                                    <div className="related-trip-image">
                                        {t.cover_image ? (
                                            <img src={getImgSrc(t.cover_image)} alt={t.title} />
                                        ) : (
                                            <div className="trip-placeholder"><Mountain size={32} /></div>
                                        )}
                                    </div>
                                    <div className="related-trip-info">
                                        <h4>{t.title}</h4>
                                        <div className="related-trip-meta">
                                            <span>{t.duration_days} days</span>
                                            <span>${t.starting_price.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default TripTemplateDetail;
