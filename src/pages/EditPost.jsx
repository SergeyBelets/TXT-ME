import { useState, useEffect, useCallback, useId } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postsAPI, profileAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import MarkdownEditor from '../components/MarkdownEditor';
import AvatarPickerShell from '../components/AvatarPickerShell';
import UndoToast from '../components/UndoToast';
import ErrorModal from '../components/ErrorModal';
import { getAvatarRecents, resolveAvatarRecents, saveAvatarRecent } from '../utils/avatarRecents';
import { getAvatarFallbackDataUrl } from '../utils/avatarFallback';
import { getAvatarLabel } from '../utils/avatarLabel';
import { resizeAvatarImage } from '../utils/avatarUpload';

export default function EditPost() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  // Аватары
  const [avatars, setAvatars] = useState([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState(null);
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

  const loadPost = useCallback(async () => {
    try {
      const response = await postsAPI.getById(postId);
      const loadedPost = response.data.post;

      if (user.userId !== loadedPost.userId) {
        navigate('/');
        return;
      }

      setPost(loadedPost);
      setTitle(loadedPost.title);
      setContent(loadedPost.content);
      setTags(loadedPost.tags?.join(', ') || '');
      setSelectedAvatarId(loadedPost.postAvatarId || null);
    } catch (error) {
      console.error('Failed to load post:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [navigate, postId, user]);

  const loadAvatars = useCallback(async () => {
    setAvatarLoadError('');
    try {
      const response = await profileAPI.getProfile();
      const profile = response.data;
      setAvatars(profile.avatars || []);
      setDefaultAvatarId(profile.activeAvatarId);
      setRecentAvatarIds(getAvatarRecents());
    } catch (err) {
      console.error('Failed to load avatars:', err);
      setAvatarLoadError('Не удалось загрузить аватары');
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      loadPost();
      loadAvatars();
    } else if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, loadAvatars, loadPost, navigate, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const postData = {
        title,
        content,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
      };

      // Добавляем avatarId (может быть изменён или удалён)
      if (selectedAvatarId) {
        postData.postAvatarId = selectedAvatarId;
      } else {
        postData.postAvatarId = null; // Удаляем аватар
      }

      await postsAPI.update(postId, postData);
      navigate(`/posts/${postId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update post');
    }
  };

  const handleSelectAvatar = (avatarId) => {
    if (Object.is(avatarId, selectedAvatarId)) return;
    const previousAvatarId = selectedAvatarId;
    setSelectedAvatarId(avatarId);
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

  const handleRetryLoadAvatars = () => {
    loadAvatars();
  };

  const normalizedSearch = avatarSearch.trim().toLowerCase();
  const filteredAvatars = normalizedSearch
    ? avatars.filter((avatar) =>
      String(avatar.avatarId || '').toLowerCase().includes(normalizedSearch))
    : avatars;
  const recentAvatars = resolveAvatarRecents(recentAvatarIds, avatars);
  const selectedAvatar = avatars.find((avatar) => avatar.avatarId === selectedAvatarId) || null;

  if (authLoading || loading) return <div className="loading">Загрузка...</div>;
  if (!post) return null;

  return (
    <div className="edit-post">
    <h1>Редактировать пост</h1>
    {error && <div className="error">{error}</div>}

    <form onSubmit={handleSubmit}>
    <div className="form-group">
    <label>Заголовок</label>
    <input
    type="text"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    placeholder="Введите заголовок"
    required
    />
    </div>

    <div className="form-group">
    <label>Содержание</label>
    <MarkdownEditor
    value={content}
    onChange={setContent}
    placeholder="Напишите текст поста..."
    />
    </div>

    <div className="form-group">
    <label>Теги (через запятую)</label>
    <input
    type="text"
    value={tags}
    onChange={(e) => setTags(e.target.value)}
    placeholder="четадь, песадь"
    />
    </div>

    {/* Выбор аватара */}
    <div className="form-group">
    <AvatarPickerShell
    label="Аватар для поста"
    triggerText="Выбрать аватар"
    selectedAvatar={selectedAvatar}
    selectedAvatarId={selectedAvatarId}
    >
    {({ closePicker }) => (
      <>
      <div className="avatar-upload-inline">
      <input
      type="file"
      accept="image/*"
      onChange={handleUploadAvatar}
      disabled={uploadingAvatar || avatars.length >= 50}
      id={uploadInputId}
      style={{ display: 'none' }}
      />
      <label
      htmlFor={uploadInputId}
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
            className={`avatar-option ${selectedAvatarId === avatar.avatarId ? 'selected' : ''}`}
            role="option"
            tabIndex={0}
            data-avatar-option="true"
            aria-selected={selectedAvatarId === avatar.avatarId}
            onClick={() => {
              handleSelectAvatar(avatar.avatarId);
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
              <span className="avatar-badge">По умолчанию</span>
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
        <div
        className={`avatar-option ${selectedAvatarId === null ? 'selected' : ''}`}
        role="option"
        tabIndex={0}
        data-avatar-option="true"
        aria-selected={selectedAvatarId === null}
        onClick={() => {
          handleSelectAvatar(null);
          closePicker();
        }}
        >
        <div className="avatar-none">Без аватара</div>
        </div>
        {filteredAvatars.map((avatar) => {
          const avatarLabel = getAvatarLabel(avatar.avatarId);
          return (
            <div
            key={avatar.avatarId}
            className={`avatar-option ${selectedAvatarId === avatar.avatarId ? 'selected' : ''}`}
            role="option"
            tabIndex={0}
            data-avatar-option="true"
            aria-selected={selectedAvatarId === avatar.avatarId}
            onClick={() => {
              handleSelectAvatar(avatar.avatarId);
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
              <span className="avatar-badge">По умолчанию</span>
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

    <div className="form-actions">
    <button type="submit" className="btn btn-primary">
    Сохранить
    </button>
    <button type="button" onClick={() => navigate(-1)} className="btn">
    Отмена
    </button>
    </div>
    </form>
    {toastState && (
      <UndoToast
      message="Changed"
      onUndo={() => {
        setSelectedAvatarId(toastState.previousAvatarId);
        setToastState(null);
      }}
      onClose={() => setToastState(null)}
      />
    )}
    {showUploadErrorModal && (
      <ErrorModal
      title="Загрузка не удалась"
      message={uploadError || 'Ошибка загрузки аватара'}
      onRetry={handleRetryUpload}
      onClose={() => setShowUploadErrorModal(false)}
      />
    )}
    </div>
  );
}
