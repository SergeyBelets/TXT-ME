import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { postsAPI, commentsAPI } from '../services/api';
import  { useAuth } from '../utils/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import AvatarDisplay from '../components/AvatarDisplay';
import signofImage from '../assets/signof.jpeg';

const getRoleDisplay = (role) => {
  const roleMap = {
    'NASTOIATEL': 'Настоятель',
    'SMOTRITEL': 'Смотритель',
    'AVTOR': 'Автор',
    'KOMMENTATOR': 'Комментатор'
  };
  return roleMap[role] || role;
};

export default function PostsV2() {
  const [posts, setPosts] = useState([]);
  const [pageMeta, setPageMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const since = searchParams.get('since');
  const until = searchParams.get('until');
  const tag = searchParams.get('tag');
  const author = searchParams.get('author');
  const day = searchParams.get('day');

  useEffect(() => {
    loadPosts();
  }, [since, until, tag, author, day]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (since) params.since = since;
      if (until) params.until = until;
      if (tag) params.tag = tag;
      if (author) params.author = author;
      if (day) params.day = day;
      
      const response = await postsAPI.getAllV2(params);
      const postsData = response.data.items;
      const meta = response.data.page;

      // URL Rewrite logic: if we used 'until', rewrite to 'since' of the first item
      if (until && postsData.length > 0) {
        const newSince = Number(postsData[0].createdAt) + 1;
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('until');
        newParams.set('since', newSince.toString());
        // replaceState to keep URL clean and shareable without re-triggering useEffect
        window.history.replaceState(null, '', `?${newParams.toString()}`);
      }

      const postsWithComments = await Promise.all(
        postsData.map(async (post) => {
          try {
            const commentsResponse = await commentsAPI.getByPost(post.postId);
            const totalComments = commentsResponse.data.comments?.length || 0;
            return { ...post, totalComments };
          } catch {
            return { ...post, totalComments: 0 };
          }
        })
      );
      setPosts(postsWithComments);
      setPageMeta(meta);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (postId) => {
    const url = `${window.location.origin}/posts/${postId}`;
    navigator.clipboard.writeText(url)
    .then(() => alert('Ссылка скопирована!'))
    .catch(() => alert('Ошибка копирования'));
  };

  const getPaginationUrl = (paramsUpdate) => {
    const newParams = new URLSearchParams(searchParams);
    Object.keys(paramsUpdate).forEach(key => {
      if (paramsUpdate[key] === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, paramsUpdate[key]);
      }
    });
    // When navigating to a new page, ensure we only have one of since/until
    if (paramsUpdate.since) newParams.delete('until');
    if (paramsUpdate.until) newParams.delete('since');
    
    return `?${newParams.toString()}`;
  };

  const Pagination = () => {
    if (!pageMeta.prevUntil && !pageMeta.nextSince) return null;
    
    return (
      <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', gap: '2rem', padding: '1rem' }}>
        {pageMeta.prevUntil && (
          <Link to={getPaginationUrl({ until: pageMeta.prevUntil })} className="btn btn-secondary">
            ← Новее
          </Link>
        )}
        {pageMeta.nextSince && (
          <Link to={getPaginationUrl({ since: pageMeta.nextSince })} className="btn btn-secondary">
            Старее →
          </Link>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="loading">...</div>;
  }

  return (
    <div className="main-container">
    <button
    className="expand-toggle mobile-only"
    onClick={() => setSidebarExpanded(!sidebarExpanded)}
    >
    {sidebarExpanded ? '←' : '→'}
    </button>

    <div className="feed">
    <div className="v2-header">
      <h1 className="v2-title">Лента (V2)</h1>
      <div className="feed-filters-display">
        {tag && (
          <span className="active-filter">
            Тег: {tag} 
            <button className="filter-remove-btn" onClick={() => setSearchParams(p => { p.delete('tag'); return p; })}>×</button>
          </span>
        )}
        {author && (
          <span className="active-filter">
            Автор: {author} 
            <button className="filter-remove-btn" onClick={() => setSearchParams(p => { p.delete('author'); return p; })}>×</button>
          </span>
        )}
        {day && (
          <span className="active-filter">
            День: {day} 
            <button className="filter-remove-btn" onClick={() => setSearchParams(p => { p.delete('day'); return p; })}>×</button>
          </span>
        )}
        {(tag || author || day || since || until) && (
          <button className="btn btn-reset" onClick={() => navigate('/posts')}>Сбросить</button>
        )}
      </div>
    </div>

    <Pagination />

    {posts.length === 0 ? (
      <div className="no-posts">
      <div>Нет постов</div>
      </div>
    ) : (
      posts.map((post) => (
        <div key={post.postId} className="post-fullwidth">
        <div className="post-header-full">
        <div className="post-avatar-small">
        <AvatarDisplay
        userId={post.userId}
        avatarId={post.postAvatarId}
        username={post.username}
        size={50}
        />
        </div>
        <div className="post-header-right">
        <Link to={`/posts/${post.postId}`} style={{ textDecoration: 'none' }}>
        <h2 className="post-title">{post.title}</h2>
        </Link>
        <div className="post-meta">
        <Link to={`/posts?author=${encodeURIComponent(post.username)}`} className="author-link">{post.username}</Link>
        <span>{new Date(post.createdAt).toLocaleDateString('ru-RU')}</span>
        </div>
        </div>
        </div>

        <div className="post-content-full">
        <MarkdownRenderer content={post.content} postId={post.postId} />
        </div>

        <div className="post-footer-full">
        {post.tags &&
          post.tags.map((t, idx) => (
            <Link
            key={idx}
            to={`/posts?tag=${encodeURIComponent(t)}`}
            className="post-tag"
            >
            {t}
            </Link>
          ))}
          <div className="post-actions-full">
          <Link to={`/posts/${post.postId}#comment-form`} className="post-comment-link">
          Написать комментарий
          </Link>
          <Link to={`/posts/${post.postId}#comments-section`} className="post-comment-link">
          {post.totalComments === 0
            ? 'Комментарии'
            : post.totalComments === 1
            ? '1 комментарий'
      : `${post.totalComments} комментариев`}
      </Link>
      <button onClick={() => handleShare(post.postId)} className="post-share-btn">
      Поделиться
      </button>
      </div>
      </div>
      </div>
      ))
    )}

    <Pagination />
    </div>

    <aside className={`sidebar ${sidebarExpanded ? 'expanded' : ''}`}>
    {user ? (
      <Link to="/posts/new" className="new-post-btn">
      Новый пост
      </Link>
    ) : null}

    <div className="club-block">
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit' }}>
      <img
      src={signofImage}
      alt="TXT-ME CLUB"
      className="club-icon"
      style={{ objectFit: 'cover' }}
      />
      <h2 style={{ margin: 0 }}>TXT-ME CLUB</h2>
    </Link>
    </div>
    </div>

    <div className="user-section">
    {user ? (
      <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
      <AvatarDisplay
      userId={user.userId}
      avatarId={user.activeAvatarId}
      username={user.username}
      size={48}
      />
      <div style={{ marginLeft: '0.75rem' }}>
      <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
      {user.username}
      </div>
      <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
      {getRoleDisplay(user.role)}
      </div>
      </div>
      </div>
      <Link to="/profile/edit" className="btn btn-primary" style={{ width: '100%', marginBottom: '0.5rem', textAlign: 'center' }}>
      Редактировать профиль
      </Link>
      <button onClick={logout} className="btn btn-primary" style={{ width: '100%' }}>
      Выйти
      </button>
      </div>
    ) : (
      <div className="auth-buttons">
      <Link to="/login" className="btn btn-primary">
      Войти
      </Link>
      <Link to="/register" className="btn">
      Регистрация
      </Link>
      </div>
    )}
    </div>

    <div className="navigation-links" style={{ padding: '1rem' }}>
        <Link to="/" style={{ display: 'block', marginBottom: '0.5rem' }}>Вернуться на старую главную</Link>
    </div>
    </aside>
    </div>
  );
}
