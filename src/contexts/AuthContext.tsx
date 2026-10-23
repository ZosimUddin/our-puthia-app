import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db, requestNotificationPermission } from "../firebase";
import { requestAndSaveFcmToken, removeFcmToken } from "../services/fcmTokenService";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, getDocs, limit } from "firebase/firestore";
import { logAuditEvent } from "../utils/audit";
import { AdminRole } from "../types/admin";
import { cleanWardFromText } from "../utils/cleanWard";
import { toast } from "sonner";
import { sendWelcomeEmail, sendPasswordResetCustomEmail } from "../services/emailService";

export interface UserProfile {
  uid: string;
  name: string;
  displayName?: string;
  nickname?: string;
  email?: string;
  phone: string;
  division?: string;
  district?: string;
  upazila?: string;
  village: string;
  union: string;
  gender: string;
  bloodGroup: string;
  isBloodDonor: boolean;
  education?: string;
  bio?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
  stars: number;
  points?: number;
  badges: string[];
  followersCount?: number;
  followingCount?: number;
  followers?: string[]; // Array of UIDs
  following?: string[]; // Array of UIDs
  friendsCount?: number;
  friends?: string[]; // Array of friend UIDs
  friendRequestsReceived?: string[]; // Array of received friend request UIDs
  friendRequestsSent?: string[]; // Array of sent friend request UIDs
  createdAt: string;
  photoURL?: string;
  coverURL?: string;
  profileCompleteAwarded?: boolean;
  accountVerifiedAwarded?: boolean;
  role?: AdminRole;
  isBlocked?: boolean;
  permissions?: string[]; 
  // Legacy/Additional fields for linting and older views
  memberSince?: string;
  dob?: string;
  address?: string;
  occupation?: string;
  mobileVerifyStatus?: 'unverified' | 'pending' | 'verified';
  emailVerifyStatus?: 'unverified' | 'pending' | 'verified';
  nidStatus?: 'unverified' | 'pending' | 'verified';
  nidNumber?: string;
  privacySettings?: {
    privacyPublic?: boolean;
    privacyHidePhone?: boolean;
    privacyShareLocation?: boolean;
    phone?: 'public' | 'only_me';
    address?: 'public' | 'only_me';
    dob?: 'public' | 'only_me';
    email?: 'public' | 'only_me';
    profileVisibility?: 'public' | 'private';
  };
  notificationSettings?: {
    notifPush?: boolean;
    notifEmail?: boolean;
    notifSms?: boolean;
    notifNewsEmergency?: boolean;
  };
  securitySettings?: {
    isPinSet?: boolean;
    pinCode?: string;
    is2FaEnabled?: boolean;
  };
  rank?: number | string;
  bloodDonationCount?: number;
  complaintsCount?: number;
  businessesCount?: number;
  marketplaceSubscription?: 'free' | 'premium' | 'featured';
  hometown?: string;
  relationshipStatus?: string;
  highSchool?: string;
  collegeUniversity?: string;
  workExperience?: string;
  workCompany?: string;
  workPosition?: string;
  instagramUsername?: string;
  instagram?: string;
  website?: string;
  birthDate?: string;
  birthday?: string;
  location?: string;
  isProfileLocked?: boolean;
  workList?: any[];
  educationList?: any[];
  skills?: any[];
  services?: any[];
  workRole?: string;
  highlights?: { id: string; title: string; imageUrl: string; }[];
  links?: { id: string; url: string; label: string; }[];
}

