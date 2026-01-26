import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorModal from '../ErrorModal';

describe('ErrorModal', () => {
  it('renders title and message', () => {
    render(
      <ErrorModal
        title="Test Error"
        message="Something went wrong"
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Test Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('uses default title when not provided', () => {
    render(
      <ErrorModal
        message="Error message"
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Ошибка')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <ErrorModal
        message="Error message"
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByText('×'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    render(
      <ErrorModal
        message="Error message"
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }).closest('.modal-overlay'));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not call onClose when modal content is clicked', () => {
    const onClose = vi.fn();
    render(
      <ErrorModal
        message="Error message"
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByText('Error message'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(
      <ErrorModal
        message="Error message"
        onClose={() => {}}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Повторить')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Повторить'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not show retry button when onRetry is not provided', () => {
    render(
      <ErrorModal
        message="Error message"
        onClose={() => {}}
      />
    );

    expect(screen.queryByText('Повторить')).not.toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(
      <ErrorModal
        message="Error message"
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByText('Отмена'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
