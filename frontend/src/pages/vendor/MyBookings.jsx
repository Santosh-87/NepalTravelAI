import React, { useState, useEffect } from 'react';
import VendorLayout from '../../components/vendor/VendorLayout';
import BookingCard from '../../components/vendor/BookingCard';
import marketplaceService from '../../services/marketplace';
import { AlertCircle } from 'lucide-react';
import './MyBookings.css';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState('');

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

    const handleConfirm = async (id) => {
        if (!window.confirm('Confirm this booking?')) return;
        try {
            await marketplaceService.confirmBooking(id);
            setBookings(bookings.map(b =>
                b.id === id ? { ...b, status: 'confirmed' } : b
            ));
        } catch (err) {
            alert('Failed to confirm booking: ' + err.message);
        }
    };

    const handleReject = async (id) => {
        const reason = prompt('Reason for rejection (optional):');
        if (reason === null) return;
        try {
            await marketplaceService.rejectBooking(id, reason);
            setBookings(bookings.map(b =>
                b.id === id ? { ...b, status: 'rejected' } : b
            ));
        } catch (err) {
            alert('Failed to reject booking: ' + err.message);
        }
    };

    const handleComplete = async (id) => {
        if (!window.confirm('Mark this booking as completed?')) return;
        try {
            await marketplaceService.completeBooking(id);
            setBookings(bookings.map(b =>
                b.id === id ? { ...b, status: 'completed' } : b
            ));
        } catch (err) {
            alert('Failed to complete booking: ' + err.message);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Cancel this booking?')) return;
        try {
            await marketplaceService.cancelBooking(id);
            setBookings(bookings.map(b =>
                b.id === id ? { ...b, status: 'cancelled' } : b
            ));
        } catch (err) {
            alert('Failed to cancel booking: ' + err.message);
        }
    };

    // --- Price Negotiation Handlers ---

    const handleAcceptOffer = async (id) => {
        if (!window.confirm('Accept customer\'s price offer?')) return;
        try {
            const updated = await marketplaceService.vendorRespondToOffer(id, { action: 'accept' });
            setBookings(bookings.map(b => b.id === id ? updated : b));
        } catch (err) {
            alert('Failed to accept offer: ' + err.message);
        }
    };

    const handleRejectOffer = async (id) => {
        const reason = prompt('Reason for rejecting the offer (optional):');
        if (reason === null) return;
        try {
            const updated = await marketplaceService.vendorRespondToOffer(id, { action: 'reject', reason });
            setBookings(bookings.map(b => b.id === id ? updated : b));
        } catch (err) {
            alert('Failed to reject offer: ' + err.message);
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
