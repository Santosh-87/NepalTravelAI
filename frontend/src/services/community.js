const API_URL = 'http://localhost:8000/api/community';

class CommunityService {

  getAuthHeader() {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  getAuthHeaderMultipart() {
    const token = localStorage.getItem('access_token');
    return { 'Authorization': `Bearer ${token}` };
  }

  // Posts
  async getPosts(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    const qs = params.toString();
    const url = `${API_URL}/posts/${qs ? '?' + qs : ''}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch posts');
    return await response.json();
  }

  async getPostDetail(id) {
    const token = localStorage.getItem('access_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await fetch(`${API_URL}/posts/${id}/`, { headers });
    if (!response.ok) throw new Error('Failed to fetch post');
    return await response.json();
  }

  async createPost(postData) {
    const formData = new FormData();
    formData.append('title', postData.title);
    formData.append('content', postData.content);
    formData.append('category', postData.category);
    if (postData.location_tag) formData.append('location_tag', postData.location_tag);
    if (postData.images) {
      postData.images.forEach(img => formData.append('images', img));
    }

    const response = await fetch(`${API_URL}/posts/`, {
      method: 'POST',
      headers: this.getAuthHeaderMultipart(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to create post');
    }
    return await response.json();
  }

  async deletePost(id) {
    const response = await fetch(`${API_URL}/posts/${id}/`, {
      method: 'DELETE',
      headers: this.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to delete post');
  }

  async toggleLike(postId) {
    const response = await fetch(`${API_URL}/posts/${postId}/toggle_like/`, {
      method: 'POST',
      headers: this.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to toggle like');
    return await response.json();
  }

  // Comments
  async getComments(postId) {
    const response = await fetch(`${API_URL}/posts/${postId}/comments/`);
    if (!response.ok) throw new Error('Failed to fetch comments');
    return await response.json();
  }

  async createComment(postId, data) {
    const response = await fetch(`${API_URL}/posts/${postId}/comments/`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create comment');
    return await response.json();
  }

  async deleteComment(postId, commentId) {
    const response = await fetch(`${API_URL}/posts/${postId}/comments/${commentId}/`, {
      method: 'DELETE',
      headers: this.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to delete comment');
  }
}

export default new CommunityService();
