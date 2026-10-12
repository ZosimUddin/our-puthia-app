import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ThumbsUp } from 'lucide-react';

export interface ReactionItem {
  id: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
  label: string;
  emoji: string;
  color: string;
  bg: string;
  border: string;
}

export const FB_REACTIONS: ReactionItem[] = [
  { id: 'like', label: 'লাইক', emoji: '👍', color: 'text-[#1877F2]', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'love', label: 'লাভ', emoji: '❤️', color: 'text-[#E41E3F]', bg: 'bg-rose-50', border: 'border-rose-200' },
  { id: 'haha', label: 'হাহা', emoji: '😆', color: 'text-[#F7B125]', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'wow', label: 'ওয়াও', emoji: '😮', color: 'text-[#F7B125]', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'sad', label: 'স্যাড', emoji: '😢', color: 'text-[#F7B125]', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'angry', label: 'এংরি', emoji: '😡', color: 'text-[#E44D3A]', bg: 'bg-orange-50', border: 'border-orange-200' },
];

/* ========================================================================= */
/* Facebook Style Animated SVG Icons with Micro-Character Animations        */
/* ========================================================================= */

// 1. LIKE 👍: Thumbs-up blue circle with joyful waggle
const FbLikeSvg: React.FC<{ isActive?: boolean; size?: number }> = ({ isActive, size = 36 }) => (
  <motion.div
    animate={isActive ? {
      rotate: [-14, 16, -10, 12, 0],
      y: [-6, 0]
    } : {
      rotate: 0,
      y: 0
    }}
    transition={{
      duration: isActive ? 0.7 : 0.2,
      ease: "easeInOut",
      repeat: isActive ? Infinity : 0,
      repeatDelay: 0.15
    }}
    className="inline-flex items-center justify-center shrink-0 pointer-events-none select-none"
    style={{ width: size, height: size }}
  >
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
      <defs>
        <radialGradient id="fb_like_grad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#2E89FF" />
          <stop offset="100%" stopColor="#0866FF" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#fb_like_grad)" />
      <path
        d="M13 18.5H10.5C9.67 18.5 9 19.17 9 20V28C9 28.83 9.67 29.5 10.5 29.5H13V18.5ZM28.5 20.83C28.5 19.82 27.68 19 26.67 19H22.17C22.62 17.5 23 15.67 23 14C23 11.5 21.67 10.5 20.5 10.5C19.83 10.5 19.33 11.17 19.33 12.17V13.83C19.33 16.33 16.83 19 14.5 19V29.5H25.33C26.17 29.5 26.92 28.92 27.17 28.08L28.92 22.08C28.97 21.83 28.5 20.83 28.5 20.83Z"
        fill="white"
      />
    </svg>
  </motion.div>
);

// 2. LOVE ❤️: Heart beating pulse with glossy shine
const FbLoveSvg: React.FC<{ isActive?: boolean; size?: number }> = ({ isActive, size = 36 }) => (
  <motion.div
    animate={isActive ? {
      scale: [1, 1.3, 1.12, 1.35, 1],
      rotate: [-4, 4, -2, 2, 0]
    } : {
      scale: 1,
      rotate: 0
    }}
    transition={{
      duration: isActive ? 0.8 : 0.2,
      ease: "easeInOut",
      repeat: isActive ? Infinity : 0
    }}
    className="inline-flex items-center justify-center shrink-0 pointer-events-none select-none"
    style={{ width: size, height: size }}
  >
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
      <defs>
        <radialGradient id="fb_love_grad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FF4D67" />
          <stop offset="100%" stopColor="#E41E3F" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#fb_love_grad)" />
      <path
        d="M20 30S10 24.2 10 17.5C10 14.2 12.5 11.5 15.8 11.5C17.7 11.5 19.3 12.4 20 13.8C20.7 12.4 22.3 11.5 24.2 11.5C27.5 11.5 30 14.2 30 17.5C30 24.2 20 30 20 30Z"
        fill="white"
      />
      <ellipse cx="15.5" cy="15.5" rx="2" ry="1.2" transform="rotate(-30 15.5 15.5)" fill="white" opacity="0.45" />
    </svg>
  </motion.div>
);

