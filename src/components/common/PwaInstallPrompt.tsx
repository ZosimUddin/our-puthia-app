import React, { useState, useEffect } from 'react';
import { X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      localStorage.getItem('pwa_installed') === 'true';

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Check if dismissed during this session
    const isDismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';
    if (isDismissed) {
      return;
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // 4. Listen for Chrome/Chromium beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      localStorage.setItem('pwa_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Display banner after small delay so user sees it at top
    const timer = setTimeout(() => {
      if (!isStandalone && !isDismissed) {
        setIsVisible(true);
      }
    }, 800);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setIsVisible(false);
          localStorage.setItem('pwa_installed', 'true');
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error triggering PWA install:', err);
      }
      return;
    }

    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    // Fallback for browsers where prompt wasn't captured directly
    setShowGuideModal(true);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (!isVisible || isInstalled) return null;

  const domainName =
    typeof window !== 'undefined' && window.location.hostname
      ? window.location.hostname
      : 'our-puthia-app.vercel.app';

  return (
    <>
      {/* Top Floating PWA Install Banner matching Screenshot_20261004_194401.jpg */}
      <div 
        role="banner"
        aria-label="Install App"
        className="fixed top-2.5 left-2.5 right-2.5 max-w-md mx-auto z-[99999] bg-white rounded-2xl shadow-[0_6px_28px_rgba(0,0,0,0.14)] border border-slate-100 p-2.5 sm:p-3 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-300 select-none"
      >
        {/* Left Side: App Icon */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 flex items-center justify-center shrink-0 shadow-xs relative overflow-hidden border border-emerald-600/30">
            <img 
              src="/pwa-192x192.png" 
              alt="Our Puthia" 
              className="w-full h-full object-cover" 
              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-white">
              <span className="font-extrabold text-base leading-none">পু</span>
              <span className="text-[7px] font-bold tracking-tighter opacity-80 leading-none mt-0.5">Puthia</span>
            </div>
          </div>

          {/* Middle: Title & Domain */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate leading-tight tracking-tight">
              Install Our Puthia
            </div>
            <div className="text-xs text-slate-500 truncate leading-tight mt-0.5 font-normal">
              {domainName}
            </div>
          </div>
        </div>

        {/* Right Side: Install Button & Close Icon */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="text-emerald-700 hover:text-emerald-800 font-bold text-sm px-3.5 py-1.5 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer active:scale-95"
          >
            Install
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X size={16} />
          </button>
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

      {/* General Manual Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl text-slate-800 animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white font-black flex items-center justify-center text-sm shadow-xs">
                  পু
                </div>
                <span className="font-bold text-sm text-slate-800">অ্যাপ ইনস্টল করার নিয়ম</span>
              </div>
              <button 
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center shrink-0 text-xs">১</span>
                <p>আপনার ব্রাউজারের ওপরের ডানপাশের <strong>তিনটি ডট (⋮)</strong> মেনু চাপ দিন।</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center shrink-0 text-xs">২</span>
                <p>মেনু থেকে <strong>"Install app"</strong> অথবা <strong>"Add to Home Screen"</strong> নির্বাচন করুন।</p>
              </div>
            </div>
            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition active:scale-98 cursor-pointer"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PwaInstallPrompt;
