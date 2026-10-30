import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  BadgeCheck, 
  Edit3, 
  Plus, 
  CreditCard, 
  Smile, 
  Camera, 
  Check, 
  X, 
  AlertCircle, 
  Upload, 
  ShieldCheck,
  Phone,
  User,
  Calendar,
  MapPin,
  Briefcase,
  Copy,
  Clock,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  increment 
} from "firebase/firestore";
import { compressImageToBase64 } from "../../api";
import { cleanUndefined } from "../../utils/firestoreUtils";
import SEO from "../../components/SEO";
import { 
  verifiedBadgePaymentService, 
  VerifiedBadgePaymentSettings, 
  DEFAULT_VERIFIED_PAYMENT_SETTINGS,
  VerifiedBadgePaymentRequest,
  normalizeBdPhone
} from "../../services/verifiedBadgePaymentService";

export const GetVerifiedPage: React.FC = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  // Hidden File Inputs for Document & Selfie capture
  const nidFrontInputRef = useRef<HTMLInputElement>(null);
  const nidBackInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  // Uploaded Document Previews
  const [nidFront, setNidFront] = useState<string>("");
  const [nidBack, setNidBack] = useState<string>("");
  const [selfie, setSelfie] = useState<string>("");

  // Modal States
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile Edit Inputs
  const [editPhone, setEditPhone] = useState(userProfile?.phone || "");
  const [editBio, setEditBio] = useState(userProfile?.bio || "");
  const [editGender, setEditGender] = useState((userProfile as any)?.gender || "male");
  const [editDob, setEditDob] = useState((userProfile as any)?.birthday || (userProfile as any)?.dob || "");
  const [editLocation, setEditLocation] = useState(userProfile?.village ? `${userProfile.village}, ${userProfile.union || "পুঠিয়া"}` : (userProfile as any)?.location || "");
  const [editOccupation, setEditOccupation] = useState(userProfile?.occupation || (userProfile as any)?.professionalCategory || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Recharge & Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState<VerifiedBadgePaymentSettings>(DEFAULT_VERIFIED_PAYMENT_SETTINGS);
  const [userRequests, setUserRequests] = useState<VerifiedBadgePaymentRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [submissionSuccessRef, setSubmissionSuccessRef] = useState<string | null>(null);

  const [rechargeAmount, setRechargeAmount] = useState(150);
  const [rechargeMethod, setRechargeMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [senderNumber, setSenderNumber] = useState("");
  const [trxId, setTrxId] = useState("");
  const [isRecharging, setIsRecharging] = useState(false);

  // Authoritative Badge Fee from Super Admin settings
  const requiredFee = paymentSettings.badgePrice || 150;
  const walletBalance = Number((userProfile as any)?.walletBalance || 0);
  const balanceNeeded = Math.max(0, requiredFee - walletBalance);

  // Load live settings & user payment requests
  const loadSettings = () => {
    verifiedBadgePaymentService.getSettings().then(s => {
      setPaymentSettings(s);
      setRechargeAmount(s.badgePrice || 150);
      if (!s.bkash.enabled && s.nagad.enabled) {
        setRechargeMethod('nagad');
      } else if (s.bkash.enabled && !s.nagad.enabled) {
        setRechargeMethod('bkash');
      }
    });
  };

  useEffect(() => {
    let isMounted = true;
    loadSettings();

    const handleSettingsUpdated = (e: any) => {
      if (e.detail) {
        setPaymentSettings(e.detail);
        setRechargeAmount(e.detail.badgePrice || 150);
      } else {
        loadSettings();
      }
    };

    window.addEventListener('verified_badge_settings_updated', handleSettingsUpdated);

    if (user?.uid) {
      setLoadingRequests(true);
      verifiedBadgePaymentService.getUserRequests(user.uid).then(reqs => {
        if (isMounted) {
          setUserRequests(reqs);
          setLoadingRequests(false);
        }
      });
    }

    return () => { 
      isMounted = false; 
      window.removeEventListener('verified_badge_settings_updated', handleSettingsUpdated);
    };
  }, [user?.uid]);

  // Always refresh settings when opening the recharge modal
  useEffect(() => {
    if (showRechargeModal) {
      loadSettings();
    }
  }, [showRechargeModal]);

  // Check required profile fields (Basic Account & Contact)
  const hasName = Boolean((userProfile?.name || user?.displayName || '').trim().length > 0);
  const hasPhone = Boolean((userProfile?.phone || (userProfile as any)?.mobile || user?.phoneNumber || '').trim().length > 3);

  const profileFields = [
    { key: 'Account Name', label: 'অ্যাকাউন্ট নাম', isFilled: hasName },
    { key: 'Phone Number', label: 'মোবাইল নম্বর', isFilled: hasPhone || true },
    { key: 'Verification Status', label: 'নাগরিক প্রোফাইল প্রস্তুত', isFilled: true }
  ];

  const missingFields = profileFields.filter(f => !f.isFilled);
  const completedFieldsCount = profileFields.length - missingFields.length;
  const profileCompletionPercent = Math.round((completedFieldsCount / profileFields.length) * 100);

  // Handle Document Capture / Upload
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>,
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading(`${label} ছবি প্রসেস করা হচ্ছে...`);
      const base64 = await compressImageToBase64(file);
      setter(base64);
      toast.dismiss();
      toast.success(`${label} সফলভাবে আপলোড হয়েছে!`);
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error(`${label} আপলোড করতে সমস্যা হয়েছে`);
    } finally {
      e.target.value = "";
    }
  };

  // Save Profile Form
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      if (updateUserProfile) {
        await updateUserProfile({
          phone: editPhone,
          bio: editBio,
          gender: editGender,
          birthday: editDob,
          dob: editDob,
          location: editLocation,
          occupation: editOccupation
        } as any);
      }
      setShowEditProfileModal(false);
      toast.success("প্রোফাইল তথ্য সফলভাবে সংরক্ষণ করা হয়েছে!");
    } catch (err) {
      console.error(err);
      toast.error("তথ্য সংরক্ষণে সমস্যা হয়েছে");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Quick Recharge using verifiedBadgePaymentService
  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) {
      toast.error("রিচার্জ করার জন্য অনুগ্রহ করে প্রথমে লগইন করুন");
      return;
    }

    const cleanSender = normalizeBdPhone(senderNumber);
    if (!/^01[3-9]\d{8}$/.test(cleanSender)) {
      toast.error("অনুগ্রহ করে আপনার সঠিক ১১ ডিজিটের মোবাইল নম্বর (যেমন: 01XXXXXXXXX) প্রদান করুন");
      return;
    }

    const cleanTrx = trxId.trim().toUpperCase();
    if (!cleanTrx || cleanTrx.length < 4) {
      toast.error("অনুগ্রহ করে সঠিক ও পূর্ণাঙ্গ TrxID প্রদান করুন");
      return;
    }

    const activeConfig = rechargeMethod === 'bkash' ? paymentSettings.bkash : paymentSettings.nagad;
    if (!activeConfig.enabled || !activeConfig.number) {
      toast.error(`বর্তমানে ${rechargeMethod === 'bkash' ? 'বিকাশ' : 'নগদ'} পেমেন্ট বন্ধ আছে। অন্য মেথড বেছে নিন।`);
      return;
    }

    setIsRecharging(true);
    try {
      const res = await verifiedBadgePaymentService.submitPaymentRequest({
        userId: user.uid,
        userName: userProfile?.name || user.displayName || "নাগরিক",
        userPhone: cleanSender,
        userEmail: user.email || "",
        method: rechargeMethod,
        senderNumber: cleanSender,
        trxId: cleanTrx,
        amountReported: Number(rechargeAmount) || requiredFee,
        amountExpected: requiredFee
      });

      setShowRechargeModal(false);
      setSenderNumber("");
      setTrxId("");
      setSubmissionSuccessRef(res.referenceId);
      toast.success(res.message);

      // Refresh requests list
      const updatedReqs = await verifiedBadgePaymentService.getUserRequests(user.uid);
      setUserRequests(updatedReqs);
    } catch (err: any) {
      console.error("Recharge submission error:", err);
      toast.error(err?.message || "রিচার্জ করতে সমস্যা হয়েছে");
    } finally {
      setIsRecharging(false);
    }
  };

  // Handle Final Verification Submission
  const handleFinalSubmit = async () => {
    if (!user?.uid) {
      toast.error("ভেরিফিকেশনের জন্য অনুগ্রহ করে লগইন করুন");
      return;
    }

    if (missingFields.length > 0) {
      setShowEditProfileModal(true);
      toast.error("প্রথমে প্রোফাইলের প্রয়োজনীয় ফিল্ডগুলো পূরণ করুন");
      return;
    }

    if (walletBalance < requiredFee) {
      setShowRechargeModal(true);
      toast.error("ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই, অনুগ্রহ করে রিচার্জ করুন");
      return;
    }

    if (!nidFront || !nidBack || !selfie) {
      toast.error("এনআইডি এর উভয় পাশ এবং আপনার একটি সেলফি আপলোড করুন");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Add verification request to Firestore
      await addDoc(collection(db, "verification_requests"), cleanUndefined({
        userId: user.uid,
        userName: userProfile?.name || user.displayName || "নাগরিক",
        userPhone: userProfile?.phone || editPhone,
        userEmail: user.email || "",
        docType: "NID",
        nidFront,
        nidBack,
        selfie,
        fee: requiredFee,
        status: "pending",
        createdAt: serverTimestamp()
      }));

      // 2. Add to admin approvals queue
      try {
        await addDoc(collection(db, "admin_approvals"), cleanUndefined({
          type: "verified_badge_request",
          userId: user.uid,
          userName: userProfile?.name || user.displayName || "নাগরিক",
          docType: "NID",
          fee: requiredFee,
          status: "pending",
          createdAt: serverTimestamp()
        }));
      } catch (apprErr) {
        console.warn("admin_approvals queue notice:", apprErr);
      }

      // 3. Record transaction for verification fee
      await addDoc(collection(db, "wallet_transactions"), cleanUndefined({
        userId: user.uid,
        userName: userProfile?.name || user.displayName || "নাগরিক",
        type: "payment",
        amount: requiredFee,
        status: "completed",
        description: "ব্লু ব্যাজ ভেরিফিকেশন ফি (১ মাস)",
        createdAt: serverTimestamp()
      }));

        // 4. Deduct fee from wallet & set pending status
        await updateDoc(doc(db, "users", user.uid), {
          walletBalance: increment(-requiredFee),
          verificationStatus: "pending"
        });

      toast.success("আপনার ভেরিফিকেশন আবেদন সফলভাবে জমা হয়েছে! অ্যাডমিন পর্যালোচনার পর ব্যাজ দেওয়া হবে।");
      navigate(user?.uid ? `/profile/${user.uid}` : "/adda");
    } catch (err) {
      console.error(err);
      toast.error("আবেদন পাঠাতে সমস্যা হয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(user?.uid ? `/profile/${user.uid}` : "/adda");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-16 select-none text-slate-900">
      <SEO 
        title="Get Verified - ভেরিফায়েড ব্যাজ" 
        description="আপনার অ্যাকাউন্টের জন্য অফিসিয়াল ব্লু/গ্রিন ভেরিফিকেশন ব্যাজের আবেদন করুন"
        path="/get-verified"
      />

      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={nidFrontInputRef} 
        accept="image/*" 
        capture="environment"
        className="hidden" 
        onChange={(e) => handleFileUpload(e, setNidFront, "এনআইডি ফ্রন্ট")} 
      />
      <input 
        type="file" 
        ref={nidBackInputRef} 
        accept="image/*" 
        capture="environment"
        className="hidden" 
        onChange={(e) => handleFileUpload(e, setNidBack, "এনআইডি ব্যাক")} 
      />
      <input 
        type="file" 
        ref={selfieInputRef} 
        accept="image/*" 
        capture="user"
        className="hidden" 
        onChange={(e) => handleFileUpload(e, setSelfie, "সেলফি")} 
      />

      {/* ========================================================================= */}
      {/* 1. TOP APP BAR (Back Arrow + Get Verified Title)                          */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-2xs">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 active:scale-95 transition cursor-pointer border-none bg-transparent"
            title="ফিরে যান"
            aria-label="Back"
          >
            <ArrowLeft size={22} className="stroke-[2.5]" />
          </button>
          <h1 className="text-xl font-black text-slate-950 tracking-tight">
            ভেরিফাইড ব্যাজ পান
          </h1>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">

        {/* ========================================================================= */}
        {/* 2. GREEN VERIFIED BADGE HERO BANNER                                       */}
        {/* ========================================================================= */}
        <div className="rounded-[28px] bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#0d9488] text-white p-6 shadow-md text-center flex flex-col items-center justify-center relative overflow-hidden">
          {/* Official Starburst Verified Icon */}
          <div className="w-16 h-16 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-md mb-2">
            <BadgeCheck size={40} className="stroke-[2.5]" />
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white">
            ভেরিফাইড ব্যাজ
          </h2>

          <p className="text-white/90 text-xs mt-1.5 max-w-xs leading-relaxed">
            আপনার অ্যাকাউন্ট প্রামাণিক ও আসল তা সবাইকে দেখান। আপনার প্রোফাইলে ভেরিফাইড নীল টিক চিহ্ন যুক্ত করুন।
          </p>

          {/* Fee Pill */}
          <div className="mt-3.5 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-black shadow-2xs">
            ফি: ৳১৫০ (মাসিক (৩০ দিন))
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. STEP 1: COMPLETE YOUR PROFILE                                          */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-100/90 space-y-3.5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-black text-xs flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-950">
                আপনার প্রোফাইল সম্পন্ন করুন
              </h3>
              <p className="text-[11px] text-slate-500">
                {missingFields.length === 0 ? "সকল তথ্য সম্পন্ন" : `${missingFields.length}টি তথ্য অসম্পূর্ণ`}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.max(5, profileCompletionPercent)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 font-bold">
              {profileCompletionPercent}% সম্পন্ন
            </p>
          </div>

          {/* Missing Fields Tags */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-800">
              {missingFields.length === 0 ? "প্রোফাইল স্ট্যাটাস:" : "অসম্পূর্ণ তথ্যসমূহ:"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profileFields.map((field) => (
                <span
                  key={field.key}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                    field.isFilled
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50/70 text-rose-600 border-rose-200"
                  }`}
                >
                  {field.isFilled ? `✓ ${field.label}` : `✕ ${field.label}`}
                </span>
              ))}
            </div>
          </div>

          {/* Complete Profile Button */}
          <button
            type="button"
            onClick={() => setShowEditProfileModal(true)}
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200"
          >
            <Edit3 size={15} />
            <span>প্রোফাইল তথ্য পরিবর্তন / হালনাগাদ করুন (ঐচ্ছিক)</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 4. STEP 2: WALLET BALANCE                                                 */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-100/90 space-y-3.5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-black text-xs flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-950">
                ওয়ালেট ব্যালেন্স
              </h3>
              <p className="text-[11px] text-slate-500">
                {balanceNeeded > 0 ? `আরও ৳${balanceNeeded.toFixed(2)} প্রয়োজন` : "পর্যাপ্ত ব্যালেন্স রয়েছে"}
              </p>
            </div>
          </div>

          {/* 2-Column Balance Check */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-xs text-slate-500 font-medium">আপনার ব্যালেন্স</p>
              <p className="text-lg font-black text-slate-950 mt-0.5">
                ৳ {walletBalance.toFixed(2)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium">প্রয়োজনীয় ফি</p>
              <p className="text-lg font-black text-slate-950 mt-0.5">
                ৳ {requiredFee.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Recharge Wallet Button */}
          <button
            type="button"
            onClick={() => setShowRechargeModal(true)}
            className="w-full py-3 bg-white border border-emerald-500 hover:bg-emerald-50 text-emerald-600 font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
          >
            <Plus size={16} strokeWidth={3} />
            <span>ওয়ালেট রিচার্জ করুন</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 5. STEP 3: IDENTITY VERIFICATION                                          */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-100/90 space-y-3.5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-black text-xs flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-950">
                পরিচয়পত্র যাচাইকরণ
              </h3>
              <p className="text-[11px] text-slate-500">
                এনআইডি কার্ডের দুই পাশ ও সেলফি আবশ্যক
              </p>
            </div>
          </div>

          {/* Instruction */}
          <p className="text-xs text-slate-600 leading-relaxed">
            আপনার জাতীয় পরিচয়পত্র (NID) এর সামনে ও পেছনের ছবি এবং একটি লাইভ সেলফি আপলোড করুন।
          </p>

          {/* 3 Upload Grid Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-1">
            {/* 5.1 NID Front */}
            <div
              onClick={() => nidFrontInputRef.current?.click()}
              className="bg-slate-50 hover:bg-slate-100/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center border border-dashed border-slate-300 transition cursor-pointer min-h-[100px] relative overflow-hidden"
            >
              {nidFront ? (
                <>
                  <img src={nidFront} alt="NID Front" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <Check size={12} strokeWidth={3} />
                  </div>
                </>
              ) : (
                <>
                  <CreditCard size={22} className="text-slate-400 mb-1.5" />
                  <p className="text-[11px] font-black text-slate-800">এনআইডি সামনের দিক</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">ক্যাপচার করতে ট্যাপ করুন</p>
                </>
              )}
            </div>

            {/* 5.2 NID Back */}
            <div
              onClick={() => nidBackInputRef.current?.click()}
              className="bg-slate-50 hover:bg-slate-100/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center border border-dashed border-slate-300 transition cursor-pointer min-h-[100px] relative overflow-hidden"
            >
              {nidBack ? (
                <>
                  <img src={nidBack} alt="NID Back" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <Check size={12} strokeWidth={3} />
                  </div>
                </>
              ) : (
                <>
                  <CreditCard size={22} className="text-slate-400 mb-1.5" />
                  <p className="text-[11px] font-black text-slate-800">এনআইডি পেছনের দিক</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">ক্যাপচার করতে ট্যাপ করুন</p>
                </>
              )}
            </div>

            {/* 5.3 Selfie */}
            <div
              onClick={() => selfieInputRef.current?.click()}
              className="bg-slate-50 hover:bg-slate-100/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center border border-dashed border-slate-300 transition cursor-pointer min-h-[100px] relative overflow-hidden"
            >
              {selfie ? (
                <>
                  <img src={selfie} alt="Selfie" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <Check size={12} strokeWidth={3} />
                  </div>
                </>
              ) : (
                <>
                  <Smile size={22} className="text-slate-400 mb-1.5" />
                  <p className="text-[11px] font-black text-slate-800">লাইভ সেলফি</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">ক্যাপচার করতে ট্যাপ করুন</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6. STEP 4: ADMIN REVIEW                                                   */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-100/90 space-y-2">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
              4
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-950">
                এডমিন ভেরিফিকেশন
              </h3>
              <p className="text-[11px] text-slate-500">
                ৩–৫ কার্যদিবসের মধ্যে সম্পন্ন হবে
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6b. SUBMISSION SUCCESS NOTIFICATION BANNER                                */}
        {/* ========================================================================= */}
        {submissionSuccessRef && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2.5 text-emerald-900">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              <h4 className="font-black text-sm">পেমেন্ট আবেদন সফলভাবে জমা হয়েছে!</h4>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed font-bold">
              আপনার ট্রানজেকশন রেফারেন্স আইডি: <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-emerald-300 text-emerald-950 font-black select-all">{submissionSuccessRef}</span>।
            </p>
            <p className="text-[11px] text-emerald-700 font-medium">
              এডমিন আপনার TrxID ম্যানুয়ালি যাচাই করার পর আপনার ওয়ালেটে ব্যালেন্স যুক্ত হবে এবং ব্লু ব্যাজ সক্রিয় করা হবে।
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6c. USER PAYMENT REQUEST HISTORY                                          */}
        {/* ========================================================================= */}
        {userRequests.length > 0 && (
          <div className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-100/90 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-emerald-600" />
                <span>আপনার পূর্ববর্তী পেমেন্ট আবেদনসমূহ ({userRequests.length})</span>
              </h3>
            </div>

            <div className="space-y-2">
              {userRequests.map((req) => (
                <div 
                  key={req.id} 
                  className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition ${
                    req.status === 'pending'
                      ? 'bg-amber-50/40 border-amber-200/70'
                      : req.status === 'approved'
                      ? 'bg-emerald-50/40 border-emerald-200/70'
                      : 'bg-rose-50/40 border-rose-200/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900">{req.referenceId || 'VR-REQ'}</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-black text-[10px] uppercase text-slate-700">
                        {req.method}
                      </span>
                    </div>

                    {req.status === 'pending' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black inline-flex items-center gap-1">
                        <Clock size={10} /> যাচাই চলছে
                      </span>
                    )}
                    {req.status === 'approved' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black inline-flex items-center gap-1">
                        <CheckCircle2 size={10} /> অনুমোদিত ✓
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black inline-flex items-center gap-1">
                        <X size={10} /> প্রত্যাখ্যাত
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-slate-500 text-[11px] pt-1 border-t border-slate-100">
                    <div>
                      <span>TrxID: <strong className="font-mono text-slate-800 font-black">{req.trxId}</strong></span>
                      <span className="mx-1.5">•</span>
                      <span>প্রেরক: <strong className="font-mono text-slate-700">{req.senderNumber}</strong></span>
                    </div>
                    <span className="font-black text-emerald-700">৳{req.amountReported}</span>
                  </div>

                  {req.rejectionReason && (
                    <p className="text-[11px] text-rose-700 font-bold bg-white p-2 rounded-xl border border-rose-200">
                      বাতিলের কারণ: {req.rejectionReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. FINAL SUBMISSION CTA BUTTON & DISCLAIMER                               */}
        {/* ========================================================================= */}
        <div className="pt-2 space-y-2">
          {missingFields.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowEditProfileModal(true)}
              className="w-full py-4 bg-slate-300 hover:bg-slate-400 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <Edit3 size={18} />
              <span>প্রথমে প্রোফাইল সম্পন্ন করুন</span>
            </button>
          ) : walletBalance < requiredFee ? (
            <button
              type="button"
              onClick={() => setShowRechargeModal(true)}
              className="w-full py-4 bg-[#00C853] hover:bg-emerald-600 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <Plus size={18} strokeWidth={3} />
              <span>ওয়ালেট রিচার্জ করুন (আরও ৳{balanceNeeded.toFixed(2)} প্রয়োজন)</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="w-full py-4 bg-gradient-to-r from-[#00C853] to-[#00A844] hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50"
            >
              <BadgeCheck size={18} />
              <span>{isSubmitting ? "আবেদন জমা হচ্ছে..." : "যাচাইকরণের আবেদন জমা দিন (৳১৫০)"}</span>
            </button>
          )}

          <p className="text-center text-[11px] text-slate-400">
            আবেদন বাতিল বা প্রত্যাখ্যাত হলে ফি অফেরতযোগ্য।
          </p>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 8. COMPLETE PROFILE MODAL                                                 */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showEditProfileModal && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 size={18} className="text-emerald-600" />
                  <h3 className="font-black text-slate-950 text-base">আপনার প্রোফাইল সম্পন্ন করুন</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center border-0 bg-transparent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Bio *</label>
                  <textarea
                    rows={2}
                    required
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="আপনার সম্পর্কে সংক্ষিপ্ত বিবরণ..."
                    className="w-full mt-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Gender *</label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-emerald-500"
                    >
                      <option value="male">Male (পুরুষ)</option>
                      <option value="female">Female (মহিলা)</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Date of Birth *</label>
                    <input
                      type="date"
                      value={editDob}
                      onChange={(e) => setEditDob(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Location *</label>
                  <input
                    type="text"
                    required
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="যেমন: পুঠিয়া বাজার, পুঠিয়া, রাজশাহী"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Occupation *</label>
                  <input
                    type="text"
                    required
                    value={editOccupation}
                    onChange={(e) => setEditOccupation(e.target.value)}
                    placeholder="যেমন: ব্যবসায়ী, ফ্রিল্যান্সার, ছাত্র"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full py-3 bg-[#00C853] hover:bg-emerald-600 text-white font-black text-xs sm:text-sm rounded-2xl transition shadow-xs border-0 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingProfile ? "সংরক্ষণ হচ্ছে..." : "তথ্য সংরক্ষণ করুন"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 9. RECHARGE MODAL                                                         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showRechargeModal && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BadgeCheck size={20} className="text-[#00C853]" />
                  <h3 className="font-black text-slate-950 text-base">
                    ভেরিফাইড ব্যাজ পেমেন্ট (৳{requiredFee})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRechargeModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center border-0 bg-transparent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRechargeSubmit} className="space-y-3.5">
                <div className="p-3 rounded-2xl bg-emerald-50 text-xs text-emerald-900 flex items-center justify-between">
                  <span>ভেরিফিকেশনের জন্য নির্ধারিত ফি:</span>
                  <span className="font-black text-sm">৳{requiredFee}</span>
                </div>

                {/* Payment Method Selector */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!paymentSettings.bkash.enabled}
                    onClick={() => setRechargeMethod('bkash')}
                    className={`p-2.5 rounded-2xl flex flex-col items-center justify-center border cursor-pointer transition ${
                      !paymentSettings.bkash.enabled 
                        ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                        : rechargeMethod === 'bkash'
                        ? 'border-[#E2136E] bg-pink-50/60 text-[#E2136E] font-black shadow-xs ring-2 ring-[#E2136E]/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-pink-300'
                    }`}
                  >
                    <span className="text-xs font-black">বিকাশ (bKash)</span>
                    <span className="text-[10px] opacity-75">ব্যক্তিগত (Personal)</span>
                  </button>

                  <button
                    type="button"
                    disabled={!paymentSettings.nagad.enabled}
                    onClick={() => setRechargeMethod('nagad')}
                    className={`p-2.5 rounded-2xl flex flex-col items-center justify-center border cursor-pointer transition ${
                      !paymentSettings.nagad.enabled 
                        ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                        : rechargeMethod === 'nagad'
                        ? 'border-[#F7941D] bg-amber-50/60 text-[#F7941D] font-black shadow-xs ring-2 ring-[#F7941D]/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300'
                    }`}
                  >
                    <span className="text-xs font-black">নগদ (Nagad)</span>
                    <span className="text-[10px] opacity-75">ব্যক্তিগত (Personal)</span>
                  </button>
                </div>

                {/* Dynamic Payment Details & Instructions */}
                {(() => {
                  const activeConfig = rechargeMethod === 'bkash' ? paymentSettings.bkash : paymentSettings.nagad;
                  const isBkash = rechargeMethod === 'bkash';

                  if (!activeConfig.enabled || !activeConfig.number) {
                    return (
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 space-y-1">
                        <p className="font-bold">⚠️ এই পেমেন্ট মাধ্যমটি বর্তমানে কনফিগার করা হয়নি।</p>
                        <p className="text-[11px] text-amber-700">সুপার এডমিন শীঘ্রই নম্বর আপডেট করবেন। অনুগ্রহ করে অন্য মাধ্যমে চেষ্টা করুন।</p>
                      </div>
                    );
                  }

                  return (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-bold">সেন্ড মানি নম্বর (Personal):</span>
                        {activeConfig.accountHolderName && (
                          <span className="text-[11px] font-bold text-slate-600">
                            {activeConfig.accountHolderName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200">
                        <span className="font-mono font-black text-slate-900 text-sm tracking-wider">
                          {activeConfig.number}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(activeConfig.number);
                            setCopiedNumber(true);
                            toast.success('নম্বর কপি করা হয়েছে!');
                            setTimeout(() => setCopiedNumber(false), 2000);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer border ${
                            copiedNumber
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isBkash 
                              ? 'bg-pink-50 text-[#E2136E] border-pink-200 hover:bg-pink-100'
                              : 'bg-amber-50 text-[#F7941D] border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          <Copy size={12} />
                          <span>{copiedNumber ? 'কপি হয়েছে ✓' : 'কপি করুন'}</span>
                        </button>
                      </div>

                      {activeConfig.instructions && (
                        <div className="text-[11px] text-slate-600 bg-white/70 p-2.5 rounded-xl border border-slate-100 space-y-1 whitespace-pre-line leading-relaxed">
                          <p className="font-bold text-slate-800">পেমেন্ট নির্দেশিকা:</p>
                          <p className="text-slate-600">{activeConfig.instructions}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div>
                  <label className="text-xs font-bold text-slate-700">
                    যে নম্বর থেকে টাকা পাঠিয়েছেন (Sender Mobile) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    maxLength={11}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">১১ ডিজিটের সঠিক বাংলাদেশি মোবাইল নম্বর দিন</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">
                    ট্রানজেকশন আইডি (TrxID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                    placeholder="যেমন: 9JH76T8K"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm uppercase font-mono font-bold outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">এসএমএসে পাওয়া সঠিক TrxID টি লিখুন</p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isRecharging}
                    className="w-full py-3.5 bg-[#00C853] hover:bg-emerald-600 text-white font-black text-xs sm:text-sm rounded-2xl transition shadow-xs border-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isRecharging ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>যাচাই হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>পেমেন্ট নিশ্চিত করুন (৳{requiredFee})</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default GetVerifiedPage;
