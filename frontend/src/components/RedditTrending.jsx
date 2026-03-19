import React, { useState, useEffect } from 'react';
import { TrendingUp, ExternalLink, MessageCircle, ArrowUp } from 'lucide-react';

const RedditTrending = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetchRedditPosts();
    }, []);

    const fetchRedditPosts = async () => {
        try {
            const response = await fetch('https://www.reddit.com/r/nepal/hot.json?limit=6', {
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error('Reddit fetch failed');
            const data = await response.json();
            const filtered = data.data.children
                .filter(c => !c.data.stickied)
                .slice(0, 5)
                .map(c => ({
                    id: c.data.id,
                    title: c.data.title,
                    score: c.data.score,
                    num_comments: c.data.num_comments,
                    permalink: `https://www.reddit.com${c.data.permalink}`,
                    subreddit: c.data.subreddit_name_prefixed,
                }));
            setPosts(filtered);
        } catch (err) {
            console.error('Reddit fetch error:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    if (error || (!loading && posts.length === 0)) return null;

    return (
        <div style={styles.card}>
            <div style={styles.header}>
                <TrendingUp size={16} style={{ color: '#d4a574' }} />
                <h3 style={styles.title}>Trending on r/nepal</h3>
            </div>

            {loading ? (
                <div style={styles.loadingText}>Loading...</div>
            ) : (
                <div style={styles.list}>
                    {posts.map((post, i) => (
                        <a
                            key={post.id}
                            href={post.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.item}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <span style={styles.rank}>{i + 1}</span>
                            <div style={styles.itemContent}>
                                <p style={styles.itemTitle}>{post.title.length > 80 ? post.title.substring(0, 80) + '...' : post.title}</p>
                                <div style={styles.itemMeta}>
                                    <span style={styles.metaItem}>
                                        <ArrowUp size={12} /> {post.score}
                                    </span>
                                    <span style={styles.metaItem}>
                                        <MessageCircle size={12} /> {post.num_comments}
                                    </span>
                                </div>
                            </div>
                            <ExternalLink size={14} style={{ color: '#9ca3af', flexShrink: 0 }} />
                        </a>
                    ))}
                </div>
            )}

            <a
                href="https://www.reddit.com/r/nepal"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.viewAll}
            >
                View r/nepal on Reddit
            </a>
        </div>
    );
};

const styles = {
    card: {
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e5e7eb',
        padding: '1.25rem',
        fontFamily: "'Inter', sans-serif",
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #f0f0f0',
    },
    title: {
        fontFamily: "'Sora', sans-serif",
        fontSize: '0.95rem',
        color: '#1a1a1a',
        fontWeight: 600,
        margin: 0,
    },
    loadingText: {
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '0.85rem',
        padding: '1rem 0',
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
    },
    item: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.6rem',
        padding: '0.65rem 0.5rem',
        borderRadius: '8px',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'background 0.15s',
    },
    rank: {
        fontFamily: "'Sora', sans-serif",
        fontSize: '0.8rem',
        fontWeight: 700,
        color: '#d4a574',
        width: '18px',
        textAlign: 'center',
        flexShrink: 0,
        marginTop: '2px',
    },
    itemContent: {
        flex: 1,
        minWidth: 0,
    },
    itemTitle: {
        fontSize: '0.82rem',
        color: '#1a1a1a',
        lineHeight: 1.4,
        margin: '0 0 0.3rem 0',
    },
    itemMeta: {
        display: 'flex',
        gap: '0.75rem',
    },
    metaItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.2rem',
        fontSize: '0.72rem',
        color: '#9ca3af',
    },
    viewAll: {
        display: 'block',
        textAlign: 'center',
        marginTop: '0.75rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid #f0f0f0',
        fontSize: '0.8rem',
        color: '#1a4d6f',
        textDecoration: 'none',
        fontWeight: 500,
    },
};

export default RedditTrending;
