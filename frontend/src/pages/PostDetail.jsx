import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import communityService from '../services/community';
import { useAuth } from '../context/AuthContext';
import {
    Heart, MessageCircle, MapPin, Clock, ArrowLeft, Send, Reply, Trash2
} from 'lucide-react';
import './PostDetail.css';

const PostDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadPost();
    }, [id]);

    const loadPost = async () => {
        try {
            setLoading(true);
            const data = await communityService.getPostDetail(id);
            setPost(data);
        } catch (err) {
            console.error('Failed to load post:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!user) return;
        try {
            const result = await communityService.toggleLike(id);
            setPost(prev => ({ ...prev, likes_count: result.likes_count, is_liked: result.liked }));
        } catch (err) {
            console.error('Failed to toggle like:', err);
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !user) return;
        try {
            setSubmitting(true);
            await communityService.createComment(id, { content: commentText });
            setCommentText('');
            loadPost();
        } catch (err) {
            console.error('Failed to add comment:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async (e, parentId) => {
        e.preventDefault();
        if (!replyText.trim() || !user) return;
        try {
            setSubmitting(true);
            await communityService.createComment(id, { content: replyText, parent: parentId });
            setReplyText('');
            setReplyTo(null);
            loadPost();
        } catch (err) {
            console.error('Failed to add reply:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await communityService.deleteComment(id, commentId);
            loadPost();
        } catch (err) {
            console.error('Failed to delete comment:', err);
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

    const getImgSrc = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `http://localhost:8000${url.startsWith('/') ? url : `/${url}`}`;
    };

    const getCategoryLabel = (cat) => {
        const labels = { experience: 'Travel Experience', itinerary: 'Itinerary', tip: 'Travel Tip', question: 'Question', news: 'News' };
        return labels[cat] || cat;
    };

    if (loading) {
        return (
            <div className="post-detail-page">
                <Navigation />
                <div className="pd-loading"><div className="loader"></div><p>Loading post...</p></div>
                <Footer />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="post-detail-page">
                <Navigation />
                <div className="pd-empty">
                    <h3>Post not found</h3>
                    <Link to="/community" className="btn btn-primary">Back to Community</Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="post-detail-page">
            <Navigation />

            <div className="pd-container">
                <Link to="/community" className="pd-back"><ArrowLeft size={18} /> Back to Community</Link>

                {/* Post Content */}
                <article className="pd-article">
                    {/* Header */}
                    <div className="pd-header">
                        <div className="pd-author-row">
                            <div className="pd-avatar">{post.author_name?.charAt(0)?.toUpperCase()}</div>
                            <div className="pd-author-info">
                                <span className="pd-author-name">{post.author_name}</span>
                                <span className="pd-date"><Clock size={12} /> {timeAgo(post.created_at)}</span>
                            </div>
                            <span className="pd-category-badge">{getCategoryLabel(post.category)}</span>
                        </div>
                        <h1 className="pd-title">{post.title}</h1>
                        {post.location_tag && (
                            <div className="pd-location"><MapPin size={14} /> {post.location_tag}</div>
                        )}
                    </div>

                    {/* Images */}
                    {post.images && post.images.length > 0 && (
                        <div className="pd-images">
                            {post.images.map((img, i) => (
                                <img key={i} src={getImgSrc(img.image)} alt="" className="pd-image" />
                            ))}
                        </div>
                    )}

                    {/* Body */}
                    <div className="pd-body">
                        {post.content.split('\n').map((line, i) => (
                            line.trim() ? <p key={i}>{line}</p> : <br key={i} />
                        ))}
                    </div>

                    {/* Like Button */}
                    <div className="pd-actions-bar">
                        <button
                            className={`pd-like-btn ${post.is_liked ? 'liked' : ''}`}
                            onClick={handleLike}
                            disabled={!user}
                        >
                            <Heart size={18} fill={post.is_liked ? '#ef4444' : 'none'} />
                            <span>{post.likes_count} {post.likes_count === 1 ? 'Like' : 'Likes'}</span>
                        </button>
                        <div className="pd-comments-count">
                            <MessageCircle size={18} />
                            <span>{post.comments_count} {post.comments_count === 1 ? 'Comment' : 'Comments'}</span>
                        </div>
                    </div>
                </article>

                {/* Comments Section */}
                <section className="pd-comments-section">
                    <h2 className="pd-comments-title">Comments</h2>

                    {/* Comment Input */}
                    {user ? (
                        <form className="pd-comment-form" onSubmit={handleComment}>
                            <div className="pd-comment-avatar">{user.full_name?.charAt(0)?.toUpperCase()}</div>
                            <div className="pd-comment-input-wrap">
                                <textarea
                                    placeholder="Write a comment..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    rows={2}
                                />
                                <button type="submit" disabled={submitting || !commentText.trim()}>
                                    <Send size={16} />
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="pd-login-prompt">
                            <Link to="/login">Sign in</Link> to leave a comment
                        </div>
                    )}

                    {/* Comments List */}
                    <div className="pd-comments-list">
                        {post.comments && post.comments.length > 0 ? (
                            post.comments.map(comment => (
                                <div key={comment.id} className="pd-comment">
                                    <div className="pd-comment-main">
                                        <div className="pd-comment-header">
                                            <div className="pd-comment-user-avatar">
                                                {comment.author_name?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div className="pd-comment-meta">
                                                <span className="pd-comment-author">{comment.author_name}</span>
                                                <span className="pd-comment-time">{timeAgo(comment.created_at)}</span>
                                            </div>
                                            <div className="pd-comment-actions">
                                                {user && (
                                                    <button className="pd-reply-trigger" onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}>
                                                        <Reply size={14} /> Reply
                                                    </button>
                                                )}
                                                {user && user.id === comment.author && (
                                                    <button className="pd-delete-btn" onClick={() => handleDeleteComment(comment.id)}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="pd-comment-text">{comment.content}</p>

                                        {/* Reply Form */}
                                        {replyTo === comment.id && (
                                            <form className="pd-reply-form" onSubmit={(e) => handleReply(e, comment.id)}>
                                                <textarea
                                                    placeholder="Write a reply..."
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    rows={2}
                                                    autoFocus
                                                />
                                                <div className="pd-reply-actions">
                                                    <button type="button" onClick={() => { setReplyTo(null); setReplyText(''); }}>Cancel</button>
                                                    <button type="submit" className="pd-reply-submit" disabled={submitting || !replyText.trim()}>
                                                        <Send size={14} /> Reply
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>

                                    {/* Nested Replies */}
                                    {comment.replies && comment.replies.length > 0 && (
                                        <div className="pd-replies">
                                            {comment.replies.map(reply => (
                                                <div key={reply.id} className="pd-reply">
                                                    <div className="pd-comment-header">
                                                        <div className="pd-comment-user-avatar small">
                                                            {reply.author_name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <div className="pd-comment-meta">
                                                            <span className="pd-comment-author">{reply.author_name}</span>
                                                            <span className="pd-comment-time">{timeAgo(reply.created_at)}</span>
                                                        </div>
                                                    </div>
                                                    <p className="pd-comment-text">{reply.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="pd-no-comments">No comments yet. Be the first to share your thoughts!</p>
                        )}
                    </div>
                </section>
            </div>

            <Footer />
        </div>
    );
};

export default PostDetail;
