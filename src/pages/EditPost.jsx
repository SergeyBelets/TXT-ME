import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postsAPI, profileAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import MarkdownEditor from '../components/MarkdownEditor';

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

  useEffect(() => {
    if (!authLoading && user) {
      loadPost();
      loadAvatars();
    } else if (!authLoading && !user) {
      navigate('/login');
    }
  }, [postId, user, authLoading]);

  const loadPost = async () => {
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
  };

  const loadAvatars = async () => {
    try {
      const response = await profileAPI.getProfile();
      const profile = response.data;
      setAvatars(profile.avatars || []);
      setDefaultAvatarId(profile.activeAvatarId);
    } catch (err) {
      console.error('Failed to load avatars:', err);
    }
  };

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
    {avatars.length > 0 && (
      <div className="form-group">
      <label>Аватар для поста</label>
      <div className="avatar-selector">
      <div
      className={`avatar-option ${selectedAvatarId === null ? 'selected' : ''}`}
      onClick={() => setSelectedAvatarId(null)}
      >
      <div className="avatar-none">Без аватара</div>
      </div>
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
    <button type="submit" className="btn btn-primary">
    Сохранить
    </button>
    <button type="button" onClick={() => navigate(-1)} className="btn">
    Отмена
    </button>
    </div>
    </form>
    </div>
  );
}
