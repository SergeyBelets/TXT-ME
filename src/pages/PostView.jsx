import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { postsAPI, commentsAPI, profileAPI } from '../services/api';
import { useAuth }  from '../utils/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import AvatarDisplay from '../components/AvatarDisplay';

const CommentItem = ({
  comment,
  level = 0,
  user,
  isLoading,
  replyTo,
  setReplyTo,
  replyText,
  setReplyText,
  handleAddReply,
  handleDeleteComment,
  // ✅ НОВЫЕ ПРОПСЫ ДЛЯ РЕДАКТИРОВАНИЯ:
  editingCommentId,
  setEditingCommentId,
  editText,
  setEditText,
  handleStartEdit,
  handleCancelEdit,
  handleUpdateComment,
  avatars,
  selectedCommentAvatarId,
  setSelectedCommentAvatarId,
  defaultAvatarId
}) => {
  return (
    <div
    key={comment.commentId}
    style={{
      marginLeft: `${level * 2}rem`,
      borderLeft: level > 0 ? '2px solid var(--border)' : 'none',
          paddingLeft: level > 0 ? '1rem' : 0,
          marginBottom: '1rem'
    }}
    >
    <div style={{
      background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1rem'
    }}>
    <div className="comment-with-avatar">
    <div className="comment-avatar-container">
    <AvatarDisplay
    userId={comment.userId}
    avatarId={comment.commentAvatarId}
    username={comment.username}
    size={32}
    />
    </div>
    <div style={{ flex: 1 }}>
    {/* ✅ МЕТА ИНФО С ПОМЕТКОЙ "ОТРЕДАКТИРОВАН" */}
    <div style={{
      fontSize: '0.875rem',
      color: 'var(--muted-foreground)',
          marginBottom: '0.5rem'
    }}>
    <strong>{comment.username}</strong>
    <span> • </span>
    <span>{new Date(comment.createdAt).toLocaleString('ru-RU')}</span>
    {/* ✅ ПОМЕТКА "отредактирован" если есть updatedAt */}
    {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
      <span style={{
        fontStyle: 'italic',
        color: 'var(--muted)',
                                                                      fontSize: '0.8rem'
      }}>
      {' '}• отредактирован
      </span>
    )}
    </div>

    {/* ✅ РЕЖИМ РЕДАКТИРОВАНИЯ */}
    {editingCommentId === comment.commentId ? (
      <form onSubmit={(e) => handleUpdateComment(e, comment.commentId)}>
      <textarea
      value={editText}
      onChange={(e) => setEditText(e.target.value)}
      placeholder="Текст комментария..."
      className="comment-textarea"
      style={{
        width: '100%',
        minHeight: '80px',
        marginBottom: '0.5rem'
      }}
      />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button type="submit" className="btn btn-primary">Сохранить</button>
      <button
      type="button"
      onClick={handleCancelEdit}
      className="btn"
      >
      Отмена
      </button>
      </div>
      </form>
    ) : (
      <>
      {/* ✅ СОДЕРЖИМОЕ КОММЕНТАРИЯ */}
      <div style={{ marginBottom: '0.75rem' }}>
      <MarkdownRenderer content={comment.content} />
      </div>

      {/* ✅ КНОПКИ: ОТВЕТИТЬ | РЕДАКТИРОВАТЬ | УДАЛИТЬ */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
      {user && (
        <button
        onClick={() => setReplyTo(replyTo === comment.commentId ? null : comment.commentId)}
        className="btn btn-primary"
        >
        Ответить
        </button>
      )}

      {/* ✅ ✅ КНОПКА РЕДАКТИРОВАТЬ (СИНЯЯ, ЛЕВЕЕ УДАЛЕНИЯ) */}
      {user && !isLoading && user.username === comment.username && (
        <button
        onClick={() => handleStartEdit(comment)}
        className="btn btn-primary"
        style={{ fontSize: '0.85rem' }}
        >
        Редактировать
        </button>
      )}

      {/* ✅ КНОПКА УДАЛИТЬ (КРАСНАЯ) */}
      {user && !isLoading && (user.username === comment.username || user.role === 'admin') && (
        <button
        onClick={() => handleDeleteComment(comment.commentId)}
        className="btn"
        style={{ color: '#dc2626', fontSize: '0.85rem' }}
        >
        Удалить
        </button>
      )}
      </div>
      </>
    )}
    </div>
    </div>
    </div>

    {/* Reply form - существующий код без изменений */}
    {replyTo === comment.commentId && (
      <div className="reply-form">
      <form onSubmit={(e) => handleAddReply(e, comment.commentId)}>
      {avatars.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
        <label style={{ fontSize: '0.875rem', marginBottom: '5px', display: 'block' }}>
        Аватар для комментария:
        </label>
        <div className="avatar-selector">
        {avatars.map((avatar) => (
          <div
          key={avatar.avatarId}
          className={`avatar-option ${selectedCommentAvatarId === avatar.avatarId ? 'selected' : ''}`}
          onClick={() => setSelectedCommentAvatarId(avatar.avatarId)}
          style={{ width: '40px', height: '40px' }}
          >
          <img
          src={avatar.dataUrl}
          alt="Avatar"
          style={{ width: '35px', height: '35px' }}
          />
          {avatar.avatarId === defaultAvatarId && (
            <span className="avatar-badge" style={{ fontSize: '8px' }}>
            ✓
            </span>
          )}
          </div>
        ))}
        <div
        className={`avatar-option ${selectedCommentAvatarId === null ? 'selected' : ''}`}
        onClick={() => setSelectedCommentAvatarId(null)}
        style={{ width: '40px', height: '40px' }}
        >
        <div className="avatar-none" style={{ fontSize: '8px' }}>
        Без аватара
        </div>
        </div>
        </div>
        </div>
      )}

      <textarea
      value={replyText}
      onChange={(e) => setReplyText(e.target.value)}
      placeholder="Текст ответа..."
      className="comment-textarea"
      style={{ width: '100%', minHeight: '80px', marginBottom: '0.5rem' }}
      disabled={isLoading}
      />

      <div className="comment-actions" style={{ display: 'flex', gap: '0.5rem' }}>
      <button
      type="submit"
      className="btn btn-primary"
      disabled={isLoading || !replyText.trim()}
      >
      {isLoading ? 'Отправка...' : 'Отправить'}
      </button>
      <button
      type="button"
      onClick={() => {
        setReplyTo(null);
        setReplyText('');
      }}
      className="btn btn-secondary"
      disabled={isLoading}
      >
      Отмена
      </button>
      </div>
      </form>
      </div>
    )}

    {/* Replies - существующий код с новыми пропсами */}
    {comment.replies && comment.replies.length > 0 && (
      <div style={{ marginTop: '0.75rem' }}>
      {comment.replies.map(reply => (
        <CommentItem
        key={reply.commentId}
        comment={reply}
        level={level + 1}
        user={user}
        isLoading={isLoading}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        replyText={replyText}
        setReplyText={setReplyText}
        handleAddReply={handleAddReply}
        handleDeleteComment={handleDeleteComment}
        // ✅ ПЕРЕДАЕМ ПРОПСЫ ДЛЯ РЕДАКТИРОВАНИЯ
        editingCommentId={editingCommentId}
        setEditingCommentId={setEditingCommentId}
        editText={editText}
        setEditText={setEditText}
        handleStartEdit={handleStartEdit}
        handleCancelEdit={handleCancelEdit}
        handleUpdateComment={handleUpdateComment}
        avatars={avatars}
        selectedCommentAvatarId={selectedCommentAvatarId}
        setSelectedCommentAvatarId={setSelectedCommentAvatarId}
        defaultAvatarId={defaultAvatarId}
        />
      ))}
      </div>
    )}
    </div>
  );
};

