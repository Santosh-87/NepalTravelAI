import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Car, Calendar, Plus,
    UserCircle, LogOut, Menu, X, ChevronRight,
} from 'lucide-react';
import authService from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import LogoutModal from '../shared/LogoutModal';
import logoSvg from '../../assets/logo.svg';
import './VendorLayout.css';

const NAV_ITEMS = [
    { to: '/vendor/dashboard',   label: 'Dashboard',   Icon: LayoutDashboard },
    { to: '/vendor/listings',    label: 'My Vehicles', Icon: Car },
    { to: '/vendor/bookings',    label: 'Bookings',    Icon: Calendar },
    { to: '/vendor/add-vehicle', label: 'Add Vehicle', Icon: Plus },
    { to: '/profile',            label: 'My Profile',  Icon: UserCircle },
];

const VendorLayout = ({ children }) => {
    const [sidebarOpen,   setSidebarOpen]   = useState(false);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const { signOut } = useAuth();

    useEffect(() => {
        authService.getProfile()
            .then(setUser)
            .catch(() => {});
    }, []);

    const handleLogout = () => setConfirmLogout(true);

    const doLogout = async () => {
        setConfirmLogout(false);
        await signOut();
        navigate('/login', { replace: true });
    };

    return (
        <div className="vendor-layout">
            {/* Logout confirmation */}
            {confirmLogout && (
                <LogoutModal
                    onConfirm={doLogout}
                    onCancel={() => setConfirmLogout(false)}
                />
            )}

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="vendor-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`vendor-sidebar ${sidebarOpen ? 'open' : ''}`}>
                {/* Logo */}
                <div className="vendor-sidebar-logo">
                    <img src={logoSvg} alt="NepalTravelAI" className="vendor-logo-icon" />
                    <div className="vendor-logo-text">
                        <span className="vendor-logo-name">Nepal Travel AI</span>
                        <span className="vendor-logo-badge">Vendor Portal</span>
                    </div>
                    <button
                        className="vendor-sidebar-close"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close sidebar"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="vendor-nav">
                    {NAV_ITEMS.map(({ to, label, Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `vendor-nav-link ${isActive ? 'active' : ''}`
                            }
                            onClick={() => setSidebarOpen(false)}
                        >
                            <Icon size={19} />
                            <span>{label}</span>
                            <ChevronRight size={14} className="vendor-nav-arrow" />
                        </NavLink>
                    ))}
                </nav>

                {/* User info + logout */}
                <div className="vendor-sidebar-footer">
                    <div className="vendor-user-info">
                        <div className="vendor-user-avatar">
                            {user?.full_name?.[0]?.toUpperCase() ?? 'V'}
                        </div>
                        <div className="vendor-user-details">
                            <span className="vendor-user-name">{user?.full_name ?? 'Vendor'}</span>
                            <span className="vendor-user-role">Vendor</span>
                        </div>
                    </div>
                    <button className="vendor-logout-btn" onClick={handleLogout}>
                        <LogOut size={17} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="vendor-main">
                {/* Top bar */}
                <header className="vendor-topbar">
                    <button
                        className="vendor-menu-btn"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu size={22} />
                    </button>
                    <div className="vendor-topbar-right">
                        <span className="vendor-topbar-name">{user?.full_name ?? 'Vendor'}</span>
                        <div className="vendor-topbar-avatar">
                            {user?.full_name?.[0]?.toUpperCase() ?? 'V'}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="vendor-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default VendorLayout;
