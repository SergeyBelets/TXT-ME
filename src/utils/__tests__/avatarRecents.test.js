import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAvatarRecents, saveAvatarRecent, resolveAvatarRecents } from '../avatarRecents';

describe('avatarRecents', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getAvatarRecents', () => {
    it('returns empty array when localStorage is empty', () => {
      expect(getAvatarRecents()).toEqual([]);
    });

    it('returns parsed array from localStorage', () => {
      localStorage.setItem('avatarRecents', JSON.stringify(['id1', 'id2']));
      expect(getAvatarRecents()).toEqual(['id1', 'id2']);
    });

    it('filters out falsy values', () => {
      localStorage.setItem('avatarRecents', JSON.stringify(['id1', null, '', 'id2']));
      expect(getAvatarRecents()).toEqual(['id1', 'id2']);
    });

    it('returns empty array for invalid JSON', () => {
      localStorage.setItem('avatarRecents', 'not valid json');
      expect(getAvatarRecents()).toEqual([]);
    });

    it('returns empty array for non-array values', () => {
      localStorage.setItem('avatarRecents', JSON.stringify({ foo: 'bar' }));
      expect(getAvatarRecents()).toEqual([]);
    });
  });

  describe('saveAvatarRecent', () => {
    it('saves new avatar id to front of list', () => {
      const result = saveAvatarRecent('newId');
      expect(result).toEqual(['newId']);
      expect(localStorage.setItem).toHaveBeenCalledWith('avatarRecents', '["newId"]');
    });

    it('moves existing id to front', () => {
      localStorage.setItem('avatarRecents', JSON.stringify(['id1', 'id2', 'id3']));
      const result = saveAvatarRecent('id2');
      expect(result[0]).toBe('id2');
      expect(result).toEqual(['id2', 'id1', 'id3']);
    });

    it('limits to 6 recent items', () => {
      localStorage.setItem('avatarRecents', JSON.stringify(['1', '2', '3', '4', '5', '6']));
      const result = saveAvatarRecent('new');
      expect(result.length).toBe(6);
      expect(result[0]).toBe('new');
      expect(result).not.toContain('6');
    });

    it('returns current recents for empty/null avatarId', () => {
      localStorage.setItem('avatarRecents', JSON.stringify(['id1']));
      expect(saveAvatarRecent('')).toEqual(['id1']);
      expect(saveAvatarRecent(null)).toEqual(['id1']);
    });
  });

  describe('resolveAvatarRecents', () => {
    const mockAvatars = [
      { avatarId: 'id1', name: 'Avatar 1' },
      { avatarId: 'id2', name: 'Avatar 2' },
      { avatarId: 'id3', name: 'Avatar 3' },
    ];

    it('returns avatars matching recent ids in order', () => {
      const result = resolveAvatarRecents(['id2', 'id1'], mockAvatars);
      expect(result).toEqual([
        { avatarId: 'id2', name: 'Avatar 2' },
        { avatarId: 'id1', name: 'Avatar 1' },
      ]);
    });

    it('filters out ids not found in avatars', () => {
      const result = resolveAvatarRecents(['id1', 'nonexistent', 'id3'], mockAvatars);
      expect(result).toEqual([
        { avatarId: 'id1', name: 'Avatar 1' },
        { avatarId: 'id3', name: 'Avatar 3' },
      ]);
    });

    it('returns empty array for invalid inputs', () => {
      expect(resolveAvatarRecents(null, mockAvatars)).toEqual([]);
      expect(resolveAvatarRecents(['id1'], null)).toEqual([]);
      expect(resolveAvatarRecents('not array', mockAvatars)).toEqual([]);
    });
  });
});
