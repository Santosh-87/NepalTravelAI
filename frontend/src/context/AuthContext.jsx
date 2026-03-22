import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
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

    const loadUserProfile = useCallback(async () => {
        // Check if token exists first
        if (!authService.isAuthenticated()) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const profileData = await authService.getProfile();
            setUser(profileData);
            setProfile(profileData);
        } catch (error) {
            console.log('Profile load error (expected if not logged in):', error.message);
            // Token might be expired or invalid, clear it
            authService.clearTokens();
            setUser(null);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const initAuth = useCallback(async () => {
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
    }, [loadUserProfile]);

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    const signIn = async (email, password) => {
        const loggedInUser = await authService.login(email, password);
        setUser(loggedInUser);
        setProfile(loggedInUser);
        return loggedInUser;
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
        isAuthenticated: !!user,
        signIn,
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