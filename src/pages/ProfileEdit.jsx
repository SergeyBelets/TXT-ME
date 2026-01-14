import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileAPI } from '../services/api';

export default function ProfileEdit() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Email
  const [email, setEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Password
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Avatars
  const [avatars, setAvatars] = useState([]);
  const [activeAvatarId, setActiveAvatarId] = useState(null);
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await profileAPI.getProfile();
      const data = response.data;
      setProfile(data);
      setEmail(data.email || '');
      setAvatars(data.avatars || []);
      setActiveAvatarId(data.activeAvatarId || null);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Не удалось загрузить профиль');
    } finally {
      setLoading(false);
    }
  };

  // ============ EMAIL ============
  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await profileAPI.updateEmail(email);
      setSuccess('Email обновлён');
      setShowEmailForm(false);
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка обновления email');
    }
  };

  const handleDeleteEmail = async () => {
    if (!confirm('Удалить email из профиля?')) return;

    try {
      await profileAPI.deleteEmail();
      setSuccess('Email удалён');
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка удаления email');
    }
  };

  // ============ PASSWORD ============
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (newPassword.length < 8) {
      setError('Пароль должен быть не менее 8 символов');
      return;
    }

    try {
      await profileAPI.updatePassword(oldPassword, newPassword);
      setSuccess('Пароль обновлён. Перенаправление...');

      setTimeout(() => {
        localStorage.removeItem('token');
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка смены пароля');
    }
  };

  // ============ AVATARS ============

  // Ресайз изображения в 50x50
  const resizeImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 50;
          canvas.height = 50;
          const ctx = canvas.getContext('2d');

          // Масштабируем с сохранением пропорций и центрируем
          const scale = Math.max(50 / img.width, 50 / img.height);
          const x = (50 / 2) - (img.width / 2) * scale;
          const y = (50 / 2) - (img.height / 2) * scale;

          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };

        img.onerror = reject;
        img.src = e.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const dataUrl = await resizeImage(file);
      await profileAPI.addAvatar(dataUrl);
      setSuccess('Аватар загружен');
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка загрузки аватара');
    } finally {
      setUploading(false);
      e.target.value = ''; // Сброс input
    }
  };

  const handleDeleteAvatar = async (avatarId) => {
    if (!confirm('Удалить этот аватар?')) return;

    try {
      await profileAPI.deleteAvatar(avatarId);
      setSuccess('Аватар удалён');
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка удаления аватара');
    }
  };

  const handleSetActive = async (avatarId) => {
    try {
      await profileAPI.setActiveAvatar(avatarId);
      setSuccess('Активный аватар изменён');
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка установки активного аватара');
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="profile-edit">
    <h1>Редактирование профиля</h1>

    {error && <div className="error">{error}</div>}
    {success && <div className="success">{success}</div>}

    {/* ОСНОВНАЯ ИНФОРМАЦИЯ */}
    <section className="profile-section">
    <h2>Основная информация</h2>
    <div className="profile-info">
    <p><strong>Username:</strong> {profile.username}</p>
    <p><strong>Роль:</strong> {profile.role}</p>
    <p><strong>Дата регистрации:</strong> {new Date(profile.createdAt).toLocaleDateString('ru-RU')}</p>
    </div>
    </section>

    {/* АВАТАРЫ */}
    <section className="profile-section">
    <h2>Аватары ({avatars.length}/50)</h2>

    <div className="avatar-upload">
    <input
    type="file"
    accept="image/*"
    onChange={handleUploadAvatar}
    disabled={uploading || avatars.length >= 50}
    id="avatar-input"
    style={{ display: 'none' }}
    />
    <label
    htmlFor="avatar-input"
    className={`btn btn-primary ${(uploading || avatars.length >= 50) ? 'disabled' : ''}`}
    >
    {uploading ? '⏳ Загрузка...' : '➕ Загрузить аватар'}
    </label>

    {avatars.length >= 50 && (
      <p className="warning" style={{ marginTop: '10px' }}>
      Достигнут лимит: 50 аватаров
      </p>
    )}
    </div>

    {avatars.length > 0 && (
      <div className="avatars-grid">
      {avatars.map((avatar) => (
        <div
        key={avatar.avatarId}
        className={`avatar-item ${avatar.avatarId === activeAvatarId ? 'active' : ''}`}
        >
        <img src={avatar.dataUrl} alt="Avatar" />

        {avatar.avatarId === activeAvatarId ? (
          <div className="avatar-badge">✓ Активный</div>
        ) : (
          <div className="avatar-actions">
          <button
          onClick={() => handleSetActive(avatar.avatarId)}
          className="btn-small"
          >
          Активировать
          </button>
          <button
          onClick={() => handleDeleteAvatar(avatar.avatarId)}
          className="btn-small btn-danger"
          >
          Удалить
          </button>
          </div>
        )}
        </div>
      ))}
      </div>
    )}
    </section>

    {/* EMAIL */}
    <section className="profile-section">
    <h2>Email</h2>

    {!profile.email && !showEmailForm && (
      <p className="warning">Email не указан. Рекомендуем добавить для восстановления доступа.</p>
    )}

    {profile.email && !showEmailForm && (
      <div>
      <p>Текущий email: <strong>{profile.email}</strong></p>
      <button onClick={() => setShowEmailForm(true)} className="btn">
      Изменить email
      </button>
      <button onClick={handleDeleteEmail} className="btn btn-danger">
      Удалить email
      </button>
      </div>
    )}

    {(!profile.email || showEmailForm) && (
      <form onSubmit={handleUpdateEmail}>
      <input
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="your@email.com"
      required
      />
      <button type="submit" className="btn btn-primary">
      Сохранить
      </button>
      {showEmailForm && (
        <button
        type="button"
        onClick={() => setShowEmailForm(false)}
        className="btn"
        >
        Отмена
        </button>
      )}
      </form>
    )}
    </section>

    {/* PASSWORD */}
    <section className="profile-section">
    <h2>Пароль</h2>

    {!showPasswordForm ? (
      <button onClick={() => setShowPasswordForm(true)} className="btn">
      Изменить пароль
      </button>
    ) : (
      <form onSubmit={handleUpdatePassword}>
      <input
      type="password"
      value={oldPassword}
      onChange={(e) => setOldPassword(e.target.value)}
      placeholder="Текущий пароль"
      required
      />
      <input
      type="password"
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
      placeholder="Новый пароль (мин. 8 символов)"
      required
      />
      <input
      type="password"
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      placeholder="Подтвердите новый пароль"
      required
      />
      <button type="submit" className="btn btn-primary">
      Сменить пароль
      </button>
      <button
      type="button"
      onClick={() => setShowPasswordForm(false)}
      className="btn"
      >
      Отмена
      </button>
      </form>
    )}
    </section>
    </div>
  );
}
