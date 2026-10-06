import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AppLoadingProps {
  onComplete?: () => void;
  minDurationMs?: number;
}

// Convert English numbers to authentic Bengali numerals
const toBanglaNumber = (n: number) => {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return n
    .toString()
    .split('')
    .map((digit) => banglaDigits[parseInt(digit, 10)] || digit)
    .join('');
};

export const AppLoading: React.FC<AppLoadingProps> = ({ 
  onComplete,
  minDurationMs = 2400 
}) => {
  const [progress, setProgress] = useState(12);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.round((elapsed / minDurationMs) * 100), 100);

      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsDone(true);
          if (onComplete) {
            setTimeout(onComplete, 400);
          }
        }, 300);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [minDurationMs, onComplete]);

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          key="puthia-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[99999] flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#f8fdfa] via-[#ffffff] to-[#eef9f2] select-none font-sans"
          id="puthia-splash-screen"
        >
          {/* ========================================================================= */}
          {/* 1. TOP-LEFT CORNER ORGANIC WAVE SHAPES                                   */}
          {/* ========================================================================= */}
          <div className="absolute top-0 left-0 w-80 sm:w-96 h-64 pointer-events-none z-0">
            <svg
              viewBox="0 0 400 320"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full object-cover"
            >
              <defs>
                <linearGradient id="topWaveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#065f46" stopOpacity="0.95" />
                  <stop offset="60%" stopColor="#059669" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="topWaveGrad2" x1="0%" y1="0%" x2="100%" y2="80%">
                  <stop offset="0%" stopColor="#047857" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.25" />
                </linearGradient>
              </defs>
              <path
                d="M -20 -20 L 320 -20 C 260 80 180 120 120 180 C 60 240 10 270 -20 280 Z"
                fill="url(#topWaveGrad2)"
              />
              <path
                d="M -20 -20 L 260 -20 C 220 50 160 90 90 140 C 30 180 -10 200 -20 210 Z"
                fill="url(#topWaveGrad1)"
              />
            </svg>
          </div>

          {/* ========================================================================= */}
          {/* 2. BOTTOM-RIGHT CORNER ORGANIC WAVE SHAPES                               */}
          {/* ========================================================================= */}
          <div className="absolute bottom-0 right-0 w-80 sm:w-96 h-64 pointer-events-none z-0">
            <svg
              viewBox="0 0 400 320"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full object-cover"
            >
              <defs>
                <linearGradient id="bottomWaveGrad1" x1="100%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#065f46" stopOpacity="0.95" />
                  <stop offset="60%" stopColor="#059669" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="bottomWaveGrad2" x1="100%" y1="100%" x2="0%" y2="20%">
                  <stop offset="0%" stopColor="#047857" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <path
                d="M 420 340 L 80 340 C 140 240 220 200 280 140 C 340 80 390 50 420 40 Z"
                fill="url(#bottomWaveGrad2)"
              />
              <path
                d="M 420 340 L 140 340 C 180 270 240 230 310 180 C 370 140 410 120 420 110 Z"
                fill="url(#bottomWaveGrad1)"
              />
            </svg>
          </div>

          {/* ========================================================================= */}
          {/* 3. FLOATING GREEN LEAVES PARTICLES                                       */}
          {/* ========================================================================= */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {/* Top Right Leaf */}
            <motion.div
              animate={{ y: [0, -12, 0], rotate: [25, 32, 25] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-[8%] right-[14%] w-8 h-8 opacity-85 filter blur-[0.4px]"
            >
              <LeafSvg color="#10b981" />
            </motion.div>

            {/* Top Left Leaf (Depth blur) */}
            <motion.div
              animate={{ y: [0, 10, 0], rotate: [-35, -28, -35] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute top-[22%] left-[8%] w-10 h-10 opacity-75 filter blur-[1px]"
            >
              <LeafSvg color="#059669" />
            </motion.div>

            {/* Mid Left Leaf (Large Foreground) */}
            <motion.div
              animate={{ y: [0, -14, 0], rotate: [45, 52, 45] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute top-[52%] left-[4%] w-12 h-12 opacity-80 filter blur-[1.2px]"
            >
              <LeafSvg color="#047857" />
            </motion.div>

            {/* Mid Right Leaf */}
            <motion.div
              animate={{ y: [0, 8, 0], rotate: [-20, -15, -20] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
              className="absolute top-[36%] right-[7%] w-7 h-7 opacity-70 filter blur-[0.6px]"
            >
              <LeafSvg color="#34d399" />
            </motion.div>

            {/* Lower Right Leaf */}
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [30, 38, 30] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              className="absolute bottom-[34%] right-[10%] w-9 h-9 opacity-75 filter blur-[1.5px]"
            >
              <LeafSvg color="#10b981" />
            </motion.div>

            {/* Bottom Left Leaf (Foreground) */}
            <motion.div
              animate={{ y: [0, 12, 0], rotate: [-40, -32, -40] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
              className="absolute bottom-[10%] left-[10%] w-11 h-11 opacity-80 filter blur-[1px]"
            >
              <LeafSvg color="#059669" />
            </motion.div>
          </div>

          {/* ========================================================================= */}
          {/* 4. MAIN CENTRAL CONTENT: LOGO, ORBITAL RINGS, TITLE, BAR & SPINNER        */}
          {/* ========================================================================= */}
          <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 pt-8 pb-4">
            
            {/* Sleek Concentric Orbital Ring & 'প' Logo */}
            <div className="relative flex items-center justify-center mb-8">
              
              {/* Outer Neon Orbit Ring with Moving Light Point */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
                className="w-56 h-56 sm:w-64 sm:h-64 rounded-full border border-emerald-400/40 relative flex items-center justify-center shadow-[0_0_25px_rgba(52,211,153,0.2)]"
              >
                {/* Glowing light node 1 */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
                {/* Glowing light node 2 */}
                <div className="absolute -bottom-1 left-1/3 w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_8px_#6ee7b7]" />
              </motion.div>

              {/* Secondary Inner Counter-Rotating Ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full border border-dashed border-emerald-500/30"
              />

              {/* Tertiary Concentric Accent Ring */}
              <div className="absolute w-42 h-42 sm:w-48 sm:h-48 rounded-full border-2 border-emerald-400/20" />

              {/* Central Official 'প' Logo Circle */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute w-34 h-34 sm:w-38 sm:h-38 rounded-full bg-white border-4 border-[#0b7a3b] shadow-[0_12px_36px_rgba(11,122,59,0.25)] flex items-center justify-center overflow-hidden p-2"
              >
                <img
                  src="/logo.svg"
                  alt="আমাদের পুঠিয়া লোগো"
                  className="w-full h-full object-contain"
                />
              </motion.div>
            </div>

            {/* Decorative Leaf Divider */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center justify-center gap-3 mb-3"
            >
              <div className="w-14 sm:w-20 h-[1.5px] bg-gradient-to-r from-transparent to-emerald-700/60" />
              <div className="flex items-center gap-1 text-emerald-700">
                <svg viewBox="0 0 32 32" className="w-6 h-6 fill-current text-emerald-700">
                  <path d="M16 14C16 14 12 7 6 7C6 13 13 16 16 16C16 16 20 23 26 23C26 17 19 14 16 14Z" />
                  <path d="M16 16C16 16 22 10 27 12C27 17 21 18 16 16Z" opacity="0.85" />
                </svg>
              </div>
              <div className="w-14 sm:w-20 h-[1.5px] bg-gradient-to-l from-transparent to-emerald-700/60" />
            </motion.div>

            {/* Title: 'পুঠিয়ার ডিজিটাল নাগরিক সেবা ও তথ্য প্ল্যাটফর্ম' */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-base sm:text-lg md:text-xl font-bold text-[#065f46] text-center tracking-tight mb-6 max-w-sm px-2 drop-shadow-2xs"
            >
              পুঠিয়ার ডিজিটাল নাগরিক সেবা ও তথ্য প্ল্যাটফর্ম
            </motion.h2>

            {/* Glowing Smooth Progress Bar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="w-64 sm:w-76 h-3 bg-emerald-100/60 rounded-full border border-emerald-300/40 p-0.5 overflow-hidden shadow-inner relative mb-5"
            >
              {/* Active filled gradient track */}
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#047857] via-[#059669] to-[#10b981] relative shadow-[0_0_12px_rgba(16,185,129,0.7)]"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.1 }}
              >
                {/* Shining moving light head */}
                <motion.div
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute right-0 top-0 bottom-0 w-3 rounded-full bg-white shadow-[0_0_8px_#ffffff]"
                />
              </motion.div>
            </motion.div>

            {/* Circular Spinner (Radial spokes like in reference) */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 mb-4 flex items-center justify-center text-emerald-600"
            >
              <RadialSpokeSpinner />
            </motion.div>

            {/* Pill Badge: 'লোড হচ্ছে... (৬০%)' */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="inline-flex items-center justify-center px-5 py-1.5 rounded-full bg-[#e8f7ee] border border-[#a3e3be] text-[#065f46] font-bold text-xs sm:text-sm shadow-xs tracking-wide"
            >
              <span>লোড হচ্ছে...</span>
              <span className="ml-1 font-mono font-bold">({toBanglaNumber(progress)}%)</span>
            </motion.div>
          </div>

          {/* ========================================================================= */}
          {/* 5. HISTORIC PUTHIA RAJBARI PALACE ARCHITECTURAL SILHOUETTE & FOOTER       */}
          {/* ========================================================================= */}
          <div className="relative z-10 w-full flex flex-col items-center pb-6 sm:pb-8">
            {/* Puthia Rajbari Architectural Silhouette Canvas */}
            <div className="w-full max-w-2xl px-4 pointer-events-none opacity-45 sm:opacity-50">
              <PuthiaRajbariSvg />
            </div>

            {/* Footer Signature: '— PUTHIA PORTAL • 2026 —' */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex items-center justify-center gap-2 mt-2 text-[10px] tracking-widest text-[#065f46] font-bold uppercase select-none"
            >
              <span className="w-8 sm:w-12 h-[1px] bg-emerald-700/30" />
              <span>PUTHIA PORTAL • 2026</span>
              <span className="w-8 sm:w-12 h-[1px] bg-emerald-700/30" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// =========================================================================
// HELPER SVG COMPONENTS: LEAF, SPINNER & PUTHIA RAJBARI PALACE
// =========================================================================

// Organic single leaf SVG
const LeafSvg: React.FC<{ color?: string }> = ({ color = '#059669' }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path
      d="M 5 35 C 5 25 15 5 35 5 C 35 15 25 35 5 35 Z"
      fill={color}
    />
    <path
      d="M 5 35 Q 20 20 35 5"
      stroke="#ffffff"
      strokeWidth="1.5"
      strokeOpacity="0.4"
    />
  </svg>
);

// 12-Spoke Radial Spinner matching the reference image
const RadialSpokeSpinner: React.FC = () => {
  const spokes = 12;
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7" fill="currentColor">
      {Array.from({ length: spokes }).map((_, i) => {
        const angle = (i * 360) / spokes;
        const opacity = (i + 1) / spokes;
        return (
          <rect
            key={i}
            x="14.5"
            y="2"
            width="3"
            height="7"
            rx="1.5"
            transform={`rotate(${angle} 16 16)`}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
};

// Neoclassical Puthia Rajbari Palace & Tropical Trees Silhouette SVG
const PuthiaRajbariSvg: React.FC = () => (
  <svg
    viewBox="0 0 800 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-auto text-emerald-800"
  >
    <defs>
      <linearGradient id="palaceWash" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#065f46" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#047857" stopOpacity="0.65" />
      </linearGradient>
    </defs>

    {/* Background Tropical Trees (Left side) */}
    <path
      d="M 40 180 C 30 150 50 120 70 125 C 80 110 110 115 120 135 C 140 120 170 135 170 160 C 185 155 200 170 195 190 L 40 190 Z"
      fill="url(#palaceWash)"
      opacity="0.6"
    />
    <path
      d="M 90 190 C 80 165 95 145 115 150 C 125 135 150 140 160 160 C 175 150 200 165 195 190 L 90 190 Z"
      fill="url(#palaceWash)"
      opacity="0.8"
    />

    {/* Palm Tree (Right side) */}
    <path
      d="M 690 195 Q 692 130 695 85 L 697 85 Q 694 130 692 195 Z"
      fill="#065f46"
      opacity="0.7"
    />
    {/* Palm Fronds */}
    <path
      d="M 695 85 Q 670 65 640 80 Q 670 70 695 85 Z"
      fill="#065f46"
      opacity="0.75"
    />
    <path
      d="M 695 85 Q 685 55 670 50 Q 685 60 695 85 Z"
      fill="#065f46"
      opacity="0.75"
    />
    <path
      d="M 695 85 Q 710 50 725 60 Q 710 65 695 85 Z"
      fill="#065f46"
      opacity="0.75"
    />
    <path
      d="M 695 85 Q 725 75 750 90 Q 725 80 695 85 Z"
      fill="#065f46"
      opacity="0.75"
    />

    {/* Background Shade Trees (Right side) */}
    <path
      d="M 620 185 C 610 160 630 135 650 140 C 660 125 690 130 700 150 C 720 135 750 150 745 185 L 620 185 Z"
      fill="url(#palaceWash)"
      opacity="0.6"
    />

    {/* ========================================================================= */}
    {/* PUTHIA RAJBARI PALACE ARCHITECTURE                                        */}
    {/* ========================================================================= */}

    {/* Base Terrace & Plinth */}
    <rect x="180" y="180" width="440" height="15" rx="2" fill="url(#palaceWash)" />
    <rect x="190" y="174" width="420" height="6" fill="url(#palaceWash)" opacity="0.9" />

    {/* Ground Floor Main Wing Colonnade */}
    <rect x="200" y="130" width="400" height="44" fill="url(#palaceWash)" opacity="0.8" />
    {/* Ground Floor Arched Openings */}
    {[215, 245, 275, 305, 335, 435, 465, 495, 525, 555].map((x) => (
      <path
        key={x}
        d={`M ${x} 174 L ${x} 146 Q ${x + 10} 138 ${x + 20} 146 L ${x + 20} 174 Z`}
        fill="#ffffff"
        opacity="0.75"
      />
    ))}

    {/* First Floor Main Wing */}
    <rect x="200" y="85" width="400" height="45" fill="url(#palaceWash)" opacity="0.9" />
    {/* First Floor Balustrade & Cornice */}
    <rect x="195" y="126" width="410" height="4" fill="#047857" opacity="0.8" />
    <rect x="195" y="82" width="410" height="5" fill="#047857" opacity="0.9" />

    {/* First Floor Classical Rectangular Windows with Moldings */}
    {[215, 245, 275, 305, 335, 435, 465, 495, 525, 555].map((x) => (
      <rect
        key={x}
        x={x + 2}
        y="92"
        width="16"
        height="26"
        rx="2"
        fill="#ffffff"
        opacity="0.75"
      />
    ))}

    {/* Roof Balustrade Parapet Railing */}
    <rect x="195" y="76" width="410" height="6" fill="url(#palaceWash)" opacity="0.8" />
    {/* Roof Urns / Finials */}
    {[200, 240, 280, 320, 360, 440, 480, 520, 560, 600].map((x) => (
      <rect key={x} x={x} y="70" width="4" height="6" rx="1" fill="#065f46" opacity="0.9" />
    ))}

    {/* ========================================================================= */}
    {/* GRAND CENTRAL PORTICO & CLOCK TOWER (HEMANTA KUMARI PALACE)              */}
    {/* ========================================================================= */}
    
    {/* Central Projecting Portico Block */}
    <rect x="360" y="70" width="80" height="105" fill="url(#palaceWash)" />
    
    {/* Grand Corinthian Columns (4 Pillars) */}
    {[365, 385, 410, 430].map((x) => (
      <rect key={x} x={x} y="95" width="6" height="80" rx="1" fill="#ffffff" opacity="0.85" />
    ))}

    {/* Central Triangular Pediment */}
    <path
      d="M 355 70 L 400 45 L 445 70 Z"
      fill="url(#palaceWash)"
    />
    <path
      d="M 360 68 L 400 48 L 440 68 Z"
      fill="#ffffff"
      opacity="0.5"
    />

    {/* Central Attic with Iconic Clock Tower */}
    <rect x="382" y="24" width="36" height="24" rx="2" fill="url(#palaceWash)" />
    
    {/* Clock Face Circle */}
    <circle cx="400" cy="36" r="7" fill="#ffffff" opacity="0.9" />
    <circle cx="400" cy="36" r="5.5" stroke="#065f46" strokeWidth="1" fill="none" opacity="0.7" />
    {/* Clock Hands */}
    <line x1="400" y1="36" x2="400" y2="33" stroke="#065f46" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="400" y1="36" x2="403" y2="36" stroke="#065f46" strokeWidth="1.2" strokeLinecap="round" />

    {/* Crown Dome on Top of Clock Tower */}
    <path
      d="M 388 24 Q 400 10 412 24 Z"
      fill="#065f46"
    />
    <rect x="399" y="6" width="2" height="6" fill="#065f46" />
    <circle cx="400" cy="6" r="2" fill="#065f46" />

    {/* Base Ground Line */}
    <line x1="0" y1="195" x2="800" y2="195" stroke="#065f46" strokeWidth="2" opacity="0.3" />
  </svg>
);

export default AppLoading;
