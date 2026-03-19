import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Calendar, MapPin, Users } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import adminService from '../../services/admin';
import { useAuth } from '../../context/AuthContext';
import './AdminBookings.css';

const STATUS_TABS = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'rejected'];

const AdminBookings = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [expanded, setExpanded] = useState(null);

    useEffect(() => {
        loadBookings();
    }, [statusFilter]);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (search.trim()) params.search = search.trim();
            const data = await adminService.getBookings(params);
            setBookings(data);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    const countByStatus = (s) => bookings.filter(b => b.status === s).length;

    const filteredBookings = search
        ? bookings.filter(b =>
            b.tourist_name?.toLowerCase().includes(search.toLowerCase()) ||
            b.tourist_email?.toLowerCase().includes(search.toLowerCase()) ||
            b.vehicle_name?.toLowerCase().includes(search.toLowerCase())
        )
        : bookings;

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const statusConfig = {
        pending:   { label: 'Pending',   cls: 'adb-status--pending' },
        confirmed: { label: 'Confirmed', cls: 'adb-status--confirmed' },
        completed: { label: 'Completed', cls: 'adb-status--completed' },
        cancelled: { label: 'Cancelled', cls: 'adb-status--cancelled' },
        rejected:  { label: 'Rejected',  cls: 'adb-status--rejected' },
    };

    return (
        <AdminLayout user={user}>
            <div className="adb">
                {/* Heading */}
                <div className="adb-heading">
                    <div>
                        <h1 className="adb-title">Bookings</h1>
                        <p className="adb-subtitle">
                            {bookings.length} total · {countByStatus('pending')} pending · {countByStatus('confirmed')} confirmed
                        </p>
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="adb-tabs">
                    {STATUS_TABS.map(s => (
                        <button
                            key={s}
                            className={`adb-tab adb-tab--${s} ${statusFilter === (s === 'all' ? '' : s) ? 'active' : ''}`}
                            onClick={() => setStatusFilter(s === 'all' ? '' : s)}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                            <span className="adb-tab-count">
                                {s === 'all' ? bookings.length : countByStatus(s)}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <form className="adb-search" onSubmit={e => { e.preventDefault(); loadBookings(); }}>
                    <Search size={17} />
                    <input
                        type="text"
                        placeholder="Search by tourist name, email or vehicle…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <button type="submit">Search</button>
                </form>

                {/* Table */}
                <div className="adb-table-card">
                    {loading ? (
                        <div className="adb-loading">
                            <div className="adb-spinner"></div>
                            <p>Loading bookings…</p>
                        </div>
                    ) : (
                        <div className="adb-table-wrap">
                            <table className="adb-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Tourist</th>
                                        <th>Vehicle / Vendor</th>
                                        <th>Travel Dates</th>
                                        <th>Passengers</th>
                                        <th>Total (NPR)</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.map(b => {
                                        const sc = statusConfig[b.status] ?? statusConfig.pending;
                                        const isOpen = expanded === b.id;
                                        return (
                                            <>
                                                <tr
                                                    key={b.id}
                                                    className="adb-row"
                                                    onClick={() => setExpanded(isOpen ? null : b.id)}
                                                >
                                                    <td className="adb-td-id">#{b.id}</td>
                                                    <td>
                                                        <div className="adb-cell-name">{b.tourist_name}</div>
                                                        <div className="adb-cell-sub">{b.tourist_email}</div>
                                                    </td>
                                                    <td>
                                                        <div className="adb-cell-name">{b.vehicle_name}</div>
                                                        <div className="adb-cell-sub">{b.vendor_name}</div>
                                                    </td>
                                                    <td>
                                                        <div className="adb-cell-name">{formatDate(b.start_date)}</div>
                                                        <div className="adb-cell-sub">to {formatDate(b.end_date)} · {b.total_days}d</div>
                                                    </td>
                                                    <td className="adb-cell-center">{b.number_of_passengers}</td>
                                                    <td className="adb-td-price">
                                                        {Number(b.total_price).toLocaleString()}
                                                    </td>
                                                    <td>
                                                        <span className={`adb-status ${sc.cls}`}>{sc.label}</span>
                                                    </td>
                                                    <td>
                                                        <button className={`adb-expand-btn ${isOpen ? 'open' : ''}`}>
                                                            ›
                                                        </button>
                                                    </td>
                                                </tr>
                                                {isOpen && (
                                                    <tr key={`${b.id}-detail`} className="adb-detail-row">
                                                        <td colSpan={8}>
                                                            <BookingDetail b={b} formatDate={formatDate} />
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredBookings.length === 0 && (
                                <p className="adb-empty">No bookings found.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

const BookingDetail = ({ b, formatDate }) => (
    <div className="adb-detail">
        <div className="adb-detail-grid">
            <div className="adb-detail-item">
                <div className="adb-detail-label">
                    <MapPin size={14} /> Pickup Location
                </div>
                <div className="adb-detail-value">{b.pickup_location || '—'}</div>
            </div>
            <div className="adb-detail-item">
                <div className="adb-detail-label">
                    <MapPin size={14} /> Drop-off Location
                </div>
                <div className="adb-detail-value">{b.dropoff_location || '—'}</div>
            </div>
            <div className="adb-detail-item">
                <div className="adb-detail-label">
                    <Users size={14} /> Passengers
                </div>
                <div className="adb-detail-value">{b.number_of_passengers}</div>
            </div>
            <div className="adb-detail-item">
                <div className="adb-detail-label">Contact Number</div>
                <div className="adb-detail-value">{b.contact_number || '—'}</div>
            </div>
            <div className="adb-detail-item">
                <div className="adb-detail-label">
                    <Calendar size={14} /> Booked On
                </div>
                <div className="adb-detail-value">{formatDate(b.created_at)}</div>
            </div>
            <div className="adb-detail-item">
                <div className="adb-detail-label">Price / Day</div>
                <div className="adb-detail-value">NPR {Number(b.price_per_day).toLocaleString()}</div>
            </div>
        </div>
        {b.special_requests && (
            <div className="adb-special-requests">
                <strong>Special Requests:</strong> {b.special_requests}
            </div>
        )}
        {b.admin_notes && (
            <div className="adb-admin-notes">
                <strong>Admin Notes:</strong> {b.admin_notes}
            </div>
        )}
    </div>
);

export default AdminBookings;
