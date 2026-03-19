import { Calendar, MapPin, User, Phone, CheckCircle, XCircle, Clock, Award } from 'lucide-react';
import './BookingCard.css';

const STATUS_CONFIG = {
    pending:   { Icon: Clock,        label: 'Pending Approval' },
    confirmed: { Icon: CheckCircle,  label: 'Confirmed'        },
    rejected:  { Icon: XCircle,      label: 'Rejected'         },
    cancelled: { Icon: XCircle,      label: 'Cancelled'        },
    completed: { Icon: Award,        label: 'Completed'        },
};

const BookingCard = ({ booking, onConfirm, onReject, onComplete, onCancel }) => {
    const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
    const StatusIcon = status.Icon;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="vendor-booking-card">
            <div className="booking-card-header">
                <div>
                    <h3>{booking.vehicle_name}</h3>
                    <p className="booking-id">Booking #{booking.id}</p>
                </div>
                <div className={`booking-status booking-status--${booking.status}`}>
                    <StatusIcon size={16} />
                    {status.label}
                </div>
            </div>

            <div className="booking-card-body">
                <div className="booking-info-grid">
                    <div className="info-section">
                        <User size={18} />
                        <div>
                            <div className="info-label">Tourist</div>
                            <div className="info-value">{booking.tourist_name}</div>
                            <div className="info-detail">{booking.tourist_email}</div>
                        </div>
                    </div>

                    <div className="info-section">
                        <Calendar size={18} />
                        <div>
                            <div className="info-label">Travel Dates</div>
                            <div className="info-value">
                                {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                            </div>
                            <div className="info-detail">
                                {booking.total_days} day{booking.total_days > 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>

                    <div className="info-section">
                        <MapPin size={18} />
                        <div>
                            <div className="info-label">Route</div>
                            <div className="info-value">{booking.pickup_location}</div>
                            <div className="info-detail">to {booking.dropoff_location}</div>
                        </div>
                    </div>

                    <div className="info-section">
                        <Phone size={18} />
                        <div>
                            <div className="info-label">Contact</div>
                            <div className="info-value">{booking.contact_number}</div>
                            <div className="info-detail">
                                {booking.number_of_passengers} passenger{booking.number_of_passengers > 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                </div>

                {booking.special_requests && (
                    <div className="special-requests">
                        <strong>Special Requests:</strong> {booking.special_requests}
                    </div>
                )}

                <div className="booking-footer">
                    <div className="booking-price">
                        <span className="price-label">Total Amount</span>
                        <span className="price-amount">NPR {Number(booking.total_price).toLocaleString()}</span>
                        <span className="price-detail">
                            {booking.trip_type === 'within_valley'
                                ? '🏙️ Within Valley flat rate'
                                : `NPR ${Number(booking.price_per_day).toLocaleString()}/day × ${booking.total_days} day${booking.total_days > 1 ? 's' : ''}`
                            }
                        </span>
                    </div>

                    <div className="booking-actions">
                        {booking.status === 'pending' && (
                            <>
                                <button
                                    className="btn-confirm"
                                    onClick={() => onConfirm(booking.id)}
                                >
                                    <CheckCircle size={16} />
                                    Accept Booking
                                </button>
                                <button
                                    className="btn-reject"
                                    onClick={() => onReject(booking.id)}
                                >
                                    <XCircle size={16} />
                                    Reject
                                </button>
                            </>
                        )}

                        {booking.status === 'confirmed' && (
                            <>
                                <button
                                    className="btn-complete"
                                    onClick={() => onComplete(booking.id)}
                                >
                                    <Award size={16} />
                                    Mark Completed
                                </button>
                                <button
                                    className="btn-cancel-secondary"
                                    onClick={() => onCancel(booking.id)}
                                >
                                    <XCircle size={16} />
                                    Cancel
                                </button>
                            </>
                        )}

                        {(booking.status === 'rejected' || booking.status === 'cancelled' || booking.status === 'completed') && (
                            <div className="booking-final-status">
                                {booking.status === 'completed' && (
                                    <span className="status-message success">
                                        ✓ Trip completed successfully
                                    </span>
                                )}
                                {booking.status === 'rejected' && (
                                    <span className="status-message error">
                                        ✗ You rejected this booking
                                    </span>
                                )}
                                {booking.status === 'cancelled' && (
                                    <span className="status-message">
                                        Booking was cancelled
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingCard;