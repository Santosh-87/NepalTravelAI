import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Car, CalendarCheck, MessageSquare,
    UserCircle, LogOut, Menu, X, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LogoutModal from '../shared/LogoutModal';
import logoSvg from '../../assets/logo.svg';
import './AdminLayout.css';

const NAV_ITEMS = [
    { to: '/admin/dashboard', label: 'Dashboard',  Icon: LayoutDashboard },
    { to: '/admin/users',     label: 'Users',       Icon: Users },
    { to: '/admin/vehicles',  label: 'Vehicles',    Icon: Car },
    { to: '/admin/bookings',  label: 'Bookings',    Icon: CalendarCheck },
    { to: '/admin/community', label: 'Community',   Icon: MessageSquare },
    { to: '/profile',         label: 'My Profile',  Icon: UserCircle },
];

const AdminLayout = ({ children, user }) => {
    const [sidebarOpen,  setSidebarOpen]  = useState(false);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const navigate = useNavigate();
    const { signOut } = useAuth();

    const handleLogout = () => setConfirmLogout(true);

    const doLogout = async () => {
        setConfirmLogout(false);
        await signOut();
        navigate('/login', { replace: true });
    };

    return (
        <div className="admin-layout">
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
                    className="admin-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                {/* Logo */}
                <div className="admin-sidebar-logo">
                    <img src={logoSvg} alt="NepalTravelAI" className="admin-logo-icon" />
                    <div className="admin-logo-text">
                        <span className="admin-logo-name">Nepal Travel AI</span>
                        <span className="admin-logo-badge">Admin Panel</span>
                    </div>
                    <button
                        className="admin-sidebar-close"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close sidebar"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="admin-nav">
                    {NAV_ITEMS.map(({ to, label, Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `admin-nav-link ${isActive ? 'active' : ''}`
                            }
                            onClick={() => setSidebarOpen(false)}
                        >
                            <Icon size={19} />
                            <span>{label}</span>
                            <ChevronRight size={14} className="admin-nav-arrow" />
                        </NavLink>
                    ))}
                </nav>

                {/* User info + logout */}
                <div className="admin-sidebar-footer">
                    <div className="admin-user-info">
                        <div className="admin-user-avatar">
                            {user?.full_name?.[0]?.toUpperCase() ?? 'A'}
                        </div>
                        <div className="admin-user-details">
                            <span className="admin-user-name">{user?.full_name ?? 'Admin'}</span>
                            <span className="admin-user-role">Administrator</span>
                        </div>
                    </div>
                    <button className="admin-logout-btn" onClick={handleLogout}>
                        <LogOut size={17} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="admin-main">
                {/* Top bar */}
                <header className="admin-topbar">
                    <button
                        className="admin-menu-btn"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu size={22} />
                    </button>
                    <div className="admin-topbar-right">
                        <span className="admin-topbar-name">{user?.full_name ?? 'Admin'}</span>
                        <div className="admin-topbar-avatar">
                            {user?.full_name?.[0]?.toUpperCase() ?? 'A'}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="admin-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
