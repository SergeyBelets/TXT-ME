import { useEffect } from 'react';

export default function UndoToast({ message = 'Changed', duration = 5000, onUndo, onClose }) {
  useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="undo-toast" role="status" aria-live="polite">
    <span>{message}</span>
    <div className="undo-toast-actions">
    <button type="button" className="btn btn-small" onClick={onUndo}>
    Undo
    </button>
    <button type="button" className="undo-toast-close" onClick={onClose} aria-label="Close">
    ×
    </button>
    </div>
    </div>
  );
}
