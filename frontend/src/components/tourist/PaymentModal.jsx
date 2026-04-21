import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, CreditCard, Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import marketplaceService from '../../services/marketplace';
import './PaymentModal.css';

// Publishable key is safe to expose in the frontend
const stripePromise = loadStripe('pk_test_51TM6uyPQK7vb1RxC7Va3xflYzASUXBklqV5XxiUBBR2zS9Q5fx83WvGEwLaLsPmLOYoIqdzDabmhIqK4dSzvOLUq00kebgqoq7');

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            color: '#1e293b',
            fontFamily: 'Inter, Plus Jakarta Sans, sans-serif',
            fontSize: '15px',
            fontSmoothing: 'antialiased',
            '::placeholder': { color: '#94a3b8' },
            iconColor: '#1a4d6f',
        },
        invalid: {
            color: '#ef4444',
            iconColor: '#ef4444',
        },
    },
};

/* ─────────────────────────────────────────────────────────────
   Inner form — mounted inside <Elements> so useStripe works
   ───────────────────────────────────────────────────────────── */
const PaymentForm = ({ booking, onClose, onPaymentSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [phase, setPhase] = useState('idle'); // idle | processing | success | error
    const [errorMsg, setErrorMsg] = useState('');
    const [cardComplete, setCardComplete] = useState(false);

    const totalNpr = Number(booking.total_price || 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setPhase('processing');
        setErrorMsg('');

        try {
            // 1. Ask backend to create a PaymentIntent
            const intentData = await marketplaceService.createPaymentIntent(booking.id);

            // 2. Confirm the payment client-side with the card details
            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
                intentData.client_secret,
                {
                    payment_method: {
                        card: elements.getElement(CardElement),
                    },
                }
            );

            if (stripeError) {
                setErrorMsg(stripeError.message || 'Payment failed. Please try again.');
                setPhase('error');
                return;
            }

            if (paymentIntent.status !== 'succeeded') {
                setErrorMsg(`Unexpected payment status: ${paymentIntent.status}`);
                setPhase('error');
                return;
            }

            // 3. Notify backend to record the payment and flip booking to paid
            await marketplaceService.confirmPayment(booking.id, paymentIntent.id);

            setPhase('success');
            setTimeout(() => {
                onPaymentSuccess(booking.id);
                onClose();
            }, 1800);
        } catch (err) {
            setErrorMsg(err.message || 'Something went wrong. Please try again.');
            setPhase('error');
        }
    };

    // ── Success state ──────────────────────────────────────────
    if (phase === 'success') {
        return (
            <div className="pm-success">
                <div className="pm-success-icon">
                    <CheckCircle size={56} />
                </div>
                <h3>Payment Successful!</h3>
                <p>NPR {totalNpr.toLocaleString()} paid for <strong>{booking.vehicle_name}</strong></p>
                <p className="pm-success-sub">Your booking is confirmed and paid.</p>
            </div>
        );
    }

    // ── Main form ──────────────────────────────────────────────
    return (
        <form className="pm-form" onSubmit={handleSubmit}>
            {/* Booking Summary */}
            <div className="pm-booking-summary">
                <div className="pm-summary-vehicle">{booking.vehicle_name}</div>
                <div className="pm-summary-meta">
                    Booking #{booking.id} &nbsp;·&nbsp;
                    {new Date(booking.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    &nbsp;–&nbsp;
                    {new Date(booking.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div className="pm-summary-amount">
                    <span>Total due</span>
                    <strong>NPR {totalNpr.toLocaleString()}</strong>
                </div>
            </div>

            {/* Card Input */}
            <div className="pm-card-section">
                <label className="pm-card-label">
                    <CreditCard size={16} />
                    Card Details
                </label>
                <div className="pm-card-element-wrapper">
                    <CardElement
                        options={CARD_ELEMENT_OPTIONS}
                        onChange={(e) => {
                            setCardComplete(e.complete);
                            if (e.error) setErrorMsg(e.error.message);
                            else setErrorMsg('');
                        }}
                    />
                </div>
                <p className="pm-test-hint">
                    <strong>Test card:</strong> 4242 4242 4242 4242 &nbsp;·&nbsp; Any future date &nbsp;·&nbsp; Any CVC
                </p>
            </div>

            {/* Error */}
            {(phase === 'error' || errorMsg) && (
                <div className="pm-error">
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Submit */}
            <button
                type="submit"
                className="pm-pay-btn"
                disabled={!stripe || !cardComplete || phase === 'processing'}
            >
                {phase === 'processing' ? (
                    <>
                        <Loader size={18} className="pm-spinner" />
                        Processing…
                    </>
                ) : (
                    <>
                        <Lock size={16} />
                        Pay NPR {totalNpr.toLocaleString()}
                    </>
                )}
            </button>

            <p className="pm-secure-note">
                <Lock size={12} />
                Secured by Stripe · Test mode simulation
            </p>
        </form>
    );
};

/* ─────────────────────────────────────────────────────────────
   Outer wrapper — provides the Stripe Elements context
   ───────────────────────────────────────────────────────────── */
const PaymentModal = ({ booking, onClose, onPaymentSuccess }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="pm-modal-header">
                    <h2>Complete Payment</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Close">
                        <X size={24} />
                    </button>
                </div>

                <Elements stripe={stripePromise}>
                    <PaymentForm
                        booking={booking}
                        onClose={onClose}
                        onPaymentSuccess={onPaymentSuccess}
                    />
                </Elements>
            </div>
        </div>
    );
};

export default PaymentModal;