interface AuthContextType {
  user: any | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  registerWithEmail: (email: string | undefined, password: string, name: string, phone: string, village: string, union: string, gender: string, bloodGroup: string, isBloodDonor: boolean, upazila?: string) => Promise<void>;
  loginWithEmail: (emailOrPhone: string, password: string, rememberMe?: boolean) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addStars: (amount: number, reason?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Clean any legacy demo keys from local storage
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem("demo_mode_active");
      localStorage.removeItem("demo_mode_role");
    }
  }, []);

  // Sync user profile from Firestore with real-time listener
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    // Immediately hydrate from local cache if available to prevent avatar flicker
    if (typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem(`cached_user_profile_${user.uid}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.uid === user.uid) {
            setUserProfile(prev => prev || parsed);
          }
        }
      } catch {}
    }

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, async (userSnap) => {
      if (userSnap.exists()) {
        const rawData = userSnap.data() || {};
        const resolvedPhoto = rawData.photoURL || rawData.photoUrl || rawData.avatarUrl || rawData.photo || rawData.avatar || user.photoURL || '';
        const data = { 
          ...rawData, 
          photoURL: resolvedPhoto, 
          photoUrl: resolvedPhoto, 
          avatarUrl: resolvedPhoto 
        } as unknown as UserProfile;
        
        // Auto-recover phone number if missing in profile document
        if (!data.phone) {
          const derivedPhone = user.phoneNumber || 
            (user.email && /^01\d{9}@puthiadiary\.com$/.test(user.email) ? user.email.split('@')[0] : '') ||
            (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_registered_phone') || '' : '');
          if (derivedPhone) {
            data.phone = derivedPhone;
            try { updateDoc(userRef, { phone: derivedPhone }); } catch {}
          }
        }
        
        // Respect the role stored in Firestore. Default to 'user' if not set.
        if (!data.role) {
          const isMasterAdminEmail = user.email === 'mdzosimuddin31@gmail.com';
          data.role = isMasterAdminEmail ? 'super_admin' : 'user';
          try { updateDoc(userRef, { role: data.role }); } catch {}
        }
        
        // Auto-sanitize legacy ward numbers from stored village and address
        let needsDbClean = false;
        const updatesToPersist: Partial<UserProfile> = {};

        if (data.village) {
          const cleanedVillage = cleanWardFromText(data.village);
          if (cleanedVillage !== data.village) {
            data.village = cleanedVillage;
            updatesToPersist.village = cleanedVillage;
            needsDbClean = true;
          }
        }

        if (data.address) {
          const cleanedAddress = cleanWardFromText(data.address);
          if (cleanedAddress !== data.address) {
            data.address = cleanedAddress;
            updatesToPersist.address = cleanedAddress;
            needsDbClean = true;
          }
        }

        if (needsDbClean) {
          try { updateDoc(userRef, updatesToPersist); } catch {}
          if (typeof localStorage !== 'undefined') {
            if (data.village) localStorage.setItem('auth_registered_village', data.village);
            if (data.address) localStorage.setItem('auth_registered_location', data.address);
          }
        }

        setUserProfile(data);
        try { localStorage.setItem(`cached_user_profile_${user.uid}`, JSON.stringify(data)); } catch {}
      } else {
        const derivedPhone = user.phoneNumber || 
          (user.email && /^01\d{9}@puthiadiary\.com$/.test(user.email) ? user.email.split('@')[0] : '') ||
          (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_registered_phone') || '' : '');

        const isMasterAdminEmail = 
          user.email === 'mdzosimuddin31@gmail.com' || 
          user.email === 'mdzosimuddin47@gmail.com' || 
          user.email === 'josimuddinadds@gmail.com' ||
          Boolean(user.email && user.email.startsWith('admin@'));

        // Create initial profile if it doesn't exist
        const initialProfile: UserProfile = {
          uid: user.uid,
          name: user.displayName || user.email?.split("@")[0] || "সম্মানিত নাগরিক",
          phone: derivedPhone || "",
          village: "",
          union: "বানেশ্বর",
          upazila: "পুঠিয়া",
          district: "রাজশাহী",
          division: "রাজশাহী",
          address: "বানেশ্বর, পুঠিয়া, রাজশাহী",
          gender: "পুরুষ",
          bloodGroup: "O+",
          isBloodDonor: false,
          stars: 20, // 20 starter stars for joining!
          role: isMasterAdminEmail ? 'super_admin' : 'user',
          badges: ["সচেতন নাগরিক"], // Starter badge
          photoURL: user.photoURL || "",
          createdAt: new Date().toISOString(),
          accountVerifiedAwarded: true
        };
        try { 
          await setDoc(userRef, initialProfile); 
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('just_registered', 'true');
          }
        } catch (profileError: any) {
          console.error("Profile creation failed:", profileError);
          if (profileError?.code === "resource-exhausted" || profileError?.message?.includes("quota")) {
            toast.error("ডাটাবেজ লিমিট শেষ হওয়ার কারণে প্রোফাইল সেভ করা যায়নি।");
          }
        }
        setUserProfile(initialProfile);
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(`cached_user_profile_${user.uid}`, JSON.stringify(initialProfile));
          } catch {}
        }
      }
    }, (error) => {
      if (error?.message?.includes("Quota") || error?.code === "resource-exhausted") {
        console.warn("Firestore quota limit reached for user profile sync. Using cached/fallback profile.");
      } else {
        console.warn("Error syncing user profile:", error?.message || error);
      }

      if (user) {
        let fallbackProfile: UserProfile | null = null;
        try {
          const cached = localStorage.getItem(`cached_user_profile_${user.uid}`);
          if (cached) fallbackProfile = JSON.parse(cached);
        } catch {}

        if (!fallbackProfile) {
          const derivedPhone = user.phoneNumber || 
            (user.email && /^01\d{9}@puthiadiary\.com$/.test(user.email) ? user.email.split('@')[0] : '') ||
            (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_registered_phone') || '' : '');

          const isMasterAdminEmail = 
            user.email === 'mdzosimuddin31@gmail.com' || 
            user.email === 'mdzosimuddin47@gmail.com' || 
            user.email === 'josimuddinadds@gmail.com' ||
            Boolean(user.email && user.email.startsWith('admin@'));

          fallbackProfile = {
            uid: user.uid,
            name: user.displayName || user.email?.split("@")[0] || "সম্মানিত নাগরিক",
            phone: derivedPhone || "",
            village: "",
            union: "বানেশ্বর",
            upazila: "পুঠিয়া",
            district: "রাজশাহী",
            division: "রাজশাহী",
            address: "বানেশ্বর, পুঠিয়া, রাজশাহী",
            gender: "পুরুষ",
            bloodGroup: "O+",
            isBloodDonor: false,
            stars: 20,
            role: isMasterAdminEmail ? 'super_admin' : 'user',
            badges: ["সচেতন নাগরিক"],
            createdAt: new Date().toISOString(),
            accountVerifiedAwarded: true
          };
        }
        setUserProfile(fallbackProfile);
      }
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    // Capture Google Sign-In redirect result if triggered via signInWithRedirect
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        console.log("Successfully authenticated via Google redirect:", result.user.email);
        await logAuditEvent("login", "users", result.user.uid, { method: "google_redirect" });
      }
    }).catch((err) => {
      if (err?.code !== 'auth/popup-closed-by-user') {
        console.warn("Google redirect authentication notice:", err?.message || err);
      }
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await requestAndSaveFcmToken(currentUser.uid);
        } catch (err) {
          console.warn("Could not get or save FCM token:", err);
        }
      }
      setLoading(false);
    });

    return unsubscribeAuth;
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    const isIframe = typeof window !== 'undefined' && (
      window.self !== window.top ||
      window.location.hostname.includes('run.app') ||
      window.location.hostname.includes('google.com') ||
      window.location.hostname.includes('aistudio') ||
      window.location.hostname.includes('web.app') ||
      window.location.hostname.includes('firebaseapp.com') ||
      window.location.hostname.includes('localhost')
    );

    const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent);

    console.log("Google Login Attempt - Env:", { isIframe, isMobile, hostname: window.location.hostname });

    try {
      // In AI Studio or Shared Preview, ALWAYS prefer popup if possible
      // but on mobile, popups are often blocked or fail.
      const result = await signInWithPopup(auth, provider);
      await logAuditEvent("login", "users", result.user.uid, { method: "google" });
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.log("User closed or cancelled Google sign-in popup.");
        return;
      }

      // Avoid signInWithRedirect inside preview iframe since OAuth redirects to aistudio.google.com triggering 403 Forbidden
      // We also avoid it on run.app domains to prevent cross-origin redirect issues in the AI Studio container
      if (isIframe) {
        console.warn("Google login failed/blocked in preview environment:", error);
        
        if (
          error.code === 'auth/popup-blocked' ||
          error.code === 'auth/internal-error' ||
          error.code === 'auth/operation-not-supported-in-this-environment' ||
          error.message?.includes('popup-blocked')
        ) {
          throw new Error("প্রিভিউ মোডে (AI Studio) গুগল পপ-আপ সরাসরি কাজ না করলে অনুগ্রহ করে নিচের 'ইমেইল ও পাসওয়ার্ড' ব্যবহার করে লগইন করুন। অথবা অ্যাপটি সরাসরি ব্রাউজারের নতুন ট্যাবে ওপেন করে ট্রাই করুন।");
        }
        
        if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized-domain')) {
          throw new Error("ডোমেইনটি ফায়ারবেস অথরাইজড লিস্টে নেই। অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।");
        }

        // If it's a mobile device inside a preview, redirects will likely fail with 403
        if (isMobile) {
          throw new Error("মোবাইল ব্রাউজারে প্রিভিউ মুডে গুগল লগইন সীমাবদ্ধ হতে পারে। দয়া করে ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।");
        }

        // Specifically catch the 403-like scenario by preventing the redirect fallback
        throw new Error("গুগল লগইন বর্তমানে এই প্রিভিউ মোডে সীমাবদ্ধ। অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড ব্যবহার করুন।");
      }

      // Only proceed to redirect if NOT in an iframe/preview environment
      if (
        error.code === 'auth/popup-blocked' || 
        error.code === 'auth/internal-error' || 
        error.code === 'auth/operation-not-supported-in-this-environment' ||
        error.message?.includes('popup-blocked') ||
        error.message?.includes('internal-error')
      ) {
        console.warn("Popup blocked/failed, attempting redirect login...", error);
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr) {
          console.error("Redirect login failed:", redirectErr);
          throw redirectErr;
        }
      } else {
        console.warn("Google login notice:", error?.message || error);
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string | undefined, 
    password: string, 
    name: string, 
    phone: string, 
    village: string, 
    union: string,
    gender: string,
    bloodGroup: string,
    isBloodDonor: boolean,
    upazila: string = "পুঠিয়া উপজেলা"
  ) => {
    setLoading(true);
    try {
      // If no email is provided, generate a dummy one based on phone number
      const registrationEmail = (email && email.trim()) ? email.trim() : `${phone.trim()}@puthiadiary.com`;
      const result = await createUserWithEmailAndPassword(auth, registrationEmail, password);
      
      const locVillage = village ? cleanWardFromText(village) : "";
      const locUnion = union ? union.trim() : "বানেশ্বর";
      const locUpazila = upazila ? upazila.trim() : "পুঠিয়া";
      const locAddress = cleanWardFromText(`${locVillage ? locVillage + ', ' : ''}${locUnion ? locUnion + ', ' : ''}${locUpazila}, রাজশাহী`);

      // Save custom profile directly
      const initialProfile: UserProfile = {
        uid: result.user.uid,
        email: registrationEmail,
        name: name.trim(),
        phone: phone.trim(),
        village: locVillage,
        union: locUnion,
        upazila: locUpazila,
        division: "রাজশাহী",
        district: "রাজশাহী",
        address: locAddress,
        gender,
        bloodGroup,
        isBloodDonor,
        stars: 20, // 20 welcome stars!
        badges: isBloodDonor ? ["সচেতন নাগরিক", "রক্তবীর"] : ["সচেতন নাগরিক"],
        createdAt: new Date().toISOString(),
        accountVerifiedAwarded: true
      };

      await setDoc(doc(db, "users", result.user.uid), initialProfile);
      try { localStorage.setItem('auth_registered_phone', phone.trim()); } catch {}
      try { localStorage.setItem('auth_registered_location', locAddress); } catch {}
      try { localStorage.setItem('auth_registered_village', locVillage); } catch {}
      try { localStorage.setItem('auth_registered_union', locUnion); } catch {}
      setUserProfile(initialProfile);

      // Trigger Welcome Email to new user
      if (registrationEmail && !registrationEmail.endsWith("@puthiadiary.com")) {
        sendWelcomeEmail({
          to: registrationEmail,
          name: name.trim(),
          phone: phone.trim(),
          stars: 20
        }).catch((err) => {
          console.warn("Welcome email async trigger notice:", err);
        });
      }
    } catch (error) {
      console.error("Email registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (emailOrPhone: string, password: string, rememberMe: boolean = true) => {
    setLoading(true);
    try {
      try {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      } catch (pErr) {
        console.warn("Could not set persistence:", pErr);
      }
      
      const rawInput = (emailOrPhone || "").trim();
      // Normalize Bengali numerals to English numerals
      const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      const normalized = rawInput.replace(/[০-৯]/g, (d) => bengaliDigits.indexOf(d).toString());
      
      // Clean up punctuation, spaces and international prefix for BD numbers
      let cleanDigits = normalized.replace(/[\s\-\(\)\+]/g, '');
      if (cleanDigits.startsWith('8801')) {
        cleanDigits = cleanDigits.slice(2);
      } else if (cleanDigits.startsWith('88')) {
        cleanDigits = cleanDigits.slice(2);
      }
      if (/^1\d{9}$/.test(cleanDigits)) {
        cleanDigits = '0' + cleanDigits;
      }
      
      const isPhonePattern = /^01\d{9}$/.test(cleanDigits);
      const isEmail = rawInput.includes('@');

      if (isPhonePattern) {
        try { localStorage.setItem('auth_registered_phone', cleanDigits); } catch {}
      }

      // Build ordered list of candidate auth emails to try
      const candidateEmails: string[] = [];

      if (isEmail) {
        candidateEmails.push(rawInput.toLowerCase());
        if (rawInput !== rawInput.toLowerCase()) {
          candidateEmails.push(rawInput);
        }
      }

      if (isPhonePattern) {
        // Query Firestore users collection for phone number match across all formats
        try {
          const usersRef = collection(db, "users");
          const phoneVariants = [cleanDigits, `+88${cleanDigits}`, `88${cleanDigits}`];
          const queryPromises = phoneVariants.map(v => 
            getDocs(query(usersRef, where("phone", "==", v), limit(1)))
          );
          const snaps = await Promise.all(queryPromises);
          
          for (const snap of snaps) {
            if (!snap.empty) {
              const uData = snap.docs[0].data();
              if (uData?.email && typeof uData.email === 'string') {
                const foundEmail = uData.email.trim();
                if (foundEmail && !candidateEmails.includes(foundEmail)) {
                  candidateEmails.push(foundEmail);
                }
              }
              break;
            }
          }
        } catch (lookupErr) {
          console.warn("Firestore phone lookup notice:", lookupErr);
        }

        // Add standard synthetic phone emails
        const syntheticVariants = [
          `${cleanDigits}@puthiadiary.com`,
          `+88${cleanDigits}@puthiadiary.com`,
          `${cleanDigits}@ourputhia.com`
        ];
        for (const syn of syntheticVariants) {
          if (!candidateEmails.includes(syn)) {
            candidateEmails.push(syn);
          }
        }
      }

      // Fallback for non-standard inputs
      if (candidateEmails.length === 0) {
        candidateEmails.push(rawInput);
      }

      let lastError: any = null;
      let authenticated = false;

      for (const candidate of candidateEmails) {
        try {
          const result = await signInWithEmailAndPassword(auth, candidate, password);
          await logAuditEvent("login", "users", result.user.uid, { 
            method: isPhonePattern ? "phone_resolved" : "email",
            identifier: isPhonePattern ? cleanDigits : candidate
          });
          
          // If Firestore user doc had no email, update it with authenticated email
          if (result.user.uid && candidate.includes('@') && !candidate.endsWith('@puthiadiary.com')) {
            try {
              updateDoc(doc(db, "users", result.user.uid), { email: candidate });
            } catch {}
          }

          authenticated = true;
          return;
        } catch (err: any) {
          lastError = err;
          // If password was wrong on an exact match email, don't keep guessing
          if (err?.code === 'auth/wrong-password') {
            throw err;
          }
        }
      }

      if (!authenticated && lastError) {
        throw lastError;
      }
    } catch (error: any) {
      if (
        error?.code === 'auth/invalid-credential' || 
        error?.code === 'auth/wrong-password' || 
        error?.code === 'auth/user-not-found'
      ) {
        console.warn("Authentication notice: Invalid credentials entered by user");
      } else {
        console.error("Email login error:", error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      // Also queue custom formatted password reset notification
      try {
        await sendPasswordResetCustomEmail({
          to: email,
          name: email.split("@")[0]
        });
      } catch (customErr) {
        console.warn("Custom password reset email queue notice:", customErr);
      }
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (user?.uid) {
        await removeFcmToken(user.uid);
      }
      localStorage.removeItem("demo_mode_active");
      localStorage.removeItem("demo_mode_role");
      sessionStorage.removeItem("super_admin_session_active");
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const sanitized = { ...updates };
      if (sanitized.village) {
        sanitized.village = cleanWardFromText(sanitized.village);
      }
      if (sanitized.address) {
        sanitized.address = cleanWardFromText(sanitized.address);
      }
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, sanitized, { merge: true });
      setUserProfile(prev => {
        const photo = sanitized.photoURL || (sanitized as any).photoUrl || (sanitized as any).avatarUrl || prev?.photoURL || '';
        const updated = prev 
          ? { ...prev, ...sanitized, photoURL: photo, photoUrl: photo, avatarUrl: photo } 
          : ({ uid: user.uid, ...sanitized, photoURL: photo, photoUrl: photo, avatarUrl: photo } as UserProfile);
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(`cached_user_profile_${user.uid}`, JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });

      if (auth.currentUser && (sanitized.photoURL || sanitized.name)) {
        try {
          await updateProfile(auth.currentUser, {
            ...(sanitized.photoURL ? { photoURL: sanitized.photoURL } : {}),
            ...(sanitized.name ? { displayName: sanitized.name } : {})
          });
        } catch (e) {
          console.warn("Could not update auth profile directly:", e);
        }
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  };

  const addStars = async (amount: number, reason?: string) => {
    if (!user || !userProfile) return;
    const newStars = (userProfile.stars || 0) + amount;
    const updatedBadges = [...(userProfile.badges || [])];
    if (newStars >= 50 && !updatedBadges.includes("পুঠিয়া চ্যাম্পিয়ন")) {
      updatedBadges.push("পুঠিয়া চ্যাম্পিয়ন");
    }
    if (newStars >= 100 && !updatedBadges.includes("নগর রত্ন")) {
      updatedBadges.push("নগর রত্ন");
    }

    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { 
        stars: newStars,
        badges: updatedBadges
      }, { merge: true });

      setUserProfile(prev => prev ? { ...prev, stars: newStars, badges: updatedBadges } : null);
    } catch (error) {
      console.error("Error adding stars:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      loginWithGoogle, 
      registerWithEmail, 
      loginWithEmail, 
      resetPassword,
      logout,
      updateUserProfile,
      addStars
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