// 3. HAHA 😆: Laughing head shake and bouncing mouth
const FbHahaSvg: React.FC<{ isActive?: boolean; size?: number }> = ({ isActive, size = 36 }) => (
  <motion.div
    animate={isActive ? {
      rotate: [-14, 14, -10, 10, -4, 0],
      y: [-6, 3, -5, 2, 0]
    } : {
      rotate: 0,
      y: 0
    }}
    transition={{
      duration: isActive ? 0.7 : 0.2,
      ease: "easeInOut",
      repeat: isActive ? Infinity : 0
    }}
    className="inline-flex items-center justify-center shrink-0 pointer-events-none select-none"
    style={{ width: size, height: size }}
  >
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
      <defs>
        <radialGradient id="fb_yellow_grad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFDE55" />
          <stop offset="100%" stopColor="#F7B125" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#fb_yellow_grad)" />
      {/* Squinting Eyes */}
      <path d="M11 16.5C12.5 14 15.5 14 17 16.5" stroke="#3E2405" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M23 16.5C24.5 14 27.5 14 29 16.5" stroke="#3E2405" strokeWidth="2.4" strokeLinecap="round" />
      {/* Laughing Open Mouth */}
      <path d="M12 21C12 26 15.5 29.5 20 29.5C24.5 29.5 28 21 28 21H12Z" fill="#751A05" />
      {/* Tongue */}
      <path d="M16 26.5C17 28.5 19 29.5 20 29.5C21 29.5 23 28.5 24 26.5C22 25.5 18 25.5 16 26.5Z" fill="#F86767" />
    </svg>
  </motion.div>
);

// 4. WOW 😮: Surprised floating gasp & jaw drop
const FbWowSvg: React.FC<{ isActive?: boolean; size?: number }> = ({ isActive, size = 36 }) => (
  <motion.div
    animate={isActive ? {
      y: [-8, 0, -8],
      scale: [1, 1.18, 1]
    } : {
      y: 0,
      scale: 1
    }}
    transition={{
      duration: isActive ? 0.8 : 0.2,
      ease: "easeInOut",
      repeat: isActive ? Infinity : 0
    }}
    className="inline-flex items-center justify-center shrink-0 pointer-events-none select-none"
    style={{ width: size, height: size }}
  >
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
      <defs>
        <radialGradient id="fb_yellow_grad_wow" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFDE55" />
          <stop offset="100%" stopColor="#F7B125" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#fb_yellow_grad_wow)" />
      {/* Raised Eyebrows */}
      <path d="M11.5 12C13 10.2 16 10.2 17.5 12" stroke="#3E2405" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M22.5 12C24 10.2 27 10.2 28.5 12" stroke="#3E2405" strokeWidth="2.2" strokeLinecap="round" />
      {/* Surprised Eyes */}
      <circle cx="14.5" cy="16.5" r="2.8" fill="#3E2405" />
      <circle cx="25.5" cy="16.5" r="2.8" fill="#3E2405" />
      {/* Oval Wow Mouth */}
      <ellipse cx="20" cy="25" rx="4.5" ry="6.2" fill="#751A05" />
    </svg>
  </motion.div>
);

