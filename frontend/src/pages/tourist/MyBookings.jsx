import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Navigation from '../../components/shared/Navigation';
import Footer from '../../components/shared/Footer';
import RatingModal from '../../components/tourist/RatingModal';
import marketplaceService from '../../services/marketplace';
import { Calendar, MapPin, User, Phone, CheckCircle, XCircle, Clock, AlertCircle, Star, DollarSign } from 'lucide-react';
import './MyBookings.css';

const MyBookings = () => {
    const location = useLocation();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        loadBookings();

        if (location.state?.message) {
            setSuccessMessage(location.state.message);
            setTimeout(() => setSuccessMessage(''), 5000);
        }
    }, [location]);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const data = await marketplaceService.getMyBookings();
            setBookings(data);
        } catch (err) {
            console.error('Failed to load bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;

        try {
            await marketplaceService.cancelBooking(id);
            setBookings(bookings.map(b =>
                b.id === id ? { ...b, status: 'cancelled' } : b
            ));
        } catch (err) {
            alert('Failed to cancel booking');
        }
    };

    const handleAcceptCounter = async (id) => {
        if (!window.confirm('Accept the vendor\'s counter-offer?')) return;
        try {
            const updated = await marketplaceService.customerRespondToCounter(id, { action: 'accept' });
            setBookings(bookings.map(b => b.id === id ? updated : b));
        } catch (err) {
            alert('Failed to accept counter: ' + err.message);
        }
    };

    const handleRejectCounter = async (id) => {
        if (!window.confirm('Reject the counter-offer? This will cancel the booking.')) return;
        try {
            const updated = await marketplaceService.customerRespondToCounter(id, { action: 'reject' });
            setBookings(bookings.map(b => b.id === id ? updated : b));
        } catch (err) {
            alert('Failed to reject counter: ' + err.message);
        }
    };

    const handleRated = (bookingId) => {
        setBookings(bookings.map(b =>
            b.id === bookingId ? { ...b, has_rating: true } : b
        ));
        setSuccessMessage('Thank you for your review!');
        setTimeout(() => setSuccessMessage(''), 5000);
    };

    const countByStatus = (s) => bookings.filter(b => b.status === s).length;
    const negotiatingCount = bookings.filter(b =>
        ['pending_vendor_approval', 'pending_customer_approval'].includes(b.status)
    ).length;

    const filteredBookings = filter === 'all'
        ? bookings
        : filter === 'negotiating'
            ? bookings.filter(b => ['pending_vendor_approval', 'pending_customer_approval'].includes(b.status))
            : bookings.filter(b => b.status === filter);

    if (loading) {
        return (
            <>
                <Navigation />
                <div className="bookings-loading">
                    <div className="bookings-loader"></div>
                    <p>Loading your bookings...</p>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <div className="my-bookings-page">
            <Navigation />

            {/* Page Hero */}
            <div className="bookings-hero">
                <div className="bookings-hero-overlay"></div>
                <div className="bookings-hero-content">
                    <h1>My Bookings</h1>
                    <p>Track and manage all your vehicle reservations</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="bookings-container">

                {/* Top Bar */}
                <div className="bookings-topbar">
                    <p className="bookings-count">
                        {bookings.length} booking{bookings.length !== 1 ? 's' : ''} in total
                    </p>
                    <Link to="/marketplace" className="btn-browse">
                        Browse Vehicles
                    </Link>
                </div>

                {/* Success Banner */}
                {successMessage && (
                    <div className="success-banner">
                        <CheckCircle size={18} />
                        <span>{successMessage}</span>
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="booking-filters" role="tablist">
                    {[
                        { key: 'all',         label: 'All',         count: bookings.length },
                        { key: 'pending',     label: 'Pending',     count: countByStatus('pending') },
                        { key: 'negotiating', label: 'Negotiating', count: negotiatingCount },
                        { key: 'confirmed',   label: 'Confirmed',   count: countByStatus('confirmed') },
                        { key: 'completed',   label: 'Completed',   count: countByStatus('completed') },
                        { key: 'cancelled',   label: 'Cancelled',   count: countByStatus('cancelled') },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            className={`filter-tab filter-tab--${tab.key} ${filter === tab.key ? 'active' : ''}`}
                            onClick={() => setFilter(tab.key)}
                            role="tab"
                            aria-selected={filter === tab.key}
                        >
                            {tab.label}
                            <span className="tab-count">{tab.count}</span>
                        </button>
                    ))}
                </div>

                {/* Bookings List */}
                {filteredBookings.length === 0 ? (
                    <div className="empty-state">
                        {bookings.length === 0 ? (
                            <>
                                <div className="empty-icon">📅</div>
                                <h3>No bookings yet</h3>
                                <p>Start exploring and book your perfect vehicle for your Nepal adventure</p>
                                <Link to="/marketplace" className="btn-browse">
                                    Browse Marketplace
                                </Link>
                            </>
                        ) : (
                            <>
                                <div className="empty-icon">🔍</div>
                                <h3>No {filter} bookings</h3>
                                <p>Try selecting a different filter tab above</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="bookings-list">
                        {filteredBookings.map(booking => (
                            <BookingCard
                                key={booking.id}
                                booking={booking}
                                onCancel={handleCancel}
                                onAcceptCounter={handleAcceptCounter}
                                onRejectCounter={handleRejectCounter}
                                onRated={handleRated}
                            />
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

/* ============================================================
   BookingCard Component
   ============================================================ */
const BookingCard = ({ booking, onCancel, onAcceptCounter, onRejectCounter, onRated }) => {
    const [showRatingModal, setShowRatingModal] = useState(false);

    const statusConfig = {
        pending: {
            Icon: Clock,
            label: 'Pending Confirmation',
        },
        pending_vendor_approval: {
            Icon: DollarSign,
            label: 'Awaiting Vendor Response',
        },
        pending_customer_approval: {
            Icon: AlertCircle,
            label: 'Vendor Counter-Offer',
        },
        confirmed: {
            Icon: CheckCircle,
            label: 'Confirmed',
        },
        cancelled: {
            Icon: XCircle,
            label: 'Cancelled',
        },
        completed: {
            Icon: CheckCircle,
            label: 'Completed',
        },
        rejected: {
            Icon: XCircle,
            label: 'Rejected',
        },
    };

    const { Icon, label } = statusConfig[booking.status] || statusConfig.pending;

    const formatDate = (dateString) =>
        new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });

    const hasNegotiation = booking.negotiation_status && booking.negotiation_status !== 'none';
    const finalPrice = booking.final_price_per_day ? Number(booking.final_price_per_day) : null;
    const originalPrice = booking.original_price_per_day ? Number(booking.original_price_per_day) : null;

    return (
        <article className={`booking-card booking-card--${booking.status}`}>
            {/* Card Header */}
            <div className="booking-card-header">
                <div className="booking-title-section">
                    <h3 className="booking-vehicle-name">
                        {booking?.vehicle_name || 'Vehicle'}
                    </h3>
                    <p className="booking-id">Booking #{booking?.id || 'N/A'}</p>
                </div>
                <div className={`booking-status booking-status--${booking.status}`}>
                    <Icon size={15} />
                    <span>{label}</span>
                </div>
            </div>

            {/* Card Body */}
            <div className="booking-card-body">
                <div className="booking-info-grid">
                    <div className="info-section">
                        <div className="info-icon"><Calendar size={17} /></div>
                        <div className="info-content">
                            <div className="info-label">Travel Dates</div>
                            <div className="info-value">
                                {formatDate(booking?.start_date)} – {formatDate(booking?.end_date)}
                            </div>
                            <div className="info-detail">
                                {booking?.total_days} day{booking?.total_days > 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>

                    <div className="info-section">
                        <div className="info-icon"><MapPin size={17} /></div>
                        <div className="info-content">
                            <div className="info-label">Route</div>
                            <div className="info-value">{booking?.pickup_location || 'N/A'}</div>
                            <div className="info-detail">to {booking?.dropoff_location || 'N/A'}</div>
                        </div>
                    </div>

                    <div className="info-section">
                        <div className="info-icon"><User size={17} /></div>
                        <div className="info-content">
                            <div className="info-label">Vendor</div>
                            <div className="info-value">{booking?.vendor_name || 'N/A'}</div>
                        </div>
                    </div>

                    <div className="info-section">
                        <div className="info-icon"><Phone size={17} /></div>
                        <div className="info-content">
                            <div className="info-label">Contact</div>
                            <div className="info-value">{booking?.contact_number || 'N/A'}</div>
                            <div className="info-detail">
                                {booking?.number_of_passengers || 0} passenger{booking?.number_of_passengers > 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                </div>

                {booking?.special_requests && (
                    <div className="special-requests">
                        <AlertCircle size={15} />
                        <div>
                            <strong>Special Requests</strong>
                            <p>{booking.special_requests}</p>
                        </div>
                    </div>
                )}

                {/* Negotiation Info */}
                {hasNegotiation && (
                    <div className="negotiation-info">
                        {booking.negotiation_status === 'customer_offered' && (
                            <div className="negotiation-banner negotiation-banner--waiting">
                                <DollarSign size={16} />
                                <div>
                                    <strong>Your Offer: NPR {Number(booking.customer_offered_price).toLocaleString()}/day</strong>
                                    <span className="negotiation-detail">
                                        {booking.trip_type === 'within_valley' ? 'Valley' : 'OV'} rate: NPR {originalPrice?.toLocaleString()}/day — Waiting for vendor response
                                    </span>
                                </div>
                            </div>
                        )}

                        {booking.negotiation_status === 'vendor_countered' && (
                            <div className="negotiation-banner negotiation-banner--action">
                                <DollarSign size={16} />
                                <div className="negotiation-counter-content">
                                    <div>
                                        <strong>Vendor Counter-Offer: NPR {Number(booking.vendor_counter_price).toLocaleString()}/day</strong>
                                        <span className="negotiation-detail">
                                            Your offer was NPR {Number(booking.customer_offered_price).toLocaleString()}/day · Trip rate: NPR {originalPrice?.toLocaleString()}/day
                                        </span>
                                    </div>
                                    <div className="negotiation-actions">
                                        <button
                                            className="btn-accept-counter"
                                            onClick={() => onAcceptCounter(booking.id)}
                                        >
                                            <CheckCircle size={14} />
                                            Accept (NPR {Number(booking.vendor_counter_price).toLocaleString()})
                                        </button>
                                        <button
                                            className="btn-reject-counter"
                                            onClick={() => onRejectCounter(booking.id)}
                                        >
                                            <XCircle size={14} />
                                            Reject & Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {booking.negotiation_status === 'accepted' && finalPrice && (
                            <div className="negotiation-banner negotiation-banner--accepted">
                                <CheckCircle size={16} />
                                <div>
                                    <strong>Price Agreed: NPR {finalPrice.toLocaleString()}/day</strong>
                                    <span className="negotiation-detail">
                                        Trip rate: <span className="price-strikethrough">NPR {originalPrice?.toLocaleString()}/day</span> — Saved {Math.round(((originalPrice - finalPrice) / originalPrice) * 100)}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="booking-footer">
                    <div className="booking-price">
                        <span className="price-label">Total</span>
                        <span className="price-amount">
                            NPR {Number(booking?.total_price || 0).toLocaleString()}
                        </span>
                        {hasNegotiation && booking.negotiation_status === 'accepted' && (
                            <span className="price-negotiated-tag">Negotiated</span>
                        )}
                        <span className="price-trip-type">
                            {booking?.trip_type === 'within_valley' ? '🏙️ Within Valley' : '🛣️ Outside Valley'}
                        </span>
                    </div>

                    <div className="booking-card-actions">
                        {(booking?.status === 'pending' || booking?.status === 'pending_vendor_approval') && (
                            <button
                                className="btn-cancel"
                                onClick={() => onCancel(booking.id)}
                            >
                                Cancel Booking
                            </button>
                        )}

                        {booking?.status === 'completed' && !booking?.has_rating && (
                            <button
                                className="btn-rate"
                                onClick={() => setShowRatingModal(true)}
                            >
                                <Star size={16} />
                                Rate Trip
                            </button>
                        )}

                        {booking?.status === 'completed' && booking?.has_rating && (
                            <span className="rating-submitted-tag">
                                <Star size={14} fill="#f59e0b" stroke="#f59e0b" />
                                Reviewed
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {showRatingModal && (
                <RatingModal
                    booking={booking}
                    onClose={() => setShowRatingModal(false)}
                    onRated={onRated}
                />
            )}
        </article>
    );
};

export default MyBookings;
