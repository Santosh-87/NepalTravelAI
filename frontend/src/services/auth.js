/**
 * Authentication Service
 * Handles all auth-related API calls
 */

const API_URL = 'http://localhost:8000/api/auth';

class AuthService {

    async register(userData) {
        const response = await fetch(`${API_URL}/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }
        
        return data.user;
    }

    async login(email, password) {
        const response = await fetch(`${API_URL}/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // ✅ Only store tokens after login
        this.setTokens(data.tokens);

        return data.user;
    }

    async logout() {
        const refreshToken = this.getRefreshToken();

        if (refreshToken) {
            try {
                await fetch(`${API_URL}/logout/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getAccessToken()}`,
                    },
                    body: JSON.stringify({ refresh: refreshToken }),
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }

        // Clear tokens
        this.clearTokens();
    }

    async getProfile() {
        const token = this.getAccessToken();

        // ✅ Guard: don't even attempt if not logged in
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${API_URL}/profile/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }

        return await response.json();
    }

    // Token management
    setTokens(tokens) {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
    }

    getAccessToken() {
        return localStorage.getItem('access_token');
    }

    getRefreshToken() {
        return localStorage.getItem('refresh_token');
    }

    clearTokens() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }

    isAuthenticated() {
        return !!this.getAccessToken();
    }
}

export default new AuthService();