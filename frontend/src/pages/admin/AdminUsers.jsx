import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, UserX, UserCheck, Filter, FileText, MapPin } from 'lucide-react';
import ConfirmModal from '../../components/shared/ConfirmModal';
import AdminLayout from '../../components/admin/AdminLayout';
import adminService from '../../services/admin';
import { useAuth } from '../../context/AuthContext';
import './AdminUsers.css';

const AdminUsers = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [toast, setToast] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [expanded, setExpanded] = useState(null);
    const [modal, setModal] = useState(null);

    useEffect(() => {
        loadUsers();
    }, [roleFilter]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const params = {};
            if (roleFilter) params.role = roleFilter;
            if (search.trim()) params.search = search.trim();
            const data = await adminService.getUsers(params);
            setUsers(data);
        } catch {
            showToast('Failed to load users.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadUsers();
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(''), 3500);
    };

    const doAction = (fn, id, label, variant = 'danger') => {
        setModal({
            title: `${label}?`,
            message: 'This action will update the user account.',
            confirmLabel: label,
            variant,
            icon: variant === 'primary' ? <CheckCircle size={21} /> : <XCircle size={21} />,
            onConfirm: async () => {
                setModal(null);
                setActionLoading(id);
                try {
                    const res = await fn(id);
                    showToast(res.message);
                    await loadUsers();
                } catch (err) {
                    showToast(err.message || `Failed: ${label}`, 'error');
                } finally {
                    setActionLoading(null);
                }
            },
        });
    };

    const filteredUsers = search
        ? users.filter(u =>
            u.full_name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
        )
        : users;

    const countByRole = (r) => users.filter(u => u.role === r).length;

    return (
        <AdminLayout user={user}>
            {modal && (
                <ConfirmModal
                    {...modal}
                    onCancel={() => setModal(null)}
                />
            )}
            <div className="adu">
                {/* Toast */}
                {toast && (
                    <div className={`adu-toast adu-toast--${toast.type}`}>
                        {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        <span>{toast.msg}</span>
                    </div>
                )}

                {/* Heading */}
                <div className="adu-heading">
                    <div>
                        <h1 className="adu-title">Users</h1>
                        <p className="adu-subtitle">
                            {users.length} total · {countByRole('tourist')} tourists · {countByRole('vendor')} vendors
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="adu-toolbar">
                    <form className="adu-search" onSubmit={handleSearch}>
                        <Search size={17} />
                        <input
                            type="text"
                            placeholder="Search by name or email…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <button type="submit">Search</button>
                    </form>

                    <div className="adu-filters">
                        <Filter size={16} />
                        {['', 'tourist', 'vendor'].map(r => (
                            <button
                                key={r}
                                className={`adu-filter-btn ${roleFilter === r ? 'active' : ''}`}
                                onClick={() => { setRoleFilter(r); }}
                            >
                                {r === '' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="adu-table-card">
                    {loading ? (
                        <div className="adu-loading">
                            <div className="adu-spinner"></div>
                            <p>Loading users…</p>
                        </div>
                    ) : (
                        <div className="adu-table-wrap">
                            <table className="adu-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Vendor Status</th>
                                        <th>Account</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(u => (
                                        <UserRow
                                            key={u.id}
                                            u={u}
                                            isLoading={actionLoading === u.id}
                                            expanded={expanded}
                                            setExpanded={setExpanded}
                                            onApprove={() => doAction(adminService.approveVendor.bind(adminService), u.id, 'Approve this vendor')}
                                            onReject={() => doAction(adminService.rejectVendor.bind(adminService), u.id, 'Reject vendor')}
                                            onToggle={() => doAction(adminService.toggleUserActive.bind(adminService), u.id, u.is_active ? 'Deactivate this user' : 'Activate this user')}
                                        />
                                    ))}
                                </tbody>
                            </table>
                            {filteredUsers.length === 0 && (
                                <p className="adu-empty">No users found.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

const UserRow = ({ u, isLoading, expanded, setExpanded, onApprove, onReject, onToggle }) => {
    const formatDate = (d) =>
        new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const isVendor = u.role === 'vendor';
    const isOpen = expanded === u.id;

    const ActionButtons = () => (
        <div className="adu-actions">
            {isVendor && !u.is_vendor_approved && (
                <button
                    className="adu-btn adu-btn--approve"
                    onClick={(e) => { e.stopPropagation(); onApprove(); }}
                    disabled={isLoading}
                    title="Approve vendor"
                >
                    <UserCheck size={15} />
                    Approve
                </button>
            )}
            {isVendor && u.is_vendor_approved && (
                <button
                    className="adu-btn adu-btn--reject"
                    onClick={(e) => { e.stopPropagation(); onReject(); }}
                    disabled={isLoading}
                    title="Reject vendor"
                >
                    <UserX size={15} />
                    Reject
                </button>
            )}
            <button
                className={`adu-btn ${u.is_active ? 'adu-btn--deactivate' : 'adu-btn--activate'}`}
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                disabled={isLoading}
                title={u.is_active ? 'Deactivate account' : 'Activate account'}
            >
                {u.is_active ? <XCircle size={15} /> : <CheckCircle size={15} />}
                {u.is_active ? 'Deactivate' : 'Activate'}
            </button>
        </div>
    );

    return (
        <>
            <tr
                className={`${!u.is_active ? 'adu-row--inactive' : ''} ${isVendor ? 'adu-row' : ''}`}
                onClick={isVendor ? () => setExpanded(isOpen ? null : u.id) : undefined}
            >
                <td>
                    <div className="adu-user-cell">
                        <div className="adu-avatar">{u.full_name[0].toUpperCase()}</div>
                        <div>
                            <div className="adu-cell-name">{u.full_name}</div>
                            <div className="adu-cell-sub">{u.email}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span className={`adu-badge adu-badge--role-${u.role}`}>
                        {u.role}
                    </span>
                </td>
                <td>
                    {isVendor ? (
                        <span className={`adu-badge ${u.is_vendor_approved ? 'adu-badge--approved' : 'adu-badge--pending'}`}>
                            {u.is_vendor_approved ? 'Approved' : 'Pending'}
                        </span>
                    ) : (
                        <span className="adu-cell-sub">—</span>
                    )}
                </td>
                <td>
                    <span className={`adu-badge ${u.is_active ? 'adu-badge--active' : 'adu-badge--inactive'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td className="adu-cell-sub">{formatDate(u.created_at)}</td>
                <td><ActionButtons /></td>
                <td>
                    {isVendor && (
                        <button className={`adu-expand-btn ${isOpen ? 'open' : ''}`}>
                            ›
                        </button>
                    )}
                </td>
            </tr>
            {isVendor && isOpen && (
                <tr className="adu-detail-row">
                    <td colSpan={7}>
                        <VendorDetail u={u} ActionButtons={ActionButtons} />
                    </td>
                </tr>
            )}
        </>
    );
};

const VendorDetail = ({ u, ActionButtons }) => (
    <div className="adu-detail">
        <div className="adu-detail-grid">
            <div className="adu-detail-item">
                <div className="adu-detail-label">
                    <FileText size={14} /> PAN Number
                </div>
                <div className="adu-detail-value">{u.pan_number || '—'}</div>
            </div>
            <div className="adu-detail-item">
                <div className="adu-detail-label">
                    <MapPin size={14} /> Business Address
                </div>
                <div className="adu-detail-value">{u.business_address || '—'}</div>
            </div>
        </div>
        <div className="adu-detail-actions">
            <ActionButtons />
        </div>
    </div>
);

export default AdminUsers;
