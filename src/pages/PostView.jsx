import { useState, useEffect, useCallback, useId } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { postsAPI, commentsAPI, profileAPI } from '../services/api';
import { useAuth }  from '../utils/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import AvatarDisplay from '../components/AvatarDisplay';
import AvatarPickerShell from '../components/AvatarPickerShell';
import UndoToast from '../components/UndoToast';
import ErrorModal from '../components/ErrorModal';
import { getAvatarRecents, resolveAvatarRecents, saveAvatarRecent } from '../utils/avatarRecents';
import { getAvatarFallbackDataUrl } from '../utils/avatarFallback';
import { getAvatarLabel } from '../utils/avatarLabel';
import { resizeAvatarImage } from '../utils/avatarUpload';

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
  // Props for editing
  editingCommentId,
  setEditingCommentId,
  editText,
  setEditText,
  handleStartEdit,
  handleCancelEdit,
  handleUpdateComment,
  // Props for avatar picker
  avatars,
  recentAvatars = [],
  avatarSearch,
  setAvatarSearch,
  avatarLoadError,
  onRetryLoadAvatars,
  filteredAvatars = [],
  handleAvatarError,
  handleUploadAvatar,
  uploadingAvatar,
  uploadError,
  onRetryUpload,
  showUploadErrorModal,
  onCloseUploadError,
  selectedCommentAvatarId,
  setSelectedCommentAvatarId,
  defaultAvatarId
}) => {
  const selectedAvatar = avatars.find((avatar) => avatar.avatarId === selectedCommentAvatarId) || null;
  const uploadInputId = useId();

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
    {/* Meta info with "edited" mark */}
    <div style={{
      fontSize: '0.875rem',
      color: 'var(--muted-foreground)',
          marginBottom: '0.5rem'
    }}>
    <strong>{comment.username}</strong>
    <span> • </span>
    <span>{new Date(comment.createdAt).toLocaleString('ru-RU')}</span>
    {/* "edited" mark if updatedAt exists */}
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

    {/* Edit mode */}
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
      {/* Comment content */}
      <div style={{ marginBottom: '0.75rem' }}>
      <MarkdownRenderer content={comment.content} />
      </div>

      {/* Buttons: Reply | Edit | Delete */}
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

      {/* Edit button */}
      {user && !isLoading && user.username === comment.username && (
        <button
        onClick={() => handleStartEdit(comment)}
        className="btn btn-primary"
        style={{ fontSize: '0.85rem' }}
        >
        Редактировать
        </button>
      )}

      {/* Delete button */}
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

    {/* Reply form with AvatarPickerShell */}
    {replyTo === comment.commentId && (
      <div className="reply-form">
      <form onSubmit={(e) => handleAddReply(e, comment.commentId)}>
      <div style={{ marginBottom: '10px' }}>
      <AvatarPickerShell
      label="Аватар для комментария"
      triggerText="Выбрать аватар"
      selectedAvatar={selectedAvatar}
      selectedAvatarId={selectedCommentAvatarId}
      >
      {({ closePicker }) => (
        <>
        <div className="avatar-upload-inline">
        <input
        type="file"
        accept="image/*"
        onChange={handleUploadAvatar}
        disabled={uploadingAvatar || avatars.length >= 50}
        id={`${uploadInputId}-reply`}
        style={{ display: 'none' }}
        />
        <label
        htmlFor={`${uploadInputId}-reply`}
        className={`btn ${avatars.length > 0 ? '' : 'btn-primary'} ${(uploadingAvatar || avatars.length >= 50) ? 'disabled' : ''}`}
        >
        {uploadingAvatar
          ? '⏳ Загрузка...'
          : avatars.length > 0
            ? '➕ Загрузить новый'
            : '➕ Загрузить аватар'}
        </label>
        {uploadError && <div className="avatar-upload-error">{uploadError}</div>}
        </div>

        {avatarLoadError && (
          <div className="avatar-load-error">
          <span>{avatarLoadError}</span>
          <button type="button" className="btn btn-small" onClick={onRetryLoadAvatars}>
          Повторить
          </button>
          </div>
        )}

        {!avatarLoadError && avatars.length === 0 && (
          <div className="avatar-empty">Нет аватаров</div>
        )}

        {avatars.length >= 20 && avatars.length > 0 && (
          <div className="avatar-search">
          <input
          type="text"
          value={avatarSearch}
          onChange={(e) => setAvatarSearch(e.target.value)}
          placeholder="Поиск по ID"
          aria-label="Поиск аватара"
          />
          {avatarSearch && (
            <button
            type="button"
            className="btn btn-small"
            onClick={() => setAvatarSearch('')}
            >
            Очистить
            </button>
          )}
          </div>
        )}
        {!avatarSearch && recentAvatars.length > 0 && (
          <div className="avatar-recents">
          <div className="avatar-recents-label">Недавние</div>
        <div className="avatar-selector avatar-recents-row" role="listbox" aria-label="Недавние аватары">
        {recentAvatars.map((avatar) => {
          const avatarLabel = getAvatarLabel(avatar.avatarId);
          return (
            <div
            key={`recent-${avatar.avatarId}`}
            className={`avatar-option ${
              selectedCommentAvatarId === avatar.avatarId ? 'selected' : ''
            }`}
            role="option"
            tabIndex={0}
            data-avatar-option="true"
            aria-selected={selectedCommentAvatarId === avatar.avatarId}
            onClick={() => {
              setSelectedCommentAvatarId(avatar.avatarId);
              closePicker();
            }}
            style={{ width: '40px', height: '40px' }}
            >
            <img
            src={avatar.dataUrl}
            alt="Avatar"
            style={{ width: '35px', height: '35px' }}
            onError={(event) => handleAvatarError(event, avatar.avatarId)}
            />
            <div className="avatar-hover-preview" aria-hidden="true">
            <img
            src={avatar.dataUrl}
            alt=""
            onError={(event) => handleAvatarError(event, avatar.avatarId)}
            />
            <div className="avatar-hover-label">{avatarLabel}</div>
            </div>
            {avatar.avatarId === defaultAvatarId && (
              <span className="avatar-badge" style={{ fontSize: '8px' }}>
              .
              </span>
            )}
            </div>
          );
        })}
          </div>
          </div>
        )}
        {avatars.length > 0 && (
          <>
        <div className="avatar-selector" role="listbox" aria-label="Все аватары">
        {filteredAvatars.map((avatar) => {
          const avatarLabel = getAvatarLabel(avatar.avatarId);
          return (
            <div
            key={avatar.avatarId}
            className={`avatar-option ${
              selectedCommentAvatarId === avatar.avatarId ? 'selected' : ''
            }`}
            role="option"
            tabIndex={0}
            data-avatar-option="true"
            aria-selected={selectedCommentAvatarId === avatar.avatarId}
            onClick={() => {
              setSelectedCommentAvatarId(avatar.avatarId);
              closePicker();
            }}
            style={{ width: '40px', height: '40px' }}
            >
            <img
            src={avatar.dataUrl}
            alt="Avatar"
            style={{ width: '35px', height: '35px' }}
            onError={(event) => handleAvatarError(event, avatar.avatarId)}
            />
            <div className="avatar-hover-preview" aria-hidden="true">
            <img
            src={avatar.dataUrl}
            alt=""
            onError={(event) => handleAvatarError(event, avatar.avatarId)}
            />
            <div className="avatar-hover-label">{avatarLabel}</div>
            </div>
            {avatar.avatarId === defaultAvatarId && (
              <span className="avatar-badge" style={{ fontSize: '8px' }}>
              .
              </span>
            )}
            </div>
          );
        })}
          </div>
          {!avatarLoadError && filteredAvatars.length === 0 && (
            <div className="avatar-empty">Нет совпадений</div>
          )}
          </>
        )}
        </>
      )}
        </AvatarPickerShell>
        </div>
      {showUploadErrorModal && (
        <ErrorModal
        title="Загрузка не удалась"
        message={uploadError || 'Ошибка загрузки аватара'}
        onRetry={onRetryUpload}
        onClose={onCloseUploadError}
        />
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

    {/* Replies */}
    {comment.replies?.length > 0 && (
      <div style={{ marginTop: '0.75rem' }}>
      {comment.replies?.map(reply => (
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
        editingCommentId={editingCommentId}
        setEditingCommentId={setEditingCommentId}
        editText={editText}
        setEditText={setEditText}
        handleStartEdit={handleStartEdit}
        handleCancelEdit={handleCancelEdit}
        handleUpdateComment={handleUpdateComment}
        avatars={avatars}
        recentAvatars={recentAvatars}
        avatarSearch={avatarSearch}
        setAvatarSearch={setAvatarSearch}
        avatarLoadError={avatarLoadError}
        onRetryLoadAvatars={onRetryLoadAvatars}
        filteredAvatars={filteredAvatars}
        handleAvatarError={handleAvatarError}
        handleUploadAvatar={handleUploadAvatar}
        uploadingAvatar={uploadingAvatar}
        uploadError={uploadError}
        onRetryUpload={onRetryUpload}
        showUploadErrorModal={showUploadErrorModal}
        onCloseUploadError={onCloseUploadError}
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
  const [recentAvatarIds, setRecentAvatarIds] = useState([]);
  const [avatarSearch, setAvatarSearch] = useState('');
  const [avatarLoadError, setAvatarLoadError] = useState('');
  const [toastState, setToastState] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showUploadErrorModal, setShowUploadErrorModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const uploadInputId = useId();
  const [prevPost, setPrevPost] = useState(null);
  const [nextPost, setNextPost] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');

  const loadPost = useCallback(async () => {
    try {
      const response = await postsAPI.getById(postId);
      setPost(response.data.post);
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const loadComments = useCallback(async () => {
    try {
      const response = await commentsAPI.getByPost(postId);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  }, [postId]);

  const loadAvatars = useCallback(async () => {
    setAvatarLoadError('');
    try {
      const response = await profileAPI.getProfile();
      const profile = response.data;
      setAvatars(profile.avatars || []);
      setDefaultAvatarId(profile.activeAvatarId);
      setSelectedCommentAvatarId(profile.activeAvatarId);
      setRecentAvatarIds(getAvatarRecents());
    } catch (err) {
      console.error('Failed to load avatars:', err);
      setAvatarLoadError('Не удалось загрузить аватары');
    }
  }, []);

  const loadAdjacentPosts = useCallback(async () => {
    try {
      const response = await postsAPI.getAll({ limit: 100 });
      const allPostsData = response.data.posts;
      const currentIndex = allPostsData.findIndex(p => p.postId === postId);
      setPrevPost(currentIndex > 0 ? allPostsData[currentIndex - 1] : null);
      setNextPost(currentIndex < allPostsData.length - 1 ? allPostsData[currentIndex + 1] : null);
    } catch (error) {
      console.error('Failed to load adjacent posts:', error);
    }
  }, [postId]);

  useEffect(() => {
    loadPost();
    loadComments();
    if (user) {
      loadAvatars();
    }
    loadAdjacentPosts();
  }, [loadAdjacentPosts, loadAvatars, loadComments, loadPost, user]);

  useEffect(() => {
    if (loading) return;
    const hash = window.location.hash.substring(1);
    if (!hash) return;

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
  }, [loading, postId]);

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

  // Start editing a comment
  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.commentId);
    setEditText(comment.content);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  // Save edited comment
  const handleUpdateComment = async (e, commentId) => {
    e.preventDefault();
    if (!editText.trim()) return;

    try {
      await commentsAPI.update(postId, commentId, { content: editText });
      setEditingCommentId(null);
      setEditText('');
      loadComments();
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

  const handleSelectCommentAvatar = (avatarId) => {
    if (avatarId === selectedCommentAvatarId) return;
    const previousAvatarId = selectedCommentAvatarId;
    setSelectedCommentAvatarId(avatarId);
    if (avatarId) {
      setRecentAvatarIds(saveAvatarRecent(avatarId));
    }
    setToastState({ previousAvatarId });
  };

  const handleAvatarError = (event, avatarId) => {
    const target = event.currentTarget;
    if (target.dataset.fallbackApplied) return;
    target.dataset.fallbackApplied = 'true';
    target.src = getAvatarFallbackDataUrl(avatarId);
  };

  const handleRetryLoadAvatars = () => {
    loadAvatars();
  };

  const handleUploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setUploadError('');
    setUploadFile(file);
    try {
      const dataUrl = await resizeAvatarImage(file);
      await profileAPI.addAvatar(dataUrl);
      await loadAvatars();
      setUploadFile(null);
    } catch (err) {
      const message = err.response?.data?.error || 'Ошибка загрузки аватара';
      setUploadError(message);
      setShowUploadErrorModal(true);
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handleRetryUpload = async () => {
    if (!uploadFile) return;
    setUploadingAvatar(true);
    setUploadError('');
    try {
      const dataUrl = await resizeAvatarImage(uploadFile);
      await profileAPI.addAvatar(dataUrl);
      await loadAvatars();
      setUploadFile(null);
      setShowUploadErrorModal(false);
    } catch (err) {
      const message = err.response?.data?.error || 'Ошибка загрузки аватара';
      setUploadError(message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
    .then(() => alert('Ссылка скопирована!'))
    .catch(() => alert('Ошибка копирования'));
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

  const commentTree = buildCommentTree(comments || []);
  const totalCommentsCount = countAllComments(commentTree);
  const recentAvatars = resolveAvatarRecents(recentAvatarIds, avatars);
  const normalizedSearch = avatarSearch.trim().toLowerCase();
  const filteredAvatars = normalizedSearch
    ? avatars.filter((avatar) =>
      String(avatar.avatarId || '').toLowerCase().includes(normalizedSearch))
    : avatars;
  const selectedAvatar = avatars.find((avatar) => avatar.avatarId === selectedCommentAvatarId) || null;


  return (
    <>
    <div className="post-view">
    {/* Top navigation */}
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
        <div style={{ marginBottom: '15px' }}>
        <AvatarPickerShell
        label="Аватар для комментария"
        triggerText="Выбрать аватар"
        selectedAvatar={selectedAvatar}
        selectedAvatarId={selectedCommentAvatarId}
        >
        {({ closePicker }) => (
          <>
          <div className="avatar-upload-inline">
          <input
          type="file"
          accept="image/*"
          onChange={handleUploadAvatar}
          disabled={uploadingAvatar || avatars.length >= 50}
          id={`${uploadInputId}-comment`}
          style={{ display: 'none' }}
          />
          <label
          htmlFor={`${uploadInputId}-comment`}
          className={`btn ${avatars.length > 0 ? '' : 'btn-primary'} ${(uploadingAvatar || avatars.length >= 50) ? 'disabled' : ''}`}
          >
          {uploadingAvatar
            ? '⏳ Загрузка...'
            : avatars.length > 0
              ? '➕ Загрузить новый'
              : '➕ Загрузить аватар'}
          </label>
          {uploadError && <div className="avatar-upload-error">{uploadError}</div>}
          {uploadError && (
            <button type="button" className="btn btn-small" onClick={handleRetryUpload}>
            Повторить
            </button>
          )}
          </div>

          {avatarLoadError && (
            <div className="avatar-load-error">
            <span>{avatarLoadError}</span>
            <button type="button" className="btn btn-small" onClick={handleRetryLoadAvatars}>
            Повторить
            </button>
            </div>
          )}

          {!avatarLoadError && avatars.length === 0 && (
            <div className="avatar-empty">Нет аватаров</div>
          )}

          {avatars.length >= 20 && avatars.length > 0 && (
            <div className="avatar-search">
            <input
            type="text"
            value={avatarSearch}
            onChange={(e) => setAvatarSearch(e.target.value)}
            placeholder="Поиск по ID"
            aria-label="Поиск аватара"
            />
            {avatarSearch && (
              <button
              type="button"
              className="btn btn-small"
              onClick={() => setAvatarSearch('')}
              >
              Очистить
              </button>
            )}
            </div>
          )}
          {!avatarSearch && recentAvatars.length > 0 && (
            <div className="avatar-recents">
            <div className="avatar-recents-label">Недавние</div>
          <div className="avatar-selector avatar-recents-row" role="listbox" aria-label="Недавние аватары">
          {recentAvatars.map((avatar) => {
            const avatarLabel = getAvatarLabel(avatar.avatarId);
            return (
              <div
              key={`recent-${avatar.avatarId}`}
              className={`avatar-option ${
                selectedCommentAvatarId === avatar.avatarId ? 'selected' : ''
              }`}
              role="option"
              tabIndex={0}
              data-avatar-option="true"
              aria-selected={selectedCommentAvatarId === avatar.avatarId}
              onClick={() => {
                handleSelectCommentAvatar(avatar.avatarId);
                closePicker();
              }}
              >
              <img
              src={avatar.dataUrl}
              alt="Avatar"
              onError={(event) => handleAvatarError(event, avatar.avatarId)}
              />
              <div className="avatar-hover-preview" aria-hidden="true">
              <img
              src={avatar.dataUrl}
              alt=""
              onError={(event) => handleAvatarError(event, avatar.avatarId)}
              />
              <div className="avatar-hover-label">{avatarLabel}</div>
              </div>
              {avatar.avatarId === defaultAvatarId && (
                <span className="avatar-badge">•</span>
              )}
              </div>
            );
          })}
            </div>
            </div>
          )}
          {avatars.length > 0 && (
            <>
          <div className="avatar-selector" role="listbox" aria-label="Все аватары">
          {filteredAvatars.map((avatar) => {
            const avatarLabel = getAvatarLabel(avatar.avatarId);
            return (
              <div
              key={avatar.avatarId}
              className={`avatar-option ${
                selectedCommentAvatarId === avatar.avatarId ? 'selected' : ''
              }`}
              role="option"
              tabIndex={0}
              data-avatar-option="true"
              aria-selected={selectedCommentAvatarId === avatar.avatarId}
              onClick={() => {
                handleSelectCommentAvatar(avatar.avatarId);
                closePicker();
              }}
              >
              <img
              src={avatar.dataUrl}
              alt="Avatar"
              onError={(event) => handleAvatarError(event, avatar.avatarId)}
              />
              <div className="avatar-hover-preview" aria-hidden="true">
              <img
              src={avatar.dataUrl}
              alt=""
              onError={(event) => handleAvatarError(event, avatar.avatarId)}
              />
              <div className="avatar-hover-label">{avatarLabel}</div>
              </div>
              {avatar.avatarId === defaultAvatarId && (
                <span className="avatar-badge">•</span>
              )}
              </div>
            );
          })}
            </div>
            {!avatarLoadError && filteredAvatars.length === 0 && (
              <div className="avatar-empty">Нет совпадений</div>
            )}
            </>
          )}
          </>
        )}
        </AvatarPickerShell>
        </div>
      {showUploadErrorModal && (
        <ErrorModal
        title="Загрузка не удалась"
        message={uploadError || 'Ошибка загрузки аватара'}
        onRetry={handleRetryUpload}
        onClose={() => setShowUploadErrorModal(false)}
        />
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

  {commentTree?.length === 0 ? (
    <div className="no-comments">Пока нет комментариев</div>
  ) : (
      commentTree.map((comment) => (
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
        editingCommentId={editingCommentId}
        setEditingCommentId={setEditingCommentId}
        editText={editText}
        setEditText={setEditText}
        handleStartEdit={handleStartEdit}
        handleCancelEdit={handleCancelEdit}
        handleUpdateComment={handleUpdateComment}
        avatars={avatars}
        recentAvatars={recentAvatars}
        avatarSearch={avatarSearch}
        setAvatarSearch={setAvatarSearch}
        avatarLoadError={avatarLoadError}
        onRetryLoadAvatars={handleRetryLoadAvatars}
        filteredAvatars={filteredAvatars}
        handleAvatarError={handleAvatarError}
        handleUploadAvatar={handleUploadAvatar}
        uploadingAvatar={uploadingAvatar}
        uploadError={uploadError}
        onRetryUpload={handleRetryUpload}
        showUploadErrorModal={showUploadErrorModal}
        onCloseUploadError={() => setShowUploadErrorModal(false)}
        selectedCommentAvatarId={selectedCommentAvatarId}
        setSelectedCommentAvatarId={handleSelectCommentAvatar}
        defaultAvatarId={defaultAvatarId}
        />
      ))
  )}
  </div>

  {/* Bottom navigation */}
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
  {toastState && (
    <UndoToast
    message="Changed"
    onUndo={() => {
      setSelectedCommentAvatarId(toastState.previousAvatarId);
      setToastState(null);
    }}
    onClose={() => setToastState(null)}
    />
  )}
  </>
  );
}
