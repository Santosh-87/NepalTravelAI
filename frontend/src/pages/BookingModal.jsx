import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import marketplaceService from '../services/marketplace';
import { X, Calendar, MapPin, Users, Phone, AlertCircle, ArrowRight } from 'lucide-react';
import './BookingModal.css';

const VALLEY_LOCATIONS = [
    'Tribhuvan International Airport, Kathmandu',
    'Thamel, Kathmandu',
    'Durbar Square, Kathmandu',
    'Boudhanath, Kathmandu',
    'Pashupatinath Temple, Kathmandu',
    'Swayambhunath, Kathmandu',
    'Patan (Lalitpur)',
    'Bhaktapur Durbar Square',
    'New Baneshwor, Kathmandu',
    'Gongabu Bus Park, Kathmandu',
    'Ratnapark, Kathmandu',
    'Nagarkot',
    'Dhulikhel',
];

const OUTSIDE_DESTINATIONS = [
    'Pokhara',
    'Chitwan / Sauraha',
    'Lumbini',
    'Janakpur',
    'Dharan',
    'Biratnagar',
    'Butwal',
    'Nepalgunj',
    'Dhangadhi',
    'Namche Bazaar',
    'Lukla',
    'Manang',
    'Mustang / Jomsom',
    'Ilam',
    'Tansen (Palpa)',
];

const ALL_LOCATIONS = [...VALLEY_LOCATIONS, ...OUTSIDE_DESTINATIONS];

const LOCAL_RATE_FACTOR = 0.6;

