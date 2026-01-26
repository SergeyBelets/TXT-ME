import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AvatarDisplay from '../AvatarDisplay';
import { profileAPI } from '../../services/api';

vi.mock('../../services/api', () => ({
  profileAPI: {
    getUserAvatar: vi.fn(),
  },
}));

describe('AvatarDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows placeholder while loading', () => {
      profileAPI.getUserAvatar.mockImplementation(() => new Promise(() => {}));

      render(<AvatarDisplay userId="123" username="testuser" />);

      const placeholder = document.querySelector('.avatar-placeholder');
      expect(placeholder).toBeInTheDocument();
    });

    it('applies correct size to placeholder', () => {
      profileAPI.getUserAvatar.mockImplementation(() => new Promise(() => {}));

      render(<AvatarDisplay userId="123" username="testuser" size={60} />);

      const placeholder = document.querySelector('.avatar-placeholder');
      expect(placeholder).toHaveStyle({ width: '60px', height: '60px' });
    });
  });

  describe('with avatar data', () => {
    it('shows avatar image when data URL is returned', async () => {
      profileAPI.getUserAvatar.mockResolvedValue({
        data: { avatarDataUrl: 'data:image/png;base64,abc123' },
      });

      render(<AvatarDisplay userId="123" username="testuser" />);

      await waitFor(() => {
        const img = screen.getByAltText("testuser's avatar");
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'data:image/png;base64,abc123');
      });
    });

    it('applies correct size to avatar image', async () => {
      profileAPI.getUserAvatar.mockResolvedValue({
        data: { avatarDataUrl: 'data:image/png;base64,abc123' },
      });

      render(<AvatarDisplay userId="123" username="testuser" size={50} />);

      await waitFor(() => {
        const img = screen.getByAltText("testuser's avatar");
        expect(img).toHaveStyle({ width: '50px', height: '50px' });
      });
    });

    it('passes avatarId to API and displays returned avatar', async () => {
      profileAPI.getUserAvatar.mockResolvedValue({
        data: { avatarDataUrl: 'data:image/png;base64,specific' },
      });

      render(<AvatarDisplay userId="123" avatarId="av2" username="testuser" />);

      await waitFor(() => {
        expect(profileAPI.getUserAvatar).toHaveBeenCalledWith('123', 'av2');
        const img = screen.getByAltText("testuser's avatar");
        expect(img).toHaveAttribute('src', 'data:image/png;base64,specific');
      });
    });
  });

  describe('fallback to default avatar', () => {
    it('shows default avatar when no data URL', async () => {
      profileAPI.getUserAvatar.mockResolvedValue({
        data: {},
      });

      render(<AvatarDisplay userId="123" username="testuser" />);

      await waitFor(() => {
        const defaultAvatar = document.querySelector('.avatar-default');
        expect(defaultAvatar).toBeInTheDocument();
        expect(defaultAvatar).toHaveTextContent('T');
      });
    });

    it('shows default avatar on API error', async () => {
      profileAPI.getUserAvatar.mockRejectedValue(new Error('Network error'));

      render(<AvatarDisplay userId="123" username="testuser" />);

      await waitFor(() => {
        const defaultAvatar = document.querySelector('.avatar-default');
        expect(defaultAvatar).toBeInTheDocument();
      });
    });

    it('falls back to user default avatar when specific avatarId returns 404', async () => {
      const error404 = new Error('Not found');
      error404.response = { status: 404 };
      profileAPI.getUserAvatar
        .mockRejectedValueOnce(error404)
        .mockResolvedValueOnce({
          data: { avatarDataUrl: 'data:image/png;base64,default123' },
        });

      render(<AvatarDisplay userId="123" avatarId="deleted-av" username="testuser" />);

      await waitFor(() => {
        expect(profileAPI.getUserAvatar).toHaveBeenCalledTimes(2);
        expect(profileAPI.getUserAvatar).toHaveBeenNthCalledWith(1, '123', 'deleted-av');
        expect(profileAPI.getUserAvatar).toHaveBeenNthCalledWith(2, '123', null);
        const img = screen.getByAltText("testuser's avatar");
        expect(img).toHaveAttribute('src', 'data:image/png;base64,default123');
      });
    });

    it('shows letter fallback when both specific and default avatar requests fail', async () => {
      const error404 = new Error('Not found');
      error404.response = { status: 404 };
      profileAPI.getUserAvatar
        .mockRejectedValueOnce(error404)
        .mockRejectedValueOnce(new Error('Network error'));

      render(<AvatarDisplay userId="123" avatarId="deleted-av" username="testuser" />);

      await waitFor(() => {
        expect(profileAPI.getUserAvatar).toHaveBeenCalledTimes(2);
        const defaultAvatar = document.querySelector('.avatar-default');
        expect(defaultAvatar).toBeInTheDocument();
        expect(defaultAvatar).toHaveTextContent('T');
      });
    });

    it('shows ? when username is empty', async () => {
      profileAPI.getUserAvatar.mockResolvedValue({
        data: {},
      });

      render(<AvatarDisplay userId="123" username="" />);

      await waitFor(() => {
        const defaultAvatar = document.querySelector('.avatar-default');
        expect(defaultAvatar).toHaveTextContent('?');
      });
    });

    it('applies correct size to default avatar', async () => {
      profileAPI.getUserAvatar.mockResolvedValue({
        data: {},
      });

      render(<AvatarDisplay userId="123" username="testuser" size={80} />);

      await waitFor(() => {
        const defaultAvatar = document.querySelector('.avatar-default');
        expect(defaultAvatar).toHaveStyle({ width: '80px', height: '80px' });
      });
    });
  });

  describe('no userId', () => {
    it('shows default avatar when userId is not provided', async () => {
      render(<AvatarDisplay username="testuser" />);

      await waitFor(() => {
        const defaultAvatar = document.querySelector('.avatar-default');
        expect(defaultAvatar).toBeInTheDocument();
      });
    });

    it('does not call API when userId is not provided', () => {
      render(<AvatarDisplay username="testuser" />);

      expect(profileAPI.getUserAvatar).not.toHaveBeenCalled();
    });
  });

  describe('default size', () => {
    it('uses default size of 40 when not specified', async () => {
      profileAPI.getUserAvatar.mockResolvedValue({
        data: { avatarDataUrl: 'data:image/png;base64,abc123' },
      });

      render(<AvatarDisplay userId="123" username="testuser" />);

      await waitFor(() => {
        const img = screen.getByAltText("testuser's avatar");
        expect(img).toHaveStyle({ width: '40px', height: '40px' });
      });
    });
  });
});
