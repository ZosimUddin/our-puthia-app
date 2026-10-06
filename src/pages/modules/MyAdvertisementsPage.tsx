import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Eye, 
  MousePointer, 
  Calendar, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Megaphone,
  X
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
  doc, 
  updateDoc, 
  deleteDoc, 
  orderBy 
} from "firebase/firestore";
import SEO from "../../components/SEO";

interface AdItem {
  id: string;
  title: string;
  description?: string;
  clickUrl?: string;
  actionButtonType?: string;
  buttonText?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  placement?: string;
  budgetType?: string;
  totalBudget: number;
  spentBudget?: number;
  billingType?: string;
  startDate?: string;
  endDate?: string;
  status: "running" | "active" | "paused" | "pending" | "completed" | "rejected";
  impressions?: number;
  clicks?: number;
  createdAt: any;
}

export const MyAdvertisementsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active Tab: 'running' | 'paused' | 'pending' | 'completed'
  const [activeTab, setActiveTab] = useState<"running" | "paused" | "pending" | "completed">("running");

  // Ads list state
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time Firestore Listener
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "advertisements"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: AdItem[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as AdItem);
        });
        setAds(list);
        setLoading(false);
      },
      (error) => {
        console.warn("Advertisements listener error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Toggle Ad Pause / Resume
  const handleToggleStatus = async (ad: AdItem) => {
    const isCurrentlyRunning = ad.status === "running" || ad.status === "active";
    const nextStatus = isCurrentlyRunning ? "paused" : "running";

    try {
      await updateDoc(doc(db, "advertisements", ad.id), {
        status: nextStatus
      });
      toast.success(nextStatus === "running" ? "বিজ্ঞাপন চালু করা হয়েছে!" : "বিজ্ঞাপন সাময়িক বন্ধ করা হয়েছে");
    } catch (err) {
      console.error(err);
      toast.error("স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে");
    }
  };

  // Delete Ad
  const handleDeleteAd = async (adId: string) => {
    if (true) {
      return;
    }

    try {
      await deleteDoc(doc(db, "advertisements", adId));
      toast.success("বিজ্ঞাপন সফলভাবে মুছে ফেলা হয়েছে");
    } catch (err) {
      console.error(err);
      toast.error("বিজ্ঞাপন মুছতে সমস্যা হয়েছে");
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(user?.uid ? `/profile/${user.uid}` : "/adda");
    }
  };

  // Filter ads by active tab
  const filteredAds = ads.filter((ad) => {
    if (activeTab === "running") {
      return ad.status === "running" || ad.status === "active";
    }
    if (activeTab === "paused") {
      return ad.status === "paused";
    }
    if (activeTab === "pending") {
      return ad.status === "pending";
    }
    if (activeTab === "completed") {
      return ad.status === "completed" || ad.status === "rejected";
    }
    return true;
  });

  const emptyText = 
    activeTab === "running" ? "No running ads" :
    activeTab === "paused" ? "No paused ads" :
    activeTab === "pending" ? "No pending ads" :
    "No completed ads";

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-24 select-none text-slate-900 relative">
      <SEO 
        title="My Advertisements - আমার বিজ্ঞাপনসমূহ" 
        description="আপনার বিজ্ঞাপনের স্থিতি, পারফর্মেন্স ও বিশ্লেষণ পরিচালনা করুন"
        path="/my-ads"
      />

      {/* ========================================================================= */}
      {/* 1. TOP APP BAR (Back Arrow + My Advertisements Title)                     */}
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
            My Advertisements
          </h1>
        </div>

        {/* ========================================================================= */}
        {/* 2. HORIZONTAL TAB BAR (Running, Paused, Pending, Completed)               */}
        {/* ========================================================================= */}
        <div className="max-w-md mx-auto px-4 flex items-center justify-between border-t border-slate-50 text-xs sm:text-sm font-bold text-slate-500 overflow-x-auto no-scrollbar">
          {[
            { id: "running", label: "Running" },
            { id: "paused", label: "Paused" },
            { id: "pending", label: "Pending" },
            { id: "completed", label: "Completed" }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 relative transition cursor-pointer border-none bg-transparent whitespace-nowrap ${
                  isActive ? "text-[#1877F2] font-black" : "hover:text-slate-800 font-semibold"
                }`}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#1877F2] rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Ads Canvas */}
      <main className="max-w-md mx-auto px-4 pt-6">
        {loading ? (
          <div className="py-24 text-center text-slate-400 text-xs font-medium">
            বিজ্ঞাপন লোড হচ্ছে...
          </div>
        ) : filteredAds.length === 0 ? (
          /* ========================================================================= */
          /* 3. EMPTY STATE (Concentric Target Click Icon matching Screenshot 2)       */
          /* ========================================================================= */
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
            {/* Target SVG matching Screenshot 2 */}
            <div className="w-24 h-24 mb-4 text-slate-300 flex items-center justify-center">
              <svg viewBox="0 0 100 100" fill="none" className="w-20 h-20 text-slate-300" stroke="currentColor">
                <circle cx="50" cy="50" r="42" strokeWidth="6" strokeLinecap="round" strokeDasharray="180 50" />
                <circle cx="50" cy="50" r="28" strokeWidth="6" strokeLinecap="round" strokeDasharray="120 40" />
                <path d="M50 50 L75 75 M75 75 L60 75 M75 75 L75 60" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" />
              </svg>
            </div>

            <p className="text-slate-400 font-medium text-[15px]">
              {emptyText}
            </p>
          </div>
        ) : (
          /* ========================================================================= */
          /* 4. ADS LIST ITEMS (When Ads Exist in Selected Tab)                        */
          /* ========================================================================= */
          <div className="space-y-3.5">
            {filteredAds.map((ad) => {
              const isRunning = ad.status === "running" || ad.status === "active";
              return (
                <div
                  key={ad.id}
                  className="bg-white rounded-3xl p-4 shadow-2xs border border-slate-100 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {ad.mediaUrl ? (
                        ad.mediaType === "video" ? (
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center text-slate-500">
                            <Play size={20} />
                          </div>
                        ) : (
                          <img
                            src={ad.mediaUrl}
                            alt={ad.title}
                            className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-slate-100"
                          />
                        )
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0091FF] flex items-center justify-center shrink-0">
                          <Megaphone size={22} />
                        </div>
                      )}

                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-slate-950 truncate">
                          {ad.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {ad.placement || "Home Feed"} • ৳{ad.totalBudget}
                        </p>
                        <span className={`inline-block text-[9.5px] font-black px-2 py-0.5 rounded-md mt-1.5 ${
                          isRunning
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                            : ad.status === "paused"
                            ? "bg-amber-50 text-amber-600 border border-amber-200/60"
                            : ad.status === "pending"
                            ? "bg-blue-50 text-[#0091FF] border border-blue-200/60"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {isRunning ? "Running" : ad.status === "paused" ? "Paused" : ad.status === "pending" ? "Pending Approval" : "Completed"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {(isRunning || ad.status === "paused") && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(ad)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition border-none cursor-pointer ${
                            isRunning ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                          }`}
                          title={isRunning ? "বিজ্ঞাপন বন্ধ রাখুন" : "চালু করুন"}
                        >
                          {isRunning ? <Pause size={15} /> : <Play size={15} />}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteAd(ad.id)}
                        className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition border-none cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Stats Bar */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Eye size={14} className="text-slate-400" />
                      <span>{ad.impressions || 0} Impressions</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <MousePointer size={14} className="text-slate-400" />
                      <span>{ad.clicks || 0} Clicks</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 5. BOTTOM FLOATING ACTION BUTTON (FAB) (Matching Screenshot 2)            */}
      {/* ========================================================================= */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          type="button"
          onClick={() => navigate("/ads/create")}
          className="w-14 h-14 rounded-2xl bg-[#E7F0FE] text-[#1877F2] hover:bg-[#D4E5FE] active:scale-95 shadow-md flex items-center justify-center transition cursor-pointer border-none"
          title="নতুন বিজ্ঞাপন তৈরি করুন"
          aria-label="Create New Advertisement"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      </div>

    </div>
  );
};

export default MyAdvertisementsPage;