const BookingModal = ({ vehicle, onClose }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // 1: Trip Type, 2: Details, 3: Confirm
    const [tripType, setTripType] = useState('');

    const [formData, setFormData] = useState({
        start_date: '',
        end_date: '',
        pickup_location: '',
        dropoff_location: '',
        number_of_passengers: '',
        contact_number: '',
        special_requests: '',
    });

    const today = new Date().toISOString().split('T')[0];
    const isValley = tripType === 'within_valley';
    const basePrice = Number(vehicle.price_per_day);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const calcDays = () => {
        if (isValley) return 1;
        if (!formData.start_date || !formData.end_date) return 0;
        const diff = (new Date(formData.end_date) - new Date(formData.start_date)) / 86400000;
        return diff >= 0 ? Math.round(diff) + 1 : 0;
    };

    const calcTotal = () => {
        if (isValley) return Math.round(basePrice * LOCAL_RATE_FACTOR);
        return calcDays() * basePrice;
    };

    const selectTripType = (type) => {
        setTripType(type);
        setFormData({
            start_date: '', end_date: '',
            pickup_location: '', dropoff_location: '',
            number_of_passengers: '', contact_number: '', special_requests: '',
        });
        setError('');
        setStep(2);
    };

    const validateForm = () => {
        if (!formData.start_date) {
            setError('Please select a trip date'); return false;
        }
        if (!isValley && !formData.end_date) {
            setError('Please select a return date'); return false;
        }
        if (!isValley && new Date(formData.end_date) < new Date(formData.start_date)) {
            setError('End date cannot be before start date'); return false;
        }
        if (!formData.pickup_location) {
            setError('Please enter a pickup location'); return false;
        }
        if (!formData.dropoff_location) {
            setError('Please enter a dropoff location'); return false;
        }
        if (!formData.number_of_passengers) {
            setError('Please enter number of passengers'); return false;
        }
        if (parseInt(formData.number_of_passengers) > vehicle.seating_capacity) {
            setError(`Maximum capacity is ${vehicle.seating_capacity} passengers`); return false;
        }
        if (!formData.contact_number) {
            setError('Please enter your contact number'); return false;
        }
        setError('');
        return true;
    };

    const handleNext = () => {
        if (validateForm()) setStep(3);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            await marketplaceService.createBooking({
                vehicle_listing: vehicle.id,
                trip_type: tripType,
                start_date: formData.start_date,
                end_date: isValley ? formData.start_date : formData.end_date,
                pickup_location: formData.pickup_location,
                dropoff_location: formData.dropoff_location,
                number_of_passengers: parseInt(formData.number_of_passengers),
                contact_number: formData.contact_number,
                special_requests: formData.special_requests,
            });
            onClose();
            navigate('/my-bookings', { state: { message: 'Booking request sent successfully!' } });
        } catch (err) {
            setError(err.message || 'Failed to create booking');
        } finally {
            setLoading(false);
        }
    };

    const fmtDate = (d) =>
        d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '–';

    const stepLabels = ['Trip Type', 'Details', 'Confirm'];

    // ─────────────────────────────────────────────────────────────
    // STEP 1 — Trip Type Selection
    // ─────────────────────────────────────────────────────────────
    if (step === 1) return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Plan Your Trip</h2>
                    <button className="modal-close" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="step-indicator">
                    {stepLabels.map((_, i) => (
                        <React.Fragment key={i}>
                            <div className={`step-dot ${step > i + 1 ? 'step-dot--done' : step === i + 1 ? 'step-dot--active' : ''}`}>
                                {step > i + 1 ? '✓' : i + 1}
                            </div>
                            {i < stepLabels.length - 1 && <div className={`step-line ${step > i + 1 ? 'step-line--done' : ''}`} />}
                        </React.Fragment>
                    ))}
                </div>

                <div className="modal-body">
                    <p className="trip-select-heading">Where are you travelling?</p>
                    <div className="trip-type-options">
                        <button className="trip-type-card" onClick={() => selectTripType('within_valley')}>
                            <div className="ttc-icon">🏙️</div>
                            <div className="ttc-body">
                                <div className="ttc-title">Within Valley</div>
                                <div className="ttc-desc">Short local trips within Kathmandu, Patan & Bhaktapur</div>
                                <div className="ttc-rate-box">
                                    <span className="ttc-rate-label">Flat local rate</span>
                                    <strong className="ttc-rate-value">NPR {Math.round(basePrice * LOCAL_RATE_FACTOR).toLocaleString()}</strong>
                                </div>
                            </div>
                            <ArrowRight size={20} className="ttc-arrow" />
                        </button>

                        <button className="trip-type-card" onClick={() => selectTripType('outside_valley')}>
                            <div className="ttc-icon">🛣️</div>
                            <div className="ttc-body">
                                <div className="ttc-title">Outside Valley</div>
                                <div className="ttc-desc">Intercity & long-distance travel — Pokhara, Chitwan, and beyond</div>
                                <div className="ttc-rate-box">
                                    <span className="ttc-rate-label">Per-day rate</span>
                                    <strong className="ttc-rate-value">NPR {basePrice.toLocaleString()}<span className="ttc-per-day">/day</span></strong>
                                </div>
                            </div>
                            <ArrowRight size={20} className="ttc-arrow" />
                        </button>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );

    // ─────────────────────────────────────────────────────────────
    // STEP 2 — Booking Details
    // ─────────────────────────────────────────────────────────────
    if (step === 2) return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-with-badge">
                        <h2>Booking Details</h2>
                        <span className={`trip-badge trip-badge--${tripType}`}>
                            {isValley ? '🏙️ Within Valley' : '🛣️ Outside Valley'}
                        </span>
                    </div>
                    <button className="modal-close" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="step-indicator">
                    {stepLabels.map((_, i) => (
                        <React.Fragment key={i}>
                            <div className={`step-dot ${step > i + 1 ? 'step-dot--done' : step === i + 1 ? 'step-dot--active' : ''}`}>
                                {step > i + 1 ? '✓' : i + 1}
                            </div>
                            {i < stepLabels.length - 1 && <div className={`step-line ${step > i + 1 ? 'step-line--done' : ''}`} />}
                        </React.Fragment>
                    ))}
                </div>

                {error && (
                    <div className="error-banner">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <div className="modal-body">
                    {/* Date(s) */}
                    <div className="form-group">
                        <label>{isValley ? 'Trip Date *' : 'Travel Dates *'}</label>
                        <div className="date-inputs">
                            <div className="date-input">
                                <Calendar size={18} />
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    min={today}
                                />
                            </div>
                            {!isValley && (
                                <>
                                    <span className="date-sep">→</span>
                                    <div className="date-input">
                                        <Calendar size={18} />
                                        <input
                                            type="date"
                                            name="end_date"
                                            value={formData.end_date}
                                            onChange={handleChange}
                                            min={formData.start_date || today}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        {!isValley && (
                            <span className="form-hint">Same-day bookings are supported — select the same date for a 1-day trip.</span>
                        )}
                    </div>

                    {/* Pickup */}
                    <div className="form-group">
                        <label>Pickup Location *</label>
                        <div className="input-with-icon">
                            <MapPin size={18} />
                            <input
                                type="text"
                                name="pickup_location"
                                list="bm-pickup-list"
                                placeholder={isValley ? 'e.g., Thamel, Kathmandu' : 'e.g., Kathmandu'}
                                value={formData.pickup_location}
                                onChange={handleChange}
                            />
                        </div>
                        <datalist id="bm-pickup-list">
                            {(isValley ? VALLEY_LOCATIONS : ALL_LOCATIONS).map(l => (
                                <option key={l} value={l} />
                            ))}
                        </datalist>
                    </div>

                    {/* Dropoff */}
                    <div className="form-group">
                        <label>Dropoff Location *</label>
                        <div className="input-with-icon">
                            <MapPin size={18} />
                            <input
                                type="text"
                                name="dropoff_location"
                                list="bm-dropoff-list"
                                placeholder={isValley ? 'e.g., Bhaktapur' : 'e.g., Pokhara'}
                                value={formData.dropoff_location}
                                onChange={handleChange}
                            />
                        </div>
                        <datalist id="bm-dropoff-list">
                            {(isValley ? VALLEY_LOCATIONS : ALL_LOCATIONS).map(l => (
                                <option key={l} value={l} />
                            ))}
                        </datalist>
                    </div>

                    {/* Passengers + Contact */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Passengers *</label>
                            <div className="input-with-icon">
                                <Users size={18} />
                                <input
                                    type="number"
                                    name="number_of_passengers"
                                    min="1"
                                    max={vehicle.seating_capacity}
                                    placeholder={`Max ${vehicle.seating_capacity}`}
                                    value={formData.number_of_passengers}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Contact Number *</label>
                            <div className="input-with-icon">
                                <Phone size={18} />
                                <input
                                    type="tel"
                                    name="contact_number"
                                    placeholder="9841234567"
                                    value={formData.contact_number}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Special requests */}
                    <div className="form-group">
                        <label>Special Instructions <span className="label-optional">(optional)</span></label>
                        <textarea
                            name="special_requests"
                            rows="2"
                            placeholder="Pickup time preference, luggage requirements, etc."
                            value={formData.special_requests}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Fare preview */}
                    {(isValley || calcDays() > 0) && (
                        <div className="fare-preview">
                            <div className="fare-left">
                                <span className="fare-label">Estimated Fare</span>
                                <span className="fare-calc-text">
                                    {isValley
                                        ? 'Flat local rate'
                                        : `NPR ${basePrice.toLocaleString()} × ${calcDays()} day${calcDays() !== 1 ? 's' : ''}`
                                    }
                                </span>
                            </div>
                            <strong className="fare-total">NPR {calcTotal().toLocaleString()}</strong>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                    <button className="btn-primary" onClick={handleNext}>
                        Review Booking <ArrowRight size={16} style={{ marginLeft: 4 }} />
                    </button>
                </div>
            </div>
        </div>
    );

    // ─────────────────────────────────────────────────────────────
    // STEP 3 — Confirmation
    // ─────────────────────────────────────────────────────────────
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Confirm Booking</h2>
                    <button className="modal-close" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="step-indicator">
                    {stepLabels.map((_, i) => (
                        <React.Fragment key={i}>
                            <div className={`step-dot ${step > i + 1 ? 'step-dot--done' : step === i + 1 ? 'step-dot--active' : ''}`}>
                                {step > i + 1 ? '✓' : i + 1}
                            </div>
                            {i < stepLabels.length - 1 && <div className={`step-line ${step > i + 1 ? 'step-line--done' : ''}`} />}
                        </React.Fragment>
                    ))}
                </div>

                {error && (
                    <div className="error-banner">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <div className="modal-body">
                    {/* Vehicle */}
                    <div className="confirm-vehicle">
                        {vehicle.primary_image && (
                            <img
                                src={vehicle.primary_image.startsWith('http')
                                    ? vehicle.primary_image
                                    : `http://localhost:8000${vehicle.primary_image}`}
                                alt={vehicle.vehicle_name}
                                className="confirm-vehicle-img"
                            />
                        )}
                        <div className="confirm-vehicle-info">
                            <div className="confirm-vehicle-name">{vehicle.vehicle_name}</div>
                            <div className="confirm-vehicle-meta">
                                {vehicle.vehicle_number} · {vehicle.seating_capacity} seats
                                &nbsp;·&nbsp;
                                <span className={`trip-badge trip-badge--${tripType}`}>
                                    {isValley ? '🏙️ Within Valley' : '🛣️ Outside Valley'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Route */}
                    <div className="confirm-route">
                        <div className="route-stop">
                            <span className="route-dot route-dot--green" />
                            <div>
                                <div className="rs-label">Pickup</div>
                                <div className="rs-value">{formData.pickup_location}</div>
                            </div>
                        </div>
                        <div className="route-connector" />
                        <div className="route-stop">
                            <span className="route-dot route-dot--red" />
                            <div>
                                <div className="rs-label">Dropoff</div>
                                <div className="rs-value">{formData.dropoff_location}</div>
                            </div>
                        </div>
                    </div>

                    {/* Details grid */}
                    <div className="confirm-details">
                        <div className="cd-item">
                            <span className="cd-label">{isValley ? 'Date' : 'Dates'}</span>
                            <span className="cd-val">
                                {isValley
                                    ? fmtDate(formData.start_date)
                                    : `${fmtDate(formData.start_date)} → ${fmtDate(formData.end_date)}`
                                }
                            </span>
                        </div>
                        <div className="cd-item">
                            <span className="cd-label">Duration</span>
                            <span className="cd-val">
                                {isValley ? '1 local trip' : `${calcDays()} day${calcDays() !== 1 ? 's' : ''}`}
                            </span>
                        </div>
                        <div className="cd-item">
                            <span className="cd-label">Passengers</span>
                            <span className="cd-val">{formData.number_of_passengers}</span>
                        </div>
                        <div className="cd-item">
                            <span className="cd-label">Contact</span>
                            <span className="cd-val">{formData.contact_number}</span>
                        </div>
                    </div>

                    {/* Price breakdown */}
                    <div className="confirm-price">
                        {isValley ? (
                            <>
                                <div className="cp-row">
                                    <span>Daily rate</span>
                                    <span>NPR {basePrice.toLocaleString()}</span>
                                </div>
                                <div className="cp-row cp-discount">
                                    <span>Within Valley discount (40% off)</span>
                                    <span>− NPR {Math.round(basePrice * 0.4).toLocaleString()}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="cp-row">
                                    <span>Daily rate</span>
                                    <span>NPR {basePrice.toLocaleString()}</span>
                                </div>
                                <div className="cp-row">
                                    <span>Number of days</span>
                                    <span>{calcDays()}</span>
                                </div>
                            </>
                        )}
                        <div className="cp-total">
                            <span>Total Estimate</span>
                            <strong>NPR {calcTotal().toLocaleString()}</strong>
                        </div>
                    </div>

                    {formData.special_requests && (
                        <div className="confirm-note">
                            <strong>Special instructions:</strong> {formData.special_requests}
                        </div>
                    )}

                    <div className="booking-notice">
                        <AlertCircle size={16} />
                        <p>The vendor will review and confirm your booking. You'll be contacted at <strong>{formData.contact_number}</strong>.</p>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
                    <button className="btn-confirm" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Submitting...' : '✓ Confirm Booking'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingModal;
