import React, { useMemo } from 'react';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

interface RichTextRendererProps {
  content: string;
  className?: string;
}

/**
 * Production-ready Safe Rich Text Renderer
 * - Handles both legacy plain-text news and rich HTML news
 * - Zero XSS risk through strict DOMPurify sanitization
 * - Mobile responsive table overflow, responsive images, video embeds
 * - Styled to match "আমাদের পুঠিয়া" design constitution
 */
export const RichTextRenderer: React.FC<RichTextRendererProps> = ({
  content,
  className = ''
}) => {
  // Determine if content is HTML or plain text
  const isHtml = useMemo(() => {
    if (!content) return false;
    return /<[a-z][\s\S]*>/i.test(content);
  }, [content]);

  const sanitizedContent = useMemo(() => {
    if (!content) return '';
    if (!isHtml) return '';
    return sanitizeHtml(content);
  }, [content, isHtml]);

  if (!content) return null;

  // Fallback for legacy plain-text news articles
  if (!isHtml) {
    return (
      <div className={`space-y-4 text-base sm:text-lg leading-relaxed text-slate-800 font-medium whitespace-pre-line ${className}`}>
        {content.split(/\n\s*\n/).map((paragraph, idx) => (
          <p key={idx} className="leading-relaxed">
            {paragraph.trim()}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`rich-text-content text-base sm:text-lg leading-relaxed text-slate-800 font-medium space-y-4 break-words ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

export default RichTextRenderer;
