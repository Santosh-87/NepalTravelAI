import { Navigate, useLocation } from 'react-router-dom';
import authService from '../../services/auth';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Still loading auth
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh'
            }}>
                Loading...
            </div>
        );
    }

    // Not logged in
    if (!authService.isAuthenticated() || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If roles are required, check profile role
    if (allowedRoles.length > 0) {

        console.log("PROFILE ROLE:", user?.role);
        console.log("ALLOWED ROLES:", allowedRoles);

        // Wrong role
        if (!allowedRoles.includes(user.role)) {
            return <Navigate to="/" replace />;
        }

        // Vendor not approved → force pending page
        if (
            user.role === 'vendor' &&
            !user.is_vendor_approved &&
            location.pathname !== '/vendor/pending'
        ) {
            return <Navigate to="/vendor/pending" replace />;
        }

        if (
            user.role === 'vendor' &&
            user.is_vendor_approved &&
            location.pathname === '/vendor/pending'
        ) {
            return <Navigate to="/vendor/dashboard" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;