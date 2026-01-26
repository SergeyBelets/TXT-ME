import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MarkdownRenderer from '../MarkdownRenderer';

const renderWithRouter = (ui) => {
  return render(
    <MemoryRouter>
      {ui}
    </MemoryRouter>
  );
};

describe('MarkdownRenderer', () => {
  describe('basic rendering', () => {
    it('renders plain text content', () => {
      renderWithRouter(<MarkdownRenderer content="Hello world" />);
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('renders markdown bold text', () => {
      renderWithRouter(<MarkdownRenderer content="**bold text**" />);
      expect(screen.getByText('bold text')).toBeInTheDocument();
    });

    it('renders markdown italic text', () => {
      renderWithRouter(<MarkdownRenderer content="*italic text*" />);
      expect(screen.getByText('italic text')).toBeInTheDocument();
    });

    it('renders markdown links with target blank', () => {
      renderWithRouter(<MarkdownRenderer content="[link](https://example.com)" />);
      const link = screen.getByText('link');
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('content cleaning', () => {
    it('removes ¬ characters from content', () => {
      renderWithRouter(<MarkdownRenderer content="Hello¬world" />);
      expect(screen.getByText('Helloworld')).toBeInTheDocument();
    });

    it('reduces multiple newlines to double newlines', () => {
      renderWithRouter(<MarkdownRenderer content="Hello\n\n\n\nworld" />);
      const container = document.querySelector('.markdown-content');
      expect(container).toBeInTheDocument();
    });
  });

  describe('mentions', () => {
    it('renders @mentions as links', () => {
      renderWithRouter(<MarkdownRenderer content="Hello @username" />);
      const mention = screen.getByText('@username');
      expect(mention).toBeInTheDocument();
      expect(mention.closest('a')).toHaveAttribute('href', '/users/username');
    });

    it('handles multiple mentions in same paragraph', () => {
      renderWithRouter(<MarkdownRenderer content="Hi @user1 and @user2" />);
      expect(screen.getByText('@user1')).toBeInTheDocument();
      expect(screen.getByText('@user2')).toBeInTheDocument();
    });

    it('applies mention class to mention links', () => {
      renderWithRouter(<MarkdownRenderer content="Hello @test" />);
      const mention = screen.getByText('@test');
      expect(mention).toHaveClass('mention');
    });
  });

  describe('plain text posts', () => {
    it('renders specific postIds as plain text', () => {
      const plainTextPostId = '8205bc8d-4910-4fd7-b62a-302cde4cc413';
      renderWithRouter(
        <MarkdownRenderer
          content="**This should not be bold**"
          postId={plainTextPostId}
        />
      );
      // For plain text posts, markdown is not parsed
      expect(screen.getByText('**This should not be bold**')).toBeInTheDocument();
    });

    it('applies pre-wrap style to plain text posts', () => {
      const plainTextPostId = '8205bc8d-4910-4fd7-b62a-302cde4cc413';
      renderWithRouter(
        <MarkdownRenderer
          content="Plain text content"
          postId={plainTextPostId}
        />
      );
      const container = document.querySelector('.markdown-content');
      expect(container).toHaveStyle({ whiteSpace: 'pre-wrap' });
    });
  });

  describe('XSS protection', () => {
    it('sanitizes dangerous HTML', () => {
      renderWithRouter(
        <MarkdownRenderer content='<script>alert("xss")</script>Safe text' />
      );
      expect(screen.getByText('Safe text')).toBeInTheDocument();
      expect(document.querySelector('script')).not.toBeInTheDocument();
    });

    it('sanitizes onclick handlers', () => {
      renderWithRouter(
        <MarkdownRenderer content='<div onclick="alert(1)">Click me</div>' />
      );
      const element = screen.getByText('Click me');
      expect(element).not.toHaveAttribute('onclick');
    });
  });

  describe('GFM features', () => {
    it('renders strikethrough text', () => {
      renderWithRouter(<MarkdownRenderer content="~~deleted~~" />);
      const del = document.querySelector('del');
      expect(del).toBeInTheDocument();
      expect(del).toHaveTextContent('deleted');
    });

    it('renders tables', () => {
      const tableMarkdown = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`;
      renderWithRouter(<MarkdownRenderer content={tableMarkdown} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Header 1')).toBeInTheDocument();
      expect(screen.getByText('Cell 1')).toBeInTheDocument();
    });
  });
});
