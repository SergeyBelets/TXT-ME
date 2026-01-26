export default function ErrorModal({ title = 'Ошибка', message, onRetry, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
    <div className="modal-header">
    <h2>{title}</h2>
    <button className="modal-close" onClick={onClose}>×</button>
    </div>

    <p className="modal-description">{message}</p>

    <div className="modal-actions">
    {onRetry && (
      <button type="button" className="btn btn-primary" onClick={onRetry}>
      Повторить
      </button>
    )}
    <button type="button" className="btn" onClick={onClose}>
    Отмена
    </button>
    </div>
    </div>
    </div>
  );
}
