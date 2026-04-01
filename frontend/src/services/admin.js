const API_URL = 'http://localhost:8000/api/admin-panel';

class AdminService {
    getAuthHeader() {
        const token = localStorage.getItem('access_token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }

    async _request(path, options = {}) {
        const response = await fetch(`${API_URL}${path}`, {
            headers: this.getAuthHeader(),
            ...options,
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || data.detail || 'Request failed');
        }
        return data;
    }

    // Stats
    getStats() {
        return this._request('/stats/');
    }

    // Analytics (chart data)
    getAnalytics() {
        return this._request('/analytics/');
    }

    // Users
    getUsers(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this._request(`/users/${qs ? '?' + qs : ''}`);
    }

    approveVendor(id) {
        return this._request(`/users/${id}/approve/`, { method: 'POST' });
    }

    rejectVendor(id) {
        return this._request(`/users/${id}/reject/`, { method: 'POST' });
    }

    toggleUserActive(id) {
        return this._request(`/users/${id}/toggle-active/`, { method: 'POST' });
    }

    // Vehicles
    getVehicles(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this._request(`/vehicles/${qs ? '?' + qs : ''}`);
    }

    approveVehicle(id) {
        return this._request(`/vehicles/${id}/approve/`, { method: 'POST' });
    }

    rejectVehicle(id, reason = '') {
        return this._request(`/vehicles/${id}/reject/`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    }

    // Bookings
    getBookings(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this._request(`/bookings/${qs ? '?' + qs : ''}`);
    }

    // Community Posts
    getCommunityPosts(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this._request(`/community-posts/${qs ? '?' + qs : ''}`);
    }

    deactivatePost(id) {
        return this._request(`/community-posts/${id}/deactivate/`, { method: 'POST' });
    }

    activatePost(id) {
        return this._request(`/community-posts/${id}/activate/`, { method: 'POST' });
    }
}

export default new AdminService();
