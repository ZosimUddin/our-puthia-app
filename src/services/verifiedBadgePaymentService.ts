import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  serverTimestamp, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { db } from "../firebase";
import { cleanUndefined } from "../utils/firestoreUtils";
import { notificationService } from "./notificationService";
import { logAuditActivity } from "./auditLogger";

export interface PaymentMethodConfig {
  enabled: boolean;
  number: string;
  accountType: 'Personal';
  accountHolderName?: string;
  instructions: string;
}

export interface VerifiedBadgePaymentSettings {
  badgePrice: number;
  currency: 'BDT';
  bkash: PaymentMethodConfig;
  nagad: PaymentMethodConfig;
  updatedAt?: any;
  updatedBy?: string;
}

export interface VerifiedBadgePaymentRequest {
  id: string;
  referenceId: string;
  userId: string;
  userName: string;
  userPhone?: string;
  userEmail?: string;
  method: 'bkash' | 'nagad';
  senderNumber: string;
  trxId: string;
  amountExpected: number;
  amountReported: number;
  currency: 'BDT';
  badgeType: 'blue_badge';
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  reviewerId?: string;
}

const LOCAL_STORAGE_SETTINGS_KEY = "adda_verified_badge_payment_settings";

/**
 * Normalizes any Bangladeshi phone number input (Bengali numerals, +88, spaces, hyphens) to clean 11-digit format (01XXXXXXXXX).
 */
export function normalizeBdPhone(phone: string): string {
  if (!phone) return "";
  const bengaliDigits: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  let clean = phone.replace(/[০-৯]/g, m => bengaliDigits[m] || m);
  let digits = clean.replace(/\D/g, "");
  if (digits.startsWith("8801") && digits.length === 13) {
    digits = digits.substring(2);
  }
  return digits;
}

/**
 * Validates whether phone is a valid 11-digit Bangladeshi mobile number
 */
export function isValidBdPhone(phone: string): boolean {
  const norm = normalizeBdPhone(phone);
  return /^01[3-9]\d{8}$/.test(norm);
}

export const DEFAULT_VERIFIED_PAYMENT_SETTINGS: VerifiedBadgePaymentSettings = {
  badgePrice: 150,
  currency: 'BDT',
  bkash: {
    enabled: true,
    number: '',
    accountType: 'Personal',
    accountHolderName: 'আমাদের পুঠিয়া কর্তৃপক্ষ',
    instructions: 'আপনার বিকাশ অ্যাপ অথবা *247# ডায়াল করে "Send Money" অপশন সিলেক্ট করুন। উপরের নম্বরে সঠিক পরিমাণ টাকা পাঠিয়ে TrxID টি ফর্মটিতে জমা দিন।'
  },
  nagad: {
    enabled: true,
    number: '',
    accountType: 'Personal',
    accountHolderName: 'আমাদের পুঠিয়া কর্তৃপক্ষ',
    instructions: 'আপনার নগদ অ্যাপ অথবা *167# ডায়াল করে "Send Money" অপশন সিলেক্ট করুন। উপরের নম্বরে সঠিক পরিমাণ টাকা পাঠিয়ে TrxID টি ফর্মটিতে জমা দিন।'
  }
};

const SETTINGS_DOC_REF = doc(db, "system_settings", "verified_badge_payment");

