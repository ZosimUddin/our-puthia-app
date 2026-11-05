#!/usr/bin/env node
/**
 * scripts/generate-sitemap.mjs
 * 
 * Dynamic Sitemap Generator for "আমাদের পুঠিয়া"
 * Generates build-time dynamic sitemap merging existing 15 static URLs
 * with published news articles from Firestore REST API.
 * 
 * Resilient Error Policy:
 * - Network / API failures: Warns and preserves static fallback sitemap in dist/. Does NOT abort build.
 * - XML validation / code failures: Throws fatal error, cleans tmp file, aborts build (exit code 1).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_SITEMAP_PATH = path.join(ROOT_DIR, 'public', 'sitemap.xml');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const DIST_SITEMAP_PATH = path.join(DIST_DIR, 'sitemap.xml');
const TEMP_SITEMAP_PATH = path.join(DIST_DIR, 'sitemap.xml.tmp');

const SITE_ORIGIN = 'https://our-puthia-app.vercel.app';
const ID_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * Escapes characters for XML safety
 */
function escapeXml(unsafe) {
  if (unsafe == null) return '';
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Loads project ID from configuration
 */
function getProjectId() {
  try {
    const configPath = path.join(ROOT_DIR, 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.projectId) return config.projectId;
    }
  } catch (err) {
    console.warn('[generate-sitemap] Warning reading firebase-applet-config.json, falling back to default:', err.message);
  }
  return 'our-puthia-45c6e';
}

/**
 * Reads static sitemap blocks from public/sitemap.xml
 */
function extractStaticUrlBlocks() {
  const sourcePath = fs.existsSync(PUBLIC_SITEMAP_PATH) ? PUBLIC_SITEMAP_PATH : DIST_SITEMAP_PATH;
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Static sitemap source not found at ${sourcePath}`);
  }

  const rawXml = fs.readFileSync(sourcePath, 'utf-8');
  const urlBlocks = [];
  const regex = /(<!--[\s\S]*?-->\s*)?<url>([\s\S]*?)<\/url>/g;
  let match;
  while ((match = regex.exec(rawXml)) !== null) {
    urlBlocks.push(match[0].trim());
  }

  if (urlBlocks.length === 0) {
    throw new Error(`No <url> blocks found in static sitemap (${sourcePath})`);
  }

  return urlBlocks;
}

/**
 * Fetches published news articles from Firestore REST API
 */
async function fetchPublishedNews(projectId) {
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery`;
  const payload = {
    structuredQuery: {
      from: [{ collectionId: 'news' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'status' },
          op: 'EQUAL',
          value: { stringValue: 'published' }
        }
      },
      limit: 1000
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(12000)
  });

  if (!response.ok) {
    throw new Error(`Firestore REST query failed with HTTP status ${response.status} ${response.statusText}`);
  }

  const results = await response.json();
  if (!Array.isArray(results)) {
    throw new Error('Firestore response is not an array of results');
  }

  return results;
}

/**
 * Validates XML structure and ensures compliance with Sitemap 0.9 protocol
 */
