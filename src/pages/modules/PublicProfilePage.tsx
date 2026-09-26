import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  updateDoc
} from "firebase/firestore";
import { db } from "../../firebase";
import { UserProfile, useAuth } from "../../contexts/AuthContext";
import { Reel } from "../../types";
import { useSocial } from "../../hooks/useSocial";
import { 
  ArrowLeft, 
  MapPin, 
  CheckCircle2, 
  Users, 
  Phone, 
  ShieldCheck, 
  Calendar, 
  Briefcase, 
  Share2, 
  Check, 
  AlertCircle, 
  UserCheck, 
  GraduationCap, 
  Lock, 
  Video, 
  Play, 
  Eye, 
  MessageCircle,
  Search,
  MoreVertical,
  Camera,
  Edit2,
  Plus,
  Home,
  Cake,
  Heart,
  Smile
} from "lucide-react";
import { chatService } from "../../services/chatService";
import { UserInfo } from "../../types";
import { motion, AnimatePresence } from "motion/react";
import SEO from "../../components/SEO";
import { useCall } from "../../contexts/CallContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";

interface UserContribution {
  id: string;
  title: string;
  category: string;
  categoryTitle?: string;
  status: "approved" | "pending" | "rejected";
  createdAt: string | number;
  phone?: string;
  address?: string;
  imageUrl?: string;
  serviceKey?: string;
}

