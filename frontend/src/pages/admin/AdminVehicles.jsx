import { useState, useEffect } from 'react';
import {
    Search, CheckCircle, XCircle, Car,
    MapPin, Users, Filter,
} from 'lucide-react';
import ConfirmModal from '../../components/shared/ConfirmModal';
import AdminLayout from '../../components/admin/AdminLayout';
import adminService from '../../services/admin';
import { useAuth } from '../../context/AuthContext';
import './AdminVehicles.css';

const STATUS_TABS = ['all', 'pending', 'approved', 'rejected', 'inactive'];

const AdminVehicles = () => {
    const { user } = useAuth();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [toast, setToast] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [rejectModal, setRejectModal] = useState(null); // { id, name }
    const [rejectReason, setRejectReason] = useState('');
    const [modal, setModal] = useState(null);

    useEffect(() => {
        loadVehicles();
    }, [statusFilter]);

    const loadVehicles = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (search.trim()) params.search = search.trim();
            const data = await adminService.getVehicles(params);
            setVehicles(data);
        } catch {
            showToast('Failed to load vehicles.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(''), 3500);
    };

    const handleApprove = (id) => {
        setModal({
            title: 'Approve Vehicle Listing?',
            message: 'This will approve the listing and make it visible in the marketplace.',
            confirmLabel: 'Approve',
            variant: 'primary',
            icon: <CheckCircle size={21} />,
            onConfirm: async () => {
                setModal(null);
                setActionLoading(id);
                try {
                    const res = await adminService.approveVehicle(id);
                    showToast(res.message);
                    await loadVehicles();
                } catch (err) {
                    showToast(err.message || 'Approval failed.', 'error');
                } finally {
                    setActionLoading(null);
                }
            },
        });
    };

    const handleRejectSubmit = async () => {
        if (!rejectModal) return;
        setActionLoading(rejectModal.id);
        try {
            const res = await adminService.rejectVehicle(rejectModal.id, rejectReason);
            showToast(res.message);
            setRejectModal(null);
            setRejectReason('');
            await loadVehicles();
        } catch (err) {
            showToast(err.message || 'Rejection failed.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const countByStatus = (s) => vehicles.filter(v => v.status === s).length;

    const filteredVehicles = search
        ? vehicles.filter(v =>
            v.vehicle_name.toLowerCase().includes(search.toLowerCase()) ||
            v.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
            v.vehicle_number?.toLowerCase().includes(search.toLowerCase())
        )
        : vehicles;

    const typeLabels = { car: 'Car', suv: 'SUV', hiace: 'Hiace/Van', coaster: 'Coaster', bus: 'Bus' };

    return (
        <AdminLayout user={user}>
            {modal && (
                <ConfirmModal
                    {...modal}
                    onCancel={() => setModal(null)}
                />
            )}
            <div className="adv">
                {/* Toast */}
                {toast && (
                    <div className={`adv-toast adv-toast--${toast.type}`}>
                        {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        <span>{toast.msg}</span>
                    </div>
                )}

                {/* Reject Modal */}
                {rejectModal && (
                    <div className="adv-modal-overlay" onClick={() => setRejectModal(null)}>
                        <div className="adv-modal" onClick={e => e.stopPropagation()}>
                            <h3>Reject Listing</h3>
                            <p>Rejecting <strong>{rejectModal.name}</strong>. Optionally provide a reason:</p>
                            <textarea
                                className="adv-modal-textarea"
                                rows={4}
                                placeholder="Reason for rejection (optional)…"
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                            />
                            <div className="adv-modal-actions">
                                <button className="adv-modal-cancel" onClick={() => setRejectModal(null)}>
                                    Cancel
                                </button>
                                <button
                                    className="adv-modal-confirm"
                                    onClick={handleRejectSubmit}
                                    disabled={actionLoading === rejectModal.id}
                                >
                                    Confirm Rejection
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Heading */}
                <div className="adv-heading">
                    <div>
                        <h1 className="adv-title">Vehicles</h1>
                        <p className="adv-subtitle">
                            {vehicles.length} total · {countByStatus('pending')} pending · {countByStatus('approved')} approved
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="adv-tabs">
                    {STATUS_TABS.map(s => (
                        <button
                            key={s}
                            className={`adv-tab adv-tab--${s} ${statusFilter === (s === 'all' ? '' : s) ? 'active' : ''}`}
                            onClick={() => setStatusFilter(s === 'all' ? '' : s)}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                            <span className="adv-tab-count">
                                {s === 'all' ? vehicles.length : countByStatus(s)}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <form className="adv-search" onSubmit={e => { e.preventDefault(); loadVehicles(); }}>
                    <Search size={17} />
                    <input
                        type="text"
                        placeholder="Search by name, vendor or plate…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <button type="submit">Search</button>
                </form>

                {/* Grid */}
                {loading ? (
                    <div className="adv-loading">
                        <div className="adv-spinner"></div>
                        <p>Loading vehicles…</p>
                    </div>
                ) : filteredVehicles.length === 0 ? (
                    <div className="adv-empty">
                        <Car size={40} />
                        <p>No vehicles found.</p>
                    </div>
                ) : (
                    <div className="adv-grid">
                        {filteredVehicles.map(v => (
                            <VehicleCard
                                key={v.id}
                                v={v}
                                typeLabel={typeLabels[v.vehicle_type] || v.vehicle_type}
                                isLoading={actionLoading === v.id}
                                onApprove={() => handleApprove(v.id)}
                                onReject={() => { setRejectModal({ id: v.id, name: v.vehicle_name }); setRejectReason(''); }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

const VehicleCard = ({ v, typeLabel, isLoading, onApprove, onReject }) => {
    const statusConfig = {
        pending:  { label: 'Pending',  cls: 'adv-vstatus--pending' },
        approved: { label: 'Approved', cls: 'adv-vstatus--approved' },
        rejected: { label: 'Rejected', cls: 'adv-vstatus--rejected' },
        inactive: { label: 'Inactive', cls: 'adv-vstatus--inactive' },
    };

    const sc = statusConfig[v.status] ?? statusConfig.pending;

    return (
        <div className={`adv-card adv-card--${v.status}`}>
            {/* Image */}
            <div className="adv-card-img">
                {v.primary_image ? (
                    <img src={v.primary_image} alt={v.vehicle_name} />
                ) : (
                    <div className="adv-card-img-placeholder">
                        <Car size={36} />
                    </div>
                )}
                <span className={`adv-vstatus ${sc.cls}`}>{sc.label}</span>
                <span className="adv-type-badge">{typeLabel}</span>
            </div>

            {/* Body */}
            <div className="adv-card-body">
                <h3 className="adv-card-name">{v.vehicle_name}</h3>
                <p className="adv-card-plate">{v.vehicle_number}</p>

                <div className="adv-card-meta">
                    <span><Users size={13} /> {v.seating_capacity} seats</span>
                    <span><MapPin size={13} /> {v.available_location}</span>
                    <span>NPR {Number(v.price_per_day).toLocaleString()}/day</span>
                </div>

                <div className="adv-card-vendor">
                    <div className="adv-vendor-avatar">{v.vendor_name?.[0]?.toUpperCase()}</div>
                    <div>
                        <div className="adv-vendor-name">{v.vendor_name}</div>
                        <div className="adv-vendor-email">{v.vendor_email}</div>
                    </div>
                </div>

                {v.admin_notes && (
                    <div className="adv-admin-notes">
                        <strong>Admin note:</strong> {v.admin_notes}
                    </div>
                )}

                {/* Actions */}
                {v.status === 'pending' && (
                    <div className="adv-card-actions">
                        <button
                            className="adv-btn adv-btn--approve"
                            onClick={onApprove}
                            disabled={isLoading}
                        >
                            <CheckCircle size={15} /> Approve
                        </button>
                        <button
                            className="adv-btn adv-btn--reject"
                            onClick={onReject}
                            disabled={isLoading}
                        >
                            <XCircle size={15} /> Reject
                        </button>
                    </div>
                )}
                {v.status === 'approved' && (
                    <div className="adv-card-actions">
                        <button
                            className="adv-btn adv-btn--reject"
                            onClick={onReject}
                            disabled={isLoading}
                        >
                            <XCircle size={15} /> Revoke Approval
                        </button>
                    </div>
                )}
                {v.status === 'rejected' && (
                    <div className="adv-card-actions">
                        <button
                            className="adv-btn adv-btn--approve"
                            onClick={onApprove}
                            disabled={isLoading}
                        >
                            <CheckCircle size={15} /> Approve
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminVehicles;
