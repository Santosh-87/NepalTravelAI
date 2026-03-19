import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Users, Car, CalendarCheck, DollarSign,
    Clock, CheckCircle, XCircle, AlertTriangle,
    TrendingUp, ArrowRight,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import adminService from '../../services/admin';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const data = await adminService.getStats();
            setStats(data);
        } catch (err) {
            setError('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (n) =>
        `NPR ${Number(n).toLocaleString()}`;

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        });

    const statusConfig = {
        pending:   { label: 'Pending',   cls: 'status--pending' },
        confirmed: { label: 'Confirmed', cls: 'status--confirmed' },
        completed: { label: 'Completed', cls: 'status--completed' },
        cancelled: { label: 'Cancelled', cls: 'status--cancelled' },
        rejected:  { label: 'Rejected',  cls: 'status--rejected' },
    };

    return (
        <AdminLayout user={user}>
            <div className="adp">
                {/* Page heading */}
                <div className="adp-heading">
                    <div>
                        <h1 className="adp-title">Dashboard</h1>
                        <p className="adp-subtitle">
                            Welcome back, {user?.full_name?.split(' ')[0] ?? 'Admin'}
                        </p>
                    </div>
                    <button className="adp-refresh-btn" onClick={loadStats}>
                        Refresh
                    </button>
                </div>

                {error && <div className="adp-error">{error}</div>}

                {loading ? (
                    <div className="adp-loading">
                        <div className="adp-spinner"></div>
                        <p>Loading dashboard…</p>
                    </div>
                ) : stats && (
                    <>
                        {/* ---- Stat Cards ---- */}
                        <div className="adp-stat-grid">
                            <StatCard
                                label="Total Users"
                                value={stats.users.total}
                                sub={`${stats.users.tourists} tourists · ${stats.users.vendors} vendors`}
                                Icon={Users}
                                color="blue"
                            />
                            <StatCard
                                label="Total Revenue"
                                value={formatCurrency(stats.revenue)}
                                sub="from confirmed & completed bookings"
                                Icon={TrendingUp}
                                color="green"
                            />
                            <StatCard
                                label="Vehicle Listings"
                                value={stats.vehicles.total}
                                sub={`${stats.vehicles.approved} approved · ${stats.vehicles.pending} pending`}
                                Icon={Car}
                                color="gold"
                            />
                            <StatCard
                                label="Total Bookings"
                                value={stats.bookings.total}
                                sub={`${stats.bookings.confirmed} confirmed · ${stats.bookings.completed} completed`}
                                Icon={CalendarCheck}
                                color="purple"
                            />
                        </div>

                        {/* ---- Action Needed ---- */}
                        {(stats.users.pending_vendors > 0 || stats.vehicles.pending > 0) && (
                            <div className="adp-alerts">
                                <h2 className="adp-section-title">
                                    <AlertTriangle size={18} />
                                    Action Required
                                </h2>
                                <div className="adp-alert-cards">
                                    {stats.users.pending_vendors > 0 && (
                                        <Link to="/admin/users?role=vendor" className="adp-alert-card adp-alert-card--orange">
                                            <Clock size={22} />
                                            <div>
                                                <strong>{stats.users.pending_vendors} vendor{stats.users.pending_vendors > 1 ? 's' : ''} awaiting approval</strong>
                                                <p>Review and approve pending vendor registrations</p>
                                            </div>
                                            <ArrowRight size={18} className="adp-alert-arrow" />
                                        </Link>
                                    )}
                                    {stats.vehicles.pending > 0 && (
                                        <Link to="/admin/vehicles?status=pending" className="adp-alert-card adp-alert-card--blue">
                                            <Car size={22} />
                                            <div>
                                                <strong>{stats.vehicles.pending} vehicle listing{stats.vehicles.pending > 1 ? 's' : ''} awaiting approval</strong>
                                                <p>Review and approve vehicle submissions</p>
                                            </div>
                                            <ArrowRight size={18} className="adp-alert-arrow" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ---- Booking Summary Chips ---- */}
                        <div className="adp-booking-summary">
                            <BookingChip label="Pending"   count={stats.bookings.pending}   Icon={Clock}         cls="chip--pending" />
                            <BookingChip label="Confirmed" count={stats.bookings.confirmed} Icon={CheckCircle}   cls="chip--confirmed" />
                            <BookingChip label="Completed" count={stats.bookings.completed} Icon={CheckCircle}   cls="chip--completed" />
                        </div>

                        {/* ---- Recent Bookings Table ---- */}
                        <div className="adp-table-card">
                            <div className="adp-table-header">
                                <h2 className="adp-section-title">Recent Bookings</h2>
                                <Link to="/admin/bookings" className="adp-view-all">
                                    View all <ArrowRight size={14} />
                                </Link>
                            </div>
                            <div className="adp-table-wrap">
                                <table className="adp-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Tourist</th>
                                            <th>Vehicle</th>
                                            <th>Dates</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.recent_bookings.map(b => {
                                            const sc = statusConfig[b.status] ?? statusConfig.pending;
                                            return (
                                                <tr key={b.id}>
                                                    <td className="adp-td-id">#{b.id}</td>
                                                    <td>
                                                        <div className="adp-td-name">{b.tourist_name}</div>
                                                        <div className="adp-td-sub">{b.tourist_email}</div>
                                                    </td>
                                                    <td>
                                                        <div className="adp-td-name">{b.vehicle_name}</div>
                                                        <div className="adp-td-sub">{b.vendor_name}</div>
                                                    </td>
                                                    <td>
                                                        <div className="adp-td-name">{formatDate(b.start_date)}</div>
                                                        <div className="adp-td-sub">to {formatDate(b.end_date)}</div>
                                                    </td>
                                                    <td className="adp-td-price">
                                                        {formatCurrency(b.total_price)}
                                                    </td>
                                                    <td>
                                                        <span className={`adp-status ${sc.cls}`}>
                                                            {sc.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {stats.recent_bookings.length === 0 && (
                                    <p className="adp-empty-table">No bookings yet.</p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
};

/* ---- Sub-components ---- */
const StatCard = ({ label, value, sub, Icon, color }) => (
    <div className={`adp-stat-card adp-stat-card--${color}`}>
        <div className="adp-stat-icon">
            <Icon size={22} />
        </div>
        <div className="adp-stat-body">
            <div className="adp-stat-value">{value}</div>
            <div className="adp-stat-label">{label}</div>
            <div className="adp-stat-sub">{sub}</div>
        </div>
    </div>
);

const BookingChip = ({ label, count, Icon, cls }) => (
    <div className={`adp-chip ${cls}`}>
        <Icon size={16} />
        <span className="adp-chip-count">{count}</span>
        <span>{label}</span>
    </div>
);

export default AdminDashboard;
