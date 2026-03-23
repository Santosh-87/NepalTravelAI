import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import marketplaceService from '../services/marketplace';
import BookingModal from '../pages/BookingModal';
import authService from '../services/auth';
import {
    Users, MapPin, Phone, ArrowLeft, Calendar, CheckCircle, Star
} from 'lucide-react';
import './VehicleDetails.css';

const getImgSrc = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://localhost:8000${url.startsWith('/') ? url : `/${url}`}`;
};

const StarDisplay = ({ rating, size = 16 }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars.push(<Star key={i} size={size} fill="#f59e0b" stroke="#f59e0b" />);
        } else if (i === fullStars && hasHalf) {
            stars.push(<Star key={i} size={size} fill="#f59e0b" stroke="#f59e0b" style={{ clipPath: 'inset(0 50% 0 0)' }} />);
        } else {
            stars.push(<Star key={i} size={size} fill="none" stroke="#d1d5db" />);
        }
    }
    return <div className="star-display">{stars}</div>;
};

const ReviewCard = ({ rating }) => {
    const formatDate = (dateString) =>
        new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });

    return (
        <div className="review-card">
            <div className="review-header">
                <div className="review-author">
                    <div className="review-avatar">
                        {rating.tourist_name?.charAt(0).toUpperCase() || 'T'}
                    </div>
                    <div>
                        <div className="review-name">{rating.tourist_name}</div>
                        <div className="review-date">{formatDate(rating.created_at)}</div>
                    </div>
                </div>
                <StarDisplay rating={rating.overall_rating} size={16} />
            </div>

            {(rating.vehicle_condition_rating || rating.punctuality_rating || rating.driver_behavior_rating) && (
                <div className="review-sub-ratings">
                    {rating.vehicle_condition_rating && (
                        <span className="sub-rating">Vehicle: {rating.vehicle_condition_rating}/5</span>
                    )}
                    {rating.punctuality_rating && (
                        <span className="sub-rating">Punctuality: {rating.punctuality_rating}/5</span>
                    )}
                    {rating.driver_behavior_rating && (
                        <span className="sub-rating">Driver: {rating.driver_behavior_rating}/5</span>
                    )}
                </div>
            )}

            {rating.review_text && (
                <p className="review-text">{rating.review_text}</p>
            )}
        </div>
    );
};

const VehicleDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [ratingsData, setRatingsData] = useState({ ratings: [], average_rating: 0, rating_count: 0 });

    useEffect(() => {
        loadVehicle();
    }, [id]);

    const loadVehicle = async () => {
        try {
            setLoading(true);
            const [vehicleData, ratingsResponse] = await Promise.all([
                marketplaceService.getVehicleDetails(id),
                marketplaceService.getVehicleRatings(id).catch(() => ({ ratings: [], average_rating: 0, rating_count: 0 })),
            ]);
            setVehicle(vehicleData);
            setRatingsData(ratingsResponse);
        } catch (err) {
            console.error('Failed to load vehicle:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBookNow = () => {
        if (!authService.isAuthenticated()) {
            navigate('/login');
            return;
        }
        setShowBookingModal(true);
    };

    if (loading) {
        return (
            <>
                <Navigation />
                <div className="loading-page">
                    <div className="loader"></div>
                    <p>Loading vehicle details...</p>
                </div>
                <Footer />
            </>
        );
    }

    if (!vehicle) {
        return (
            <>
                <Navigation />
                <div className="error-page">
                    <h2>Vehicle not found</h2>
                    <Link to="/marketplace" className="btn-primary">
                        Back to Marketplace
                    </Link>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navigation />

            <div className="vehicle-details-page">
                <div className="container">
                    <button className="back-link" onClick={() => navigate('/marketplace')}>
                        <ArrowLeft size={20} />
                        Back to Marketplace
                    </button>

                    <div className="vehicle-details-layout">
                        {/* Left Column - Details */}
                        <div className="vehicle-main-content">
                            {/* Image */}
                            <div className="vehicle-hero-image">
                                {vehicle.primary_image ? (
                                    <img src={getImgSrc(vehicle.primary_image)} alt={vehicle.vehicle_name} />
                                ) : (
                                    <div className="placeholder">🚗</div>
                                )}
                            </div>

                            {/* Title & Basic Info */}
                            <div className="vehicle-header">
                                <div>
                                    <h1>{vehicle.vehicle_name}</h1>
                                    <p className="vehicle-number">{vehicle.vehicle_number}</p>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="vehicle-stats">
                                <div className="stat">
                                    <Users size={20} />
                                    <div>
                                        <div className="stat-value">{vehicle.seating_capacity}</div>
                                        <div className="stat-label">Seats</div>
                                    </div>
                                </div>
                                <div className="stat">
                                    <MapPin size={20} />
                                    <div>
                                        <div className="stat-value">{vehicle.available_location}</div>
                                        <div className="stat-label">Location</div>
                                    </div>
                                </div>
                                <div className="stat">
                                    <Phone size={20} />
                                    <div>
                                        <div className="stat-value">{vehicle.contact_number}</div>
                                        <div className="stat-label">Contact</div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="vehicle-section">
                                <h2>About This Vehicle</h2>
                                <p className="vehicle-description">{vehicle.description}</p>
                            </div>

                            {/* Features */}
                            {vehicle.features && (
                                <div className="vehicle-section">
                                    <h2>Features & Amenities</h2>
                                    <div className="features-grid">
                                        {vehicle.features.split(',').map((feature, index) => (
                                            <div key={index} className="feature-item">
                                                <CheckCircle size={18} />
                                                <span>{feature.trim()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Vendor Info */}
                            <div className="vehicle-section">
                                <h2>Vendor Information</h2>
                                <div className="vendor-card">
                                    <div className="vendor-avatar">
                                        {vehicle.vendor_name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="vendor-name">{vehicle.vendor_name}</div>
                                        <div className="vendor-email">{vehicle.vendor_email}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Reviews & Ratings Section */}
                            <div className="vehicle-section">
                                <h2>Reviews & Ratings</h2>

                                {ratingsData.rating_count > 0 ? (
                                    <>
                                        <div className="rating-summary">
                                            <div className="rating-score">
                                                {ratingsData.average_rating.toFixed(1)}
                                            </div>
                                            <div className="rating-summary-right">
                                                <StarDisplay rating={ratingsData.average_rating} size={20} />
                                                <span className="rating-count-text">
                                                    {ratingsData.rating_count} review{ratingsData.rating_count !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="reviews-list">
                                            {ratingsData.ratings.map(rating => (
                                                <ReviewCard key={rating.id} rating={rating} />
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <p className="no-reviews">No reviews yet for this vehicle.</p>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Booking Card */}
                        <div className="vehicle-sidebar">
                            <div className="booking-card">
                                <div className="price-display">
                                    <span className="price-amount">
                                        NPR {vehicle.price_per_day.toLocaleString()}
                                    </span>
                                    <span className="price-period">per day (Within Valley)</span>
                                    <span className="price-ov-note">
                                        Outside Valley: NPR {Math.round(Number(vehicle.price_per_day) * 1.15).toLocaleString()}/day
                                    </span>
                                </div>

                                {ratingsData.rating_count > 0 && (
                                    <div className="sidebar-rating">
                                        <Star size={16} fill="#f59e0b" stroke="#f59e0b" />
                                        <span className="sidebar-rating-score">
                                            {ratingsData.average_rating.toFixed(1)}
                                        </span>
                                        <span className="sidebar-rating-count">
                                            ({ratingsData.rating_count} review{ratingsData.rating_count !== 1 ? 's' : ''})
                                        </span>
                                    </div>
                                )}

                                <button className="btn-book" onClick={handleBookNow}>
                                    <Calendar size={20} />
                                    Book Now
                                </button>

                                <div className="booking-info">
                                    <p>✓ NATTA Certified Vehicle</p>
                                    <p>✓ Transparent Pricing</p>
                                    <p>✓ Price Negotiation Available</p>
                                    <p>✓ Direct Contact with Vendor</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showBookingModal && (
                <BookingModal
                    vehicle={vehicle}
                    onClose={() => setShowBookingModal(false)}
                />
            )}

            <Footer />
        </>
    );
};

export default VehicleDetails;