async function validateSitemapXml(xmlString) {
  if (typeof xmlString !== 'string' || !xmlString.trim()) {
    throw new Error('Sitemap XML is empty');
  }

  if (!xmlString.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
    throw new Error('Missing or invalid XML declaration');
  }

  if (!xmlString.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">') || !xmlString.trim().endsWith('</urlset>')) {
    throw new Error('Invalid <urlset> root element or missing namespace');
  }

  // Attempt DOMParser validation if @xmldom/xmldom is available
  try {
    const { DOMParser } = await import('@xmldom/xmldom');
    const parserErrors = [];
    const parser = new DOMParser({
      onError: (level, msg) => {
        if (level === 'error' || level === 'fatalError') {
          parserErrors.push(`[${level}] ${msg}`);
        }
      }
    });

    const doc = parser.parseFromString(xmlString, 'text/xml');
    if (parserErrors.length > 0) {
      throw new Error(`XML Parser errors: ${parserErrors.join('; ')}`);
    }

    const root = doc.documentElement;
    if (!root || root.nodeName !== 'urlset') {
      throw new Error(`Expected root element <urlset>, got <${root ? root.nodeName : 'null'}>`);
    }

    const urls = doc.getElementsByTagName('url');
    if (!urls || urls.length === 0) {
      throw new Error('DOM validation failed: 0 <url> tags found');
    }

    for (let i = 0; i < urls.length; i++) {
      const u = urls[i];
      const locs = u.getElementsByTagName('loc');
      if (!locs || locs.length !== 1 || !locs[0].textContent?.trim()) {
        throw new Error(`Invalid <url> entry at position ${i}: missing or multiple <loc> tag`);
      }
      const loc = locs[0].textContent.trim();
      if (!loc.startsWith(SITE_ORIGIN)) {
        throw new Error(`Invalid <loc> domain at position ${i}: ${loc}`);
      }
    }
  } catch (domErr) {
    // If the error was an XML parsing/structural failure, rethrow it
    if (domErr.message && (domErr.message.includes('XML Parser') || domErr.message.includes('Invalid <url>') || domErr.message.includes('Invalid <loc>') || domErr.message.includes('Expected root'))) {
      throw domErr;
    }
    // If import failed, fallback to strict regex validation
    const openUrl = (xmlString.match(/<url>/g) || []).length;
    const closeUrl = (xmlString.match(/<\/url>/g) || []).length;
    if (openUrl === 0 || openUrl !== closeUrl) {
      throw new Error(`Tag count mismatch: ${openUrl} <url> open vs ${closeUrl} </url> close`);
    }

    const openLoc = (xmlString.match(/<loc>/g) || []).length;
    const closeLoc = (xmlString.match(/<\/loc>/g) || []).length;
    if (openLoc !== closeLoc || openLoc !== openUrl) {
      throw new Error(`Tag count mismatch: ${openLoc} <loc> vs ${openUrl} <url>`);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('[generate-sitemap] Starting dynamic sitemap generation...');

  // Ensure dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // 1. Read existing static URL blocks
  let staticBlocks = [];
  try {
    staticBlocks = extractStaticUrlBlocks();
    console.log(`[generate-sitemap] Loaded ${staticBlocks.length} static URL blocks from public/sitemap.xml.`);
  } catch (err) {
    console.error('[generate-sitemap] Programming/Config error reading static sitemap:', err.message);
    process.exit(1);
  }

  // 2. Fetch published news from Firestore REST API
  const projectId = getProjectId();
  let rawNewsResults = [];
  try {
    console.log(`[generate-sitemap] Fetching published news from Firestore project: "${projectId}"...`);
    rawNewsResults = await fetchPublishedNews(projectId);
  } catch (networkErr) {
    // Network or API failure policy:
    // Log warning and leave static sitemap intact. Do not crash the build.
    console.warn(`[generate-sitemap] WARNING: Network or API failure fetching published news (${networkErr.message}).`);
    console.warn('[generate-sitemap] Falling back to existing static sitemap in dist/. Build will proceed successfully.');
    
    // Ensure dist/sitemap.xml has at least the static sitemap
    if (!fs.existsSync(DIST_SITEMAP_PATH) && fs.existsSync(PUBLIC_SITEMAP_PATH)) {
      fs.copyFileSync(PUBLIC_SITEMAP_PATH, DIST_SITEMAP_PATH);
    }
    return;
  }

  // 3. Process news documents
  const validNewsEntries = [];
  const seenIds = new Set();
  let totalDocsProcessed = 0;

  for (const item of rawNewsResults) {
    if (!item.document) continue;
    totalDocsProcessed++;

    const docName = item.document.name || '';
    const docId = docName.split('/').pop() || '';

    // Validate ID
    if (!docId || !ID_REGEX.test(docId)) {
      console.warn(`[generate-sitemap] Skipping news document with invalid ID format: "${docId}"`);
      continue;
    }

    if (seenIds.has(docId)) {
      continue;
    }

    // Strict status verification
    const status = item.document.fields?.status?.stringValue;
    if (status !== 'published') {
      continue;
    }

    seenIds.add(docId);

    const title = item.document.fields?.title?.stringValue || '';
    const locUrl = `${SITE_ORIGIN}/news/${encodeURIComponent(docId)}`;

    // Note: User-generated news title comments are deliberately omitted to eliminate XML syntax risks (such as '--' or '-->' in titles).
    // Note: <lastmod> is omitted per project policy (no reliable publishedAt; updatedAt mutates on likes/comments).
    const newsBlock = `  <url>
    <loc>${escapeXml(locUrl)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;

    validNewsEntries.push(newsBlock);
  }

  console.log(`[generate-sitemap] Found ${validNewsEntries.length} valid published news document(s).`);

  if (totalDocsProcessed >= 1000) {
    console.warn('[generate-sitemap] WARNING: Firestore result reached limit of 1000 documents. Pagination may be required for future scalability.');
  }

  // 4. Assemble XML
  const formattedStatic = staticBlocks.map(block => {
    return block.split('\n').map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<!--') || trimmed.startsWith('<url') || trimmed.startsWith('</url')) {
        return '  ' + trimmed;
      }
      return '    ' + trimmed;
    }).filter(Boolean).join('\n');
  }).join('\n');

  const formattedNews = validNewsEntries.join('\n');

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${formattedStatic}
${formattedNews ? '\n' + formattedNews : ''}
</urlset>
`;

  // 5. Validate XML
  try {
    await validateSitemapXml(sitemapXml);
    console.log('[generate-sitemap] XML validation passed successfully.');
  } catch (validationErr) {
    console.error('[generate-sitemap] FATAL: Generated XML validation failed:', validationErr.message);
    // Programming error policy: Clean up and fail build
    if (fs.existsSync(TEMP_SITEMAP_PATH)) {
      try { fs.unlinkSync(TEMP_SITEMAP_PATH); } catch (_) {}
    }
    process.exit(1);
  }

  // 6. Atomic file write
  try {
    fs.writeFileSync(TEMP_SITEMAP_PATH, sitemapXml, 'utf-8');
    fs.renameSync(TEMP_SITEMAP_PATH, DIST_SITEMAP_PATH);
    console.log(`[generate-sitemap] Successfully generated dynamic sitemap at dist/sitemap.xml!`);
    console.log(`[generate-sitemap] Summary: ${staticBlocks.length} static URLs + ${validNewsEntries.length} dynamic news URLs = ${staticBlocks.length + validNewsEntries.length} total URLs.`);
  } catch (writeErr) {
    console.error('[generate-sitemap] FATAL: File system write error:', writeErr.message);
    if (fs.existsSync(TEMP_SITEMAP_PATH)) {
      try { fs.unlinkSync(TEMP_SITEMAP_PATH); } catch (_) {}
    }
    process.exit(1);
  }
}

main().catch((fatalErr) => {
  console.error('[generate-sitemap] Unhandled fatal error:', fatalErr);
  if (fs.existsSync(TEMP_SITEMAP_PATH)) {
    try { fs.unlinkSync(TEMP_SITEMAP_PATH); } catch (_) {}
  }
  process.exit(1);
});
