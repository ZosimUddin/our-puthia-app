/**
 * Vercel Serverless Function: Social Media SEO Dynamic Open Graph & Twitter Card Preview
 * Endpoint: /api/og-preview?id=:id
 * 
 * Provides pre-rendered Open Graph & Twitter Card HTML for social crawlers (Facebook, WhatsApp, Twitter, etc.)
 * Strictly enforces zero-cache isolation, status validation, input sanitization, and HTTPS image whitelisting.
 */

const PROJECT_ID = 'our-puthia-45c6e';
const BASE_URL = 'https://our-puthia-app.vercel.app';
const DEFAULT_FALLBACK_IMAGE = 'https://our-puthia-app.vercel.app/puthia_og_banner.jpg';
const DEFAULT_SITE_NAME = 'আমাদের পুঠিয়া';

// Strict Whitelist of allowed image hostnames
const ALLOWED_IMAGE_HOSTS = new Set([
  'firebasestorage.googleapis.com',
  'our-puthia-app.vercel.app',
  'images.unsplash.com'
]);

/**
 * Escapes characters for HTML text nodes.
 */
function escapeHtmlText(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Escapes characters for HTML attribute values and strips control characters/newlines.
 */
function escapeHtmlAttr(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\r\n\t\0]/g, ' ')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim();
}

/**
 * Validates and sanitizes news ID: only alphanumeric, underscore, and hyphens (max 100 chars).
 */
function isValidNewsId(id: unknown): id is string {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id);
}

/**
 * Validates image URL against strict security criteria:
 * - HTTPS protocol only
 * - No credentials (username/password)
 * - Port must be standard (empty or 443)
 * - Length <= 2000 chars
 * - Host must be in ALLOWED_IMAGE_HOSTS (or authorized firebasestorage domain)
 * - Disallows Base64 Data URIs and SVG formats
 */
function validateImageUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== 'string') return DEFAULT_FALLBACK_IMAGE;
  const trimmed = rawUrl.trim();
  
  if (!trimmed || trimmed.length > 2000) return DEFAULT_FALLBACK_IMAGE;
  
  // Explicitly reject data: URIs (Base64) and blob: URIs
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('file:')) {
    return DEFAULT_FALLBACK_IMAGE;
  }
  
  try {
    const parsed = new URL(trimmed);
    
    // Protocol must be HTTPS
    if (parsed.protocol !== 'https:') return DEFAULT_FALLBACK_IMAGE;
    
    // No embedded credentials
    if (parsed.username || parsed.password) return DEFAULT_FALLBACK_IMAGE;
    
    // Port must be empty or default HTTPS (443)
    if (parsed.port && parsed.port !== '443') return DEFAULT_FALLBACK_IMAGE;
    
    // Hostname check
    const hostname = parsed.hostname.toLowerCase();
    const isAllowedHost = ALLOWED_IMAGE_HOSTS.has(hostname) ||
      hostname.endsWith('.firebasestorage.app') ||
      hostname.endsWith('.storage.googleapis.com');
      
    if (!isAllowedHost) return DEFAULT_FALLBACK_IMAGE;
    
    // Disallow SVG extensions
    const pathname = parsed.pathname.toLowerCase();
    if (pathname.endsWith('.svg')) return DEFAULT_FALLBACK_IMAGE;
    
    return trimmed;
  } catch {
    return DEFAULT_FALLBACK_IMAGE;
  }
}

/**
 * Builds minimal, clean 404 HTML for crawlers and humans.
 * Strictly includes noindex/nofollow and zero inline JavaScript.
 */
function buildNotFoundHtml(): string {
  return `<!doctype html>
<html lang="bn" dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>সংবাদটি পাওয়া যায়নি – আমাদের পুঠিয়া</title>
  <meta name="robots" content="noindex, nofollow">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f3f4f6; color: #1f2937; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 16px; }
    .card { background: #ffffff; border-radius: 12px; padding: 32px; max-width: 480px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    h1 { color: #b91c1c; font-size: 20px; margin-bottom: 12px; }
    p { font-size: 14px; color: #4b5563; margin-bottom: 24px; line-height: 1.5; }
    a { display: inline-block; background: #064e3b; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>সংবাদটি পাওয়া যায়নি</h1>
    <p>আপনি যে সংবাদটি খুঁজছেন তা মুছে ফেলা হয়েছে অথবা এখনো প্রকাশিত হয়নি।</p>
    <a href="${BASE_URL}/news">সকল সংবাদ দেখুন</a>
  </div>
</body>
</html>`;
}

/**
 * Builds dynamic Open Graph & Twitter Card HTML for published news.
 * Zero inline scripts. Strict attribute and text escaping.
 */
