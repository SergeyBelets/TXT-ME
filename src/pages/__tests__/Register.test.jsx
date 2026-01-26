import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderWithRouter } from '../../test/utils';
import Register from '../Register';
import { authAPI } from '../../services/api';

vi.mock('../../services/api', () => ({
  authAPI: {
    register: vi.fn(),
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
  const label = screen.getByText(labelText, { exact: false });
  return label.parentElement.querySelector('input');
};

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders registration form', () => {
      renderWithRouter(<Register />);

      expect(screen.getByRole('heading', { name: /регистрация/i })).toBeInTheDocument();
      expect(screen.getByText(/username/i)).toBeInTheDocument();
      expect(screen.getByText(/email/i)).toBeInTheDocument();
      expect(screen.getByText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /зарегистрироваться/i })).toBeInTheDocument();
    });

    it('renders link to login', () => {
      renderWithRouter(<Register />);

      expect(screen.getByText(/уже есть аккаунт/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /войти/i })).toHaveAttribute('href', '/login');
    });
  });

  describe('form validation', () => {
    it('requires username', () => {
      renderWithRouter(<Register />);

      const usernameInput = getInputByLabel('Username');
      expect(usernameInput).toBeRequired();
    });

    it('requires password', () => {
      renderWithRouter(<Register />);

      const passwordInput = getInputByLabel('Password');
      expect(passwordInput).toBeRequired();
    });

    it('email is optional', () => {
      renderWithRouter(<Register />);

      const emailInput = getInputByLabel('Email');
      expect(emailInput).not.toBeRequired();
    });

    it('password has minimum length', () => {
      renderWithRouter(<Register />);

      const passwordInput = getInputByLabel('Password');
      expect(passwordInput).toHaveAttribute('minLength', '6');
    });
  });

  describe('form submission', () => {
    it('calls authAPI.register with form data', async () => {
      authAPI.register.mockResolvedValue({
        data: { message: 'Registration successful' },
      });

      renderWithRouter(<Register />);

      fireEvent.change(getInputByLabel('Username'), {
        target: { value: 'newuser' },
      });
      fireEvent.change(getInputByLabel('Email'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(getInputByLabel('Password'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

      await waitFor(() => {
        expect(authAPI.register).toHaveBeenCalledWith({
          username: 'newuser',
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('generates fake email when email is empty', async () => {
      authAPI.register.mockResolvedValue({
        data: { message: 'Registration successful' },
      });

      renderWithRouter(<Register />);

      fireEvent.change(getInputByLabel('Username'), {
        target: { value: 'newuser' },
      });
      fireEvent.change(getInputByLabel('Password'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

      await waitFor(() => {
        expect(authAPI.register).toHaveBeenCalledWith({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
        });
      });
    });

    it('shows loading state while submitting', async () => {
      authAPI.register.mockImplementation(() => new Promise(() => {}));

      renderWithRouter(<Register />);

      fireEvent.change(getInputByLabel('Username'), {
        target: { value: 'newuser' },
      });
      fireEvent.change(getInputByLabel('Password'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /загрузка/i })).toBeDisabled();
      });
    });

    it('shows success message on successful registration', async () => {
      authAPI.register.mockResolvedValue({
        data: { message: 'User created successfully' },
      });

      renderWithRouter(<Register />);

      fireEvent.change(getInputByLabel('Username'), {
        target: { value: 'newuser' },
      });
      fireEvent.change(getInputByLabel('Password'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

      await waitFor(() => {
        expect(screen.getByText('User created successfully')).toBeInTheDocument();
      });
    });

    it('navigates to login after successful registration', async () => {
      vi.useFakeTimers();

      authAPI.register.mockResolvedValue({
        data: { message: 'Registration successful' },
      });

      renderWithRouter(<Register />);

      fireEvent.change(getInputByLabel('Username'), {
        target: { value: 'newuser' },
      });
      fireEvent.change(getInputByLabel('Password'), {
        target: { value: 'password123' },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));
      });

      // Wait for the register call to complete
      await act(async () => {
        await Promise.resolve();
      });

      // Advance timers for the setTimeout in the component
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/login');

      vi.useRealTimers();
    });

    it('displays error on registration failure', async () => {
      authAPI.register.mockRejectedValue({
        response: { data: { error: 'Username already exists' } },
      });

      renderWithRouter(<Register />);

      fireEvent.change(getInputByLabel('Username'), {
        target: { value: 'existinguser' },
      });
      fireEvent.change(getInputByLabel('Password'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

      await waitFor(() => {
        expect(screen.getByText('Username already exists')).toBeInTheDocument();
      });
    });

    it('displays default error when no error message in response', async () => {
      authAPI.register.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<Register />);

      fireEvent.change(getInputByLabel('Username'), {
        target: { value: 'newuser' },
      });
      fireEvent.change(getInputByLabel('Password'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

      await waitFor(() => {
        expect(screen.getByText('Registration failed')).toBeInTheDocument();
      });
    });
  });
});
