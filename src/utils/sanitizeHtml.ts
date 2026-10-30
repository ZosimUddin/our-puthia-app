import DOMPurify from 'dompurify';

/**
 * Strict XSS Sanitization for User & Admin Generated News Content
 * Complies with strict security standards:
 * - Safe tags only
 * - Disallows script, onerror, onload, and javascript: links
 * - Trusted YouTube / Vimeo video iframe embeds only
 * - Rejects SVGs in image tags
 */

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'hr',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'span', 'div', 'figure', 'figcaption', 'iframe', 'code', 'pre'
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'src', 'alt', 'title', 'width', 'height',
  'style', 'class', 'align', 'data-align', 'data-video', 'frameborder',
  'allow', 'allowfullscreen', 'referrerpolicy', 'loading'
];

// Configure DOMPurify hooks
if (typeof window !== 'undefined') {
  // Ensure all links have safe rel and target
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // 1. Link validation
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || '';
      // Block unsafe protocols
      if (!/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(href.trim())) {
        node.removeAttribute('href');
      } else {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }

    // 2. Image validation (Strictly reject SVGs or unsafe protocols)
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') || '';
      if (
        src.toLowerCase().includes('.svg') || 
        src.toLowerCase().startsWith('data:image/svg') ||
        !/^(https?:\/\/|\/|data:image\/(jpeg|png|webp|gif);base64,)/i.test(src.trim())
      ) {
        node.removeAttribute('src');
      }
      node.setAttribute('loading', 'lazy');
      // Ensure responsive class
      const currentClass = node.getAttribute('class') || '';
      if (!currentClass.includes('max-w-full')) {
        node.setAttribute('class', (currentClass + ' max-w-full h-auto rounded-2xl shadow-xs').trim());
      }
    }

    // 3. Iframe validation (Only allow trusted YouTube and Vimeo embeds)
    if (node.tagName === 'IFRAME') {
      const src = node.getAttribute('src') || '';
      const isTrustedVideo = /^(https?:\/\/)?(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com)\//i.test(src.trim());
      if (!isTrustedVideo) {
        node.parentNode?.removeChild(node);
      } else {
        node.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        node.setAttribute('allowfullscreen', 'true');
        node.setAttribute('frameborder', '0');
      }
    }
  });
}

/**
 * Sanitizes rich HTML content with DOMPurify
 */
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return '';
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder'],
    FORCE_BODY: false
  });
}

/**
 * Checks whether the rich text content is effectively empty
 * Returns true if content is empty or contains only whitespace / empty tags like <p><br></p>
 */
export function isContentEmpty(content: string): boolean {
  if (!content) return true;
  // Remove all HTML tags and HTML entities
  const stripped = content
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/gi, ' ')
    .trim();
  
  // If no text, check if it contains any media like <img> or <iframe>
  if (stripped.length === 0) {
    const hasMedia = /<img|<iframe/i.test(content);
    return !hasMedia;
  }
  
  return false;
}

/**
 * Extracts plain text from HTML (useful for summaries and previews)
 */
export function extractPlainText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>?/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converts a YouTube / Vimeo URL into a safe responsive embed URL
 */
export function getSafeVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // YouTube matchers: youtu.be/<id>, youtube.com/watch?v=<id>, youtube.com/shorts/<id>, youtube.com/embed/<id>
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
  }

  // Vimeo matchers: vimeo.com/<id>
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    return `https://player.vimeo.com/video/${vimeoMatch[3]}`;
  }

  return null;
}
