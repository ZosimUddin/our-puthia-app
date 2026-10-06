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
  getDocs 
} from "firebase/firestore";
import SEO from "../../components/SEO";

export const ProfessionalDashboardPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  // Dynamic Metrics State
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [totalViews, setTotalViews] = useState<number>(0);
  const [postsCount, setPostsCount] = useState<number>(0);
  const [reelsCount, setReelsCount] = useState<number>(0);
  const [monthlyViews, setMonthlyViews] = useState<number>(0);
  const [accountAgeDays, setAccountAgeDays] = useState<number>(40);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // 1. Calculate Account Age
    const createdAt = (userProfile as any)?.createdAt || (user as any)?.metadata?.creationTime;
    if (createdAt) {
      const createdDate = typeof createdAt?.toDate === 'function' ? createdAt.toDate() : new Date(createdAt);
      const diffTime = Math.abs(Date.now() - createdDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setAccountAgeDays(Math.max(1, diffDays));
    } else {
      setAccountAgeDays(40);
    }

    // 2. Fetch User Posts Count & Views
    const postsQuery = query(
      collection(db, "posts"),
      where("userId", "==", user.uid)
    );
    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      setPostsCount(snapshot.size);
      let views = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        views += Number(data.viewsCount || data.views || 0);
      });
      setTotalViews(prev => prev + views);
      setMonthlyViews(views);
    });

    // 3. Fetch User Reels / Scrolle Count
    const reelsQuery = query(
      collection(db, "reels"),
      where("userId", "==", user.uid)
    );
    const unsubscribeReels = onSnapshot(reelsQuery, (snapshot) => {
      setReelsCount(snapshot.size);
    });

    // 4. Followers Count
    const followers = (userProfile as any)?.followersCount || (userProfile as any)?.followers?.length || 0;
    setFollowersCount(followers);

    setLoading(false);

    return () => {
      unsubscribePosts();
      unsubscribeReels();
    };
  }, [user, userProfile]);

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
            Professional Dashboard
          </h1>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="max-w-md mx-auto px-4 pt-5 space-y-6">

        {/* ========================================================================= */}
        {/* 2. PERFORMANCE OVERVIEW (2x2 Grid matching Screenshot 2)                  */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <h2 className="text-[17px] font-black text-slate-950 tracking-tight">
            Performance Overview
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* 2.1 Followers Card */}
            <div className="bg-white rounded-3xl p-4 shadow-2xs border border-slate-100 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0091FF] flex items-center justify-center shrink-0">
                <Users size={22} className="stroke-[2.2]" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-950 leading-tight">
                  {followersCount}
                </p>
                <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">
                  Followers
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
                  {totalViews}
                </p>
                <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">
                  Total Views
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
                  {postsCount}
                </p>
                <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">
                  Posts
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
                  {reelsCount}
                </p>
                <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">
                  Scrolle
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. MONETIZATION (Checklist & Revenue Share matching Screenshot 2)         */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <h2 className="text-[17px] font-black text-slate-950 tracking-tight">
            Monetization
          </h2>

          <div className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-100 space-y-4">
            {/* Header: $ Icon + Monetization Requirements */}
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#FF9800] text-white flex items-center justify-center shadow-xs">
                  <DollarSign size={16} strokeWidth={3} />
                </div>
                <h3 className="text-[15px] font-black text-slate-950">
                  Monetization Requirements
                </h3>
              </div>
              <p className="text-[12px] text-slate-500 leading-relaxed pl-9.5">
                Earn 55% revenue share from ad views on your content
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
                    <p className="text-[13px] font-black text-slate-900">Followers</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{followersCount} / 1000</p>
                  </div>
                </div>

                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  reqFollowersMet ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-transparent"
                }`}>
                  {reqFollowersMet && <CheckCircle2 size={14} className="fill-current text-white" />}
                </div>
              </div>

              {/* 3.2 Posts */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-[#F59E0B] flex items-center justify-center shrink-0">
                    <FileText size={18} className="stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-slate-900">Posts</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{postsCount} / 10</p>
                  </div>
                </div>

                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  reqPostsMet ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-transparent"
                }`}>
                  {reqPostsMet && <CheckCircle2 size={14} className="fill-current text-white" />}
                </div>
              </div>

              {/* 3.3 Scrolle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-[#F59E0B] flex items-center justify-center shrink-0">
                    <Play size={18} className="stroke-[2.2] fill-current" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-slate-900">Scrolle</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{reelsCount} / 7</p>
                  </div>
                </div>

                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  reqReelsMet ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-transparent"
                }`}>
                  {reqReelsMet && <CheckCircle2 size={14} className="fill-current text-white" />}
                </div>
              </div>

              {/* 3.4 Account Age */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-[#F59E0B] flex items-center justify-center shrink-0">
                    <Calendar size={18} className="stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-slate-900">Account Age</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{accountAgeDays} / 180 days</p>
                  </div>
                </div>

                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  reqAgeMet ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-transparent"
                }`}>
                  {reqAgeMet && <CheckCircle2 size={14} className="fill-current text-white" />}
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
                    ? "bg-[#0091FF] hover:bg-blue-600 text-white shadow-md"
                    : "bg-[#E2E5E9] text-[#8C939E] cursor-not-allowed"
                }`}
              >
                {allReqsMet ? "Apply for Monetization" : "Requirements not met yet"}
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. THIS MONTH (Content views this month matching Screenshot 2)            */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <h2 className="text-[17px] font-black text-slate-950 tracking-tight">
            This Month
          </h2>

          <div className="bg-white rounded-3xl p-4 shadow-2xs border border-slate-100 flex items-center gap-3.5">
            <div className="text-emerald-500 shrink-0">
              <TrendingUp size={28} className="stroke-[2.5]" />
            </div>
            <div>
              <p className="text-base font-black text-slate-950">
                {monthlyViews} views
              </p>
              <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">
                Content views this month
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default ProfessionalDashboardPage;
