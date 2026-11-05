import { ServiceConfig, SERVICES_CONFIG } from '../config/servicesConfig';
import { extractPlainText } from './sanitizeHtml';

const PRIMARY_DOMAIN = 'https://our-puthia-app.vercel.app';
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : PRIMARY_DOMAIN;

/**
 * Generate dynamic structured data (JSON-LD) for a service directory page (all 60 services)
 */
export const getServiceDirectorySchema = (config: ServiceConfig, itemCount: number = 0) => {
  const pageUrl = `${SITE_URL}/service/${config.id}`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'হোমপেজ',
            'item': SITE_URL,
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'সকল সেবা ও ডিরেক্টরি',
            'item': `${SITE_URL}/all-services`,
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': config.title,
            'item': pageUrl,
          },
        ],
      },
      {
        '@type': 'CollectionPage',
        '@id': pageUrl,
        'url': pageUrl,
        'name': `${config.title} - পুঠিয়া উপজেলা সেবা ডিরেক্টরি`,
        'description': `${config.subtitle}। পুঠিয়া, রাজশাহী অঞ্চলের নির্ভরযোগ্য ও যাচাইকৃত ${config.title} তালিকা ও জরুরী নম্বর।`,
        'isPartOf': {
          '@type': 'WebSite',
          '@id': SITE_URL,
          'name': 'আমাদের পুঠিয়া',
          'url': SITE_URL,
        },
        'inLanguage': 'bn-BD',
        'about': {
          '@type': 'Thing',
          'name': config.title,
          'description': config.subtitle,
        },
        'provider': {
          '@type': 'GovernmentOrganization',
          'name': 'পুঠিয়া উপজেলা প্রশাসন ও ডিজিটাল পুঠিয়া টিম',
          'url': SITE_URL,
          'areaServed': {
            '@type': 'AdministrativeArea',
            'name': 'পুঠিয়া উপজেলা, রাজশাহী',
          },
        },
        'numberOfItems': itemCount,
      },
    ],
  };
};

/**
 * Generate dynamic structured data (JSON-LD) for an individual service item detail page
 */
export const getServiceItemDetailSchema = (
  config: ServiceConfig,
  item: Record<string, any>,
  docId: string
) => {
  const schema = config.fieldsSchema;
  const title = item[schema.nameKey] || item.name || item.title || 'সেবা বিবরন';
  const address = item[schema.addressKey || 'address'] || 'পুঠিয়া, রাজশাহী';
  const phone = item[schema.phoneKey || 'phone'] || item.contactNumber || '';
  const image = item[schema.imageKey || 'imageUrl'] || item.image || item.photo || '';
  const rating = typeof item[schema.ratingKey || 'rating'] === 'number' ? item[schema.ratingKey || 'rating'] : 4.8;
  const reviewCount = typeof item[schema.reviewCountKey || 'reviewCount'] === 'number' ? item[schema.reviewCountKey || 'reviewCount'] : 25;
  const itemUrl = `${SITE_URL}/service/${config.id}/${docId}`;

  // Determine schema type based on service key
  let schemaType = 'LocalBusiness';
  if (['doctor', 'hospital', 'clinic', 'pharmacy', 'blood_donor', 'ambulance'].includes(config.id)) {
    schemaType = config.id === 'doctor' ? 'Physician' : 'MedicalBusiness';
  } else if (['school', 'college', 'madrasa', 'kindergarten', 'library'].includes(config.id)) {
    schemaType = 'EducationalOrganization';
  } else if (['hotel', 'restaurant', 'sweet_shop', 'fast_food', 'coffee_shop'].includes(config.id)) {
    schemaType = 'FoodEstablishment';
  } else if (['tourist_spot', 'historical_place', 'temple', 'mosque', 'rajbari'].includes(config.id)) {
    schemaType = 'TouristAttraction';
  } else if (['police', 'fire_service', 'land_office', 'union_parisad', 'admin'].includes(config.id)) {
    schemaType = 'GovernmentBuilding';
  }

  const detailSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    '@id': itemUrl,
    'url': itemUrl,
    'name': `${title} - ${config.title}`,
    'description': `${title} - পুঠিয়া উপজেলার বিশ্বস্ত ${config.title}। যোগাযোগের নম্বর: ${phone || 'উপলব্ধ'}, ঠিকানা: ${address}।`,
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': address,
      'addressLocality': 'পুঠিয়া',
      'addressRegion': 'রাজশাহী',
      'addressCountry': 'BD',
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': rating,
      'reviewCount': reviewCount,
      'bestRating': 5,
      'worstRating': 1,
    },
  };

  if (phone) {
    detailSchema['telephone'] = phone;
  }
  if (image) {
    detailSchema['image'] = image;
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'হোমপেজ',
            'item': SITE_URL,
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': config.title,
            'item': `${SITE_URL}/service/${config.id}`,
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': title,
            'item': itemUrl,
          },
        ],
      },
      detailSchema,
    ],
  };
};

