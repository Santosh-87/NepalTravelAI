import React, { useState, useEffect } from 'react';
import { Search, Eye, EyeOff, Filter } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import adminService from '../../services/admin';
import { useAuth } from '../../context/AuthContext';
import './AdminCommunity.css';

const AdminCommunity = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [toast, setToast] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [expanded, setExpanded] = useState(null);

    useEffect(() => {
        loadPosts();
    }, [categoryFilter]);

    const loadPosts = async () => {
        try {
            setLoading(true);
            const params = {};
            if (categoryFilter) params.category = categoryFilter;
            if (search.trim()) params.search = search.trim();
            const data = await adminService.getCommunityPosts(params);
            setPosts(data);
        } catch {
            showToast('Failed to load posts.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadPosts();
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(''), 3500);
    };

    const togglePostActive = async (post) => {
        const action = post.is_active ? 'deactivate' : 'activate';
        setActionLoading(post.id);
        try {
            const fn = post.is_active ? adminService.deactivatePost.bind(adminService) : adminService.activatePost.bind(adminService);
            const res = await fn(post.id);
            showToast(res.message);
            loadPosts();
        } catch (err) {
            showToast(err.message || 'Action failed', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const getCategoryLabel = (cat) => {
        const labels = { experience: 'Experience', itinerary: 'Itinerary', tip: 'Tip', question: 'Question', news: 'News' };
        return labels[cat] || cat;
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <AdminLayout user={user}>
            <div className="admin-community">
                {toast && (
                    <div className={`ac-toast ${toast.type === 'error' ? 'ac-toast-error' : 'ac-toast-success'}`}>
                        {toast.msg}
                    </div>
                )}

                <div className="ac-header">
                    <h1>Community Posts</h1>
                    <p className="ac-subtitle">{posts.length} total posts</p>
                </div>

                <div className="ac-toolbar">
                    <form className="ac-search" onSubmit={handleSearch}>
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search by title or author..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>

                    <div className="ac-filters">
                        <Filter size={16} />
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                            <option value="">All Categories</option>
                            <option value="experience">Experience</option>
                            <option value="itinerary">Itinerary</option>
                            <option value="tip">Tip</option>
                            <option value="question">Question</option>
                            <option value="news">News</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="ac-loading">
                        <div className="loader"></div>
                        <p>Loading posts...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="ac-empty">
                        <p>No community posts found.</p>
                    </div>
                ) : (
                    <div className="ac-table-wrap">
                        <table className="ac-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Author</th>
                                    <th>Category</th>
                                    <th>Likes</th>
                                    <th>Comments</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.map(post => {
                                    const isOpen = expanded === post.id;
                                    return (
                                        <React.Fragment key={post.id}>
                                            <tr
                                                className={`ac-row ${!post.is_active ? 'ac-row-inactive' : ''}`}
                                                onClick={() => setExpanded(isOpen ? null : post.id)}
                                            >
                                                <td className="ac-title-cell">
                                                    {post.title.length > 50 ? post.title.substring(0, 50) + '...' : post.title}
                                                </td>
                                                <td>
                                                    <div className="ac-author">{post.author_name}</div>
                                                    <div className="ac-email">{post.author_email}</div>
                                                </td>
                                                <td>
                                                    <span className="ac-category-badge">{getCategoryLabel(post.category)}</span>
                                                </td>
                                                <td>{post.likes_count}</td>
                                                <td>{post.comments_count}</td>
                                                <td>
                                                    <span className={`ac-status ${post.is_active ? 'ac-active' : 'ac-inactive'}`}>
                                                        {post.is_active ? 'Active' : 'Hidden'}
                                                    </span>
                                                </td>
                                                <td>{formatDate(post.created_at)}</td>
                                                <td>
                                                    <button
                                                        className={`ac-action-btn ${post.is_active ? 'ac-hide-btn' : 'ac-show-btn'}`}
                                                        onClick={(e) => { e.stopPropagation(); togglePostActive(post); }}
                                                        disabled={actionLoading === post.id}
                                                    >
                                                        {post.is_active ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> Show</>}
                                                    </button>
                                                </td>
                                                <td>
                                                    <button className={`ac-expand-btn ${isOpen ? 'open' : ''}`}>
                                                        ›
                                                    </button>
                                                </td>
                                            </tr>
                                            {isOpen && (
                                                <tr className="ac-detail-row">
                                                    <td colSpan={9}>
                                                        <div className="ac-detail">
                                                            <div className="ac-detail-heading">Post Content</div>
                                                            <div className="ac-post-content">
                                                                {post.content || 'No content available.'}
                                                            </div>
                                                            <div className="ac-detail-actions">
                                                                <button
                                                                    className={`ac-action-btn ${post.is_active ? 'ac-hide-btn' : 'ac-show-btn'}`}
                                                                    onClick={(e) => { e.stopPropagation(); togglePostActive(post); }}
                                                                    disabled={actionLoading === post.id}
                                                                >
                                                                    {post.is_active ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> Show</>}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminCommunity;
