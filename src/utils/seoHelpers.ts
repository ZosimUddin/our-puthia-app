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
            'item': `${SITE_URL}/services`,
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
          '@id': 'https://our-puthia-app.vercel.app/#website',
          'name': 'আমাদের পুঠিয়া',
          'url': 'https://our-puthia-app.vercel.app/',
        },
        'inLanguage': 'bn-BD',
        'about': {
          '@type': 'Thing',
          'name': config.title,
          'description': config.subtitle,
        },
        'provider': {
          '@type': 'Organization',
          '@id': 'https://our-puthia-app.vercel.app/#organization',
          'name': 'আমাদের পুঠিয়া',
          'url': 'https://our-puthia-app.vercel.app/',
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
  const itemUrl = `${SITE_URL}/service/${config.id}/${docId}`;

  const breadcrumbItem = {
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
  };

  // 1. Specific JobPosting Schema for 'job' service key
  if (config.id === 'job') {
    const isClosed = item.status === 'closed' || item.status === 'expired' || item.isClosed === true;
    const safeValidThrough = toSafeIsoDate(item.deadline || item.validThrough || item.expireDate);
    const isExpired = safeValidThrough ? new Date(safeValidThrough).getTime() < Date.now() : false;

    const orgName = extractPlainText(item.organization || item.company || item.hiringOrganization || item.workplace || '').trim();
    const safeDatePosted = toSafeIsoDate(item.createdAt || item.datePosted || item.publishedAt);
    const jobTitle = extractPlainText(item[schema.nameKey] || item.title || item.name || '').trim();
    const jobDesc = extractPlainText(item.description || item.details || item.subtitle || '').trim();

    // Mandatory criteria: Must NOT be closed or expired, MUST have valid title, description, orgName, and datePosted
    const canBuildJobSchema = !isClosed && !isExpired && !!jobTitle && !!jobDesc && !!orgName && !!safeDatePosted;

    if (canBuildJobSchema) {
      const jobPostingSchema: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        '@id': `${itemUrl}#jobposting`,
        'url': itemUrl,
        'title': jobTitle,
        'description': jobDesc,
        'datePosted': safeDatePosted,
        'hiringOrganization': {
          '@type': 'Organization',
          'name': orgName,
        },
      };

      if (safeValidThrough) {
        jobPostingSchema['validThrough'] = safeValidThrough;
      }

      const jobLocation = extractPlainText(item[schema.addressKey || 'address'] || item.address || item.location || 'পুঠিয়া, রাজশাহী').trim();
      if (jobLocation) {
        jobPostingSchema['jobLocation'] = {
          '@type': 'Place',
          'address': {
            '@type': 'PostalAddress',
            'streetAddress': jobLocation,
            'addressLocality': 'পুঠিয়া',
            'addressRegion': 'রাজশাহী',
            'addressCountry': 'BD',
          },
        };
      }

      const rawType = (item.jobType || item.employmentType || item.type || '').toString().toUpperCase();
      let mappedEmploymentType: string | undefined = undefined;
      if (rawType.includes('FULL') || rawType.includes('ফুল')) mappedEmploymentType = 'FULL_TIME';
      else if (rawType.includes('PART') || rawType.includes('পার্ট')) mappedEmploymentType = 'PART_TIME';
      else if (rawType.includes('CONTRACT') || rawType.includes('চুক্তি')) mappedEmploymentType = 'CONTRACTOR';
      else if (rawType.includes('INTERN') || rawType.includes('ইন্টার্ন')) mappedEmploymentType = 'INTERN';

      if (mappedEmploymentType) {
        jobPostingSchema['employmentType'] = mappedEmploymentType;
      }

      const parsedSalary = parseBengaliPrice(item.salary || item.compensation || item.baseSalary);
      if (parsedSalary !== null && parsedSalary > 0) {
        jobPostingSchema['baseSalary'] = {
          '@type': 'MonetaryAmount',
          'currency': 'BDT',
          'value': {
            '@type': 'QuantitativeValue',
            'value': parsedSalary,
            'unitText': 'MONTH',
          },
        };
      }

      return {
        '@context': 'https://schema.org',
        '@graph': [
          breadcrumbItem,
          jobPostingSchema,
        ],
      };
    }

    // When job cannot build active JobPosting (closed, expired, or missing required fields),
    // safely return ONLY the BreadcrumbList to prevent erroneous LocalBusiness fallback.
    return {
      '@context': 'https://schema.org',
      '@graph': [
        breadcrumbItem,
      ],
    };
  }

  // 2. Specific Product/Offer Schema for 'marketplace', 'product', 'products'
  if (['marketplace', 'product', 'products'].includes(config.id)) {
    const productName = extractPlainText(item[schema.nameKey] || item.name || item.title || '').trim();
    const productDesc = extractPlainText(item.description || item.details || '').trim();

    if (productName && productDesc) {
      const productSchema: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': `${itemUrl}#product`,
        'url': itemUrl,
        'name': productName,
        'description': productDesc,
      };

      if (image) {
        productSchema['image'] = image;
      }

      // Brand mapping: ONLY add brand if real brand or manufacturer exists (DO NOT use sellerName as brand)
      const brandName = extractPlainText(item.brand || item.manufacturer || item.brandName || '').trim();
      if (brandName) {
        productSchema['brand'] = {
          '@type': 'Brand',
          'name': brandName,
        };
      }

      // Price & Offer mapping
      const parsedPrice = parseBengaliPrice(item.price);
      if (parsedPrice !== null) {
        const offerSchema: Record<string, any> = {
          '@type': 'Offer',
          'price': parsedPrice,
          'priceCurrency': 'BDT',
          'url': itemUrl,
        };

        // Seller mapping in Offer
        const sellerName = extractPlainText(item.sellerName || item.seller || item.userName || '').trim();
        if (sellerName) {
          offerSchema['seller'] = {
            '@type': 'Person',
            'name': sellerName,
          };
        }

        // Availability mapping
        if (item.status === 'sold' || item.availability === 'sold' || item.isSold === true) {
          offerSchema['availability'] = 'https://schema.org/OutOfStock';
        } else if (item.status === 'available' || item.status === 'active' || item.status === 'approved' || !item.status) {
          offerSchema['availability'] = 'https://schema.org/InStock';
        }

        productSchema['offers'] = offerSchema;
      }

      // AggregateRating (ONLY if genuine rating & reviewCount exist)
      const rawRating = item[schema.ratingKey || 'rating'] ?? item.rating;
      const rawReviewCount = item[schema.reviewCountKey || 'reviewCount'] ?? item.reviewCount ?? item.totalReviews;

      const parsedRating = typeof rawRating === 'number' ? rawRating : parseFloat(String(rawRating));
      const parsedReviewCount = typeof rawReviewCount === 'number' ? rawReviewCount : parseInt(String(rawReviewCount), 10);

      const hasValidRating = typeof parsedRating === 'number' && !isNaN(parsedRating) && parsedRating >= 1 && parsedRating <= 5;
      const hasValidReviewCount = typeof parsedReviewCount === 'number' && !isNaN(parsedReviewCount) && parsedReviewCount > 0;

      if (hasValidRating && hasValidReviewCount) {
        productSchema['aggregateRating'] = {
          '@type': 'AggregateRating',
          'ratingValue': Number(parsedRating.toFixed(1)),
          'reviewCount': parsedReviewCount,
          'bestRating': 5,
          'worstRating': 1,
        };
      }

      return {
        '@context': 'https://schema.org',
        '@graph': [
          breadcrumbItem,
          productSchema,
        ],
      };
    }
  }

  // 3. Default Schema Mapping for all other categories (doctor, hospital, school, hotel, etc.)
  let schemaType = 'LocalBusiness';
  if (['doctor', 'hospital', 'clinic', 'pharmacy', 'ambulance', 'diagnostic'].includes(config.id)) {
    schemaType = config.id === 'doctor' ? 'Physician' : 'MedicalBusiness';
  } else if (['blood-donor', 'blood_donor', 'volunteer'].includes(config.id)) {
    schemaType = 'Person';
  } else if (['school', 'college', 'madrasa', 'kindergarten', 'library', 'education', 'education_hub'].includes(config.id)) {
    schemaType = 'EducationalOrganization';
  } else if (['hotel', 'restaurant', 'sweet_shop', 'fast_food', 'coffee_shop'].includes(config.id)) {
    schemaType = 'FoodEstablishment';
  } else if (['tourist', 'tourist_spot', 'historical_place', 'temple', 'mosque', 'rajbari'].includes(config.id)) {
    schemaType = 'TouristAttraction';
  } else if (['fire-service', 'fire_service'].includes(config.id)) {
    schemaType = 'FireStation';
  } else if (['police', 'police-station'].includes(config.id)) {
    schemaType = 'PoliceStation';
  } else if (['land_office', 'union_parisad', 'admin', 'govt-office'].includes(config.id)) {
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
  };

  const rawRating = item[schema.ratingKey || 'rating'] ?? item.rating;
  const rawReviewCount = item[schema.reviewCountKey || 'reviewCount'] ?? item.reviewCount ?? item.totalReviews;

  const parsedRating = typeof rawRating === 'number' ? rawRating : parseFloat(String(rawRating));
  const parsedReviewCount = typeof rawReviewCount === 'number' ? rawReviewCount : parseInt(String(rawReviewCount), 10);

  const hasValidRating = typeof parsedRating === 'number' && !isNaN(parsedRating) && parsedRating >= 1 && parsedRating <= 5;
  const hasValidReviewCount = typeof parsedReviewCount === 'number' && !isNaN(parsedReviewCount) && parsedReviewCount > 0;

  if (hasValidRating && hasValidReviewCount) {
    detailSchema['aggregateRating'] = {
      '@type': 'AggregateRating',
      'ratingValue': Number(parsedRating.toFixed(1)),
      'reviewCount': parsedReviewCount,
      'bestRating': 5,
      'worstRating': 1,
    };
  }

  if (phone) {
    detailSchema['telephone'] = phone;
  }
  if (image) {
    detailSchema['image'] = image;
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbItem,
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
    { path: '/services', title: 'সকল সেবা তালিকা', priority: '0.9', changefreq: 'daily' },
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
 * Safely converts Bengali digits (০-৯) in a string to English ASCII digits (0-9)
 */
export const convertBengaliDigitsToEnglish = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return str.replace(/[০-৯]/g, (w) => {
    const idx = bengaliNumerals.indexOf(w);
    return idx !== -1 ? String(idx) : w;
  });
};

