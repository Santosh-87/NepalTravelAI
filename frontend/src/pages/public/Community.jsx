import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../../components/shared/Navigation';
import Footer from '../../components/shared/Footer';
import RedditTrending from '../../components/tourist/RedditTrending';
import communityService from '../../services/community';
import { useAuth } from '../../context/AuthContext';
import {
    Heart, MessageCircle, MapPin, Clock, Plus, Search, X, Image, Send, Users
} from 'lucide-react';
import './Community.css';

const CATEGORIES = [
    { value: '', label: 'All Posts' },
    { value: 'experience', label: 'Experiences' },
    { value: 'itinerary', label: 'Itineraries' },
    { value: 'tip', label: 'Tips' },
    { value: 'question', label: 'Questions' },
    { value: 'news', label: 'News' },
];

const Community = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadPosts();
    }, [activeCategory]);

    const loadPosts = async () => {
        try {
            setLoading(true);
            const filters = {};
            if (activeCategory) filters.category = activeCategory;
            if (searchQuery) filters.search = searchQuery;
            const data = await communityService.getPosts(filters);
            setPosts(data);
        } catch (err) {
            console.error('Failed to load posts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadPosts();
    };

    const handleLike = async (postId) => {
        if (!user) return;
        try {
            const result = await communityService.toggleLike(postId);
            setPosts(prev => prev.map(p =>
                p.id === postId
                    ? { ...p, likes_count: result.likes_count, is_liked: result.liked }
                    : p
            ));
        } catch (err) {
            console.error('Failed to toggle like:', err);
        }
    };

    const timeAgo = (dateStr) => {
        const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        return new Date(dateStr).toLocaleDateString();
    };

    const getCategoryLabel = (cat) => {
        const found = CATEGORIES.find(c => c.value === cat);
        return found ? found.label : cat;
    };

    const getImgSrc = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `http://localhost:8000${url.startsWith('/') ? url : `/${url}`}`;
    };

    return (
        <div className="community-page">
            <Navigation />

            {/* Hero */}
            <div className="community-hero">
                <div className="community-hero-overlay"></div>
                <div className="community-hero-container">
                    <div className="community-hero-content">
                        <span className="community-hero-badge">
                            <Users size={16} />
                            Traveler Community
                        </span>
                        <h1 className="community-hero-title">Nepal Travel Community</h1>
                        <p className="community-hero-subtitle">
                            Share your experiences, discover itineraries, and connect with fellow travelers
                        </p>
                    </div>
                </div>
            </div>

            {/* Category Tabs + Search */}
            <div className="community-toolbar">
                <div className="community-toolbar-container">
                    <div className="community-tabs">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.value}
                                className={`community-tab ${activeCategory === cat.value ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat.value)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                    <div className="community-actions">
                        <form className="community-search" onSubmit={handleSearch}>
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search posts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </form>
                        {user && (
                            <button className="create-post-btn" onClick={() => setShowCreateModal(true)}>
                                <Plus size={18} />
                                Create Post
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="community-container">
                <div className="community-main">
                    {loading ? (
                        <div className="loading-state">
                            <div className="loader"></div>
                            <p>Loading posts...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="empty-state">
                            <MessageCircle size={48} />
                            <h3>No posts yet</h3>
                            <p>{activeCategory ? 'Try a different category' : 'Be the first to share your Nepal travel experience!'}</p>
                            {user && (
                                <button className="create-post-btn" onClick={() => setShowCreateModal(true)}>
                                    Create First Post
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="posts-grid">
                            {posts.map(post => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    onLike={handleLike}
                                    timeAgo={timeAgo}
                                    getCategoryLabel={getCategoryLabel}
                                    getImgSrc={getImgSrc}
                                    isAuthenticated={!!user}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <aside className="community-sidebar">
                    <RedditTrending />
                    {!user && (
                        <div className="join-card">
                            <h3>Join the Community</h3>
                            <p>Sign in to share your experiences, like posts, and comment.</p>
                            <Link to="/login" className="join-btn">Sign In</Link>
                        </div>
                    )}
                </aside>
            </div>

            {/* Create Post Modal */}
            {showCreateModal && (
                <CreatePostModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => { setShowCreateModal(false); loadPosts(); }}
                />
            )}

            <Footer />
        </div>
    );
};

/* ===== Post Card ===== */
const PostCard = ({ post, onLike, timeAgo, getCategoryLabel, getImgSrc, isAuthenticated }) => {
    return (
        <div className="post-card">
            {post.preview_image && (
                <Link to={`/community/${post.id}`} className="post-image-link">
                    <img src={getImgSrc(post.preview_image)} alt="" className="post-preview-image" />
                </Link>
            )}
            <div className="post-card-content">
                <div className="post-header">
                    <div className="post-author-avatar">
                        {post.author_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="post-meta">
                        <span className="post-author-name">{post.author_name}</span>
                        <span className="post-time">
                            <Clock size={12} />
                            {timeAgo(post.created_at)}
                        </span>
                    </div>
                    <span className="post-category-badge">{getCategoryLabel(post.category)}</span>
                </div>

                <Link to={`/community/${post.id}`} className="post-title-link">
                    <h3 className="post-title">{post.title}</h3>
                </Link>

                <p className="post-content-preview">
                    {post.content?.substring(0, 180)}{post.content?.length > 180 ? '...' : ''}
                </p>

                {post.location_tag && (
                    <div className="post-location">
                        <MapPin size={14} />
                        <span>{post.location_tag}</span>
                    </div>
                )}

                <div className="post-actions">
                    <button
                        className={`post-action-btn like-btn ${post.is_liked ? 'liked' : ''}`}
                        onClick={() => isAuthenticated && onLike(post.id)}
                        disabled={!isAuthenticated}
                    >
                        <Heart size={16} fill={post.is_liked ? '#ef4444' : 'none'} />
                        <span>{post.likes_count}</span>
                    </button>
                    <Link to={`/community/${post.id}`} className="post-action-btn">
                        <MessageCircle size={16} />
                        <span>{post.comments_count}</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

/* ===== Create Post Modal ===== */
const CreatePostModal = ({ onClose, onCreated }) => {
    const [form, setForm] = useState({ title: '', content: '', category: 'experience', location_tag: '' });
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleImageAdd = (e) => {
        const files = Array.from(e.target.files);
        setImages(prev => [...prev, ...files]);
        const newPreviews = files.map(f => URL.createObjectURL(f));
        setPreviews(prev => [...prev, ...newPreviews]);
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.content.trim()) {
            setError('Title and content are required.');
            return;
        }
        try {
            setSubmitting(true);
            setError('');
            await communityService.createPost({ ...form, images });
            onCreated();
        } catch (err) {
            setError(err.message || 'Failed to create post');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="create-post-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create Post</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {error && <div className="modal-error">{error}</div>}

                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            placeholder="Give your post a title..."
                            value={form.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Category</label>
                        <select value={form.category} onChange={(e) => handleChange('category', e.target.value)}>
                            <option value="experience">Travel Experience</option>
                            <option value="itinerary">Itinerary</option>
                            <option value="tip">Travel Tip</option>
                            <option value="question">Question</option>
                            <option value="news">News</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Content</label>
                        <textarea
                            placeholder="Share your story, tips, or questions..."
                            value={form.content}
                            onChange={(e) => handleChange('content', e.target.value)}
                            rows={6}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Location (optional)</label>
                        <div className="input-with-icon">
                            <MapPin size={16} />
                            <input
                                type="text"
                                placeholder="e.g., Everest Base Camp, Pokhara..."
                                value={form.location_tag}
                                onChange={(e) => handleChange('location_tag', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Photos (optional)</label>
                        <div className="image-upload-area">
                            <label className="image-upload-btn">
                                <Image size={18} />
                                Add Photos
                                <input type="file" accept="image/*" multiple onChange={handleImageAdd} hidden />
                            </label>
                            {previews.length > 0 && (
                                <div className="image-previews">
                                    {previews.map((src, i) => (
                                        <div key={i} className="image-preview">
                                            <img src={src} alt="" />
                                            <button type="button" className="remove-image" onClick={() => removeImage(i)}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-submit" disabled={submitting}>
                            {submitting ? 'Posting...' : <><Send size={16} /> Publish Post</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Community;
