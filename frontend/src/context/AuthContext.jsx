import React, { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/auth';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initAuth();
    }, []);

    const initAuth = async () => {
        try {
            // If no token exists, skip profile fetch
            if (!authService.isAuthenticated()) {
                setLoading(false);
                return;
            }

            await loadUserProfile();

        } catch (error) {
            console.error('Auth init failed:', error);
            authService.clearTokens();
            setLoading(false);
        }
    };

    const loadUserProfile = async () => {
        try {
            const profileData = await authService.getProfile();
            setUser(profileData);
            setProfile(profileData);
        } catch (error) {
            console.error('Error loading profile:', error);
            // Token likely expired or invalid — clear session
            authService.clearTokens();
            setUser(null);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await authService.logout();
        setUser(null);
        setProfile(null);
    };

    const value = {
        user,
        profile,
        loading,
        signOut,
        // A method to refresh profile data (e.g. after role approval) without reloading the page
        refreshProfile: loadUserProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};