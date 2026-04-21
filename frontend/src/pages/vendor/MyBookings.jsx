import React, { useState, useEffect } from 'react';
import VendorLayout from '../../components/vendor/VendorLayout';
import BookingCard from '../../components/vendor/BookingCard';
import marketplaceService from '../../services/marketplace';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import ConfirmModal from '../../components/shared/ConfirmModal';
import './MyBookings.css';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState('');
    const [modal, setModal] = useState(null);
    const [rejectModal, setRejectModal] = useState(null); // { id, type: 'booking'|'offer', title }
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await marketplaceService.getMyBookings();
            setBookings(data);
        } catch (err) {
            console.error('Failed to load bookings:', err);
            setError('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = (id) => {
        setModal({
            title: 'Confirm Booking?',
            message: 'This will confirm the booking and notify the tourist.',
            confirmLabel: 'Confirm Booking',
            variant: 'primary',
            icon: <CheckCircle size={21} />,
            onConfirm: async () => {
                setModal(null);
                try {
                    await marketplaceService.confirmBooking(id);
                    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' } : b));
                } catch (err) {
                    alert('Failed to confirm booking: ' + err.message);
                }
            },
        });
    };

    const handleReject = (id) => {
        setRejectReason('');
        setRejectModal({ id, type: 'booking', title: 'Reject Booking' });
    };

    const handleComplete = (id) => {
        setModal({
            title: 'Mark as Completed?',
            message: 'This will mark the booking as completed.',
            confirmLabel: 'Mark Completed',
            variant: 'primary',
            icon: <CheckCircle size={21} />,
            onConfirm: async () => {
                setModal(null);
                try {
                    await marketplaceService.completeBooking(id);
                    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'completed' } : b));
                } catch (err) {
                    alert('Failed to complete booking: ' + err.message);
                }
            },
        });
    };

    const handleCancel = (id) => {
        setModal({
            title: 'Cancel Booking?',
            message: 'This will cancel the booking and cannot be undone.',
            confirmLabel: 'Yes, Cancel',
            variant: 'danger',
            icon: <XCircle size={21} />,
            onConfirm: async () => {
                setModal(null);
                try {
                    await marketplaceService.cancelBooking(id);
                    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
                } catch (err) {
                    alert('Failed to cancel booking: ' + err.message);
                }
            },
        });
    };

    // --- Price Negotiation Handlers ---

    const handleAcceptOffer = (id) => {
        setModal({
            title: "Accept Customer's Offer?",
            message: "You're accepting the customer's offered price. The booking will be confirmed.",
            confirmLabel: 'Accept Offer',
            variant: 'primary',
            icon: <CheckCircle size={21} />,
            onConfirm: async () => {
                setModal(null);
                try {
                    const updated = await marketplaceService.vendorRespondToOffer(id, { action: 'accept' });
                    setBookings(prev => prev.map(b => b.id === id ? updated : b));
                } catch (err) {
                    alert('Failed to accept offer: ' + err.message);
                }
            },
        });
    };

    const handleRejectOffer = (id) => {
        setRejectReason('');
        setRejectModal({ id, type: 'offer', title: 'Reject Price Offer' });
    };

    const handleRejectSubmit = async () => {
        if (!rejectModal) return;
        const { id, type } = rejectModal;
        try {
            if (type === 'booking') {
                await marketplaceService.rejectBooking(id, rejectReason);
                setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'rejected' } : b));
            } else {
                const updated = await marketplaceService.vendorRespondToOffer(id, { action: 'reject', reason: rejectReason });
                setBookings(prev => prev.map(b => b.id === id ? updated : b));
            }
        } catch (err) {
            alert(`Failed to reject: ${err.message}`);
        } finally {
            setRejectModal(null);
            setRejectReason('');
        }
    };

    const handleCounterOffer = async (id, counterPrice) => {
        try {
            const updated = await marketplaceService.vendorRespondToOffer(id, { action: 'counter', counter_price: counterPrice });
            setBookings(bookings.map(b => b.id === id ? updated : b));
        } catch (err) {
            alert('Failed to send counter: ' + err.message);
        }
    };

    const filteredBookings = filter === 'all'
        ? bookings
        : filter === 'offers'
            ? bookings.filter(b => b.status === 'pending_vendor_approval')
            : bookings.filter(b => b.status === filter);

    const offersCount = bookings.filter(b => b.status === 'pending_vendor_approval').length;

    return (
        <VendorLayout>
            {rejectModal && (
                <div className="vb-reject-overlay" onClick={() => setRejectModal(null)}>
                    <div className="vb-reject-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="vb-reject-title">{rejectModal.title}</h3>
                        <p className="vb-reject-desc">Optionally provide a reason for the tourist:</p>
                        <textarea
                            className="vb-reject-textarea"
                            rows={3}
                            placeholder="Reason (optional)…"
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            autoFocus
                        />
                        <div className="vb-reject-actions">
                            <button className="vb-reject-cancel" onClick={() => setRejectModal(null)}>Cancel</button>
                            <button className="vb-reject-confirm" onClick={handleRejectSubmit}>Confirm Rejection</button>
                        </div>
                    </div>
                </div>
            )}
            {modal && (
                <ConfirmModal
                    {...modal}
                    onCancel={() => setModal(null)}
                />
            )}
            <div className="vendor-bookings-page">
                <div className="page-header">
                    <div>
                        <h1>Booking Requests</h1>
                        <p className="page-subtitle">
                            Manage your vehicle bookings
                        </p>
                    </div>
                    <div className="bookings-count">
                        {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {error && (
                    <div className="error-banner">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="booking-filters">
                    <button
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >
                        All ({bookings.length})
                    </button>
                    <button
                        className={filter === 'pending' ? 'active' : ''}
                        onClick={() => setFilter('pending')}
                    >
                        Pending ({bookings.filter(b => b.status === 'pending').length})
                    </button>
                    {offersCount > 0 && (
                        <button
                            className={`filter-offers ${filter === 'offers' ? 'active' : ''}`}
                            onClick={() => setFilter('offers')}
                        >
                            Offers ({offersCount})
                        </button>
                    )}
                    <button
                        className={filter === 'confirmed' ? 'active' : ''}
                        onClick={() => setFilter('confirmed')}
                    >
                        Confirmed ({bookings.filter(b => b.status === 'confirmed').length})
                    </button>
                    <button
                        className={filter === 'completed' ? 'active' : ''}
                        onClick={() => setFilter('completed')}
                    >
                        Completed ({bookings.filter(b => b.status === 'completed').length})
                    </button>
                    <button
                        className={filter === 'rejected' ? 'active' : ''}
                        onClick={() => setFilter('rejected')}
                    >
                        Rejected ({bookings.filter(b => b.status === 'rejected').length})
                    </button>
                    <button
                        className={filter === 'cancelled' ? 'active' : ''}
                        onClick={() => setFilter('cancelled')}
                    >
                        Cancelled ({bookings.filter(b => b.status === 'cancelled').length})
                    </button>
                </div>

                {/* Bookings List */}
                {loading ? (
                    <div className="loading-state">
                        <div className="loader"></div>
                        <p>Loading bookings...</p>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="empty-state">
                        {bookings.length === 0 ? (
                            <>
                                <div className="empty-icon">📅</div>
                                <h3>No bookings yet</h3>
                                <p>Bookings for your vehicles will appear here</p>
                            </>
                        ) : (
                            <p>No {filter} bookings</p>
                        )}
                    </div>
                ) : (
                    <div className="bookings-list">
                        {filteredBookings.map(booking => (
                            <BookingCard
                                key={booking.id}
                                booking={booking}
                                onConfirm={handleConfirm}
                                onReject={handleReject}
                                onComplete={handleComplete}
                                onCancel={handleCancel}
                                onAcceptOffer={handleAcceptOffer}
                                onRejectOffer={handleRejectOffer}
                                onCounterOffer={handleCounterOffer}
                            />
                        ))}
                    </div>
                )}
            </div>
        </VendorLayout>
    );
};

export default MyBookings;
