import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MarkdownEditor from '../MarkdownEditor';

const renderWithRouter = (ui) => {
  return render(
    <MemoryRouter>
      {ui}
    </MemoryRouter>
  );
};

describe('MarkdownEditor', () => {
  describe('tabs', () => {
    it('renders editor tab as active by default', () => {
      renderWithRouter(<MarkdownEditor value="" onChange={() => {}} />);

      const editorTab = screen.getByRole('button', { name: /редактор/i });
      expect(editorTab).toHaveClass('active');
    });

    it('switches to preview tab when clicked', () => {
      renderWithRouter(<MarkdownEditor value="test content" onChange={() => {}} />);

      const previewTab = screen.getByRole('button', { name: /предпросмотр/i });
      fireEvent.click(previewTab);

      expect(previewTab).toHaveClass('active');
      expect(screen.getByText('test content')).toBeInTheDocument();
    });

    it('switches back to editor tab', () => {
      renderWithRouter(<MarkdownEditor value="test content" onChange={() => {}} />);

      const previewTab = screen.getByRole('button', { name: /предпросмотр/i });
      const editorTab = screen.getByRole('button', { name: /редактор/i });

      fireEvent.click(previewTab);
      fireEvent.click(editorTab);

      expect(editorTab).toHaveClass('active');
    });
  });

  describe('textarea', () => {
    it('renders textarea with value', () => {
      renderWithRouter(<MarkdownEditor value="Hello world" onChange={() => {}} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Hello world');
    });

    it('renders textarea with placeholder', () => {
      renderWithRouter(
        <MarkdownEditor
          value=""
          onChange={() => {}}
          placeholder="Write something..."
        />
      );

      const textarea = screen.getByPlaceholderText('Write something...');
      expect(textarea).toBeInTheDocument();
    });

    it('calls onChange when text is entered', () => {
      const onChange = vi.fn();
      renderWithRouter(<MarkdownEditor value="" onChange={onChange} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'new text' } });

      expect(onChange).toHaveBeenCalledWith('new text');
    });

    it('uses default placeholder when not provided', () => {
      renderWithRouter(<MarkdownEditor value="" onChange={() => {}} />);

      const textarea = screen.getByPlaceholderText('Введите текст...');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('toolbar', () => {
    it('renders all formatting buttons', () => {
      renderWithRouter(<MarkdownEditor value="" onChange={() => {}} />);

      expect(screen.getByTitle('Жирный (Bold)')).toBeInTheDocument();
      expect(screen.getByTitle('Курсив (Italic)')).toBeInTheDocument();
      expect(screen.getByTitle('Зачёркнутый')).toBeInTheDocument();
      expect(screen.getByTitle('Подчёркнутый')).toBeInTheDocument();
      expect(screen.getByTitle('Ссылка')).toBeInTheDocument();
    });

    it('hides toolbar in preview mode', () => {
      renderWithRouter(<MarkdownEditor value="" onChange={() => {}} />);

      const previewTab = screen.getByRole('button', { name: /предпросмотр/i });
      fireEvent.click(previewTab);

      expect(screen.queryByTitle('Жирный (Bold)')).not.toBeInTheDocument();
    });
  });

  describe('preview', () => {
    it('shows placeholder text in preview when value is empty', () => {
      renderWithRouter(<MarkdownEditor value="" onChange={() => {}} />);

      const previewTab = screen.getByRole('button', { name: /предпросмотр/i });
      fireEvent.click(previewTab);

      expect(screen.getByText(/текст будет отображаться здесь/i)).toBeInTheDocument();
    });

    it('renders markdown in preview mode', () => {
      renderWithRouter(<MarkdownEditor value="**bold text**" onChange={() => {}} />);

      const previewTab = screen.getByRole('button', { name: /предпросмотр/i });
      fireEvent.click(previewTab);

      expect(screen.getByText('bold text')).toBeInTheDocument();
    });
  });
});