/**
 * Parses numeric price from string or number with Bengali/English digits,
 * stripping currency symbols (৳, টাকা, Tk, BDT), commas, and whitespace.
 *
 * Rules:
 * - Returns number if input is a valid non-negative number or price string.
 * - Returns null if input is missing, empty, ambiguous ("আলোচনা সাপেক্ষে"), or NaN.
 */
export const parseBengaliPrice = (rawPrice: any): number | null => {
  if (rawPrice === null || rawPrice === undefined || rawPrice === '') {
    return null;
  }

  if (typeof rawPrice === 'number') {
    if (!isNaN(rawPrice) && isFinite(rawPrice) && rawPrice >= 0) {
      return rawPrice;
    }
    return null;
  }

  if (typeof rawPrice !== 'string') {
    return null;
  }

  let str = rawPrice.trim();
  if (!str) return null;

  // Convert Bengali numerals to English ASCII digits
  str = convertBengaliDigitsToEnglish(str);

  // Reject text containing words/terms like "আলোচনা", "সাপেক্ষে", "contact", "negotiable", "call"
  // Strip allowed currency words/symbols first
  const cleaned = str.replace(/[৳টাকা,Tk,BDT,tk,bdt,,\s]/g, '').trim();

  // If any non-digit/non-period characters remain (or if empty), return null
  if (!cleaned || /[^\d.]/.test(cleaned)) {
    return null;
  }

  const num = parseFloat(cleaned);
  if (isNaN(num) || !isFinite(num) || num < 0) {
    return null;
  }

  return num;
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
      const trimmed = convertBengaliDigitsToEnglish(raw.trim());
      // Strictly reject Bengali words/characters, names, or non-ISO human-readable strings
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

    const organizationEntity = {
      '@type': 'Organization',
      '@id': `${PRIMARY_DOMAIN}/#organization`,
      'name': 'আমাদের পুঠিয়া',
      'url': `${PRIMARY_DOMAIN}/`,
      'logo': {
        '@type': 'ImageObject',
        'url': `${PRIMARY_DOMAIN}/puthia_official_full_logo.jpg`,
      },
    };

    return {
      '@context': 'https://schema.org',
      '@graph': [
        breadcrumbEntity,
        organizationEntity,
        articleEntity,
      ],
    };
  };

export interface GenericFaqInput {
  question?: string;
  answer?: string;
  q?: string;
  a?: string;
}

/**
 * Builds compliant FAQPage Schema.org structured data from active FAQ items.
 *
 * Rules:
 * - Includes @context: "https://schema.org", @type: "FAQPage"
 * - mainEntity: Array of Question objects with @type: "Question", name, acceptedAnswer
 * - Each acceptedAnswer contains @type: "Answer", text
 * - Filters out empty, missing, or whitespace-only questions or answers
 * - Strictly uses real visible content without artificial ratings, reviews, or fake text
 */
export const buildFaqPageSchema = (faqs: GenericFaqInput[]) => {
  if (!Array.isArray(faqs) || faqs.length === 0) {
    return null;
  }

  const validQuestions = faqs
    .map((item) => {
      const question = extractPlainText(item.question || item.q || '').trim();
      const answer = extractPlainText(item.answer || item.a || '').trim();
      if (!question || !answer) return null;
      return {
        '@type': 'Question',
        'name': question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': answer,
        },
      };
    })
    .filter((q): q is NonNullable<typeof q> => q !== null);

  if (validQuestions.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': validQuestions,
  };
};


