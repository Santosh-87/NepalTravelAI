import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import marketplaceService from '../services/marketplace';
import { Search, Filter, Users, MapPin, ChevronRight, X, Star } from 'lucide-react';
import './Marketplace.css';

const Marketplace = () => {
    const [vehicles, setVehicles] = useState([]);
    const [filteredVehicles, setFilteredVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [filters, setFilters] = useState({
        vehicle_type: '',
        location: '',
        min_capacity: '',
        min_price: '',
        max_price: '',
    });

    useEffect(() => {
        loadVehicles();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [vehicles, filters]);

    const loadVehicles = async () => {
        try {
            setLoading(true);
            const data = await marketplaceService.getPublicVehicles();
            setVehicles(data);
        } catch (err) {
            console.error('Failed to load vehicles:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...vehicles];

        if (filters.vehicle_type) {
            filtered = filtered.filter(v => v.vehicle_type === filters.vehicle_type);
        }

        if (filters.location) {
            filtered = filtered.filter(v =>
                v.available_location.toLowerCase().includes(filters.location.toLowerCase())
            );
        }

        if (filters.min_capacity) {
            filtered = filtered.filter(v => v.seating_capacity >= parseInt(filters.min_capacity));
        }

        if (filters.min_price) {
            filtered = filtered.filter(v => v.price_per_day >= parseFloat(filters.min_price));
        }

        if (filters.max_price) {
            filtered = filtered.filter(v => v.price_per_day <= parseFloat(filters.max_price));
        }

        setFilteredVehicles(filtered);
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({
            vehicle_type: '',
            location: '',
            min_capacity: '',
            min_price: '',
            max_price: '',
        });
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== '');

    return (
        <div className="marketplace-page">
            <Navigation />

            {/* Hero Section */}
            <div className="marketplace-hero">
                <div className="marketplace-hero-overlay"></div>
                <div className="marketplace-hero-container">
                    <div className="hero-content">
                        <h1 className="hero-title">Vehicle Marketplace</h1>
                        <p className="hero-subtitle">Find the perfect vehicle for your Nepal adventure</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="marketplace-container">
                {/* Mobile Filter Toggle */}
                <button
                    className="mobile-filter-toggle"
                    onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                >
                    <Filter size={20} />
                    <span>Filters</span>
                </button>

                {/* Filters Sidebar */}
                <aside className={`marketplace-filters ${mobileFiltersOpen ? 'open' : ''}`}>
                    <div className="filters-header">
                        <h3>
                            <Filter size={20} />
                            Filters
                        </h3>
                        <button
                            className="close-filters"
                            onClick={() => setMobileFiltersOpen(false)}
                            aria-label="Close filters"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {hasActiveFilters && (
                        <button className="clear-filters-btn" onClick={clearFilters}>
                            Clear All Filters
                        </button>
                    )}

                    <div className="filter-group">
                        <label>Vehicle Type</label>
                        <select
                            value={filters.vehicle_type}
                            onChange={(e) => handleFilterChange('vehicle_type', e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="car">Car</option>
                            <option value="suv">SUV</option>
                            <option value="hiace">Hiace/Van</option>
                            <option value="coaster">Coaster</option>
                            <option value="bus">Bus</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Location</label>
                        <input
                            type="text"
                            placeholder="e.g., Kathmandu"
                            value={filters.location}
                            onChange={(e) => handleFilterChange('location', e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <label>Minimum Capacity</label>
                        <input
                            type="number"
                            min="1"
                            placeholder="e.g., 4"
                            value={filters.min_capacity}
                            onChange={(e) => handleFilterChange('min_capacity', e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <label>Price Range (NPR/day)</label>
                        <div className="price-inputs">
                            <input
                                type="number"
                                placeholder="Min"
                                value={filters.min_price}
                                onChange={(e) => handleFilterChange('min_price', e.target.value)}
                            />
                            <span>to</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={filters.max_price}
                                onChange={(e) => handleFilterChange('max_price', e.target.value)}
                            />
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="marketplace-main">
                    <div className="marketplace-header">
                        <div className="results-info">
                            <h2>Available Vehicles</h2>
                            <p className="results-count">
                                {loading ? 'Loading...' : `${filteredVehicles.length} vehicle${filteredVehicles.length !== 1 ? 's' : ''} available`}
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <div className="loader"></div>
                            <p>Loading vehicles...</p>
                        </div>
                    ) : filteredVehicles.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🚗</div>
                            <h3>No vehicles found</h3>
                            <p>Try adjusting your filters to find more options</p>
                            {hasActiveFilters && (
                                <button className="btn btn-primary" onClick={clearFilters}>
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="vehicles-grid">
                            {filteredVehicles.map(vehicle => (
                                <VehicleMarketplaceCard key={vehicle.id} vehicle={vehicle} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
};

const getImgSrc = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://localhost:8000${url.startsWith('/') ? url : `/${url}`}`;
};

// Vehicle Marketplace Card Component - MOVED OUTSIDE the main component
const VehicleMarketplaceCard = ({ vehicle }) => {
    const getVehicleTypeLabel = (type) => {
        const labels = {
            car: 'Car',
            suv: 'SUV',
            hiace: 'Hiace/Van',
            coaster: 'Coaster',
            bus: 'Bus',
        };
        return labels[type] || type;
    };

    return (
        <Link to={`/vehicle/${vehicle.id}`} className="vehicle-marketplace-card">
            <div className="vehicle-image-container">
                {vehicle.primary_image ? (
                    <img src={getImgSrc(vehicle.primary_image)} alt={vehicle.vehicle_name} />
                ) : (
                    <div className="placeholder-icon">🚗</div>
                )}
                <div className="vehicle-type-badge">
                    {getVehicleTypeLabel(vehicle.vehicle_type)}
                </div>
                <div className="vehicle-overlay"></div>
            </div>

            <div className="vehicle-card-content">
                <h3 className="vehicle-name">{vehicle.vehicle_name}</h3>

                <div className="vehicle-info">
                    <div className="info-item">
                        <Users size={16} />
                        <span>{vehicle.seating_capacity} seats</span>
                    </div>
                    <div className="info-item">
                        <MapPin size={16} />
                        <span>{vehicle.available_location}</span>
                    </div>
                </div>

                <p className="vehicle-description">
                    {vehicle.description?.substring(0, 100)}
                    {vehicle.description?.length > 100 ? '...' : ''}
                </p>

                {vehicle.features && (
                    <div className="vehicle-features">
                        {vehicle.features.split(',').slice(0, 3).map((feature, index) => (
                            <span key={index} className="feature-tag">
                                {feature.trim()}
                            </span>
                        ))}
                    </div>
                )}

                <div className="vehicle-card-footer">
                    {vehicle.rating_count > 0 && (
                        <div className="vehicle-rating-badge">
                            <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                            <span className="vehicle-rating-score">{Number(vehicle.average_rating).toFixed(1)}</span>
                            <span className="vehicle-rating-count">({vehicle.rating_count})</span>
                        </div>
                    )}
                    <div className="vehicle-price">
                        <span className="price-label">From</span>
                        <span className="price-amount">NPR {vehicle.price_per_day?.toLocaleString()}</span>
                        <span className="price-period">/day</span>
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

export default Marketplace; 