import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { FooterSettings, DEFAULT_FOOTER_SETTINGS } from '../types';
import { logAuditActivity } from './auditLogger';

export const FOOTER_SETTINGS_DOC_PATH = 'site_settings';
export const FOOTER_SETTINGS_DOC_ID = 'footer';

/**
 * Validate that a URL is a secure, valid web address
 * Prevents javascript:, data:, and other XSS vectors
 */
export function validateUrl(url: string, fieldLabel = 'URL'): { isValid: boolean; error?: string; cleanUrl?: string } {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { isValid: false, error: `${fieldLabel} ফাঁকা রাখা যাবে না` };
  }

  const trimmed = url.trim();

  // Reject unsafe schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.includes('<script') ||
    lower.includes('onload=') ||
    lower.includes('onerror=')
  ) {
    return { isValid: false, error: `${fieldLabel}-এ অনিরাপদ বা অবৈধ লিংক গ্রহণযোগ্য নয়` };
  }

  // Ensure protocol
  let urlToTest = trimmed;
  if (!/^https?:\/\//i.test(trimmed)) {
    urlToTest = 'https://' + trimmed;
  }

  try {
    const parsed = new URL(urlToTest);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, error: `${fieldLabel} অবশ্যই http:// অথবা https:// দিয়ে শুরু হতে হবে` };
    }
    return { isValid: true, cleanUrl: urlToTest };
  } catch {
    return { isValid: false, error: `সঠিক ${fieldLabel} প্রদান করুন (যেমন: https://facebook.com/...)` };
  }
}

/**
 * Merge Firestore data with DEFAULT_FOOTER_SETTINGS safely
 */
export function sanitizeFooterSettings(data?: Partial<FooterSettings> | null): FooterSettings {
  if (!data) return { ...DEFAULT_FOOTER_SETTINGS };

  return {
    id: FOOTER_SETTINGS_DOC_ID,
    socialSectionTitle: data.socialSectionTitle?.trim() || DEFAULT_FOOTER_SETTINGS.socialSectionTitle,
    socialSectionEnabled: data.socialSectionEnabled !== undefined ? Boolean(data.socialSectionEnabled) : DEFAULT_FOOTER_SETTINGS.socialSectionEnabled,

    facebookPageEnabled: data.facebookPageEnabled !== undefined ? Boolean(data.facebookPageEnabled) : DEFAULT_FOOTER_SETTINGS.facebookPageEnabled,
    facebookPageName: data.facebookPageName?.trim() || DEFAULT_FOOTER_SETTINGS.facebookPageName,
    facebookPageSubtitle: data.facebookPageSubtitle?.trim() || DEFAULT_FOOTER_SETTINGS.facebookPageSubtitle,
    facebookPageUrl: data.facebookPageUrl?.trim() || DEFAULT_FOOTER_SETTINGS.facebookPageUrl,

    facebookGroupEnabled: data.facebookGroupEnabled !== undefined ? Boolean(data.facebookGroupEnabled) : DEFAULT_FOOTER_SETTINGS.facebookGroupEnabled,
    facebookGroupName: data.facebookGroupName?.trim() || DEFAULT_FOOTER_SETTINGS.facebookGroupName,
    facebookGroupSubtitle: data.facebookGroupSubtitle?.trim() || DEFAULT_FOOTER_SETTINGS.facebookGroupSubtitle,
    facebookGroupUrl: data.facebookGroupUrl?.trim() || DEFAULT_FOOTER_SETTINGS.facebookGroupUrl,

    copyrightText: data.copyrightText?.trim() || DEFAULT_FOOTER_SETTINGS.copyrightText,
    copyrightYear: data.copyrightYear?.trim() || DEFAULT_FOOTER_SETTINGS.copyrightYear,
    siteName: data.siteName?.trim() || DEFAULT_FOOTER_SETTINGS.siteName,
    fullCopyrightText: data.fullCopyrightText?.trim() || `© ${data.copyrightYear || DEFAULT_FOOTER_SETTINGS.copyrightYear} ${data.siteName || DEFAULT_FOOTER_SETTINGS.siteName} ${data.copyrightText || DEFAULT_FOOTER_SETTINGS.copyrightText}`,

    authorName: data.authorName?.trim() || DEFAULT_FOOTER_SETTINGS.authorName,
    authorRole: data.authorRole?.trim() || DEFAULT_FOOTER_SETTINGS.authorRole,
    authorUrl: data.authorUrl?.trim() || DEFAULT_FOOTER_SETTINGS.authorUrl,

    tagline: data.tagline?.trim() || DEFAULT_FOOTER_SETTINGS.tagline,
    taglineText: data.taglineText?.trim() || DEFAULT_FOOTER_SETTINGS.taglineText,
    taglineEmoji: data.taglineEmoji?.trim() || DEFAULT_FOOTER_SETTINGS.taglineEmoji,

    socialOrder: Array.isArray(data.socialOrder) && data.socialOrder.length > 0 
      ? (data.socialOrder as ('facebook_page' | 'facebook_group')[])
      : DEFAULT_FOOTER_SETTINGS.socialOrder,

    updatedAt: data.updatedAt || new Date().toISOString(),
    updatedBy: data.updatedBy || '',
    updatedByEmail: data.updatedByEmail || ''
  };
}

/**
 * Fetch Footer Settings once from Firestore
 */
