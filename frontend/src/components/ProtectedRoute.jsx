import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/auth';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const location = useLocation();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Check if token exists
            if (!authService.isAuthenticated()) {
                setLoading(false);
                return;
            }

            // Fetch profile using token
            const profileData = await authService.getProfile();

            setUser(profileData);
            setProfile(profileData);

        } catch (error) {
            console.error('Auth check failed:', error);
            // Token is invalid or expired — clear it
            authService.clearTokens();
        } finally {
            setLoading(false);
        }
    };

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
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If roles are required, check profile role
    if (allowedRoles.length > 0) {

        if (!profile) {
            return (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh'
                }}>
                    Loading profile...
                </div>
            );
        }

        console.log("PROFILE ROLE:", profile?.role);
        console.log("ALLOWED ROLES:", allowedRoles);

        // Wrong role
        if (!allowedRoles.includes(profile.role)) {
            return <Navigate to="/" replace />;
        }

        // Vendor not approved → force pending page
        if (
            profile.role === 'vendor' &&
            !profile.is_vendor_approved &&
            location.pathname !== '/vendor/pending'
        ) {
            return <Navigate to="/vendor/pending" replace />;
        }

        if (
            profile.role === 'vendor' &&
            profile.is_vendor_approved &&
            location.pathname === '/vendor/pending'
        ) {
            return <Navigate to="/vendor/dashboard" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;