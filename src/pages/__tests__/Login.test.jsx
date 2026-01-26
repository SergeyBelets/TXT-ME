import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils';
import Login from '../Login';
import { authAPI } from '../../services/api';

vi.mock('../../services/api', () => ({
  authAPI: {
    login: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to get form inputs by their label text
const getInputByLabel = (labelText) => {
  const label = screen.getByText(labelText);
  return label.parentElement.querySelector('input');
};

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('rendering', () => {
    it('renders login form', () => {
      renderWithProviders(<Login />);

      expect(screen.getByRole('heading', { name: /вход/i })).toBeInTheDocument();
      expect(screen.getByText('Логин')).toBeInTheDocument();
      expect(screen.getByText('Пароль')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
    });

    it('renders link to registration', () => {
      renderWithProviders(<Login />);

      expect(screen.getByText(/нет аккаунта/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /зарегистрироваться/i })).toHaveAttribute(
        'href',
        '/register'
      );
    });
  });

  describe('form validation', () => {
    it('requires username', () => {
      renderWithProviders(<Login />);

      const usernameInput = getInputByLabel('Логин');
      expect(usernameInput).toBeRequired();
    });

    it('requires password', () => {
      renderWithProviders(<Login />);

      const passwordInput = getInputByLabel('Пароль');
      expect(passwordInput).toBeRequired();
    });
  });

  describe('form submission', () => {
    it('calls authAPI.login with form data', async () => {
      authAPI.login.mockResolvedValue({
        data: {
          token: 'test-token',
          user: { userId: '1', username: 'testuser', role: 'user' },
        },
      });

      renderWithProviders(<Login />);

      fireEvent.change(getInputByLabel('Логин'), {
        target: { value: 'testuser' },
      });
      fireEvent.change(getInputByLabel('Пароль'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /войти/i }));

      await waitFor(() => {
        expect(authAPI.login).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'password123',
        });
      });
    });

    it('shows loading state while submitting', async () => {
      authAPI.login.mockImplementation(() => new Promise(() => {}));

      renderWithProviders(<Login />);

      fireEvent.change(getInputByLabel('Логин'), {
        target: { value: 'testuser' },
      });
      fireEvent.change(getInputByLabel('Пароль'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /войти/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /вход\.\.\./i })).toBeDisabled();
      });
    });

    it('navigates to home on successful login', async () => {
      authAPI.login.mockResolvedValue({
        data: {
          token: 'test-token',
          user: { userId: '1', username: 'testuser', role: 'user' },
        },
      });

      renderWithProviders(<Login />);

      fireEvent.change(getInputByLabel('Логин'), {
        target: { value: 'testuser' },
      });
      fireEvent.change(getInputByLabel('Пароль'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /войти/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('displays error on login failure', async () => {
      authAPI.login.mockRejectedValue({
        response: { data: { error: 'Invalid credentials' } },
      });

      renderWithProviders(<Login />);

      fireEvent.change(getInputByLabel('Логин'), {
        target: { value: 'testuser' },
      });
      fireEvent.change(getInputByLabel('Пароль'), {
        target: { value: 'wrongpassword' },
      });
      fireEvent.click(screen.getByRole('button', { name: /войти/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('displays default error when no error message in response', async () => {
      authAPI.login.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<Login />);

      fireEvent.change(getInputByLabel('Логин'), {
        target: { value: 'testuser' },
      });
      fireEvent.change(getInputByLabel('Пароль'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /войти/i }));

      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      });
    });
  });
});
