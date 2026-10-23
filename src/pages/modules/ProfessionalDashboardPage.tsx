import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  ArrowLeft, 
  Users, 
  Eye, 
  FileText, 
  Play, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  AlertCircle,
  Clock,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc 
} from "firebase/firestore";
import SEO from "../../components/SEO";

// Helper to convert numbers to Bengali numerals
const toBengaliNumber = (num: number | string): string => {
  if (num === undefined || num === null) return "০";
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
};

export const ProfessionalDashboardPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  // Dynamic Real-time Metrics State
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [postsCount, setPostsCount] = useState<number>(0);
  const [reelsCount, setReelsCount] = useState<number>(0);
  const [postViews, setPostViews] = useState<number>(0);
  const [reelViews, setReelViews] = useState<number>(0);
  const [monthlyPostViews, setMonthlyPostViews] = useState<number>(0);
  const [monthlyReelViews, setMonthlyReelViews] = useState<number>(0);
  const [accountAgeDays, setAccountAgeDays] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // 1. Real-time User Document Listener (Followers & Account Age)
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const fCount = Number(data.followersCount || (Array.isArray(data.followers) ? data.followers.length : 0));
        setFollowersCount(fCount);

        const createdAt = data.createdAt || (userProfile as any)?.createdAt || (user as any)?.metadata?.creationTime;
        if (createdAt) {
          const createdDate = typeof createdAt?.toDate === 'function' ? createdAt.toDate() : new Date(createdAt);
          const diffTime = Math.abs(Date.now() - createdDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setAccountAgeDays(Math.max(1, diffDays));
        }
      }
    }, (err) => {
      console.warn("User doc listener error:", err);
    });

    // Initial fallback if user profile is already in AuthContext
    const initFollowers = Number((userProfile as any)?.followersCount || (userProfile as any)?.followers?.length || 0);
    if (initFollowers) setFollowersCount(initFollowers);

    // 2. Real-time Posts Query Listener (Count & Views)
    const postsQuery = query(
      collection(db, "posts"),
      where("userId", "==", user.uid)
    );
    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      setPostsCount(snapshot.size);
      let pViews = 0;
      let pMonthlyViews = 0;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      snapshot.forEach((docSnap) => {
        const pData = docSnap.data();
        const views = Number(pData.viewsCount || pData.views || pData.viewCount || 0);
        pViews += views;

        const pDate = pData.createdAt?.toDate ? pData.createdAt.toDate() : (pData.createdAt ? new Date(pData.createdAt) : null);
        if (pDate && pDate >= startOfMonth) {
          pMonthlyViews += views;
        }
      });
      setPostViews(pViews);
      setMonthlyPostViews(pMonthlyViews);
      setLoading(false);
    }, (err) => {
      console.warn("Posts listener error:", err);
      setLoading(false);
    });

    // 3. Real-time Reels / Scrolle Query Listener (Count & Views)
    const reelsQuery = query(
      collection(db, "reels"),
      where("userId", "==", user.uid)
    );
    const unsubscribeReels = onSnapshot(reelsQuery, (snapshot) => {
      setReelsCount(snapshot.size);
      let rViews = 0;
      let rMonthlyViews = 0;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      snapshot.forEach((docSnap) => {
        const rData = docSnap.data();
        const views = Number(rData.viewsCount || rData.views || rData.viewCount || 0);
        rViews += views;

        const rDate = rData.createdAt?.toDate ? rData.createdAt.toDate() : (rData.createdAt ? new Date(rData.createdAt) : null);
        if (rDate && rDate >= startOfMonth) {
          rMonthlyViews += views;
        }
      });
      setReelViews(rViews);
      setMonthlyReelViews(rMonthlyViews);
    }, (err) => {
      console.warn("Reels listener error:", err);
    });

    return () => {
      unsubscribeUser();
      unsubscribePosts();
      unsubscribeReels();
    };
  }, [user, userProfile]);

  // Combined Totals
  const totalViews = postViews + reelViews;
  const monthlyViews = monthlyPostViews + monthlyReelViews;

  // Requirements Check
  const reqFollowersMet = followersCount >= 1000;
  const reqPostsMet = postsCount >= 10;
  const reqReelsMet = reelsCount >= 7;
  const reqAgeMet = accountAgeDays >= 180;
  const allReqsMet = reqFollowersMet && reqPostsMet && reqReelsMet && reqAgeMet;

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(user?.uid ? `/profile/${user.uid}` : "/adda");
    }
  };

  const handleApplyMonetization = () => {
    if (!allReqsMet) {
      toast.info("মনিটাইজেশনের জন্য প্রয়োজনীয় শর্তগুলো পূরণ করতে হবে।");
      return;
    }
    toast.success("মনিটাইজেশন আবেদন সফলভাবে গৃহীত হয়েছে! আমাদের টিম রিভিউ করবে।");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-16 select-none text-slate-900">
      <SEO 
        title="Professional Dashboard - প্রফেশনাল ড্যাশবোর্ড" 
        description="আপনার কন্টেন্ট এনগেজমেন্ট, ভিউ ও মনিটাইজেশন শর্তাবলী পর্যবেক্ষণ করুন"
        path="/professional-dashboard"
      />

      {/* ========================================================================= */}
      {/* 1. TOP APP BAR (Back Arrow + Professional Dashboard Title)                */}
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
            প্রফেশনাল ড্যাশবোর্ড
          </h1>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="max-w-md mx-auto px-4 pt-5 space-y-6">

        {/* ========================================================================= */}
        {/* 2. PERFORMANCE OVERVIEW (2x2 Grid matching Screenshot)                   */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <h2 className="text-[17px] font-black text-slate-950 tracking-tight flex items-center justify-between">
            <span>পারফর্মেন্স ওভারভিউ</span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              ● রিয়েল-টাইম
            </span>
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* 2.1 Followers Card */}
            <div className="bg-white rounded-3xl p-4 shadow-2xs border border-slate-100 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0091FF] flex items-center justify-center shrink-0">
                <Users size={22} className="stroke-[2.2]" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-950 leading-tight">
                  {toBengaliNumber(followersCount)}
                </p>
                <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">
                  ফলোয়ার
                </p>
              </div>
            </div>

            {/* 2.2 Total Views Card */}
            <div className="bg-white rounded-3xl p-4 shadow-2xs border border-slate-100 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-[#9333EA] flex items-center justify-center shrink-0">
                <Eye size={22} className="stroke-[2.2]" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-950 leading-tight">
                  {toBengaliNumber(totalViews)}
                </p>
                <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">
                  মোট ভিউ
                </p>
              </div>
            </div>

            {/* 2.3 Posts Card */}
            <div className="bg-white rounded-3xl p-4 shadow-2xs border border-slate-100 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-teal-50 text-[#0D9488] flex items-center justify-center shrink-0">
                <FileText size={22} className="stroke-[2.2]" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-950 leading-tight">
                  {toBengaliNumber(postsCount)}
                </p>
                <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">
                  পোস্ট
                </p>
              </div>
            </div>

            {/* 2.4 Scrolle Card */}
            <div className="bg-white rounded-3xl p-4 shadow-2xs border border-slate-100 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-[#E11D48] flex items-center justify-center shrink-0">
                <Play size={22} className="stroke-[2.2] fill-current" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-950 leading-tight">
                  {toBengaliNumber(reelsCount)}
                </p>
                <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">
                  স্ক্স্রোল (Scrolle)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. MONETIZATION (Checklist & Revenue Share matching Screenshot)          */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <h2 className="text-[17px] font-black text-slate-950 tracking-tight">
            মনিটাইজেশন
          </h2>

          <div className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-100 space-y-4">
            {/* Header: $ Icon + Monetization Requirements */}
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#FF9800] text-white flex items-center justify-center shadow-xs">
                  <DollarSign size={16} strokeWidth={3} />
                </div>
                <h3 className="text-[15px] font-black text-slate-950">
                  মনিটাইজেশনের প্রয়োজনীয় শর্তাবলী
                </h3>
              </div>
              <p className="text-[12px] text-slate-500 leading-relaxed pl-9.5">
                আপনার কন্টেন্টে বিজ্ঞাপন ভিউ থেকে ৫৫% রেভিনিউ শেয়ার আয় করুন
              </p>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3 pt-1">
              {/* 3.1 Followers */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-[#F59E0B] flex items-center justify-center shrink-0">
                    <Users size={18} className="stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-slate-900">ফলোয়ার (Followers)</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {toBengaliNumber(followersCount)} / ১,০০০
                    </p>
                  </div>
                </div>

                <div className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center transition ${
                  reqFollowersMet ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-transparent"
                }`}>
                  {reqFollowersMet && <CheckCircle2 size={15} className="fill-current text-white" />}
                </div>
              </div>

              {/* 3.2 Posts */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-[#F59E0B] flex items-center justify-center shrink-0">
                    <FileText size={18} className="stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-slate-900">পোস্ট (Posts)</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {toBengaliNumber(postsCount)} / ১০
                    </p>
                  </div>
                </div>

                <div className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center transition ${
                  reqPostsMet ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-transparent"
                }`}>
                  {reqPostsMet && <CheckCircle2 size={15} className="fill-current text-white" />}
                </div>
              </div>

              {/* 3.3 Scrolle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-[#F59E0B] flex items-center justify-center shrink-0">
                    <Play size={18} className="stroke-[2.2] fill-current" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-slate-900">স্ক্স্রোল (Scrolle)</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {toBengaliNumber(reelsCount)} / ৭
                    </p>
                  </div>
                </div>

                <div className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center transition ${
                  reqReelsMet ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-transparent"
                }`}>
                  {reqReelsMet && <CheckCircle2 size={15} className="fill-current text-white" />}
                </div>
              </div>

              {/* 3.4 Account Age */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-[#F59E0B] flex items-center justify-center shrink-0">
                    <Calendar size={18} className="stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-slate-900">অ্যাকাউন্টের বয়স</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {toBengaliNumber(accountAgeDays)} / ১৮০ দিন
                    </p>
                  </div>
                </div>

                <div className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center transition ${
                  reqAgeMet ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-transparent"
                }`}>
                  {reqAgeMet && <CheckCircle2 size={15} className="fill-current text-white" />}
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleApplyMonetization}
                className={`w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm transition cursor-pointer border-none ${
                  allReqsMet
                    ? "bg-[#0091FF] hover:bg-[#0070c9] text-white shadow-md active:scale-98"
                    : "bg-[#E2E5E9] text-[#8C939E] cursor-not-allowed"
                }`}
              >
                {allReqsMet ? "মনিটাইজেশনের জন্য আবেদন করুন" : "শর্তাবলী এখনো পূরণ হয়নি"}
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. THIS MONTH (Content views this month matching Screenshot)              */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <h2 className="text-[17px] font-black text-slate-950 tracking-tight">
            এই মাসে
          </h2>

          <div className="bg-white rounded-3xl p-4 shadow-2xs border border-slate-100 flex items-center gap-3.5">
            <div className="text-emerald-500 shrink-0">
              <TrendingUp size={28} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-base font-black text-slate-950">
                {toBengaliNumber(monthlyViews)} টি ভিউ
              </p>
              <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">
                এই মাসে কন্টেন্ট ভিউ
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default ProfessionalDashboardPage;
