import { useState } from 'react';
import { Calendar, MapPin, User, Phone, CheckCircle, XCircle, Clock, Award, DollarSign } from 'lucide-react';
import './BookingCard.css';

const STATUS_CONFIG = {
    pending:                    { Icon: Clock,       label: 'Pending Approval' },
    pending_vendor_approval:    { Icon: DollarSign,  label: 'Price Offer Received' },
    pending_customer_approval:  { Icon: Clock,       label: 'Counter Sent — Waiting' },
    confirmed:                  { Icon: CheckCircle, label: 'Confirmed' },
    rejected:                   { Icon: XCircle,     label: 'Rejected' },
    cancelled:                  { Icon: XCircle,     label: 'Cancelled' },
    completed:                  { Icon: Award,       label: 'Completed' },
};

const BookingCard = ({ booking, onConfirm, onReject, onComplete, onCancel, onAcceptOffer, onRejectOffer, onCounterOffer }) => {
    const [counterPrice, setCounterPrice] = useState('');
    const [showCounterInput, setShowCounterInput] = useState(false);

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

    const hasNegotiation = booking.negotiation_status && booking.negotiation_status !== 'none';
    const originalPrice = booking.original_price_per_day ? Number(booking.original_price_per_day) : null;
    const customerOffer = booking.customer_offered_price ? Number(booking.customer_offered_price) : null;
    const vendorCounter = booking.vendor_counter_price ? Number(booking.vendor_counter_price) : null;
    const finalPrice = booking.final_price_per_day ? Number(booking.final_price_per_day) : null;

    const handleSendCounter = () => {
        const price = parseFloat(counterPrice);
        if (!price || price <= customerOffer || price > originalPrice) {
            alert(`Counter must be between NPR ${customerOffer?.toLocaleString()} and NPR ${originalPrice?.toLocaleString()}`);
            return;
        }
        onCounterOffer(booking.id, price);
        setShowCounterInput(false);
        setCounterPrice('');
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

                {/* Negotiation Section */}
                {booking.status === 'pending_vendor_approval' && customerOffer && (
                    <div className="vendor-negotiation-box">
                        <div className="vendor-negotiation-header">
                            <DollarSign size={18} />
                            <span>Customer Price Offer</span>
                        </div>
                        <div className="vendor-negotiation-prices">
                            <div className="vnp-item">
                                <span className="vnp-label">{booking.trip_type === 'within_valley' ? 'Valley Rate' : 'Outside Valley Rate'}</span>
                                <span className="vnp-value">NPR {originalPrice?.toLocaleString()}/day</span>
                            </div>
                            <div className="vnp-item vnp-item--offer">
                                <span className="vnp-label">Customer Offers</span>
                                <span className="vnp-value">NPR {customerOffer.toLocaleString()}/day</span>
                            </div>
                            <div className="vnp-item vnp-item--diff">
                                <span className="vnp-label">Difference</span>
                                <span className="vnp-value">-{Math.round(((originalPrice - customerOffer) / originalPrice) * 100)}%</span>
                            </div>
                        </div>

                        <div className="vendor-negotiation-actions">
                            <button className="btn-confirm" onClick={() => onAcceptOffer(booking.id)}>
                                <CheckCircle size={16} />
                                Accept Offer
                            </button>
                            <button
                                className="btn-counter"
                                onClick={() => setShowCounterInput(!showCounterInput)}
                            >
                                <DollarSign size={16} />
                                Counter
                            </button>
                            <button className="btn-reject" onClick={() => onRejectOffer(booking.id)}>
                                <XCircle size={16} />
                                Reject
                            </button>
                        </div>

                        {showCounterInput && (
                            <div className="vendor-counter-input">
                                <div className="counter-input-row">
                                    <span>NPR</span>
                                    <input
                                        type="number"
                                        value={counterPrice}
                                        onChange={(e) => setCounterPrice(e.target.value)}
                                        placeholder={`${customerOffer + 1} - ${originalPrice}`}
                                        min={customerOffer + 1}
                                        max={originalPrice}
                                    />
                                    <span>/day</span>
                                </div>
                                <p className="counter-hint">
                                    Must be between NPR {(customerOffer + 1).toLocaleString()} and NPR {originalPrice?.toLocaleString()}
                                </p>
                                <button className="btn-send-counter" onClick={handleSendCounter}>
                                    Send Counter-Offer
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {booking.status === 'pending_customer_approval' && (
                    <div className="vendor-negotiation-box vendor-negotiation-box--waiting">
                        <div className="vendor-negotiation-header">
                            <Clock size={18} />
                            <span>Waiting for Customer Response</span>
                        </div>
                        <div className="vendor-negotiation-prices">
                            <div className="vnp-item">
                                <span className="vnp-label">Your Counter</span>
                                <span className="vnp-value">NPR {vendorCounter?.toLocaleString()}/day</span>
                            </div>
                            <div className="vnp-item">
                                <span className="vnp-label">Customer's Offer</span>
                                <span className="vnp-value">NPR {customerOffer?.toLocaleString()}/day</span>
                            </div>
                        </div>
                    </div>
                )}

                {hasNegotiation && booking.negotiation_status === 'accepted' && finalPrice && (
                    <div className="vendor-negotiation-box vendor-negotiation-box--accepted">
                        <div className="vendor-negotiation-header">
                            <CheckCircle size={18} />
                            <span>Price Agreed: NPR {finalPrice.toLocaleString()}/day</span>
                        </div>
                    </div>
                )}

                <div className="booking-footer">
                    <div className="booking-price">
                        <span className="price-label">Total Amount</span>
                        <span className="price-amount">NPR {Number(booking.total_price).toLocaleString()}</span>
                        <span className="price-detail">
                            {booking.trip_type === 'within_valley'
                                ? '🏙️ Within Valley'
                                : `🛣️ NPR ${Number(finalPrice || booking.price_per_day).toLocaleString()}/day × ${booking.total_days} day${booking.total_days > 1 ? 's' : ''}`
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
