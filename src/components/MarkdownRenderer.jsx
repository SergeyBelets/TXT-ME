import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import rehypeRaw from 'rehype-raw';
import { Link } from 'react-router-dom';

function MarkdownRenderer({ content, postId }) {
  const PLAIN_TEXT_POSTS = [
    '8205bc8d-4910-4fd7-b62a-302cde4cc413', // Без горизонта
    '835f89d8-681a-4d82-bfae-90d760256459', // Чайные ритуалы Третьей Стражи
    '83db64fd-79c2-4bc0-b270-eb64d8f8675b'  // Долгий холм
  ];

  // Очистка контента: удаляем ¬ и сокращаем множественные переводы строк
  const cleanContent = content
  .replace(/¬/g, '')           // Удаляем символ ¬
  .replace(/\n{3,}/g, '\n\n'); // Сокращаем 3+ переводов до 2

  if (postId && PLAIN_TEXT_POSTS.includes(postId)) {
    return (
      <div className="markdown-content" style={{ whiteSpace: 'pre-wrap' }}>
      {cleanContent}
      </div>
    );
  }

  return (
    <div className="markdown-content">
    <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeRaw, rehypeSanitize]}
    components={{
      // Обработка mentions (@username)
      p: ({ node, children }) => {
        const processedChildren = React.Children.map(children, (child) => {
          if (typeof child === 'string') {
            const parts = child.split(/(@\w+)/g);
            return parts.map((part, idx) => {
              if (part.startsWith('@')) {
                const username = part.substring(1);
                return (
                  <Link key={idx} to={`/users/${username}`} className="mention">
                  {part}
                  </Link>
                );
              }
              return part;
            });
          }
          return child;
        });
        return <p>{processedChildren}</p>;
      },
      // Открываем ссылки в новой вкладке
      a: ({ node, ...props }) => (
        <a {...props} target="_blank" rel="noopener noreferrer" />
      ),
    }}
    >
    {cleanContent}
    </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
