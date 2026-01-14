import { useState, useRef } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

function MarkdownEditor({ value, onChange, placeholder = "Введите текст..." }) {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef(null);

  // Функция вставки Markdown разметки
  const insertMarkdown = (before, after = before) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    // Если текст выделен - оборачиваем, если нет - вставляем с placeholder
    const newText = selectedText || 'текст';
    const result = beforeText + before + newText + after + afterText;

    onChange(result);

    // Возвращаем фокус и устанавливаем курсор
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + newText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Вставка ссылки
  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    const linkText = selectedText || 'текст ссылки';
    const result = beforeText + `[${linkText}](https://example.com)` + afterText;

    onChange(result);

    setTimeout(() => {
      textarea.focus();
      // Выделяем URL для быстрой замены
      const urlStart = start + linkText.length + 3;
      const urlEnd = urlStart + 19; // длина "https://example.com"
      textarea.setSelectionRange(urlStart, urlEnd);
    }, 0);
  };

  return (
    <div className="markdown-editor">
      {/* Табы */}
      <div className="editor-tabs">
        <button
          type="button"
          className={!showPreview ? 'active' : ''}
          onClick={() => setShowPreview(false)}
        >
          ✍️ Редактор
        </button>
        <button
          type="button"
          className={showPreview ? 'active' : ''}
          onClick={() => setShowPreview(true)}
        >
          👁️ Предпросмотр
        </button>
      </div>

      {!showPreview ? (
        <>
          {/* Панель кнопок форматирования */}
          <div className="markdown-toolbar">
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => insertMarkdown('**')}
              title="Жирный (Bold)"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => insertMarkdown('*')}
              title="Курсив (Italic)"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => insertMarkdown('~~')}
              title="Зачёркнутый"
            >
              <s>S</s>
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => insertMarkdown('<u>', '</u>')}
              title="Подчёркнутый"
            >
              <u>U</u>
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={insertLink}
              title="Ссылка"
            >
              🔗
            </button>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="markdown-textarea"
          />
        </>
      ) : (
        <div className="markdown-preview">
          <MarkdownRenderer content={value || '*Текст будет отображаться здесь*'} />
        </div>
      )}
    </div>
  );
}

export default MarkdownEditor;
