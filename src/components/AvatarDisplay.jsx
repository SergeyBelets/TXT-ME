import { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';

function AvatarDisplay({ userId, avatarId, username, size = 40 }) {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadAvatar();
    } else {
      setLoading(false);
    }
  }, [userId, avatarId]);

  const loadAvatar = async () => {
    try {
      const response = await profileAPI.getUserAvatar(userId);
      const userData = response.data;

      // Если указан конкретный avatarId - ищем его
      if (avatarId && userData.avatars && userData.avatars.length > 0) {
        const avatar = userData.avatars.find(a => a.avatarId === avatarId);
        if (avatar && avatar.dataUrl) {
          setAvatarUrl(avatar.dataUrl);
          setLoading(false);
          return;
        }
      }

      // Иначе берём активный аватар пользователя
      if (userData.avatarDataUrl) {
        setAvatarUrl(userData.avatarDataUrl);
      }

    } catch (err) {
      console.error('Failed to load avatar for userId:', userId, err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
      className="avatar-placeholder"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: 'var(--secondary)',
            borderRadius: '50%',
      }}
      />
    );
  }

  if (avatarUrl) {
    return (
      <img
      src={avatarUrl}
      alt={`${username}'s avatar`}
      className="user-avatar"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        objectFit: 'cover',
      }}
      />
    );
  }

  // Дефолтная иконка с первой буквой username
  return (
    <div
    className="avatar-default"
    style={{
      width: `${size}px`,
      height: `${size}px`,
      background: 'var(--blue)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: `${size * 0.5}px`,
    }}
    >
    {username ? username[0].toUpperCase() : '?'}
    </div>
  );
}

export default AvatarDisplay;
