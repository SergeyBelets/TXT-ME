import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Test component that uses the auth context
const TestComponent = () => {
  const { user, login, logout, isLoading } = useAuth();
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not loading'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'no user'}</div>
      <button onClick={() => login('test-token', 'user1', 'testuser', 'user')}>
        Login
      </button>
      <button onClick={() => login('jwt-token')}>Login with JWT</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('returns null user when localStorage is empty', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('user')).toHaveTextContent('no user');
    });

    it('restores user from localStorage', () => {
      localStorage.setItem('token', 'stored-token');
      localStorage.setItem('userId', 'stored-user-id');
      localStorage.setItem('username', 'stored-username');
      localStorage.setItem('role', 'admin');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const userText = screen.getByTestId('user').textContent;
      const user = JSON.parse(userText);
      expect(user.token).toBe('stored-token');
      expect(user.userId).toBe('stored-user-id');
      expect(user.username).toBe('stored-username');
      expect(user.role).toBe('admin');
    });

    it('requires token, userId, and username to restore user', () => {
      localStorage.setItem('token', 'stored-token');
      localStorage.setItem('userId', 'stored-user-id');
      // missing username

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('user')).toHaveTextContent('no user');
    });
  });

  describe('login', () => {
    it('sets user with provided data', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      act(() => {
        screen.getByText('Login').click();
      });

      const userText = screen.getByTestId('user').textContent;
      const user = JSON.parse(userText);
      expect(user.token).toBe('test-token');
      expect(user.userId).toBe('user1');
      expect(user.username).toBe('testuser');
      expect(user.role).toBe('user');
    });

    it('stores data in localStorage', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      act(() => {
        screen.getByText('Login').click();
      });

      expect(localStorage.getItem('token')).toBe('test-token');
      expect(localStorage.getItem('userId')).toBe('user1');
      expect(localStorage.getItem('username')).toBe('testuser');
      expect(localStorage.getItem('role')).toBe('user');
    });

    it('parses JWT when userId/username not provided', async () => {
      // Create a valid JWT payload (base64 encoded)
      const payload = { userId: 'jwt-user-id', username: 'jwt-user', role: 'admin' };
      const base64Payload = btoa(JSON.stringify(payload));
      const mockJwt = `header.${base64Payload}.signature`;

      const TestJwtComponent = () => {
        const { user, login } = useAuth();
        return (
          <div>
            <div data-testid="user">{user ? JSON.stringify(user) : 'no user'}</div>
            <button onClick={() => login(mockJwt)}>Login JWT</button>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestJwtComponent />
        </AuthProvider>
      );

      act(() => {
        screen.getByText('Login JWT').click();
      });

      const userText = screen.getByTestId('user').textContent;
      const user = JSON.parse(userText);
      expect(user.userId).toBe('jwt-user-id');
      expect(user.username).toBe('jwt-user');
      expect(user.role).toBe('admin');
    });
  });

  describe('logout', () => {
    it('clears user state', async () => {
      localStorage.setItem('token', 'stored-token');
      localStorage.setItem('userId', 'stored-user-id');
      localStorage.setItem('username', 'stored-username');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('user')).not.toHaveTextContent('no user');

      act(() => {
        screen.getByText('Logout').click();
      });

      expect(screen.getByTestId('user')).toHaveTextContent('no user');
    });

    it('clears localStorage', async () => {
      localStorage.setItem('token', 'stored-token');
      localStorage.setItem('userId', 'stored-user-id');
      localStorage.setItem('username', 'stored-username');
      localStorage.setItem('role', 'admin');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      act(() => {
        screen.getByText('Logout').click();
      });

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('userId')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();
      expect(localStorage.getItem('role')).toBeNull();
    });
  });

  describe('useAuth hook', () => {
    it('throws error when used outside AuthProvider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within AuthProvider');

      consoleError.mockRestore();
    });
  });

  describe('isLoading', () => {
    it('starts as not loading', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('not loading');
    });
  });
});
