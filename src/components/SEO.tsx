import React from "react";
import { Helmet } from "react-helmet-async";
import { useSiteSettings } from "../context/SiteSettingsContext";

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  path?: string;
  type?: "website" | "article" | "profile" | "place" | "business";
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
  noIndex?: boolean;
}

const FALLBACK_TITLE = "আমাদের পুঠিয়া – ঐতিহ্য থেকে ডিজিটাল ভবিষ্যতের পথে";
const FALLBACK_DESC = "পুঠিয়ার মানুষ, ইতিহাস, ঐতিহ্য, তথ্য ও প্রয়োজনীয় সেবাকে এক প্ল্যাটফর্মে যুক্ত করার ডিজিটাল উদ্যোগ।";
const FALLBACK_KEYWORDS = "আমাদের পুঠিয়া, পুঠিয়া ডায়েরি, পুঠিয়া রাজবাড়ী, পুঠিয়া মন্দির কমপ্লেক্স, পুঠিয়া রাজশাহী, Puthia Rajbari, Puthia Upazila, Puthia Doctors, পুঠিয়া হাসপাতাল, বানেশ্বর বাজার, রাজশাহী পর্যটন";
const FALLBACK_IMAGE = "https://our-puthia-app.vercel.app/puthia_og_banner.jpg";
const PRIMARY_DOMAIN = "our-puthia-app.vercel.app";
const SITE_URL = "https://our-puthia-app.vercel.app";

/**
 * Normalizes Bengali and Unicode strings for deterministic comparison:
 * - Unicode NFC composition (merging decomposed 'য' + '়' into 'য়')
 * - Strips zero-width characters (ZWNJ \u200C, ZWJ \u200D, BOM \uFEFF)
 * - Collapses consecutive whitespace into a single space and trims
 */
export const normalizeBengaliForComparison = (str: string): string => {
  if (!str || typeof str !== "string") return "";
  return str
    .normalize("NFC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

/**
 * Checks whether the brand name exists as an affix (prefix or suffix) in the title.
 * Prevents duplicate brand concatenation while safely preserving titles where the brand name
 * appears naturally in the middle of a sentence.
 */
export const hasBrandAsAffix = (rawTitle: string, rawBrand: string): boolean => {
  const normTitle = normalizeBengaliForComparison(rawTitle);
  const normBrand = normalizeBengaliForComparison(rawBrand);

  if (!normTitle || !normBrand) return false;
  if (normTitle === normBrand) return true;

  const DELIMITER_REGEX_START = /^[\s\-–—|:;,./~•·।()[\]{}]+/;
  const DELIMITER_REGEX_END = /[\s\-–—|:;,./~•·।()[\]{}]+$/;

  // 1. Prefix Detection: title starts with brand name followed by space or title delimiter
  if (normTitle.startsWith(normBrand)) {
    const remainder = normTitle.slice(normBrand.length);
    if (remainder.length === 0 || DELIMITER_REGEX_START.test(remainder)) {
      return true;
    }
  }

  // 2. Suffix Detection: title ends with brand name preceded by space or title delimiter
  const strippedEndBrackets = normTitle.replace(/[\s)\]}।.]+$/, "");
  if (strippedEndBrackets.endsWith(normBrand)) {
    const leading = strippedEndBrackets.slice(0, strippedEndBrackets.length - normBrand.length);
    if (leading.length === 0 || DELIMITER_REGEX_END.test(leading) || /[\s(]$/.test(leading)) {
      return true;
    }
  }

  return false;
};

/**
 * Helper to inspect path segments for directory traversal patterns
 */
const hasDotTraversalPattern = (pathSegment: string): boolean => {
  if (/(^|[/\\])\.\.([/\\]|$)/.test(pathSegment)) return true;
  if (/(^|[/\\])%2e%2e([/\\]|$)/i.test(pathSegment)) return true;
  if (/(^|[/\\])\.%2e([/\\]|$)/i.test(pathSegment)) return true;
  if (/(^|[/\\])%2e\.([/\\]|$)/i.test(pathSegment)) return true;
  return false;
};

/**
 * Sanitizes and validates canonical URLs:
 * - Pre-parser traversal detection to prevent URL parser auto-normalization bypass
 * - Differentiates protocol-relative URLs (//host/path) from repeated slashes (///path, ////path)
 * - Applies up to 3 decode passes with strict fallback on residual obfuscated encoding
 * - Verifies HTTPS protocol, exact primary domain match, and denies custom ports/credentials
 * - Constructs output strictly from WHATWG URL parser's validated & normalized pathname
 */