const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { userProfile: currentUserProfile, user } = useAuth();
  const [targetUserProfile, setTargetUserProfile] = useState<any | null>(null);
  const [contributions, setContributions] = useState<UserContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "reels" | "photos">("all");
  const [userReels, setUserReels] = useState<Reel[]>([]);
  const [copied, setCopied] = useState(false);
  const [userPostsCount, setUserPostsCount] = useState(0);
  const [userPhotos, setUserPhotos] = useState<string[]>([]);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  const { followUser, unfollowUser, sendFriendRequest, cancelFriendRequest, acceptFriendRequest, removeFriend } = useSocial();
  const navigate = useNavigate();
  const location = useLocation();
  const [friendActionLoading, setFriendActionLoading] = useState(false);
  const { initiateCall } = useCall();

  // Hidden file inputs
  const coverInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  // Edit Modals State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalType, setEditModalType] = useState<"details" | "education" | "note" | "bio">("details");
  const [nameInput, setNameInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [statusNoteInput, setStatusNoteInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [hometownInput, setHometownInput] = useState("");
  const [birthdayInput, setBirthdayInput] = useState("");
  const [professionalCategoryInput, setProfessionalCategoryInput] = useState("");
  const [educationInput, setEducationInput] = useState("");

  const handleStartAudioCall = () => {
    if (!targetUserProfile) return;
    initiateCall(
      {
        uid: targetUserProfile.uid,
        name: targetUserProfile.name || 'নাগরিক',
        photoURL: targetUserProfile.photoURL || '',
        phone: targetUserProfile.phone || ''
      },
      'audio'
    );
  };

  const handleStartVideoCall = () => {
    if (!targetUserProfile) return;
    initiateCall(
      {
        uid: targetUserProfile.uid,
        name: targetUserProfile.name || 'নাগরিক',
        photoURL: targetUserProfile.photoURL || '',
        phone: targetUserProfile.phone || ''
      },
      'video'
    );
  };

  const handleOpenChat = async () => {
    if (!targetUserProfile) return;
    if (!user) {
      navigate('/login');
      return;
    }
    const targetUser: UserInfo = {
      uid: targetUserProfile.uid,
      name: targetUserProfile.name || 'সম্মানিত নাগরিক',
      photoURL: targetUserProfile.photoURL || '',
      isOnline: true
    };
    const currentUserInfo: UserInfo = {
      uid: user.uid,
      name: currentUserProfile?.name || user.displayName || 'সম্মানিত নাগরিক',
      photoURL: currentUserProfile?.photoURL || user.photoURL || '',
      isOnline: true
    };

    try {
      const convId = await chatService.startDirectConversation(currentUserInfo, targetUser);
      navigate(`/messages?chat=${convId}`, { state: { chatId: convId, targetUser } });
    } catch (err) {
      console.error("Failed to start chat from profile:", err);
      navigate('/messages');
    }
  };

  // Image compressor helper (zero-dependency HTML Canvas base64 compiler)
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800; // Optimal profile/cover sizing
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          resolve(compressedDataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const toastId = toast.loading("⏳ কভার ফটো অপ্টিমাইজ ও আপলোড করা হচ্ছে...");
    try {
      const compressed = await compressImage(file);
      await updateDoc(doc(db, "users", user.uid), {
        coverURL: compressed
      });
      toast.success("📷 কভার ফটো সফলভাবে পরিবর্তন করা হয়েছে!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("কভার ফটো আপলোড ব্যর্থ হয়েছে।", { id: toastId });
    }
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const toastId = toast.loading("⏳ প্রোফাইল ফটো অপ্টিমাইজ ও আপলোড করা হচ্ছে...");
    try {
      const compressed = await compressImage(file);
      await updateDoc(doc(db, "users", user.uid), {
        photoURL: compressed
      });
      toast.success("📷 প্রোফাইল ফটো সফলভাবে পরিবর্তন করা হয়েছে!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("প্রোফাইল ফটো আপলোড ব্যর্থ হয়েছে।", { id: toastId });
    }
  };

  const handleEditNoteClick = () => {
    setEditModalType("note");
    setStatusNoteInput(targetUserProfile.statusNote || "");
    setShowEditModal(true);
  };

  const handleEditBioClick = () => {
    setEditModalType("bio");
    setBioInput(targetUserProfile.bio || "");
    setShowEditModal(true);
  };

  const handleEditDetailsClick = () => {
    setEditModalType("details");
    setNameInput(targetUserProfile.name || "");
    setUsernameInput(targetUserProfile.username || targetUserProfile.nickname || "");
    setLocationInput(targetUserProfile.location || "Natore");
    setHometownInput(targetUserProfile.hometown || "Rajshahi");
    setBirthdayInput(targetUserProfile.birthday || "12 October");
    setProfessionalCategoryInput(targetUserProfile.professionalCategory || "Digital creator");
    setShowEditModal(true);
  };

  const handleEditEducationClick = () => {
    setEditModalType("education");
    setEducationInput(targetUserProfile.education || "N.S. Government College, Natore");
    setShowEditModal(true);
  };

  const handleSaveProfileData = async () => {
    if (!user) return;
    const toastId = toast.loading("⏳ তথ্য সংরক্ষণ করা হচ্ছে...");
    try {
      const userRef = doc(db, "users", user.uid);
      if (editModalType === "note") {
        await updateDoc(userRef, { statusNote: statusNoteInput.trim() });
      } else if (editModalType === "bio") {
        await updateDoc(userRef, { bio: bioInput.trim() });
      } else if (editModalType === "details") {
        await updateDoc(userRef, {
          name: nameInput.trim() || targetUserProfile.name,
          username: usernameInput.trim().toLowerCase().replace(/[^a-z0-9_.]/g, ''),
          location: locationInput.trim(),
          hometown: hometownInput.trim(),
          birthday: birthdayInput.trim(),
          professionalCategory: professionalCategoryInput.trim()
        });
      } else if (editModalType === "education") {
        await updateDoc(userRef, { education: educationInput.trim() });
      }
      toast.success("✅ তথ্য সফলভাবে আপডেট হয়েছে!", { id: toastId });
      setShowEditModal(false);
    } catch (err) {
      console.error("Error saving profile details:", err);
      toast.error("তথ্য সংরক্ষণে ত্রুটি ঘটেছে।", { id: toastId });
    }
  };

  // Load target user profile
  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    const userRef = doc(db, "users", userId);
    const unsubscribe = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          setTargetUserProfile({ uid: snap.id, ...snap.data() } as any);
        } else {
          // Fallback search by username
          getDocs(query(collection(db, "users"), where("username", "==", userId.toLowerCase().trim()), limit(1)))
            .then((qSnap) => {
              if (!qSnap.empty) {
                const uDoc = qSnap.docs[0];
                setTargetUserProfile({ uid: uDoc.id, ...uDoc.data() } as any);
              } else {
                setTargetUserProfile(null);
              }
            })
            .catch(() => setTargetUserProfile(null));
        }
        setLoading(false);
      },
      (error) => {
        console.warn("Error loading user profile:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Load user Reels
  useEffect(() => {
    if (!userId) return;
    try {
      const q = query(
        collection(db, "reels"),
        where("authorId", "==", userId),
        limit(20)
      );
      const unsub = onSnapshot(q, (snap) => {
        const rList: Reel[] = [];
        snap.forEach((d) => {
          const data = d.data();
          if (data.status === 'published' || !data.status) {
            rList.push({ id: d.id, ...data } as Reel);
          }
        });
        setUserReels(rList);
      }, (err) => {
        console.warn("Reels load skipped:", err);
      });
      return () => unsub();
    } catch (e) {
      console.warn("Reels fetch error:", e);
    }
  }, [userId]);

  // Load user's discussions/posts count and photos
  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, "discussions"), 
      where("authorId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setUserPostsCount(snap.size);
      
      const posts: any[] = [];
      const photos: string[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        posts.push({ id: docSnap.id, ...data });
        if (data.imageUrl) photos.push(data.imageUrl);
        if (data.gallery && Array.isArray(data.gallery)) {
          photos.push(...data.gallery);
        }
      });
      setRecentPosts(posts);
      setUserPhotos(photos);
    }, (err) => {
      console.warn("Discussions loader skipped or require index creation:", err);
      // Resilient fallback query without ordering
      const fallbackQuery = query(collection(db, "discussions"), where("authorId", "==", userId));
      getDocs(fallbackQuery).then(snap => {
        setUserPostsCount(snap.size);
        const posts: any[] = [];
        const photos: string[] = [];
        snap.forEach(docSnap => {
          const data = docSnap.data();
          posts.push({ id: docSnap.id, ...data });
          if (data.imageUrl) photos.push(data.imageUrl);
          if (data.gallery && Array.isArray(data.gallery)) {
            photos.push(...data.gallery);
          }
        });
        setRecentPosts(posts);
        setUserPhotos(photos);
      }).catch(err2 => console.warn(err2));
    });

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#1877F2] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 font-bold text-sm">নাগরিক প্রোফাইল লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!targetUserProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-4">
          <AlertCircle size={36} />
        </div>
        <h2 className="text-xl font-black text-slate-800">নাগরিক প্রোফাইল পাওয়া যায়নি</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-sm">
          এই ব্যবহারকারী অ্যাকাউন্টটি নিষ্ক্রিয় অথবা আইডি নম্বরটি ভুল।
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 px-6 py-2.5 bg-[#006a4e] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer border-none"
        >
          হোমপেজে ফিরে যান
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUserProfile?.uid === targetUserProfile.uid || user?.uid === targetUserProfile.uid;
  const isFollowing = currentUserProfile?.following?.includes(targetUserProfile.uid);
  const isFriend = currentUserProfile?.friends?.includes(targetUserProfile.uid);
  const isRequested = currentUserProfile?.friendRequestsSent?.includes(targetUserProfile.uid);
  const hasPendingRequest = currentUserProfile?.friendRequestsReceived?.includes(targetUserProfile.uid);

  const handleFollowToggle = async () => {
    if (!currentUserProfile) {
      navigate("/login");
      return;
    }
    if (isFollowing) {
      await unfollowUser(currentUserProfile.uid, targetUserProfile.uid);
    } else {
      await followUser(currentUserProfile.uid, targetUserProfile.uid);
    }
  };

  const handleFriendAction = async () => {
    if (!currentUserProfile) {
      navigate("/login");
      return;
    }
    setFriendActionLoading(true);
    try {
      if (isFriend) {
        if (window.confirm("আপনি কি আনফ্রেন্ড করতে চান?")) {
          await removeFriend(currentUserProfile.uid, targetUserProfile.uid);
        }
      } else if (hasPendingRequest) {
        await acceptFriendRequest(currentUserProfile.uid, targetUserProfile.uid);
      } else if (isRequested) {
        await cancelFriendRequest(currentUserProfile.uid, targetUserProfile.uid);
      } else {
        await sendFriendRequest(currentUserProfile.uid, targetUserProfile.uid);
      }
    } catch (err) {
      console.error("Friend action error:", err);
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `${targetUserProfile.name} - স্মার্ট পুঠিয়া প্রোফাইল`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("প্রোফাইল লিংক কপি করা হয়েছে!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toBengali = (num: number) => {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, d => bnDigits[parseInt(d, 10)]);
  };

  const followersCount = targetUserProfile.followersCount || targetUserProfile.followers?.length || 0;
  const followingCount = targetUserProfile.followingCount || targetUserProfile.following?.length || 0;

  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // 1. If explicit origin path is passed in router state
    const stateFrom = (location.state as { from?: string } | null)?.from;
    if (stateFrom && typeof stateFrom === "string") {
      navigate(stateFrom);
      return;
    }

    // 2. If history stack within our app exists and has prior routes
    if (window.history.state && typeof window.history.state.idx === "number" && window.history.state.idx > 0) {
      navigate(-1);
      return;
    }

    // 3. Fallback when opened directly, reloaded, or history stack is 0
    if (isOwnProfile) {
      navigate("/profile");
    } else {
      navigate("/discussion");
    }
  };

  return (
    <div className="bg-white min-h-screen font-sans pb-24">
      {/* SEO metadata */}
      <SEO
        title={`${targetUserProfile.name} - নাগরিক প্রোফাইল`}
        description={`${targetUserProfile.name} - পুঠিয়া উপজেলার নিবন্ধিত নাগরিক। অবস্থান: ${targetUserProfile.union || "পুঠিয়া"}, রাজশাহী।`}
        image={targetUserProfile.photoURL || undefined}
        path={`/profile/${targetUserProfile.uid}`}
        type="profile"
      />

      {/* 1. Header Navigation Bar (Matching Screenshot with >=44px mobile touch target) */}
      <div className="bg-white sticky top-0 z-40 px-3 py-2 flex items-center justify-between border-b border-slate-100 shadow-2xs">
        <button
          type="button"
          onClick={handleBack}
          aria-label="ফিরে যান"
          className="w-11 h-11 -ml-1 rounded-full flex items-center justify-center text-slate-800 hover:text-blue-600 hover:bg-slate-100 active:bg-slate-200 active:scale-95 transition-all cursor-pointer border-0 bg-transparent shrink-0 touch-manipulation select-none"
        >
          <ArrowLeft size={22} className="stroke-[2.5]" />
        </button>
        <span className="text-slate-900 font-bold text-base md:text-lg tracking-wide truncate max-w-[180px] sm:max-w-xs">
          {targetUserProfile.name}
        </span>
        <div className="flex items-center gap-1.5 text-slate-800">
          {isOwnProfile && (
            <button 
              type="button"
              onClick={handleEditDetailsClick}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:text-blue-600 hover:bg-slate-100 active:scale-95 transition cursor-pointer border-0 bg-transparent"
              title="এডিট প্রোফাইল"
              aria-label="এডিট প্রোফাইল"
            >
              <Edit2 size={18} />
            </button>
          )}
          <button 
            type="button"
            className="w-10 h-10 rounded-full flex items-center justify-center hover:text-blue-600 hover:bg-slate-100 active:scale-95 transition cursor-pointer border-0 bg-transparent"
            title="মেনু"
            aria-label="মেনু"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto">
        {/* Hidden File Inputs */}
        <input 
          type="file" 
          ref={coverInputRef} 
          onChange={handleCoverUpload} 
          accept="image/*" 
          className="hidden" 
        />
        <input 
          type="file" 
          ref={profileInputRef} 
          onChange={handleProfileUpload} 
          accept="image/*" 
          className="hidden" 
        />

        {/* 2. Cover Photo Section */}
        <div className="h-44 sm:h-56 w-full bg-slate-100 relative overflow-hidden">
          {targetUserProfile.coverURL ? (
            <img 
              src={targetUserProfile.coverURL} 
              alt="Cover Banner" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-600 via-indigo-700 to-sky-900 flex items-center justify-center opacity-85">
              <span className="text-white/40 font-bold text-xs tracking-widest">স্মার্ট পুঠিয়া</span>
            </div>
          )}

          {/* Camera Icon Overlay on Cover (Only for Own Profile) */}
          {isOwnProfile && (
            <button 
              onClick={() => coverInputRef.current?.click()}
              className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition border border-slate-200 cursor-pointer"
              title="কভার ছবি পরিবর্তন"
            >
              <Camera size={15} />
            </button>
          )}
        </div>

        {/* 3. Profile Avatar & Name beside it (Directly in marked box area) */}
        <div className="px-4 relative flex items-end gap-3.5 -mt-10 sm:-mt-12 z-20">
          <div className="relative shrink-0">
            {/* Circular Avatar */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-[3.5px] border-white bg-slate-200 overflow-hidden shadow-md relative">
              {targetUserProfile.photoURL ? (
                <img 
                  src={targetUserProfile.photoURL} 
                  alt={targetUserProfile.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1877F2] to-indigo-600 flex items-center justify-center text-white font-black text-2xl">
                  {targetUserProfile.name?.charAt(0) || "U"}
                </div>
              )}
            </div>

            {/* Camera Icon Overlay on Avatar (Only for Own Profile) */}
            {isOwnProfile && (
              <button 
                onClick={() => profileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-7.5 h-7.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center shadow-md transition border border-white cursor-pointer z-10"
                title="প্রোফাইল ছবি পরিবর্তন"
              >
                <Camera size={14} />
              </button>
            )}
          </div>

          {/* Profile Name & Username in Marked Box Area */}
          <div className="pb-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight truncate">
                {targetUserProfile.name}
              </h2>
              {targetUserProfile.isVerified && (
                <span className="inline-flex items-center text-blue-500 shrink-0" title="যাচাইকৃত নাগরিক">
                  <CheckCircle2 size={18} className="fill-blue-500 text-white" />
                </span>
              )}
              {targetUserProfile.role === "super_admin" && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                  👑 এডমিন
                </span>
              )}
            </div>

            {/* Username */}
            <p className="text-xs sm:text-sm font-bold text-slate-500 mt-0.5 truncate">
              @{targetUserProfile.username || targetUserProfile.nickname || (targetUserProfile.name ? targetUserProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '') : "user")}
            </p>
          </div>
        </div>

        {/* 4. Profile Text Details (Stats, Bio, Custom items) */}
        <div className="px-4.5 pt-3">
          {/* Followers / Following / Posts Counts (Matching Screenshot style) */}
          <p className="text-slate-600 text-xs sm:text-sm font-semibold">
            <span className="text-slate-900 font-bold">{toBengali(followersCount)}</span> followers • <span className="text-slate-900 font-bold">{toBengali(followingCount)}</span> following • <span className="text-slate-900 font-bold">{toBengali(userPostsCount)}</span> posts
          </p>

          {/* Bio Section with direct edit trigger */}
          <div 
            onClick={isOwnProfile ? handleEditBioClick : undefined}
            className={`mt-2.5 text-slate-700 text-sm leading-relaxed max-w-lg ${
              isOwnProfile ? 'cursor-pointer hover:bg-slate-50 rounded-lg p-1 -ml-1 transition' : ''
            }`}
          >
            {targetUserProfile.bio ? (
              <p className="font-medium whitespace-pre-wrap">{targetUserProfile.bio}</p>
            ) : (
              isOwnProfile && <p className="text-xs text-slate-400 italic font-medium">+ আপনার বায়ো (Bio) যুক্ত করতে এখানে ক্লিক করুন...</p>
            )}
          </div>

          {/* Lives in Location Metadata Row */}
          <div className="mt-3.5 space-y-2">
            {/* Location */}
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-bold">
              <MapPin size={16} className="text-slate-500 shrink-0" />
              <span>{targetUserProfile.location || targetUserProfile.union || "Natore"}</span>
            </div>
          </div>
        </div>

        {/* 5. Action Buttons (Facebook Dashboard / Add Story / Message System - Aligned with screenshot) */}
        <div className="px-4.5 pt-4.5 flex gap-2 w-full">
          {isOwnProfile ? (
            <>
              {/* Dashboard blue button */}
              <button 
                onClick={() => navigate("/profile")}
                className="flex-1 py-2.5 px-4 bg-[#1877F2] text-white hover:bg-blue-600 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition cursor-pointer border-none"
              >
                <span>📊 Dashboard</span>
              </button>

              {/* Add to story grey button */}
              <button 
                onClick={() => navigate("/adda")}
                className="flex-1 py-2.5 px-4 bg-[#e4e6eb] text-[#050505] hover:bg-slate-300 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition cursor-pointer border-none"
              >
                <span>➕ Add to story</span>
              </button>
            </>
          ) : (
            <>
              {/* Message blue button */}
              <button 
                onClick={handleOpenChat}
                className="flex-1 py-2.5 px-4 bg-[#1877F2] text-white hover:bg-blue-600 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition cursor-pointer border-none"
              >
                <MessageCircle size={15} />
                <span>Message</span>
              </button>

              {/* Add/Accept Friend / Unfriend Actions */}
              <button 
                onClick={handleFriendAction}
                disabled={friendActionLoading}
                className="flex-1 py-2.5 px-4 bg-[#e4e6eb] text-[#050505] hover:bg-slate-300 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition cursor-pointer border-none"
              >
                <Users size={15} />
                <span>
                  {isFriend 
                    ? "✓ Friends" 
                    : hasPendingRequest 
                    ? "Accept Request" 
                    : isRequested 
                    ? "Request Sent" 
                    : "Add Friend"}
                </span>
              </button>

              <button 
                onClick={handleFollowToggle}
                className="py-2.5 px-3.5 bg-slate-100 text-slate-800 rounded-xl font-bold text-xs hover:bg-slate-200 transition cursor-pointer border-none"
                title={isFollowing ? "ফলো করা আছে" : "ফলো করুন"}
              >
                <span>{isFollowing ? "Following" : "Follow"}</span>
              </button>
            </>
          )}
        </div>

        {/* 6. Tabs Section: All | Reels | Photos (Matching Screenshot) */}
        <div className="mt-5 border-t border-slate-200/60 bg-white flex sticky top-[53px] z-30 justify-between items-center px-2">
          {[
            { id: "all", label: "All" },
            { id: "reels", label: "Reels" },
            { id: "photos", label: "Photos" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 text-center text-sm font-bold transition-all relative border-none bg-transparent cursor-pointer ${
                activeTab === tab.id 
                  ? "text-[#1877F2] font-extrabold" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.75 bg-[#1877F2] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* 7. Tab Contents */}
        <div className="p-4 space-y-4">
          {activeTab === "all" && (
            <div className="space-y-4">
              {/* Personal Details Panel */}
              <div className="bg-white rounded-2xl p-4.5 border border-slate-200/70 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-slate-900 font-extrabold text-base">Personal details</h3>
                  {isOwnProfile && (
                    <button 
                      onClick={handleEditDetailsClick}
                      className="text-slate-500 hover:text-[#1877F2] transition cursor-pointer border-0 bg-transparent"
                    >
                      <Edit2 size={15} />
                    </button>
                  )}
                </div>

                <div className="space-y-3 text-sm text-slate-800 font-bold">
                  {/* Location (lives in) */}
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-slate-500" />
                    <span>Lives in <span className="text-slate-900">{targetUserProfile.location || targetUserProfile.union || "Natore"}</span></span>
                  </div>

                  {/* Hometown (From) */}
                  <div className="flex items-center gap-3">
                    <Home size={18} className="text-slate-500" />
                    <span>From <span className="text-slate-900">{targetUserProfile.hometown || "Rajshahi"}</span></span>
                  </div>

                  {/* Birthday (Cake Icon) */}
                  <div className="flex items-center gap-3">
                    <Cake size={18} className="text-slate-500" />
                    <span>Born on <span className="text-slate-900">{targetUserProfile.birthday || "12 October"}</span></span>
                  </div>
                </div>

                <button 
                  onClick={handleEditDetailsClick}
                  className="w-full mt-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition"
                >
                  See more details
                </button>
              </div>

              {/* Education Panel */}
              <div className="bg-white rounded-2xl p-4.5 border border-slate-200/70 shadow-xs">
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-slate-900 font-extrabold text-base">Education</h3>
                  {isOwnProfile && (
                    <button 
                      onClick={handleEditEducationClick}
                      className="text-slate-500 hover:text-[#1877F2] transition cursor-pointer border-0 bg-transparent"
                    >
                      <Edit2 size={15} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 border border-slate-200/80">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{targetUserProfile.education || "N.S. Government College, Natore"}</h4>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">পুঠিয়া স্মার্ট পোর্টাল নাগরিক</p>
                  </div>
                </div>
              </div>

              {/* Recent Discussions/Posts of the user */}
              <div className="space-y-3.5">
                <h3 className="text-slate-900 font-extrabold text-base px-1">Recent Posts ({userPostsCount})</h3>
                {recentPosts.length === 0 ? (
                  <div className="bg-slate-50 rounded-2xl p-6 text-center text-slate-500 text-xs border border-dashed border-slate-200 font-semibold">
                    এখনো কোনো আড্ডা পোস্ট শেয়ার করা হয়নি।
                  </div>
                ) : (
                  recentPosts.map((post) => (
                    <div 
                      key={post.id}
                      onClick={() => navigate("/adda")}
                      className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-xs transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <img 
                          src={targetUserProfile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`}
                          alt={post.author}
                          className="w-8.5 h-8.5 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-xs font-black text-slate-900">{post.author}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {post.createdAt?.seconds 
                              ? formatDistanceToNow(post.createdAt.seconds * 1000, { addSuffix: true, locale: bn })
                              : 'কিছুক্ষণ আগে'}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap line-clamp-4 leading-relaxed mb-3">
                        {post.content}
                      </p>
                      {post.imageUrl && (
                        <div className="rounded-xl overflow-hidden max-h-48 border border-slate-100">
                          <img src={post.imageUrl} alt="post visual" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "reels" && (
            <div className="space-y-4">
              {userReels.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-500 text-xs border border-dashed border-slate-200 font-semibold">
                  এখনো কোনো ভিডিও রিলস আপলোড করা হয়নি।
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {userReels.map((reel) => (
                    <div 
                      key={reel.id} 
                      onClick={() => navigate("/reels")}
                      className="aspect-[9/16] rounded-2xl overflow-hidden relative bg-slate-900 shadow-sm cursor-pointer group hover:shadow-md transition"
                    >
                      {reel.thumbnailUrl ? (
                        <img src={reel.thumbnailUrl} alt={reel.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600">
                          <Video size={32} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 text-[10px] font-bold text-white line-clamp-2">
                        {reel.title || "রিলস ভিডিও"}
                      </div>
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/40 backdrop-blur-xs text-[9px] text-white font-extrabold flex items-center gap-1">
                        <Play size={8} className="fill-current text-white" />
                        <span>{reel.viewsCount || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "photos" && (
            <div className="space-y-4">
              {userPhotos.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-500 text-xs border border-dashed border-slate-200 font-semibold">
                  গ্যালারিতে এখনো কোনো ছবি নেই।
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  {userPhotos.map((photo, index) => (
                    <div 
                      key={index}
                      className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200/60 cursor-pointer shadow-2xs hover:shadow-xs hover:scale-102 transition"
                    >
                      <img src={photo} alt={`User uploaded ${index}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 8. Dynamic Edit Modal (Note/Bio/Details/Education - Matches user screenshot updates!) */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md p-5.5 shadow-2xl overflow-hidden border border-slate-100 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h4 className="text-slate-950 font-black text-base">
                  {editModalType === "note" && "✍️ স্ট্যাটাস নোট পরিবর্তন"}
                  {editModalType === "bio" && "✍️ বায়ো (Bio) পরিবর্তন"}
                  {editModalType === "details" && "📋 ব্যক্তিগত তথ্য পরিবর্তন"}
                  {editModalType === "education" && "🏫 শিক্ষাগত যোগ্যতা পরিবর্তন"}
                </h4>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="w-7 h-7 rounded-full hover:bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-sm border-0 bg-transparent cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
                {/* Note Edit */}
                {editModalType === "note" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-400 block">আপনার স্ট্যাটাস নোট (সর্বোচ্চ ২৫ অক্ষর)</label>
                    <input 
                      type="text" 
                      value={statusNoteInput}
                      onChange={(e) => setStatusNoteInput(e.target.value.slice(0, 25))}
                      placeholder="আড্ডায় আছি..."
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-bold focus:outline-none focus:border-[#1877F2]"
                    />
                  </div>
                )}

                {/* Bio Edit */}
                {editModalType === "bio" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-400 block">আপনার বায়ো (Bio)</label>
                    <textarea 
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      placeholder="আপনার সম্পর্কে সংক্ষেপে লিখুন..."
                      rows={3}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-bold focus:outline-none focus:border-[#1877F2] resize-none"
                    />
                  </div>
                )}

                {/* Details Edit */}
                {editModalType === "details" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-400 block">পুরো নাম (Profile Name)</label>
                      <input 
                        type="text" 
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1877F2]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-400 block">ইউজারনেম (Username - @username)</label>
                      <input 
                        type="text" 
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1877F2]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-400 block">পেশা / ক্যাটাগরি (Professional Category)</label>
                      <input 
                        type="text" 
                        value={professionalCategoryInput}
                        onChange={(e) => setProfessionalCategoryInput(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1877F2]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-400 block">বর্তমান ঠিকানা (Lives in)</label>
                      <input 
                        type="text" 
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1877F2]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-400 block">হোমটাউন (From)</label>
                      <input 
                        type="text" 
                        value={hometownInput}
                        onChange={(e) => setHometownInput(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1877F2]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-400 block">জন্ম তারিখ / মাস (Born on)</label>
                      <input 
                        type="text" 
                        value={birthdayInput}
                        onChange={(e) => setBirthdayInput(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1877F2]"
                      />
                    </div>
                  </div>
                )}

                {/* Education Edit */}
                {editModalType === "education" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-400 block">কলেজ / বিশ্ববিদ্যালয়ের নাম (Education)</label>
                    <input 
                      type="text" 
                      value={educationInput}
                      onChange={(e) => setEducationInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1877F2]"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100 shrink-0">
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border-none cursor-pointer"
                >
                  বাতিল
                </button>
                <button 
                  onClick={handleSaveProfileData}
                  className="flex-1 py-2 bg-[#1877F2] hover:bg-blue-600 text-white font-bold text-xs rounded-xl border-none cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicProfilePage;
