import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import marketplaceService from '../services/marketplace';
import BookingModal from '../pages/BookingModal';
import authService from '../services/auth';
import {
    Users, MapPin, Phone, ArrowLeft, Calendar, CheckCircle
} from 'lucide-react';
import './VehicleDetails.css';

const getImgSrc = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://localhost:8000${url.startsWith('/') ? url : `/${url}`}`;
};

const VehicleDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showBookingModal, setShowBookingModal] = useState(false);

    useEffect(() => {
        loadVehicle();
    }, [id]);

    const loadVehicle = async () => {
        try {
            setLoading(true);
            const data = await marketplaceService.getVehicleDetails(id);
            setVehicle(data);
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
                        </div>

                        {/* Right Column - Booking Card */}
                        <div className="vehicle-sidebar">
                            <div className="booking-card">
                                <div className="price-display">
                                    <span className="price-amount">
                                        NPR {vehicle.price_per_day.toLocaleString()}
                                    </span>
                                    <span className="price-period">per day</span>
                                </div>

                                <button className="btn-book" onClick={handleBookNow}>
                                    <Calendar size={20} />
                                    Book Now
                                </button>

                                <div className="booking-info">
                                    <p>✓ NATTA Certified Vehicle</p>
                                    <p>✓ Transparent Pricing</p>
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