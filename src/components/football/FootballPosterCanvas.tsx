import React, { useRef, useState } from 'react';
import { FootballPosterConfig, PosterTemplateSize } from '../../types/football';
import { Calendar, Clock, MapPin, Trophy, Shield, Sparkles, Download, Share2, Check, Copy } from 'lucide-react';
import html2canvas from 'html2canvas-pro';

interface FootballPosterCanvasProps {
  config: FootballPosterConfig;
  exportScale?: number;
  onExportSuccess?: (dataUrl: string) => void;
  showWatermark?: boolean;
}

export const FootballPosterCanvas: React.FC<FootballPosterCanvasProps> = ({
  config,
  onExportSuccess,
}) => {
  const posterRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Aspect ratio and container dimensions based on size
  const getDimensions = (size: PosterTemplateSize) => {
    switch (size) {
      case 'social_landscape':
        return { width: 1200, height: 630, aspectClass: 'aspect-[1200/630]' };
      case 'social_square':
        return { width: 1080, height: 1080, aspectClass: 'aspect-square' };
      case 'social_portrait':
        return { width: 1080, height: 1350, aspectClass: 'aspect-[1080/1350]' };
      case 'banner_16_9':
      default:
        return { width: 1920, height: 1080, aspectClass: 'aspect-video' };
    }
  };

  const dims = getDimensions(config.size);

  const handleDownload = async (format: 'png' | 'jpeg' = 'png') => {
    if (!posterRef.current || isExporting) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(posterRef.current, {
        scale: 2.5, // Ultra-high resolution 300DPI equivalent
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0284c7',
        logging: false
      });

      const dataUrl = canvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.95);
      
      const link = document.createElement('a');
      link.download = `match-poster-${(config.matchRibbonText || 'match').replace(/\s+/g, '_')}-${Date.now()}.${format === 'jpeg' ? 'jpg' : 'png'}`;
      link.href = dataUrl;
      link.click();

      if (onExportSuccess) {
        onExportSuccess(dataUrl);
      }
    } catch (err) {
      console.error('Failed to export poster canvas:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!posterRef.current || isExporting) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0284c7',
        logging: false
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `match-poster-${Date.now()}.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${config.mainTitleText} — ${config.teamAName} বনাম ${config.teamBName}`,
            text: `⚽ ${config.mainTitleText} এর ${config.matchRibbonText}: ${config.teamAName} বনাম ${config.teamBName} | তারিখ: ${config.dateText}, সময়: ${config.timeText}, ভেন্যু: ${config.venueText}`,
            files: [file]
          });
        } else {
          // Fallback to direct download
          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `match-poster-${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
        }
      });
    } catch (err) {
      console.warn('Share error fallback:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const showTrophies = config.showTrophies !== false;
  const showBallAndPlayer = config.showBallAndPlayer !== false;
  const showMotto = config.showMotto !== false;
  const vsStyle = config.vsStyle || 'fiery';

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Action Bar */}
      <div className="flex items-center justify-between w-full max-w-4xl px-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] sm:text-xs font-black text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            {config.size === 'banner_16_9' ? '16:9 ব্যানার' : config.size === 'social_landscape' ? '1200×630 ল্যান্ডস্কেপ' : config.size === 'social_square' ? '1:1 স্কয়ার' : '৪:৫ পোর্ট্রেট'}
          </span>
          <span className="hidden sm:inline-block text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            এইচডি কোয়ালিটি (300 DPI)
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleShare}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            title="সোশ্যাল মিডিয়ায় শেয়ার করুন"
          >
            <Share2 size={13} />
            <span className="hidden xs:inline">শেয়ার</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleDownload('png')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0B7A3B] hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            title="স্বচ্ছ ব্যাকগ্রাউন্ড ও ক্রিস্প টেক্সট সহ পিএনজি ডাউনলোড"
          >
            <Download size={13} />
            <span>{isExporting ? 'প্রসেসিং...' : 'PNG ডাউনলোড'}</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleDownload('jpeg')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            title="ফেসবুক ও হোয়াটসঅ্যাপে আপলোডের উপযোগী জেপিজি ডাউনলোড"
          >
            <Download size={13} />
            <span>JPG</span>
          </button>
        </div>
      </div>

      {/* The Printable / Downloadable Poster Canvas */}
      <div className="w-full max-w-4xl shadow-2xl rounded-2xl overflow-hidden border-2 border-slate-300 relative bg-slate-950">
        <div
          ref={posterRef}
          className={`relative w-full ${dims.aspectClass} overflow-hidden select-none flex flex-col justify-between`}
          style={{
            fontFamily: "'Hind Siliguri', 'Kalpurush', 'Noto Sans Bengali', -apple-system, sans-serif"
          }}
        >
          {/* ========================================================================= */}
          {/* 1. BACKGROUND LAYERS: SKY, FLOODLIGHTS, CROWD & LUSH GREEN STRIPED FIELD  */}
          {/* ========================================================================= */}

          {/* Deep blue stadium sky */}
          <div className="absolute inset-0 bg-linear-to-b from-[#0284c7] via-[#0369a1] to-[#064e3b] pointer-events-none" />

          {/* Stadium stadium glow & radial flares */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-45"
            style={{
              backgroundImage: 'radial-gradient(ellipse at 50% 15%, rgba(255,255,255,0.7) 0%, rgba(56,189,248,0.2) 40%, transparent 70%)'
            }}
          />

          {/* Top Left Floodlight Tower (4x4 matrix fixture with glowing beam cones) */}
          <div className="absolute top-1 left-2 sm:top-3 sm:left-5 flex flex-col items-center pointer-events-none z-10 opacity-95">
            <div className="grid grid-cols-4 gap-0.5 sm:gap-1 p-1 sm:p-1.5 bg-slate-900/90 rounded-md border-2 border-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.8)]">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
              ))}
            </div>
            {/* Projecting floodlight beam angle */}
            <div 
              className="w-40 h-72 sm:w-80 sm:h-96 -mt-2 -rotate-25 opacity-40 bg-linear-to-b from-white/90 via-sky-200/25 to-transparent blur-md"
              style={{ clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)' }}
            />
          </div>

          {/* Top Right Floodlight Tower (4x4 matrix fixture with glowing beam cones) */}
          <div className="absolute top-1 right-2 sm:top-3 sm:right-5 flex flex-col items-center pointer-events-none z-10 opacity-95">
            <div className="grid grid-cols-4 gap-0.5 sm:gap-1 p-1 sm:p-1.5 bg-slate-900/90 rounded-md border-2 border-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.8)]">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
              ))}
            </div>
            {/* Projecting floodlight beam angle */}
            <div 
              className="w-40 h-72 sm:w-80 sm:h-96 -mt-2 rotate-25 opacity-40 bg-linear-to-b from-white/90 via-sky-200/25 to-transparent blur-md"
              style={{ clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)' }}
            />
          </div>

          {/* Lush Green Football Grass Field (Bottom Half) with lawn mower striping */}
          <div className="absolute bottom-0 inset-x-0 h-[44%] sm:h-[48%] pointer-events-none z-0 overflow-hidden">
            <div 
              className="w-full h-full bg-linear-to-t from-[#15803d] via-[#16a34a] to-[#22c55e]"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, #15803d 0px, #15803d 32px, #16a34a 32px, #16a34a 64px)'
              }}
            />
            {/* Grass horizon gradient separation */}
            <div className="absolute top-0 inset-x-0 h-6 bg-linear-to-b from-slate-950/40 via-emerald-950/20 to-transparent" />
            
            {/* Field Boundary Lines */}
            <div className="absolute top-3 inset-x-4 h-0.5 bg-white/40 shadow-xs" />

            {/* Stadium Crowd Silhouettes along base */}
            <div className="absolute bottom-0 inset-x-0 h-10 sm:h-16 flex items-end justify-between opacity-35 px-2">
              <svg className="w-full h-full fill-emerald-950" viewBox="0 0 1200 80" preserveAspectRatio="none">
                <path d="M0,80 L0,50 Q40,30 80,45 Q120,60 160,35 Q200,20 240,40 Q280,60 320,30 Q360,15 400,35 Q440,55 480,25 Q520,10 560,40 Q600,60 640,30 Q680,15 720,40 Q760,55 800,25 Q840,10 880,35 Q920,55 960,30 Q1000,15 1040,40 Q1080,60 1120,35 Q1160,20 1200,45 L1200,80 Z" />
              </svg>
            </div>
          </div>

          {/* Flying Spinning Football with Comet Flames Trail (Top Left) */}
          {showBallAndPlayer && (
            <div className="absolute top-10 left-2 sm:top-14 sm:left-7 z-20 pointer-events-none transform -rotate-12 scale-90 sm:scale-100">
              <div className="relative flex items-center">
                {/* Comet flame & motion lines */}
                <div 
                  className="w-16 sm:w-28 h-8 sm:h-12 -mr-4 sm:-mr-6 opacity-90 blur-[1px]"
                  style={{
                    background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.5) 40%, rgba(239,68,68,0.8) 70%, #ffffff 100%)',
                    clipPath: 'polygon(0% 40%, 100% 0%, 85% 50%, 100% 100%, 0% 60%)'
                  }}
                />
                {/* Football with classic pentagonal patches */}
                <div className="w-11 h-11 sm:w-16 sm:h-16 rounded-full bg-white border-2 border-slate-900 shadow-2xl relative overflow-hidden flex items-center justify-center">
                  <div className="w-4 h-4 sm:w-6 sm:h-6 bg-slate-900 rounded-xs transform rotate-45" />
                  <div className="absolute -top-1 w-3 h-3 sm:w-4 sm:h-4 bg-slate-900 rounded-xs" />
                  <div className="absolute -bottom-1 w-3 h-3 sm:w-4 sm:h-4 bg-slate-900 rounded-xs" />
                  <div className="absolute -left-1 w-3 h-3 sm:w-4 sm:h-4 bg-slate-900 rounded-xs" />
                  <div className="absolute -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-slate-900 rounded-xs" />
                </div>
              </div>
            </div>
          )}

          {/* Football Player Striking Silhouette with Rainbow Motion Swooshes (Top Right) */}
          {showBallAndPlayer && (
            <div className="absolute top-8 right-2 sm:top-12 sm:right-7 z-20 pointer-events-none scale-90 sm:scale-100">
              <div className="relative flex items-center justify-center">
                {/* Dynamic multi-colored motion trail swoosh */}
                <div 
                  className="absolute -bottom-2 -left-6 w-24 sm:w-36 h-7 sm:h-10 opacity-85 -rotate-12 blur-[1px]"
                  style={{
                    background: 'linear-gradient(to right, #0ea5e9, #eab308, #ef4444)',
                    clipPath: 'polygon(0% 60%, 100% 0%, 95% 70%, 100% 100%, 0% 90%)'
                  }}
                />
                {/* Small kicked ball */}
                <div className="absolute -bottom-1 -left-2 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white border border-slate-900 shadow-md flex items-center justify-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slate-900 rotate-45" />
                </div>
                {/* Footballer striker silhouette */}
                <svg className="w-14 h-14 sm:w-22 sm:h-22 fill-slate-950 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]" viewBox="0 0 24 24">
                  <path d="M14.5 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-4.3 6.2-2.8 1.6 1.4 3 2.1-1.2.9 3.5 3.3-1.9-.8-3.1 2.2-1.3-.9-1.9-5.4 1.3zm1.1 9.8-3.2 2-1.1-2.4 2.5-1.5-.7-2.6 3.1 1.8-.6 2.7zm5.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                </svg>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. TOP HEADER SECTION: MOTTO & MULTI-LAYER 3D ARCHED TOURNAMENT RIBBONS   */}
          {/* ========================================================================= */}
          <div className="relative z-30 pt-2 sm:pt-3 px-3 text-center flex flex-col items-center">
            {/* Top Quote / Motto */}
            {showMotto && (
              <p className="text-white text-[9.5px] sm:text-xs md:text-sm font-black tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] mb-0.5 sm:mb-1">
                {config.mottoText || '“খেলাধুলা সুস্থ দেহ, সুন্দর মন, গড়ে তোলে আগামীর স্বপ্ন”'}
              </p>
            )}

            {/* Arched Yellow Ribbon: আদর্শ ও ঐতিহ্যবাহী */}
            <div className="inline-block relative px-5 sm:px-10 py-0.5 rounded-full bg-linear-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs sm:text-base md:text-xl shadow-[0_4px_12px_rgba(0,0,0,0.4)] border-2 border-yellow-100 transform -rotate-1">
              <span className="drop-shadow-xs tracking-tight">{config.curvedHeaderBanner || 'আদর্শ ও ঐতিহ্যবাহী'}</span>
            </div>

            {/* Main Title 3D Red Banner: প্রাইজ মানি ফুটবল টুর্নামেন্ট */}
            <div className="relative my-0.5 sm:my-1 w-11/12 sm:w-4/5 max-w-2xl">
              {/* Ribbon folded swallowtails */}
              <div className="absolute -left-3 sm:-left-5 top-2 sm:top-3 w-6 sm:w-10 h-6 sm:h-10 bg-red-900 -z-10 transform -rotate-12" style={{ clipPath: 'polygon(100% 0, 0 50%, 100% 100%)' }} />
              <div className="absolute -right-3 sm:-right-5 top-2 sm:top-3 w-6 sm:w-10 h-6 sm:h-10 bg-red-900 -z-10 transform rotate-12" style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />

              <div className="py-1 sm:py-2 px-3 sm:px-6 bg-linear-to-r from-[#b91c1c] via-[#dc2626] to-[#b91c1c] text-white font-black text-base sm:text-2xl md:text-4xl rounded-xl sm:rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.6)] border-2 sm:border-3 border-white/90 tracking-wide uppercase drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">{config.mainTitleText || 'প্রাইজ মানি ফুটবল টুর্নামেন্ট'}</span>
              </div>
            </div>

            {/* Subtitle Green Brush Banner: মহিপাড়া ২০২৬ এর */}
            <div className="inline-flex items-center gap-1.5 px-4 sm:px-8 py-0.5 bg-linear-to-r from-[#14532d] via-[#16a34a] to-[#14532d] text-yellow-300 font-black text-xs sm:text-lg md:text-xl rounded-full border border-yellow-300 shadow-md">
              <span>{config.subTitleText || 'মহিপাড়া ২০২৬'}</span>
              <span className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-red-600 text-white font-black text-[9px] sm:text-xs flex items-center justify-center border border-white">
                এর
              </span>
            </div>

            {/* Match Number Ribbon: দ্বিতীয় ম্যাচ */}
            <div className="relative mt-1 sm:mt-1.5">
              <div className="px-5 sm:px-10 py-0.5 sm:py-1 bg-linear-to-r from-red-700 via-rose-600 to-red-700 text-white font-black text-xs sm:text-base md:text-lg rounded-xl border border-red-300 shadow-lg">
                <span className="drop-shadow-sm">{config.matchRibbonText || 'দ্বিতীয় ম্যাচ'}</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. CENTER SECTION: TEAM A VS TEAM B (SHIELDS, BRUSH RIBBONS & FIERY VS)  */}
          {/* ========================================================================= */}
          <div className="relative z-30 px-2 sm:px-6 my-auto flex items-center justify-between gap-1 sm:gap-4 max-w-4xl mx-auto w-full">
            {/* Team A (Home Team - Blue Brush Badge) */}
            <div className="flex-1 flex flex-col items-center text-center">
              <div className="flex items-center gap-1.5 sm:gap-3 bg-linear-to-r from-blue-950 via-blue-900 to-blue-800 p-2 sm:p-3 rounded-2xl border-2 border-blue-400 shadow-[0_8px_25px_rgba(30,58,138,0.7)] w-full max-w-[240px] sm:max-w-xs transition-transform hover:scale-102">
                {/* Team A Crest Logo / Shield */}
                <div className="w-11 h-11 sm:w-16 sm:h-16 shrink-0 rounded-xl bg-linear-to-br from-blue-600 via-indigo-900 to-slate-950 p-1 flex items-center justify-center border-2 border-yellow-300 shadow-md overflow-hidden">
                  {config.teamALogoUrl ? (
                    <img src={config.teamALogoUrl} alt={config.teamAName} className="w-full h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-white">
                      <Shield size={24} className="text-yellow-400 fill-blue-600" />
                      <span className="text-[7px] font-black uppercase tracking-tighter">টিম এ</span>
                    </div>
                  )}
                </div>
                {/* Team Name and Location */}
                <div className="min-w-0 text-left">
                  <h4 className="text-white font-black text-xs sm:text-base leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-2">
                    {config.teamAName || 'নিউ ঈগল ফুটবল একাডেমি'}
                  </h4>
                  {config.teamALocation && (
                    <p className="text-yellow-300 text-[9.5px] sm:text-xs font-black leading-tight mt-0.5">
                      {config.teamALocation}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Central Fiery "VS" Emblem */}
            <div className="shrink-0 relative mx-1 sm:mx-3 flex items-center justify-center z-40">
              {vsStyle === 'fiery' ? (
                /* Fiery Flame & Lightning VS (Exact Match to Poster) */
                <div className="relative">
                  {/* Outer flame sparks & burst rays */}
                  <div className="w-12 h-12 sm:w-20 sm:h-20 bg-linear-to-tr from-amber-500 via-orange-600 to-red-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.9)] border-2 sm:border-4 border-yellow-300">
                    <span className="text-white font-black text-xl sm:text-4xl italic tracking-tighter drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)] transform -skew-x-12">
                      VS
                    </span>
                  </div>
                  {/* Lightning sparks top right & bottom left */}
                  <Sparkles size={16} className="absolute -top-1.5 -right-1 text-yellow-300 animate-pulse" />
                  <Sparkles size={14} className="absolute -bottom-1 -left-1 text-amber-300" />
                </div>
              ) : vsStyle === 'neon' ? (
                /* Electric Neon Thunder VS */
                <div className="w-12 h-12 sm:w-20 sm:h-20 bg-linear-to-tr from-cyan-600 via-fuchsia-600 to-indigo-900 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.9)] border-2 sm:border-4 border-cyan-300 rotate-3">
                  <span className="text-white font-black text-xl sm:text-4xl italic tracking-tighter drop-shadow-md">
                    VS
                  </span>
                </div>
              ) : (
                /* Royal Golden Metallic VS */
                <div className="w-12 h-12 sm:w-20 sm:h-20 bg-linear-to-tr from-yellow-600 via-amber-400 to-yellow-200 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.9)] border-2 sm:border-4 border-white">
                  <span className="text-slate-950 font-black text-xl sm:text-4xl italic tracking-tighter drop-shadow-md">
                    VS
                  </span>
                </div>
              )}
            </div>

            {/* Team B (Away Team - Red/Green Brush Badge) */}
            <div className="flex-1 flex flex-col items-center text-center">
              <div className="flex items-center gap-1.5 sm:gap-3 bg-linear-to-r from-red-950 via-rose-900 to-red-800 p-2 sm:p-3 rounded-2xl border-2 border-red-400 shadow-[0_8px_25px_rgba(159,18,57,0.7)] w-full max-w-[240px] sm:max-w-xs transition-transform hover:scale-102">
                {/* Team B Crest Logo / Shield */}
                <div className="w-11 h-11 sm:w-16 sm:h-16 shrink-0 rounded-xl bg-linear-to-br from-emerald-700 via-emerald-950 to-slate-950 p-1 flex items-center justify-center border-2 border-emerald-300 shadow-md overflow-hidden">
                  {config.teamBLogoUrl ? (
                    <img src={config.teamBLogoUrl} alt={config.teamBName} className="w-full h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-white">
                      <Shield size={24} className="text-yellow-400 fill-emerald-600" />
                      <span className="text-[7px] font-black uppercase tracking-tighter">টিম বি</span>
                    </div>
                  )}
                </div>
                {/* Team Name and Location */}
                <div className="min-w-0 text-left">
                  <h4 className="text-white font-black text-xs sm:text-base leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-2">
                    {config.teamBName || 'কিশোর কেলি ফুটবল একাডেমি'}
                  </h4>
                  {config.teamBLocation && (
                    <p className="text-yellow-300 text-[9.5px] sm:text-xs font-black leading-tight mt-0.5">
                      {config.teamBLocation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. DUAL CHAMPIONSHIP TROPHIES (LEFT & RIGHT FLANKS ON PEDESTAL)            */}
          {/* ========================================================================= */}
          {showTrophies && (
            <>
              {/* Left Trophy */}
              <div className="absolute bottom-8 left-1 sm:bottom-12 sm:left-4 z-20 pointer-events-none flex flex-col items-center opacity-95">
                <div className="w-12 h-16 sm:w-20 sm:h-28 text-yellow-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center">
                  <Trophy size={48} className="text-yellow-300 fill-yellow-400" />
                  {/* Trophy wooden pedestal */}
                  <div className="w-10 sm:w-16 h-2 sm:h-3.5 bg-linear-to-r from-amber-950 via-yellow-900 to-amber-950 rounded-xs border border-yellow-300 mt-1 shadow-md" />
                </div>
              </div>

              {/* Right Trophy */}
              <div className="absolute bottom-8 right-1 sm:bottom-12 sm:right-4 z-20 pointer-events-none flex flex-col items-center opacity-95">
                <div className="w-12 h-16 sm:w-20 sm:h-28 text-yellow-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center">
                  <Trophy size={48} className="text-yellow-300 fill-yellow-400" />
                  {/* Trophy wooden pedestal */}
                  <div className="w-10 sm:w-16 h-2 sm:h-3.5 bg-linear-to-r from-amber-950 via-yellow-900 to-amber-950 rounded-xs border border-yellow-300 mt-1 shadow-md" />
                </div>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* 5. MATCH INFO BAR: 3 DISTINCT 3D PILL BADGES (DATE, TIME, DAY)            */}
          {/* ========================================================================= */}
          <div className="relative z-30 px-3 mb-1.5 max-w-xl mx-auto w-full">
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
              {/* Date Badge (Red Pill) */}
              <div className="bg-linear-to-r from-red-600 to-rose-700 text-white p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border-2 border-red-300 shadow-[0_4px_10px_rgba(0,0,0,0.4)] flex items-center justify-center gap-1 sm:gap-2">
                <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Calendar size={13} className="text-yellow-300" />
                </div>
                <div className="text-left leading-tight">
                  <span className="block text-[8px] sm:text-[9.5px] text-red-100 font-bold">তারিখ:</span>
                  <span className="font-black text-[9.5px] sm:text-xs md:text-sm tracking-tight">{config.dateText || '২২/১০/২০২৬'}</span>
                </div>
              </div>

              {/* Time Badge (Teal/Emerald Circle-Pill) */}
              <div className="bg-linear-to-r from-teal-700 to-emerald-800 text-white p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border-2 border-emerald-300 shadow-[0_4px_10px_rgba(0,0,0,0.4)] flex items-center justify-center gap-1 sm:gap-2">
                <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Clock size={13} className="text-yellow-300" />
                </div>
                <div className="text-left leading-tight">
                  <span className="block text-[8px] sm:text-[9.5px] text-emerald-100 font-bold">সময়:</span>
                  <span className="font-black text-[9.5px] sm:text-xs md:text-sm tracking-tight">{config.timeText || '৩ ঘটিকা'}</span>
                </div>
              </div>

              {/* Day Badge (Purple Pill) */}
              <div className="bg-linear-to-r from-purple-700 to-indigo-800 text-white p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border-2 border-purple-300 shadow-[0_4px_10px_rgba(0,0,0,0.4)] flex items-center justify-center gap-1 sm:gap-2">
                <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Calendar size={13} className="text-yellow-300" />
                </div>
                <div className="text-left leading-tight">
                  <span className="block text-[8px] sm:text-[9.5px] text-purple-100 font-bold">রোজ:</span>
                  <span className="font-black text-[9.5px] sm:text-xs md:text-sm tracking-tight">{config.dayText || 'বৃহস্পতিবার'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 6. BOTTOM VENUE BANNER: 3D MAP PIN & GREEN BRUSH STROKE                   */}
          {/* ========================================================================= */}
          <div className="relative z-30 pb-2 px-3 text-center">
            <div className="inline-flex items-center gap-2 px-4 sm:px-8 py-1 sm:py-1.5 bg-linear-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white rounded-2xl border-2 border-emerald-400 shadow-2xl max-w-lg">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-600 flex items-center justify-center shrink-0 border border-white shadow-md">
                <MapPin size={14} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-yellow-300 font-black text-[10px] sm:text-xs md:text-sm leading-tight">
                  ভেন্যু: {config.venueText || 'মহিপাড়া উচ্চ বিদ্যালয় মাঠ'}
                </p>
                {config.venueSubText && (
                  <p className="text-emerald-100 text-[8.5px] sm:text-[10px] font-bold leading-tight">
                    {config.venueSubText}
                  </p>
                )}
              </div>
            </div>

            {/* Organizer Footer Note */}
            {config.organizerText && (
              <p className="text-white/90 text-[8px] sm:text-[10px] font-bold mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                {config.organizerText}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