export const sanitizeCanonicalUrl = (rawInput?: string): string => {
  if (!rawInput || typeof rawInput !== "string") {
    return SITE_URL;
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return SITE_URL;
  }

  // 1. Protocol Inspection: Only http and https allowed. Deny javascript:, data:, etc.
  const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme !== "http" && scheme !== "https") {
      return SITE_URL;
    }
  }

  // 2. Pre-Parser Path Isolation
  let pathWithQueryAndHash = "";

  if (/^https?:\/\//i.test(trimmed)) {
    const withoutScheme = trimmed.replace(/^https?:\/\//i, "");
    const firstDelimiterIdx = withoutScheme.search(/[/?#]/);
    if (firstDelimiterIdx === -1) {
      pathWithQueryAndHash = "/";
    } else {
      pathWithQueryAndHash = withoutScheme.slice(firstDelimiterIdx);
      if (!pathWithQueryAndHash.startsWith("/")) {
        pathWithQueryAndHash = "/" + pathWithQueryAndHash;
      }
    }
  } else if (trimmed.startsWith("//")) {
    if (!trimmed.startsWith("///")) {
      const withoutSlashes = trimmed.slice(2);
      const firstDelimiterIdx = withoutSlashes.search(/[/?#]/);
      if (firstDelimiterIdx === -1) {
        pathWithQueryAndHash = "/";
      } else {
        pathWithQueryAndHash = withoutSlashes.slice(firstDelimiterIdx);
        if (!pathWithQueryAndHash.startsWith("/")) {
          pathWithQueryAndHash = "/" + pathWithQueryAndHash;
        }
      }
    } else {
      pathWithQueryAndHash = trimmed;
    }
  } else {
    pathWithQueryAndHash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }

  // 3. Separate Path from Query ('?') and Hash ('#')
  const queryOrHashIdx = pathWithQueryAndHash.search(/[?#]/);
  const rawPathOnly = queryOrHashIdx === -1
    ? pathWithQueryAndHash
    : pathWithQueryAndHash.slice(0, queryOrHashIdx);

  // 4. Dot Traversal & Backslash Validation on Raw Path
  if (rawPathOnly.includes("\\") || /%5c/i.test(rawPathOnly)) {
    return SITE_URL;
  }

  if (hasDotTraversalPattern(rawPathOnly)) {
    return SITE_URL;
  }

  // Multi-layer decode check (bounded to max 3 passes)
  let currentDecoded = rawPathOnly;
  for (let pass = 0; pass < 3; pass++) {
    try {
      const nextDecoded = decodeURIComponent(currentDecoded);
      if (nextDecoded.includes("\\")) {
        return SITE_URL;
      }
      if (hasDotTraversalPattern(nextDecoded)) {
        return SITE_URL;
      }
      const segments = nextDecoded.split("/").filter(Boolean);
      for (const seg of segments) {
        if (seg === ".." || seg.toLowerCase() === "%2e%2e") {
          return SITE_URL;
        }
      }
      if (nextDecoded === currentDecoded) break;
      currentDecoded = nextDecoded;
    } catch {
      return SITE_URL;
    }
  }

  // After 3 passes, any residual %25, %2e, %2f, or %5c indicates deep obfuscation -> fallback
  if (/%(25|2e|2f|5c)/i.test(currentDecoded)) {
    return SITE_URL;
  }

  // 5. WHATWG URL Parser Verification (Host, Protocol, Port, Credentials)
  let parsedUrl: URL;
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      parsedUrl = new URL(trimmed);
    } else if (trimmed.startsWith("//") && !trimmed.startsWith("///")) {
      parsedUrl = new URL(`https:${trimmed}`);
    } else {
      const sanitizedRelativePath = rawPathOnly.replace(/^\/+/, "/");
      parsedUrl = new URL(sanitizedRelativePath, SITE_URL);
    }
  } catch {
    return SITE_URL;
  }

  // Protocol Check: Only https allowed
  if (parsedUrl.protocol !== "https:") {
    return SITE_URL;
  }

  // Hostname Check: Only PRIMARY_DOMAIN allowed
  if (parsedUrl.hostname.toLowerCase() !== PRIMARY_DOMAIN.toLowerCase()) {
    return SITE_URL;
  }

  // Port Check: Deny custom ports
  if (parsedUrl.port && parsedUrl.port !== "443") {
    return SITE_URL;
  }

  // Credentials Check: Deny username/password in URL
  if (parsedUrl.username || parsedUrl.password) {
    return SITE_URL;
  }

  // 6. Post-Parser Pathname Traversal Re-Validation
  if (hasDotTraversalPattern(parsedUrl.pathname)) {
    return SITE_URL;
  }
  const postSegments = parsedUrl.pathname.split("/").filter(Boolean);
  for (const seg of postSegments) {
    if (seg === ".." || seg.toLowerCase() === "%2e%2e") {
      return SITE_URL;
    }
  }

  // 7. Clean Output Construction from Parsed & Normalized Pathname
  // Collapse repeated consecutive slashes in pathname (e.g. /news///doctor/// -> /news/doctor)
  const normalizedPathname = parsedUrl.pathname.replace(/\/+/g, "/").replace(/\/+$/, "");
  const canonicalPathname = !normalizedPathname || normalizedPathname === "/" ? "" : normalizedPathname;
  return `${SITE_URL}${canonicalPathname}`;
};

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  path = "",
  type = "website",
  jsonLd,
  noIndex,
}) => {
  const { settings } = useSiteSettings();

  const siteBrandName = settings?.siteName || "আমাদের পুঠিয়া";
  const activeTitle = title 
    ? (hasBrandAsAffix(title, siteBrandName) ? title : `${title} | ${siteBrandName}`)
    : (settings?.seoTitle || FALLBACK_TITLE);

  const activeDesc = description || settings?.seoDescription || FALLBACK_DESC;
  const activeKeywords = keywords || settings?.seoKeywords || FALLBACK_KEYWORDS;
  const activeImage = image || settings?.ogImageUrl || FALLBACK_IMAGE;
  const canonicalUrl = sanitizeCanonicalUrl(path);

  const ogTitle = title ? activeTitle : (settings?.ogTitle || activeTitle);
  const ogDesc = description || settings?.ogDescription || activeDesc;
  const twitterCard = settings?.twitterCard || "summary_large_image";
  const twitterTitle = settings?.twitterTitle || ogTitle;
  const twitterDesc = settings?.twitterDescription || ogDesc;
  const twitterImage = settings?.twitterImage || activeImage;

  const isRobotsIndexed = noIndex !== undefined 
    ? !noIndex 
    : (settings?.robotsIndex !== false);
  const isRobotsFollow = settings?.robotsFollow !== false;

  const authorName = settings?.authorName || "আমাদের পুঠিয়া ওয়েব টিম";
  const geoRegion = settings?.geoRegion || "BD-54";
  const geoPlacename = settings?.geoPlacename || "Puthia, Rajshahi";
  const geoPosition = settings?.geoPosition || "24.3683;88.8358";
  const googleSearchConsole = settings?.googleSearchConsole || "";
  const bingVerification = settings?.bingVerification || "";

  // Resolve JSON-LD
  let resolvedJsonLd = jsonLd;
  if (!resolvedJsonLd && settings?.schemaJsonLd) {
    try {
      resolvedJsonLd = JSON.parse(settings.schemaJsonLd);
    } catch (e) {
      console.warn("Failed to parse custom schemaJsonLd:", e);
    }
  }

  const robotsContent = !isRobotsIndexed
    ? "noindex, nofollow"
    : `${isRobotsFollow ? "index, follow" : "index, nofollow"}, max-image-preview:large, max-snippet:-1, max-video-preview:-1`;

  return (
    <Helmet>
      {/* 1. Browser Tab Title */}
      <title>{activeTitle}</title>

      {/* 2. Standard HTML Meta Tags */}
      <meta name="title" content={activeTitle} />
      <meta name="description" content={activeDesc} />
      <meta name="keywords" content={activeKeywords} />
      <meta name="robots" content={robotsContent} />
      <meta name="author" content={authorName} />
      <meta name="language" content="Bangla" />
      <meta name="geo.region" content={geoRegion} />
      <meta name="geo.placename" content={geoPlacename} />
      <meta name="geo.position" content={geoPosition} />
      <meta name="ICBM" content={geoPosition.replace(";", ", ")} />
      <link rel="canonical" href={canonicalUrl} />

      {/* 3. Search Console Verification */}
      {googleSearchConsole && (
        <meta name="google-site-verification" content={googleSearchConsole.includes("=") ? googleSearchConsole.split("=")[1]?.replace(/"/g, "") : googleSearchConsole} />
      )}
      {bingVerification && (
        <meta name="msvalidate.01" content={bingVerification} />
      )}

      {/* 4. OpenGraph (Facebook / Social) */}
      <meta property="og:type" content={type === "business" ? "place" : type} />
      <meta property="og:site_name" content={siteBrandName} />
      <meta property="og:locale" content="bn_BD" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDesc} />
      <meta property="og:image" content={activeImage} />

      {/* 5. Twitter Card (X) */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={twitterTitle} />
      <meta name="twitter:description" content={twitterDesc} />
      <meta name="twitter:image" content={twitterImage} />
      <meta name="twitter:url" content={canonicalUrl} />

      {/* 6. JSON-LD Structured Data */}
      {resolvedJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(resolvedJsonLd).replace(/</g, "\\u003c")}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;

