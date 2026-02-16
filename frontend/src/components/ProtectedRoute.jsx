import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../config/supabase';

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
            // Get current session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) throw sessionError;

            if (!session) {
                setLoading(false);
                return;
            }

            setUser(session.user);

            // Get user profile with role
            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (profileError) {
                console.error('Error loading profile:', profileError);
                setLoading(false);
                return;
            }

            setProfile(profileData);

        } catch (error) {
            console.error('Auth check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                fontSize: '1.125rem',
                color: '#4a4a4a'
            }}>
                Loading...
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role-based access
    if (allowedRoles.length > 0 && profile) {
        if (!allowedRoles.includes(profile.role)) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <h2 style={{ fontSize: '2rem', color: '#1a4d6f', marginBottom: '1rem' }}>
                        Access Denied
                    </h2>
                    <p style={{ fontSize: '1.125rem', color: '#4a4a4a', marginBottom: '2rem' }}>
                        You don't have permission to access this page.
                    </p>
                    <a
                        href="/"
                        style={{
                            padding: '1rem 2rem',
                            background: '#1a4d6f',
                            color: 'white',
                            textDecoration: 'none',
                            fontWeight: '600',
                            borderRadius: '4px'
                        }}
                    >
                        Go to Homepage
                    </a>
                </div>
            );
        }
    }

    return children;
};

export default ProtectedRoute;