import { useState, useEffect, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import AvatarPickerShell from '../components/AvatarPickerShell';
import UndoToast from '../components/UndoToast';
import ErrorModal from '../components/ErrorModal';
import { saveAvatarRecent } from '../utils/avatarRecents';
import { getAvatarFallbackDataUrl } from '../utils/avatarFallback';
import { resizeAvatarImage } from '../utils/avatarUpload';

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
  const [toastState, setToastState] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [showUploadErrorModal, setShowUploadErrorModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const uploadInputId = useId();

  const navigate = useNavigate();
  const { user } = useAuth();

  // Оставляем только ОДИН useEffect
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true); // Всегда сбрасываем состояние в начале
    setError('');
    try {
      const response = await profileAPI.getProfile();
      const data = response.data;
      setProfile(data);
      setEmail(data.email || '');
      setAvatars(data.avatars || []);
      setActiveAvatarId(data.activeAvatarId || null);
    } catch (err) {
      console.error('Failed to load profile:', err);
      // Если 401 — просто выходим. setLoading(false) сработает в finally
      if (err.response?.status === 401) return;

      setError('Не удалось загрузить профиль');
    } finally {
      setLoading(false); // ГАРАНТИРОВАННО «размораживает» экран
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

  const handleUploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setUploadError('');
    setUploadFile(file);

    try {
      const dataUrl = await resizeAvatarImage(file);
      await profileAPI.addAvatar(dataUrl);
      setSuccess('Аватар загружен');
      fetchProfile();
      setUploadFile(null);
    } catch (err) {
      const message = err.response?.data?.error || 'Ошибка загрузки аватара';
      setError(message);
      setUploadError(message);
      setShowUploadErrorModal(true);
    } finally {
      setUploading(false);
      e.target.value = ''; // Сброс input
    }
  };

  const handleRetryUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadError('');
    try {
      const dataUrl = await resizeAvatarImage(uploadFile);
      await profileAPI.addAvatar(dataUrl);
      setSuccess('Аватар загружен');
      fetchProfile();
      setUploadFile(null);
      setShowUploadErrorModal(false);
    } catch (err) {
      const message = err.response?.data?.error || 'Ошибка загрузки аватара';
      setError(message);
      setUploadError(message);
    } finally {
      setUploading(false);
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
      const previousAvatarId = activeAvatarId;
      await profileAPI.setActiveAvatar(avatarId);
      saveAvatarRecent(avatarId);
      setSuccess('Активный аватар изменён');
      fetchProfile();
      setToastState({ previousAvatarId });
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка установки активного аватара');
    }
  };

  const handleUndoActiveAvatar = async () => {
    if (!toastState) return;
    const { previousAvatarId } = toastState;
    setToastState(null);
    if (!previousAvatarId) return;
    try {
      await profileAPI.setActiveAvatar(previousAvatarId);
      saveAvatarRecent(previousAvatarId);
      setSuccess('Активный аватар изменён');
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка установки активного аватара');
    }
  };

  const handleAvatarError = (event, avatarId) => {
    const target = event.currentTarget;
    if (target.dataset.fallbackApplied) return;
    target.dataset.fallbackApplied = 'true';
    target.src = getAvatarFallbackDataUrl(avatarId);
  };

  const selectedAvatar = avatars.find((avatar) => avatar.avatarId === activeAvatarId) || null;

  if (loading) return <div className="container">Загрузка...</div>;
  if (!profile) return <div className="container">Пожалуйста, войдите заново для загрузки профиля</div>;

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
    {toastState && (
      <UndoToast
      message="Changed"
      onUndo={handleUndoActiveAvatar}
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

    {/* АВАТАРЫ */}
    <section className="profile-section">
    <h2>Аватары ({avatars.length}/50)</h2>

    <AvatarPickerShell
    label="Управление аватарами"
    triggerText="Управлять аватарами"
    selectedAvatar={selectedAvatar}
    selectedAvatarId={activeAvatarId}
    >
    {() => (
      <>
      <div className="avatar-upload avatar-upload-inline">
      <input
      type="file"
      accept="image/*"
      onChange={handleUploadAvatar}
      disabled={uploading || avatars.length >= 50}
      id={uploadInputId}
      style={{ display: 'none' }}
      />
      <label
      htmlFor={uploadInputId}
      className={`btn ${avatars.length > 0 ? '' : 'btn-primary'} ${(uploading || avatars.length >= 50) ? 'disabled' : ''}`}
      >
      {uploading
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

      {avatars.length >= 50 && (
        <p className="warning" style={{ marginTop: '10px' }}>
        Достигнут лимит: 50 аватаров
        </p>
      )}
      </div>

      {avatars.length === 0 && (
        <div className="avatar-empty">Нет аватаров</div>
      )}

      {avatars.length > 0 && (
        <div className="avatars-grid">
        {avatars.map((avatar) => (
          <div
          key={avatar.avatarId}
          className={`avatar-item ${avatar.avatarId === activeAvatarId ? 'active' : ''}`}
          >
          <img
          src={avatar.dataUrl}
          alt="Avatar"
          onError={(event) => handleAvatarError(event, avatar.avatarId)}
          />

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
      </>
    )}
    </AvatarPickerShell>
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
