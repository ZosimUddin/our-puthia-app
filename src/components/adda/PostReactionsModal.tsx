import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  User, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { db } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  limit 
} from 'firebase/firestore';

export interface ReactionUserItem {
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  reaction: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | string;
  username?: string;
  isVerified?: boolean;
}

interface PostReactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postReactionsMap?: Record<string, string>;
  totalCount?: number;
}

const REACTION_CONFIG: Record<string, { label: string; emoji: string; bg: string; text: string }> = {
  like: { label: 'লাইক', emoji: '👍', bg: 'bg-emerald-600', text: 'text-emerald-600' },
  love: { label: 'লাভ', emoji: '❤️', bg: 'bg-rose-600', text: 'text-rose-600' },
  haha: { label: 'হাহা', emoji: '😆', bg: 'bg-amber-500', text: 'text-amber-500' },
  wow: { label: 'ওয়াও', emoji: '😮', bg: 'bg-amber-500', text: 'text-amber-500' },
  sad: { label: 'স্যাড', emoji: '😢', bg: 'bg-amber-500', text: 'text-amber-500' },
  angry: { label: 'এংরি', emoji: '😡', bg: 'bg-orange-600', text: 'text-orange-600' },
};

export const PostReactionsModal: React.FC<PostReactionsModalProps> = ({
  isOpen,
  onClose,
  postId,
  postReactionsMap = {},
  totalCount = 0
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [users, setUsers] = useState<ReactionUserItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen || !postId) return;

    let isMounted = true;
    setIsLoading(true);

    const fetchReactionUsers = async () => {
      const itemsMap: Map<string, ReactionUserItem> = new Map();

      try {
        // 1. Fetch from 'post_reactions' collection
        const qPostReactions = query(
          collection(db, 'post_reactions'),
          where('postId', '==', postId),
          limit(100)
        );
        const snap = await getDocs(qPostReactions);
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          const rType = (d.reaction || d.reactionType || 'like').toLowerCase();
          const uid = d.userId;
          if (uid) {
            itemsMap.set(uid, {
              userId: uid,
              userName: d.userName || d.name || 'নাগরিক',
              userPhotoUrl: d.userPhotoUrl || d.photoURL || '',
              reaction: rType,
              username: d.username || ''
            });
          }
        });

        // 2. Fetch from 'likes' collection (if not found in post_reactions)
        if (itemsMap.size === 0) {
          const qLikes = query(
            collection(db, 'likes'),
            where('postId', '==', postId),
            limit(100)
          );
          const snapLikes = await getDocs(qLikes);
          snapLikes.forEach((docSnap) => {
            const d = docSnap.data();
            const rType = (d.reaction || d.reactionType || 'like').toLowerCase();
            const uid = d.userId;
            if (uid && !itemsMap.has(uid)) {
              itemsMap.set(uid, {
                userId: uid,
                userName: d.userName || d.name || 'নাগরিক',
                userPhotoUrl: d.userPhotoUrl || d.photoURL || '',
                reaction: rType,
                username: d.username || ''
              });
            }
          });
        }

        // 3. Fallback: Parse postReactionsMap if Firestore docs are still missing
        if (postReactionsMap && typeof postReactionsMap === 'object') {
          for (const [uid, rTypeRaw] of Object.entries(postReactionsMap)) {
            if (uid && !itemsMap.has(uid)) {
              itemsMap.set(uid, {
                userId: uid,
                userName: 'নাগরিক',
                reaction: String(rTypeRaw).toLowerCase() || 'like',
              });
            }
          }
        }

        // 4. Enrich any missing user names/avatars from 'users' collection
        const uidsToFetch = Array.from(itemsMap.values())
          .filter(u => !u.userName || u.userName === 'নাগরিক' || !u.userPhotoUrl)
          .map(u => u.userId)
          .slice(0, 20);

        if (uidsToFetch.length > 0) {
          await Promise.allSettled(
            uidsToFetch.map(async (uid) => {
              try {
                const userDocSnap = await getDoc(doc(db, 'users', uid));
                if (userDocSnap.exists()) {
                  const uData = userDocSnap.data();
                  const existing = itemsMap.get(uid);
                  if (existing) {
                    existing.userName = uData.name || uData.displayName || existing.userName;
                    existing.userPhotoUrl = uData.photoURL || existing.userPhotoUrl;
                    existing.username = uData.username || uData.nickname || existing.username;
                    existing.isVerified = !!uData.accountVerifiedAwarded || !!uData.profileCompleteAwarded || !!uData.isVerified;
                  }
                }
              } catch {
                // Ignore transient network errors
              }
            })
          );
        }

        if (isMounted) {
          setUsers(Array.from(itemsMap.values()));
        }
      } catch (err) {
        console.warn('Error fetching reaction users:', err);
        // Fallback to postReactionsMap
        if (isMounted && postReactionsMap) {
          const fallbackList: ReactionUserItem[] = Object.entries(postReactionsMap).map(([uid, r]) => ({
            userId: uid,
            userName: 'নাগরিক',
            reaction: String(r).toLowerCase()
          }));
          setUsers(fallbackList);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchReactionUsers();

    return () => {
      isMounted = false;
    };
  }, [isOpen, postId, postReactionsMap]);

  if (!isOpen) return null;

  // Compute Reaction Counts by Type
  const countsByType: Record<string, number> = {};
  users.forEach((u) => {
    const key = u.reaction || 'like';
    countsByType[key] = (countsByType[key] || 0) + 1;
  });

  // Filter Users by Active Tab
  const filteredUsers = activeTab === 'all' 
    ? users 
    : users.filter(u => (u.reaction || 'like') === activeTab);

  const availableTabs = [
    { id: 'all', label: 'সব', count: users.length || totalCount, icon: null },
    ...Object.entries(REACTION_CONFIG)
      .filter(([key]) => (countsByType[key] || 0) > 0)
      .map(([key, cfg]) => ({
        id: key,
        label: cfg.label,
        count: countsByType[key] || 0,
        icon: cfg.emoji
      }))
  ];

  const handleUserClick = (userId: string) => {
    onClose();
    navigate(`/profile/${userId}`);
  };

  return (
    <div 
      className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] h-[520px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Facebook Style) */}
        <div className="px-5 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>প্রতিক্রিয়া সমূহ</span>
              {users.length > 0 && (
                <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {users.length}
                </span>
              )}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
            title="বন্ধ করুন"
          >
            <X size={18} />
          </button>
        </div>

        {/* Reaction Tabs Bar (Facebook Style All / Like / Love / Haha) */}
        <div className="px-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1 overflow-x-auto no-scrollbar py-1.5 bg-slate-50/50 dark:bg-slate-900/50">
          {availableTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                  isActive 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {tab.icon && <span className="text-sm">{tab.icon}</span>}
                <span>{tab.label}</span>
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Reaction Users List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100 dark:divide-slate-800/60">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
              <Loader2 size={28} className="animate-spin text-emerald-600" />
              <p className="text-xs font-bold">রিঅ্যাকশন লোড হচ্ছে...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-center text-slate-400">
              <div className="text-3xl">👍</div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">কোনো রিঅ্যাকশন পাওয়া যায়নি</p>
            </div>
          ) : (
            filteredUsers.map((item) => {
              const rCfg = REACTION_CONFIG[item.reaction] || REACTION_CONFIG.like;
              return (
                <div 
                  key={item.userId}
                  onClick={() => handleUserClick(item.userId)}
                  className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* User Avatar with Mini Reaction Badge Overlay */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        {item.userPhotoUrl ? (
                          <img 
                            src={item.userPhotoUrl} 
                            alt={item.userName} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <User size={20} className="text-slate-400" />
                        )}
                      </div>
                      {/* Mini Facebook reaction circle at bottom-right of avatar */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 shadow-xs flex items-center justify-center border border-slate-100 dark:border-slate-800 text-[11px]">
                        <span>{rCfg.emoji}</span>
                      </div>
                    </div>

                    {/* Name & Username */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                          {item.userName}
                        </span>
                        {item.isVerified && (
                          <CheckCircle2 size={13} className="text-emerald-500 fill-emerald-50 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {item.username ? `@${item.username}` : 'আমাদের পুঠিয়া নাগরিক'}
                      </p>
                    </div>
                  </div>

                  {/* View Profile Action */}
                  <div className="shrink-0 pl-2">
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition flex items-center gap-1">
                      <span>প্রোফাইল</span>
                      <ExternalLink size={11} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
