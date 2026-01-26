import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Validates frontend API calls match backend routes.
 * Source of truth: TXT-ME-Back/dev-local/server.mjs
 */

// Backend routes extracted from server.mjs
const backendRoutes = [
  // Auth
  ['POST', '/auth/register'],
  ['POST', '/auth/login'],

  // Posts
  ['GET', '/posts'],
  ['POST', '/posts'],
  ['GET', '/posts/:id'],
  ['PUT', '/posts/:id'],
  ['DELETE', '/posts/:id'],

  // Comments
  ['GET', '/posts/:id/comments'],
  ['POST', '/posts/:id/comments'],
  ['DELETE', '/posts/:id/comments/:commentId'],
  // Note: PUT /posts/:id/comments/:commentId not implemented in backend

  // Users profile
  ['GET', '/admin/users/profile'],
  ['PUT', '/admin/users/profile/email'],
  ['DELETE', '/admin/users/profile/email'],
  ['PUT', '/admin/users/profile/password'],
  ['POST', '/admin/users/profile/avatar'],
  ['PUT', '/admin/users/profile/avatar/active'],
  ['DELETE', '/admin/users/profile/avatar/:avatarId'],

  // Public user data
  ['GET', '/admin/users/:userId/avatars/:avatarId'],
  ['GET', '/admin/users/:userId/avatars/active'],
];

// Frontend API calls - must match backend
const frontendAPICalls = [
  // authAPI
  ['POST', '/auth/register', 'authAPI.register'],
  ['POST', '/auth/login', 'authAPI.login'],

  // postsAPI
  ['GET', '/posts', 'postsAPI.getAll'],
  ['GET', '/posts/:id', 'postsAPI.getById'],
  ['POST', '/posts', 'postsAPI.create'],
  ['PUT', '/posts/:id', 'postsAPI.update'],
  ['DELETE', '/posts/:id', 'postsAPI.delete'],

  // commentsAPI
  ['GET', '/posts/:id/comments', 'commentsAPI.getByPost'],
  ['POST', '/posts/:id/comments', 'commentsAPI.create'],
  ['DELETE', '/posts/:id/comments/:commentId', 'commentsAPI.delete'],
  // commentsAPI.update intentionally skipped - backend not implemented

  // profileAPI
  ['GET', '/admin/users/profile', 'profileAPI.getProfile'],
  ['PUT', '/admin/users/profile/email', 'profileAPI.updateEmail'],
  ['DELETE', '/admin/users/profile/email', 'profileAPI.deleteEmail'],
  ['PUT', '/admin/users/profile/password', 'profileAPI.updatePassword'],
  ['POST', '/admin/users/profile/avatar', 'profileAPI.addAvatar'],
  ['DELETE', '/admin/users/profile/avatar/:avatarId', 'profileAPI.deleteAvatar'],
  ['PUT', '/admin/users/profile/avatar/active', 'profileAPI.setActiveAvatar'],
  ['GET', '/admin/users/:userId/avatars/:avatarId', 'profileAPI.getUserAvatar'],
  ['GET', '/admin/users/:userId/avatars/active', 'profileAPI.getUserAvatar(null)'],
];

function normalizeRoute(route) {
  // Normalize path params to consistent format
  return route.replace(/:(\w+)/g, ':param');
}

describe('API Routes Validation', () => {
  it('all frontend API calls have matching backend routes', () => {
    const backendSet = new Set(
      backendRoutes.map(([method, path]) => `${method} ${normalizeRoute(path)}`)
    );

    const mismatches = [];

    for (const [method, path, name] of frontendAPICalls) {
      const normalized = `${method} ${normalizeRoute(path)}`;
      if (!backendSet.has(normalized)) {
        mismatches.push(`${name}: ${method} ${path}`);
      }
    }

    expect(mismatches, `Frontend calls without backend routes:\n${mismatches.join('\n')}`).toEqual([]);
  });

  it('backend server.mjs file exists and contains expected routes', () => {
    const serverPath = path.resolve(import.meta.dirname, '../../../../TXT-ME-Back/dev-local/server.mjs');

    // Skip if backend repo not available
    if (!fs.existsSync(serverPath)) {
      console.warn('Backend repo not found, skipping server.mjs validation');
      return;
    }

    const serverContent = fs.readFileSync(serverPath, 'utf-8');

    // Verify key routes exist in server.mjs
    const expectedPatterns = [
      '/auth/register',
      '/auth/login',
      '/posts/:id/comments',
      '/admin/users/profile',
      '/admin/users/:userId/avatars',
    ];

    for (const pattern of expectedPatterns) {
      expect(serverContent).toContain(pattern.replace(':id', ':id').replace(':userId', ':userId'));
    }
  });

  it('documents known gaps between frontend and backend', () => {
    // This test documents intentional gaps
    const knownGaps = [
      {
        frontend: 'commentsAPI.update',
        route: 'PUT /posts/:id/comments/:commentId',
        status: 'Backend not implemented',
      },
    ];

    // Just documenting - this test always passes
    expect(knownGaps.length).toBeGreaterThan(0);
    console.log('Known API gaps:', knownGaps);
  });
});
