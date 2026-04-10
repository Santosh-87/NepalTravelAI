import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import marketplaceService from '../../services/marketplace';
import { X, Calendar, MapPin, Users, Phone, AlertCircle, ArrowRight, Tag, Minus, Plus } from 'lucide-react';
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

const OV_MARKUP = 1.15; // Outside Valley = Inside Valley price + 15%
const PRICE_STEP = 100; // +/- increment for fare picker (NPR)

const BookingModal = ({ vehicle, onClose }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // 1: Trip Type, 2: Details, 3: Price, 4: Confirm
    const [tripType, setTripType] = useState('');

    // Negotiation state
    const [wantToNegotiate, setWantToNegotiate] = useState(false);
    const [offeredPrice, setOfferedPrice] = useState('');

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
    const basePrice = Number(vehicle.price_per_day); // Listed price = Inside Valley price
    const effectivePrice = isValley ? basePrice : Math.round(basePrice * OV_MARKUP); // OV = IV + 15%
    const minOffer = Math.ceil(effectivePrice * 0.85);
    const maxOffer = Math.floor(effectivePrice * 0.99);

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

    const calcTotal = (priceOverride) => {
        const price = priceOverride || effectivePrice;
        if (isValley) return price; // IV: listed price for 1 day
        return calcDays() * price;  // OV: effective rate × days
    };

    const selectTripType = (type) => {
        setTripType(type);
        setFormData({
            start_date: '', end_date: '',
            pickup_location: '', dropoff_location: '',
            number_of_passengers: '', contact_number: '', special_requests: '',
        });
        setWantToNegotiate(false);
        setOfferedPrice('');
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

    const handleDetailsNext = () => {
        if (validateForm()) setStep(3);
    };

    const handlePriceNext = () => {
        if (wantToNegotiate) {
            const price = parseFloat(offeredPrice);
            if (!offeredPrice || isNaN(price)) {
                setError('Please enter your offer price'); return;
            }
            if (price < minOffer || price > maxOffer) {
                setError(`Offer must be between NPR ${minOffer.toLocaleString()} and NPR ${maxOffer.toLocaleString()} (up to 15% off the trip rate)`);
                return;
            }
        }
        setError('');
        setStep(4);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            const bookingData = {
                vehicle_listing: vehicle.id,
                trip_type: tripType,
                start_date: formData.start_date,
                end_date: isValley ? formData.start_date : formData.end_date,
                pickup_location: formData.pickup_location,
                dropoff_location: formData.dropoff_location,
                number_of_passengers: parseInt(formData.number_of_passengers),
                contact_number: formData.contact_number,
                special_requests: formData.special_requests,
            };

            if (wantToNegotiate && offeredPrice) {
                bookingData.customer_offered_price = parseFloat(offeredPrice);
            }

            await marketplaceService.createBooking(bookingData);
            onClose();

            const msg = wantToNegotiate
                ? 'Booking request sent with your price offer! The vendor will review it.'
                : 'Booking request sent successfully!';
            navigate('/my-bookings', { state: { message: msg } });
        } catch (err) {
            setError(err.message || 'Failed to create booking');
        } finally {
            setLoading(false);
        }
    };

    const fmtDate = (d) =>
        d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '–';

    const stepLabels = ['Trip Type', 'Details', 'Price', 'Confirm'];

    const savings = wantToNegotiate && offeredPrice
        ? effectivePrice - parseFloat(offeredPrice)
        : 0;
    const savingsPercent = savings > 0
        ? Math.round((savings / effectivePrice) * 100)
        : 0;

    // Step indicator component (reused in all steps)
    const StepIndicator = () => (
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
    );

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

                <StepIndicator />

                <div className="modal-body">
                    <p className="trip-select-heading">Where are you travelling?</p>
                    <div className="trip-type-options">
                        <button className="trip-type-card" onClick={() => selectTripType('within_valley')}>
                            <div className="ttc-icon">🏙️</div>
                            <div className="ttc-body">
                                <div className="ttc-title">Within Valley</div>
                                <div className="ttc-desc">Short local trips within Kathmandu, Patan & Bhaktapur</div>
                                <div className="ttc-rate-box">
                                    <span className="ttc-rate-label">Flat rate</span>
                                    <strong className="ttc-rate-value">NPR {basePrice.toLocaleString()}</strong>
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
                                    <span className="ttc-rate-label">Per-day rate (+15%)</span>
                                    <strong className="ttc-rate-value">NPR {Math.round(basePrice * OV_MARKUP).toLocaleString()}<span className="ttc-per-day">/day</span></strong>
                                </div>
                            </div>
                            <ArrowRight size={20} className="ttc-arrow" />
                        </button>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="bm-btn-secondary" onClick={onClose}>Cancel</button>
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

                <StepIndicator />

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
                                        ? 'Within Valley flat rate'
                                        : `NPR ${effectivePrice.toLocaleString()} × ${calcDays()} day${calcDays() !== 1 ? 's' : ''}`
                                    }
                                </span>
                            </div>
                            <strong className="fare-total">NPR {calcTotal().toLocaleString()}</strong>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="bm-btn-secondary" onClick={() => setStep(1)}>Back</button>
                    <button className="bm-btn-primary" onClick={handleDetailsNext}>
                        Next: Pricing <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );

    // ─────────────────────────────────────────────────────────────
    // STEP 3 — Price Negotiation (Optional)
    // ─────────────────────────────────────────────────────────────
    if (step === 3) return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-with-badge">
                        <h2>Pricing</h2>
                        <span className={`trip-badge trip-badge--${tripType}`}>
                            {isValley ? '🏙️ Within Valley' : '🛣️ Outside Valley'}
                        </span>
                    </div>
                    <button className="modal-close" onClick={onClose}><X size={24} /></button>
                </div>

                <StepIndicator />

                {error && (
                    <div className="error-banner">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <div className="modal-body">
                    {/* Current effective price for this trip type */}
                    <div className="negotiate-current-price">
                        <Tag size={18} />
                        <div>
                            <div className="negotiate-price-label">
                                {isValley ? 'Within Valley Rate' : 'Outside Valley Rate (+15%)'}
                            </div>
                            <div className="negotiate-price-value">NPR {effectivePrice.toLocaleString()}<span className="negotiate-per-day">/day</span></div>
                        </div>
                    </div>

                    {/* Toggle: book at listed price or negotiate */}
                    <div className="negotiate-toggle">
                        <button
                            className={`negotiate-option ${!wantToNegotiate ? 'negotiate-option--active' : ''}`}
                            onClick={() => { setWantToNegotiate(false); setOfferedPrice(''); setError(''); }}
                        >
                            Book at Listed Price
                        </button>
                        <button
                            className={`negotiate-option ${wantToNegotiate ? 'negotiate-option--active' : ''}`}
                            onClick={() => { setWantToNegotiate(true); setOfferedPrice(String(maxOffer)); setError(''); }}
                        >
                            Make an Offer
                        </button>
                    </div>

                    {wantToNegotiate && (
                        <div className="negotiate-offer-section">
                            <div className="fare-picker">
                                <button
                                    className="fare-picker-btn"
                                    onClick={() => {
                                        const cur = parseInt(offeredPrice) || maxOffer;
                                        setOfferedPrice(String(Math.max(minOffer, cur - PRICE_STEP)));
                                    }}
                                    disabled={parseInt(offeredPrice) <= minOffer}
                                >
                                    <Minus size={20} />
                                </button>
                                <div className="fare-picker-display">
                                    <div className="fare-picker-amount">
                                        NPR {(parseInt(offeredPrice) || maxOffer).toLocaleString()}
                                    </div>
                                    <div className="fare-picker-label">Your offer per day</div>
                                </div>
                                <button
                                    className="fare-picker-btn"
                                    onClick={() => {
                                        const cur = parseInt(offeredPrice) || maxOffer;
                                        setOfferedPrice(String(Math.min(maxOffer, cur + PRICE_STEP)));
                                    }}
                                    disabled={parseInt(offeredPrice) >= maxOffer}
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                            <div className="fare-picker-hint">
                                {isValley ? 'Valley' : 'Outside Valley'} rate: NPR {effectivePrice.toLocaleString()}/day
                            </div>

                            <div className="negotiate-info">
                                <AlertCircle size={15} />
                                <p>The vendor can accept, reject, or counter your offer. You'll have one chance to respond to any counter-offer.</p>
                            </div>
                        </div>
                    )}

                    {/* Total preview */}
                    <div className="fare-preview" style={{ marginTop: '1rem' }}>
                        <div className="fare-left">
                            <span className="fare-label">
                                {wantToNegotiate && offeredPrice ? 'Estimated Total (at your offer)' : 'Estimated Total'}
                            </span>
                            <span className="fare-calc-text">
                                {isValley
                                    ? 'Within Valley flat rate'
                                    : `NPR ${(wantToNegotiate && offeredPrice ? parseFloat(offeredPrice) : effectivePrice).toLocaleString()} × ${calcDays()} day${calcDays() !== 1 ? 's' : ''}`
                                }
                            </span>
                        </div>
                        <strong className="fare-total">
                            NPR {calcTotal(wantToNegotiate && offeredPrice ? parseFloat(offeredPrice) : null).toLocaleString()}
                        </strong>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="bm-btn-secondary" onClick={() => setStep(2)}>Back</button>
                    <button className="bm-btn-primary" onClick={handlePriceNext}>
                        Review Booking <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );

    // ─────────────────────────────────────────────────────────────
    // STEP 4 — Confirmation
    // ─────────────────────────────────────────────────────────────
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Confirm Booking</h2>
                    <button className="modal-close" onClick={onClose}><X size={24} /></button>
                </div>

                <StepIndicator />

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
                                    <span>Within Valley rate</span>
                                    <span>NPR {effectivePrice.toLocaleString()}</span>
                                </div>
                                <div className="cp-row">
                                    <span>Duration</span>
                                    <span>1 local trip</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="cp-row">
                                    <span>Outside Valley rate (+15%)</span>
                                    <span>NPR {effectivePrice.toLocaleString()}/day</span>
                                </div>
                                <div className="cp-row">
                                    <span>Number of days</span>
                                    <span>{calcDays()}</span>
                                </div>
                            </>
                        )}

                        {wantToNegotiate && offeredPrice && (
                            <div className="cp-row cp-negotiate">
                                <span>Your Offer Price</span>
                                <span>NPR {parseFloat(offeredPrice).toLocaleString()}/day ({savingsPercent}% off)</span>
                            </div>
                        )}

                        <div className="cp-total">
                            <span>{wantToNegotiate ? 'Total at Listed Price' : 'Total Estimate'}</span>
                            <strong>NPR {calcTotal().toLocaleString()}</strong>
                        </div>

                        {wantToNegotiate && offeredPrice && (
                            <div className="cp-total cp-total--offer">
                                <span>Total at Your Offer</span>
                                <strong className="cp-offer-price">NPR {calcTotal(parseFloat(offeredPrice)).toLocaleString()}</strong>
                            </div>
                        )}
                    </div>

                    {formData.special_requests && (
                        <div className="confirm-note">
                            <strong>Special instructions:</strong> {formData.special_requests}
                        </div>
                    )}

                    <div className="booking-notice">
                        <AlertCircle size={16} />
                        {wantToNegotiate ? (
                            <p>Your price offer of <strong>NPR {parseFloat(offeredPrice).toLocaleString()}/day</strong> will be sent to the vendor for review. They can accept, reject, or counter-offer. You'll be contacted at <strong>{formData.contact_number}</strong>.</p>
                        ) : (
                            <p>The vendor will review and confirm your booking. You'll be contacted at <strong>{formData.contact_number}</strong>.</p>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="bm-btn-secondary" onClick={() => setStep(3)}>Back</button>
                    <button className="btn-confirm" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Submitting...' : wantToNegotiate ? '✓ Submit Offer' : '✓ Confirm Booking'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingModal;
