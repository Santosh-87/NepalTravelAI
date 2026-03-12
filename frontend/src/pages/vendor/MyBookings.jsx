import VendorLayout from '../../components/vendor/VendorLayout';
import BookingCard from '../../components/vendor/BookingCard';
import marketplaceService from '../../services/marketplace';
import { Filter } from 'lucide-react';
import './MyBookings.css';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        loadBookings();
    }, []);

    useEffect(() => {
        filterBookings();
    }, [bookings, statusFilter]);

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

    const filterBookings = () => {
        if (statusFilter === 'all') {
            setFilteredBookings(bookings);
        } else {
            setFilteredBookings(bookings.filter(b => b.status === statusFilter));
        }
    };

    const handleConfirm = async (id) => {
        try {
            await marketplaceService.confirmBooking(id);

            // Update local state
            setBookings(bookings.map(b =>
                b.id === id ? { ...b, status: 'confirmed' } : b
            ));
        } catch (err) {
            alert('Failed to confirm booking');
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        try {
            await marketplaceService.cancelBooking(id);

            // Update local state
            setBookings(bookings.map(b =>
                b.id === id ? { ...b, status: 'cancelled' } : b
            ));
        } catch (err) {
            alert('Failed to cancel booking');
        }
    };

    if (loading) {
        return (
            <VendorLayout>
                <div className="loading-state">Loading bookings...</div>
            </VendorLayout>
        );
    }

    return (
        <VendorLayout>
            <div className="bookings-page">
                <div className="bookings-header">
                    <div>
                        <h1>Bookings</h1>
                        <p className="bookings-subtitle">
                            {bookings.length} booking{bookings.length !== 1 ? 's' : ''} total
                        </p>
                    </div>
                </div>

                {/* Filter */}
                <div className="bookings-filter">
                    <div className="filter-group">
                        <Filter size={18} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Bookings</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>

                {/* Bookings List */}
                {filteredBookings.length === 0 ? (
                    <div className="empty-state">
                        {bookings.length === 0 ? (
                            <p>No bookings yet. They'll appear here when tourists book your vehicles.</p>
                        ) : (
                            <p>No bookings match your filter</p>
                        )}
                    </div>
                ) : (
                    <div className="bookings-list">
                        {filteredBookings.map(booking => (
                            <BookingCard
                                key={booking.id}
                                booking={booking}
                                onConfirm={handleConfirm}
                                onCancel={handleCancel}
                            />
                        ))}
                    </div>
                )}
            </div>
        </VendorLayout>
    );
};

export default MyBookings;