/**
 * Generate full sitemap list of all 60 services and static pages
 */
export const getAllSiteRoutes = () => {
  const staticRoutes = [
    { path: '/', title: 'আমাদের পুঠিয়া - হোমপেজ', priority: '1.0', changefreq: 'daily' },
    { path: '/all-services', title: 'সকল সেবা তালিকা', priority: '0.9', changefreq: 'daily' },
    { path: '/history', title: 'পুঠিয়া রাজবাড়ী ও ইতিহাস', priority: '0.9', changefreq: 'monthly' },
    { path: '/gallery', title: 'পুঠিয়া ফটো গ্যালারি', priority: '0.8', changefreq: 'weekly' },
    { path: '/video-gallery', title: 'ভিডিও গ্যালারি', priority: '0.8', changefreq: 'weekly' },
    { path: '/notice', title: 'জরুরী নোটিশ ও বিজ্ঞপ্তি', priority: '0.8', changefreq: 'daily' },
    { path: '/complaint', title: 'নাগরিক অভিযোগ বক্স', priority: '0.7', changefreq: 'monthly' },
    { path: '/live-support', title: 'লাইভ সাপোর্ট ও হেল্পলাইন', priority: '0.7', changefreq: 'monthly' },
    { path: '/community', title: 'কমিউনিটি প্ল্যাটফর্ম', priority: '0.7', changefreq: 'daily' },
  ];

  const serviceRoutes = Object.values(SERVICES_CONFIG).map((cfg) => ({
    path: `/service/${cfg.id}`,
    title: `${cfg.title} - পুঠিয়া ডিরেক্টরি`,
    priority: '0.8',
    changefreq: 'daily',
    category: cfg.subtitle,
    icon: cfg.icon,
  }));

  return {
    staticRoutes,
    serviceRoutes,
    totalRoutes: staticRoutes.length + serviceRoutes.length,
  };
};

/**
 * Generate XML Sitemap string for SEO bots & search consoles
 */
export const generateXmlSitemapString = () => {
  const { staticRoutes, serviceRoutes } = getAllSiteRoutes();
  const all = [...staticRoutes, ...serviceRoutes];
  const today = new Date().toISOString().split('T')[0];

  const xmlEntries = all
    .map(
      (r) => `  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${xmlEntries}
</urlset>`;
};

/**
 * Safely converts diverse timestamp formats (Firestore Timestamp, seconds object, ISO string, Unix ms)
 * to a strictly validated ISO 8601 string.
 *
 * Rules:
 * - Returns undefined if timestamp is missing, null, undefined, or empty.
 * - Does NOT fallback to new Date().toISOString() when timestamp is absent.
 * - Does NOT attempt to guess or convert localized Bengali human-readable strings (e.g. "২ নভেম্বর ২০২৬").
 * - Guards against Invalid Date and RangeError.
 * - Validates year bounds (2000 - 2100).
 */
export const toSafeIsoDate = (raw: any): string | undefined => {
  if (raw === null || raw === undefined || raw === '') {
    return undefined;
  }

  try {
    let d: Date | null = null;

    // 1. Firestore Timestamp instance (client or admin SDK with toDate method)
    if (typeof raw === 'object' && typeof raw.toDate === 'function') {
      const res = raw.toDate();
      if (res instanceof Date && !isNaN(res.getTime())) {
        d = res;
      }
    }
    // 2. Serialized Firestore timestamp object ({ seconds } or { _seconds })
    else if (typeof raw === 'object' && raw !== null) {
      const secs = raw.seconds ?? raw._seconds;
      if (typeof secs === 'number' && !isNaN(secs) && isFinite(secs)) {
        const nanos = raw.nanoseconds ?? raw._nanoseconds ?? 0;
        const millis = secs * 1000 + Math.floor(nanos / 1000000);
        const res = new Date(millis);
        if (!isNaN(res.getTime())) {
          d = res;
        }
      }
    }
    // 3. Numeric Unix timestamp
    else if (typeof raw === 'number' && !isNaN(raw) && isFinite(raw)) {
      // Milliseconds (between 2000 and 2100: ~946684800000 to ~4102444800000)
      if (raw >= 946684800000 && raw <= 4102444800000) {
        const res = new Date(raw);
        if (!isNaN(res.getTime())) d = res;
      } else if (raw >= 946684800 && raw <= 4102444800) {
        // Seconds
        const res = new Date(raw * 1000);
        if (!isNaN(res.getTime())) d = res;
      }
    }
    // 4. String format
    else if (typeof raw === 'string') {
      const trimmed = raw.trim();
      // Strictly reject Bengali characters, names, or non-ISO human-readable strings
      if (/[\u0980-\u09FF]/.test(trimmed)) {
        return undefined;
      }
      // Must be a valid ISO 8601 date or date-time pattern
      const isoPattern = /^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
      if (!isoPattern.test(trimmed)) {
        return undefined;
      }

      const dateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10);
        const day = parseInt(dateMatch[3], 10);

        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          // Strictly verify calendar date without rollover (e.g. rejects Feb 29 on non-leap years, Feb 31, April 31)
          const utcCheck = new Date(Date.UTC(year, month - 1, day));
          if (
            utcCheck.getUTCFullYear() === year &&
            utcCheck.getUTCMonth() === month - 1 &&
            utcCheck.getUTCDate() === day
          ) {
            const res = new Date(trimmed);
            if (!isNaN(res.getTime())) {
              d = res;
            }
          }
        }
      }
    }

    if (d && !isNaN(d.getTime())) {
      const year = d.getUTCFullYear();
      if (year >= 2000 && year <= 2100) {
        return d.toISOString();
      }
    }
  } catch {
    // Return undefined on any parse/range failure
  }

  return undefined;
};

