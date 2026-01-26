import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import UndoToast from '../UndoToast';

describe('UndoToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders message', () => {
    render(
      <UndoToast
        message="Item deleted"
        onUndo={() => {}}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Item deleted')).toBeInTheDocument();
  });

  it('uses default message when not provided', () => {
    render(
      <UndoToast
        onUndo={() => {}}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Changed')).toBeInTheDocument();
  });

  it('calls onUndo when Undo button is clicked', () => {
    const onUndo = vi.fn();
    render(
      <UndoToast
        message="Item deleted"
        onUndo={onUndo}
        onClose={() => {}}
      />
    );

    fireEvent.click(screen.getByText('Undo'));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <UndoToast
        message="Item deleted"
        onUndo={() => {}}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('auto-closes after duration', () => {
    const onClose = vi.fn();
    render(
      <UndoToast
        message="Item deleted"
        duration={5000}
        onUndo={() => {}}
        onClose={onClose}
      />
    );

    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not auto-close when duration is 0', () => {
    const onClose = vi.fn();
    render(
      <UndoToast
        message="Item deleted"
        duration={0}
        onUndo={() => {}}
        onClose={onClose}
      />
    );

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('has correct accessibility attributes', () => {
    render(
      <UndoToast
        message="Item deleted"
        onUndo={() => {}}
        onClose={() => {}}
      />
    );

    const toast = screen.getByRole('status');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });

  it('clears timeout on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <UndoToast
        message="Item deleted"
        duration={5000}
        onUndo={() => {}}
        onClose={onClose}
      />
    );

    unmount();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
