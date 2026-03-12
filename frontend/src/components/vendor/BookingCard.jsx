import { Calendar, MapPin, User, Phone, CheckCircle, XCircle } from 'lucide-react';
import './BookingCard.css';

const BookingCard = ({ booking, onConfirm, onCancel }) => {
    const statusColors = {
        pending: { bg: '#fff3cd', color: '#856404', label: 'Pending' },
        confirmed: { bg: '#d4edda', color: '#155724', label: 'Confirmed' },
        cancelled: { bg: '#f8d7da', color: '#721c24', label: 'Cancelled' },
        completed: { bg: '#d1ecf1', color: '#0c5460', label: 'Completed' },
    };

    const status = statusColors[booking.status] || statusColors.pending;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="booking-card">
            <div className="booking-card-header">
                <div>
                    <h3 className="booking-vehicle">{booking.vehicle_name}</h3>
                    <p className="booking-id">Booking #{booking.id}</p>
                </div>
                <div
                    className="booking-status"
                    style={{ background: status.bg, color: status.color }}
                >
                    {status.label}
                </div>
            </div>

            <div className="booking-card-body">
                <div className="booking-info-grid">
                    <div className="booking-info-item">
                        <User size={16} />
                        <div>
                            <div className="info-label">Tourist</div>
                            <div className="info-value">{booking.tourist_name}</div>
                            <div className="info-detail">{booking.tourist_email}</div>
                        </div>
                    </div>

                    <div className="booking-info-item">
                        <Calendar size={16} />
                        <div>
                            <div className="info-label">Dates</div>
                            <div className="info-value">
                                {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                            </div>
                            <div className="info-detail">{booking.total_days} day{booking.total_days > 1 ? 's' : ''}</div>
                        </div>
                    </div>

                    <div className="booking-info-item">
                        <MapPin size={16} />
                        <div>
                            <div className="info-label">Route</div>
                            <div className="info-value">{booking.pickup_location}</div>
                            <div className="info-detail">to {booking.dropoff_location}</div>
                        </div>
                    </div>

                    <div className="booking-info-item">
                        <Phone size={16} />
                        <div>
                            <div className="info-label">Contact</div>
                            <div className="info-value">{booking.contact_number}</div>
                            <div className="info-detail">{booking.number_of_passengers} passenger{booking.number_of_passengers > 1 ? 's' : ''}</div>
                        </div>
                    </div>
                </div>

                {booking.special_requests && (
                    <div className="special-requests">
                        <strong>Special Requests:</strong> {booking.special_requests}
                    </div>
                )}

                <div className="booking-price">
                    <span>Total Amount</span>
                    <span className="price-amount">NPR {booking.total_price.toLocaleString()}</span>
                </div>
            </div>

            {booking.status === 'pending' && (
                <div className="booking-card-actions">
                    <button
                        className="btn-confirm"
                        onClick={() => onConfirm(booking.id)}
                    >
                        <CheckCircle size={16} />
                        Confirm
                    </button>
                    <button
                        className="btn-reject"
                        onClick={() => onCancel(booking.id)}
                    >
                        <XCircle size={16} />
                        Decline
                    </button>
                </div>
            )}

            {booking.status === 'confirmed' && (
                <div className="booking-card-actions">
                    <button
                        className="btn-cancel-confirmed"
                        onClick={() => onCancel(booking.id)}
                    >
                        <XCircle size={16} />
                        Cancel Booking
                    </button>
                </div>
            )}
        </div>
    );
};

export default BookingCard;