// 5. SAD 😢: Drooping face with animated falling teardrop
const FbSadSvg: React.FC<{ isActive?: boolean; size?: number }> = ({ isActive, size = 36 }) => (
  <motion.div
    animate={isActive ? {
      rotate: [0, 8, -6, 5, 0],
      y: [0, 3, 0]
    } : {
      rotate: 0,
      y: 0
    }}
    transition={{
      duration: isActive ? 0.85 : 0.2,
      ease: "easeInOut",
      repeat: isActive ? Infinity : 0
    }}
    className="inline-flex items-center justify-center shrink-0 pointer-events-none select-none"
    style={{ width: size, height: size }}
  >
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
      <defs>
        <radialGradient id="fb_yellow_grad_sad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFDE55" />
          <stop offset="100%" stopColor="#F7B125" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#fb_yellow_grad_sad)" />
      {/* Sad Eyebrows */}
      <path d="M11.5 13.5C13 14.8 16 13.5 17 12.8" stroke="#3E2405" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M23 12.8C24 13.5 27 14.8 28.5 13.5" stroke="#3E2405" strokeWidth="2.2" strokeLinecap="round" />
      {/* Sad Eyes */}
      <circle cx="14" cy="17.5" r="2.5" fill="#3E2405" />
      <circle cx="26" cy="17.5" r="2.5" fill="#3E2405" />
      {/* Downturned Mouth */}
      <path d="M14.5 26.5C16.5 24 23.5 24 25.5 26.5" stroke="#751A05" strokeWidth="2.6" strokeLinecap="round" />
      {/* Teardrop */}
      <motion.path
        animate={isActive ? { y: [0, 4, 0], opacity: [0.8, 1, 0.8] } : {}}
        transition={{ duration: 0.9, repeat: Infinity }}
        d="M27.5 21C27.5 21 29.5 23.5 29.5 25C29.5 26.1 28.6 27 27.5 27C26.4 27 25.5 26.1 25.5 25C25.5 23.5 27.5 21 27.5 21Z"
        fill="#2E89FF"
      />
    </svg>
  </motion.div>
);

// 6. ANGRY 😡: Fierce red face with trembling rage vibration
const FbAngrySvg: React.FC<{ isActive?: boolean; size?: number }> = ({ isActive, size = 36 }) => (
  <motion.div
    animate={isActive ? {
      x: [-3, 3, -3, 3, -1, 1, 0],
      y: [-2, 2, -1, 1, 0]
    } : {
      x: 0,
      y: 0
    }}
    transition={{
      duration: isActive ? 0.45 : 0.2,
      ease: "easeInOut",
      repeat: isActive ? Infinity : 0
    }}
    className="inline-flex items-center justify-center shrink-0 pointer-events-none select-none"
    style={{ width: size, height: size }}
  >
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
      <defs>
        <radialGradient id="fb_angry_grad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FF5C39" />
          <stop offset="100%" stopColor="#E41E26" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#fb_angry_grad)" />
      {/* Fierce angled eyebrows */}
      <path d="M11 13.5L18 16.5" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M29 13.5L22 16.5" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
      {/* Intense Eyes */}
      <circle cx="14.5" cy="19" r="2.4" fill="white" />
      <circle cx="25.5" cy="19" r="2.4" fill="white" />
      {/* Grimacing angry mouth */}
      <path d="M14 27C16 25 24 25 26 27" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  </motion.div>
);

// Helper component that maps reaction id to the animated SVG
export const FbReactionGlyph: React.FC<{ id: string; isActive?: boolean; size?: number }> = ({ id, isActive, size = 36 }) => {
  switch (id) {
    case 'like': return <FbLikeSvg isActive={isActive} size={size} />;
    case 'love': return <FbLoveSvg isActive={isActive} size={size} />;
    case 'haha': return <FbHahaSvg isActive={isActive} size={size} />;
    case 'wow': return <FbWowSvg isActive={isActive} size={size} />;
    case 'sad': return <FbSadSvg isActive={isActive} size={size} />;
    case 'angry': return <FbAngrySvg isActive={isActive} size={size} />;
    default: return <FbLikeSvg isActive={isActive} size={size} />;
  }
};

/* ========================================================================= */
/* Facebook Staggered Spring Animation Variants                              */
/* ========================================================================= */

const containerVariants = {
  hidden: {
    opacity: 0,
    scale: 0.5,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 450,
      damping: 25,
      staggerChildren: 0.045,
      delayChildren: 0.02
    }
  },
  exit: {
    opacity: 0,
    scale: 0.7,
    y: 12,
    transition: {
      duration: 0.15,
      ease: "easeIn"
    }
  }
};

