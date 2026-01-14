import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [allAuthors, setAllAuthors] = useState([]);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await postsAPI.getAll({ limit: 50 });
      const postsData = response.data.posts;
      const postsWithComments = await Promise.all(
        postsData.map(async (post) => {
          try {
            const commentsResponse = await commentsAPI.getByPost(post.postId);
            const totalComments = commentsResponse.data.comments?.length || 0;
            return { ...post, totalComments };
          } catch (error) {
            return { ...post, totalComments: 0 };
          }
        })
      );
      setPosts(postsWithComments);

      const tags = new Set();
      const authors = new Set();
      postsWithComments.forEach((post) => {
        if (post.tags) {
          post.tags.forEach((tag) => {
            const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
            tags.add(cleanTag);
          });
        }
        if (post.username) {
          authors.add(post.username);
        }
      });
      setAllTags(Array.from(tags));
      setAllAuthors(Array.from(authors));
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleAuthor = (author) => {
    setSelectedAuthors((prev) =>
    prev.includes(author) ? prev.filter((a) => a !== author) : [...prev, author]
    );
  };

  const handleShare = (postId) => {
    const url = `${window.location.origin}/posts/${postId}`;
    navigator.clipboard.writeText(url)
    .then(() => alert('Ссылка скопирована!'))
    .catch(() => alert('Ошибка копирования'));
  };

  const filteredPosts = posts.filter((post) => {
    if (selectedTags.length > 0) {
      if (!post.tags || !selectedTags.some((tag) => post.tags.includes(tag))) {
        return false;
      }
    }
    if (selectedAuthors.length > 0) {
      if (!selectedAuthors.includes(post.username)) {
        return false;
      }
    }
    return true;
  });

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
    {filteredPosts.length === 0 ? (
      <div className="no-posts">
      <div>Нет постов</div>
      </div>
    ) : (
      filteredPosts.map((post) => (
        <div key={post.postId} className="post-fullwidth">
        {/* Header: аватар слева маленький, справа title/автор/дата */}
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
        <span>{post.username}</span>
        <span>{new Date(post.createdAt).toLocaleDateString('ru-RU')}</span>
        </div>
        </div>
        </div>

        {/* Content: полный текст без отступов */}
        <div className="post-content-full">
        <MarkdownRenderer content={post.content} postId={post.postId} />
        </div>

        {/* Footer: теги, комменты, share, flag */}
        <div className="post-footer-full">
        {post.tags &&
          post.tags.map((tag, idx) => (
            <Link
            key={idx}
            to={`/?tag=${encodeURIComponent(tag)}`}
            className="post-tag"
            >
            {tag}
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
      <span className="post-flag-placeholder">Флаг</span>
      </div>
      </div>
      </div>
      ))
    )}
    </div>

    {/* Sidebar */}
    <aside className={`sidebar ${sidebarExpanded ? 'expanded' : ''}`}>
    {user ? (
      <Link to="/posts/new" className="new-post-btn">
      Новый пост
      </Link>
    ) : null}

    <div className="club-block">
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <img
    src={signofImage}
    alt="TXT-ME CLUB"
    className="club-icon"
    style={{ objectFit: 'cover' }}
    />
    <h2 style={{ margin: 0 }}>TXT-ME CLUB</h2>
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

    <div className="filters-section">
    <div className="filter-group">
    <div className="filter-label">Теги</div>
    {allTags.length === 0 ? null : (
      <div className="filter-options">
      {allTags.map((tag) => (
        <div key={tag} className="filter-option" onClick={() => toggleTag(tag)}>
        <input
        type="checkbox"
        className="checkbox"
        checked={selectedTags.includes(tag)}
        readOnly
        />
        {tag}
        </div>
      ))}
      </div>
    )}
    </div>

    <div className="filter-group">
    <div className="filter-label">Авторы</div>
    {allAuthors.length === 0 ? null : (
      <div className="filter-options">
      {allAuthors.map((author) => (
        <div key={author} className="filter-option" onClick={() => toggleAuthor(author)}>
        <input
        type="checkbox"
        className="checkbox"
        checked={selectedAuthors.includes(author)}
        readOnly
        />
        {author}
        </div>
      ))}
      </div>
    )}
    </div>
    </div>
    </aside>
    </div>
  );
}
