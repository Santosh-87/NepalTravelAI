import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Users, Car, CalendarCheck, TrendingUp,
    Clock, CheckCircle, AlertTriangle, ArrowRight,
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer,
} from 'recharts';
import AdminLayout from '../../components/admin/AdminLayout';
import adminService from '../../services/admin';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

const STATUS_COLORS = {
    Pending:   '#f97316',
    Confirmed: '#1d4ed8',
    Completed: '#059669',
    Cancelled: '#6b7280',
    Rejected:  '#b91c1c',
};

const CHART_TOOLTIP_STYLE = {
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    fontSize: 13,
};

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats]         = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [statsData, analyticsData] = await Promise.all([
                adminService.getStats(),
                adminService.getAnalytics(),
            ]);
            setStats(statsData);
            setAnalytics(analyticsData);
        } catch {
            setError('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (n) => `NPR ${Number(n).toLocaleString()}`;
    const formatDate = (d) =>
        new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const statusConfig = {
        pending:   { label: 'Pending',   cls: 'status--pending' },
        confirmed: { label: 'Confirmed', cls: 'status--confirmed' },
        completed: { label: 'Completed', cls: 'status--completed' },
        cancelled: { label: 'Cancelled', cls: 'status--cancelled' },
        rejected:  { label: 'Rejected',  cls: 'status--rejected' },
    };

    const totalBookings = analytics?.booking_status_dist?.reduce((s, e) => s + e.count, 0) ?? 0;

    return (
        <AdminLayout user={user}>
            <div className="adp">

                {/* ---- Heading ---- */}
                <div className="adp-heading">
                    <div>
                        <h1 className="adp-title">Dashboard</h1>
                        <p className="adp-subtitle">
                            Welcome back, {user?.full_name?.split(' ')[0] ?? 'Admin'}
                        </p>
                    </div>
                    <button className="adp-refresh-btn" onClick={loadData}>Refresh</button>
                </div>

                {error && <div className="adp-error">{error}</div>}

                {loading ? (
                    <div className="adp-loading">
                        <div className="adp-spinner" />
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
                                Icon={Users} color="blue"
                            />
                            <StatCard
                                label="Total Revenue"
                                value={formatCurrency(stats.revenue)}
                                sub="confirmed & completed bookings"
                                Icon={TrendingUp} color="green"
                            />
                            <StatCard
                                label="Vehicle Listings"
                                value={stats.vehicles.total}
                                sub={`${stats.vehicles.approved} approved · ${stats.vehicles.pending} pending`}
                                Icon={Car} color="gold"
                            />
                            <StatCard
                                label="Total Bookings"
                                value={stats.bookings.total}
                                sub={`${stats.bookings.confirmed} confirmed · ${stats.bookings.completed} completed`}
                                Icon={CalendarCheck} color="purple"
                            />
                        </div>

                        {/* ---- Action Alerts ---- */}
                        {(stats.users.pending_vendors > 0 || stats.vehicles.pending > 0) && (
                            <div className="adp-alerts">
                                <h2 className="adp-section-title">
                                    <AlertTriangle size={18} /> Action Required
                                </h2>
                                <div className="adp-alert-cards">
                                    {stats.users.pending_vendors > 0 && (
                                        <Link to="/admin/users?role=vendor" className="adp-alert-card adp-alert-card--orange">
                                            <Clock size={22} />
                                            <div>
                                                <strong>
                                                    {stats.users.pending_vendors} vendor{stats.users.pending_vendors > 1 ? 's' : ''} awaiting approval
                                                </strong>
                                                <p>Review and approve pending vendor registrations</p>
                                            </div>
                                            <ArrowRight size={18} className="adp-alert-arrow" />
                                        </Link>
                                    )}
                                    {stats.vehicles.pending > 0 && (
                                        <Link to="/admin/vehicles?status=pending" className="adp-alert-card adp-alert-card--blue">
                                            <Car size={22} />
                                            <div>
                                                <strong>
                                                    {stats.vehicles.pending} vehicle listing{stats.vehicles.pending > 1 ? 's' : ''} awaiting approval
                                                </strong>
                                                <p>Review and approve vehicle submissions</p>
                                            </div>
                                            <ArrowRight size={18} className="adp-alert-arrow" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ======== ANALYTICS CHARTS ======== */}
                        {analytics && (
                            <>
                                {/* ---- Row 1: Bookings Trend + Status Donut ---- */}
                                <div className="adp-charts-row adp-charts-row--60-40">

                                    {/* Monthly Bookings Area Chart */}
                                    <div className="adp-chart-card">
                                        <div className="adp-chart-header">
                                            <h2 className="adp-section-title">Monthly Bookings</h2>
                                            <span className="adp-chart-badge">Last 6 months</span>
                                        </div>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <AreaChart
                                                data={analytics.monthly_trends}
                                                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                                            >
                                                <defs>
                                                    <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%"  stopColor="#1d4ed8" stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                <XAxis
                                                    dataKey="month"
                                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                                    axisLine={false} tickLine={false}
                                                />
                                                <YAxis
                                                    allowDecimals={false}
                                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                                    axisLine={false} tickLine={false} width={28}
                                                />
                                                <Tooltip
                                                    contentStyle={CHART_TOOLTIP_STYLE}
                                                    formatter={(v) => [v, 'Bookings']}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="bookings"
                                                    stroke="#1d4ed8"
                                                    strokeWidth={2.5}
                                                    fill="url(#bookingGrad)"
                                                    dot={{ r: 3, fill: '#1d4ed8', strokeWidth: 0 }}
                                                    activeDot={{ r: 5 }}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Booking Status Donut */}
                                    <div className="adp-chart-card">
                                        <div className="adp-chart-header">
                                            <h2 className="adp-section-title">Booking Status</h2>
                                        </div>
                                        {analytics.booking_status_dist.length > 0 ? (
                                            <>
                                                <div className="adp-donut-wrap">
                                                    <ResponsiveContainer width="100%" height={180}>
                                                        <PieChart>
                                                            <Pie
                                                                data={analytics.booking_status_dist}
                                                                cx="50%" cy="50%"
                                                                innerRadius={55}
                                                                outerRadius={78}
                                                                dataKey="count"
                                                                nameKey="status"
                                                                paddingAngle={3}
                                                            >
                                                                {analytics.booking_status_dist.map((entry) => (
                                                                    <Cell
                                                                        key={entry.status}
                                                                        fill={STATUS_COLORS[entry.status] ?? '#94a3b8'}
                                                                    />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip
                                                                contentStyle={CHART_TOOLTIP_STYLE}
                                                                formatter={(v, name) => [v, name]}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    <div className="adp-donut-center">
                                                        <span className="adp-donut-total">{totalBookings}</span>
                                                        <span className="adp-donut-label">Total</span>
                                                    </div>
                                                </div>
                                                <div className="adp-donut-legend">
                                                    {analytics.booking_status_dist.map((entry) => (
                                                        <div key={entry.status} className="adp-legend-item">
                                                            <span
                                                                className="adp-legend-dot"
                                                                style={{ background: STATUS_COLORS[entry.status] ?? '#94a3b8' }}
                                                            />
                                                            <span className="adp-legend-name">{entry.status}</span>
                                                            <span className="adp-legend-count">{entry.count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <p className="adp-chart-empty">No booking data yet.</p>
                                        )}
                                    </div>
                                </div>

                                {/* ---- Row 2: Revenue + Vehicle Types ---- */}
                                <div className="adp-charts-row adp-charts-row--50-50">

                                    {/* Monthly Revenue Bar Chart */}
                                    <div className="adp-chart-card">
                                        <div className="adp-chart-header">
                                            <h2 className="adp-section-title">Monthly Revenue</h2>
                                            <span className="adp-chart-badge">Last 6 months</span>
                                        </div>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart
                                                data={analytics.monthly_trends}
                                                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                                                barSize={24}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                <XAxis
                                                    dataKey="month"
                                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                                    axisLine={false} tickLine={false}
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                                    axisLine={false} tickLine={false} width={48}
                                                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                                                />
                                                <Tooltip
                                                    contentStyle={CHART_TOOLTIP_STYLE}
                                                    formatter={(v) => [`NPR ${Number(v).toLocaleString()}`, 'Revenue']}
                                                />
                                                <Bar dataKey="revenue" fill="#059669" radius={[5, 5, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Vehicle Type Horizontal Bar */}
                                    <div className="adp-chart-card">
                                        <div className="adp-chart-header">
                                            <h2 className="adp-section-title">Vehicle Types</h2>
                                        </div>
                                        {analytics.vehicle_type_dist.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={220}>
                                                <BarChart
                                                    data={analytics.vehicle_type_dist}
                                                    layout="vertical"
                                                    margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
                                                    barSize={16}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                                    <XAxis
                                                        type="number"
                                                        allowDecimals={false}
                                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                                        axisLine={false} tickLine={false}
                                                    />
                                                    <YAxis
                                                        type="category"
                                                        dataKey="type"
                                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                                        axisLine={false} tickLine={false} width={90}
                                                    />
                                                    <Tooltip
                                                        contentStyle={CHART_TOOLTIP_STYLE}
                                                        formatter={(v) => [v, 'Vehicles']}
                                                    />
                                                    <Bar dataKey="count" fill="#7c3aed" radius={[0, 5, 5, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <p className="adp-chart-empty">No vehicle data yet.</p>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                        {/* ======== END ANALYTICS ======== */}

                        {/* ---- Booking Summary Chips ---- */}
                        <div className="adp-booking-summary">
                            <BookingChip label="Pending"   count={stats.bookings.pending}   Icon={Clock}       cls="chip--pending" />
                            <BookingChip label="Confirmed" count={stats.bookings.confirmed} Icon={CheckCircle} cls="chip--confirmed" />
                            <BookingChip label="Completed" count={stats.bookings.completed} Icon={CheckCircle} cls="chip--completed" />
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
                                                    <td className="adp-td-price">{formatCurrency(b.total_price)}</td>
                                                    <td>
                                                        <span className={`adp-status ${sc.cls}`}>{sc.label}</span>
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
        <div className="adp-stat-icon"><Icon size={22} /></div>
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