export async function getFooterSettings(): Promise<FooterSettings> {
  try {
    const docRef = doc(db, FOOTER_SETTINGS_DOC_PATH, FOOTER_SETTINGS_DOC_ID);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return sanitizeFooterSettings(snap.data() as Partial<FooterSettings>);
    }

    // Secondary fallback: check site_settings/main for legacy facebook urls
    try {
      const mainSnap = await getDoc(doc(db, FOOTER_SETTINGS_DOC_PATH, 'main'));
      if (mainSnap.exists()) {
        const mainData = mainSnap.data();
        const legacyFbPage = mainData?.socialLinks?.facebook || mainData?.facebookPage;
        const legacyFbGroup = mainData?.facebookGroup;
        if (legacyFbPage || legacyFbGroup) {
          return sanitizeFooterSettings({
            ...DEFAULT_FOOTER_SETTINGS,
            facebookPageUrl: legacyFbPage || DEFAULT_FOOTER_SETTINGS.facebookPageUrl,
            facebookGroupUrl: legacyFbGroup || DEFAULT_FOOTER_SETTINGS.facebookGroupUrl,
          });
        }
      }
    } catch (_) {}

    return { ...DEFAULT_FOOTER_SETTINGS };
  } catch (error) {
    console.warn("Failed to load footer settings, using default:", error);
    return { ...DEFAULT_FOOTER_SETTINGS };
  }
}

/**
 * Realtime subscription to Footer Settings
 */
export function subscribeFooterSettings(
  callback: (settings: FooterSettings) => void
): () => void {
  const docRef = doc(db, FOOTER_SETTINGS_DOC_PATH, FOOTER_SETTINGS_DOC_ID);

  const unsubscribe = onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback(sanitizeFooterSettings(snap.data() as Partial<FooterSettings>));
      } else {
        callback({ ...DEFAULT_FOOTER_SETTINGS });
      }
    },
    (error) => {
      console.warn("Realtime listener error for footer settings, fallback to default:", error);
      callback({ ...DEFAULT_FOOTER_SETTINGS });
    }
  );

  return unsubscribe;
}

/**
 * Save / Update Footer Settings (Super Admin Only)
 */
export async function saveFooterSettings(
  newSettings: Partial<FooterSettings>,
  currentUser?: { uid?: string; email?: string; displayName?: string; role?: string }
): Promise<{ success: boolean; message: string; data?: FooterSettings }> {
  // Validate URLs if enabled
  if (newSettings.facebookPageEnabled && newSettings.facebookPageUrl) {
    const pageVal = validateUrl(newSettings.facebookPageUrl, 'ফেসবুক পেজ লিংক');
    if (!pageVal.isValid) {
      throw new Error(pageVal.error);
    }
    newSettings.facebookPageUrl = pageVal.cleanUrl;
  }

  if (newSettings.facebookGroupEnabled && newSettings.facebookGroupUrl) {
    const groupVal = validateUrl(newSettings.facebookGroupUrl, 'ফেসবুক গ্রুপ লিংক');
    if (!groupVal.isValid) {
      throw new Error(groupVal.error);
    }
    newSettings.facebookGroupUrl = groupVal.cleanUrl;
  }

  // Get current snapshot for audit diff
  const previousState = await getFooterSettings();

  const userEmail = currentUser?.email || auth.currentUser?.email || 'super_admin';
  const userName = currentUser?.displayName || auth.currentUser?.displayName || 'সুপার অ্যাডমিন';
  const userUid = currentUser?.uid || auth.currentUser?.uid || '';

  const cleanData: FooterSettings = sanitizeFooterSettings({
    ...previousState,
    ...newSettings,
    updatedAt: new Date().toISOString(),
    updatedBy: userName,
    updatedByEmail: userEmail,
  });

  const docRef = doc(db, FOOTER_SETTINGS_DOC_PATH, FOOTER_SETTINGS_DOC_ID);
  await setDoc(docRef, cleanData, { merge: true });

  // Log Audit Action
  try {
    await logAuditActivity({
      action: 'UPDATE_FOOTER_SETTINGS',
      details: `সুপার অ্যাডমিন ফুটার ও সোশ্যাল লিংক সেটিংস আপডেট করেছেন। সাইট: ${cleanData.siteName}, লেখক: ${cleanData.authorName}`,
      category: 'system',
      severity: 'info',
      targetType: 'site_settings',
      targetId: 'footer',
      targetName: 'Footer & Social Links',
      previousState,
      newState: cleanData,
      customUser: userName,
      customEmail: userEmail,
      actorUid: userUid,
      actorRole: 'super_admin',
    });
  } catch (auditErr) {
    console.warn("Audit logging for footer settings failed:", auditErr);
  }

  return {
    success: true,
    message: 'সফলভাবে সংরক্ষণ করা হয়েছে',
    data: cleanData
  };
}

/**
 * Reset Footer Settings to System Defaults
 */
export async function resetFooterSettings(
  currentUser?: { uid?: string; email?: string; displayName?: string }
): Promise<FooterSettings> {
  const previousState = await getFooterSettings();

  const resetData: FooterSettings = {
    ...DEFAULT_FOOTER_SETTINGS,
    updatedAt: new Date().toISOString(),
    updatedBy: currentUser?.displayName || auth.currentUser?.displayName || 'সুপার অ্যাডমিন',
    updatedByEmail: currentUser?.email || auth.currentUser?.email || '',
  };

  const docRef = doc(db, FOOTER_SETTINGS_DOC_PATH, FOOTER_SETTINGS_DOC_ID);
  await setDoc(docRef, resetData);

  try {
    await logAuditActivity({
      action: 'RESET_FOOTER_SETTINGS',
      details: 'ফুটার ও সোশ্যাল লিংক সেটিংস ডিফল্ট মানে রিসেট করা হয়েছে।',
      category: 'system',
      severity: 'warning',
      targetType: 'site_settings',
      targetId: 'footer',
      previousState,
      newState: resetData,
      actorRole: 'super_admin'
    });
  } catch (_) {}

  return resetData;
}
