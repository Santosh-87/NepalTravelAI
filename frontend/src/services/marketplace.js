const API_URL = 'http://localhost:8000/api/marketplace';

class MarketplaceService {

  getAuthHeader() {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  getAuthHeaderMultipart() {
    const token = localStorage.getItem('access_token');
    // No Content-Type — browser sets multipart boundary automatically
    return { 'Authorization': `Bearer ${token}` };
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
    const formData = new FormData();
    Object.entries(vehicleData).forEach(([key, value]) => {
      if (key === 'features_list') {
        formData.append('features', value.join(', '));
      } else if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });

    const response = await fetch(`${API_URL}/vehicles/`, {
      method: 'POST',
      headers: this.getAuthHeaderMultipart(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create vehicle');
    }

    return await response.json();
  }

  async updateVehicle(id, vehicleData) {
    const formData = new FormData();
    Object.entries(vehicleData).forEach(([key, value]) => {
      if (key === 'features_list') {
        formData.append('features', value.join(', '));
      } else if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });

    const response = await fetch(`${API_URL}/vehicles/${id}/`, {
      method: 'PATCH',
      headers: this.getAuthHeaderMultipart(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update vehicle');
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

  // Vendor - Reject booking
  async rejectBooking(id, reason = '') {
    const response = await fetch(`${API_URL}/bookings/${id}/reject/`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to reject booking');
    }

    return await response.json();
  }

  // Vendor - Complete booking
  async completeBooking(id) {
    const response = await fetch(`${API_URL}/bookings/${id}/complete/`, {
      method: 'POST',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to complete booking');
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

  async getPublicVehicles(filters = {}) {
    const params = new URLSearchParams();

    if (filters.vehicle_type) params.append('vehicle_type', filters.vehicle_type);
    if (filters.min_price) params.append('min_price', filters.min_price);
    if (filters.max_price) params.append('max_price', filters.max_price);
    if (filters.location) params.append('location', filters.location);
    if (filters.min_capacity) params.append('min_capacity', filters.min_capacity);

    const queryString = params.toString();
    const url = `${API_URL}/vehicles/public/${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch vehicles');
    }

    return await response.json();
  }

  // --- Price Negotiation ---

  async vendorRespondToOffer(bookingId, { action, counter_price, reason }) {
    const body = { action };
    if (counter_price) body.counter_price = counter_price;
    if (reason) body.reason = reason;

    const response = await fetch(`${API_URL}/bookings/${bookingId}/vendor-respond/`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to respond to offer');
    }
    return await response.json();
  }

  async customerRespondToCounter(bookingId, { action }) {
    const response = await fetch(`${API_URL}/bookings/${bookingId}/customer-respond/`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ action }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to respond to counter');
    }
    return await response.json();
  }

  // --- Ratings ---

  async rateBooking(bookingId, ratingData) {
    const response = await fetch(`${API_URL}/bookings/${bookingId}/rate/`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify(ratingData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit rating');
    }
    return await response.json();
  }

  async getVehicleRatings(vehicleId) {
    const response = await fetch(`${API_URL}/vehicles/${vehicleId}/ratings/`);
    if (!response.ok) throw new Error('Failed to fetch ratings');
    return await response.json();
  }

  // Get single vehicle details (public)
  async getVehicleDetails(id) {
    const response = await fetch(`${API_URL}/vehicles/${id}/`);

    if (!response.ok) {
      throw new Error('Failed to fetch vehicle details');
    }

    return await response.json();
  }

  // --- Stripe Payments ---

  async createPaymentIntent(bookingId) {
    const response = await fetch(`${API_URL}/payments/create-intent/`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ booking_id: bookingId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create payment intent');
    }
    return await response.json();
  }

  async confirmPayment(bookingId, paymentIntentId) {
    const response = await fetch(`${API_URL}/payments/confirm/`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({
        booking_id: bookingId,
        payment_intent_id: paymentIntentId,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to confirm payment');
    }
    return await response.json();
  }

  // Create booking (authenticated)

  async createBooking(bookingData) {
    console.log('=== CREATING BOOKING ===');
    console.log('Data being sent:', JSON.stringify(bookingData, null, 2));

    const headers = this.getAuthHeader();
    console.log('Headers:', headers);

    const response = await fetch(`${API_URL}/bookings/`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(bookingData),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    // Get the actual response text
    const responseText = await response.text();
    console.log('Response body (raw):', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = responseText;
      }

      console.error('Booking error response:', errorData);

      // Extract error message
      let errorMessage = 'Failed to create booking';

      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (typeof errorData === 'object') {
        // Handle validation errors
        const errors = Object.entries(errorData)
          .map(([field, messages]) => {
            const msg = Array.isArray(messages) ? messages[0] : messages;
            return `${field}: ${msg}`;
          })
          .join(', ');
        errorMessage = errors || errorMessage;
      }

      console.error('Final error message:', errorMessage);
      throw new Error(errorMessage);
    }

    return JSON.parse(responseText);
  }
}
export default new MarketplaceService();