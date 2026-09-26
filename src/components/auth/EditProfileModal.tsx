import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, Camera, Calendar, ChevronDown, Search, Plus, 
  Briefcase, Building2, GraduationCap, Loader2, CheckCircle2, AlertCircle, Phone, Smartphone, Trash2
} from "lucide-react";
import { compressImageToBase64 } from "../../api";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleSubmit: (e: React.FormEvent) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCoverUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  editLoading: boolean;
  editSuccess: boolean;
  editError: string;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  handleSubmit,
  handleImageUpload,
  handleCoverUpload,
  editLoading,
  editSuccess,
  editError,
}) => {
  const [isAddingWork, setIsAddingWork] = useState(Boolean(formData.workCompany || formData.workExperience));
  const [isAddingHighSchool, setIsAddingHighSchool] = useState(Boolean(formData.highSchool));
  const [isAddingUniversity, setIsAddingUniversity] = useState(Boolean(formData.collegeUniversity || formData.education));
  const [coverUploading, setCoverUploading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const onCoverFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverUploading(true);
    try {
      if (handleCoverUpload) {
        await handleCoverUpload(e);
      } else {
        const base64 = await compressImageToBase64(file);
        setFormData((prev: any) => ({ ...prev, coverURL: base64 }));
      }
    } catch (err) {
      console.error("Cover upload error:", err);
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-0 sm:p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
          className="bg-slate-50 w-full max-w-md sm:max-w-lg rounded-none sm:rounded-[28px] shadow-2xl relative overflow-hidden border border-slate-200/80 h-full sm:h-auto sm:max-h-[92vh] flex flex-col text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Sticky Header */}
          <div className="px-4 py-3.5 border-b border-slate-200/90 flex items-center justify-between bg-white sticky top-0 z-20 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-800 border-0 bg-transparent cursor-pointer transition active:scale-95"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Edit Profile
            </h3>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={editLoading}
              className="text-sm sm:text-base font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-50 bg-transparent border-0 cursor-pointer transition active:scale-95 px-2 py-1 flex items-center gap-1.5"
            >
              {editLoading && <Loader2 size={15} className="animate-spin text-emerald-600" />}
              <span>Save</span>
            </button>
          </div>

          {/* Scrollable Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 custom-scrollbar">
            {/* Feedback Alerts */}
            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 font-semibold text-xs animate-in fade-in duration-200">
                <AlertCircle className="shrink-0 text-rose-600" size={16} />
                <span>{editError}</span>
              </div>
            )}

            {editSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 font-semibold text-xs animate-in fade-in duration-200">
                <CheckCircle2 className="shrink-0 text-emerald-600" size={16} />
                <span>প্রোফাইল সফলভাবে আপডেট করা হয়েছে!</span>
              </div>
            )}

            {/* Header Profile & Cover Banner Card */}
            <div className="relative rounded-2xl p-4 sm:p-5 border border-emerald-100/80 shadow-xs overflow-hidden min-h-[170px] flex flex-col justify-between bg-gradient-to-b from-emerald-100/70 via-teal-50/40 to-white">
              {/* Actual Cover Photo Background if present */}
              {formData.coverURL && (
                <div className="absolute inset-0 z-0">
                  <img 
                    src={formData.coverURL} 
                    alt="Cover Banner" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />
                </div>
              )}

              {/* Top Row: Brand / Cover Controls */}
              <div className="relative z-10 flex items-center justify-between gap-2 mb-2">
                <span className={`text-base sm:text-lg font-black italic select-none tracking-tight ${formData.coverURL ? 'text-white drop-shadow-md' : 'text-emerald-700/90'}`}>
                  Historical Puthia
                </span>

                {/* Edit & Remove Cover Buttons */}
                <div className="flex items-center gap-1.5">
                  {formData.coverURL && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev: any) => ({ ...prev, coverURL: '' }))}
                      className="px-2.5 py-1.5 bg-black/40 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition active:scale-95 backdrop-blur-md border border-white/20"
                      title="কভার ফটো মুছুন"
                    >
                      <Trash2 size={13} />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  )}

                  <label className="px-3 py-1.5 bg-white/95 hover:bg-white text-slate-800 hover:text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm border border-slate-200/60 transition active:scale-95 backdrop-blur-md shrink-0">
                    {coverUploading ? (
                      <Loader2 size={14} className="animate-spin text-emerald-600" />
                    ) : (
                      <Camera size={14} className="text-emerald-600" />
                    )}
                    <span>{coverUploading ? "Uploading..." : "Edit Cover"}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={onCoverFileSelect} 
                      disabled={coverUploading}
                    />
                  </label>
                </div>
              </div>

              {/* Avatar + Identity Info */}
              <div className="relative z-10 flex items-center gap-3.5 pt-1">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white ring-1 ring-slate-200/80">
                    <img 
                      src={formData.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(formData.name || 'user')}`} 
                      alt={formData.name || "Avatar"} 
                      className="w-full h-full object-cover" 
                    />
                  </div>

                  <label className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md border-2 border-white cursor-pointer transition active:scale-90">
                    <Camera size={13} />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className={`text-base sm:text-lg font-bold truncate ${formData.coverURL ? 'text-white drop-shadow-sm' : 'text-slate-950'}`}>
                    {formData.name || "User"}
                  </h4>
                  <p className={`text-xs sm:text-sm font-semibold truncate ${formData.coverURL ? 'text-emerald-200 drop-shadow-xs' : 'text-emerald-600'}`}>
                    @{formData.username || (formData.name ? formData.name.toLowerCase().replace(/\s+/g, '') : 'user')}
                  </p>
                  {formData.phone && (
                    <div className={`flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-lg w-fit ${formData.coverURL ? 'bg-black/50 text-emerald-200 border border-white/20 backdrop-blur-xs' : 'text-slate-600 bg-emerald-50/70 border border-emerald-200/60'}`}>
                      <Smartphone size={12} className={formData.coverURL ? 'text-emerald-300 shrink-0' : 'text-emerald-700 shrink-0'} />
                      <span className={`text-[11px] font-bold tracking-wide ${formData.coverURL ? 'text-white' : 'text-emerald-900'}`}>{formData.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hint Subtext */}
              <p className={`relative z-10 text-[11px] sm:text-xs text-center mt-3 pt-2 font-medium ${formData.coverURL ? 'text-white/80 border-t border-white/15' : 'text-slate-500 border-t border-slate-100'}`}>
                Tap your photo or “Edit Cover” to change how your profile looks to everyone.
              </p>
            </div>

            {/* Section 1: BASIC INFO */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                BASIC INFO
              </h4>

              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3.5 shadow-xs">
                {/* Name */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    placeholder="Name"
                  />
                </div>

                {/* Mobile Number / Phone */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-500">
                      Mobile Number (মোবাইল নম্বর)
                    </label>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded-md">
                      অ্যাকাউন্ট মোবাইল নম্বর
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone || ""}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                      placeholder="01XXXXXXXXX"
                    />
                    <Smartphone size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio || ""}
                    onChange={(e) => {
                      if (e.target.value.length <= 160) {
                        handleChange(e);
                      }
                    }}
                    rows={3}
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition"
                    placeholder="Bio"
                  />
                  <div className="text-right text-[11px] text-slate-400 font-medium mt-1">
                    {(formData.bio || "").length}/160
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: DETAILS */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                DETAILS
              </h4>

              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3.5 shadow-xs">
                {/* Date of Birth */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Date of Birth
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob || ""}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
                    />
                    <Calendar size={18} className="absolute right-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Gender
                  </label>
                  <div className="relative flex items-center">
                    <select
                      name="gender"
                      value={formData.gender || "Male"}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Blood Group */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Blood Group
                  </label>
                  <div className="relative flex items-center">
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup || ""}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
                    >
                      <option value="">Select blood group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Current Location */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800">
                      Current location (বর্তমান ঠিকানা)
                    </label>
                    {formData.union && formData.union !== "তথ্য নেই" && (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded-md">
                        {formData.union}
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center pointer-events-none">
                      <Search size={14} />
                    </div>
                    <input
                      type="text"
                      name="village"
                      value={
                        (formData.village && formData.village !== "তথ্য নেই")
                          ? formData.village
                          : (formData.address && formData.address !== "তথ্য নেই")
                            ? formData.address
                            : (formData.union && formData.union !== "তথ্য নেই" ? `${formData.union}, পুঠিয়া` : "")
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        handleChange(e);
                        setFormData((prev: any) => ({ ...prev, village: val, address: val }));
                      }}
                      className="w-full pl-11 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                      placeholder="যেমন: বানেশ্বর বাজার / তারাপুর / পুঠিয়া"
                    />
                  </div>
                </div>

                {/* Hometown */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Hometown
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Search size={14} />
                    </div>
                    <input
                      type="text"
                      name="hometown"
                      value={formData.hometown || ""}
                      onChange={handleChange}
                      className="w-full pl-11 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                      placeholder="Search hometown city..."
                    />
                  </div>
                </div>

                {/* Relationship status */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Relationship status
                  </label>
                  <div className="relative flex items-center">
                    <select
                      name="relationshipStatus"
                      value={formData.relationshipStatus || ""}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
                    >
                      <option value="">Select relationship status</option>
                      <option value="Single">Single</option>
                      <option value="In a relationship">In a relationship</option>
                      <option value="Engaged">Engaged</option>
                      <option value="Married">Married</option>
                      <option value="In a civil union">In a civil union</option>
                      <option value="In a domestic partnership">In a domestic partnership</option>
                      <option value="In an open relationship">In an open relationship</option>
                      <option value="It's complicated">It's complicated</option>
                      <option value="Separated">Separated</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: WORK */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                WORK
              </h4>

              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Briefcase size={17} />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        Work experience
                      </span>
                      {(formData.workCompany || formData.workPosition || formData.workExperience || formData.occupation) && (
                        <p className="text-[11px] text-emerald-700 font-semibold truncate max-w-[200px]">
                          {formData.workPosition ? `${formData.workPosition} at ` : ''}
                          {formData.workCompany || formData.workExperience || formData.occupation}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddingWork(!isAddingWork)}
                    className="w-8 h-8 rounded-full hover:bg-emerald-50 text-emerald-600 flex items-center justify-center border-0 bg-transparent cursor-pointer transition active:scale-95"
                    title="Add/Edit Work"
                  >
                    <Plus size={20} className={isAddingWork ? "rotate-45 transition-transform" : "transition-transform"} />
                  </button>
                </div>

                {/* Expandable Work Fields */}
                {isAddingWork && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-200">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">Company / Workplace</label>
                      <input
                        type="text"
                        name="workCompany"
                        value={formData.workCompany || formData.occupation || ""}
                        onChange={(e) => {
                          handleChange(e);
                          setFormData((prev: any) => ({ ...prev, occupation: e.target.value }));
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        placeholder="e.g. RJ Computer / Freelance"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">Position / Role</label>
                      <input
                        type="text"
                        name="workPosition"
                        value={formData.workPosition || ""}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        placeholder="e.g. Founder & Owner / Designer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: EDUCATION */}
            <div className="space-y-1.5 pb-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                EDUCATION
              </h4>

              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs divide-y divide-slate-100">
                {/* High school or college */}
                <div className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                        <Building2 size={17} />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-800">
                          High school or college
                        </span>
                        {formData.highSchool && (
                          <p className="text-[11px] text-emerald-700 font-semibold truncate max-w-[200px]">
                            {formData.highSchool}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddingHighSchool(!isAddingHighSchool)}
                      className="w-8 h-8 rounded-full hover:bg-emerald-50 text-emerald-600 flex items-center justify-center border-0 bg-transparent cursor-pointer transition active:scale-95"
                      title="Add/Edit School"
                    >
                      <Plus size={20} className={isAddingHighSchool ? "rotate-45 transition-transform" : "transition-transform"} />
                    </button>
                  </div>

                  {isAddingHighSchool && (
                    <div className="mt-3 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">School / College Name</label>
                      <input
                        type="text"
                        name="highSchool"
                        value={formData.highSchool || ""}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        placeholder="e.g. পুঠিয়া মডেল হাই স্কুল"
                      />
                    </div>
                  )}
                </div>

                {/* College / University */}
                <div className="pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                        <GraduationCap size={17} />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-800">
                          College / University
                        </span>
                        {(formData.collegeUniversity || formData.education) && (
                          <p className="text-[11px] text-emerald-700 font-semibold truncate max-w-[200px]">
                            {formData.collegeUniversity || formData.education}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddingUniversity(!isAddingUniversity)}
                      className="w-8 h-8 rounded-full hover:bg-emerald-50 text-emerald-600 flex items-center justify-center border-0 bg-transparent cursor-pointer transition active:scale-95"
                      title="Add/Edit University"
                    >
                      <Plus size={20} className={isAddingUniversity ? "rotate-45 transition-transform" : "transition-transform"} />
                    </button>
                  </div>

                  {isAddingUniversity && (
                    <div className="mt-3 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">College / University Name</label>
                      <input
                        type="text"
                        name="collegeUniversity"
                        value={formData.collegeUniversity || formData.education || ""}
                        onChange={(e) => {
                          handleChange(e);
                          setFormData((prev: any) => ({ ...prev, education: e.target.value }));
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        placeholder="e.g. রাজশাহী বিশ্ববিদ্যালয় / লস্করপুর ডিগ্রি কলেজ"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditProfileModal;