const itemVariants = {
  hidden: {
    opacity: 0,
    scale: 0.2,
    y: 24
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 520,
      damping: 22
    }
  }
};

interface FbReactionPickerProps {
  userLiked?: boolean;
  userReaction?: string | null;
  likesCount?: number;
  showPillWithCount?: boolean;
  onSelectReaction: (reactionId: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') => void;
  onToggleLike: () => void;
  className?: string;
}

export const FbReactionPicker: React.FC<FbReactionPickerProps> = ({
  userLiked = false,
  userReaction = 'like',
  likesCount = 0,
  showPillWithCount = true,
  onSelectReaction,
  onToggleLike,
  className = ''
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);
  const [burstingReaction, setBurstingReaction] = useState<string | null>(null);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Active reaction object
  const activeReaction = FB_REACTIONS.find(r => r.id === (userReaction || 'like')) || FB_REACTIONS[0];

  // Close reaction picker on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
        setHoveredReaction(null);
      }
    };
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showPicker]);

  const clearNativeSelection = () => {
    if (typeof window !== 'undefined' && window.getSelection) {
      try {
        window.getSelection()?.removeAllRanges();
      } catch {}
    }
  };

  const handleTouchStart = () => {
    clearNativeSelection();
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
    // Long press timer for mobile
    pressTimerRef.current = setTimeout(() => {
      setShowPicker(true);
      clearNativeSelection();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(18); // Authentic subtle haptic
      }
    }, 240);
  };

  const handleTouchEnd = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    clearNativeSelection();
  };

  const handleButtonClick = () => {
    if (showPicker) {
      setShowPicker(false);
      setHoveredReaction(null);
      return;
    }
    onToggleLike();
  };

  const handleSelect = useCallback((rId: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') => {
    setBurstingReaction(rId);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([10, 30, 15]);
    }
    setTimeout(() => {
      onSelectReaction(rId);
      setShowPicker(false);
      setHoveredReaction(null);
      setBurstingReaction(null);
    }, 180);
  }, [onSelectReaction]);

  // Touch slide gesture on mobile across the reactions bar
  const handleTouchMovePicker = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    const btn = targetEl?.closest('[data-reaction-id]') as HTMLElement | null;
    if (btn) {
      const rId = btn.dataset.reactionId;
      if (rId && rId !== hoveredReaction) {
        setHoveredReaction(rId);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(8);
        }
      }
    }
  };

  const handleTouchEndPicker = () => {
    if (hoveredReaction) {
      handleSelect(hoveredReaction as any);
    } else {
      setShowPicker(false);
    }
  };

  // Fisheye wave magnification calculation
  const hoveredIndex = hoveredReaction ? FB_REACTIONS.findIndex(r => r.id === hoveredReaction) : null;

  const getEmojiScale = (idx: number) => {
    if (burstingReaction === FB_REACTIONS[idx].id) return 1.8;
    if (hoveredIndex === null) return 1;
    const distance = Math.abs(idx - hoveredIndex);
    if (distance === 0) return 1.55; // Active focused emoji
    if (distance === 1) return 1.2;  // Direct neighbor wave
    if (distance === 2) return 1.06; // Outer neighbor wave
    return 0.94;
  };

  const getEmojiY = (idx: number) => {
    if (burstingReaction === FB_REACTIONS[idx].id) return -24;
    if (hoveredIndex === null) return 0;
    const distance = Math.abs(idx - hoveredIndex);
    if (distance === 0) return -18; // Elevated high with spring
    if (distance === 1) return -6;  // Gentle wave rise
    return 0;
  };

  return (
    <div 
      className={`relative inline-block select-none ${className}`} 
      ref={containerRef}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
    >
      {/* ========================================================================= */}
      {/* 1. FLOATING FACEBOOK ANIMATED REACTION PICKER BAR                         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            ref={pickerRef}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onTouchMove={handleTouchMovePicker}
            onTouchEnd={handleTouchEndPicker}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute bottom-full left-0 sm:left-1/2 sm:-translate-x-1/2 mb-3.5 z-50 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-full shadow-[0_14px_36px_rgba(0,0,0,0.22)] px-2.5 py-1.5 flex items-center gap-1.5 sm:gap-2.5 ring-1 ring-black/5 select-none"
            style={{
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none'
            }}
          >
            {FB_REACTIONS.map((item, idx) => {
              const isHovered = hoveredReaction === item.id;
              const targetScale = getEmojiScale(idx);
              const targetY = getEmojiY(idx);

              return (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  data-reaction-id={item.id}
                  className="relative select-none flex items-center justify-center"
                >
                  {/* Tooltip Label (Pops in directly above active emoji with spring) */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.6 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.6 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900/92 backdrop-blur-xs text-white text-[11px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-xl pointer-events-none z-30 select-none flex items-center justify-center border border-white/10"
                      >
                        <span>{item.label}</span>
                        {/* Little triangle beak */}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900/92 rotate-45" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Facebook Animated Reaction Icon Button */}
                  <motion.button
                    type="button"
                    data-reaction-id={item.id}
                    onMouseEnter={() => setHoveredReaction(item.id)}
                    onMouseLeave={() => setHoveredReaction(null)}
                    onClick={() => handleSelect(item.id)}
                    animate={{
                      scale: targetScale,
                      y: targetY
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 20
                    }}
                    className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full cursor-pointer select-none relative z-10 focus:outline-none p-0 border-0 bg-transparent"
                    style={{
                      WebkitTouchCallout: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none'
                    }}
                  >
                    <FbReactionGlyph id={item.id} isActive={isHovered} size={38} />
                  </motion.button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. MAIN LIKE BUTTON (Facebook Lite Pill Style with Spring Scale Feedback)  */}
      {/* ========================================================================= */}
      <motion.button
        type="button"
        whileTap={{ scale: 1.08 }}
        whileHover={{ scale: 1.02 }}
        onClick={() => {
          handleButtonClick();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(12);
          }
        }}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          clearNativeSelection();
          return false;
        }}
        style={{
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          touchAction: 'manipulation'
        }}
        onMouseEnter={() => {
          // Hover timer for desktop
          pressTimerRef.current = setTimeout(() => setShowPicker(true), 400);
        }}
        onMouseLeave={() => {
          if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
        }}
        className={`w-full flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none ${
          showPillWithCount
            ? `py-2 px-4 rounded-full font-bold text-xs sm:text-sm border ${
                userLiked
                  ? `${activeReaction.color} ${activeReaction.bg} ${activeReaction.border}`
                  : 'bg-[#f0f2f5] text-[#050505] border-slate-200/80 hover:bg-[#e4e6eb]'
              }`
            : `py-2 px-3 rounded-xl font-bold text-xs sm:text-sm ${
                userLiked
                  ? `${activeReaction.color} ${activeReaction.bg} border ${activeReaction.border}`
                  : 'text-slate-700 hover:bg-[#f0f2f5]'
              }`
        }`}
      >
        {/* Animated Icon Block (Swells and bounces with spring feedback when liked!) */}
        <motion.div
          key={userLiked ? `liked_${activeReaction.id}` : 'unliked'}
          initial={{ scale: 0.7 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 600, damping: 14, mass: 0.8 }}
          className="flex items-center justify-center shrink-0 pointer-events-none select-none"
        >
          {userLiked ? (
            <FbReactionGlyph id={activeReaction.id} size={20} />
          ) : (
            <ThumbsUp size={16} className="text-slate-600" />
          )}
        </motion.div>

        {/* Label & Count - pointer-events-none and user-select: none prevents mobile OS text selection callouts */}
        <span 
          className="font-bold text-xs sm:text-[13px] truncate select-none pointer-events-none"
          style={{
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none'
          }}
        >
          {userLiked ? activeReaction.label : 'লাইক'}
          {likesCount > 0 ? ` (${likesCount})` : ''}
        </span>
      </motion.button>
    </div>
  );
};
