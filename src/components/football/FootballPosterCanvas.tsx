import React, { useRef } from 'react';
import { FootballPosterConfig, PosterTemplateSize } from '../../types/football';
import { Calendar, Clock, MapPin, Trophy, Shield, Sparkles, Download, CheckCircle2 } from 'lucide-react';
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
  const [isExporting, setIsExporting] = React.useState(false);

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
        scale: 2, // High resolution for crystal clear print & social sharing
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#052e16',
        logging: false
      });

      const dataUrl = canvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.95);
      
      const link = document.createElement('a');
      link.download = `football-match-poster-${config.matchRibbonText || 'match'}-${Date.now()}.${format === 'jpeg' ? 'jpg' : 'png'}`;
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

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Action Bar */}
      <div className="flex items-center justify-between w-full max-w-4xl px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            সাইজ: {config.size === 'banner_16_9' ? '16:9 ব্যানার' : config.size === 'social_landscape' ? 'ল্যান্ডস্কেপ' : config.size === 'social_square' ? 'স্কয়ার পোস্ট' : 'পোর্ট্রেট'}
          </span>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            ভার্সন {config.version || 1}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleDownload('png')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0B7A3B] hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Download size={14} />
            <span>{isExporting ? 'প্রসেসিং...' : 'PNG ডাউনলোড'}</span>
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleDownload('jpeg')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Download size={14} />
            <span>JPG</span>
          </button>
        </div>
      </div>

      {/* The Printable / Downloadable Poster Canvas */}
      <div className="w-full max-w-4xl shadow-2xl rounded-2xl overflow-hidden border border-slate-300 relative bg-slate-950">
        <div
          ref={posterRef}
          className={`relative w-full ${dims.aspectClass} overflow-hidden select-none flex flex-col justify-between`}
          style={{
            fontFamily: "'Hind Siliguri', 'Kalpurush', 'Noto Sans Bengali', sans-serif"
          }}
        >
          {/* ========================================================= */}
          {/* 1. BACKGROUND LAYERS: STADIUM, FLOODLIGHTS & GRASS FIELD   */}
          {/* ========================================================= */}

          {/* Deep sky gradient with stadium lighting flare */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0284c7] via-[#0369a1] to-[#042f2e] pointer-events-none" />

          {/* Stadium stands crowd silhouette backdrop */}
          <div 
            className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.4) 0%, transparent 60%)'
            }}
          />

          {/* Stadium Floodlights (Top Left & Top Right) */}
          <div className="absolute top-2 left-3 sm:top-4 sm:left-6 flex flex-col items-center pointer-events-none z-10 opacity-90">
            {/* Floodlight fixture grid */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/90 rounded-md border border-sky-300 shadow-lg shadow-sky-400/50">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-white shadow-xs shadow-white animate-pulse" />
              ))}
            </div>
            {/* Light beam projection */}
            <div 
              className="w-32 h-64 sm:w-64 sm:h-96 -mt-2 -rotate-25 opacity-35 bg-gradient-to-b from-white/80 via-sky-200/20 to-transparent blur-md"
              style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)' }}
            />
          </div>

          <div className="absolute top-2 right-3 sm:top-4 sm:right-6 flex flex-col items-center pointer-events-none z-10 opacity-90">
            {/* Floodlight fixture grid */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/90 rounded-md border border-sky-300 shadow-lg shadow-sky-400/50">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-white shadow-xs shadow-white animate-pulse" />
              ))}
            </div>
            {/* Light beam projection */}
            <div 
              className="w-32 h-64 sm:w-64 sm:h-96 -mt-2 rotate-25 opacity-35 bg-gradient-to-b from-white/80 via-sky-200/20 to-transparent blur-md"
              style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)' }}
            />
          </div>

          {/* Lush green grass pitch with stripes at bottom */}
          <div className="absolute bottom-0 inset-x-0 h-2/5 sm:h-1/2 pointer-events-none z-0 overflow-hidden">
            <div 
              className="w-full h-full bg-gradient-to-t from-[#15803d] via-[#16a34a] to-[#22c55e]"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, rgba(21,128,61,0.95) 0px, rgba(21,128,61,0.95) 30px, rgba(22,163,74,0.95) 30px, rgba(22,163,74,0.95) 60px)'
              }}
            />
            {/* Grass texture line */}
            <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-black/20 to-transparent" />
            {/* Crowd celebration silhouettes along bottom base */}
            <div 
              className="absolute bottom-0 inset-x-0 h-8 sm:h-12 bg-repeat-x opacity-25"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
              }}
            />
          </div>

          {/* Flying football with motion comet trails (Top Left) */}
          <div className="absolute top-14 left-2 sm:top-20 sm:left-8 z-20 pointer-events-none transform -rotate-12">
            <div className="relative flex items-center">
              {/* Flame/Speed sparks trail */}
              <div className="w-12 sm:w-24 h-6 sm:h-12 bg-gradient-to-r from-transparent via-amber-400 to-white opacity-80 blur-xs -mr-3 sm:-mr-5" />
              {/* Soccer Ball Vector */}
              <div className="w-10 h-10 sm:w-18 sm:h-18 rounded-full bg-white border-2 border-slate-900 shadow-xl relative overflow-hidden flex items-center justify-center">
                <div className="w-4 h-4 sm:w-7 sm:h-7 bg-slate-900 rounded-sm transform rotate-45" />
                <div className="absolute top-0 w-2.5 h-2.5 sm:w-4 sm:h-4 bg-slate-900 rounded-sm" />
                <div className="absolute bottom-0 w-2.5 h-2.5 sm:w-4 sm:h-4 bg-slate-900 rounded-sm" />
                <div className="absolute left-0 w-2.5 h-2.5 sm:w-4 sm:h-4 bg-slate-900 rounded-sm" />
                <div className="absolute right-0 w-2.5 h-2.5 sm:w-4 sm:h-4 bg-slate-900 rounded-sm" />
              </div>
            </div>
          </div>

          {/* Football Player striking ball silhouette (Top Right) */}
          <div className="absolute top-10 right-3 sm:top-14 sm:right-10 z-20 pointer-events-none text-slate-900">
            <div className="relative">
              {/* Dynamic colorful swoosh */}
              <div className="absolute -bottom-2 -left-4 w-20 sm:w-32 h-6 sm:h-9 bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500 rounded-full blur-xs opacity-80 -rotate-15" />
              {/* Striker Silhouette SVG */}
              <svg className="w-14 h-14 sm:w-24 sm:h-24 fill-slate-950 drop-shadow-lg" viewBox="0 0 24 24">
                <path d="M14.5 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-4.3 6.2-2.8 1.6 1.4 3 2.1-1.2.9 3.5 3.3-1.9-.8-3.1 2.2-1.3-.9-1.9-5.4 1.3zm1.1 9.8-3.2 2-1.1-2.4 2.5-1.5-.7-2.6 3.1 1.8-.6 2.7zm5.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
              </svg>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. TOP HEADER SECTION: MOTTO & ARCHED TOURNAMENT TITLES   */}
          {/* ========================================================= */}
          <div className="relative z-30 pt-2 sm:pt-4 px-4 text-center flex flex-col items-center">
            {/* Motto */}
            <p className="text-white text-[10px] sm:text-xs md:text-sm font-bold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-1">
              {config.mottoText || '“খেলাধুলা সুস্থ দেহ, সুন্দর মন, গড়ে তোলে আগামীর স্বপ্ন”'}
            </p>

            {/* Top Arched Banner: আদর্শ ও ঐতিহ্যবাহী */}
            <div className="inline-block relative px-6 sm:px-12 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs sm:text-lg md:text-2xl shadow-lg border-2 border-yellow-200 transform -rotate-1">
              <span className="drop-shadow-xs">{config.curvedHeaderBanner || 'আদর্শ ও ঐতিহ্যবাহী'}</span>
            </div>

            {/* Main Title Ribbon: প্রাইজ মানি ফুটবল টুর্নামেন্ট */}
            <div className="relative my-1 sm:my-1.5 w-11/12 sm:w-4/5 max-w-2xl">
              <div className="py-1 sm:py-2 px-4 sm:px-8 bg-gradient-to-r from-[#dc2626] via-[#e11d2e] to-[#b91c1c] text-white font-black text-base sm:text-3xl md:text-4xl rounded-2xl sm:rounded-3xl shadow-2xl border-2 sm:border-4 border-white tracking-wide uppercase drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                {config.mainTitleText || 'প্রাইজ মানি ফুটবল টুর্নামেন্ট'}
              </div>
            </div>

            {/* Subtitle Ribbon: মহিপাড়া ২০২৬ এর */}
            <div className="inline-block px-5 sm:px-10 py-0.5 sm:py-1 bg-gradient-to-r from-[#15803d] via-[#16a34a] to-[#15803d] text-yellow-300 font-black text-xs sm:text-xl md:text-2xl rounded-full border border-yellow-400/80 shadow-md">
              <span>{config.subTitleText || 'মহিপাড়া ২০২৬ এর'}</span>
            </div>

            {/* Match Ribbon Banner: দ্বিতীয় ম্যাচ / ১ম ম্যাচ / ফাইনাল */}
            <div className="relative mt-1 sm:mt-2">
              <div className="relative px-6 sm:px-12 py-1 bg-gradient-to-r from-rose-700 via-rose-600 to-rose-700 text-white font-black text-xs sm:text-lg md:text-xl rounded-xl border border-rose-300 shadow-xl">
                <span className="drop-shadow-sm">{config.matchRibbonText || 'দ্বিতীয় ম্যাচ'}</span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. CENTER SECTION: TEAM A VS TEAM B MATCHUP               */}
          {/* ========================================================= */}
          <div className="relative z-30 px-3 sm:px-8 my-auto flex items-center justify-between gap-1 sm:gap-4 max-w-4xl mx-auto w-full">
            {/* Team A (Home Team - Blue theme) */}
            <div className="flex-1 flex flex-col items-center text-center">
              <div className="flex items-center gap-1 sm:gap-3 bg-gradient-to-r from-blue-900/90 via-blue-800/90 to-blue-900/90 p-2 sm:p-3 rounded-2xl border-2 border-blue-400 shadow-2xl w-full max-w-[260px] sm:max-w-xs">
                {/* Team A Crest Logo */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-950 p-1 flex items-center justify-center border-2 border-blue-300 shadow-md overflow-hidden">
                  {config.teamALogoUrl ? (
                    <img src={config.teamALogoUrl} alt={config.teamAName} className="w-full h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-white">
                      <Shield size={24} className="text-yellow-400" />
                      <span className="text-[8px] font-black uppercase">TEAM A</span>
                    </div>
                  )}
                </div>
                {/* Team Name and Location */}
                <div className="min-w-0 text-left">
                  <h4 className="text-white font-black text-xs sm:text-base leading-tight drop-shadow-sm line-clamp-2">
                    {config.teamAName || 'নিউ ঈগল ফুটবল একাডেমি'}
                  </h4>
                  {config.teamALocation && (
                    <p className="text-yellow-300 text-[10px] sm:text-xs font-bold leading-tight mt-0.5">
                      {config.teamALocation}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Central VS Emblem */}
            <div className="shrink-0 relative mx-1 sm:mx-3 flex items-center justify-center z-40">
              {/* Jagged comic explosion background */}
              <div className="w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 rounded-full flex items-center justify-center shadow-2xl border-2 sm:border-4 border-yellow-300 animate-pulse">
                <span className="text-white font-black text-lg sm:text-3xl italic tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] transform -skew-x-6">
                  VS
                </span>
              </div>
              {/* Lightning spikes around VS */}
              <div className="absolute -top-1 -right-1 text-yellow-300">
                <Sparkles size={16} />
              </div>
            </div>

            {/* Team B (Away Team - Red/Green theme) */}
            <div className="flex-1 flex flex-col items-center text-center">
              <div className="flex items-center gap-1 sm:gap-3 bg-gradient-to-r from-red-900/90 via-rose-800/90 to-red-900/90 p-2 sm:p-3 rounded-2xl border-2 border-red-400 shadow-2xl w-full max-w-[260px] sm:max-w-xs">
                {/* Team B Crest Logo */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-xl bg-gradient-to-br from-emerald-800 to-slate-950 p-1 flex items-center justify-center border-2 border-emerald-300 shadow-md overflow-hidden">
                  {config.teamBLogoUrl ? (
                    <img src={config.teamBLogoUrl} alt={config.teamBName} className="w-full h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-white">
                      <Shield size={24} className="text-yellow-400" />
                      <span className="text-[8px] font-black uppercase">TEAM B</span>
                    </div>
                  )}
                </div>
                {/* Team Name and Location */}
                <div className="min-w-0 text-left">
                  <h4 className="text-white font-black text-xs sm:text-base leading-tight drop-shadow-sm line-clamp-2">
                    {config.teamBName || 'কিশোর কেলি ফুটবল একাডেমি'}
                  </h4>
                  {config.teamBLocation && (
                    <p className="text-yellow-300 text-[10px] sm:text-xs font-bold leading-tight mt-0.5">
                      {config.teamBLocation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 4. TROPHIES (LEFT & RIGHT FLANKS)                         */}
          {/* ========================================================= */}
          <div className="absolute bottom-10 left-1 sm:bottom-14 sm:left-4 z-20 pointer-events-none flex flex-col items-center opacity-95">
            <div className="w-12 h-16 sm:w-20 sm:h-28 text-yellow-400 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center">
              <Trophy size={48} className="text-yellow-300 fill-yellow-400" />
              <div className="w-10 sm:w-14 h-2 sm:h-3 bg-amber-900 rounded-sm border border-yellow-200 mt-1 shadow-md" />
            </div>
          </div>

          <div className="absolute bottom-10 right-1 sm:bottom-14 sm:right-4 z-20 pointer-events-none flex flex-col items-center opacity-95">
            <div className="w-12 h-16 sm:w-20 sm:h-28 text-yellow-400 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center">
              <Trophy size={48} className="text-yellow-300 fill-yellow-400" />
              <div className="w-10 sm:w-14 h-2 sm:h-3 bg-amber-900 rounded-sm border border-yellow-200 mt-1 shadow-md" />
            </div>
          </div>

          {/* ========================================================= */}
          {/* 5. MATCH INFO BAR: DATE, TIME, DAY OF WEEK                */}
          {/* ========================================================= */}
          <div className="relative z-30 px-4 mb-2 max-w-xl mx-auto w-full">
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              {/* Date Badge (Red) */}
              <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-1 sm:p-2 rounded-xl sm:rounded-2xl border border-red-300 shadow-lg flex items-center justify-center gap-1 sm:gap-2">
                <Calendar size={14} className="text-yellow-300 shrink-0" />
                <div className="text-center leading-tight">
                  <span className="block text-[8px] sm:text-[10px] text-red-100 font-bold">তারিখ:</span>
                  <span className="font-black text-[10px] sm:text-xs md:text-sm">{config.dateText || '২২/১০/২০২৬'}</span>
                </div>
              </div>

              {/* Time Badge (Teal/Green) */}
              <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-1 sm:p-2 rounded-xl sm:rounded-2xl border border-emerald-300 shadow-lg flex items-center justify-center gap-1 sm:gap-2">
                <Clock size={14} className="text-yellow-300 shrink-0" />
                <div className="text-center leading-tight">
                  <span className="block text-[8px] sm:text-[10px] text-emerald-100 font-bold">সময়:</span>
                  <span className="font-black text-[10px] sm:text-xs md:text-sm">{config.timeText || '৩ ঘটিকা'}</span>
                </div>
              </div>

              {/* Day Badge (Purple) */}
              <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-1 sm:p-2 rounded-xl sm:rounded-2xl border border-purple-300 shadow-lg flex items-center justify-center gap-1 sm:gap-2">
                <Calendar size={14} className="text-yellow-300 shrink-0" />
                <div className="text-center leading-tight">
                  <span className="block text-[8px] sm:text-[10px] text-purple-100 font-bold">রোজ:</span>
                  <span className="font-black text-[10px] sm:text-xs md:text-sm">{config.dayText || 'বৃহস্পতিবার'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 6. BOTTOM VENUE SECTION: MAP PIN & STADIUM ADDRESS        */}
          {/* ========================================================= */}
          <div className="relative z-30 pb-2 sm:pb-3 px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 sm:px-8 py-1 sm:py-1.5 bg-gradient-to-r from-emerald-950/90 via-emerald-900/90 to-emerald-950/90 text-white rounded-2xl border border-emerald-400/80 shadow-2xl max-w-lg">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-600 flex items-center justify-center shrink-0 border border-white shadow-md">
                <MapPin size={14} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-yellow-300 font-black text-[10px] sm:text-xs md:text-sm leading-tight">
                  ভেন্যু: {config.venueText || 'মহিপাড়া উচ্চ বিদ্যালয় মাঠ'}
                </p>
                {config.venueSubText && (
                  <p className="text-emerald-100 text-[8px] sm:text-[10px] font-bold leading-tight">
                    {config.venueSubText}
                  </p>
                )}
              </div>
            </div>

            {/* Organizer Footer / Watermark */}
            {config.organizerText && (
              <p className="text-white/80 text-[8px] sm:text-[10px] font-medium mt-1 drop-shadow-sm">
                {config.organizerText}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
