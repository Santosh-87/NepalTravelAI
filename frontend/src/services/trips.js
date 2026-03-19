const API_URL = 'http://localhost:8000/api/trips';

class TripsService {

  async getTemplates(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.min_days) params.append('min_days', filters.min_days);
    if (filters.max_days) params.append('max_days', filters.max_days);
    const qs = params.toString();
    const url = `${API_URL}/templates/${qs ? '?' + qs : ''}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch trip templates');
    return await response.json();
  }

  async getTemplateDetail(slug) {
    const response = await fetch(`${API_URL}/templates/${slug}/`);
    if (!response.ok) throw new Error('Failed to fetch trip details');
    return await response.json();
  }
}

export default new TripsService();