function buildPreviewHtml(params: {
  title: string;
  description: string;
  imageUrl: string;
  canonicalUrl: string;
  publishedTime?: string;
}): string {
  const safeTitle = escapeHtmlAttr(params.title);
  const safeTitleText = escapeHtmlText(params.title);
  const safeDesc = escapeHtmlAttr(params.description);
  const safeDescText = escapeHtmlText(params.description);
  const safeImage = escapeHtmlAttr(params.imageUrl);
  const safeUrl = escapeHtmlAttr(params.canonicalUrl);
  const safeSiteName = escapeHtmlAttr(DEFAULT_SITE_NAME);
  const safeTimeMeta = params.publishedTime 
    ? `\n  <meta property="article:published_time" content="${escapeHtmlAttr(params.publishedTime)}">` 
    : '';

  return `<!doctype html>
<html lang="bn" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitleText} – ${safeSiteName}</title>
  <meta name="description" content="${safeDesc}">
  <link rel="canonical" href="${safeUrl}">
  <meta name="robots" content="index, follow">

  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:site_name" content="${safeSiteName}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="bn_BD">
  <meta property="og:url" content="${safeUrl}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDesc}">
  <meta property="og:image" content="${safeImage}">
  <meta property="og:image:secure_url" content="${safeImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${safeTitle}">${safeTimeMeta}

  <!-- Twitter / X Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@amaderputhia">
  <meta name="twitter:url" content="${safeUrl}">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  <meta name="twitter:image" content="${safeImage}">

  <!-- Minimal semantic styles for direct human visits -->
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; display: flex; justify-content: center; }
    .container { max-width: 680px; width: 100%; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .banner { width: 100%; height: auto; aspect-ratio: 1200 / 630; object-fit: cover; display: block; background: #064e3b; }
    .content { padding: 24px; }
    .badge { display: inline-block; background: #dcfce7; color: #166534; font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 6px; margin-bottom: 12px; }
    h1 { font-size: 22px; line-height: 1.4; margin: 0 0 12px 0; color: #0f172a; }
    p { font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 24px 0; }
    .btn { display: inline-flex; align-items: center; justify-content: center; background: #047857; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px; }
    .btn:hover { background: #065f46; }
  </style>
</head>
<body>
  <div class="container">
    <img src="${safeImage}" alt="${safeTitle}" class="banner" loading="eager">
    <div class="content">
      <span class="badge">আমাদের পুঠিয়া সংবাদ</span>
      <h1>${safeTitleText}</h1>
      <p>${safeDescText}</p>
      <a href="${safeUrl}" class="btn">আমাদের পুঠিয়া অ্যাপে সম্পূর্ণ সংবাদটি পড়ুন &rarr;</a>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Universal Serverless / Express Handler
 */
export default async function handler(req: any, res: any) {
  // 1. Mandatory Cache Control Header: Zero-cache isolation on all responses
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 2. Extract and validate news id
  const newsId = req.query?.id || req.params?.id;

  if (!isValidNewsId(newsId)) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.statusCode = 404;
    return res.end(buildNotFoundHtml());
  }

  try {
    // 3. Fetch from Firestore REST API with a strict 5-second timeout
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/news/${encodeURIComponent(newsId)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(firestoreUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      res.statusCode = 404;
      return res.end(buildNotFoundHtml());
    }

    const doc = await response.json();
    const fields = doc.fields || {};

    // 4. Strict Publication Gate: ONLY status === 'published'
    const status = fields.status?.stringValue;
    if (status !== 'published') {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      res.statusCode = 404;
      return res.end(buildNotFoundHtml());
    }

    // 5. Parse and sanitize title
    let title = (fields.title?.stringValue || '').trim();
    if (!title) {
      title = 'সংবাদ – আমাদের পুঠিয়া';
    } else if (title.length > 200) {
      title = title.substring(0, 197) + '...';
    }

    // 6. Parse and sanitize description/summary
    let summary = (fields.summary?.stringValue || fields.content?.stringValue || '').trim();
    // Strip simple HTML tags if present in content
    summary = summary.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!summary) {
      summary = 'আমাদের পুঠিয়া উপজেলার সর্বশেষ প্রকাশিত সংবাদ ও বিস্তারিত তথ্য বিবরণী।';
    } else if (summary.length > 200) {
      summary = summary.substring(0, 197) + '...';
    }

    // 7. Validate and sanitize image URL
    const rawImage = fields.imageUrl?.stringValue || fields.image?.stringValue;
    const validatedImage = validateImageUrl(rawImage);

    // 8. Published timestamp (optional)
    const publishedTime = fields.createdAt?.timestampValue || fields.publishedAt?.timestampValue;

    const canonicalUrl = `${BASE_URL}/news/${encodeURIComponent(newsId)}`;

    // 9. Generate HTML & Return 200 OK
    const html = buildPreviewHtml({
      title,
      description: summary,
      imageUrl: validatedImage,
      canonicalUrl,
      publishedTime
    });

    res.statusCode = 200;
    return res.end(html);

  } catch (err: any) {
    console.error(`[OG-Preview] Error rendering preview for id=${newsId}:`, err?.message || err);
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.statusCode = 500;
    return res.end(buildNotFoundHtml());
  }
}
