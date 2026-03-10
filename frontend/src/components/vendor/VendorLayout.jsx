import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Car, Calendar, Plus, Menu, X, LogOut, User } from 'lucide-react';
import authService from '../../services/auth';
import './VendorLayout.css';

const VendorLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [user, setUser] = React.useState(null);

  // Load user profile
  React.useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await authService.getProfile();
      setUser(profileData);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const navItems = [
    { path: '/vendor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/vendor/listings', icon: Car, label: 'My Vehicles' },
    { path: '/vendor/bookings', icon: Calendar, label: 'Bookings' },
    { path: '/vendor/add-vehicle', icon: Plus, label: 'Add Vehicle' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    console.log('Logging out...');
    await authService.logout();
    setSidebarOpen(false);
    navigate('/login');
  };

  const getInitial = () => {
    if (user?.full_name) return user.full_name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'V';
  };

  return (
    <div className="vendor-layout">
      {/* Mobile Header */}
      <div className="vendor-mobile-header">
        <h2>Vendor Dashboard</h2>
        <button
          className="menu-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`vendor-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Vendor Portal</h2>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Profile & Logout Section */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{getInitial()}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {user?.full_name || 'Vendor'}
              </div>
              <div className="sidebar-user-email">
                {user?.email || ''}
              </div>
            </div>
          </div>

          <div className="sidebar-divider" />

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="vendor-main">
        {children}
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default VendorLayout;