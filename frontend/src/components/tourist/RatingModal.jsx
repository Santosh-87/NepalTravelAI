import React, { useState } from 'react';
import { X, Star, AlertCircle } from 'lucide-react';
import marketplaceService from '../../services/marketplace';
import './RatingModal.css';

const StarPicker = ({ value, onChange, size = 24 }) => {
    const [hover, setHover] = useState(0);

    return (
        <div className="star-picker">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className="star-btn"
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => onChange(star)}
                >
                    <Star
                        size={size}
                        fill={(hover || value) >= star ? '#f59e0b' : 'none'}
                        stroke={(hover || value) >= star ? '#f59e0b' : '#d1d5db'}
                        strokeWidth={1.5}
                    />
                </button>
            ))}
        </div>
    );
};

const RatingModal = ({ booking, onClose, onRated }) => {
    const [ratings, setRatings] = useState({
        overall_rating: 0,
        vehicle_condition_rating: 0,
        punctuality_rating: 0,
        driver_behavior_rating: 0,
    });
    const [reviewText, setReviewText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!ratings.overall_rating) {
            setError('Overall rating is required');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const ratingData = {
                overall_rating: ratings.overall_rating,
                review_text: reviewText,
            };
            if (ratings.vehicle_condition_rating) ratingData.vehicle_condition_rating = ratings.vehicle_condition_rating;
            if (ratings.punctuality_rating) ratingData.punctuality_rating = ratings.punctuality_rating;
            if (ratings.driver_behavior_rating) ratingData.driver_behavior_rating = ratings.driver_behavior_rating;

            await marketplaceService.rateBooking(booking.id, ratingData);
            onRated(booking.id);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to submit rating');
        } finally {
            setLoading(false);
        }
    };

    const ratingDimensions = [
        { key: 'overall_rating', label: 'Overall Rating', required: true },
        { key: 'vehicle_condition_rating', label: 'Vehicle Condition', required: false },
        { key: 'punctuality_rating', label: 'Punctuality', required: false },
        { key: 'driver_behavior_rating', label: 'Driver Behavior', required: false },
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="rating-modal" onClick={e => e.stopPropagation()}>
                <div className="rating-modal-header">
                    <h2>Rate Your Trip</h2>
                    <button className="modal-close" onClick={onClose}><X size={24} /></button>
                </div>

                {error && (
                    <div className="rating-error">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <div className="rating-modal-body">
                    {/* Booking summary */}
                    <div className="rating-booking-summary">
                        <div className="rating-vehicle-name">{booking.vehicle_name}</div>
                        <div className="rating-booking-meta">
                            Booking #{booking.id} · {booking.pickup_location} → {booking.dropoff_location}
                        </div>
                    </div>

                    {/* Star ratings */}
                    <div className="rating-dimensions">
                        {ratingDimensions.map(({ key, label, required }) => (
                            <div
                                key={key}
                                className={`rating-dimension ${required ? 'rating-dimension--required' : ''}`}
                            >
                                <div className="rating-dimension-label">
                                    {label}
                                    {required && <span className="rating-required">*</span>}
                                </div>
                                <StarPicker
                                    value={ratings[key]}
                                    onChange={(val) => setRatings(prev => ({ ...prev, [key]: val }))}
                                    size={required ? 28 : 22}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Review text */}
                    <div className="rating-review-section">
                        <label>Written Review <span className="rating-optional">(optional)</span></label>
                        <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value.slice(0, 500))}
                            placeholder="Share your experience with this vehicle and vendor..."
                            rows={4}
                            maxLength={500}
                        />
                        <div className={`rating-char-count ${reviewText.length > 450 ? 'rating-char-count--warn' : ''}`}>
                            {reviewText.length}/500
                        </div>
                    </div>
                </div>

                <div className="rating-modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="btn-rate-submit"
                        onClick={handleSubmit}
                        disabled={loading || !ratings.overall_rating}
                    >
                        {loading ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RatingModal;
