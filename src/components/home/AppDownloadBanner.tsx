import React, { useState, useEffect } from 'react';
import { Smartphone, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const AppDownloadBanner: React.FC = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);
  const [showInfoToast, setShowInfoToast] = useState<string | null>(null);

  useEffect(() => {
    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstall = async (platformName: string) => {
    // If user clicks Google Play or the development box, directly go to /download matching screenshot 2
    if (platformName === 'google' || platformName === 'general') {
      navigate('/download');
      return;
    }

    // If on iOS (iPhone / iPad)
    if (isIOS || platformName === 'apple') {
      setShowIOSGuide(true);
      return;
    }

    // Fallback navigation
    navigate('/download');
  };

  const showNotification = (msg: string) => {
    setShowInfoToast(msg);
    setTimeout(() => {
      setShowInfoToast(null);
    }, 4500);
  };

  return (
    <section className="px-4 max-w-7xl mx-auto my-3 sm:my-5 select-none">
      {/* Toast alert */}
      {showInfoToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100000] bg-slate-900/95 text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-3 max-w-xs sm:max-w-md text-center">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{showInfoToast}</span>
        </div>
      )}

      {/* Main Gradient Card matching Our Puthia Green Brand Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#0d9488] p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/20 border border-emerald-500/20">
        {/* Soft Ambient Glows */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-teal-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          {/* Smartphone Outline Icon matching 2nd picture */}
          <div className="flex justify-center mb-2.5">
            <Smartphone className="w-10 h-10 text-white" strokeWidth={1.6} />
          </div>

          {/* Heading */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight mb-1">
            অ্যাপ ডাউনলোড করুন
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-white/90 font-medium mb-4">
            আপনার ফোনে ইনস্টল করুন — দ্রুত ও সুবিধাজনক
          </p>

          {/* Development Status Frosted Notice Box matching 2nd picture */}
          <div 
            onClick={() => triggerInstall('general')}
            className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 text-center mb-6 border border-white/20 max-w-xl mx-auto shadow-inner transition cursor-pointer"
          >
            <p className="text-xs sm:text-sm text-white/95 font-medium leading-relaxed">
              🚧 আমাদের অ্যাপ ডেভেলপমেন্টের কাজ চলছে। দ্রুত অ্যাক্সেসের জন্য ওয়েব অ্যাপ ইনস্টল করুন।
            </p>
          </div>

          {/* Two Store Buttons in one line side-by-side matching user request */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3.5 max-w-md mx-auto">
            {/* Download on App Store */}
            <button
              type="button"
              onClick={() => triggerInstall('apple')}
              className="bg-white/15 hover:bg-white/25 active:bg-white/30 backdrop-blur-md text-white rounded-2xl p-2.5 sm:p-3.5 border border-white/20 flex items-center justify-center gap-2 sm:gap-3 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm group min-w-0"
              aria-label="App Store থেকে ডাউনলোড করুন"
            >
              {/* Apple Icon */}
              <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-white shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.74 1.04-1.77.92-2.81-.9.04-2 .6-2.64 1.34-.56.64-1.05 1.68-.92 2.7.99.08 2.03-.49 2.64-1.23z"/>
              </svg>
              <div className="text-left leading-tight min-w-0">
                <div className="text-[9px] sm:text-[10px] text-white/80 font-semibold uppercase tracking-wider truncate">
                  Download on
                </div>
                <div className="text-xs sm:text-sm md:text-base font-bold text-white tracking-tight truncate">
                  App Store
                </div>
              </div>
            </button>

            {/* GET IT ON Google Play */}
            <button
              type="button"
              onClick={() => triggerInstall('google')}
              className="bg-white/15 hover:bg-white/25 active:bg-white/30 backdrop-blur-md text-white rounded-2xl p-2.5 sm:p-3.5 border border-white/20 flex items-center justify-center gap-2 sm:gap-3 transition-all duration-200 cursor-pointer active:scale-95 shadow-sm group min-w-0"
              aria-label="Google Play Store থেকে ডাউনলোড করুন"
            >
              {/* Google Play Multi-color Icon */}
              <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M3.61 2.22c-.36.38-.56.96-.56 1.71v16.14c0 .75.2 1.33.56 1.71l.09.08L12.87 12.7v-.23L3.7 3.3l-.09-.08z"/>
                <path fill="#FBBC04" d="M15.93 15.77l-3.06-3.07v-.23l3.06-3.07.07.04 3.63 2.06c1.04.59 1.04 1.55 0 2.14l-3.63 2.09-.07.04z"/>
                <path fill="#EA4335" d="M15.93 15.77L12.87 12.7 3.61 21.86c.35.37.93.42 1.6.04l10.72-6.13"/>
                <path fill="#34A853" d="M15.93 8.23L5.21 2.1c-.67-.38-1.25-.33-1.6.04l9.26 9.16 3.06-3.07"/>
              </svg>
              <div className="text-left leading-tight min-w-0">
                <div className="text-[9px] sm:text-[10px] text-white/80 font-semibold uppercase tracking-wider truncate">
                  GET IT ON
                </div>
                <div className="text-xs sm:text-sm md:text-base font-bold text-white tracking-tight truncate">
                  Google Play
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl text-slate-800 animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white font-black flex items-center justify-center text-sm shadow-xs">
                  পু
                </div>
                <span className="font-bold text-sm text-slate-800">আইফোনে ইনস্টল করার নিয়ম</span>
              </div>
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-xs">১</span>
                <p>সাফারি ব্রাউজারের নিচে থাকা <strong>Share (শেয়ার)</strong> বাটনে চাপ দিন।</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-xs">২</span>
                <p>মেনু থেকে নিচে স্ক্রল করে <strong>"Add to Home Screen"</strong> (হোম স্ক্রিনে যোগ করুন) চাপ দিন।</p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition active:scale-98 cursor-pointer"
            >
              ঠিক আছে, বুঝতে পেরেছি
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default AppDownloadBanner;
