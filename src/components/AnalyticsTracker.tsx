import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { logPageView } from '../api';
import { auth } from '../firebase';
import { 
  logAnalyticsEvent, 
  logCategoryNavigation, 
  logFeatureUsage 
} from '../services/analyticsService';

// Map path prefixes to high-level categories and feature descriptions
const ROUTE_CATEGORY_MAP: Record<string, { category: string; feature: string; bengaliTitle: string }> = {
  '/': { category: 'home', feature: 'portal_home', bengaliTitle: 'মূল পাতা' },
  '/news': { category: 'news_media', feature: 'local_news', bengaliTitle: 'সংবাদ ও খবর' },
  '/health': { category: 'health_medical', feature: 'healthcare_services', bengaliTitle: 'স্বাস্থ্য ও চিকিৎসা' },
  '/doctors': { category: 'health_medical', feature: 'doctor_directory', bengaliTitle: 'ডাক্তার তালিকা' },
  '/blood': { category: 'emergency_welfare', feature: 'blood_donation', bengaliTitle: 'রক্তদান সেবা' },
  '/police': { category: 'emergency_welfare', feature: 'police_services', bengaliTitle: 'থানা ও পুলিশ' },
  '/fire-service': { category: 'emergency_welfare', feature: 'fire_service', bengaliTitle: 'ফায়ার সার্ভিস' },
  '/ambulance': { category: 'emergency_welfare', feature: 'ambulance_booking', bengaliTitle: 'অ্যাম্বুলেন্স' },
  '/bus': { category: 'transportation', feature: 'bus_routes_schedule', bengaliTitle: 'বাস সার্ভিস ও সময়সূচী' },
  '/train': { category: 'transportation', feature: 'train_schedule', bengaliTitle: 'ট্রেন সময়সূচী' },
  '/vehicle-rental': { category: 'transportation', feature: 'vehicle_rental', bengaliTitle: 'গাড়ি ও রেন্ট-এ-কার' },
  '/education': { category: 'education', feature: 'education_directory', bengaliTitle: 'শিক্ষা প্রতিষ্ঠান' },
  '/teachers': { category: 'education', feature: 'teachers_directory', bengaliTitle: 'শিক্ষক বাতায়ন' },
  '/agriculture': { category: 'agriculture', feature: 'farmer_agriculture_advisory', bengaliTitle: 'কৃষি ও খামার' },
  '/shops': { category: 'commerce', feature: 'local_shops_market', bengaliTitle: 'দোকান ও ব্যবসা' },
  '/entrepreneurs': { category: 'commerce', feature: 'entrepreneur_profiles', bengaliTitle: 'উদ্যোক্তা' },
  '/lawyers': { category: 'legal', feature: 'lawyer_directory', bengaliTitle: 'আইনজীবী ও আইনি সহায়তা' },
  '/tourist-spots': { category: 'tourism_culture', feature: 'heritage_places', bengaliTitle: 'দর্শনীয় স্থান' },
  '/admin': { category: 'administration', feature: 'super_admin_panel', bengaliTitle: 'এডমিন ড্যাশবোর্ড' },
  '/editor': { category: 'administration', feature: 'editor_panel', bengaliTitle: 'এডিটর প্যানেল' },
  '/moderator': { category: 'administration', feature: 'moderator_panel', bengaliTitle: 'মডারেটর প্যানেল' },
  '/reels': { category: 'entertainment', feature: 'puthia_reels', bengaliTitle: 'রিলস ও ভিডিও' },
  '/adda': { category: 'social', feature: 'community_adda', bengaliTitle: 'পুঠিয়া আড্ডা' },
  '/jobs': { category: 'career', feature: 'job_circulars', bengaliTitle: 'চাকরি ও নিয়োগ' },
  '/services': { category: 'services', feature: 'upazila_services', bengaliTitle: 'উপজেলা সেবাসমূহ' },
};

function resolveRouteCategory(path: string) {
  // Check exact match first
  if (ROUTE_CATEGORY_MAP[path]) {
    return ROUTE_CATEGORY_MAP[path];
  }

  // Check prefix match
  const matchedPrefix = Object.keys(ROUTE_CATEGORY_MAP)
    .filter(prefix => prefix !== '/' && path.startsWith(prefix))
    .sort((a, b) => b.length - a.length)[0];

  if (matchedPrefix) {
    return ROUTE_CATEGORY_MAP[matchedPrefix];
  }

  // Fallback category detection based on segments
  const segments = path.split('/').filter(Boolean);
  const primarySegment = segments[0] || 'home';
  return {
    category: primarySegment,
    feature: segments.slice(0, 2).join('_') || primarySegment,
    bengaliTitle: primarySegment,
  };
}

export const AnalyticsTracker = () => {
  const location = useLocation();
  const lastPathRef = useRef<string>('');

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPathRef.current) return;
    lastPathRef.current = path;

    const userId = auth.currentUser?.uid;
    const { category, feature, bengaliTitle } = resolveRouteCategory(path);

    // 1. Existing database page view logging
    logPageView(path, userId);

    // 2. Firebase Analytics standard screen / page view event
    logAnalyticsEvent('page_view', {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
      category,
      feature,
      bengali_title: bengaliTitle,
      userId: userId || 'anonymous',
    });

    // 3. Category navigation event for administrative journey insights
    logCategoryNavigation(category, path, {
      feature,
      bengali_title: bengaliTitle,
      search: location.search,
      userId: userId || 'anonymous',
    });

    // 4. Feature usage tracking
    logFeatureUsage(feature, 'page_enter', {
      category,
      path,
      userId: userId || 'anonymous',
    });
  }, [location.pathname, location.search]);

  return null;
};
