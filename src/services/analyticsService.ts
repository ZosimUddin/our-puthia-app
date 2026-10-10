import { getAnalytics, isSupported as isAnalyticsSupported, logEvent as firebaseLogEvent, Analytics } from 'firebase/analytics';
import { app, auth } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

let analyticsPromise: Promise<Analytics | null> | null = null;

/**
 * Initializes and retrieves the Firebase Analytics instance safely.
 * Works across client environments while gracefully handling environments where analytics is unsupported.
 */
export const getFirebaseAnalytics = async (): Promise<Analytics | null> => {
  if (typeof window === 'undefined') return null;
  if (!analyticsPromise) {
    analyticsPromise = (async () => {
      try {
        const supported = await isAnalyticsSupported();
        if (supported) {
          return getAnalytics(app);
        }
      } catch (err) {
        console.warn('Firebase Analytics not supported in this context:', err);
      }
      return null;
    })();
  }
  return analyticsPromise;
};

export interface AnalyticsEventParams {
  category?: string;
  feature?: string;
  path?: string;
  query?: string;
  itemId?: string;
  itemName?: string;
  userId?: string;
  userRole?: string;
  source?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

/**
 * Log an event to Firebase Analytics and Firestore audit/journey log for administrative insights
 */
export const logAnalyticsEvent = async (eventName: string, params: AnalyticsEventParams = {}) => {
  try {
    const currentUserId = auth.currentUser?.uid || params.userId || 'anonymous';
    const enhancedParams: AnalyticsEventParams = {
      ...params,
      userId: currentUserId,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      pathname: typeof window !== 'undefined' ? window.location.pathname : '',
    };

    // 1. Log to Firebase Analytics
    try {
      const analyticsInstance = await getFirebaseAnalytics();
      if (analyticsInstance) {
        firebaseLogEvent(analyticsInstance, eventName, enhancedParams);
      }
    } catch (analyticsErr) {
      // Non-fatal if blocked by ad-blocker or preview environment
    }

    // 2. Persist to Firestore user_journey_events for admin dashboard & administrative insights
    try {
      const eventDocRef = doc(collection(db, 'user_journey_events'));
      await setDoc(eventDocRef, {
        id: eventDocRef.id,
        eventName,
        ...enhancedParams,
        createdAt: new Date().toISOString(),
      });
    } catch (firestoreErr) {
      // Fail silently to avoid breaking UX
    }
  } catch (error) {
    console.debug('Analytics logEvent error:', error);
  }
};

/**
 * Log category navigation event
 */
export const logCategoryNavigation = async (categoryName: string, path: string, extraParams: AnalyticsEventParams = {}) => {
  return logAnalyticsEvent('category_navigation', {
    category: categoryName,
    path,
    ...extraParams,
  });
};

/**
 * Log feature usage event
 */
export const logFeatureUsage = async (featureName: string, action: string = 'view', extraParams: AnalyticsEventParams = {}) => {
  return logAnalyticsEvent('feature_usage', {
    feature: featureName,
    action,
    ...extraParams,
  });
};
