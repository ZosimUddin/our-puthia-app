import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Download, ShieldCheck, Folder, Settings, 
  CheckCircle, AlertTriangle, Bell, ChevronDown, ChevronUp,
  Smartphone, Share2, RefreshCw, FileText, Sparkles, X, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "sonner";
import SEO from "../../components/SEO";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function DownloadAppPage() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [appSettings, setAppSettings] = useState<{
    apkDownloadUrl?: string;
    playStoreLink?: string;
    appVersion?: string;
    updateMessage?: string;
  }>({});
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Accordion state
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });

    // Listen to real-time app settings from Firestore
    const unsub = onSnapshot(doc(db, "app_settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAppSettings({
          apkDownloadUrl: data.apkDownloadUrl || "",
          playStoreLink: data.playStoreLink || "",
          appVersion: data.minAppVersion || data.appVersion || "২.২.১",
          updateMessage: data.updateMessage || "",
        });
      }
    }, (err) => {
      console.warn("Could not load app settings:", err);
    });

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      unsub();
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          toast.success("🎉 আমাদের পুঠিয়া অ্যাপটি সফলভাবে আপনার ফোনে ইনস্টল হচ্ছে!");
          setShowOptionsModal(false);
          setDeferredPrompt(null);
          return;
        }
      } catch (e) {
        console.warn('PWA prompt error:', e);
      }
    }
    toast.info("📱 Chrome ব্রাউজারের উপরে (⋮) থ্রি-ডট মেনু থেকে 'Add to Home screen' বা 'Install app' চাপুন।");
  };

  const handleDownloadApk = async () => {
    // 1. If native PWA install prompt is supported on this browser, trigger it immediately!
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          toast.success("🎉 আমাদের পুঠিয়া অ্যাপটি সফলভাবে ইনস্টল হচ্ছে!");
          setDeferredPrompt(null);
          return;
        }
      } catch (e) {
        console.warn('PWA prompt skipped');
      }
    }

    // 2. If admin has configured custom cloud APK URL (Google Drive/Firebase Storage)
    if (appSettings.apkDownloadUrl && appSettings.apkDownloadUrl.startsWith("http")) {
      window.open(appSettings.apkDownloadUrl, "_blank", "noopener,noreferrer");
      toast.success("📥 ক্লাউড স্টোরেজ থেকে অ্যাপ ডাউনলোড হচ্ছে...");
      return;
    }

    // 3. Otherwise, open the interactive install modal with step-by-step guidance
    setShowOptionsModal(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "আমাদের পুঠিয়া অ্যাপ",
        text: "আমাদের পুঠিয়া অ্যাপ ডাউনলোড করুন - রক্তদান, ডাক্তার, জরুরি সেবা ও উপজেলার সকল তথ্য এক সাথে!",
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("অ্যাপ ডাউনলোডের লিংক কপি করা হয়েছে!");
    }
  };

  const toggleBrand = (brand: string) => {
    setActiveBrand(activeBrand === brand ? null : brand);
  };

  const toggleFaq = (faq: string) => {
    setActiveFaq(activeFaq === faq ? null : faq);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-24 font-sans select-none">
      <SEO 
        title="আমাদের পুঠিয়া অ্যাপ ডাউনলোড - Official Android App"
        description="আমাদের পুঠিয়া অফিসিয়াল মোবাইল অ্যাপ ডাউনলোড করুন। রক্তদান, ডাক্তার, জরুরি সেবা ও উপজেলার সকল তথ্য সহজে হাতের মুঠোয়।"
      />

      {/* Sticky Top Bar matching Baraigram Screenshot */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => navigate(-1)}
            className="p-1.5 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
            আমাদের পুঠিয়া অ্যাপ
          </h1>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition cursor-pointer"
          aria-label="Share"
        >
          <Share2 size={18} />
        </button>
      </header>

      <main className="max-w-md mx-auto px-3.5 sm:px-4 py-4 space-y-4">
        
        {/* 1. Hero Green Card matching 2nd picture */}
        <div className="rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#0d9488] p-5 sm:p-6 text-white text-center shadow-xl shadow-emerald-950/15 relative overflow-hidden border border-emerald-500/20">
          {/* Subtle Ambient Background */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-teal-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            {/* App Icon matching screenshot squircle with leaf */}
            <div className="w-18 h-18 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/30 shadow-inner relative overflow-hidden">
              <span className="text-3xl font-black text-white">প</span>
              <div className="absolute top-1.5 right-1.5 w-3 h-3 bg-emerald-300 rounded-full border border-white/40" />
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-1.5 text-white">
              আমাদের পুঠিয়া অ্যাপ
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-emerald-50 font-medium leading-snug px-2 mb-3 opacity-95">
              রক্তদান, ডাক্তার, ওষুধের দাম, আড্ডা, চাকরি — সব এক অ্যাপে, আরও দ্রুত।
            </p>

            {/* Meta Line */}
            <div className="text-[11px] sm:text-xs text-emerald-100 font-semibold tracking-wide mb-4 opacity-90">
              Android • ভার্সন ২.২.১ • ২৫ MB • হালনাগাদ ৪/১০/২০২৬
            </div>

            {/* Big White Download Button */}
            <button
              type="button"
              onClick={handleDownloadApk}
              className="w-full py-3.5 px-6 rounded-2xl bg-white text-emerald-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-50 active:scale-98 transition-all cursor-pointer group"
            >
              <Download className="w-5 h-5 text-emerald-800 group-hover:scale-110 transition-transform" strokeWidth={2.6} />
              <span>অ্যাপ ডাউনলোড করুন</span>
            </button>

            {/* Caption underneath */}
            <p className="text-[11px] text-emerald-100/90 font-medium mt-3">
              ডাউনলোডের পর নিচের ধাপগুলো মিলিয়ে ইনস্টল করুন — ২ মিনিটের কাজ!
            </p>
          </div>
        </div>

        {/* 2. Safety / Disclaimer Notice Card (Warm Amber) matching 2nd picture */}
        <div className="bg-[#fffbeb] border border-[#fde68a] rounded-2xl p-4 text-[#78350f] text-xs sm:text-[13px] leading-relaxed shadow-xs flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            অ্যাপটি এখনো Google Play Store-এ আসেনি, তাই ইনস্টলের সময় ফোন কয়েকটি <strong>সতর্কবার্তা</strong> দেখাবে। এটা স্বাভাবিক — Play Store-এর বাইরের সব অ্যাপেই এমন দেখায়। অ্যাপটি আমাদের পুঠিয়া টিমের নিজের তৈরি ও নিরাপদ; শুধু <strong>our-puthia-app.vercel.app</strong> থেকেই নামাবেন, অন্য কোথাও থেকে নয়।
          </div>
        </div>

        {/* 3. Section Title */}
        <div className="pt-2 pb-1">
          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            যেভাবে ইনস্টল করবেন
          </h3>
        </div>

        {/* 4. Step 1 Card: অ্যাপটি ডাউনলোড করুন */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Download size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400">ধাপ ১</div>
              <h4 className="text-sm font-bold text-slate-800 leading-tight">অ্যাপটি ডাউনলোড করুন</h4>
            </div>
          </div>
          <div className="text-xs text-slate-600 leading-relaxed pl-1 space-y-2 pt-1">
            <p>
              ওপরের <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[11px]">অ্যাপ ডাউনলোড করুন</span> বোতাম চাপুন।
            </p>
            <p>Chrome যদি জিজ্ঞেস করে:</p>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 space-y-1">
              <div className="font-semibold text-slate-800">
                <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded text-[11px]">File might be harmful</span> / <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded text-[11px]">এই ধরনের ফাইল ক্ষতিকর হতে পারে</span>
              </div>
              <div>
                — তাহলে <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-[11px]">Download anyway</span> বা <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-[11px]">তবুও ডাউনলোড করুন</span> চাপুন।
              </div>
            </div>
          </div>
        </div>

        {/* 5. Step 2 Card: ডাউনলোড করা ফাইলটি খুলুন */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Folder size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400">ধাপ ২</div>
              <h4 className="text-sm font-bold text-slate-800 leading-tight">ডাউনলোড করা ফাইলটি খুলুন</h4>
            </div>
          </div>
          <div className="text-xs text-slate-600 leading-relaxed pl-1 space-y-2 pt-1">
            <p>
              ডাউনলোড শেষে নিচে আসা <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-[11px]">Open</span> / <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-[11px]">খুলুন</span> চাপুন।
            </p>
            <p>
              চলে গেলে: স্ক্রিনের উপর থেকে নোটিফিকেশন বার টেনে নামিয়ে <strong>our-puthia.apk</strong> ফাইলে চাপুন, অথবা <strong>Files / My Files → Downloads</strong> ফোল্ডারে গিয়ে ফাইলটি চাপুন।
            </p>
          </div>
        </div>

        {/* 6. Step 3 Card: “অজানা অ্যাপ” ইনস্টলের অনুমতি দিন */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Settings size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400">ধাপ ৩</div>
              <h4 className="text-sm font-bold text-slate-800 leading-tight">“অজানা অ্যাপ” ইনস্টলের অনুমতি দিন</h4>
            </div>
          </div>
          <div className="text-xs text-slate-600 leading-relaxed pl-1 space-y-2 pt-1">
            <p>প্রথমবার ফোন বলবে:</p>
            <div className="p-2.5 bg-slate-100 rounded-xl font-mono text-[11px] text-slate-800">
              For your security, your phone is not allowed to install unknown apps from this source
            </div>
            <p>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-[11px]">Settings</span> / <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-[11px]">সেটিংস</span> চাপুন → <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-[11px]">Allow from this source</span> (এই উৎস থেকে অনুমতি দিন) সুইচটি <strong>চালু করুন</strong> → ফোনের <strong>ব্যাক (←)</strong> চাপুন।
            </p>
            <p className="text-[11px] text-slate-500">
              এই অনুমতি শুধু একবার লাগে। চাইলে ইনস্টলের পর আবার বন্ধ করে দিতে পারেন।
            </p>
          </div>
        </div>

        {/* 7. Step 4 Card: Install চাপুন */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400">ধাপ ৪</div>
              <h4 className="text-sm font-bold text-slate-800 leading-tight">Install চাপুন</h4>
            </div>
          </div>
          <div className="text-xs text-slate-600 leading-relaxed pl-1 space-y-1.5 pt-1">
            <p>
              “Do you want to install this app?” এলে <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-[11px]">Install</span> / <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-[11px]">ইনস্টল</span> চাপুন। কয়েক সেকেন্ড অপেক্ষা করুন।
            </p>
          </div>
        </div>

        {/* 8. Step 5 Card: Play Protect বাধা দিলে */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400">ধাপ ৫</div>
              <h4 className="text-sm font-bold text-slate-800 leading-tight">Play Protect বাধা দিলে</h4>
            </div>
          </div>
          <div className="text-xs text-slate-600 leading-relaxed pl-1 space-y-2 pt-1">
            <p>Google Play Protect এমন কিছু দেখাতে পারে:</p>
            <ul className="space-y-2 list-disc pl-4">
              <li>
                <strong>Unsafe app blocked</strong> বা <strong>Play Protect doesn't recognise this app's developer</strong>
                <div className="mt-1">
                  → <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-[11px]">More details</span> চাপুন → <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-[11px]">Install anyway</span> (তবুও ইনস্টল করুন)।
                </div>
              </li>
              <li>
                <strong>Send app for security check? / Scan app?</strong>
                <div className="mt-1">
                  → <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-[11px]">Don't send</span> বা <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-[11px]">Install without scanning</span> চাপুন। (Scan app চাপলেও সমস্যা নেই — স্ক্যান শেষে ইনস্টল হয়ে যাবে।)
                </div>
              </li>
            </ul>
            <p className="text-[11px] text-slate-500 pt-1">
              অ্যাপটি Play Store-এ নেই বলেই Google এটিকে এখনো চেনে না — এজন্যই এই বার্তা।
            </p>
          </div>
        </div>

        {/* 9. Step 6 Card: অ্যাপ খুলুন ও নোটিফিকেশন চালু করুন */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bell size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400">ধাপ ৬</div>
              <h4 className="text-sm font-bold text-slate-800 leading-tight">অ্যাপ খুলুন ও নোটিফিকেশন চালু করুন</h4>
            </div>
          </div>
          <div className="text-xs text-slate-600 leading-relaxed pl-1 space-y-2 pt-1">
            <p>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-[11px]">Open</span> চাপুন। প্রথমবার জিজ্ঞেস করবে <strong>Allow Our Puthia to send you notifications?</strong> → <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-[11px]">Allow</span> চাপুন — রক্তের অনুরোধ, নোটিশ ও আড্ডার মেসেজ সাথে সাথে পাবেন।
            </p>
            <p className="font-semibold text-slate-800">
              তারপর আপনার মোবাইল নম্বর দিয়ে লগইন করুন। 🎉
            </p>
          </div>
        </div>

        {/* 10. Accordion Section 1: আপনার ফোনের ব্র্যান্ড অনুযায়ী */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Smartphone size={16} className="text-emerald-700" />
            <h3 className="text-sm font-black text-slate-900">আপনার ফোনের ব্র্যান্ড অনুযায়ী</h3>
          </div>

          <div className="space-y-2">
            {[
              {
                id: 'samsung',
                name: 'Samsung',
                desc: 'My Files (আমার ফাইল) অ্যাপে যান → Installation files বা Downloads ফোল্ডারে যান → our-puthia.apk ফাইলে ট্যাপ করে Install চাপুন।'
              },
              {
                id: 'xiaomi',
                name: 'Xiaomi / Redmi / POCO',
                desc: 'File Manager → APKs বা Downloads ফোল্ডারে যান → our-puthia.apk ট্যাপ করুন → Settings এলে "I am aware of possible risks" টিক দিয়ে ১০ সেকেন্ড পর OK দিন → Install চাপুন।'
              },
              {
                id: 'oppo',
                name: 'Oppo / Realme / OnePlus',
                desc: 'File Manager → Downloads → our-puthia.apk ফাইলে চাপুন → "Allow unknown source installation" চালু করুন → Install চাপুন।'
              },
              {
                id: 'vivo',
                name: 'Vivo / iQOO',
                desc: 'Files / File Manager → Downloads → our-puthia.apk ফাইলে চাপুন → অনুমতি দিয়ে Install চাপুন।'
              },
              {
                id: 'symphony',
                name: 'Symphony / Walton / Tecno / Infinix / itel',
                desc: 'Chrome Downloads বা File Manager থেকে our-puthia.apk ফাইলটি ওপেন করে সরাসরি "Install" চাপুন।'
              }
            ].map(brand => (
              <div key={brand.id} className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => toggleBrand(brand.id)}
                  className="w-full p-3.5 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-slate-800 hover:bg-slate-50 transition cursor-pointer"
                >
                  <span>{brand.name}</span>
                  {activeBrand === brand.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>
                {activeBrand === brand.id && (
                  <div className="px-3.5 pb-3.5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2.5">
                    {brand.desc}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 11. Accordion Section 2: সমস্যা হলে */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-sm">🔧</span>
            <h3 className="text-sm font-black text-slate-900">সমস্যা হলে</h3>
          </div>

          <div className="space-y-2">
            {[
              {
                id: 'faq1',
                q: '“App not installed” / “অ্যাপ ইনস্টল হয়নি”',
                a: 'ফোনে পর্যাপ্ত মেমোরি (Storage) খালি আছে কি না দেখুন। পুরনো কোনো টেস্ট ভার্সন ইনস্টল করা থাকলে তা আগে আনইনস্টল করুন, তারপর পুনরায় ইনস্টল করুন।'
              },
              {
                id: 'faq2',
                q: '“There was a problem parsing the package”',
                a: 'ফাইলটি ডাউনলোড পুরোপুরি সম্পন্ন হয়নি। আবার ওপরের বোতাম চেপে নতুন করে সম্পূর্ণ ডাউনলোড করুন।'
              },
              {
                id: 'faq3',
                q: 'Install বাটন চাপা যাচ্ছে না / ধূসর হয়ে আছে',
                a: 'স্ক্রিন ওভারলে বা ব্লু লাইট ফিল্টার অ্যাপ চালু থাকলে সাময়িকভাবে তা বন্ধ রাখুন।'
              },
              {
                id: 'faq4',
                q: 'ডাউনলোড শুরুই হচ্ছে না',
                a: 'Chrome ব্রাউজারের থ্রি ডট মেনু থেকে "Desktop site" বন্ধ রাখুন অথবা লিংকটি কপি করে ক্রোম ব্রাউজারে পেস্ট করুন।'
              }
            ].map(faq => (
              <div key={faq.id} className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-3.5 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-slate-800 hover:bg-slate-50 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {activeFaq === faq.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>
                {activeFaq === faq.id && (
                  <div className="px-3.5 pb-3.5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2.5">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 12. Security, Updates & SHA-256 Box */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3 text-xs text-slate-600 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <RefreshCw size={16} className="text-emerald-700 shrink-0 mt-0.5" />
            <p>
              <strong>নতুন ভার্সন এলে:</strong> এই পেজ থেকে আবার ডাউনলোড করে ইনস্টল করুন — পুরনো অ্যাপ মুছতে হবে না, আপনার লগইন ও তথ্য থেকে যাবে। Play Store-এ এলে সেখান থেকেই আপডেট পাবেন।
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>সাবধান:</strong> WhatsApp/Facebook-এ কেউ “আমাদের পুঠিয়া অ্যাপ” ফাইল পাঠালে সেটি ইনস্টল করবেন না — সবসময় <strong>our-puthia-app.vercel.app/download</strong> থেকে নামান।
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono break-all">
            ফাইলের ফিঙ্গারপ্রিন্ট (SHA-256): c959b35a82600160f660da7cb6602fc661a4c4d9aa1fe89eed990c919296c350
          </div>
        </div>
      </main>

      {/* 13. Sticky Floating Download Button at Bottom matching Baraigram Screenshot */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-40 max-w-md mx-auto">
        <button
          type="button"
          onClick={handleDownloadApk}
          className="w-full py-3.5 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/15 active:scale-98 transition cursor-pointer"
        >
          <Download size={18} strokeWidth={2.6} />
          <span>অ্যাপ ডাউনলোড করুন</span>
        </button>
      </div>

      {/* 14. Download & Install Options Modal */}
      <AnimatePresence>
        {showOptionsModal && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-end sm:items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl border border-slate-100 space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Download size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-950 text-sm sm:text-base">
                      অ্যাপ ডাউনলোড ও ইনস্টল
                    </h3>
                    <p className="text-[11px] text-emerald-700 font-bold">
                      অফিসিয়াল নিরাপদ প্যাকেজ • আমাদের পুঠিয়া
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOptionsModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center border-0 bg-transparent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {/* Option 1: 1-Tap PWA Instant Install */}
                <button
                  type="button"
                  onClick={handleInstallPWA}
                  className="w-full p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-between text-left transition shadow-md cursor-pointer border-0 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                      <Smartphone size={22} strokeWidth={2.4} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black">
                        ১-ক্লিকে অ্যাপ ইনস্টল করুন (মোবাইল অ্যাপ)
                      </h4>
                      <p className="text-[11px] text-emerald-100">
                        সরাসরি আপনার ফোনের হোমস্ক্রিনে অ্যাপ আইকন যুক্ত হবে
                      </p>
                    </div>
                  </div>
                  <Sparkles size={20} className="text-emerald-200" />
                </button>

                {/* Option 2: Cloud / External APK if provided */}
                {appSettings.apkDownloadUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      window.open(appSettings.apkDownloadUrl, "_blank", "noopener,noreferrer");
                    }}
                    className="w-full p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-950 border border-emerald-200/70 flex items-center justify-between text-left transition shadow-2xs cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                        <Download size={20} strokeWidth={2.4} />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900">
                          ক্লাউড থেকে APK ডাউনলোড
                        </h4>
                        <p className="text-[11px] text-slate-600">
                          অফিসিয়াল APK ফাইল ডাউনলোড করুন
                        </p>
                      </div>
                    </div>
                    <ExternalLink size={18} className="text-emerald-700" />
                  </button>
                ) : null}

                {/* Option 3: Play Store if available */}
                {appSettings.playStoreLink ? (
                  <a
                    href={appSettings.playStoreLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-between text-left transition cursor-pointer no-underline"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                        <ExternalLink size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black">
                          Google Play Store
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          প্লে-স্টোর থেকে অফিসিয়াল অ্যাপ নামান
                        </p>
                      </div>
                    </div>
                  </a>
                ) : null}
              </div>

              {/* Instructions Tip */}
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200/60 text-xs text-emerald-950 space-y-1.5">
                <div className="flex items-center gap-1.5 font-black text-emerald-900">
                  <Sparkles size={14} className="text-emerald-700" />
                  <span>Chrome থেকে ইনস্টল করার সহজ নিয়ম:</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-emerald-800">
                  ১. আপনার Chrome ব্রাউজারের উপরে ডানদিকের <strong>তিনটি ডট (⋮)</strong> চাপুন।<br />
                  ২. তালিকায় <strong>"Install app"</strong> বা <strong>"Add to Home screen"</strong> (হোম স্ক্রিনে যোগ করুন) চাপুন।<br />
                  ৩. সাথে সাথে ফোনের অ্যাপ লিস্টে আমাদের পুঠিয়া অ্যাপটি যুক্ত হয়ে যাবে!
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
