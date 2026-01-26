import { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';

function AvatarDisplay({ userId, avatarId, username, size = 40 }) {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadAvatar = async () => {
      try {
        const response = await profileAPI.getUserAvatar(userId, avatarId);
        if (isActive && response.data.avatarDataUrl) {
          setAvatarUrl(response.data.avatarDataUrl);
        }
      } catch (err) {
        // If specific avatarId requested but not found, try fetching user's default avatar
        if (avatarId && err.response?.status === 404) {
          try {
            const fallbackResponse = await profileAPI.getUserAvatar(userId, null);
            if (isActive && fallbackResponse.data.avatarDataUrl) {
              setAvatarUrl(fallbackResponse.data.avatarDataUrl);
              return;
            }
          } catch (fallbackErr) {
            console.error('Failed to load fallback avatar:', fallbackErr);
          }
        }
        console.error('Failed to load avatar for userId:', userId, err);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    if (userId) {
      loadAvatar();
    } else {
      setAvatarUrl(null);
      setLoading(false);
    }

    return () => {
      isActive = false;
    };
  }, [userId, avatarId]);

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
      onError={() => setAvatarUrl(null)}
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
