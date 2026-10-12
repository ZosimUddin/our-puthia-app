/**
 * Utility functions for user profile avatar extraction and validation.
 * Ensures 100% consistent avatar rendering across StoriesBar, CreatePostBox, 
 * DiscussionPage, Headers, and Navigation Bars.
 */

// Specific default branding asset paths that should not be used as user profile pictures
const APP_BRANDING_ASSETS = [
  '/logo.svg',
  '/logo.png',
  '/logo.jpg',
  'puthia_official_icon_logo',
  'puthia_official_full_logo',
  'puthia_app_logo_',
  'puthia_logo_'
];

/**
 * Checks if a given string is a valid image URL for a user profile,
 * rejecting dummy/placeholder generators and default app branding logos.
 */
export function isRealUserAvatar(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Filter dummy avatar generators
  if (
    trimmed.includes('dicebear') ||
    trimmed.includes('avataaars') ||
    trimmed.includes('unsplash')
  ) {
    return false;
  }

  // Filter default app branding asset filenames/paths
  for (const asset of APP_BRANDING_ASSETS) {
    if (trimmed.includes(asset)) {
      return false;
    }
  }

  return true;
}

/**
 * Safely extracts the raw avatar URL from userProfile and auth user objects
 * covering all known schema variations (photoURL, photoUrl, avatarUrl, photo, avatar).
 */
export function extractRawAvatar(userProfile?: any, user?: any): string {
  if (!userProfile && !user) return '';

  const raw =
    userProfile?.photoURL ||
    userProfile?.photoUrl ||
    userProfile?.avatarUrl ||
    userProfile?.photo ||
    userProfile?.avatar ||
    user?.photoURL ||
    user?.photoUrl ||
    user?.avatar ||
    '';

  return typeof raw === 'string' ? raw.trim() : '';
}

/**
 * Returns the cleaned, usable avatar URL if valid, or an empty string.
 */
export function getCleanAvatar(userProfile?: any, user?: any): string {
  const raw = extractRawAvatar(userProfile, user);
  return isRealUserAvatar(raw) ? raw : '';
}

/**
 * Resolves a dynamic first letter for a user's avatar fallback.
 * Uses Bengali 'আ' (from 'আমাদের পুঠিয়া') as the system default.
 */
export function getUserInitial(userProfile?: any, user?: any, fallback = 'আ'): string {
  const name =
    userProfile?.name ||
    userProfile?.displayName ||
    user?.displayName ||
    user?.name ||
    user?.email?.split('@')[0] ||
    '';

  const trimmed = name.trim();
  if (!trimmed) return fallback;

  return (trimmed.charAt(0) || fallback).toUpperCase();
}
