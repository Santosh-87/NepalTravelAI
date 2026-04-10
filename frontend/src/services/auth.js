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
            // Handle serializer errors (dict of field errors)
            if (data.error) {
                throw new Error(data.error);
            }
            // Convert field errors dict to readable message
            const errorMessages = Object.entries(data)
                .map(([field, messages]) => {
                    const msg = Array.isArray(messages) ? messages[0] : messages;
                    return `${field}: ${msg}`;
                })
                .join(', ');
            throw new Error(errorMessages || 'Registration failed');
        }

        this.setTokens(data.tokens);
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

        // Only store tokens after login
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

        if (!token) {
            throw new Error('No authentication token');
        }

        const response = await fetch(`${API_URL}/profile/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            // Token might be expired or invalid
            if (response.status === 401) {
                this.clearTokens();
                throw new Error('Session expired');
            }
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

    async updateProfile(profileData) {
        const response = await fetch(`${API_URL}/profile/update/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAccessToken()}`,
            },
            body: JSON.stringify(profileData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(JSON.stringify(data));
        }

        return data;
    }

    async changePassword(current_password, new_password, new_password_confirm) {
        const response = await fetch(`${API_URL}/change-password/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAccessToken()}`,
            },
            body: JSON.stringify({ current_password, new_password, new_password_confirm }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(JSON.stringify(data));
        }

        return data;
    }

    async forgotPassword(email) {
        const response = await fetch(`${API_URL}/forgot-password/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    }

    async resetPassword(token, new_password, new_password_confirm) {
        const response = await fetch(`${API_URL}/reset-password/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, new_password, new_password_confirm }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(JSON.stringify(data));
        }

        return data;
    }

    isAuthenticated() {
        return !!this.getAccessToken();
    }
}

export default new AuthService();