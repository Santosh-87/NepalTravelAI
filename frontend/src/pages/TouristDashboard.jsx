import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import marketplaceService from '../services/marketplace';
import authService from '../services/auth';
import { Calendar, Car, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import './TouristDashboard.css';

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
                marketplaceService.getMyBookingsAsTourist(),
                authService.getProfile()
            ]);

            setBookings(bookingsData);
            setUser(userData);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        {
            icon: Calendar,
            label: 'Total Bookings',
            value: bookings.length,
            color: '#667eea'
        },
        {
            icon: Clock,
            label: 'Pending',
            value: bookings.filter(b => b.status === 'pending').length,
            color: '#ffc107'
        },
        {
            icon: CheckCircle,
            label: 'Confirmed',
            value: bookings.filter(b => b.status === 'confirmed').length,
            color: '#28a745'
        },
        {
            icon: Car,
            label: 'Completed',
            value: bookings.filter(b => b.status === 'completed').length,
            color: '#17a2b8'
        }
    ];

    const recentBookings = bookings.slice(0, 3);

    if (loading) {
        return (
            <>
                <Navigation />
                <div className="loading-page">
                    <div className="loader"></div>
                    <p>Loading dashboard...</p>
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
                    {/* Welcome Section */}
                    <div className="dashboard-welcome">
                        <div>
                            <h1>Welcome back, {user?.full_name?.split(' ')[0] || 'Traveler'}!</h1>
                            <p>Plan your next adventure in Nepal</p>
                        </div>
                        <Link to="/marketplace" className="btn-primary">
                            <Car size={20} />
                            Browse Vehicles
                        </Link>
                    </div>

                    {/* Stats Grid */}
                    <div className="stats-grid">
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-card">
                                <div
                                    className="stat-icon"
                                    style={{ background: `${stat.color}15`, color: stat.color }}
                                >
                                    <stat.icon size={24} />
                                </div>
                                <div className="stat-content">
                                    <div className="stat-value">{stat.value}</div>
                                    <div className="stat-label">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Recent Bookings */}
                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>Recent Bookings</h2>
                            <Link to="/my-bookings" className="view-all">
                                View All
                                <ArrowRight size={16} />
                            </Link>
                        </div>

                        {recentBookings.length === 0 ? (
                            <div className="empty-bookings">
                                <div className="empty-icon">🚗</div>
                                <h3>No bookings yet</h3>
                                <p>Start your journey by booking a vehicle</p>
                                <Link to="/marketplace" className="btn-primary">
                                    Browse Vehicles
                                </Link>
                            </div>
                        ) : (
                            <div className="bookings-preview">
                                {recentBookings.map(booking => (
                                    <BookingPreviewCard key={booking.id} booking={booking} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="quick-actions">
                        <h2>Quick Actions</h2>
                        <div className="actions-grid">
                            <Link to="/marketplace" className="action-card">
                                <Car size={32} />
                                <h3>Browse Vehicles</h3>
                                <p>Find your perfect ride</p>
                            </Link>

                            <Link to="/my-bookings" className="action-card">
                                <Calendar size={32} />
                                <h3>My Bookings</h3>
                                <p>View booking history</p>
                            </Link>

                            <Link to="/chat" className="action-card">
                                <div style={{ fontSize: '32px' }}>🤖</div>
                                <h3>AI Assistant</h3>
                                <p>Get travel recommendations</p>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
};

// Booking Preview Card
const BookingPreviewCard = ({ booking }) => {
    const statusColors = {
        pending: { bg: '#fff3cd', color: '#856404' },
        confirmed: { bg: '#d4edda', color: '#155724' },
        cancelled: { bg: '#f8d7da', color: '#721c24' },
        completed: { bg: '#d1ecf1', color: '#0c5460' },
    };

    const status = statusColors[booking.status] || statusColors.pending;

    return (
        <div className="booking-preview-card">
            <div className="preview-header">
                <h4>{booking.vehicle_name}</h4>
                <span
                    className="preview-status"
                    style={{ background: status.bg, color: status.color }}
                >
                    {booking.status}
                </span>
            </div>
            <div className="preview-details">
                <span>{new Date(booking.start_date).toLocaleDateString()}</span>
                <span>•</span>
                <span>{booking.total_days} day{booking.total_days > 1 ? 's' : ''}</span>
                <span>•</span>
                <span>NPR {booking.total_price.toLocaleString()}</span>
            </div>
        </div>
    );
};

export default TouristDashboard;