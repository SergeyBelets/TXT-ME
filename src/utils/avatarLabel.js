export const getAvatarLabel = (avatarId) => {
  const raw = String(avatarId || '');
  if (!raw) return 'img-unknown';
  return `img-${raw.slice(0, 8)}`;
};