export const verifiedBadgePaymentService = {
  /**
   * Fetch current Verified Badge payment settings from Firestore with LocalStorage fallback
   */
  async getSettings(): Promise<VerifiedBadgePaymentSettings> {
    let localBackup: VerifiedBadgePaymentSettings | null = null;
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (raw) {
        localBackup = JSON.parse(raw);
      }
    } catch (_) {}

    try {
      const snap = await getDoc(SETTINGS_DOC_REF);
      if (snap.exists()) {
        const data = snap.data();
        const settings: VerifiedBadgePaymentSettings = {
          badgePrice: typeof data.badgePrice === 'number' ? data.badgePrice : (localBackup?.badgePrice || DEFAULT_VERIFIED_PAYMENT_SETTINGS.badgePrice),
          currency: 'BDT',
          bkash: {
            ...DEFAULT_VERIFIED_PAYMENT_SETTINGS.bkash,
            ...(localBackup?.bkash || {}),
            ...(data.bkash || {})
          },
          nagad: {
            ...DEFAULT_VERIFIED_PAYMENT_SETTINGS.nagad,
            ...(localBackup?.nagad || {}),
            ...(data.nagad || {})
          },
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy
        };

        // Cache locally for instant offline/fast loading
        try {
          localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
        } catch (_) {}

        return settings;
      }
    } catch (err) {
      console.warn("Failed to load verified badge payment settings from Firestore, using fallback:", err);
    }

    if (localBackup && (localBackup.bkash?.number || localBackup.nagad?.number)) {
      return localBackup;
    }

    return DEFAULT_VERIFIED_PAYMENT_SETTINGS;
  },

  /**
   * Update payment settings (Super Admin only)
   */
  async saveSettings(
    settings: Partial<VerifiedBadgePaymentSettings>,
    adminName: string
  ): Promise<boolean> {
    try {
      // Normalize phone numbers before saving
      const cleanBkashNum = settings.bkash?.number ? normalizeBdPhone(settings.bkash.number) : "";
      const cleanNagadNum = settings.nagad?.number ? normalizeBdPhone(settings.nagad.number) : "";

      const normalizedSettings: VerifiedBadgePaymentSettings = {
        badgePrice: Number(settings.badgePrice) || 150,
        currency: 'BDT',
        bkash: {
          ...DEFAULT_VERIFIED_PAYMENT_SETTINGS.bkash,
          ...(settings.bkash || {}),
          number: cleanBkashNum
        },
        nagad: {
          ...DEFAULT_VERIFIED_PAYMENT_SETTINGS.nagad,
          ...(settings.nagad || {}),
          number: cleanNagadNum
        },
        updatedAt: new Date().toISOString(),
        updatedBy: adminName
      };

      // 1. Immediately update LocalStorage cache so payment modals reflect changes instantly
      try {
        localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(normalizedSettings));
        window.dispatchEvent(new CustomEvent('verified_badge_settings_updated', { detail: normalizedSettings }));
      } catch (_) {}

      // 2. Persist to Firestore
      const payload = cleanUndefined({
        ...normalizedSettings,
        updatedAt: serverTimestamp()
      });
      await setDoc(SETTINGS_DOC_REF, payload, { merge: true });

      // Audit log
      try {
        await logAuditActivity({
          action: 'UPDATE_VERIFIED_PAYMENT_SETTINGS',
          details: `সুপার এডমিন ${adminName} ভেরিফাইড ব্যাজ পেমেন্ট সেটিংস (বিকাশ: ${cleanBkashNum}, নগদ: ${cleanNagadNum}) আপডেট করেছেন।`,
          category: 'financial',
          severity: 'info',
          targetId: 'verified_badge_payment',
          targetType: 'system_setting'
        });
      } catch (_) {}

      return true;
    } catch (err) {
      console.error("Error saving verified badge payment settings:", err);
      throw err;
    }
  },

  /**
   * Normalize Transaction ID: trim whitespace and uppercase
   */
  normalizeTrxId(trxId: string): string {
    return trxId.trim().toUpperCase();
  },

  /**
   * Generate clean submission reference ID: VR-XXXXXXXX
   */
  generateReferenceId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `VR-${res}`;
  },

  /**
   * Check if a TrxID has already been submitted in pending or approved requests
   */
  async isDuplicateTrxId(trxId: string): Promise<boolean> {
    const normalized = this.normalizeTrxId(trxId);
    if (!normalized) return false;

    try {
      // 1. Check verified_payment_requests
      const q = query(
        collection(db, "verified_payment_requests"),
        where("trxId", "==", normalized)
      );
      const snap = await getDocs(q);
      const existing = snap.docs.some(d => {
        const status = d.data().status;
        return status === 'pending' || status === 'approved';
      });
      if (existing) return true;

      // 2. Also check wallet_transactions
      const qWallet = query(
        collection(db, "wallet_transactions"),
        where("trxId", "==", normalized)
      );
      const snapWallet = await getDocs(qWallet);
      return snapWallet.docs.some(d => {
        const status = d.data().status;
        return status === 'pending' || status === 'completed';
      });
    } catch (err) {
      console.warn("Duplicate TrxID check note:", err);
      return false;
    }
  },

  /**
   * Submit a new Verified Badge payment request
   */
  async submitPaymentRequest(params: {
    userId: string;
    userName: string;
    userPhone?: string;
    userEmail?: string;
    method: 'bkash' | 'nagad';
    senderNumber: string;
    trxId: string;
    amountReported: number;
    amountExpected: number;
  }): Promise<{ success: boolean; referenceId: string; message: string }> {
    const normalizedTrx = this.normalizeTrxId(params.trxId);
    if (!normalizedTrx) {
      throw new Error("সঠিক ট্রানজেকশন আইডি (TrxID) প্রদান করুন।");
    }

    const isDup = await this.isDuplicateTrxId(normalizedTrx);
    if (isDup) {
      throw new Error("এই TrxID দিয়ে ইতিপূর্বে আবেদন জমা দেওয়া হয়েছে। অনুগ্রহ করে সঠিক TrxID যাচাই করুন।");
    }

    const referenceId = this.generateReferenceId();

    const requestPayload = cleanUndefined({
      referenceId,
      userId: params.userId,
      userName: params.userName,
      userPhone: params.userPhone || '',
      userEmail: params.userEmail || '',
      method: params.method,
      senderNumber: params.senderNumber.trim(),
      trxId: normalizedTrx,
      amountExpected: params.amountExpected,
      amountReported: params.amountReported,
      currency: 'BDT',
      badgeType: 'blue_badge',
      status: 'pending',
      createdAt: serverTimestamp()
    });

    // 1. Save to verified_payment_requests
    const docRef = await addDoc(collection(db, "verified_payment_requests"), requestPayload);

    // 2. Also record in wallet_transactions for financial audit trails
    try {
      await addDoc(collection(db, "wallet_transactions"), cleanUndefined({
        userId: params.userId,
        userName: params.userName,
        type: 'recharge',
        amount: params.amountReported,
        method: params.method,
        accountNumber: params.senderNumber.trim(),
        trxId: normalizedTrx,
        status: 'pending',
        description: `ব্লু ভেরিফাইড ব্যাজ পেমেন্ট (${params.method.toUpperCase()}) [${referenceId}]`,
        createdAt: serverTimestamp()
      }));
    } catch (wErr) {
      console.warn("wallet_transactions sync note:", wErr);
    }

    // 3. Dispatch confirmation notification to user
    try {
      await notificationService.dispatchNotification({
        recipientId: params.userId,
        actorId: 'system',
        actorName: 'আমাদের পুঠিয়া',
        actorAvatar: '',
        type: 'system_notification',
        targetId: docRef.id,
        targetType: 'verified_badge',
        title: '📩 ভেরিফাইড ব্যাজ পেমেন্ট জমা হয়েছে!',
        message: `আপনার ৳${params.amountReported} পেমেন্ট আবেদন (Ref: ${referenceId}) যাচাইয়ের জন্য জমা হয়েছে। এডমিন অনুমোদনের পর ব্যাজ সক্রিয় হবে।`,
        actionData: { referenceId, trxId: normalizedTrx }
      });
    } catch (_) {}

    return {
      success: true,
      referenceId,
      message: "পেমেন্ট আবেদন সফলভাবে জমা হয়েছে! ম্যানুয়াল যাচাইয়ের পর ব্লু ব্যাজ সক্রিয় করা হবে।"
    };
  },

  /**
   * Get user's own payment history
   */
  async getUserRequests(userId: string): Promise<VerifiedBadgePaymentRequest[]> {
    if (!userId) return [];
    try {
      const q = query(
        collection(db, "verified_payment_requests"),
        where("userId", "==", userId)
      );
      const snap = await getDocs(q);
      const list: VerifiedBadgePaymentRequest[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as VerifiedBadgePaymentRequest);
      });
      list.sort((a, b) => {
        const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
        return tB - tA;
      });
      return list;
    } catch (err) {
      console.warn("getUserRequests error:", err);
      return [];
    }
  },

  /**
   * Super Admin approves a payment request and activates the verified badge
   */
  async approveRequest(
    request: VerifiedBadgePaymentRequest,
    adminId: string,
    adminName: string
  ): Promise<boolean> {
    if (!request.id || !request.userId) {
      throw new Error("অনুরোধের তথ্য অসম্পূর্ণ।");
    }

    // 1. Mark request as approved
    const reqRef = doc(db, "verified_payment_requests", request.id);
    await updateDoc(reqRef, {
      status: 'approved',
      reviewedAt: serverTimestamp(),
      reviewedBy: adminName,
      reviewerId: adminId
    });

    // 2. Activate Verified Badge on User document (Idempotent)
    const userRef = doc(db, "users", request.userId);
    await setDoc(userRef, {
      isVerified: true,
      verified: true,
      verificationStatus: 'approved',
      verifiedBadgeType: 'blue_badge',
      verifiedAt: serverTimestamp(),
      verifiedBy: adminName
    }, { merge: true });

    // 3. Update matching wallet transaction if present
    if (request.trxId) {
      try {
        const qW = query(
          collection(db, "wallet_transactions"),
          where("trxId", "==", request.trxId)
        );
        const snapW = await getDocs(qW);
        for (const wDoc of snapW.docs) {
          await updateDoc(wDoc.ref, {
            status: 'completed',
            approvedAt: serverTimestamp(),
            approvedBy: adminName
          });
        }
      } catch (_) {}
    }

    // 4. Dispatch celebration notification to citizen
    try {
      await notificationService.dispatchNotification({
        recipientId: request.userId,
        actorId: adminId,
        actorName: adminName,
        actorAvatar: '',
        type: 'system_notification',
        targetId: request.id,
        targetType: 'verified_badge',
        title: '🎉 আপনার ব্লু ভেরিফাইড ব্যাজ সক্রিয় হয়েছে!',
        message: `অভিনন্দন! আপনার ভেরিফাইড ব্যাজ পেমেন্ট (Ref: ${request.referenceId}) অনুমোদিত হয়েছে। এখন আপনার প্রোফাইলে ব্লু ব্যাজ দৃশ্যমান।`,
        actionData: { referenceId: request.referenceId, status: 'approved' }
      });
    } catch (_) {}

    // 5. Audit Log
    try {
      await logAuditActivity({
        action: 'APPROVE_VERIFIED_BADGE_PAYMENT',
        details: `সুপার এডমিন ${adminName} ইউজার ${request.userName} (UID: ${request.userId})-এর ব্লু ব্যাজ পেমেন্ট (TrxID: ${request.trxId}, Ref: ${request.referenceId}) অনুমোদন ও ব্যাজ সক্রিয় করেছেন।`,
        category: 'financial',
        severity: 'info',
        targetId: request.id,
        targetType: 'verified_payment_request'
      });
    } catch (_) {}

    return true;
  },

  /**
   * Super Admin rejects a payment request with a mandatory reason
   */
  async rejectRequest(
    request: VerifiedBadgePaymentRequest,
    reason: string,
    adminId: string,
    adminName: string
  ): Promise<boolean> {
    if (!request.id || !request.userId) {
      throw new Error("অনুরোধের তথ্য অসম্পূর্ণ।");
    }
    const cleanReason = reason.trim();
    if (!cleanReason) {
      throw new Error("বাতিল করার সুনির্দিষ্ট কারণ উল্লেখ করুন।");
    }

    // 1. Mark request as rejected
    const reqRef = doc(db, "verified_payment_requests", request.id);
    await updateDoc(reqRef, {
      status: 'rejected',
      rejectionReason: cleanReason,
      reviewedAt: serverTimestamp(),
      reviewedBy: adminName,
      reviewerId: adminId
    });

    // 2. Update matching wallet transaction if present
    if (request.trxId) {
      try {
        const qW = query(
          collection(db, "wallet_transactions"),
          where("trxId", "==", request.trxId)
        );
        const snapW = await getDocs(qW);
        for (const wDoc of snapW.docs) {
          await updateDoc(wDoc.ref, {
            status: 'rejected',
            rejectionReason: cleanReason,
            rejectedAt: serverTimestamp(),
            rejectedBy: adminName
          });
        }
      } catch (_) {}
    }

    // 3. Dispatch alert notification to citizen
    try {
      await notificationService.dispatchNotification({
        recipientId: request.userId,
        actorId: adminId,
        actorName: adminName,
        actorAvatar: '',
        type: 'system_notification',
        targetId: request.id,
        targetType: 'verified_badge',
        title: '⚠️ ভেরিফাইড ব্যাজ পেমেন্ট আবেদন প্রত্যাখ্যাত',
        message: `আপনার ব্লু ব্যাজ পেমেন্ট আবেদন (Ref: ${request.referenceId}) বাতিল করা হয়েছে। কারণ: ${cleanReason}`,
        actionData: { referenceId: request.referenceId, status: 'rejected', reason: cleanReason }
      });
    } catch (_) {}

    // 4. Audit Log
    try {
      await logAuditActivity({
        action: 'REJECT_VERIFIED_BADGE_PAYMENT',
        details: `সুপার এডমিন ${adminName} ইউজার ${request.userName} (UID: ${request.userId})-এর ব্লু ব্যাজ পেমেন্ট (TrxID: ${request.trxId}) বাতিল করেছেন। কারণ: ${cleanReason}`,
        category: 'financial',
        severity: 'warning',
        targetId: request.id,
        targetType: 'verified_payment_request'
      });
    } catch (_) {}

    return true;
  }
};
