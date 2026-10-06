import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Music, 
  CheckCircle2, 
  MapPin, 
  Eye, 
  UserPlus, 
  UserCheck, 
  Heart,
  ChevronDown,
  Sparkles,
  Maximize2,
  Minimize2,
  AlertCircle,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { Reel, ReelReactionType } from '../../../types';
import { ReelActionBar } from './ReelActionBar';
import { reelService } from '../../../services/reelService';
import { getReelVideoURLFromDB } from '../../../utils/reelMediaCache';

interface ReelCardProps {
  reel: Reel;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  currentUser: any;
  onOpenComments: (reel: Reel) => void;
  onOpenShare: (reel: Reel) => void;
  onOpenAnalytics: (reel: Reel) => void;
  onOpenReport: (reel: Reel) => void;
  onDeleteReel: (reelId: string) => void;
  onHashtagClick?: (tag: string) => void;
  onAuthorClick?: (authorId: string) => void;
  onFollowToggle?: (targetUserId: string) => void;
  isFollowing?: boolean;
}

const getFilterStyle = (filterName?: string) => {
  switch (filterName) {
    case 'vintage': return 'sepia(0.35) contrast(1.1) brightness(0.95)';
    case 'warm': return 'sepia(0.2) saturate(1.3) contrast(1.05)';
    case 'cool': return 'hue-rotate(180deg) saturate(1.1) contrast(1.05)';
    case 'grayscale': return 'grayscale(1)';
    case 'vivid': return 'saturate(1.6) contrast(1.2)';
    case 'sepia': return 'sepia(0.8)';
    case 'dramatic': return 'contrast(1.4) brightness(0.9)';
    default: return 'none';
  }
};

