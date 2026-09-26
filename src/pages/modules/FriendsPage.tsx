import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  UserCheck, 
  UserX, 
  X, 
  MessageCircle, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  MoreHorizontal,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  UserMinus,
  RefreshCw
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  limit, 
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { toast } from 'sonner';
import { AddaFacebookHeader } from '../../components/adda/AddaFacebookHeader';
import { SEO } from '../../components/SEO';
import { AuthModal } from '../../components/AuthModal';
import { chatService } from '../../services/chatService';
import { UserInfo } from '../../types';

export interface FriendRequestItem {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderUnion?: string;
  receiverId: string;
  receiverName?: string;
  receiverAvatar?: string;
  receiverUnion?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt?: any;
}

// Default Puthia Citizen Suggestions (Authentic local community profiles)
const DEFAULT_PUTHIA_CITIZENS = [
  {
    uid: 'puthia_c1',
    id: 'puthia_c1',
    name: 'মোছাঃ সুফিয়া খাতুন',
    union: 'বানেশ্বর ইউনিয়ন',
    village: 'দীঘলকান্দি',
    bio: 'সমাজকর্মী ও স্থানীয় নারী উদ্যোক্তা, পুঠিয়া',
    photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=sufia',
    mutualCount: 3,
    role: 'user'
  },
  {
    uid: 'puthia_c2',
    id: 'puthia_c2',
    name: 'মোঃ জাহিদ হাসান',
    union: 'পুঠিয়া পৌরসভা',
    village: 'রাজবাড়ী রোড',
    bio: 'তরুণ উদ্যোক্তা ও সামাজিক সংগঠক',
    photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=zahid',
    mutualCount: 5,
    role: 'user'
  },
  {
    uid: 'puthia_c3',
    id: 'puthia_c3',
    name: 'তানভীর আহমেদ',
    union: 'শিলমাড়িয়া ইউনিয়ন',
    village: 'পাকুড়িয়া',
    bio: 'ডিজিটাল প্ল্যাটফর্ম ও আইটি গবেষক',
    photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=tanvir',
    mutualCount: 2,
    role: 'user'
  },
  {
    uid: 'puthia_c4',
    id: 'puthia_c4',
    name: 'ফারহানা ইয়াসমিন',
    union: 'ভালুকগাছি ইউনিয়ন',
    village: 'ভালুকগাছি বাজার',
    bio: 'পুঠিয়ার সংস্কৃতি ও ঐতিহ্যপ্রেমী',
    photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=farhana',
    mutualCount: 4,
    role: 'user'
  },
  {
    uid: 'puthia_c5',
    id: 'puthia_c5',
    name: 'মাহমুদুল হক মিলন',
    union: 'বেলপুকুরিয়া ইউনিয়ন',
    village: 'বেলপুকুর',
    bio: 'স্বেচ্ছাসেবী ও রক্তদান সংগঠক',
    photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=milon',
    mutualCount: 6,
    role: 'user'
  },
  {
    uid: 'puthia_c6',
    id: 'puthia_c6',
    name: 'সালমা আক্তার',
    union: 'জিউপাড়া ইউনিয়ন',
    village: 'জিউপাড়া',
    bio: 'হস্তশিল্প উদ্যোক্তা ও সমাজকর্মী',
    photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=salma',
    mutualCount: 2,
    role: 'user'
  }
];

