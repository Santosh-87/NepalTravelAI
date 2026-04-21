import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Car, CalendarCheck, Trash2 } from 'lucide-react';
import {
    BarChart, Bar,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer,
} from 'recharts';
import ConfirmModal from '../../components/shared/ConfirmModal';
import VendorLayout from '../../components/vendor/VendorLayout';
import Stats from '../../components/vendor/Stats';
import VehicleCard from '../../components/vendor/VehicleCard';
import marketplaceService from '../../services/marketplace';
import './VendorDashboard.css';

const STATUS_CFG = {
    pending:   { cls: 'status--pending',   label: 'Pending'   },
    confirmed: { cls: 'status--confirmed', label: 'Confirmed' },
    completed: { cls: 'status--completed', label: 'Completed' },
    cancelled: { cls: 'status--cancelled', label: 'Cancelled' },
    rejected:  { cls: 'status--rejected',  label: 'Rejected'  },
};

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

// Build a series of the last 6 calendar months with revenue summed from
// confirmed/completed bookings whose start_date falls within that month.
const buildMonthlyRevenue = (bookings) => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            key: `${d.getFullYear()}-${d.getMonth()}`,
            month: d.toLocaleDateString('en-US', { month: 'short' }),
            revenue: 0,
        });
    }
    bookings.forEach(b => {
        if (b.status !== 'confirmed' && b.status !== 'completed') return;
        const d = new Date(b.start_date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const bucket = months.find(m => m.key === key);
        if (bucket) bucket.revenue += Number(b.total_price || 0);
    });
    return months;
};

