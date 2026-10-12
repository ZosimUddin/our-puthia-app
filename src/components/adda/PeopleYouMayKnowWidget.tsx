import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, X, Check, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  limit, 
  serverTimestamp,
  arrayUnion 
} from 'firebase/firestore';
import { toast } from 'sonner';

interface PeopleYouMayKnowWidgetProps {
  onOpenAuthModal?: () => void;
  className?: string;
}

export const PeopleYouMayKnowWidget: React.FC<PeopleYouMayKnowWidgetProps> = ({
  onOpenAuthModal,
  className = ''
}) => {
  const { user, userProfile } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [outgoingUids, setOutgoingUids] = useState<string[]>([]);
  const [friendUids, setFriendUids] = useState<string[]>([]);
  const [dismissedUids, setDismissedUids] = useState<string[]>([]);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  // 1. Fetch recent registered users from Firestore
  useEffect(() => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(30));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => {
          list.push({ uid: d.id, id: d.id, ...d.data() });
        });
        setUsersList(list);
      }, (err) => {
        console.warn("Could not load users for suggestions:", err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Suggestions subscription error:", e);
    }
  }, []);

  // 2. Fetch current user's outgoing requests
  useEffect(() => {
    if (!user) {
      setOutgoingUids([]);
      return;
    }
    try {
      const q = query(collection(db, 'friend_requests'), where('senderId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const uids: string[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data.receiverId && data.status !== 'rejected') {
            uids.push(data.receiverId);
          }
        });
        setOutgoingUids(uids);
      }, (err) => {
        console.warn("Could not fetch outgoing requests:", err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Outgoing requests error:", e);
    }
  }, [user]);

  // 3. Collect friend UIDs from user profile
  useEffect(() => {
    if (userProfile && Array.isArray(userProfile.friends)) {
      setFriendUids(userProfile.friends);
    }
  }, [userProfile]);

  // 4. Filter suggestions
  const suggestions = useMemo(() => {
    const outgoingSet = new Set(outgoingUids);
    const friendSet = new Set(friendUids);
    const dismissedSet = new Set(dismissedUids);

    return usersList
      .filter((u) => {
        const uid = u.uid || u.id;
        if (!uid) return false;
        if (user && uid === user.uid) return false;
        if (outgoingSet.has(uid)) return false;
        if (friendSet.has(uid)) return false;
        if (dismissedSet.has(uid)) return false;
        if (!u.name && !u.displayName && !u.username) return false;
        return true;
      })
      .slice(0, 6);
  }, [usersList, user, outgoingUids, friendUids, dismissedUids]);

  // Handle send friend request
  const handleAddFriend = async (targetUser: any) => {
    if (!user) {
      if (onOpenAuthModal) onOpenAuthModal();
      else toast.info("বন্ধু যোগ করতে অনুগ্রহ করে লগইন করুন");
      return;
    }

    const targetUid = targetUser.uid || targetUser.id;
    if (!targetUid || targetUid === user.uid) return;

    setLoadingActionId(targetUid);
    const requestId = `${user.uid}_${targetUid}`;

    try {
      await setDoc(doc(db, 'friend_requests', requestId), {
        id: requestId,
        senderId: user.uid,
        senderName: userProfile?.name || user.displayName || 'সম্মানিত নাগরিক',
        senderAvatar: userProfile?.photoURL || user.photoURL || '',
        senderUnion: userProfile?.union || 'পুঠিয়া',
        receiverId: targetUid,
        receiverName: targetUser.name || targetUser.displayName || 'সম্মানিত নাগরিক',
        receiverAvatar: targetUser.photoURL || targetUser.avatarUrl || '',
        receiverUnion: targetUser.union || 'পুঠিয়া',
        status: 'pending',
        createdAt: Date.now()
      });

      // Update arrays
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          friendRequestsSent: arrayUnion(targetUid)
        });
        await updateDoc(doc(db, 'users', targetUid), {
          friendRequestsReceived: arrayUnion(user.uid)
        });
      } catch (e) {}

      // Dispatch notification
      try {
        await addDoc(collection(db, 'notifications'), {
          userId: targetUid,
          recipientId: targetUid,
          actorId: user.uid,
          actorName: userProfile?.name || user.displayName || 'সম্মানিত নাগরিক',
          actorAvatar: userProfile?.photoURL || user.photoURL || '',
          title: '👤 নতুন ফ্রেন্ড রিকোয়েস্ট',
          message: `${userProfile?.name || user.displayName || 'একজন পুঠিয়াবাসী'} আপনাকে বন্ধুত্বের অনুরোধ পাঠিয়েছেন।`,
          type: 'friend_request',
          link: '/friends',
          read: false,
          createdAt: serverTimestamp()
        });
      } catch (e) {}

      setOutgoingUids((prev) => [...prev, targetUid]);
      toast.success(`${targetUser.name || 'ব্যবহারকারী'}-কে বন্ধুত্বের অনুরোধ পাঠানো হয়েছে!`);
    } catch (err: any) {
      console.warn("Add friend error:", err);
      toast.error("অনুরোধ পাঠানো সম্ভব হয়নি। আবার চেষ্টা করুন।");
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDismiss = (uid: string) => {
    setDismissedUids((prev) => [...prev, uid]);
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-none sm:rounded-2xl border-y sm:border border-slate-200/80 p-3 sm:p-4 shadow-2xs ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-[16px] font-black text-slate-800 flex items-center gap-2">
          <span>👋</span>
          <span>আপনি হয়তো চেনেন</span>
        </h3>
        <Link 
          to="/friends" 
          className="text-xs font-bold text-[#0B7A3B] hover:text-[#096330] hover:underline flex items-center gap-1 transition"
        >
          <span>সব দেখুন</span>
        </Link>
      </div>

      {/* Horizontal Scrollable Suggestions Carousel (Facebook In-Feed Style) */}
      <div className="flex overflow-x-auto gap-3 pb-2 pt-1 scrollbar-none snap-x">
        {suggestions.map((targetUser) => {
          const targetUid = targetUser.uid || targetUser.id;
          const isPending = outgoingUids.includes(targetUid);

          const isSameVillage = Boolean(
            userProfile?.village && 
            targetUser.village && 
            userProfile.village.trim().toLowerCase() === targetUser.village.trim().toLowerCase()
          );
          const isSameUnion = Boolean(
            userProfile?.union && 
            targetUser.union && 
            userProfile.union.trim().toLowerCase() === targetUser.union.trim().toLowerCase()
          );

          const matchBadge = isSameVillage 
            ? 'একই গ্রামের' 
            : isSameUnion 
            ? 'একই ইউনিয়ন/পৌরসভার' 
            : 'আপনার এলাকার';

          return (
            <div
              key={targetUid}
              className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-100 shadow-md shadow-slate-100/60 relative flex flex-col items-center text-center transition-all hover:shadow-lg min-w-[155px] max-w-[170px] w-[160px] flex-shrink-0 snap-start"
            >
              {/* Dismiss / Close button */}
              <button
                onClick={() => handleDismiss(targetUid)}
                className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center transition cursor-pointer p-0"
                title="লুকিয়ে রাখুন"
              >
                <X size={14} strokeWidth={2.5} />
              </button>

              {/* Profile Image with Cyan/Emerald Ring */}
              <Link 
                to={`/profile/${targetUid}`} 
                state={{ from: '/adda' }}
                className="relative mb-2.5 mt-1 block group"
              >
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full p-1 border-2.5 border-[#10B981] shadow-2xs group-hover:scale-105 transition-transform flex items-center justify-center">
                  {(targetUser.photoURL || targetUser.avatarUrl) ? (
                    <img
                      src={targetUser.photoURL || targetUser.avatarUrl}
                      alt={targetUser.name || 'নাগরিক'}
                      className="w-full h-full rounded-full object-cover bg-slate-100"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xl select-none">
                      {(targetUser.name || 'না').charAt(0)}
                    </div>
                  )}
                </div>
              </Link>

              {/* Name & Match Context */}
              <div className="mb-3 px-1 w-full min-h-[58px] flex flex-col justify-center">
                <Link
                  to={`/profile/${targetUid}`}
                  state={{ from: '/adda' }}
                  className="text-[14px] sm:text-[15px] font-black text-slate-900 leading-snug line-clamp-1 hover:text-[#0B7A3B] transition"
                >
                  {targetUser.name || targetUser.displayName || 'নাগরিক'}
                </Link>
                <p className="text-[11px] font-black text-[#0B7A3B] mt-0.5">
                  {matchBadge}
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5 line-clamp-1">
                  {targetUser.union ? `${targetUser.union} ইউনিয়ন` : targetUser.village || 'পুঠিয়া'}
                </p>
              </div>

              {/* Add Friend Action Button */}
              <button
                onClick={() => handleAddFriend(targetUser)}
                disabled={isPending || loadingActionId === targetUid}
                className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all shadow-2xs active:scale-95 cursor-pointer ${
                  isPending
                    ? 'bg-slate-100 text-slate-400 cursor-default'
                    : 'bg-[#0B7A3B] hover:bg-[#059669] text-white shadow-emerald-200'
                }`}
              >
                {isPending ? (
                  <>
                    <Check size={14} strokeWidth={3} />
                    <span>অনুরোধ পাঠানো হয়েছে</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={15} strokeWidth={2.5} />
                    <span>বন্ধু যোগ করুন</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