export const ReelCard: React.FC<ReelCardProps> = ({
  reel,
  isActive,
  isMuted,
  onToggleMute,
  currentUser,
  onOpenComments,
  onOpenShare,
  onOpenAnalytics,
  onOpenReport,
  onDeleteReel,
  onHashtagClick,
  onAuthorClick,
  onFollowToggle,
  isFollowing = false
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Video Source resolution with fallback to local cache and public reliable video
  const [activeVideoSrc, setActiveVideoSrc] = useState<string>(() => {
    if (!reel.videoUrl || reel.videoUrl.includes('mixkit.co')) {
      return '/sample-reel.mp4';
    }
    return reel.videoUrl;
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState<boolean>(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(reel.duration || 15);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [videoFit, setVideoFit] = useState<'contain' | 'cover'>('contain');

  const lastTapRef = useRef<number>(0);
  const watchTimerRef = useRef<number>(0);
  const isAuthor = !!currentUser && currentUser.uid === reel.authorId;

  // Resolve source from IndexedDB or clean fallback
  useEffect(() => {
    let isCancelled = false;

    const resolveSource = async () => {
      // 1. If it's a blob URL (which expires across reloads) or empty or known broken url, check IndexedDB first
      if (!reel.videoUrl || reel.videoUrl.startsWith('blob:') || reel.videoUrl.includes('mixkit.co')) {
        const localBlobUrl = await getReelVideoURLFromDB(reel.id);
        if (localBlobUrl && !isCancelled) {
          setActiveVideoSrc(localBlobUrl);
          setHasError(false);
          return;
        }
      }

      if (reel.videoUrl && !reel.videoUrl.includes('mixkit.co')) {
        if (!isCancelled) {
          setActiveVideoSrc(reel.videoUrl);
          setHasError(false);
        }
      } else {
        if (!isCancelled) {
          setActiveVideoSrc('/sample-reel.mp4');
          setHasError(false);
        }
      }
    };

    resolveSource();

    return () => {
      isCancelled = true;
    };
  }, [reel.id, reel.videoUrl]);

  // Sync Saved state with local storage / user
  useEffect(() => {
    if (currentUser?.uid && reel.id) {
      const savedKey = `saved_reel_${currentUser.uid}_${reel.id}`;
      setIsSaved(localStorage.getItem(savedKey) === 'true');
    }
  }, [currentUser, reel.id]);

  // Autoplay management when active in view
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.currentTime = 0;
      video.muted = isMuted;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsLoadingVideo(false);
            setHasError(false);
            watchTimerRef.current = Date.now();
          })
          .catch((err) => {
            console.warn("Autoplay with sound restricted by browser; auto-retrying muted:", err);
            // Modern mobile browsers require initial playback to be muted
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play()
                .then(() => {
                  setIsPlaying(true);
                  setIsLoadingVideo(false);
                  setHasError(false);
                  watchTimerRef.current = Date.now();
                })
                .catch((mutedErr) => {
                  console.warn("Autoplay blocked, waiting for user tap:", mutedErr);
                  setIsPlaying(false);
                  setIsLoadingVideo(false);
                });
            }
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
      // If watched more than 3 seconds before moving, record view
      if (watchTimerRef.current > 0) {
        const elapsed = (Date.now() - watchTimerRef.current) / 1000;
        if (elapsed >= 3) {
          reelService.recordView(reel.id, currentUser?.uid, elapsed);
        }
        watchTimerRef.current = 0;
      }
    }

    return () => {
      if (video) video.pause();
    };
  }, [isActive, reel.id, isMuted, activeVideoSrc]);

  // Handle Video Error & Recovery
  const handleVideoError = useCallback(async (e: any) => {
    console.warn("Reel video failed to load, attempting recovery:", activeVideoSrc, e);
    // 1. Check local IndexedDB vault
    const cachedUrl = await getReelVideoURLFromDB(reel.id);
    if (cachedUrl && cachedUrl !== activeVideoSrc) {
      setActiveVideoSrc(cachedUrl);
      setHasError(false);
      return;
    }
    // 2. Fallback to /sample-reel.mp4
    if (activeVideoSrc !== '/sample-reel.mp4') {
      setActiveVideoSrc('/sample-reel.mp4');
      setHasError(false);
      return;
    }
    setHasError(true);
    setIsLoadingVideo(false);
    setIsPlaying(false);
  }, [activeVideoSrc, reel.id]);

  const handleRetryVideo = async () => {
    setHasError(false);
    setIsLoadingVideo(true);
    const cachedUrl = await getReelVideoURLFromDB(reel.id);
    if (cachedUrl) {
      setActiveVideoSrc(cachedUrl);
    } else {
      setActiveVideoSrc(reel.videoUrl || '/sample-reel.mp4');
    }
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Track progress and view threshold
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const dur = videoRef.current.duration || duration;
      setCurrentTime(current);
      setProgress((current / dur) * 100);

      // Record view after 3 seconds of continuous active watch
      if (current >= 3 && watchTimerRef.current > 0) {
        reelService.recordView(reel.id, currentUser?.uid, current);
      }
    }
  };

  // Video Screen Click & Double Tap Handler
  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double Tap Event -> Heart like animation & react
      setShowDoubleTapHeart(true);
      setTimeout(() => setShowDoubleTapHeart(false), 900);

      if (currentUser) {
        reelService.toggleReaction(reel.id, currentUser.uid, 'love', reel.reactions?.[currentUser.uid]);
      }
    } else {
      // Single Tap Event -> Toggle Play / Pause reliably using native paused status
      if (videoRef.current) {
        if (videoRef.current.paused || videoRef.current.ended) {
          videoRef.current.muted = isMuted;
          videoRef.current.play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch(() => {
              // If unmuted failed, try muted
              if (videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
              }
            });
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
        setShowPlayPauseIcon(true);
        setTimeout(() => setShowPlayPauseIcon(false), 600);
      }
    }
    lastTapRef.current = now;
  };

  // Reaction Handler
  const handleReact = async (reactionType: ReelReactionType) => {
    if (!currentUser) return;
    const currentReaction = reel.reactions?.[currentUser.uid];
    await reelService.toggleReaction(reel.id, currentUser.uid, reactionType, currentReaction);
  };

  // Toggle Save
  const handleToggleSave = async () => {
    if (!currentUser) return;
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    localStorage.setItem(`saved_reel_${currentUser.uid}_${reel.id}`, nextSaved ? 'true' : 'false');
    await reelService.toggleSaveReel(reel.id, currentUser.uid, !nextSaved);
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * (videoRef.current.duration || duration);
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center select-none overflow-hidden group">
      {/* Ambient Blurred Video Background for Wide/Non-standard aspect ratio videos */}
      {reel.thumbnailUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-125 pointer-events-none transition-all duration-300"
          style={{ backgroundImage: `url(${reel.thumbnailUrl})` }}
        />
      )}

      {/* 1. Main Video with Smart Non-Zooming Fit */}
      <video
        ref={videoRef}
        src={activeVideoSrc}
        poster={reel.thumbnailUrl}
        preload="auto"
        loop
        playsInline
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => setIsLoadingVideo(true)}
        onCanPlay={() => {
          setIsLoadingVideo(false);
          setHasError(false);
        }}
        onPlaying={() => {
          setIsLoadingVideo(false);
          setIsPlaying(true);
          setHasError(false);
        }}
        onPause={() => setIsPlaying(false)}
        onError={handleVideoError}
        onLoadedMetadata={() => {
          setIsLoadingVideo(false);
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
            if (reel.playbackSpeed) {
              videoRef.current.playbackRate = reel.playbackSpeed;
            }
          }
        }}
        onClick={handleVideoClick}
        style={{ filter: getFilterStyle(reel.videoFilter) }}
        className={`relative z-10 w-full h-full cursor-pointer transition-all duration-300 ${
          videoFit === 'cover' ? 'object-cover' : 'object-contain'
        }`}
      />

      {/* Fit/Fill Toggle Button (Top Right) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setVideoFit(prev => prev === 'contain' ? 'cover' : 'contain');
        }}
        className="absolute top-16 right-4 z-40 p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 transition-all cursor-pointer shadow-lg active:scale-95"
        title={videoFit === 'contain' ? 'পুরো স্ক্রিন জুম করুন (Fill)' : 'আসল মাপে দেখুন (Fit)'}
      >
        {videoFit === 'contain' ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
      </button>

      {/* 2. Buffering / Loading Indicator */}
      {isLoadingVideo && !hasError && (
        <div className="absolute inset-0 z-25 flex flex-col items-center justify-center bg-black/40 pointer-events-none">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="mt-3 text-white text-xs font-bold drop-shadow-md bg-black/60 px-3 py-1 rounded-full">
            ভিডিও লোড হচ্ছে...
          </span>
        </div>
      )}

      {/* 3. Prominent Facebook-style Play Overlay when video is paused/stopped */}
      {!isPlaying && !isLoadingVideo && !hasError && (
        <button
          type="button"
          onClick={handleVideoClick}
          className="absolute inset-0 z-25 flex flex-col items-center justify-center bg-black/35 backdrop-blur-[1px] transition-all cursor-pointer group/play"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white flex items-center justify-center shadow-2xl ring-4 ring-white/30 transform transition-transform group-hover/play:scale-110 active:scale-95 animate-pulse">
            <Play size={42} className="ml-1 fill-white" />
          </div>
          <span className="mt-4 px-4 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white font-bold text-xs sm:text-sm tracking-wide border border-white/20 shadow-lg">
            ভিডিও চালু করতে ট্যাপ করুন
          </span>
        </button>
      )}

      {/* 4. Error Card with Retry Button */}
      {hasError && (
        <div className="absolute inset-0 z-35 flex flex-col items-center justify-center bg-black/85 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
            <AlertCircle size={32} />
          </div>
          <p className="text-white text-sm font-bold mb-1">ভিডিও প্লে করা যায়নি</p>
          <p className="text-slate-300 text-xs mb-4">নেটওয়ার্ক চেক করে আবার চেষ্টা করুন</p>
          <button
            type="button"
            onClick={handleRetryVideo}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>ভিডিও পুনরায় চালু করুন</span>
          </button>
        </div>
      )}

      {/* 5. Double Tap Animated Heart */}
      {showDoubleTapHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 animate-in zoom-in-50 duration-200">
          <Heart size={90} className="text-rose-500 fill-rose-500 drop-shadow-2xl animate-bounce-short" />
        </div>
      )}

      {/* 6. Single Tap Play/Pause Indicator (HUD) */}
      {showPlayPauseIcon && isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-in fade-in zoom-in-75 duration-150">
          <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white">
            <Play size={36} className="ml-1" />
          </div>
        </div>
      )}

      {/* 4. Text Overlays from Creator */}
      {reel.textOverlays?.map((t) => (
        <div 
          key={t.id}
          className="absolute font-black drop-shadow-lg px-2 py-0.5 rounded pointer-events-none z-20"
          style={{ 
            color: t.color, 
            top: `${t.y}%`, 
            left: `${t.x}%`, 
            transform: 'translate(-50%, -50%)',
            fontSize: `${t.fontSize}px`,
            textShadow: '0 2px 5px rgba(0,0,0,0.85)'
          }}
        >
          {t.text}
        </div>
      ))}

      {/* 5. Top Controls (Mute / Sound Button) */}
      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white transition-transform active:scale-90 border border-white/10 cursor-pointer shadow-lg"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* 6. Right Side Vertical Action Bar */}
      <div className="absolute right-3.5 bottom-20 z-30">
        <ReelActionBar
          reel={reel}
          currentUserId={currentUser?.uid}
          isSaved={isSaved}
          onReact={handleReact}
          onOpenComments={() => onOpenComments(reel)}
          onOpenShare={() => onOpenShare(reel)}
          onToggleSave={handleToggleSave}
          onOpenAnalytics={() => onOpenAnalytics(reel)}
          onOpenReport={() => onOpenReport(reel)}
          onNotInterested={() => console.log("Not interested in", reel.id)}
          onBlockAuthor={() => console.log("Block author", reel.authorId)}
          onDeleteReel={() => onDeleteReel(reel.id)}
          isAuthor={isAuthor}
        />
      </div>

      {/* 7. Bottom Overlay (Author Info, Caption, Audio, Hashtags) */}
      <div className="absolute bottom-0 left-0 right-16 p-4 pb-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col gap-2.5 z-20 pointer-events-auto">
        {/* Creator Info & Follow */}
        <div className="flex items-center gap-2.5">
          <div 
            onClick={() => onAuthorClick && onAuthorClick(reel.authorId)}
            className="w-10 h-10 rounded-full border-2 border-emerald-400 overflow-hidden shrink-0 cursor-pointer shadow-md bg-slate-800"
          >
            {reel.authorAvatar ? (
              <img src={reel.authorAvatar} alt={reel.authorName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-black text-sm">
                {reel.authorName.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <span 
              onClick={() => onAuthorClick && onAuthorClick(reel.authorId)}
              className="text-xs font-black text-white truncate drop-shadow cursor-pointer hover:underline flex items-center gap-1"
            >
              @{reel.authorUsername || reel.authorName}
              {reel.isVerified && <CheckCircle2 size={13} className="text-emerald-400 fill-emerald-400 text-slate-900 shrink-0" />}
            </span>

            {/* Follow Button (if not author) */}
            {!isAuthor && onFollowToggle && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFollowToggle(reel.authorId);
                }}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all cursor-pointer border flex items-center gap-1 ${
                  isFollowing
                    ? 'bg-white/20 hover:bg-white/30 text-white border-white/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-sm'
                }`}
              >
                {isFollowing ? <UserCheck size={11} /> : <UserPlus size={11} />}
                <span>{isFollowing ? 'অনুসরণ করছেন' : 'ফলো'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Location Badge if exists */}
        {reel.location && (
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
            <MapPin size={12} className="text-rose-400 shrink-0" />
            <span className="truncate">{reel.location}</span>
          </div>
        )}

        {/* Caption with Hashtags */}
        {reel.caption && (
          <div className="text-xs text-white/95 font-medium leading-relaxed">
            <p className={isCaptionExpanded ? '' : 'line-clamp-2'}>
              {reel.caption.split(' ').map((word, i) => {
                if (word.startsWith('#')) {
                  return (
                    <span
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        onHashtagClick && onHashtagClick(word);
                      }}
                      className="font-bold text-emerald-300 hover:underline cursor-pointer mr-1 inline-block"
                    >
                      {word}
                    </span>
                  );
                }
                if (word.startsWith('@')) {
                  return (
                    <span key={i} className="font-bold text-sky-300 hover:underline cursor-pointer mr-1 inline-block">
                      {word}
                    </span>
                  );
                }
                return word + ' ';
              })}
            </p>
            {reel.caption.length > 80 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCaptionExpanded(!isCaptionExpanded);
                }}
                className="text-[10px] font-black text-slate-300 hover:text-white bg-transparent border-0 cursor-pointer mt-0.5"
              >
                {isCaptionExpanded ? 'সংক্ষেপ করুন' : '...আরও দেখুন'}
              </button>
            )}
          </div>
        )}

        {/* Music / Audio Ticker */}
        <div className="flex items-center gap-2 text-white/85 text-[11px] font-bold">
          <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center shrink-0">
            <Music size={11} className="text-emerald-400" />
          </div>
          <span className="truncate">
            {reel.originalAudio 
              ? `অরিজিনাল অডিও · ${reel.audioAuthor || reel.authorName}` 
              : `${reel.audioTitle} · ${reel.audioAuthor || 'মিউজিক'}`}
          </span>
        </div>
      </div>

      {/* 8. Bottom Playback Scrubbing Bar */}
      <div 
        onClick={handleProgressBarClick}
        className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 hover:h-2 transition-all cursor-pointer z-30"
      >
        <div 
          className="h-full bg-emerald-500 relative transition-all duration-100"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow opacity-0 group-hover:opacity-100" />
        </div>
      </div>
    </div>
  );
};