const buildStatusDistribution = (bookings) => {
    const counts = {};
    bookings.forEach(b => {
        const label = (b.status || 'pending').charAt(0).toUpperCase() + (b.status || 'pending').slice(1);
        counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
};

const VendorDashboard = () => {
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modal, setModal] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [vehiclesData, bookingsData] = await Promise.all([
                marketplaceService.getMyVehicles(),
                marketplaceService.getMyBookings(),
            ]);
            setVehicles(vehiclesData);
            setBookings(bookingsData);
            setError('');
        } catch (err) {
            setError('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    const monthlyRevenue = useMemo(() => buildMonthlyRevenue(bookings), [bookings]);
    const statusDist     = useMemo(() => buildStatusDistribution(bookings), [bookings]);
    const totalBookings  = bookings.length;

    const handleEdit   = (vehicle) => navigate(`/vendor/edit-vehicle/${vehicle.id}`);

    const handleDelete = (id) => {
        setModal({
            title: 'Delete Vehicle?',
            message: 'This will permanently remove this vehicle listing and cannot be undone.',
            confirmLabel: 'Delete',
            variant: 'danger',
            icon: <Trash2 size={21} />,
            onConfirm: async () => {
                setModal(null);
                try {
                    await marketplaceService.deleteVehicle(id);
                    setVehicles(prev => prev.filter(v => v.id !== id));
                } catch {
                    alert('Failed to delete vehicle.');
                }
            },
        });
    };

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <VendorLayout>
            {modal && (
                <ConfirmModal
                    {...modal}
                    onCancel={() => setModal(null)}
                />
            )}
            <div className="vdp">
                {/* Page heading */}
                <div className="vdp-heading">
                    <div>
                        <h1 className="vdp-title">Dashboard</h1>
                        <p className="vdp-subtitle">Manage your vehicles and bookings</p>
                    </div>
                    <Link to="/vendor/add-vehicle" className="vdp-add-btn">
                        <Plus size={18} />
                        Add Vehicle
                    </Link>
                </div>

                {error && <div className="vdp-error">{error}</div>}

                {loading ? (
                    <div className="vdp-loading">
                        <div className="vdp-spinner" />
                        <p>Loading dashboard…</p>
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <Stats vehicles={vehicles} bookings={bookings} />

                        {/* Charts */}
                        {bookings.length > 0 && (
                            <div className="vdp-charts-row">

                                {/* Monthly Revenue Bar Chart */}
                                <div className="vdp-chart-card">
                                    <div className="vdp-chart-header">
                                        <h2 className="vdp-section-title">Monthly Revenue</h2>
                                        <span className="vdp-chart-badge">Last 6 months</span>
                                    </div>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart
                                            data={monthlyRevenue}
                                            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                                            barSize={28}
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
                                            <Bar dataKey="revenue" fill="#0d9488" radius={[5, 5, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Booking Status Donut */}
                                <div className="vdp-chart-card">
                                    <div className="vdp-chart-header">
                                        <h2 className="vdp-section-title">Booking Status</h2>
                                    </div>
                                    {statusDist.length > 0 ? (
                                        <>
                                            <div className="vdp-donut-wrap">
                                                <ResponsiveContainer width="100%" height={180}>
                                                    <PieChart>
                                                        <Pie
                                                            data={statusDist}
                                                            cx="50%" cy="50%"
                                                            innerRadius={55}
                                                            outerRadius={78}
                                                            dataKey="count"
                                                            nameKey="status"
                                                            paddingAngle={3}
                                                        >
                                                            {statusDist.map((entry) => (
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
                                                <div className="vdp-donut-center">
                                                    <span className="vdp-donut-total">{totalBookings}</span>
                                                    <span className="vdp-donut-label">Total</span>
                                                </div>
                                            </div>
                                            <div className="vdp-donut-legend">
                                                {statusDist.map((entry) => (
                                                    <div key={entry.status} className="vdp-legend-item">
                                                        <span
                                                            className="vdp-legend-dot"
                                                            style={{ background: STATUS_COLORS[entry.status] ?? '#94a3b8' }}
                                                        />
                                                        <span className="vdp-legend-name">{entry.status}</span>
                                                        <span className="vdp-legend-count">{entry.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="vdp-chart-empty">No booking data yet.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Recent Vehicles */}
                        <div className="vdp-section">
                            <div className="vdp-section-header">
                                <h2 className="vdp-section-title">
                                    <Car size={18} />
                                    Recent Vehicles
                                </h2>
                                <Link to="/vendor/listings" className="vdp-view-all">
                                    View all <ArrowRight size={14} />
                                </Link>
                            </div>

                            {vehicles.length === 0 ? (
                                <div className="vdp-empty">
                                    <p>No vehicles yet. Add your first vehicle to get started.</p>
                                    <Link to="/vendor/add-vehicle" className="vdp-add-btn">
                                        <Plus size={18} /> Add Vehicle
                                    </Link>
                                </div>
                            ) : (
                                <div className="vdp-vehicles-grid">
                                    {vehicles.slice(0, 3).map(vehicle => (
                                        <VehicleCard
                                            key={vehicle.id}
                                            vehicle={vehicle}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Bookings */}
                        <div className="vdp-section">
                            <div className="vdp-section-header">
                                <h2 className="vdp-section-title">
                                    <CalendarCheck size={18} />
                                    Recent Bookings
                                </h2>
                                <Link to="/vendor/bookings" className="vdp-view-all">
                                    View all <ArrowRight size={14} />
                                </Link>
                            </div>

                            {bookings.length === 0 ? (
                                <div className="vdp-empty">
                                    <p>No bookings yet. Bookings for your vehicles will appear here.</p>
                                </div>
                            ) : (
                                <div className="vdp-table-card">
                                    <div className="vdp-table-wrap">
                                        <table className="vdp-table">
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
                                                {bookings.slice(0, 5).map(b => {
                                                    const sc = STATUS_CFG[b.status] ?? STATUS_CFG.pending;
                                                    return (
                                                        <tr key={b.id}>
                                                            <td className="vdp-td-id">#{b.id}</td>
                                                            <td>
                                                                <div className="vdp-td-name">{b.tourist_name}</div>
                                                                <div className="vdp-td-sub">{b.tourist_email}</div>
                                                            </td>
                                                            <td className="vdp-td-name">{b.vehicle_name}</td>
                                                            <td>
                                                                <div className="vdp-td-name">{formatDate(b.start_date)}</div>
                                                                <div className="vdp-td-sub">to {formatDate(b.end_date)}</div>
                                                            </td>
                                                            <td className="vdp-td-price">
                                                                NPR {Number(b.total_price).toLocaleString()}
                                                            </td>
                                                            <td>
                                                                <span className={`vdp-status ${sc.cls}`}>
                                                                    {sc.label}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </VendorLayout>
    );
};

export default VendorDashboard;
