const API_URL = 'http://localhost:8000/api/marketplace';

class MarketplaceService {
  
  getAuthHeader() {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
  
  // Vehicle Listings
  async getMyVehicles() {
    const response = await fetch(`${API_URL}/vehicles/`, {
      headers: this.getAuthHeader(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch vehicles');
    }
    
    return await response.json();
  }
  
  async createVehicle(vehicleData) {
    const response = await fetch(`${API_URL}/vehicles/`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify(vehicleData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create vehicle');
    }
    
    return await response.json();
  }
  
  async updateVehicle(id, vehicleData) {
    const response = await fetch(`${API_URL}/vehicles/${id}/`, {
      method: 'PUT',
      headers: this.getAuthHeader(),
      body: JSON.stringify(vehicleData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update vehicle');
    }
    
    return await response.json();
  }
  
  async deleteVehicle(id) {
    const response = await fetch(`${API_URL}/vehicles/${id}/`, {
      method: 'DELETE',
      headers: this.getAuthHeader(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete vehicle');
    }
  }
  
  // Bookings
  async getMyBookings() {
    const response = await fetch(`${API_URL}/bookings/`, {
      headers: this.getAuthHeader(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }
    
    return await response.json();
  }
  
  async confirmBooking(id) {
    const response = await fetch(`${API_URL}/bookings/${id}/confirm/`, {
      method: 'POST',
      headers: this.getAuthHeader(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to confirm booking');
    }
    
    return await response.json();
  }
  
  async cancelBooking(id) {
    const response = await fetch(`${API_URL}/bookings/${id}/cancel/`, {
      method: 'POST',
      headers: this.getAuthHeader(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to cancel booking');
    }
    
    return await response.json();
  }
}

export default new MarketplaceService();