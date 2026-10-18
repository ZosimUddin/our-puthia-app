import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { requestAndSaveFcmToken } from '../../services/fcmTokenService';

export const NotificationPermissionModal: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if browser supports Notifications
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    // 2. If permission already granted or explicitly denied, do not show
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      return;
    }

    // 3. Check if user already granted or dismissed recently
    try {
      const promptStatus = localStorage.getItem('notification_prompt_status');
      if (promptStatus === 'granted' || promptStatus === 'denied') {
        return;
      }

      const dismissedUntilStr = localStorage.getItem('notification_prompt_dismissed_until');
      if (dismissedUntilStr) {
        const dismissedUntil = parseInt(dismissedUntilStr, 10);
        if (dismissedUntil && dismissedUntil > Date.now()) {
          return;
        }
      }
    } catch (e) {
      // localStorage error fallback
    }

    // 4. Show modal after short delay (1.5 seconds) for pristine UX
    const timer = setTimeout(() => {
      if (Notification.permission === 'default') {
        setIsOpen(true);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    setIsSubmitting(true);
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          try {
            localStorage.setItem('notification_prompt_status', 'granted');
          } catch {}
          
          // Register FCM push token in background
          requestAndSaveFcmToken(user?.uid).catch((err) => {
            console.warn('[NotificationModal] FCM registration note:', err);
          });
          
          setIsOpen(false);
          return;
        } else {
          try {
            localStorage.setItem('notification_prompt_status', 'denied');
          } catch {}
          setIsOpen(false);
          return;
        }
      }
    } catch (err) {
      console.error('[NotificationModal] Request permission error:', err);
    } finally {
      setIsSubmitting(false);
      setIsOpen(false);
    }
  };

  const handleLater = () => {
    try {
      // Dismiss for 24 hours
      const nextPrompt = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('notification_prompt_dismissed_until', nextPrompt.toString());
    } catch {}
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[99998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-modal-title"
    >
      {/* Modal Card matching Screenshot_20261004_194415.jpg */}
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl relative border border-slate-100 text-center animate-in zoom-in-95 duration-200">
        {/* Top Right Close Button */}
        <button
          type="button"
          onClick={handleLater}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Big Bell Icon in Emerald Circle */}
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
          <Bell className="w-9 h-9 text-emerald-600" strokeWidth={1.8} />
        </div>

        {/* Title */}
        <h3 
          id="notification-modal-title"
          className="text-lg sm:text-xl font-bold text-slate-900 flex items-center justify-center gap-1.5 mb-2"
        >
          <span>🔔 নোটিফিকেশন চালু করুন</span>
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal px-2 mb-6">
          গুরুত্বপূর্ণ আপডেট পেতে নোটিফিকেশন চালু করুন। নতুন খবর, নোটিশ ও জরুরি তথ্য সরাসরি আপনার ফোনে পাবেন।
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            type="button"
            onClick={handleLater}
            disabled={isSubmitting}
            className="py-3 px-4 rounded-2xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition cursor-pointer active:scale-98 disabled:opacity-50"
          >
            পরে
          </button>
          <button
            type="button"
            onClick={handleEnable}
            disabled={isSubmitting}
            className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? 'চালু হচ্ছে...' : 'হ্যাঁ, চালু করুন'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionModal;
