import React, { useState, useEffect } from 'react';
import { ExternalLink, Users, Leaf } from 'lucide-react';
import { FooterSettings, DEFAULT_FOOTER_SETTINGS } from '../../types';
import { subscribeFooterSettings } from '../../services/footerSettingsService';

interface FooterSectionProps {
  settings?: FooterSettings;
  className?: string;
  isPreview?: boolean;
}

export const FooterSection: React.FC<FooterSectionProps> = ({
  settings: propSettings,
  className = '',
  isPreview = false
}) => {
  const [liveSettings, setLiveSettings] = useState<FooterSettings>(
    propSettings || DEFAULT_FOOTER_SETTINGS
  );

  useEffect(() => {
    if (propSettings) {
      setLiveSettings(propSettings);
      return;
    }

    const unsubscribe = subscribeFooterSettings((newSettings) => {
      setLiveSettings(newSettings);
    });

    return () => unsubscribe();
  }, [propSettings]);

  const config = propSettings || liveSettings;

  // Render social button helper
  const renderSocialButton = (type: 'facebook_page' | 'facebook_group') => {
    if (type === 'facebook_page') {
      if (!config.facebookPageEnabled) return null;
      return (
        <a
          key="facebook_page"
          href={config.facebookPageUrl || 'https://facebook.com'}
          target={isPreview ? undefined : "_blank"}
          rel="noopener noreferrer"
          onClick={isPreview ? (e) => e.preventDefault() : undefined}
          className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-blue-50/70 hover:bg-blue-100/90 border border-blue-100/80 transition-all duration-200 group no-underline"
        >
          <div className="w-8 h-8 rounded-xl bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-black text-slate-900 group-hover:text-blue-700 block truncate">
              {config.facebookPageName || "ফেসবুক পেজ"}
            </span>
            <span className="text-[10px] font-bold text-slate-500 block truncate mt-0.5">
              {config.facebookPageSubtitle || "অফিসিয়াল আপডেট"}
            </span>
          </div>
          <ExternalLink size={13} className="text-blue-400 group-hover:text-blue-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </a>
      );
    }

    if (type === 'facebook_group') {
      if (!config.facebookGroupEnabled) return null;
      return (
        <a
          key="facebook_group"
          href={config.facebookGroupUrl || 'https://facebook.com/groups'}
          target={isPreview ? undefined : "_blank"}
          rel="noopener noreferrer"
          onClick={isPreview ? (e) => e.preventDefault() : undefined}
          className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/90 border border-indigo-100/80 transition-all duration-200 group no-underline"
        >
          <div className="w-8 h-8 rounded-xl bg-[#4267B2] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Users size={16} strokeWidth={2.3} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-black text-slate-900 group-hover:text-indigo-700 block truncate">
              {config.facebookGroupName || "ফেসবুক গ্রুপ"}
            </span>
            <span className="text-[10px] font-bold text-slate-500 block truncate mt-0.5">
              {config.facebookGroupSubtitle || "পাবলিক আলোচনা"}
            </span>
          </div>
          <ExternalLink size={13} className="text-indigo-400 group-hover:text-indigo-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </a>
      );
    }

    return null;
  };

  // Determine order of buttons
  const order = config.socialOrder || ['facebook_page', 'facebook_group'];
  const hasAtLeastOneSocialLink = 
    (config.facebookPageEnabled && !!config.facebookPageUrl) || 
    (config.facebookGroupEnabled && !!config.facebookGroupUrl);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* SOCIAL CONNECT SECTION REMOVED FROM FOOTER AS REQUESTED */}

      {/* FOOTER SECTION */}
      <div className="pt-4 pb-0 text-center rounded-3xl bg-white border border-slate-100 space-y-1 relative overflow-hidden shadow-2xs">
        <div className="w-7 h-7 rounded-full bg-emerald-50 text-[#0B7A3B] flex items-center justify-center mx-auto mb-1">
          <Leaf size={16} />
        </div>
        <p className="text-[11px] font-bold text-slate-500 tracking-tight px-2">
          © {config.copyrightYear || "২০২৬"} {config.siteName || "আমাদের পুঠিয়া"} {config.copyrightText || "সর্বস্বত্ব সংরক্ষিত"}
        </p>
        <p className="text-xs font-black text-slate-900 uppercase tracking-wider">
          {config.authorName || "JOSIM UDDIN"}
        </p>
        <p className="text-xs font-bold text-slate-600 flex items-center justify-center gap-1 pt-0.5">
          <span>{config.taglineText || "ভালোবাসি পুঠিয়া"}</span>
          <span className="text-red-500 inline-block">{config.taglineEmoji || "❤️"}</span>
        </p>

        {/* Bottom Bangladesh / Puthia Flag Dual Wave Ribbon (#0B7A3B & #E11D2E) */}
        <div className="w-full h-4 relative overflow-hidden mt-3">
          <svg viewBox="0 0 340 24" className="w-full h-full object-cover" preserveAspectRatio="none">
            <path d="M0,4 C110,22 230,-4 340,16 L340,24 L0,24 Z" fill="#0B7A3B" />
            <path d="M0,12 C130,26 210,6 340,22 L340,24 L0,24 Z" fill="#E11D2E" opacity="0.95" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default FooterSection;
