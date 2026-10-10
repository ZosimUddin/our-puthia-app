import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft,
  User, 
  Lock, 
  Shield, 
  Moon, 
  Sun, 
  Globe, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Plus, 
  LayoutGrid, 
  BadgeCheck, 
  Star, 
  Bookmark, 
  Headphones, 
  HelpCircle, 
  FileText, 
  Info, 
  Wallet, 
  Megaphone, 
  Briefcase, 
  ChevronRight, 
  HardDrive, 
  Video, 
  Image as ImageIcon,
  X,
  Check,
  Eye,
  EyeOff,
  Phone,
  Mail,
  ShieldAlert
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth, db } from "../../firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, setDoc } from "firebase/firestore";
import SEO from "../SEO";
import EditProfileModal from "../auth/EditProfileModal";
import { compressImageToBase64 } from "../../api";

export default function Settings() {
  const { user, userProfile, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();

  // 1. Modal States
  const [showPersonalInfoModal, setShowPersonalInfoModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showAmbassadorModal, setShowAmbassadorModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);

  // 2. Profile Lock State
  const [isProfileLocked, setIsProfileLocked] = useState<boolean>(() => {
    return (userProfile as any)?.isProfileLocked ?? false;
  });

  // 3. Cache and Storage Simulation
  const [videoCacheSize, setVideoCacheSize] = useState("101.9 MB");
  const [videoCount, setVideoCount] = useState(61);
  const [imageCacheSize, setImageCacheSize] = useState("10.0 MB");
  const [imageCount, setImageCount] = useState(221);
  const [totalStorageUsed, setTotalStorageUsed] = useState("111.9 MB");
  const [storagePercent, setStoragePercent] = useState(22.4);

  // 4. Personal Info & Editor Profile System State
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState("");

  const handleOpenEditProfileModal = () => {
    const profile: any = userProfile || {};
    const fallbackName = profile.name || user?.displayName || (user?.email ? user.email.split('@')[0] : "Md zosim Uddin");
    const fallbackUsername = profile.username || profile.nickname || fallbackName.toLowerCase().replace(/[^a-z0-9]/g, '') || (user?.email ? user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : "mdzosimuddin");
    const fallbackPhone = profile.phone || user?.phoneNumber || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_registered_phone') || '' : '') || "";
    const fallbackLocation = profile.location || profile.address || (profile.village ? `${profile.village}, ${profile.union || 'পুঠিয়া'}` : (profile.union ? `${profile.union}, পুঠিয়া` : ""));
    
    setEditFormData({
      ...profile,
      name: fallbackName,
      username: fallbackUsername,
      phone: fallbackPhone,
      bio: profile.bio || "",
      birthDate: profile.birthDate || profile.birthday || profile.dob || "",
      birthday: profile.birthday || profile.birthDate || profile.dob || "",
      dob: profile.dob || profile.birthDate || profile.birthday || "",
      gender: profile.gender || "পুরুষ",
      bloodGroup: profile.bloodGroup || "O+",
      location: fallbackLocation,
      address: profile.address || fallbackLocation,
      union: profile.union || "বানেশ্বর",
      hometown: profile.hometown || profile.district || "পুঠিয়া, রাজশাহী",
      relationshipStatus: profile.relationshipStatus || "",
      workCompany: profile.workCompany || profile.workExperience || profile.occupation || "",
      workExperience: profile.workExperience || profile.workCompany || profile.occupation || "",
      workRole: profile.workRole || profile.workPosition || "",
      workList: Array.isArray(profile.workList) ? profile.workList : (profile.workCompany ? [{ id: '1', company: profile.workCompany, position: profile.workRole || '', type: 'Full-time', location: 'পুঠিয়া' }] : []),
      educationList: Array.isArray(profile.educationList) ? profile.educationList : (profile.education || profile.collegeUniversity ? [{ id: '1', institution: profile.education || profile.collegeUniversity, level: 'College / University' }] : []),
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      servicesOffered: Array.isArray(profile.servicesOffered) ? profile.servicesOffered : (Array.isArray(profile.services) ? profile.services : []),
      services: Array.isArray(profile.servicesOffered) ? profile.servicesOffered : (Array.isArray(profile.services) ? profile.services : []),
      highSchool: profile.highSchool || "",
      collegeUniversity: profile.collegeUniversity || profile.education || "",
      education: profile.education || profile.collegeUniversity || "",
      facebook: profile.facebook || "",
      twitter: profile.twitter || "",
      youtube: profile.youtube || "",
      instagram: profile.instagram || profile.instagramUsername || "",
      website: profile.website || "",
      privacySettings: profile.privacySettings || {},
      photoURL: profile.photoURL || user?.photoURL || "",
      coverURL: profile.coverURL || ""
    });
    setEditSuccess(false);
    setEditError("");
    setIsEditProfileModalOpen(true);
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!user) return;
    setEditLoading(true);
    setEditError("");
    try {
      const userRef = doc(db, "users", user.uid);
      const cleanedData: any = {
        ...editFormData,
        name: editFormData.name?.trim() || userProfile?.name || "",
        phone: editFormData.phone?.trim() || userProfile?.phone || "",
        bio: editFormData.bio?.trim() || "",
        username: editFormData.username ? editFormData.username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '') : "",
        birthday: editFormData.birthday || editFormData.birthDate || editFormData.dob || "",
        birthDate: editFormData.birthDate || editFormData.birthday || editFormData.dob || "",
        dob: editFormData.dob || editFormData.birthDate || editFormData.birthday || "",
        gender: editFormData.gender || "",
        bloodGroup: editFormData.bloodGroup || "",
        location: editFormData.location || editFormData.address || "",
        address: editFormData.address || editFormData.location || "",
        union: editFormData.union || "",
        hometown: editFormData.hometown || "",
        relationshipStatus: editFormData.relationshipStatus || "",
        workCompany: editFormData.workCompany || editFormData.workExperience || "",
        workExperience: editFormData.workExperience || editFormData.workCompany || "",
        workRole: editFormData.workRole || "",
        workList: Array.isArray(editFormData.workList) ? editFormData.workList : (userProfile?.workList || []),
        educationList: Array.isArray(editFormData.educationList) ? editFormData.educationList : (userProfile?.educationList || []),
        skills: Array.isArray(editFormData.skills) ? editFormData.skills : (userProfile?.skills || []),
        servicesOffered: Array.isArray(editFormData.servicesOffered) && editFormData.servicesOffered.length > 0
          ? editFormData.servicesOffered
          : (Array.isArray(editFormData.services) ? editFormData.services : ((userProfile as any)?.servicesOffered || userProfile?.services || [])),
        services: Array.isArray(editFormData.servicesOffered) && editFormData.servicesOffered.length > 0
          ? editFormData.servicesOffered
          : (Array.isArray(editFormData.services) ? editFormData.services : ((userProfile as any)?.servicesOffered || userProfile?.services || [])),
        highSchool: editFormData.highSchool || "",
        collegeUniversity: editFormData.collegeUniversity || editFormData.education || "",
        education: editFormData.education || editFormData.collegeUniversity || "",
        facebook: editFormData.facebook || "",
        twitter: editFormData.twitter || "",
        youtube: editFormData.youtube || "",
        instagram: editFormData.instagram || editFormData.instagramUsername || "",
        website: editFormData.website || "",
        privacySettings: editFormData.privacySettings || userProfile?.privacySettings || {},
        photoURL: editFormData.photoURL || userProfile?.photoURL || "",
        coverURL: editFormData.coverURL !== undefined ? editFormData.coverURL : (userProfile?.coverURL || ""),
        updatedAt: Date.now()
      };

      await setDoc(userRef, cleanedData, { merge: true });
      if (updateUserProfile) {
        await updateUserProfile(cleanedData);
      }
      try {
        localStorage.setItem(`cached_user_profile_${user.uid}`, JSON.stringify({ ...(userProfile || {}), ...cleanedData }));
      } catch {}
      setEditSuccess(true);
      toast.success("✅ প্রোফাইল তথ্য সফলভাবে আপডেট ও সংরক্ষিত হয়েছে!");
      setTimeout(() => {
        setIsEditProfileModalOpen(false);
        setEditSuccess(false);
      }, 1000);
    } catch (err: any) {
      console.error("Profile update error:", err);
      setEditError(err.message || "প্রোফাইল আপডেট করতে সমস্যা হয়েছে।");
      toast.error("প্রোফাইল আপডেট ব্যর্থ হয়েছে।");
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const base64 = await compressImageToBase64(file);
      setEditFormData((prev: any) => ({ ...prev, photoURL: base64 }));
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { photoURL: base64, updatedAt: Date.now() }, { merge: true });
      if (updateUserProfile) {
        await updateUserProfile({ photoURL: base64 } as any);
      }
      try {
        localStorage.setItem(`cached_user_profile_${user.uid}`, JSON.stringify({ ...(userProfile || {}), photoURL: base64 }));
      } catch {}
      toast.success("প্রোফাইল ছবি সফলভাবে পরিবর্তন ও সেভ হয়েছে");
    } catch (err) {
      console.error(err);
      toast.error("ছবি আপলোড ব্যর্থ হয়েছে");
    }
  };

  const handleEditProfileCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const base64 = await compressImageToBase64(file);
      setEditFormData((prev: any) => ({ ...prev, coverURL: base64 }));
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { coverURL: base64, updatedAt: Date.now() }, { merge: true });
      if (updateUserProfile) {
        await updateUserProfile({ coverURL: base64 } as any);
      }
      try {
        localStorage.setItem(`cached_user_profile_${user.uid}`, JSON.stringify({ ...(userProfile || {}), coverURL: base64 }));
      } catch {}
      toast.success("কভার ফটো সফলভাবে পরিবর্তন ও সেভ হয়েছে");
    } catch (err) {
      console.error(err);
      toast.error("কভার ফটো আপলোড ব্যর্থ হয়েছে");
    }
  };

  const [nameInput, setNameInput] = useState(userProfile?.name || user?.displayName || "Md zosim Uddin");
  const [emailInput, setEmailInput] = useState(userProfile?.email || user?.email || "mdzosimuddin31@gmail.com");
  const [phoneInput, setPhoneInput] = useState(userProfile?.phone || "01700000000");
  const [bioInput, setBioInput] = useState(userProfile?.bio || "");
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // 5. Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 6. Theme and Language State
  const [selectedTheme, setSelectedTheme] = useState<"system" | "light" | "dark">("system");
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "bn">("en");

  // 7. Verification State
  const [verificationDocType, setVerificationDocType] = useState("NID");
  const [verificationDocNumber, setVerificationDocNumber] = useState("");
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);

  // 8. Wallet State
  const [rechargeAmount, setRechargeAmount] = useState(100);
  const [paymentMethod, setPaymentMethod] = useState<"bkash" | "nagad">("bkash");

  const displayName = userProfile?.name || user?.displayName || "Rj computer";
  const userHandle = (userProfile as any)?.username ? `@${(userProfile as any).username}` : `@${(displayName.toLowerCase().replace(/\s+/g, '-'))}`;
  const avatarUrl = userProfile?.photoURL || user?.photoURL || '/logo.svg';

  // Toggle Profile Lock
  const handleToggleLockProfile = async () => {
    const nextState = !isProfileLocked;
    setIsProfileLocked(nextState);
    try {
      if (updateUserProfile) {
        await updateUserProfile({ isProfileLocked: nextState } as any);
      }
      toast.success(nextState ? "আপনার প্রোফাইল লক করা হয়েছে!" : "প্রোফাইল আনলক করা হয়েছে");
    } catch (e) {
      console.error(e);
      toast.error("সেটিংস আপডেট করতে সমস্যা হয়েছে");
    }
  };

  // Clear Video Cache
  const handleClearVideoCache = () => {
    setVideoCacheSize("0 KB");
    setVideoCount(0);
    setTotalStorageUsed(`${imageCount > 0 ? imageCacheSize : "0 KB"}`);
    setStoragePercent(imageCount > 0 ? 2 : 0);
    toast.success("ভিডিও ক্যাশ সম্পূর্ণ ক্লিয়ার করা হয়েছে!");
  };

  // Clear Image Cache
  const handleClearImageCache = () => {
    setImageCacheSize("0 KB");
    setImageCount(0);
    setTotalStorageUsed(`${videoCount > 0 ? videoCacheSize : "0 KB"}`);
    setStoragePercent(videoCount > 0 ? 20.4 : 0);
    toast.success("ইমেজ ক্যাশ সম্পূর্ণ ক্লিয়ার করা হয়েছে!");
  };

  // Clear All Cache
  const handleClearAllCache = () => {
    setVideoCacheSize("0 KB");
    setVideoCount(0);
    setImageCacheSize("0 KB");
    setImageCount(0);
    setTotalStorageUsed("0 KB");
    setStoragePercent(0);
    try {
      localStorage.removeItem("puthia_cached_media");
      localStorage.removeItem("puthia_feed_cache");
    } catch {}
    toast.success("সকল লোকাল ক্যাশ সফলভাবে মুছে স্টোরেজ খালি করা হয়েছে!");
  };

  // Save Personal Info
  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      toast.error("অনুগ্রহ করে আপনার নাম প্রদান করুন");
      return;
    }
    setIsSavingInfo(true);
    try {
      if (updateUserProfile) {
        await updateUserProfile({
          name: nameInput,
          phone: phoneInput,
          bio: bioInput
        });
      }
      setShowPersonalInfoModal(false);
      toast.success("ব্যক্তিগত তথ্য সফলভাবে আপডেট হয়েছে!");
    } catch (e) {
      toast.error("তথ্য সংরক্ষণে সমস্যা হয়েছে");
    } finally {
      setIsSavingInfo(false);
    }
  };

  // Change Password Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("নতুন পাসওয়ার্ড দুটি মিলছে না");
      return;
    }
    setIsChangingPassword(true);
    try {
      if (user && user.email && currentPassword) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
      }
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      }
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!");
    } catch (err: any) {
      console.error(err);
      toast.error("পাসওয়ার্ড পরিবর্তন করা যায়নি। বর্তমান পাসওয়ার্ডটি সঠিক কি না যাচাই করুন।");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Submit Verification Application
  const handleSubmitVerification = async () => {
    if (!verificationDocNumber.trim()) {
      toast.error("অনুগ্রহ করে ডকুমেন্ট নম্বর প্রদান করুন");
      return;
    }
    setIsSubmittingVerification(true);
    try {
      if (user?.uid) {
        await addDoc(collection(db, "verification_requests"), {
          userId: user.uid,
          userName: displayName,
          docType: verificationDocType,
          docNumber: verificationDocNumber,
          fee: 500,
          status: "pending",
          createdAt: serverTimestamp()
        });
      }
      setShowVerificationModal(false);
      setVerificationDocNumber("");
      toast.success("ভেরিফিকেশন আবেদন জমা হয়েছে! অ্যাডমিন পর্যালোচনার পর ব্যাজ দেওয়া হবে।");
    } catch (e) {
      setShowVerificationModal(false);
      toast.success("আবেদন সফলভাবে গ্রহণ করা হয়েছে!");
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  // Handle Logout
  const handleConfirmLogout = async () => {
    try {
      setShowLogoutModal(false);
      await logout();
      navigate("/adda");
      toast.success("সফলভাবে লগআউট হয়েছেন");
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(user?.uid ? `/profile/${user.uid}` : "/adda");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-16 select-none text-slate-900">
      <SEO 
        title="Settings - সেটিংস" 
        description="আপনার অ্যাকাউন্টের গোপনীয়তা, ক্যাশ ও ব্যক্তিগত সেটিংস পরিচালনা করুন"
        path="/settings"
      />

      {/* ========================================================================= */}
      {/* 1. TOP APP BAR (Back Arrow + Settings Title)                              */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-2xs">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 active:scale-95 transition cursor-pointer border-none bg-transparent shrink-0"
            title="ফিরে যান"
            aria-label="Back"
          >
            <ArrowLeft size={22} className="stroke-[2.5]" />
          </button>
          <h1 className="text-xl font-black text-slate-950 tracking-tight">
            Settings
          </h1>
        </div>
      </header>

      {/* Main Settings Canvas */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-6">

        {/* ========================================================================= */}
        {/* 2. SWITCH ACCOUNT SECTION                                                 */}
        {/* ========================================================================= */}
        <div className="space-y-2.5">
          <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide px-1">
            Switch Account
          </h2>

          <div className="bg-white rounded-3xl p-4 shadow-2xs border border-slate-100/90 space-y-3">
            {/* Active Account Card */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <img 
                  src={avatarUrl} 
                  alt={displayName} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shadow-2xs shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-black text-slate-950 truncate">
                      {displayName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-black border border-emerald-200/60">
                      Active
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-500 truncate mt-0.5">
                    {userHandle}
                  </p>
                </div>
              </div>

              {/* Green Checkmark */}
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <Check size={14} strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. ACCOUNT SECTION                                                        */}
        {/* ========================================================================= */}
        <div className="space-y-2">
          <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide px-1">
            Account
          </h2>

          <div className="bg-white rounded-3xl shadow-2xs border border-slate-100/90 divide-y divide-slate-100 overflow-hidden">
            {/* 3.1 Personal Information */}
            <button
              type="button"
              onClick={handleOpenEditProfileModal}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition cursor-pointer border-none bg-transparent text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <User size={20} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-black text-slate-950">Personal Information</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">Name, email, phone</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 shrink-0" />
            </button>

            {/* 3.2 Change Password */}
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition cursor-pointer border-none bg-transparent text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Lock size={20} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-black text-slate-950">Change Password</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">Update your password</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 shrink-0" />
            </button>

            {/* 3.3 Lock Profile */}
            <div className="w-full flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3.5 min-w-0 pr-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Shield size={20} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-black text-slate-950">Lock Profile</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">Lock your profile to restrict access</p>
                </div>
              </div>

              {/* iOS Style Switch Toggle */}
              <button
                type="button"
                onClick={handleToggleLockProfile}
                className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer border-none shrink-0 ${
                  isProfileLocked ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                    isProfileLocked ? "translate-x-5.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 3.4 Professional Dashboard */}
            <button
              type="button"
              onClick={() => navigate("/professional-dashboard")}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition cursor-pointer border-none bg-transparent text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <LayoutGrid size={20} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-black text-slate-950">Professional Dashboard</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">Insights, monetization & earnings</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 shrink-0" />
            </button>

            {/* 3.5 Verification Badge */}
            <button
              type="button"
              onClick={() => navigate("/get-verified")}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition cursor-pointer border-none bg-transparent text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <BadgeCheck size={20} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-black text-slate-950">Verification Badge</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">Get verified checkmark</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 shrink-0" />
            </button>

            {/* 3.6 Saved Reels */}
            <button
              type="button"
              onClick={() => navigate("/reels")}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition cursor-pointer border-none bg-transparent text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Bookmark size={20} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-black text-slate-950">Saved Reels</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">Your saved reels collection</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. APPEARANCE SECTION                                                     */}
        {/* ========================================================================= */}
        <div className="space-y-2">
          <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide px-1">
            Appearance
          </h2>

          <div className="bg-white rounded-3xl shadow-2xs border border-slate-100/90 divide-y divide-slate-100 overflow-hidden">
            {/* 4.1 Theme */}
            <button
              type="button"
              onClick={() => setShowThemeModal(true)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition cursor-pointer border-none bg-transparent text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Moon size={20} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-black text-slate-950">Theme</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {selectedTheme === "system" ? "System default" : selectedTheme === "light" ? "Light Theme" : "Dark Theme"}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 shrink-0" />
            </button>

            {/* 4.2 Language */}
            <button
              type="button"
              onClick={() => setShowLanguageModal(true)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition cursor-pointer border-none bg-transparent text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Globe size={20} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-black text-slate-950">Language</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {selectedLanguage === "en" ? "English (English)" : "বাংলা (Bangla)"}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. STORAGE SECTION (Matching Screenshot 2 Card)                           */}
        {/* ========================================================================= */}
        <div className="space-y-2">
          <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide px-1">
            Storage
          </h2>

          <div className="bg-white rounded-3xl p-4 shadow-2xs border border-slate-100/90 space-y-4">
            {/* Storage Usage Header & Progress Bar */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <HardDrive size={18} />
                </div>
                <div>
                  <h4 className="text-[14px] font-black text-slate-950">Storage Usage</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{totalStorageUsed} of 500 MB used</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.max(2, storagePercent)}%` }}
                />
              </div>
            </div>

            <div className="pt-1 space-y-3 divide-y divide-slate-100">
              {/* Video Cache */}
              <div className="flex items-center justify-between pt-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Video size={19} className="stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-slate-950">Video Cache</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{videoCount} videos • {videoCacheSize}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearVideoCache}
                  className="px-3 py-1.5 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition cursor-pointer border-none bg-transparent shrink-0"
                >
                  Clear Cache
                </button>
              </div>

              {/* Image Cache */}
              <div className="flex items-center justify-between pt-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <ImageIcon size={19} className="stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-slate-950">Image Cache</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{imageCount} images • {imageCacheSize}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearImageCache}
                  className="px-3 py-1.5 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition cursor-pointer border-none bg-transparent shrink-0"
                >
                  Clear Cache
                </button>
              </div>

              {/* Clear All Cache */}
              <div className="flex items-center justify-between pt-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                    <Trash2 size={19} className="stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-red-500">Clear All Cache</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Free up storage space</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearAllCache}
                  className="px-3 py-1.5 text-xs font-black text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition cursor-pointer border-none bg-transparent shrink-0"
                >
                  Clear All Cache
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6. SUPPORT SECTION                                                        */}
        {/* ========================================================================= */}
        <div className="space-y-2">
          <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide px-1">
            Support
          </h2>

          <div className="bg-white rounded-3xl shadow-2xs border border-slate-100/90 divide-y divide-slate-100 overflow-hidden">
            {/* 6.1 Support Center */}
            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition cursor-pointer border-none bg-transparent text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Headphones size={20} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-black text-slate-950">Support Center</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">Get help from our support team</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 shrink-0" />
            </button>

            {/* 6.2 Help & Support */}
            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition cursor-pointer border-none bg-transparent text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <HelpCircle size={20} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-black text-slate-950">Help & Support</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">Get help with your account</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 shrink-0" />
            </button>

            {/* 6.3 Privacy Policy */}
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition cursor-pointer border-none bg-transparent text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Shield size={20} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-black text-slate-950">Privacy Policy</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 shrink-0" />
            </button>

            {/* 6.4 Terms of Service */}
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition cursor-pointer border-none bg-transparent text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileText size={20} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-black text-slate-950">Terms of Service</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 shrink-0" />
            </button>

            {/* 6.5 About */}
            <button
              type="button"
              onClick={() => setShowAboutModal(true)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition cursor-pointer border-none bg-transparent text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Info size={20} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-black text-slate-950">About</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">Version 2.0.3 (17)</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 7. BUSINESS SECTION                                                       */}
        {/* ========================================================================= */}
        <div className="space-y-2">
          <h2 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide px-1">
            Business
          </h2>

          <div className="bg-white rounded-3xl shadow-2xs border border-slate-100/90 divide-y divide-slate-100 overflow-hidden">
            {/* 7.1 Wallet */}
            <button
              type="button"
              onClick={() => setShowWalletModal(true)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition cursor-pointer border-none bg-transparent text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Wallet size={20} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-black text-slate-950">Wallet</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">Balance & Transactions</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 shrink-0" />
            </button>

            {/* 7.2 My Advertisements */}
            <button
              type="button"
              onClick={() => navigate("/my-ads")}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition cursor-pointer border-none bg-transparent text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Megaphone size={20} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-black text-slate-950">My Advertisements</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">Manage your ads</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 8. LOGOUT & DELETE ACCOUNT BUTTONS                                        */}
        {/* ========================================================================= */}
        <div className="pt-2 space-y-3 pb-8">
          {/* Log Out Button */}
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="w-full py-3.5 px-4 bg-white border border-red-300 hover:border-red-500 text-red-500 hover:bg-red-50/60 active:scale-[0.99] font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer"
          >
            <LogOut size={18} className="stroke-[2.5]" />
            <span>Log Out</span>
          </button>

          {/* Delete Account Button */}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-2 text-slate-500 hover:text-red-600 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border-none bg-transparent"
          >
            <Trash2 size={14} />
            <span>Delete Account</span>
          </button>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 9. SUB-MODALS (Clean White Interactive Dialogs)                           */}
      {/* ========================================================================= */}

      {/* 9.1 Personal Information Modal */}
      <AnimatePresence>
        {showPersonalInfoModal && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-950 text-base">Personal Information</h3>
                <button
                  type="button"
                  onClick={() => setShowPersonalInfoModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center border-0 bg-transparent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSavePersonalInfo} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={emailInput}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-xs sm:text-sm cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Bio</label>
                  <textarea
                    rows={2}
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    placeholder="আপনার সম্পর্কে কিছু লিখুন..."
                    className="w-full mt-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingInfo}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-2xl transition shadow-xs border-0 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingInfo ? "সংরক্ষণ হচ্ছে..." : "তথ্য সংরক্ষণ করুন"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9.2 Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-950 text-base">Change Password</h3>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center border-0 bg-transparent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700">Current Password</label>
                  <input
                    type={showPasswordFields ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="বর্তমান পাসওয়ার্ড লিখুন"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">New Password</label>
                  <input
                    type={showPasswordFields ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="নতুন পাসওয়ার্ড (ন্যূনতম ৬ অক্ষর)"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                  <input
                    type={showPasswordFields ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="নতুন পাসওয়ার্ড পুনরায় লিখুন"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="showPass"
                    checked={showPasswordFields}
                    onChange={(e) => setShowPasswordFields(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <label htmlFor="showPass" className="text-xs text-slate-600 font-medium cursor-pointer">
                    পাসওয়ার্ড প্রদর্শন করুন
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-2xl transition shadow-xs border-0 cursor-pointer disabled:opacity-50"
                  >
                    {isChangingPassword ? "পরিবর্তন হচ্ছে..." : "পাসওয়ার্ড আপডেট করুন"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9.3 Verification Badge Modal */}
      <AnimatePresence>
        {showVerificationModal && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <BadgeCheck size={18} />
                  </div>
                  <h3 className="font-black text-slate-950 text-base">
                    Verification Badge (৳500)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVerificationModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center border-0 bg-transparent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-950">অফিসিয়াল ভেরিফায়েড ব্যাজ</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">এককালীন যাচাইকরণ ফি: ৳৫০০</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-black rounded-full">
                  ৳৫০০
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">যাচাইকরণ নথির ধরন</label>
                <div className="grid grid-cols-3 gap-2">
                  {["NID", "Passport", "Trade License"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setVerificationDocType(type)}
                      className={`py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        verificationDocType === type
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">ডকুমেন্ট / এনআইডি নম্বর</label>
                <input
                  type="text"
                  value={verificationDocNumber}
                  onChange={(e) => setVerificationDocNumber(e.target.value)}
                  placeholder="নম্বর লিখুন..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isSubmittingVerification}
                  onClick={handleSubmitVerification}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-2xl transition shadow-xs border-0 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingVerification ? "আবেদন জমা হচ্ছে..." : "আবেদন সম্পন্ন করুন"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9.4 Theme Modal */}
      <AnimatePresence>
        {showThemeModal && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-950 text-base">Select Theme</h3>
                <button
                  type="button"
                  onClick={() => setShowThemeModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center border-0 bg-transparent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { id: "system", label: "System default", icon: HardDrive },
                  { id: "light", label: "Light Theme", icon: Sun },
                  { id: "dark", label: "Dark Theme", icon: Moon }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSel = selectedTheme === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedTheme(item.id as any);
                        setShowThemeModal(false);
                        toast.success(`${item.label} সংরক্ষিত হয়েছে`);
                      }}
                      className={`w-full p-3.5 rounded-2xl flex items-center justify-between border transition cursor-pointer ${
                        isSel ? "border-emerald-600 bg-emerald-50/50 text-emerald-700 font-black" : "border-slate-200 bg-white text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} />
                        <span className="text-xs sm:text-sm font-bold">{item.label}</span>
                      </div>
                      {isSel && <Check size={16} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9.5 Language Modal */}
      <AnimatePresence>
        {showLanguageModal && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-950 text-base">Select Language</h3>
                <button
                  type="button"
                  onClick={() => setShowLanguageModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center border-0 bg-transparent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { id: "en", label: "English (English)" },
                  { id: "bn", label: "বাংলা (Bangla)" }
                ].map((item) => {
                  const isSel = selectedLanguage === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedLanguage(item.id as any);
                        setShowLanguageModal(false);
                        toast.success(`${item.label} ভাষা নির্বাচিত হয়েছে`);
                      }}
                      className={`w-full p-3.5 rounded-2xl flex items-center justify-between border transition cursor-pointer ${
                        isSel ? "border-emerald-600 bg-emerald-50/50 text-emerald-700 font-black" : "border-slate-200 bg-white text-slate-800"
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-bold">{item.label}</span>
                      {isSel && <Check size={16} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9.6 Wallet Modal */}
      <AnimatePresence>
        {showWalletModal && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Wallet size={18} />
                  </div>
                  <h3 className="font-black text-slate-950 text-base">Wallet & Balance</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWalletModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center border-0 bg-transparent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Balance Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-tr from-[#0B7A3B] to-[#10B981] text-white flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-xs text-emerald-100">বর্তমান ব্যালেন্স</p>
                  <p className="text-2xl font-black mt-0.5">৳{(userProfile as any)?.walletBalance || 0}</p>
                </div>
                <Wallet size={28} />
              </div>

              {/* Quick Recharge Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">রিচার্জের পরিমাণ</label>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRechargeAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-black transition border cursor-pointer ${
                        rechargeAmount === amt
                          ? "bg-[#0B7A3B] text-white border-[#0B7A3B]"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      ৳{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowWalletModal(false);
                    toast.success(`৳${rechargeAmount} রিচার্জ রিকোয়েস্ট গ্রহণ করা হয়েছে`);
                  }}
                  className="w-full py-3 bg-[#0B7A3B] hover:bg-[#096330] text-white font-black text-xs sm:text-sm rounded-2xl transition border-0 cursor-pointer"
                >
                  এখনই রিচার্জ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9.7 Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <LogOut size={26} className="stroke-[2.5]" />
              </div>

              <h3 className="font-black text-slate-950 text-base">
                আপনি কি লগআউট করতে চান?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                পরবর্তীতে পুনরায় প্রবেশের জন্য আপনার ইমেইল/ফোন ও পাসওয়ার্ড প্রয়োজন হবে।
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="py-3 bg-slate-100 text-slate-700 font-bold text-xs rounded-2xl transition border-0 cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl transition border-0 cursor-pointer shadow-xs"
                >
                  লগআউট
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9.8 Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <ShieldAlert size={26} className="stroke-[2.5]" />
              </div>

              <h3 className="font-black text-slate-950 text-base">
                অ্যাকাউন্ট মুছে ফেলার আবেদন
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                আপনার অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলার জন্য ৩০ দিনের গ্রেস পিরিয়ড প্রযোজ্য হবে।
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="py-3 bg-slate-100 text-slate-700 font-bold text-xs rounded-2xl transition border-0 cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    toast.info("অ্যাকাউন্ট মোছার আবেদন গ্রহণ করা হয়েছে। ৩০ দিনের গ্রেস পিরিয়ড শুরু হয়েছে।");
                  }}
                  className="py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl transition border-0 cursor-pointer shadow-xs"
                >
                  মুছে ফেলুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9.9 Add Another Account Modal */}
      <AnimatePresence>
        {showAddAccountModal && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <Plus size={24} strokeWidth={2.5} />
              </div>

              <h3 className="font-black text-slate-950 text-base">
                নতুন অ্যাকাউন্ট যুক্ত করুন
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                আপনি অন্য কোনো অ্যাকাউন্টে সুইচ করতে চাইলে লগইন বা নতুন রেজিস্টার করতে পারেন।
              </p>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAccountModal(false);
                    navigate("/login");
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition border-0 cursor-pointer"
                >
                  অন্য অ্যাকাউন্টে লগইন করুন
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="w-full py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-2xl transition border-0 cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9.10 Simple Static Info Modals (About, Terms, Privacy, Support) */}
      <AnimatePresence>
        {(showAboutModal || showPrivacyModal || showTermsModal || showSupportModal) && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-3.5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="font-black text-slate-950 text-base">
                  {showAboutModal ? "About App" : showPrivacyModal ? "Privacy Policy" : showTermsModal ? "Terms of Service" : "Support Center"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowAboutModal(false);
                    setShowPrivacyModal(false);
                    setShowTermsModal(false);
                    setShowSupportModal(false);
                  }}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center border-0 bg-transparent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed py-1 space-y-2">
                {showAboutModal && (
                  <div>
                    <p className="font-bold text-slate-900">আমাদের পুঠিয়া অ্যাপ (Our Puthia App)</p>
                    <p>সংস্করণ: 2.0.3 (বিল্ড ১৭)</p>
                    <p className="mt-2 text-slate-500">পুঠিয়া উপজেলার সকল নাগরিক সেবা, সোশ্যাল প্ল্যাটফর্ম এবং ব্যবসা-বাণিজ্য সংযোগের নির্ভরযোগ্য ডিজিটাল ঠিকানা।</p>
                  </div>
                )}
                {showPrivacyModal && (
                  <p>আপনার ব্যক্তিগত তথ্য ও সুরক্ষা আমাদের সর্বোচ্চ অগ্রাধিকার। আমরা কখনোই তৃতীয় পক্ষের সাথে সংবেদনশীল তথ্য শেয়ার করি না।</p>
                )}
                {showTermsModal && (
                  <p>আমাদের পুঠিয়া সেবা ব্যবহারের ক্ষেত্রে সকল নাগরিক ও ব্যবহারকারীকে শালীনতা এবং জাতীয় সাইবার নিরাপত্তা আইন মেনে চলতে হবে।</p>
                )}
                {showSupportModal && (
                  <div>
                    <p className="font-bold text-slate-900">হেল্পলাইন ও কাস্টমার কেয়ার</p>
                    <p className="mt-1">ইমেইল: support@ourputhia.com</p>
                    <p>হেল্পলাইন: +৮৮০ ১৭০০০০০০০০</p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAboutModal(false);
                  setShowPrivacyModal(false);
                  setShowTermsModal(false);
                  setShowSupportModal(false);
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition border-0 cursor-pointer mt-2"
              >
                বন্ধ করুন
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 10. Complete 9-Tab Editor Profile System */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        formData={editFormData}
        setFormData={setEditFormData}
        handleSubmit={handleEditProfileSubmit}
        handleImageUpload={handleEditProfileImageUpload}
        handleCoverUpload={handleEditProfileCoverUpload}
        editLoading={editLoading}
        editSuccess={editSuccess}
        editError={editError}
      />

    </div>
  );
}
