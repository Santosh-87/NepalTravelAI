import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import marketplaceService from '../services/marketplace';
import authService from '../services/auth';
import {
    Calendar,
    Car,
    CheckCircle,
    Clock,
    ArrowRight,
    MessageSquare,
    MapPin,
} from 'lucide-react';
import './TouristDashboard.css';

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
};

const STATUS_STYLES = {
    pending: 'td-booking-status--pending',
    confirmed: 'td-booking-status--confirmed',
    completed: 'td-booking-status--completed',
    cancelled: 'td-booking-status--cancelled',
};

const STATS_CONFIG = [
    { key: 'total', icon: Calendar, label: 'Total Bookings', color: 'var(--td-stat-total)' },
    { key: 'pending', icon: Clock, label: 'Pending', color: 'var(--td-stat-pending)', filter: 'pending' },
    { key: 'confirmed', icon: CheckCircle, label: 'Confirmed', color: 'var(--td-stat-confirmed)', filter: 'confirmed' },
    { key: 'completed', icon: Car, label: 'Completed', color: 'var(--td-stat-completed)', filter: 'completed' },
];

const TouristDashboard = () => {
    const [bookings, setBookings] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [bookingsData, userData] = await Promise.all([
                marketplaceService.getMyBookings(),
                authService.getProfile(),
            ]);
            setBookings(bookingsData);
            setUser(userData);
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatValue = (stat) => {
        if (stat.key === 'total') return bookings.length;
        return bookings.filter((b) => b.status === stat.filter).length;
    };

    const recentBookings = bookings.slice(0, 3);
    const firstName = user?.full_name?.split(' ')[0] || 'Traveler';

    if (loading) {
        return (
            <>
                <Navigation />
                <div className="tourist-dashboard">
                    <div className="td-loading">
                        <div className="td-spinner" />
                        <p>Loading your dashboard...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navigation />

            <div className="tourist-dashboard">
                <div className="container">
                    {/* Welcome Banner */}
                    <div className="td-welcome">
                        <div className="td-welcome-text">
                            <div className="td-welcome-greeting">{getGreeting()}</div>
                            <h1>Welcome back, {firstName}!</h1>
                            <p>Plan your next adventure in Nepal</p>
                        </div>
                        <Link to="/marketplace" className="td-welcome-cta">
                            <Car size={18} />
                            Browse Vehicles
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="td-stats">
                        {STATS_CONFIG.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.key} className="td-stat-card">
                                    <div
                                        className="td-stat-icon"
                                        style={{
                                            background: `color-mix(in srgb, ${stat.color} 12%, transparent)`,
                                            color: stat.color,
                                        }}
                                    >
                                        <Icon size={22} />
                                    </div>
                                    <div>
                                        <div className="td-stat-value">{getStatValue(stat)}</div>
                                        <div className="td-stat-label">{stat.label}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Content: Bookings + Quick Actions */}
                    <div className="td-content-grid">
                        {/* Recent Bookings */}
                        <div className="td-section">
                            <div className="td-section-header">
                                <h2>Recent Bookings</h2>
                                {bookings.length > 0 && (
                                    <Link to="/my-bookings" className="td-view-all">
                                        View All
                                        <ArrowRight size={14} />
                                    </Link>
                                )}
                            </div>

                            {recentBookings.length === 0 ? (
                                <div className="td-empty">
                                    <div className="td-empty-icon">
                                        <Calendar size={28} />
                                    </div>
                                    <h3>No bookings yet</h3>
                                    <p>Start your journey by booking a vehicle</p>
                                    <Link to="/marketplace" className="td-empty-cta">
                                        <Car size={16} />
                                        Browse Vehicles
                                    </Link>
                                </div>
                            ) : (
                                <div className="td-bookings-list">
                                    {recentBookings.map((booking) => (
                                        <BookingPreviewCard
                                            key={booking.id}
                                            booking={booking}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick Actions Sidebar */}
                        <div className="td-section">
                            <div className="td-section-header">
                                <h2>Quick Actions</h2>
                            </div>
                            <div className="td-actions-list">
                                <Link to="/marketplace" className="td-action-card">
                                    <div className="td-action-icon">
                                        <Car size={20} />
                                    </div>
                                    <div className="td-action-text">
                                        <h3>Browse Vehicles</h3>
                                        <p>Find your perfect ride</p>
                                    </div>
                                </Link>

                                <Link to="/my-bookings" className="td-action-card">
                                    <div className="td-action-icon">
                                        <Calendar size={20} />
                                    </div>
                                    <div className="td-action-text">
                                        <h3>My Bookings</h3>
                                        <p>View booking history</p>
                                    </div>
                                </Link>

                                <Link to="/trips" className="td-action-card">
                                    <div className="td-action-icon">
                                        <MapPin size={20} />
                                    </div>
                                    <div className="td-action-text">
                                        <h3>Trip Templates</h3>
                                        <p>Pre-planned itineraries</p>
                                    </div>
                                </Link>

                                <Link to="/chat" className="td-action-card">
                                    <div className="td-action-icon">
                                        <MessageSquare size={20} />
                                    </div>
                                    <div className="td-action-text">
                                        <h3>AI Assistant</h3>
                                        <p>Get travel recommendations</p>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
};

const BookingPreviewCard = ({ booking }) => {
    const statusClass = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;

    return (
        <Link to="/my-bookings" className="td-booking-card">
            <div className="td-booking-top">
                <h4 className="td-booking-vehicle">{booking.vehicle_name}</h4>
                <span className={`td-booking-status ${statusClass}`}>
                    {booking.status}
                </span>
            </div>
            <div className="td-booking-meta">
                <span>
                    <Calendar size={13} />
                    {new Date(booking.start_date).toLocaleDateString()}
                </span>
                <span className="td-separator" />
                <span>
                    {booking.total_days} day{booking.total_days > 1 ? 's' : ''}
                </span>
                <span className="td-separator" />
                <span>NPR {booking.total_price?.toLocaleString()}</span>
            </div>
        </Link>
    );
};

export default TouristDashboard;
