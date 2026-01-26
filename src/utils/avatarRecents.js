const STORAGE_KEY = 'avatarRecents';
const MAX_RECENTS = 6;

export const getAvatarRecents = () => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

export const saveAvatarRecent = (avatarId) => {
  if (!avatarId) return getAvatarRecents();

  const current = getAvatarRecents();
  const next = [avatarId, ...current.filter((id) => id !== avatarId)].slice(0, MAX_RECENTS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return next;
  }

  return next;
};

export const resolveAvatarRecents = (recentIds, avatars) => {
  if (!Array.isArray(recentIds) || !Array.isArray(avatars)) return [];
  const avatarMap = new Map(avatars.map((avatar) => [avatar.avatarId, avatar]));
  return recentIds.map((id) => avatarMap.get(id)).filter(Boolean);
};
