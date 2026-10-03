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
  Briefcase
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
import SEO from "../../components/SEO";

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

  // Recharge State
  const [rechargeAmount, setRechargeAmount] = useState(150);
  const [rechargeMethod, setRechargeMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [senderNumber, setSenderNumber] = useState("");
  const [trxId, setTrxId] = useState("");
  const [isRecharging, setIsRecharging] = useState(false);

  // Calculate live user wallet balance
  const walletBalance = Number((userProfile as any)?.walletBalance || 0);
  const requiredFee = 150;
  const balanceNeeded = Math.max(0, requiredFee - walletBalance);

  // Check required profile fields
  const hasPhone = Boolean(userProfile?.phone && userProfile.phone.trim().length > 5);
  const hasBio = Boolean(userProfile?.bio && userProfile.bio.trim().length > 0);
  const hasGender = Boolean((userProfile as any)?.gender);
  const hasDob = Boolean((userProfile as any)?.birthday || (userProfile as any)?.dob);
  const hasLocation = Boolean(userProfile?.village || (userProfile as any)?.location);
  const hasOccupation = Boolean(userProfile?.occupation || (userProfile as any)?.professionalCategory);

  const profileFields = [
    { key: 'Phone Number', label: 'Phone Number', isFilled: hasPhone },
    { key: 'Bio', label: 'Bio', isFilled: hasBio },
    { key: 'Gender', label: 'Gender', isFilled: hasGender },
    { key: 'Date of Birth', label: 'Date of Birth', isFilled: hasDob },
    { key: 'Location', label: 'Location', isFilled: hasLocation },
    { key: 'Occupation', label: 'Occupation', isFilled: hasOccupation }
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

  // Handle Quick Recharge
  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderNumber.trim() || !trxId.trim()) {
      toast.error("অনুগ্রহ করে প্রেরকের নম্বর ও TrxID প্রদান করুন");
      return;
    }

    setIsRecharging(true);
    try {
      if (user?.uid) {
        await addDoc(collection(db, "wallet_transactions"), {
          userId: user.uid,
          userName: userProfile?.name || user.displayName || "নাগরিক",
          type: "recharge",
          amount: rechargeAmount,
          method: rechargeMethod,
          accountNumber: senderNumber,
          trxId: trxId.toUpperCase(),
          status: "pending",
          description: `ভেরিফিকেশন ফি বাবদ ${rechargeMethod.toUpperCase()} রিচার্জ`,
          createdAt: serverTimestamp()
        });

        await addDoc(collection(db, "admin_approvals"), {
          type: "wallet_recharge",
          userId: user.uid,
          userName: userProfile?.name || user.displayName || "নাগরিক",
          amount: rechargeAmount,
          method: rechargeMethod,
          accountNumber: senderNumber,
          trxId: trxId.toUpperCase(),
          status: "pending",
          createdAt: serverTimestamp()
        });
      }

      setShowRechargeModal(false);
      setSenderNumber("");
      setTrxId("");
      toast.success("রিচার্জের রিকোয়েস্ট জমা হয়েছে! অনুমোদিত হলে ব্যালেন্স যুক্ত হবে।");
    } catch (err) {
      console.error(err);
      toast.error("রিচার্জ করতে সমস্যা হয়েছে");
    } finally {
      setIsRecharging(false);
    }
  };

  // Handle Final Verification Submission
  const handleFinalSubmit = async () => {
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
      if (user?.uid) {
        // 1. Add verification request to Firestore
        await addDoc(collection(db, "verification_requests"), {
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
        });

        // 2. Add to admin approvals queue
        await addDoc(collection(db, "admin_approvals"), {
          type: "verified_badge_request",
          userId: user.uid,
          userName: userProfile?.name || user.displayName || "নাগরিক",
          docType: "NID",
          fee: requiredFee,
          status: "pending",
          createdAt: serverTimestamp()
        });

        // 3. Record transaction for verification fee
        await addDoc(collection(db, "wallet_transactions"), {
          userId: user.uid,
          userName: userProfile?.name || user.displayName || "নাগরিক",
          type: "payment",
          amount: requiredFee,
          status: "completed",
          description: "ব্লু ব্যাজ ভেরিফিকেশন ফি (১ মাস)",
          createdAt: serverTimestamp()
        });

        // 4. Deduct fee from wallet & set pending status
        await updateDoc(doc(db, "users", user.uid), {
          walletBalance: increment(-requiredFee),
          verificationStatus: "pending"
        });
      }

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
            Get Verified
          </h1>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">

        {/* ========================================================================= */}
        {/* 2. GREEN VERIFIED BADGE HERO BANNER (Matching Screenshot 2)               */}
        {/* ========================================================================= */}
        <div className="rounded-[28px] bg-gradient-to-b from-[#00C853] to-[#00A844] text-white p-6 shadow-md text-center flex flex-col items-center justify-center relative overflow-hidden">
          {/* Official Starburst Verified Icon */}
          <div className="w-16 h-16 rounded-full bg-white text-[#00C853] flex items-center justify-center shadow-md mb-2">
            <BadgeCheck size={40} className="stroke-[2.5]" />
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white">
            Verified Badge
          </h2>

          <p className="text-white/90 text-xs mt-1.5 max-w-xs leading-relaxed">
            Show the world your account is authentic. Get a verified checkmark on your profile.
          </p>

          {/* Fee Pill */}
          <div className="mt-3.5 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-black shadow-2xs">
            Fee: ৳150 (monthly (30 days))
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. STEP 1: COMPLETE YOUR PROFILE                                          */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-100/90 space-y-3.5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-950">
                Complete Your Profile
              </h3>
              <p className="text-[11px] text-slate-500">
                {missingFields.length === 0 ? "All fields complete" : `${missingFields.length} fields missing`}
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
              {profileCompletionPercent}% complete
            </p>
          </div>

          {/* Missing Fields Tags */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-800">
              {missingFields.length === 0 ? "Status:" : "Missing:"}
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
            className="w-full py-3 bg-white border border-emerald-500 hover:bg-emerald-50 text-emerald-600 font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
          >
            <Edit3 size={16} />
            <span>Complete Profile</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 4. STEP 2: WALLET BALANCE                                                 */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-100/90 space-y-3.5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-950">
                Wallet Balance
              </h3>
              <p className="text-[11px] text-slate-500">
                {balanceNeeded > 0 ? `৳${balanceNeeded.toFixed(2)} more needed` : "Sufficient balance"}
              </p>
            </div>
          </div>

          {/* 2-Column Balance Check */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-xs text-slate-500 font-medium">Your Balance</p>
              <p className="text-lg font-black text-slate-950 mt-0.5">
                ৳ {walletBalance.toFixed(2)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium">Required</p>
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
            <span>Recharge Wallet</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 5. STEP 3: IDENTITY VERIFICATION                                          */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-100/90 space-y-3.5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-950">
                Identity Verification
              </h3>
              <p className="text-[11px] text-slate-500">
                NID front, back & selfie required
              </p>
            </div>
          </div>

          {/* Instruction */}
          <p className="text-xs text-slate-600 leading-relaxed">
            আপনার জাতীয় পরিচয়পত্র (NID) এর সামনে ও পেছনের ছবি এবং একটি সেলফি আপলোড করুন।
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
                  <p className="text-[11px] font-black text-slate-800">NID Front</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Tap to capture</p>
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
                  <p className="text-[11px] font-black text-slate-800">NID Back</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Tap to capture</p>
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
                  <p className="text-[11px] font-black text-slate-800">Selfie</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Tap to capture</p>
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
                Admin Review
              </h3>
              <p className="text-[11px] text-slate-500">
                Reviewed within 3–5 business days
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed pt-1">
            After payment, our team will review your profile, identity documents and selfie. You will be notified once the review is complete.
          </p>
        </div>

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
              <span>Complete Profile First</span>
            </button>
          ) : walletBalance < requiredFee ? (
            <button
              type="button"
              onClick={() => setShowRechargeModal(true)}
              className="w-full py-4 bg-[#00C853] hover:bg-emerald-600 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <Plus size={18} strokeWidth={3} />
              <span>Recharge Wallet (৳{balanceNeeded.toFixed(2)} Needed)</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="w-full py-4 bg-gradient-to-r from-[#00C853] to-[#00A844] hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50"
            >
              <BadgeCheck size={18} />
              <span>{isSubmitting ? "আবেদন জমা হচ্ছে..." : "Submit Verification Request (৳150)"}</span>
            </button>
          )}

          <p className="text-center text-[11px] text-slate-400">
            The fee is non-refundable if rejected.
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
                  <h3 className="font-black text-slate-950 text-base">Complete Your Profile</h3>
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
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-950 text-base">Recharge Wallet (৳150)</h3>
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
                  <span>ভেরিফিকেশনের জন্য প্রয়োজনীয় পরিমাণ:</span>
                  <span className="font-black text-sm">৳১৫০</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRechargeMethod('bkash')}
                    className={`p-2.5 rounded-2xl flex items-center justify-center border cursor-pointer transition ${
                      rechargeMethod === 'bkash'
                        ? 'border-[#E2136E] bg-pink-50/50 text-[#E2136E] font-black shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-black">বিকাশ (bKash)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRechargeMethod('nagad')}
                    className={`p-2.5 rounded-2xl flex items-center justify-center border cursor-pointer transition ${
                      rechargeMethod === 'nagad'
                        ? 'border-[#F7941D] bg-amber-50/50 text-[#F7941D] font-black shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-black">নগদ (Nagad)</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                  <p className="text-slate-500">সেন্ড মানি নম্বর (Send Money):</p>
                  <p className="font-black text-[#00C853] text-sm">01700000000</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">যে নম্বর থেকে টাকা পাঠিয়েছেন</label>
                  <input
                    type="tel"
                    required
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">ট্রানজেকশন আইডি (TrxID)</label>
                  <input
                    type="text"
                    required
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="যেমন: 9JH76T8K"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm uppercase font-mono font-bold outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isRecharging}
                    className="w-full py-3 bg-[#00C853] hover:bg-emerald-600 text-white font-black text-xs sm:text-sm rounded-2xl transition shadow-xs border-0 cursor-pointer disabled:opacity-50"
                  >
                    {isRecharging ? "যাচাই হচ্ছে..." : "রিচার্জ নিশ্চিত করুন"}
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
