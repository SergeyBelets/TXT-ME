import { describe, it, expect, vi, beforeEach } from 'vitest';
import api, {
  authAPI,
  postsAPI,
  commentsAPI,
  profileAPI,
  setAuthModalHandler,
} from '../api';

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('default export', () => {
    it('exports api instance', () => {
      expect(api).toBeDefined();
    });

    it('api instance has request methods', () => {
      expect(typeof api.get).toBe('function');
      expect(typeof api.post).toBe('function');
      expect(typeof api.put).toBe('function');
      expect(typeof api.delete).toBe('function');
    });

    it('api instance has interceptors', () => {
      expect(api.interceptors).toBeDefined();
      expect(api.interceptors.request).toBeDefined();
      expect(api.interceptors.response).toBeDefined();
    });
  });

  describe('authAPI', () => {
    it('has register method', () => {
      expect(authAPI.register).toBeDefined();
      expect(typeof authAPI.register).toBe('function');
    });

    it('has login method', () => {
      expect(authAPI.login).toBeDefined();
      expect(typeof authAPI.login).toBe('function');
    });
  });

  describe('postsAPI', () => {
    it('has getAll method', () => {
      expect(postsAPI.getAll).toBeDefined();
      expect(typeof postsAPI.getAll).toBe('function');
    });

    it('has getById method', () => {
      expect(postsAPI.getById).toBeDefined();
      expect(typeof postsAPI.getById).toBe('function');
    });

    it('has create method', () => {
      expect(postsAPI.create).toBeDefined();
      expect(typeof postsAPI.create).toBe('function');
    });

    it('has update method', () => {
      expect(postsAPI.update).toBeDefined();
      expect(typeof postsAPI.update).toBe('function');
    });

    it('has delete method', () => {
      expect(postsAPI.delete).toBeDefined();
      expect(typeof postsAPI.delete).toBe('function');
    });
  });

  describe('commentsAPI', () => {
    it('has getByPost method', () => {
      expect(commentsAPI.getByPost).toBeDefined();
      expect(typeof commentsAPI.getByPost).toBe('function');
    });

    it('has create method', () => {
      expect(commentsAPI.create).toBeDefined();
      expect(typeof commentsAPI.create).toBe('function');
    });

    it('has delete method', () => {
      expect(commentsAPI.delete).toBeDefined();
      expect(typeof commentsAPI.delete).toBe('function');
    });

    it('has update method', () => {
      expect(commentsAPI.update).toBeDefined();
      expect(typeof commentsAPI.update).toBe('function');
    });
  });

  describe('profileAPI', () => {
    it('has getProfile method', () => {
      expect(profileAPI.getProfile).toBeDefined();
      expect(typeof profileAPI.getProfile).toBe('function');
    });

    it('has updateEmail method', () => {
      expect(profileAPI.updateEmail).toBeDefined();
      expect(typeof profileAPI.updateEmail).toBe('function');
    });

    it('has deleteEmail method', () => {
      expect(profileAPI.deleteEmail).toBeDefined();
      expect(typeof profileAPI.deleteEmail).toBe('function');
    });

    it('has updatePassword method', () => {
      expect(profileAPI.updatePassword).toBeDefined();
      expect(typeof profileAPI.updatePassword).toBe('function');
    });

    it('has addAvatar method', () => {
      expect(profileAPI.addAvatar).toBeDefined();
      expect(typeof profileAPI.addAvatar).toBe('function');
    });

    it('has deleteAvatar method', () => {
      expect(profileAPI.deleteAvatar).toBeDefined();
      expect(typeof profileAPI.deleteAvatar).toBe('function');
    });

    it('has setActiveAvatar method', () => {
      expect(profileAPI.setActiveAvatar).toBeDefined();
      expect(typeof profileAPI.setActiveAvatar).toBe('function');
    });

    it('has getUserAvatar method', () => {
      expect(profileAPI.getUserAvatar).toBeDefined();
      expect(typeof profileAPI.getUserAvatar).toBe('function');
    });
  });

  describe('setAuthModalHandler', () => {
    it('is a function', () => {
      expect(typeof setAuthModalHandler).toBe('function');
    });

    it('can be called with a handler', () => {
      const handler = vi.fn();
      expect(() => setAuthModalHandler(handler)).not.toThrow();
    });

    it('can be called with null to clear handler', () => {
      expect(() => setAuthModalHandler(null)).not.toThrow();
    });
  });
});
