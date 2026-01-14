import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI, profileAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import MarkdownEditor from '../components/MarkdownEditor';

export default function CreatePost() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  // Аватары
  const [avatars, setAvatars] = useState([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState(null);
  const [defaultAvatarId, setDefaultAvatarId] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      loadAvatars();
    }
  }, [user, authLoading, navigate]);

  const loadAvatars = async () => {
    try {
      const response = await profileAPI.getProfile();
      const profile = response.data;
      setAvatars(profile.avatars || []);
      setDefaultAvatarId(profile.activeAvatarId);
      setSelectedAvatarId(profile.activeAvatarId); // По умолчанию активный
    } catch (err) {
      console.error('Failed to load avatars:', err);
    }
  };

  if (authLoading) return <div className="loading">Загрузка...</div>;
  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const postData = {
        title,
        content,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
      };

      // Добавляем avatarId только если выбран НЕ дефолтный
      if (selectedAvatarId && selectedAvatarId !== defaultAvatarId) {
        postData.postAvatarId = selectedAvatarId;
      }

      const response = await postsAPI.create(postData);
      const postId = response.data.post?.postId || response.data.postId;
      navigate(`/posts/${postId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post">
    <h1>Создать пост</h1>
    {error && <div className="error-message">{error}</div>}
    {loading && <div>Создание...</div>}

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
    {avatars.length > 0 && (
      <div className="form-group">
      <label>Аватар для поста</label>
      <div className="avatar-selector">
      {avatars.map((avatar) => (
        <div
        key={avatar.avatarId}
        className={`avatar-option ${selectedAvatarId === avatar.avatarId ? 'selected' : ''}`}
        onClick={() => setSelectedAvatarId(avatar.avatarId)}
        >
        <img src={avatar.dataUrl} alt="Avatar" />
        {avatar.avatarId === defaultAvatarId && (
          <span className="avatar-badge">По умолчанию</span>
        )}
        </div>
      ))}
      </div>
      </div>
    )}

    <div className="form-actions">
    <button type="submit" className="btn btn-primary" disabled={loading}>
    Опубликовать
    </button>
    <button type="button" onClick={() => navigate(-1)} className="btn">
    Отмена
    </button>
    </div>
    </form>
    </div>
  );
}