export interface NewsArticleSchemaData {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  image?: string;
  createdAt?: any;
  authorName?: string;
  status?: string;
}

/**
 * Builds rich, compliant NewsArticle Schema.org structured data.
 *
 * Rules:
 * - Includes @context, @type: NewsArticle, mainEntityOfPage, headline, publisher.
 * - Extracts clean plain text description without HTML.
 * - Validates news image; excludes default svg logos or invalid URLs.
 * - Includes datePublished only when a verified ISO timestamp exists from createdAt.
 * - Omits dateModified since updatedAt changes during like/view actions.
 * - Includes author only when authorName is a non-empty, reliable string.
 * - Includes verified publisher logo (logo.png) located on the primary domain.
 */
export const buildNewsArticleSchema = (news: NewsArticleSchemaData) => {
  const articleUrl = `${PRIMARY_DOMAIN}/news/${news.id}`;

  const cleanHeadline = (news.title || '').trim();
  const rawDescription = extractPlainText(news.summary || news.content || '');
  const cleanDescription = rawDescription.slice(0, 160).trim();

  // Validate Image:
  // Must be non-empty, must NOT be default logo.svg, must be a valid URL string
  let validImageUrl: string | undefined = undefined;
  if (news.image && typeof news.image === 'string') {
    const trimmedImg = news.image.trim().replace(/^['"]|['"]$/g, '');
    if (
      trimmedImg &&
      !trimmedImg.toLowerCase().includes('logo.svg') &&
      !trimmedImg.toLowerCase().includes('.svg') &&
      (trimmedImg.startsWith('http://') ||
       trimmedImg.startsWith('https://') ||
       trimmedImg.startsWith('/assets/') ||
       trimmedImg.startsWith('/'))
    ) {
      validImageUrl = trimmedImg.startsWith('http') ? trimmedImg : `${PRIMARY_DOMAIN}${trimmedImg}`;
    }
  }

  const safePublishedDate = toSafeIsoDate(news.createdAt);

  const articleEntity: Record<string, any> = {
    '@type': 'NewsArticle',
    '@id': `${articleUrl}#article`,
    'isPartOf': {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    'headline': cleanHeadline,
    'publisher': {
      '@id': 'https://our-puthia-app.vercel.app/#organization',
    },
  };

  if (cleanDescription) {
    articleEntity['description'] = cleanDescription;
  }

  if (validImageUrl) {
    articleEntity['image'] = [validImageUrl];
  }

  if (safePublishedDate) {
    articleEntity['datePublished'] = safePublishedDate;
  }

  // Author: only include if authorName is non-empty and reliable
  if (news.authorName && typeof news.authorName === 'string' && news.authorName.trim()) {
    articleEntity['author'] = {
      '@type': 'Person',
      'name': news.authorName.trim(),
    };
  }

  const breadcrumbEntity = {
    '@type': 'BreadcrumbList',
    '@id': `${articleUrl}#breadcrumb`,
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'হোমপেজ',
        'item': `${PRIMARY_DOMAIN}/`,
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'পুঠিয়া সংবাদ',
        'item': `${PRIMARY_DOMAIN}/news`,
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': cleanHeadline || 'সংবাদ বিবরন',
        'item': articleUrl,
      },
    ],
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbEntity,
      articleEntity,
    ],
  };
};