export const FriendsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const [activeFilter, setActiveFilter] = useState<'suggestions' | 'friends' | 'requests' | 'sent'>('suggestions');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Real-time Firestore state
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestItem[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<FriendRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Unfriend modal confirm
  const [unfriendModalTarget, setUnfriendModalTarget] = useState<any | null>(null);

  // 1. Subscribe to all registered users in Firestore
  useEffect(() => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(100));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const uList: any[] = [];
        snapshot.forEach((d) => {
          uList.push({ uid: d.id, id: d.id, ...d.data() });
        });
        setAllUsers(uList);
        setLoading(false);
      }, (err) => {
        console.warn("Failed to subscribe users:", err);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Users subscription error", e);
      setLoading(false);
    }
  }, []);

  // 2. Subscribe to incoming friend requests for current user
  useEffect(() => {
    if (!user) {
      setIncomingRequests([]);
      return;
    }
    try {
      const q = query(
        collection(db, 'friend_requests'),
        where('receiverId', '==', user.uid)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const incoming: FriendRequestItem[] = [];
        const accepted: FriendRequestItem[] = [];
        snapshot.forEach((d) => {
          const data = { id: d.id, ...d.data() } as FriendRequestItem;
          if (data.status === 'pending') {
            incoming.push(data);
          } else if (data.status === 'accepted') {
            accepted.push(data);
          }
        });
        setIncomingRequests(incoming);
      }, (err) => {
        console.warn("Failed to subscribe incoming requests:", err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Incoming requests error", e);
    }
  }, [user]);

  // 3. Subscribe to outgoing friend requests by current user
  useEffect(() => {
    if (!user) {
      setOutgoingRequests([]);
      setAcceptedRequests([]);
      return;
    }
    try {
      const q = query(
        collection(db, 'friend_requests'),
        where('senderId', '==', user.uid)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const outgoing: FriendRequestItem[] = [];
        const accepted: FriendRequestItem[] = [];
        snapshot.forEach((d) => {
          const data = { id: d.id, ...d.data() } as FriendRequestItem;
          if (data.status === 'pending') {
            outgoing.push(data);
          } else if (data.status === 'accepted') {
            accepted.push(data);
          }
        });
        setOutgoingRequests(outgoing);
        setAcceptedRequests(prev => {
          const map = new Map<string, FriendRequestItem>();
          [...prev, ...accepted].forEach(item => map.set(item.id, item));
          return Array.from(map.values());
        });
      }, (err) => {
        console.warn("Failed to subscribe outgoing requests:", err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Outgoing requests error", e);
    }
  }, [user]);

  // Merged users combining live Firestore users with default verified community members
  const mergedUsers = useMemo(() => {
    const map = new Map<string, any>();
    allUsers.forEach(u => {
      const id = u.uid || u.id;
      if (id) map.set(id, u);
    });
    DEFAULT_PUTHIA_CITIZENS.forEach(c => {
      if (!map.has(c.uid)) {
        map.set(c.uid, c);
      }
    });
    return Array.from(map.values());
  }, [allUsers]);

  // Derived: Current User's Accepted Friends List
  const friendsList = useMemo(() => {
    if (!user) return [];
    
    // Set of friend UIDs from accepted requests & profile.friends
    const friendUids = new Set<string>();
    
    // From accepted requests
    acceptedRequests.forEach(req => {
      if (req.senderId === user.uid) friendUids.add(req.receiverId);
      if (req.receiverId === user.uid) friendUids.add(req.senderId);
    });

    // From userProfile friends array if available
    if (Array.isArray(userProfile?.friends)) {
      userProfile.friends.forEach((fId: string) => friendUids.add(fId));
    }

    return mergedUsers.filter(u => friendUids.has(u.uid || u.id) && (u.uid || u.id) !== user.uid);
  }, [user, userProfile, acceptedRequests, mergedUsers]);

  // Derived: Suggested Users (People You May Know)
  const suggestionsList = useMemo(() => {
    const friendUids = new Set(friendsList.map(f => f.uid || f.id));
    const outgoingTargetUids = new Set(outgoingRequests.map(r => r.receiverId));
    const incomingSenderUids = new Set(incomingRequests.map(r => r.senderId));

    return mergedUsers.filter(u => {
      const uId = u.uid || u.id;
      if (user && uId === user.uid) return false;
      if (friendUids.has(uId)) return false;
      if (outgoingTargetUids.has(uId)) return false;
      if (incomingSenderUids.has(uId)) return false;
      return true;
    });
  }, [user, mergedUsers, friendsList, outgoingRequests, incomingRequests]);

  // Filtered lists based on search
  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return suggestionsList;
    const q = searchQuery.toLowerCase();
    return suggestionsList.filter(u => 
      u.name?.toLowerCase().includes(q) || 
      u.displayName?.toLowerCase().includes(q) ||
      u.union?.toLowerCase().includes(q) ||
      u.village?.toLowerCase().includes(q)
    );
  }, [suggestionsList, searchQuery]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friendsList;
    const q = searchQuery.toLowerCase();
    return friendsList.filter(u => 
      u.name?.toLowerCase().includes(q) || 
      u.displayName?.toLowerCase().includes(q) ||
      u.union?.toLowerCase().includes(q) ||
      u.village?.toLowerCase().includes(q)
    );
  }, [friendsList, searchQuery]);

  // Action: Send Friend Request
  const handleSendRequest = async (targetUser: any) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const targetUid = targetUser.uid || targetUser.id;
    if (!targetUid || targetUid === user.uid) return;

    setActionLoadingId(targetUid);
    const requestId = `${user.uid}_${targetUid}`;

    try {
      // 1. Create document in friend_requests collection
      await setDoc(doc(db, 'friend_requests', requestId), {
        id: requestId,
        senderId: user.uid,
        senderName: userProfile?.name || user.displayName || 'সম্মানিত নাগরিক',
        senderAvatar: userProfile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`,
        senderUnion: userProfile?.union || 'পুঠিয়া',
        receiverId: targetUid,
        receiverName: targetUser.name || targetUser.displayName || 'সম্মানিত নাগরিক',
        receiverAvatar: targetUser.photoURL || targetUser.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${targetUid}`,
        receiverUnion: targetUser.union || 'পুঠিয়া',
        status: 'pending',
        createdAt: Date.now()
      });

      // 2. Synchronize user docs arrays
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          friendRequestsSent: arrayUnion(targetUid)
        });
        await updateDoc(doc(db, 'users', targetUid), {
          friendRequestsReceived: arrayUnion(user.uid)
        });
      } catch (e) {
        // Safe fallback if user doc rules restrict
      }

      // 3. Dispatch real notification to target user
      try {
        await addDoc(collection(db, 'notifications'), {
          userId: targetUid,
          title: '👤 নতুন ফ্রেন্ড রিকোয়েস্ট',
          message: `${userProfile?.name || user.displayName || 'একজন পুঠিয়াবাসী'} আপনাকে বন্ধুত্বের অনুরোধ পাঠিয়েছেন।`,
          type: 'friend_request',
          link: '/friends',
          read: false,
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.warn("Notification dispatch skipped:", e);
      }

      toast.success(`${targetUser.name || 'ব্যবহারকারী'}-কে বন্ধুত্বের অনুরোধ পাঠানো হয়েছে!`);
    } catch (err) {
      console.error("Error sending friend request:", err);
      toast.error("অনুরোধ পাঠানো সম্ভব হয়নি। আবার চেষ্টা করুন।");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action: Cancel Outgoing Friend Request
  const handleCancelRequest = async (targetUid: string) => {
    if (!user) return;
    setActionLoadingId(targetUid);
    const requestId = `${user.uid}_${targetUid}`;

    try {
      await deleteDoc(doc(db, 'friend_requests', requestId));

      try {
        await updateDoc(doc(db, 'users', user.uid), {
          friendRequestsSent: arrayRemove(targetUid)
        });
        await updateDoc(doc(db, 'users', targetUid), {
          friendRequestsReceived: arrayRemove(user.uid)
        });
      } catch (e) {}

      toast.success("অনুরোধ প্রত্যাহার করা হয়েছে।");
    } catch (err) {
      console.error("Error canceling request:", err);
      toast.error("অনুরোধ বাতিল করা যায়নি।");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action: Accept / Confirm Incoming Friend Request
  const handleAcceptRequest = async (req: FriendRequestItem) => {
    if (!user) return;
    setActionLoadingId(req.senderId);

    try {
      // 1. Update request status to accepted
      await updateDoc(doc(db, 'friend_requests', req.id), {
        status: 'accepted',
        acceptedAt: Date.now()
      });

      // 2. Add each other to friends array
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          friends: arrayUnion(req.senderId),
          friendsCount: increment(1),
          friendRequestsReceived: arrayRemove(req.senderId)
        });
        await updateDoc(doc(db, 'users', req.senderId), {
          friends: arrayUnion(user.uid),
          friendsCount: increment(1),
          friendRequestsSent: arrayRemove(user.uid)
        });
      } catch (e) {}

      // 3. Dispatch notification to sender
      try {
        await addDoc(collection(db, 'notifications'), {
          userId: req.senderId,
          title: '🤝 বন্ধুত্বের অনুরোধ গৃহীত হয়েছে!',
          message: `${userProfile?.name || user.displayName || 'আপনার বন্ধু'} আপনার ফ্রেন্ড রিকোয়েস্ট গ্রহণ করেছেন।`,
          type: 'friend_accepted',
          link: `/profile/${user.uid}`,
          read: false,
          createdAt: serverTimestamp()
        });
      } catch (e) {}

      toast.success(`🤝 আপনি এখন ${req.senderName}-এর সাথে সংযুক্ত!`);
    } catch (err) {
      console.error("Error accepting request:", err);
      toast.error("রিকোয়েস্ট গ্রহণ করতে সমস্যা হয়েছে।");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action: Delete / Decline Incoming Friend Request
  const handleRejectRequest = async (req: FriendRequestItem) => {
    if (!user) return;
    setActionLoadingId(req.senderId);

    try {
      await deleteDoc(doc(db, 'friend_requests', req.id));

      try {
        await updateDoc(doc(db, 'users', user.uid), {
          friendRequestsReceived: arrayRemove(req.senderId)
        });
        await updateDoc(doc(db, 'users', req.senderId), {
          friendRequestsSent: arrayRemove(user.uid)
        });
      } catch (e) {}

      toast.info("অনুরোধ মুছে ফেলা হয়েছে।");
    } catch (err) {
      console.error("Error rejecting request:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action: Unfriend Confirmation & Execution
  const handleExecuteUnfriend = async () => {
    if (!user || !unfriendModalTarget) return;
    const targetUid = unfriendModalTarget.uid || unfriendModalTarget.id;

    try {
      // Find request docs if any
      const reqId1 = `${user.uid}_${targetUid}`;
      const reqId2 = `${targetUid}_${user.uid}`;
      await deleteDoc(doc(db, 'friend_requests', reqId1)).catch(() => {});
      await deleteDoc(doc(db, 'friend_requests', reqId2)).catch(() => {});

      try {
        await updateDoc(doc(db, 'users', user.uid), {
          friends: arrayRemove(targetUid),
          friendsCount: increment(-1)
        });
        await updateDoc(doc(db, 'users', targetUid), {
          friends: arrayRemove(user.uid),
          friendsCount: increment(-1)
        });
      } catch (e) {}

      toast.success(`${unfriendModalTarget.name || 'বন্ধু'}-কে ফ্রেন্ডলিস্ট থেকে সরানো হয়েছে।`);
      setUnfriendModalTarget(null);
    } catch (err) {
      console.error("Error unfriending:", err);
      toast.error("আনফ্রেন্ড করা সম্ভব হয়নি।");
    }
  };

  // Action: Open or Start Direct Chat with a Friend
  const handleOpenChatWithFriend = async (friend: any) => {
    const friendUid = friend.uid || friend.id;
    if (!friendUid) return;

    if (!user) {
      toast.error("মেসেজ পাঠাতে অনুগ্রহ করে লগইন করুন");
      return;
    }

    const friendUser: UserInfo = {
      uid: friendUid,
      name: friend.name || friend.displayName || 'বন্ধু',
      photoURL: friend.photoURL || friend.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${friendUid}`,
      isOnline: Boolean(friend.isOnline ?? true)
    };

    const currentUserInfo: UserInfo = {
      uid: user.uid,
      name: userProfile?.name || user.displayName || 'সম্মানিত নাগরিক',
      photoURL: userProfile?.photoURL || user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      isOnline: true
    };

    try {
      setActionLoadingId(friendUid);
      const convId = await chatService.startDirectConversation(currentUserInfo, friendUser);
      navigate(`/messages?chat=${convId}`, { state: { chatId: convId, targetUser: friendUser } });
    } catch (err) {
      console.error("Error starting conversation:", err);
      navigate('/messages');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col font-sans select-none">
      <SEO 
        title="বন্ধুরা - পুঠিয়া সোশ্যাল" 
        description="পুঠিয়া উপজেলার সহ-নাগরিকদের সাথে বন্ধুত্ব ও সংযোগ স্থাপন করুন।"
      />

      {/* Standard Facebook Header */}
      <AddaFacebookHeader />

      {/* Main Friends Canvas */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        {/* ========================================================================= */}
        {/* 1. TOP TITLE & SEARCH BAR                                                 */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs mb-3">
          <div className="flex items-center justify-between gap-2.5 mb-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#0B7A3B] flex items-center justify-center font-black shrink-0">
                <Users size={20} strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                  বন্ধুরা
                </h1>
                <p className="text-[11px] sm:text-xs font-medium text-slate-500 mt-1 truncate">
                  পুঠিয়ার সহ-নাগরিকদের সাথে পরিচিত হোন ও সংযোগ বাড়ান
                </p>
              </div>
            </div>

            {/* Quick Count Badge - Strictly Single Line */}
            <div className="shrink-0 flex items-center">
              <span className="inline-flex items-center justify-center px-3 py-1.5 bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-black rounded-full whitespace-nowrap">
                {friendsList.length} জন বন্ধু
              </span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="নাম, গ্রাম বা ইউনিয়ন দিয়ে মানুষ খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100/90 border border-transparent focus:border-emerald-300 focus:bg-white rounded-full pl-9 pr-9 py-2 text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Facebook-style Horizontal Filter Chips */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar scrollbar-none pt-0.5 pb-1 -mx-0.5 px-0.5 touch-pan-x scroll-smooth">
            <button
              onClick={() => setActiveFilter('suggestions')}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-black transition whitespace-nowrap cursor-pointer border ${
                activeFilter === 'suggestions'
                  ? 'bg-[#0B7A3B] text-white border-[#0B7A3B] shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-transparent'
              }`}
            >
              সাজেশন
            </button>

            <button
              onClick={() => setActiveFilter('friends')}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-black transition whitespace-nowrap cursor-pointer border ${
                activeFilter === 'friends'
                  ? 'bg-[#0B7A3B] text-white border-[#0B7A3B] shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-transparent'
              }`}
            >
              আপনার বন্ধুরা ({friendsList.length})
            </button>

            <button
              onClick={() => setActiveFilter('requests')}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-black transition whitespace-nowrap cursor-pointer border flex items-center gap-1.5 ${
                activeFilter === 'requests'
                  ? 'bg-[#0B7A3B] text-white border-[#0B7A3B] shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-transparent'
              }`}
            >
              <span>রিকোয়েস্ট</span>
              {incomingRequests.length > 0 && (
                <span className="min-w-[17px] h-[17px] px-1 bg-[#E11D2E] text-white text-[10px] font-black rounded-full flex items-center justify-center leading-none">
                  {incomingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveFilter('sent')}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-black transition whitespace-nowrap cursor-pointer border ${
                activeFilter === 'sent'
                  ? 'bg-[#0B7A3B] text-white border-[#0B7A3B] shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-transparent'
              }`}
            >
              পাঠানো রিকোয়েস্ট ({outgoingRequests.length})
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. SECTION: FRIEND REQUESTS (ALWAYS PROMINENT IF THERE ARE PENDING REQS)  */}
        {/* ========================================================================= */}
        {incomingRequests.length > 0 && (activeFilter === 'suggestions' || activeFilter === 'requests') && (
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs mb-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-slate-900">
                  ফ্রেন্ড রিকোয়েস্ট
                </span>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[11px] font-black rounded-full">
                  {incomingRequests.length}টি
                </span>
              </div>
              {activeFilter !== 'requests' && (
                <button
                  onClick={() => setActiveFilter('requests')}
                  className="text-xs font-bold text-[#0B7A3B] hover:underline cursor-pointer border-0 bg-transparent"
                >
                  সবগুলো দেখুন
                </button>
              )}
            </div>

            <div className="space-y-3">
              {incomingRequests.map((req) => (
                <div key={req.id} className="flex items-start sm:items-center justify-between gap-3 p-2 hover:bg-slate-50 rounded-xl transition">
                  <Link 
                    to={`/profile/${req.senderId}`}
                    state={{ from: '/friends' }}
                    className="flex items-center gap-3 no-underline group flex-1 min-w-0"
                  >
                    <img 
                      src={req.senderAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${req.senderId}`} 
                      alt={req.senderName}
                      className="w-13 h-13 sm:w-14 sm:h-14 rounded-full object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm sm:text-base font-black text-slate-900 group-hover:text-[#0B7A3B] transition truncate">
                        {req.senderName}
                      </div>
                      <div className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{req.senderUnion || 'পুঠিয়া, রাজশাহী'}</span>
                      </div>
                    </div>
                  </Link>

                  {/* Dual Action Buttons: [Confirm] & [Delete] */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAcceptRequest(req)}
                      disabled={actionLoadingId === req.senderId}
                      className="px-3.5 sm:px-4 py-1.5 sm:py-2 bg-[#0B7A3B] hover:bg-[#096330] text-white text-xs font-black rounded-lg sm:rounded-xl transition shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      নিশ্চিত করুন
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req)}
                      disabled={actionLoadingId === req.senderId}
                      className="px-3.5 sm:px-4 py-1.5 sm:py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-black rounded-lg sm:rounded-xl transition active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      মুছে ফেলুন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. SECTION CONTENT SWITCHER BY ACTIVE FILTER                              */}
        {/* ========================================================================= */}

        {/* TAB: SUGGESTIONS (PEOPLE YOU MAY KNOW) */}
        {activeFilter === 'suggestions' && (
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5">
                <Sparkles size={16} className="text-amber-500" />
                <span>যেসব মানুষদের আপনি চিনতে পারেন</span>
              </h2>
              <span className="text-xs font-bold text-slate-400">
                {filteredSuggestions.length} জন নাগরিক
              </span>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <RefreshCw size={24} className="animate-spin text-[#0B7A3B]" />
                <span className="text-xs font-bold">পুঠিয়ার নাগরিকদের তথ্য লোড হচ্ছে...</span>
              </div>
            ) : filteredSuggestions.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <p className="text-sm font-bold">এই মুহূর্তে কোনো নতুন বন্ধু সাজেশন পাওয়া যায়নি।</p>
                <p className="text-xs text-slate-400 mt-1">অনুসন্ধান বক্স ব্যবহার করে নির্দিষ্ট কাউকে খুঁজে নিন।</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSuggestions.map((targetUser) => {
                  const targetUid = targetUser.uid || targetUser.id;
                  const isPending = outgoingRequests.some(r => r.receiverId === targetUid);

                  return (
                    <div 
                      key={targetUid}
                      className="flex items-start sm:items-center justify-between gap-3 p-2.5 hover:bg-slate-50/80 rounded-xl transition border border-transparent hover:border-slate-100"
                    >
                      <Link 
                        to={`/profile/${targetUid}`}
                        state={{ from: '/friends' }}
                        className="flex items-center gap-3 no-underline group flex-1 min-w-0"
                      >
                        <img 
                          src={targetUser.photoURL || targetUser.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${targetUid}`} 
                          alt={targetUser.name || targetUser.displayName}
                          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full object-cover border border-slate-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm sm:text-base font-black text-slate-900 group-hover:text-[#0B7A3B] transition truncate flex items-center gap-1">
                            <span>{targetUser.name || targetUser.displayName || 'সম্মানিত নাগরিক'}</span>
                            {targetUser.verified && (
                              <CheckCircle2 size={14} className="text-emerald-600 shrink-0 fill-emerald-100" />
                            )}
                          </div>
                          <div className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">
                              {targetUser.union ? `${targetUser.union} ইউনিয়ন, পুঠিয়া` : (targetUser.village ? `${targetUser.village}, পুঠিয়া` : 'পুঠিয়া, রাজশাহী')}
                            </span>
                          </div>
                        </div>
                      </Link>

                      {/* Facebook Dual Actions: [Add Friend] & [Remove] */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {isPending ? (
                          <button
                            onClick={() => handleCancelRequest(targetUid)}
                            disabled={actionLoadingId === targetUid}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-200 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-black rounded-lg sm:rounded-xl transition active:scale-95 cursor-pointer disabled:opacity-50"
                            title="অনুরোধ বাতিল করুন"
                          >
                            অনুরোধ পাঠানো হয়েছে
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSendRequest(targetUser)}
                            disabled={actionLoadingId === targetUid}
                            className="px-3.5 sm:px-4 py-1.5 sm:py-2 bg-[#0B7A3B] hover:bg-[#096330] text-white text-xs font-black rounded-lg sm:rounded-xl transition shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <UserPlus size={14} strokeWidth={2.5} />
                            <span>বন্ধু বানান</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setAllUsers(prev => prev.filter(u => (u.uid || u.id) !== targetUid));
                            toast.info("সাজেশন তালিকা থেকে সরানো হয়েছে।");
                          }}
                          className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg sm:rounded-xl transition cursor-pointer"
                          title="সরিয়ে ফেলুন"
                        >
                          সরান
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: YOUR FRIENDS */}
        {activeFilter === 'friends' && (
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                আপনার বন্ধুরা
              </h2>
              <span className="text-xs font-bold text-[#0B7A3B]">
                মোট {filteredFriends.length} জন
              </span>
            </div>

            {filteredFriends.length === 0 ? (
              <div className="py-14 text-center text-slate-500">
                <Users size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">আপনার এখনও কোনো বন্ধু যুক্ত নেই।</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  সাজেশন তালিকা থেকে পুঠিয়ার সহ-নাগরিকদের ফ্রেন্ড রিকোয়েস্ট পাঠিয়ে বন্ধুত্ব শুরু করুন!
                </p>
                <button
                  onClick={() => setActiveFilter('suggestions')}
                  className="mt-4 px-4 py-2 bg-[#0B7A3B] text-white text-xs font-black rounded-xl hover:bg-[#096330] transition cursor-pointer"
                >
                  বন্ধু সাজেশন দেখুন
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFriends.map((friend) => {
                  const friendUid = friend.uid || friend.id;
                  return (
                    <div 
                      key={friendUid}
                      className="flex items-center justify-between gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition"
                    >
                      <Link 
                        to={`/profile/${friendUid}`}
                        state={{ from: '/friends' }}
                        className="flex items-center gap-3 no-underline group flex-1 min-w-0"
                      >
                        <img 
                          src={friend.photoURL || friend.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${friendUid}`} 
                          alt={friend.name || friend.displayName}
                          className="w-13 h-13 rounded-full object-cover border border-slate-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm sm:text-base font-black text-slate-900 group-hover:text-[#0B7A3B] transition truncate">
                            {friend.name || friend.displayName || 'বন্ধু'}
                          </div>
                          <div className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">{friend.union ? `${friend.union} ইউনিয়ন` : 'পুঠিয়া'}</span>
                          </div>
                        </div>
                      </Link>

                      {/* Chat & Unfriend Buttons */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <button
                          onClick={() => handleOpenChatWithFriend(friend)}
                          disabled={actionLoadingId === (friend.uid || friend.id)}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0B7A3B] text-xs font-black rounded-lg sm:rounded-xl transition active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          title="মেসেজ পাঠান"
                        >
                          <MessageCircle size={14} />
                          <span>মেসেজ</span>
                        </button>

                        <button
                          onClick={() => setUnfriendModalTarget(friend)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg sm:rounded-xl transition cursor-pointer"
                          title="আনফ্রেন্ড করুন"
                        >
                          <UserMinus size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: REQUESTS (INCOMING) */}
        {activeFilter === 'requests' && (
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                আগত ফ্রেন্ড রিকোয়েস্ট
              </h2>
              <span className="text-xs font-bold text-slate-500">
                {incomingRequests.length}টি পেন্ডিং
              </span>
            </div>

            {incomingRequests.length === 0 ? (
              <div className="py-14 text-center text-slate-500">
                <UserCheck size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">কোনো নতুন ফ্রেন্ড রিকোয়েস্ট নেই।</p>
                <p className="text-xs text-slate-400 mt-1">কেউ আপনাকে বন্ধুত্বের অনুরোধ পাঠালে তা এখানে প্রদর্শিত হবে।</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incomingRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition">
                    <Link 
                      to={`/profile/${req.senderId}`}
                      state={{ from: '/friends' }}
                      className="flex items-center gap-3 no-underline group flex-1 min-w-0"
                    >
                      <img 
                        src={req.senderAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${req.senderId}`} 
                        alt={req.senderName}
                        className="w-13 h-13 rounded-full object-cover border border-slate-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm sm:text-base font-black text-slate-900 group-hover:text-[#0B7A3B] transition truncate">
                          {req.senderName}
                        </div>
                        <div className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{req.senderUnion || 'পুঠিয়া, রাজশাহী'}</span>
                        </div>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAcceptRequest(req)}
                        disabled={actionLoadingId === req.senderId}
                        className="px-3.5 sm:px-4 py-1.5 sm:py-2 bg-[#0B7A3B] hover:bg-[#096330] text-white text-xs font-black rounded-lg sm:rounded-xl transition shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        নিশ্চিত করুন
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req)}
                        disabled={actionLoadingId === req.senderId}
                        className="px-3.5 sm:px-4 py-1.5 sm:py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-black rounded-lg sm:rounded-xl transition active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        মুছে ফেলুন
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: SENT REQUESTS */}
        {activeFilter === 'sent' && (
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                পাঠানো ফ্রেন্ড রিকোয়েস্ট
              </h2>
              <span className="text-xs font-bold text-slate-500">
                {outgoingRequests.length}টি অনুরোধ অপেক্ষমান
              </span>
            </div>

            {outgoingRequests.length === 0 ? (
              <div className="py-14 text-center text-slate-500">
                <Clock size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">বর্তমানে কোনো পাঠানো অনুরোধ নেই।</p>
                <p className="text-xs text-slate-400 mt-1">আপনি কাউকে ফ্রেন্ড রিকোয়েস্ট পাঠালে তা এখানে দেখতে পারবেন।</p>
              </div>
            ) : (
              <div className="space-y-3">
                {outgoingRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition">
                    <Link 
                      to={`/profile/${req.receiverId}`}
                      state={{ from: '/friends' }}
                      className="flex items-center gap-3 no-underline group flex-1 min-w-0"
                    >
                      <img 
                        src={req.receiverAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${req.receiverId}`} 
                        alt={req.receiverName}
                        className="w-13 h-13 rounded-full object-cover border border-slate-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm sm:text-base font-black text-slate-900 group-hover:text-[#0B7A3B] transition truncate">
                          {req.receiverName || 'সম্মানিত নাগরিক'}
                        </div>
                        <div className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock size={12} className="text-slate-400 shrink-0" />
                          <span>অনুরোধ পাঠানো হয়েছে</span>
                        </div>
                      </div>
                    </Link>

                    <button
                      onClick={() => handleCancelRequest(req.receiverId)}
                      disabled={actionLoadingId === req.receiverId}
                      className="px-3.5 sm:px-4 py-1.5 sm:py-2 bg-slate-200 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-black rounded-lg sm:rounded-xl transition active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      বাতিল করুন
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Unfriend Confirm Modal */}
      {unfriendModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <UserMinus size={24} />
            </div>
            <h3 className="text-base font-black text-slate-900">
              {unfriendModalTarget.name || 'বন্ধু'}-কে আনফ্রেন্ড করতে চান?
            </h3>
            <p className="text-xs text-slate-500 mt-1.5">
              আনফ্রেন্ড করলে উনি আপনার ফ্রেন্ডলিস্ট থেকে অপসারিত হবেন।
            </p>
            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={() => setUnfriendModalTarget(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                onClick={handleExecuteUnfriend}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-2xs"
              >
                হ্যাঁ, আনফ্রেন্ড করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
};

export default FriendsPage;
