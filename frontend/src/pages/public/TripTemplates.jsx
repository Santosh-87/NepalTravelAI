import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../../components/shared/Navigation';
import Footer from '../../components/shared/Footer';
import tripsService from '../../services/trips';
import { Mountain, Calendar, TrendingUp, DollarSign, ChevronRight, Filter, X, Sun } from 'lucide-react';
import './TripTemplates.css';

const CATEGORIES = [
    { value: '', label: 'All Trips' },
    { value: 'trekking', label: 'Trekking' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'adventure', label: 'Adventure' },
    { value: 'wildlife', label: 'Wildlife' },
    { value: 'pilgrimage', label: 'Pilgrimage' },
];

const DIFFICULTIES = [
    { value: '', label: 'Any Difficulty' },
    { value: 'easy', label: 'Easy' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'challenging', label: 'Challenging' },
    { value: 'strenuous', label: 'Strenuous' },
];

const TripTemplates = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    useEffect(() => {
        loadTrips();
    }, [activeCategory, difficulty]);

    const loadTrips = async () => {
        try {
            setLoading(true);
            const filters = {};
            if (activeCategory) filters.category = activeCategory;
            if (difficulty) filters.difficulty = difficulty;
            const data = await tripsService.getTemplates(filters);
            setTrips(data);
        } catch (err) {
            console.error('Failed to load trips:', err);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setActiveCategory('');
        setDifficulty('');
    };

    const hasActiveFilters = activeCategory || difficulty;

    const getDifficultyColor = (diff) => {
        const colors = {
            easy: '#22c55e',
            moderate: '#f59e0b',
            challenging: '#f97316',
            strenuous: '#ef4444',
        };
        return colors[diff] || '#6b7280';
    };

    const getCategoryIcon = (cat) => {
        const icons = {
            trekking: '🏔️',
            cultural: '🏛️',
            adventure: '🪂',
            wildlife: '🦏',
            pilgrimage: '🙏',
        };
        return icons[cat] || '✈️';
    };

    const getImgSrc = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `http://localhost:8000${url.startsWith('/') ? url : `/${url}`}`;
    };

    return (
        <div className="trips-page">
            <Navigation />

            {/* Hero Section */}
            <div className="trips-hero">
                <div className="trips-hero-overlay"></div>
                <div className="trips-hero-container">
                    <div className="trips-hero-content">
                        <span className="trips-hero-badge">
                            <Mountain size={16} />
                            Curated Experiences
                        </span>
                        <h1 className="trips-hero-title">Discover Nepal Trip Packages</h1>
                        <p className="trips-hero-subtitle">
                            Explore our handpicked collection of Nepal's most iconic journeys — from Himalayan treks to cultural immersions
                        </p>
                    </div>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="trips-categories-bar">
                <div className="trips-categories-container">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.value}
                            className={`category-tab ${activeCategory === cat.value ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat.value)}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="trips-container">
                {/* Filters Sidebar */}
                <aside className={`trips-filters ${mobileFiltersOpen ? 'open' : ''}`}>
                    <div className="filters-header">
                        <h3><Filter size={18} /> Filters</h3>
                        <button className="close-filters" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">
                            <X size={20} />
                        </button>
                    </div>

                    {hasActiveFilters && (
                        <button className="clear-filters-btn" onClick={clearFilters}>Clear All Filters</button>
                    )}

                    <div className="filter-group">
                        <label>Difficulty</label>
                        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                            {DIFFICULTIES.map(d => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                        </select>
                    </div>
                </aside>

                {/* Mobile Filter Toggle */}
                <button className="mobile-filter-toggle" onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}>
                    <Filter size={20} />
                    <span>Filters</span>
                </button>

                {/* Trip Cards */}
                <div className="trips-main">
                    <div className="trips-header">
                        <div className="results-info">
                            <h2>Trip Packages</h2>
                            <p className="results-count">
                                {loading ? 'Loading...' : `${trips.length} package${trips.length !== 1 ? 's' : ''} available`}
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <div className="loader"></div>
                            <p>Loading trip packages...</p>
                        </div>
                    ) : trips.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon"><Mountain size={48} /></div>
                            <h3>No trips found</h3>
                            <p>Try adjusting your filters to discover more packages</p>
                            {hasActiveFilters && (
                                <button className="btn btn-primary" onClick={clearFilters}>Clear Filters</button>
                            )}
                        </div>
                    ) : (
                        <div className="trips-grid">
                            {trips.map(trip => (
                                <TripCard key={trip.id} trip={trip} getImgSrc={getImgSrc} getDifficultyColor={getDifficultyColor} getCategoryIcon={getCategoryIcon} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
};

const TripCard = ({ trip, getImgSrc, getDifficultyColor, getCategoryIcon }) => {
    return (
        <Link to={`/trips/${trip.slug}`} className="trip-card">
            <div className="trip-image-container">
                {trip.cover_image ? (
                    <img src={getImgSrc(trip.cover_image)} alt={trip.title} />
                ) : (
                    <div className="trip-placeholder">
                        <Mountain size={48} />
                    </div>
                )}
                <div className="trip-badges">
                    <span className="trip-category-badge">
                        {getCategoryIcon(trip.category)} {trip.category}
                    </span>
                    <span className="trip-difficulty-badge" style={{ backgroundColor: getDifficultyColor(trip.difficulty) }}>
                        {trip.difficulty}
                    </span>
                </div>
                <div className="trip-overlay"></div>
            </div>

            <div className="trip-card-content">
                <h3 className="trip-title">{trip.title}</h3>

                <div className="trip-stats">
                    <div className="trip-stat">
                        <Calendar size={14} />
                        <span>{trip.duration_days} days</span>
                    </div>
                    <div className="trip-stat">
                        <TrendingUp size={14} />
                        <span>{trip.max_altitude.toLocaleString()}m</span>
                    </div>
                    <div className="trip-stat">
                        <Sun size={14} />
                        <span>{trip.best_season.split(',')[0]}</span>
                    </div>
                </div>

                <p className="trip-description">
                    {trip.description?.substring(0, 120)}{trip.description?.length > 120 ? '...' : ''}
                </p>

                {trip.highlights && (
                    <div className="trip-highlights-preview">
                        {trip.highlights.slice(0, 2).map((h, i) => (
                            <span key={i} className="highlight-tag">{h.length > 40 ? h.substring(0, 40) + '...' : h}</span>
                        ))}
                    </div>
                )}

                <div className="trip-card-footer">
                    <div className="trip-price">
                        <span className="price-label">From</span>
                        <span className="price-amount">${trip.starting_price?.toLocaleString()}</span>
                        <span className="price-period">/person</span>
                    </div>
                    <div className="view-details">
                        View Details
                        <ChevronRight size={16} />
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default TripTemplates;
