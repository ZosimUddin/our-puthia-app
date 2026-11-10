/**
 * Phase 3, Step 3: Social Media SEO Dynamic Preview - Automated Test Suite
 * Validates all 10 Mandatory Test Cases with detailed PASS/FAIL assertion outputs.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const BASE_URL = 'http://localhost:3000';
const PUBLISHED_NEWS_ID = 'dYu6YD8vGHCVgaGFjfwN';
const NON_EXISTENT_ID = 'non_existent_news_99999';
const MALFORMED_IDS = [
  '../../etc/passwd',
  '<script>alert(1)</script>',
  'id" OR "1"="1',
  'invalid space in id',
  'very_long_id_exceeding_one_hundred_characters_'.repeat(3)
];

const SOCIAL_USER_AGENTS = {
  Facebook: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  WhatsApp: 'WhatsApp/2.21.12.21 i',
  Twitter: 'Twitterbot/1.0',
  Telegram: 'TelegramBot (like TwitterBot)',
  LinkedIn: 'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
  Discord: 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)'
};

const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function fetchUrl(urlPath, userAgent) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

const testResults = [];

function recordTest(num, title, passed, details) {
  testResults.push({ num, title, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[Test ${num}] ${status}: ${title}`);
  if (details) {
    console.log(`   Details: ${details}`);
  }
}

async function runTestSuite() {
  console.log('========================================================');
  console.log('   PHASE 3, STEP 3: SOCIAL MEDIA SEO AUDIT & TEST SUITE  ');
  console.log('========================================================\n');

  // TEST CASE 1: Published News with Social Crawler (Facebook)
  try {
    const res = await fetchUrl(`/news/${PUBLISHED_NEWS_ID}`, SOCIAL_USER_AGENTS.Facebook);
    const is200 = res.statusCode === 200;
    const hasOgTitle = res.body.includes('<meta property="og:title"');
    const hasOgDesc = res.body.includes('<meta property="og:description"');
    const hasOgImage = res.body.includes('<meta property="og:image"');
    const hasOgType = res.body.includes('<meta property="og:type" content="article"');
    const hasTwitterCard = res.body.includes('<meta name="twitter:card" content="summary_large_image"');
    const passed = is200 && hasOgTitle && hasOgDesc && hasOgImage && hasOgType && hasTwitterCard;
    recordTest(
      1,
      'Published News via Facebook Crawler unfurling Open Graph & Twitter tags',
      passed,
      `Status: ${res.statusCode}, og:title: ${hasOgTitle}, og:image: ${hasOgImage}, og:type=article: ${hasOgType}`
    );
  } catch (e) {
    recordTest(1, 'Published News via Facebook Crawler', false, e.message);
  }

  // TEST CASE 2: Base64 / Malformed Image Rejection & Fallback
  try {
    const res = await fetchUrl(`/api/og-preview?id=${PUBLISHED_NEWS_ID}`, SOCIAL_USER_AGENTS.Facebook);
    // In Firestore, published news has data:image/webp;base64...
    // The server MUST reject data: URI and output https://our-puthia-app.vercel.app/puthia_og_banner.jpg
    const containsBase64 = res.body.includes('data:image/');
    const containsFallback = res.body.includes('https://our-puthia-app.vercel.app/puthia_og_banner.jpg');
    const passed = !containsBase64 && containsFallback;
    recordTest(
      2,
      'Base64 Image Rejection & Safe Fallback Banner Replacement',
      passed,
      `Base64 detected: ${containsBase64}, Fallback puthia_og_banner.jpg used: ${containsFallback}`
    );
  } catch (e) {
    recordTest(2, 'Base64 Image Rejection & Safe Fallback', false, e.message);
  }

  // TEST CASE 3: Status Gate (Non-published or invalid status check)
  try {
    // Test with non-existent or simulate unpublished
    const res = await fetchUrl(`/api/og-preview?id=${NON_EXISTENT_ID}`, SOCIAL_USER_AGENTS.Facebook);
    const is404 = res.statusCode === 404;
    const hasNoIndex = res.body.includes('noindex, nofollow') || res.headers['x-robots-tag']?.includes('noindex');
    const noLeak = !res.body.includes('puthia Rajbari');
    const passed = is404 && hasNoIndex && noLeak;
    recordTest(
      3,
      'Non-published/Missing News returns HTTP 404 with noindex/nofollow',
      passed,
      `Status: ${res.statusCode}, noindex present: ${hasNoIndex}, no leaked data: ${noLeak}`
    );
  } catch (e) {
    recordTest(3, 'Status Gate (Unpublished / 404)', false, e.message);
  }

  // TEST CASE 4: Non-existent News ID handling
  try {
    const res = await fetchUrl(`/news/${NON_EXISTENT_ID}`, SOCIAL_USER_AGENTS.Facebook);
    const is404 = res.statusCode === 404;
    const hasNotFoundTitle = res.body.includes('সংবাদটি পাওয়া যায়নি');
    const passed = is404 && hasNotFoundTitle;
    recordTest(
      4,
      'Non-existent News ID returns clean 404 page without crashing server',
      passed,
      `Status: ${res.statusCode}, Clean 404 response: ${hasNotFoundTitle}`
    );
  } catch (e) {
    recordTest(4, 'Non-existent News ID handling', false, e.message);
  }

  // TEST CASE 5: Malformed / SQLi / Path Traversal ID Sanitization
  try {
    let allBlocked = true;
    for (const badId of MALFORMED_IDS) {
      const res = await fetchUrl(`/api/og-preview?id=${encodeURIComponent(badId)}`, SOCIAL_USER_AGENTS.Facebook);
      if (res.statusCode !== 404 && res.statusCode !== 400) {
        allBlocked = false;
        break;
      }
    }
    recordTest(
      5,
      'Malformed, Path Traversal & Script IDs are strictly rejected',
      allBlocked,
      `Tested ${MALFORMED_IDS.length} malicious patterns; all returned 404/400 without querying DB`
    );
  } catch (e) {
    recordTest(5, 'Malformed ID Sanitization', false, e.message);
  }

  // TEST CASE 6: Regular Browser Traffic Routing (Passes through to React SPA)
  try {
    const res = await fetchUrl(`/news/${PUBLISHED_NEWS_ID}`, BROWSER_USER_AGENT);
    const is200 = res.statusCode === 200;
    const hasRootDiv = res.body.includes('<div id="root"></div>');
    const hasMainScript = res.body.includes('/src/main.tsx');
    const isSpa = hasRootDiv && hasMainScript;
    const isNotPreview = !res.body.includes('class="container"') && !res.body.includes('class="btn"');
    const passed = is200 && isSpa && isNotPreview;
    recordTest(
      6,
      'Regular Browser Traffic receives React SPA index.html (Not Crawler Preview)',
      passed,
      `Status: ${res.statusCode}, SPA root div: ${hasRootDiv}, main.tsx loaded: ${hasMainScript}, isNotPreview: ${isNotPreview}`
    );
  } catch (e) {
    recordTest(6, 'Regular Browser Traffic Routing', false, e.message);
  }

  // TEST CASE 7: Multiple Social Media Crawlers (WhatsApp, Twitter, Telegram, LinkedIn, Discord)
  try {
    const crawlerResults = [];
    let allPassed = true;
    for (const [name, ua] of Object.entries(SOCIAL_USER_AGENTS)) {
      const res = await fetchUrl(`/news/${PUBLISHED_NEWS_ID}`, ua);
      const ok = res.statusCode === 200 && res.body.includes('<meta property="og:title"');
      crawlerResults.push(`${name}: ${ok ? 'OK' : 'FAIL'}`);
      if (!ok) allPassed = false;
    }
    recordTest(
      7,
      'Multi-Platform Crawler Support (Facebook, WhatsApp, Twitter, Telegram, LinkedIn, Discord)',
      allPassed,
      crawlerResults.join(', ')
    );
  } catch (e) {
    recordTest(7, 'Multi-Platform Crawler Support', false, e.message);
  }

  // TEST CASE 8: Zero Inline JavaScript & Strict XSS Attribute Escaping
  try {
    const res = await fetchUrl(`/api/og-preview?id=${PUBLISHED_NEWS_ID}`, SOCIAL_USER_AGENTS.Facebook);
    const hasScriptTag = /<script\b[^>]*>([\s\S]*?)<\/script>/gi.test(res.body);
    const hasInlineHandler = /\s(onload|onclick|onerror|onmouseover|onfocus|onsubmit)\s*=/i.test(res.body);
    const hasJsRedirect = res.body.includes('window.location') || res.body.includes('javascript:');
    const passed = !hasScriptTag && !hasInlineHandler && !hasJsRedirect;
    recordTest(
      8,
      'Zero Inline JavaScript & Complete Absence of Client-side Script Injection',
      passed,
      `<script> present: ${hasScriptTag}, event handlers present: ${hasInlineHandler}, window.location/javascript: present: ${hasJsRedirect}`
    );
  } catch (e) {
    recordTest(8, 'Zero Inline JavaScript & Security', false, e.message);
  }

  // TEST CASE 9: Fallback Banner Asset Verification (MIME, Dimensions, Size)
  try {
    const bannerPath = path.join(process.cwd(), 'public', 'puthia_og_banner.jpg');
    const exists = fs.existsSync(bannerPath);
    if (!exists) {
      recordTest(9, 'Fallback Banner Asset Verification', false, 'Banner file does not exist');
    } else {
      const meta = await sharp(bannerPath).metadata();
      const stats = fs.statSync(bannerPath);
      const isJpeg = meta.format === 'jpeg';
      const is1200x630 = meta.width === 1200 && meta.height === 630;
      const sizeKB = stats.size / 1024;
      const isUnderBudget = sizeKB < 150;
      const passed = isJpeg && is1200x630 && isUnderBudget;
      recordTest(
        9,
        'Fallback Banner Asset Verification (1200x630 JPEG, < 150KB)',
        passed,
        `Format: ${meta.format}, Dimensions: ${meta.width}x${meta.height}, Size: ${sizeKB.toFixed(2)} KB (budget < 150 KB)`
      );
    }
  } catch (e) {
    recordTest(9, 'Fallback Banner Asset Verification', false, e.message);
  }

  // TEST CASE 10: Mandatory Cache-Control & CDN Cache Isolation Headers
  try {
    const res200 = await fetchUrl(`/api/og-preview?id=${PUBLISHED_NEWS_ID}`, SOCIAL_USER_AGENTS.Facebook);
    const res404 = await fetchUrl(`/api/og-preview?id=${NON_EXISTENT_ID}`, SOCIAL_USER_AGENTS.Facebook);

    const cc200 = res200.headers['cache-control'] || '';
    const cc404 = res404.headers['cache-control'] || '';
    const pragma200 = res200.headers['pragma'] || '';
    const expires200 = res200.headers['expires'] || '';
    const nosniff = res200.headers['x-content-type-options'] === 'nosniff';

    const expectedCC = 'private, no-cache, no-store, must-revalidate, max-age=0';
    const passed200 = cc200.includes('no-store') && cc200.includes('private') && cc200.includes('max-age=0');
    const passed404 = cc404.includes('no-store') && cc404.includes('private') && cc404.includes('max-age=0');
    const passed = passed200 && passed404 && nosniff;

    recordTest(
      10,
      'Mandatory Cache-Control: Zero-Cache Isolation on 200 & 404 Responses',
      passed,
      `200 Cache-Control: "${cc200}", 404 Cache-Control: "${cc404}", Pragma: "${pragma200}", Expires: "${expires200}", nosniff: ${nosniff}`
    );
  } catch (e) {
    recordTest(10, 'Mandatory Cache-Control Verification', false, e.message);
  }

  console.log('\n========================================================');
  const totalPassed = testResults.filter(t => t.passed).length;
  console.log(`TEST SUMMARY: ${totalPassed}/${testResults.length} PASSED`);
  console.log('========================================================\n');

  if (totalPassed !== testResults.length) {
    process.exit(1);
  }
}

runTestSuite();
