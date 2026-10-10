import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Save, 
  Sparkles, 
  Shield, 
  Crown, 
  Droplet, 
  Globe, 
  Check, 
  Loader2, 
  FileText, 
  Trash2, 
  X,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { compressImageToBase64 } from '../../api';

export const EditProfile: React.FC = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    bio: '',
    occupation: '',
    education: '',
    village: '',
    union: 'বানেশ্বর',
    address: '',
    gender: 'পুরুষ',
    bloodGroup: '',
    photoURL: '',
    coverURL: '',
    facebook: '',
    website: ''
  });

  // Hydrate formData from userProfile and user
  useEffect(() => {
    if (userProfile || user) {
      setFormData({
        name: userProfile?.name || user?.displayName || '',
        phone: userProfile?.phone || '',
        email: userProfile?.email || user?.email || '',
        bio: userProfile?.bio || '',
        occupation: userProfile?.occupation || (userProfile as any)?.workCompany || '',
        education: userProfile?.education || (userProfile as any)?.collegeUniversity || '',
        village: userProfile?.village || '',
        union: userProfile?.union || 'বানেশ্বর',
        address: userProfile?.address || '',
        gender: userProfile?.gender || 'পুরুষ',
        bloodGroup: userProfile?.bloodGroup || '',
        photoURL: userProfile?.photoURL || user?.photoURL || '',
        coverURL: userProfile?.coverURL || '',
        facebook: userProfile?.facebook || '',
        website: userProfile?.website || ''
      });
    }
  }, [userProfile, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Avatar Upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const base64 = await compressImageToBase64(file);
      setFormData(prev => ({ ...prev, photoURL: base64 }));
      toast.success('প্রোফাইল ছবি সিলেক্ট করা হয়েছে');
    } catch (err) {
      console.error(err);
      toast.error('ছবি আপলোড করতে ব্যর্থ হয়েছে');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  // Cover Upload
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const base64 = await compressImageToBase64(file);
      setFormData(prev => ({ ...prev, coverURL: base64 }));
      toast.success('কভার ছবি সিলেক্ট করা হয়েছে');
    } catch (err) {
      console.error(err);
      toast.error('কভার ছবি আপলোড করতে ব্যর্থ হয়েছে');
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  // Checklist for profile completion
  const checklist = [
    { id: 'name', label: 'পূর্ণ নাম', done: Boolean(formData.name?.trim()), icon: User },
    { id: 'phone', label: 'মোবাইল নম্বর', done: Boolean(formData.phone?.trim()), icon: Phone },
    { id: 'email', label: 'ইমেইল ঠিকানা', done: Boolean(formData.email?.trim()), icon: Mail },
    { id: 'photo', label: 'প্রোফাইল ছবি', done: Boolean(formData.photoURL?.trim()), icon: Camera },
    { id: 'cover', label: 'কভার ব্যানার', done: Boolean(formData.coverURL?.trim()), icon: Camera },
    { id: 'bio', label: 'সংক্ষিপ্ত পরিচিতি', done: Boolean(formData.bio?.trim()), icon: FileText },
    { id: 'occupation', label: 'পেশা / পদবী', done: Boolean(formData.occupation?.trim()), icon: Briefcase },
    { id: 'address', label: 'গ্রাম / ঠিকানা', done: Boolean(formData.address?.trim() || formData.village?.trim()), icon: MapPin },
    { id: 'union', label: 'ইউনিয়ন / এলাকা', done: Boolean(formData.union?.trim()), icon: MapPin },
    { id: 'bloodGroup', label: 'রক্তের গ্রুপ', done: Boolean(formData.bloodGroup?.trim()), icon: Droplet },
  ];

  const completedCount = checklist.filter(item => item.done).length;
  const completionPercentage = Math.round((completedCount / checklist.length) * 100);

  // SVG parameters for circular progress indicator
  const radius = 52;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  // Dynamic progress colors
  const getProgressColor = () => {
    if (completionPercentage >= 80) return { stroke: '#059669', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
    if (completionPercentage >= 50) return { stroke: '#d97706', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
    return { stroke: '#e11d48', text: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' };
  };

  const statusTheme = getProgressColor();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error('দয়া করে আপনার পূর্ণ নাম লিখুন');
      return;
    }

    setLoading(true);
    try {
      const updates = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        bio: formData.bio.trim(),
        occupation: formData.occupation.trim(),
        education: formData.education.trim(),
        village: formData.village.trim(),
        union: formData.union.trim(),
        address: formData.address.trim() || `${formData.village ? formData.village + ', ' : ''}${formData.union}`,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        photoURL: formData.photoURL,
        coverURL: formData.coverURL,
        facebook: formData.facebook.trim(),
        website: formData.website.trim(),
        updatedAt: new Date().toISOString()
      };

      await updateUserProfile(updates);
      toast.success('প্রোফাইল সফলভাবে আপডেট করা হয়েছে!');
      navigate('/admin/profile');
    } catch (err: any) {
      console.error('Update profile error:', err);
      toast.error(err?.message || 'প্রোফাইল সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20 font-sans text-slate-800">
      
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 p-6 sm:p-8 text-white rounded-3xl shadow-xl relative overflow-hidden border border-emerald-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <Link
              to="/admin/profile"
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer backdrop-blur-xs flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft size={16} />
              <span>ফিরে যান</span>
            </Link>
            <span className="px-3 py-1 bg-amber-400 text-emerald-950 rounded-full text-xs font-black flex items-center gap-1 shadow-xs">
              <Crown size={13} className="fill-emerald-950" /> অ্যাডমিন সেটিংস
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            প্রোফাইল সম্পাদনা ও হালনাগাদ
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 font-medium">
            আপনার সকল ব্যক্তিগত, অফিসিয়াল ও যোগাযোগের তথ্য সঠিকভাবে সম্পূর্ণ করুন
          </p>
        </div>

        <div className="z-10 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/admin/profile')}
            className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-2xl text-xs font-bold transition backdrop-blur-xs cursor-pointer border border-white/20"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>সংরক্ষণ করুন</span>
          </button>
        </div>
      </div>

      {/* 🌟 CIRCULAR PROGRESS INDICATOR CARD (Compact & Collapsible) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/40 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
          
          {/* Circular Progress Gauge & Summary */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Background Track Circle */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke="#e2e8f0"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  className="transition-all"
                />
                
                {/* Gradient Definition */}
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={completionPercentage >= 80 ? '#10b981' : (completionPercentage >= 50 ? '#f59e0b' : '#f43f5e')} />
                    <stop offset="100%" stopColor={completionPercentage >= 80 ? '#0d9488' : (completionPercentage >= 50 ? '#d97706' : '#e11d48')} />
                  </linearGradient>
                </defs>

                {/* Animated Dynamic Progress Circle */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke="url(#progressGradient)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              {/* Centered Percentage Typography */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-none">
                  {completionPercentage}%
                </span>
                <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-slate-400 mt-0.5">
                  সম্পূর্ণ
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-slate-900">প্রোফাইল পূর্ণতা</h3>
                <span className={`text-[10.5px] font-black px-2 py-0.5 rounded-full border ${statusTheme.bg} ${statusTheme.text}`}>
                  {completionPercentage === 100 ? 'পরিপূর্ণ' : (completionPercentage >= 50 ? 'চলমান' : 'অসম্পূর্ণ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium max-w-md">
                {completionPercentage === 100
                  ? '🎉 সকল প্রয়োজনীয় তথ্য ১০০% সম্পূর্ণ হয়েছে।'
                  : `আর মাত্র ${checklist.length - completedCount}টি তথ্য বাকি রয়েছে।`}
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  {completedCount} / {checklist.length} পূর্ণ
                </span>
                <button
                  type="button"
                  onClick={() => setIsChecklistExpanded(!isChecklistExpanded)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer transition"
                >
                  <span>{isChecklistExpanded ? 'চেকলিস্ট সংক্ষেপ করুন' : 'বিস্তারিত চেকলিস্ট দেখুন'}</span>
                  <ChevronRight size={13} className={`transform transition-transform ${isChecklistExpanded ? 'rotate-90' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Progress Indicator Bar on top right */}
          <div className="w-full md:w-auto md:min-w-[200px] flex flex-col justify-center">
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-700"
                style={{ 
                  width: `${completionPercentage}%`,
                  backgroundColor: completionPercentage >= 80 ? '#10b981' : (completionPercentage >= 50 ? '#f59e0b' : '#f43f5e')
                }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-bold text-right mt-1">
              {completedCount}টি তথ্য পূরণকৃত
            </span>
          </div>

        </div>

        {/* Collapsible Smart Checklist Grid */}
        {isChecklistExpanded && (
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <p className="text-xs font-bold text-slate-600">চেকলিস্টের বিস্তারিত অবস্থা:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
              {checklist.map((item) => (
                <div 
                  key={item.id}
                  className={`p-2 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                    item.done 
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-bold' 
                      : 'bg-slate-50 border-slate-200/70 text-slate-500 font-medium'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-white ${
                    item.done ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}>
                    {item.done ? <Check size={10} className="stroke-[3]" /> : <span className="w-1 h-1 rounded-full bg-white" />}
                  </div>
                  <span className="truncate text-[11px]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MAIN FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 1. কভার ও প্রোফাইল ছবি সেকশন */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">১. কভার ব্যানার ও প্রোফাইল ছবি</h3>
              <p className="text-xs text-slate-400 font-bold">ছবি যুক্ত করলে প্রোফাইল পূর্ণতা তাৎক্ষণিক বৃদ্ধি পাবে</p>
            </div>
          </div>

          {/* Banner Box */}
          <div className="relative h-44 sm:h-52 rounded-2xl overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#0d9488] border border-slate-200 shadow-inner flex flex-col justify-between p-4">
            {formData.coverURL && (
              <img 
                src={formData.coverURL} 
                alt="Cover Preview" 
                className="absolute inset-0 w-full h-full object-cover" 
              />
            )}
            
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3 py-1 bg-black/40 text-white backdrop-blur-xs rounded-full text-xs font-bold">
                কভার ব্যানার
              </span>

              <div className="flex items-center gap-2">
                {formData.coverURL && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, coverURL: '' }))}
                    className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>মুছুন</span>
                  </button>
                )}
                <label className="px-3.5 py-1.5 bg-white text-slate-900 hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm">
                  {coverUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  <span>{coverUploading ? 'আপলোড হচ্ছে...' : 'কভার পরিবর্তন'}</span>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                    disabled={coverUploading}
                  />
                </label>
              </div>
            </div>

            {/* Avatar inside Cover */}
            <div className="relative z-10 flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-1 shadow-lg border-2 border-white overflow-hidden flex items-center justify-center">
                  {formData.photoURL ? (
                    <img 
                      src={formData.photoURL} 
                      alt="Avatar" 
                      className="w-full h-full object-cover rounded-xl" 
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-800 text-white flex items-center justify-center font-black text-3xl uppercase">
                      {(formData.name || 'ম').charAt(0)}
                    </div>
                  )}
                </div>

                <label 
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center border-2 border-white shadow-md cursor-pointer transition"
                  title="প্রোফাইল ছবি পরিবর্তন"
                >
                  {avatarUploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={avatarUploading}
                  />
                </label>
              </div>

              <div className="text-white drop-shadow-xs">
                <h4 className="text-lg sm:text-xl font-black">{formData.name || 'আপনার নাম'}</h4>
                <p className="text-xs text-emerald-100 font-bold">{formData.email || 'ইমেইল'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. মৌলিক পরিচিতি তথ্য */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">২. মৌলিক তথ্য</h3>
              <p className="text-xs text-slate-400 font-bold">নাম, যোগাযোগ এবং ব্যক্তিগত বিবরণ</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                পূর্ণ নাম (Full Name) *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                placeholder="যেমন: মোঃ জসিম উদ্দিন"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                মোবাইল নম্বর (Phone Number) *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                placeholder="017XXXXXXXX"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ইমেইল ঠিকানা (Email Address)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                placeholder="example@gmail.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                লিঙ্গ (Gender)
              </label>
              <select
                name="gender"
                value={formData.gender || 'পুরুষ'}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="পুরুষ">পুরুষ</option>
                <option value="মহিলা">মহিলা</option>
                <option value="অন্যান্য">অন্যান্য</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              সংক্ষিপ্ত বায়ো / পরিচিতি (Bio)
            </label>
            <textarea
              name="bio"
              value={formData.bio || ''}
              onChange={handleChange}
              rows={3}
              placeholder="নিজের সম্পর্কে সংক্ষিপ্ত পরিচিতি লিখুন..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>

        {/* 3. অবস্থান ও ঠিকানা */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">৩. অবস্থান ও ঠিকানা</h3>
              <p className="text-xs text-slate-400 font-bold">পুঠিয়া উপজেলার ইউনিয়ন ও গ্রামের তথ্য</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ইউনিয়ন / পৌরসভা *
              </label>
              <select
                name="union"
                value={formData.union || 'বানেশ্বর'}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="বানেশ্বর">বানেশ্বর ইউনিয়ন</option>
                <option value="পুঠিয়া পৌরসভা">পুঠিয়া পৌরসভা</option>
                <option value="বেলপুকুরিয়া">বেলপুকুরিয়া ইউনিয়ন</option>
                <option value="ভালুকগাছি">ভালুকগাছি ইউনিয়ন</option>
                <option value="জিউপাড়া">জিউপাড়া ইউনিয়ন</option>
                <option value="শিলমাড়িয়া">শিলমাড়িয়া ইউনিয়ন</option>
                <option value="পুঠিয়া সদর">পুঠিয়া সদর ইউনিয়ন</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                গ্রাম / পাড়া
              </label>
              <input
                type="text"
                name="village"
                value={formData.village || ''}
                onChange={handleChange}
                placeholder="যেমন: তারাপুর / বানেশ্বর বাজার"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                পূর্ণ ঠিকানা (Full Address)
              </label>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                placeholder="যেমন: তারাপুর, বানেশ্বর, পুঠিয়া, রাজশাহী"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* 4. পেশা, শিক্ষা ও রক্তদান */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <Briefcase size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">৪. পেশা, শিক্ষা ও স্বাস্থ্য তথ্য</h3>
              <p className="text-xs text-slate-400 font-bold">পেশাগত তথ্য ও রক্তের গ্রুপ</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                পেশা / পদবী (Occupation / Role)
              </label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation || ''}
                onChange={handleChange}
                placeholder="যেমন: সফটওয়্যার ইঞ্জিনিয়ার / ব্যবসায়ী"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                সর্বোচ্চ শিক্ষা প্রতিষ্ঠান (Education)
              </label>
              <input
                type="text"
                name="education"
                value={formData.education || ''}
                onChange={handleChange}
                placeholder="যেমন: রাজশাহী বিশ্ববিদ্যালয়"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                রক্তের গ্রুপ (Blood Group)
              </label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">রক্তের গ্রুপ নির্বাচন করুন</option>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ফেসবুক প্রোফাইল লিঙ্ক (Facebook)
              </label>
              <input
                type="url"
                name="facebook"
                value={formData.facebook || ''}
                onChange={handleChange}
                placeholder="https://facebook.com/username"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/admin/profile')}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs sm:text-sm transition cursor-pointer"
          >
            বাতিল করুন
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>সকল পরিবর্তন সংরক্ষণ করুন</span>
          </button>
        </div>

      </form>

    </div>
  );
};
