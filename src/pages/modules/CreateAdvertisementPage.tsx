import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  Wallet, 
  Plus, 
  Type, 
  FileText, 
  Link as LinkIcon, 
  MessageSquare, 
  Phone, 
  MessageCircle, 
  Image as ImageIcon, 
  MapPin, 
  Landmark, 
  Banknote, 
  Receipt, 
  Calendar, 
  Users, 
  Flag, 
  Megaphone, 
  X, 
  Check, 
  AlertCircle,
  Copy
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

export const CreateAdvertisementPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  // Hidden File Input
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [adTitle, setAdTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clickUrl, setClickUrl] = useState("");
  const [actionButtonType, setActionButtonType] = useState<"website" | "whatsapp" | "phone" | "chat">("website");
  const [buttonText, setButtonText] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [placement, setPlacement] = useState("Home Feed");
  const [budgetType, setBudgetType] = useState("Total Budget");
  const [totalBudget, setTotalBudget] = useState<number>(100);
  const [billingType, setBillingType] = useState("CPM (Per 1000 Impressions)");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetGender, setTargetGender] = useState("All");
  const [minAge, setMinAge] = useState("18");
  const [maxAge, setMaxAge] = useState("65");
  const [isWholeBangladesh, setIsWholeBangladesh] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("পুঠিয়া ও পার্শ্ববর্তী অঞ্চল");

  // Recharge Modal State
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(100);
  const [rechargeMethod, setRechargeMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [senderNumber, setSenderNumber] = useState("");
  const [trxId, setTrxId] = useState("");
  const [isRecharging, setIsRecharging] = useState(false);

  // Submitting State
  const [isCreatingAd, setIsCreatingAd] = useState(false);

  // Live Wallet Balance
  const walletBalance: number = Number((userProfile as any)?.walletBalance || 0);

  // Handle Media File Upload
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("video/")) {
      setMediaType("video");
      const reader = new FileReader();
      reader.onload = (event) => {
        setMediaUrl(event.target?.result as string);
        toast.success("ভিডিও সফলভাবে নির্বাচন করা হয়েছে!");
      };
      reader.readAsDataURL(file);
    } else {
      setMediaType("image");
      try {
        toast.loading("ছবি প্রসেস করা হচ্ছে...");
        const base64 = await compressImageToBase64(file);
        setMediaUrl(base64);
        toast.dismiss();
        toast.success("বিজ্ঞাপনের ছবি যুক্ত হয়েছে!");
      } catch (err) {
        toast.dismiss();
        console.error(err);
        toast.error("ছবি আপলোড করতে সমস্যা হয়েছে");
      }
    }
    e.target.value = "";
  };

  // Quick Recharge
  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderNumber.trim() || !trxId.trim()) {
      toast.error("প্রেরকের নম্বর ও TrxID প্রদান করুন");
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
          description: `বিজ্ঞাপন বাজেটের জন্য ${rechargeMethod.toUpperCase()} রিচার্জ`,
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
      toast.success("রিচার্জ রিকোয়েস্ট জমা হয়েছে! অ্যাডমিন অনুমোদনের পর ব্যালেন্স যোগ হবে।");
    } catch (err) {
      console.error(err);
      toast.error("রিচার্জ পাঠাতে সমস্যা হয়েছে");
    } finally {
      setIsRecharging(false);
    }
  };

  // Submit Ad Creation
  const handleCreateAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adTitle.trim()) {
      toast.error("বিজ্ঞাপনের শিরোনাম (Ad Title) আবশ্যক");
      return;
    }

    if (!clickUrl.trim()) {
      toast.error("ক্লিক লিঙ্ক বা নম্বর (Click URL) আবশ্যক");
      return;
    }

    if (!mediaUrl) {
      toast.error("বিজ্ঞাপনের ছবি বা ভিডিও আপলোড করুন");
      return;
    }

    if (totalBudget < 50) {
      toast.error("ন্যূনতম বিজ্ঞাপন বাজেট ৫০ টাকা");
      return;
    }

    if (walletBalance < totalBudget) {
      setShowRechargeModal(true);
      toast.error(`আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। বাজেট: ৳${totalBudget}, বর্তমান ব্যালেন্স: ৳${walletBalance.toFixed(2)}`);
      return;
    }

    setIsCreatingAd(true);
    try {
      if (user?.uid) {
        // 1. Create Advertisement document
        await addDoc(collection(db, "advertisements"), {
          userId: user.uid,
          userName: userProfile?.name || user.displayName || "নাগরিক",
          title: adTitle,
          description,
          clickUrl,
          actionButtonType,
          buttonText: buttonText || (actionButtonType === 'website' ? 'Learn More' : actionButtonType === 'whatsapp' ? 'WhatsApp' : 'Call Now'),
          mediaUrl,
          mediaType,
          placement,
          budgetType,
          totalBudget,
          spentBudget: 0,
          billingType,
          startDate: startDate || new Date().toISOString().split('T')[0],
          endDate: endDate || "",
          targetGender,
          minAge: Number(minAge) || 18,
          maxAge: Number(maxAge) || 65,
          isWholeBangladesh,
          targetRegion: isWholeBangladesh ? "Whole Bangladesh" : selectedRegion,
          impressions: 0,
          clicks: 0,
          status: "pending",
          createdAt: serverTimestamp()
        });

        // 2. Admin Approval Task
        await addDoc(collection(db, "admin_approvals"), {
          type: "advertisement_approval",
          userId: user.uid,
          userName: userProfile?.name || user.displayName || "নাগরিক",
          title: adTitle,
          budget: totalBudget,
          status: "pending",
          createdAt: serverTimestamp()
        });

        // 3. Record Wallet Transaction
        await addDoc(collection(db, "wallet_transactions"), {
          userId: user.uid,
          userName: userProfile?.name || user.displayName || "নাগরিক",
          type: "payment",
          amount: totalBudget,
          status: "completed",
          description: `বিজ্ঞাপন ক্যাম্পেইন: ${adTitle}`,
          createdAt: serverTimestamp()
        });

        // 4. Deduct Budget from user wallet
        await updateDoc(doc(db, "users", user.uid), {
          walletBalance: increment(-totalBudget)
        });
      }

      toast.success("বিজ্ঞাপন সফলভাবে তৈরি হয়েছে! অ্যাডমিন যাচাই করার সাথে সাথে প্রচার শুরু হবে।");
      navigate("/my-business");
    } catch (err) {
      console.error("Ad creation error:", err);
      toast.error("বিজ্ঞাপন তৈরি করতে সমস্যা হয়েছে");
    } finally {
      setIsCreatingAd(false);
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
        title="Create Advertisement - বিজ্ঞাপন তৈরি করুন" 
        description="আপনার পণ্য বা সেবার প্রচারের জন্য ডিজিটাল বিজ্ঞাপন তৈরি ও পরিচালনা করুন"
        path="/ads/create"
      />

      {/* Hidden File Input for Media */}
      <input 
        type="file" 
        ref={mediaInputRef} 
        accept="image/*,video/*" 
        className="hidden" 
        onChange={handleMediaUpload} 
      />

      {/* ========================================================================= */}
      {/* 1. TOP APP BAR (Back Arrow + Create Advertisement Title)                  */}
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
            Create Advertisement
          </h1>
        </div>
      </header>

      {/* Main Form Canvas */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <form onSubmit={handleCreateAdSubmit} className="space-y-4">

          {/* ========================================================================= */}
          {/* 2. WALLET BALANCE TOP BANNER (Matching Screenshot 2)                      */}
          {/* ========================================================================= */}
          <div className="rounded-3xl bg-[#FFF6E9] border border-[#FFE4BA] p-4 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FFE4BA] text-[#A26207] flex items-center justify-center shrink-0 shadow-2xs">
                <Wallet size={20} className="stroke-[2.2]" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-[#8A5002]">Wallet Balance</p>
                <p className="text-[17px] font-black text-[#5C3200] mt-0.5">
                  ৳ {walletBalance.toFixed(2)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRechargeModal(true)}
              className="w-8 h-8 rounded-full bg-[#FFE4BA] text-[#8A5002] hover:bg-[#FCD79B] flex items-center justify-center transition cursor-pointer border-none"
              title="রিচার্জ করুন"
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>

          {/* ========================================================================= */}
          {/* 3. AD CONTENT SECTION                                                     */}
          {/* ========================================================================= */}
          <div className="space-y-2.5">
            <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide px-1">
              Ad Content
            </h2>

            {/* 3.1 Ad Title */}
            <div className="relative">
              <div className="absolute left-4 top-3.5 text-slate-400">
                <Type size={18} />
              </div>
              <input
                type="text"
                required
                value={adTitle}
                onChange={(e) => setAdTitle(e.target.value)}
                placeholder="Ad Title *"
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-3xl text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0091FF] shadow-2xs"
              />
            </div>

            {/* 3.2 Description */}
            <div className="relative">
              <div className="absolute left-4 top-3.5 text-slate-400">
                <FileText size={18} />
              </div>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-3xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0091FF] shadow-2xs"
              />
            </div>

            {/* 3.3 Click URL */}
            <div className="relative">
              <div className="absolute left-4 top-3.5 text-slate-400">
                <LinkIcon size={18} />
              </div>
              <input
                type="text"
                required
                value={clickUrl}
                onChange={(e) => setClickUrl(e.target.value)}
                placeholder="Click URL *"
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-3xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0091FF] shadow-2xs"
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. ACTION BUTTON TYPE CARD & BUTTON TEXT                                  */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-100 space-y-3.5">
            <h3 className="text-sm font-black text-slate-950">
              Action Button Type
            </h3>

            <div className="space-y-2.5">
              {/* 4.1 Website Link */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="actionButton"
                  checked={actionButtonType === "website"}
                  onChange={() => setActionButtonType("website")}
                  className="w-4.5 h-4.5 accent-[#0091FF]"
                />
                <div className="flex items-center gap-2 text-slate-800 text-xs sm:text-sm font-bold">
                  <LinkIcon size={16} className="text-[#0091FF]" />
                  <span>Website Link</span>
                </div>
              </label>

              {/* 4.2 WhatsApp */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="actionButton"
                  checked={actionButtonType === "whatsapp"}
                  onChange={() => setActionButtonType("whatsapp")}
                  className="w-4.5 h-4.5 accent-[#0091FF]"
                />
                <div className="flex items-center gap-2 text-slate-800 text-xs sm:text-sm font-bold">
                  <MessageCircle size={16} className="text-[#25D366]" />
                  <span>WhatsApp</span>
                </div>
              </label>

              {/* 4.3 Phone Call */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="actionButton"
                  checked={actionButtonType === "phone"}
                  onChange={() => setActionButtonType("phone")}
                  className="w-4.5 h-4.5 accent-[#0091FF]"
                />
                <div className="flex items-center gap-2 text-slate-800 text-xs sm:text-sm font-bold">
                  <Phone size={16} className="text-[#00C853]" />
                  <span>Phone Call</span>
                </div>
              </label>

              {/* 4.4 In-App Chat */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="actionButton"
                  checked={actionButtonType === "chat"}
                  onChange={() => setActionButtonType("chat")}
                  className="w-4.5 h-4.5 accent-[#0091FF]"
                />
                <div className="flex items-center gap-2 text-slate-800 text-xs sm:text-sm font-bold">
                  <MessageSquare size={16} className="text-[#FF9800]" />
                  <span>In-App Chat</span>
                </div>
              </label>
            </div>

            {/* Optional Button Text Input */}
            <div className="pt-2">
              <div className="relative">
                <div className="absolute left-3.5 top-3 text-slate-400">
                  <Type size={16} />
                </div>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="Button Text (optional)"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium outline-none focus:border-[#0091FF]"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. MEDIA UPLOAD BOX                                                       */}
          {/* ========================================================================= */}
          <div
            onClick={() => mediaInputRef.current?.click()}
            className="bg-white rounded-3xl p-8 border border-slate-100 shadow-2xs flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px] relative overflow-hidden group hover:bg-slate-50/50 transition"
          >
            {mediaUrl ? (
              <>
                {mediaType === "video" ? (
                  <video src={mediaUrl} className="max-h-48 rounded-2xl object-cover" controls />
                ) : (
                  <img src={mediaUrl} alt="Ad Media" className="max-h-48 rounded-2xl object-cover shadow-2xs" />
                )}
                <div className="mt-2 text-[11px] font-bold text-[#0091FF]">
                  ক্লিক করে মিডিয়া পরিবর্তন করুন
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <ImageIcon size={24} />
                </div>
                <p className="text-[12px] font-bold text-slate-500">
                  Tap to add image or video *
                </p>
              </>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 6. PLACEMENT SECTION                                                      */}
          {/* ========================================================================= */}
          <div className="space-y-1.5">
            <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide px-1">
              Placement
            </h2>

            <div className="bg-white rounded-3xl p-4 shadow-2xs border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0091FF] flex items-center justify-center">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Ad Placement</p>
                  <select
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value)}
                    className="text-[14px] font-black text-slate-950 bg-transparent outline-none cursor-pointer mt-0.5 border-none"
                  >
                    <option value="Home Feed">Home Feed</option>
                    <option value="Reels Feed">Reels Feed</option>
                    <option value="Search & Categories">Search & Categories</option>
                    <option value="Story Banner">Story Banner</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 7. BUDGET & BILLING SECTION                                               */}
          {/* ========================================================================= */}
          <div className="space-y-2">
            <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide px-1">
              Budget & Billing
            </h2>

            <div className="space-y-2">
              {/* Budget Type */}
              <div className="bg-white rounded-3xl p-3.5 shadow-2xs border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0091FF] flex items-center justify-center">
                    <Landmark size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Budget Type</p>
                    <select
                      value={budgetType}
                      onChange={(e) => setBudgetType(e.target.value)}
                      className="text-[14px] font-black text-slate-950 bg-transparent outline-none cursor-pointer mt-0.5 border-none"
                    >
                      <option value="Total Budget">Total Budget</option>
                      <option value="Daily Budget">Daily Budget</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Total Budget Amount Input */}
              <div className="bg-white rounded-3xl p-3.5 shadow-2xs border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#00C853] flex items-center justify-center">
                    <Banknote size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total Budget (৳) *</p>
                    <input
                      type="number"
                      required
                      min={50}
                      value={totalBudget}
                      onChange={(e) => setTotalBudget(Number(e.target.value))}
                      className="text-[15px] font-black text-slate-950 bg-transparent outline-none w-full mt-0.5"
                    />
                  </div>
                </div>
              </div>

              {/* Billing Type */}
              <div className="bg-white rounded-3xl p-3.5 shadow-2xs border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-50 text-[#8C3494] flex items-center justify-center">
                    <Receipt size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Billing Type</p>
                    <select
                      value={billingType}
                      onChange={(e) => setBillingType(e.target.value)}
                      className="text-[14px] font-black text-slate-950 bg-transparent outline-none cursor-pointer mt-0.5 border-none"
                    >
                      <option value="CPM (Per 1000 Impressions)">CPM (Per 1000 Impressions)</option>
                      <option value="CPC (Per Click)">CPC (Per Click)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 8. DURATION (OPTIONAL)                                                    */}
          {/* ========================================================================= */}
          <div className="space-y-1.5">
            <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide px-1">
              Duration (Optional)
            </h2>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-3xl p-3 shadow-2xs border border-slate-100 flex items-center gap-2.5">
                <Calendar size={18} className="text-slate-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Start Date</p>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs font-bold text-slate-900 bg-transparent outline-none w-full"
                  />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-3 shadow-2xs border border-slate-100 flex items-center gap-2.5">
                <Calendar size={18} className="text-slate-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">End Date</p>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs font-bold text-slate-900 bg-transparent outline-none w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 9. AUDIENCE TARGETING                                                     */}
          {/* ========================================================================= */}
          <div className="space-y-2">
            <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide px-1">
              Audience Targeting
            </h2>

            {/* Target Gender */}
            <div className="bg-white rounded-3xl p-3.5 shadow-2xs border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0091FF] flex items-center justify-center">
                  <Users size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Target Gender</p>
                  <select
                    value={targetGender}
                    onChange={(e) => setTargetGender(e.target.value)}
                    className="text-[14px] font-black text-slate-950 bg-transparent outline-none cursor-pointer mt-0.5 border-none"
                  >
                    <option value="All">All</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Min Age / Max Age */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-3xl p-3.5 shadow-2xs border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Min Age</p>
                <input
                  type="number"
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value)}
                  className="text-sm font-black text-slate-900 bg-transparent outline-none w-full mt-0.5"
                />
              </div>

              <div className="bg-white rounded-3xl p-3.5 shadow-2xs border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Max Age</p>
                <input
                  type="number"
                  value={maxAge}
                  onChange={(e) => setMaxAge(e.target.value)}
                  className="text-sm font-black text-slate-900 bg-transparent outline-none w-full mt-0.5"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 10. LOCATION TARGETING                                                    */}
          {/* ========================================================================= */}
          <div className="space-y-2">
            <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide px-1">
              Location Targeting
            </h2>

            {/* Default Country */}
            <div className="bg-white rounded-3xl p-3.5 shadow-2xs border border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#00C853] flex items-center justify-center shrink-0">
                <Flag size={16} />
              </div>
              <div>
                <p className="text-[14px] font-black text-slate-950">Bangladesh</p>
                <p className="text-[11px] text-slate-500">Default country</p>
              </div>
            </div>

            {/* Whole Bangladesh Toggle Card */}
            <div className="bg-white rounded-3xl p-4 shadow-2xs border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-black text-slate-950">Whole Bangladesh</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Ad will show to all regions</p>
              </div>

              <button
                type="button"
                onClick={() => setIsWholeBangladesh(!isWholeBangladesh)}
                className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer border-none shrink-0 ${
                  isWholeBangladesh ? "bg-[#0091FF]" : "bg-slate-300"
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                    isWholeBangladesh ? "translate-x-5.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 11. SUBMISSION BUTTON & DISCLAIMER                                        */}
          {/* ========================================================================= */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isCreatingAd}
              className="w-full py-4 bg-[#0072FF] hover:bg-blue-600 active:scale-[0.99] text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50"
            >
              <Megaphone size={18} />
              <span>{isCreatingAd ? "বিজ্ঞাপন তৈরি হচ্ছে..." : "Create Advertisement"}</span>
            </button>

            <p className="text-center text-[11px] text-slate-400">
              Budget will be deducted from your wallet upon creation.
            </p>
          </div>

        </form>
      </main>

      {/* ========================================================================= */}
      {/* 12. RECHARGE MODAL                                                        */}
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
                <h3 className="font-black text-slate-950 text-base">Recharge Wallet for Ads</h3>
                <button
                  type="button"
                  onClick={() => setShowRechargeModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center border-0 bg-transparent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRechargeSubmit} className="space-y-3.5">
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/60 text-xs text-blue-900 flex items-center justify-between">
                  <span>বিজ্ঞাপন বাজেট:</span>
                  <span className="font-black text-sm">৳{totalBudget}</span>
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
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[#0091FF] text-sm">01700000000</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("01700000000");
                        toast.success("নম্বর কপি করা হয়েছে");
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold border-0 bg-transparent cursor-pointer flex items-center gap-1"
                    >
                      <Copy size={13} />
                      কপি
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">যে নম্বর থেকে টাকা পাঠিয়েছেন</label>
                  <input
                    type="tel"
                    required
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-[#0091FF]"
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
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm uppercase font-mono font-bold outline-none focus:border-[#0091FF]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isRecharging}
                    className="w-full py-3 bg-[#0072FF] hover:bg-blue-600 text-white font-black text-xs sm:text-sm rounded-2xl transition shadow-xs border-0 cursor-pointer disabled:opacity-50"
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

export default CreateAdvertisementPage;
