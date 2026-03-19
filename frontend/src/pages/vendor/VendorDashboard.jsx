import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Car, CalendarCheck } from 'lucide-react';
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

const VendorDashboard = () => {
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    const handleEdit   = (vehicle) => navigate(`/vendor/edit-vehicle/${vehicle.id}`);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
        try {
            await marketplaceService.deleteVehicle(id);
            setVehicles(prev => prev.filter(v => v.id !== id));
        } catch {
            alert('Failed to delete vehicle.');
        }
    };

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <VendorLayout>
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