export default function PostView() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [avatars, setAvatars] = useState([]);
  const [selectedCommentAvatarId, setSelectedCommentAvatarId] = useState(null);
  const [defaultAvatarId, setDefaultAvatarId] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [prevPost, setPrevPost] = useState(null);
  const [nextPost, setNextPost] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');


  useEffect(() => {
    loadPost();
    loadComments();
    if (user) loadAvatars();
    loadAdjacentPosts();
    const hash = window.location.hash.substring(1);
    if (!loading) {
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (hash === 'comment-form') {
          const textarea = document.querySelector('#comment-form textarea');
          if (textarea) setTimeout(() => textarea.focus(), 300);
        }
      }, 200);
    }
  }, [postId, user]);

  const loadPost = async () => {
    try {
      const response = await postsAPI.getById(postId);
      setPost(response.data.post);
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await commentsAPI.getByPost(postId);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const loadAvatars = async () => {
    try {
      const response = await profileAPI.getProfile();
      const profile = response.data;
      setAvatars(profile.avatars);
      setDefaultAvatarId(profile.activeAvatarId);
      setSelectedCommentAvatarId(profile.activeAvatarId);
    } catch (err) {
      console.error('Failed to load avatars:', err);
    }
  };

  const loadAdjacentPosts = async () => {
    try {
      const response = await postsAPI.getAll({ limit: 100 });
      const allPostsData = response.data.posts;
      setAllPosts(allPostsData);
      const currentIndex = allPostsData.findIndex(p => p.postId === postId);
      setPrevPost(currentIndex > 0 ? allPostsData[currentIndex - 1] : null);
      setNextPost(currentIndex < allPostsData.length - 1 ? allPostsData[currentIndex + 1] : null);
    } catch (error) {
      console.error('Failed to load adjacent posts:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const commentData = { content: newComment };
      if (selectedCommentAvatarId && selectedCommentAvatarId !== defaultAvatarId) {
        commentData.commentAvatarId = selectedCommentAvatarId;
      }
      await commentsAPI.create(postId, commentData);
      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Add comment error:', error);
      alert('Failed to add comment');
    }
  };

  const handleAddReply = async (e, parentCommentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      const commentData = {
        content: replyText,
        parentCommentId
      };
      if (selectedCommentAvatarId && selectedCommentAvatarId !== defaultAvatarId) {
        commentData.commentAvatarId = selectedCommentAvatarId;
      }
      await commentsAPI.create(postId, commentData);
      setReplyText('');
      setReplyTo(null);
      loadComments();
    } catch (error) {
      console.error('Add reply error:', error);
      alert('Failed to add reply');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Удалить комментарий?')) return;
    if (isLoading || !user) return;
    try {
      await commentsAPI.delete(postId, commentId);
      loadComments();
    } catch (error) {
      console.error('Delete comment error:', error);
      const message = error.response?.data?.error || 'Failed to delete comment';
      alert(message);
    }
  };

  // Функция для начала редактирования
  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.commentId);
    setEditText(comment.content);
  };

  // Функция для отмены редактирования
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  // Функция для сохранения изменений
  const handleUpdateComment = async (e, commentId) => {
    e.preventDefault();
    if (!editText.trim()) return;

    try {
      await commentsAPI.update(postId, commentId, { content: editText });
      setEditingCommentId(null);
      setEditText('');
      loadComments();  // Перезагружаем комментарии
    } catch (error) {
      console.error('Update comment error:', error);
      alert('Не удалось обновить комментарий');
    }
  };


  const handleDeletePost = async () => {
    if (!confirm('Удалить пост?')) return;
    if (isLoading || !user || !post) return;
    try {
      await postsAPI.delete(postId);
      navigate('/');
    } catch (error) {
      console.error('Delete post error:', error);
      alert('Failed to delete post');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
    .then(() => alert('Ссылка скопирована!'))
    .catch(() => alert('Ошибка копирования'));
  };

  const scrollToComments = () => {
    const commentsSection = document.querySelector('.comments-section');
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToCommentForm = () => {
    const form = document.getElementById('comment-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const textarea = form.querySelector('textarea');
      if (textarea) setTimeout(() => textarea.focus(), 300);
    }
  };

  const buildCommentTree = (comments) => {
    const map = new Map();
    const roots = [];
    comments.forEach((comment) => {
      map.set(comment.commentId, { ...comment, replies: [] });
    });
    comments.forEach((comment) => {
      if (comment.parentCommentId) {
        if (map.has(comment.parentCommentId)) {
          map.get(comment.parentCommentId).replies.push(map.get(comment.commentId));
        }
      } else {
        roots.push(map.get(comment.commentId));
      }
    });
    return roots;
  };

  if (loading || isLoading) {
    return <div className="loading">...</div>;
  }

  if (!post) {
    return <div className="loading">Пост не найден</div>;
  }

  const countAllComments = (tree) => {
    if (!tree || tree.length === 0) return 0;
    return tree.reduce((total, comment) => {
      total += 1;
      if (comment.replies && comment.replies.length > 0) {
        total += countAllComments(comment.replies);
      }
      return total;
    }, 0);
  };

  const commentTree = buildCommentTree(comments);
  const totalCommentsCount = countAllComments(commentTree);


  return (
    <div className="post-view">
    {/* Навигация сверху */}
    <div className="post-navigation">
    {prevPost && (
      <Link to={`/posts/${prevPost.postId}`} className="nav-link">
      ← Следующий пост
      </Link>
    )}
    <Link to="/" className="nav-link center">
    Назад к ленте
    </Link>
    {nextPost && (
      <Link to={`/posts/${nextPost.postId}`} className="nav-link">
      Предыдущий пост →
      </Link>
    )}
    </div>

    <div className="post-fullwidth">
    {/* Header */}
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
    <h1 className="post-title">{post.title}</h1>
    <div className="post-meta">
    <span>{post.username}</span>
    <span>{new Date(post.createdAt).toLocaleDateString('ru-RU')}</span>
    </div>
    </div>
    </div>

    {/* Content */}
    <div className="post-content-full">
    <MarkdownRenderer content={post.content} postId={post.postId} />
    </div>

    {/* Footer */}
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
      <button onClick={handleShare} className="post-share-btn">
      Поделиться
      </button>
      <span className="post-flag-placeholder">Флаг</span>
      {user && !isLoading && (user.username === post.username ) && (
        <>
        <Link to={`/posts/${postId}/edit`} className="post-comment-link">
        Редактировать
        </Link>
        <button onClick={handleDeletePost} className="post-comment-link" style={{ color: '#dc2626' }}>
        Удалить
        </button>
        </>
      )}
      </div>
      </div>
      </div>

      {user ? (
        <div className="comment-form" id="comment-form">
        <h3>Добавить комментарий</h3>
        <form onSubmit={handleAddComment}>
        {avatars.length === 0 ? null : (
          <div style={{ marginBottom: '15px' }}>
          <label
          style={{
            fontSize: '0.875rem',
            marginBottom: '8px',
            display: 'block'
          }}
          >
          Аватар для комментария:
          </label>
          <div className="avatar-selector">
          {avatars.map((avatar) => (
            <div
            key={avatar.avatarId}
            className={`avatar-option ${
              selectedCommentAvatarId === avatar.avatarId ? 'selected' : ''
            }`}
            onClick={() => setSelectedCommentAvatarId(avatar.avatarId)}
            >
            <img src={avatar.dataUrl} alt="Avatar" />
            {avatar.avatarId === defaultAvatarId && (
              <span className="avatar-badge">•</span>
            )}
            </div>
          ))}
          </div>
          </div>
        )}
        <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Текст комментария..."
        className="comment-textarea"
        />
        <button type="submit" className="btn btn-primary">
        Отправить
        </button>
        </form>
        </div>
      ) : (
        <div className="comment-form">
        <p style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}>
        <Link to="/login" style={{ color: 'var(--primary)' }}>
        Войдите
        </Link>{' '}
        чтобы комментировать
        </p>
        </div>
      )}

      <div className="comments-section" id="comments-section">
      <h3>
      {totalCommentsCount === 0
        ? 'Комментарии'
        : totalCommentsCount === 1
        ? '1 комментарий'
  : `${totalCommentsCount} комментариев`}
  </h3>

  {commentTree.length === 0 ? (
    <div className="no-comments">Пока нет комментариев</div>
  ) : (
    commentTree.map(comment => (
      <CommentItem
      key={comment.commentId}
      comment={comment}
      level={0}
      user={user}
      isLoading={isLoading}
      replyTo={replyTo}
      setReplyTo={setReplyTo}
      replyText={replyText}
      setReplyText={setReplyText}
      handleAddReply={handleAddReply}
      handleDeleteComment={handleDeleteComment}
      // ✅ ✅ НОВЫЕ ПРОПСЫ:
      editingCommentId={editingCommentId}
      setEditingCommentId={setEditingCommentId}
      editText={editText}
      setEditText={setEditText}
      handleStartEdit={handleStartEdit}
      handleCancelEdit={handleCancelEdit}
      handleUpdateComment={handleUpdateComment}
      avatars={avatars}
      selectedCommentAvatarId={selectedCommentAvatarId}
      setSelectedCommentAvatarId={setSelectedCommentAvatarId}
      defaultAvatarId={defaultAvatarId}
      />
    ))
  )}
  </div>

  {/* Навигация снизу */}
  <div className="post-navigation">
  {prevPost && (
    <Link to={`/posts/${prevPost.postId}`} className="nav-link">
    ← Следующий пост
    </Link>
  )}
  <Link to="/" className="nav-link center">
  Назад к ленте
  </Link>
  {nextPost && (
    <Link to={`/posts/${nextPost.postId}`} className="nav-link">
    Предыдущий пост →
    </Link>
  )}
  </div>
  </div>
  );
}
