import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { getFriendlyAuthErrorMessage } from "../utils/authErrors";
import { X, Lock, Mail, Phone, User, Home, Droplet, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { VILLAGES_DATABASE } from "../data/villageData";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle, registerWithEmail, loginWithEmail, resetPassword } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [upazila, setUpazila] = useState("পুঠিয়া উপজেলা");
  const [union, setUnion] = useState("বানেশ্বর ইউনিয়ন");
  const [village, setVillage] = useState("");
  const [customVillage, setCustomVillage] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [isBloodDonor, setIsBloodDonor] = useState(false);

  const upazilas = [
    "পুঠিয়া উপজেলা",
    "পবা উপজেলা",
    "চারঘাট উপজেলা",
    "বাঘা উপজেলা",
    "তানোর উপজেলা",
    "মোহনপুর উপজেলা",
    "দুর্গাপুর উপজেলা",
    "বাগমারা উপজেলা",
    "গোদাগাড়ী উপজেলা"
  ];

  const unionMapping: Record<string, string[]> = {
    "পুঠিয়া উপজেলা": [
      "বানেশ্বর ইউনিয়ন",
      "বেলপুকুর ইউনিয়ন",
      "পুঠিয়া পৌরসভা",
      "জিউপাড়া ইউনিয়ন",
      "ভালুকগাছী ইউনিয়ন",
      "শিলমাড়িয়া ইউনিয়ন",
      "১নং পুঠিয়া সদর ইউনিয়ন"
    ],
    "পবা উপজেলা": [
      "হরিয়ান ইউনিয়ন",
      "পারিলা ইউনিয়ন",
      "দর্শনপাড়া ইউনিয়ন",
      "বড়গাছী ইউনিয়ন",
      "দামকুড়া ইউনিয়ন",
      "হুজুরীপাড়া ইউনিয়ন",
      "নওহাটা পৌরসভা",
      "কাটাখালী পৌরসভা"
    ],
    "চারঘাট উপজেলা": [
      "চারঘাট ইউনিয়ন",
      "ইউসুফপুর ইউনিয়ন",
      "শলুয়া ইউনিয়ন",
      "সারদা ইউনিয়ন",
      "ভায়ালক্ষীপুর ইউনিয়ন",
      "নিমপাড়া ইউনিয়ন",
      "চারঘাট পৌরসভা"
    ],
    "বাঘা উপজেলা": [
      "বাজুবাঘা ইউনিয়ন",
      "গড়গড়ি ইউনিয়ন",
      "পাকুড়িয়া ইউনিয়ন",
      "মনিগ্রাম ইউনিয়ন",
      "আড়ানী পৌরসভা",
      "বাঘা পৌরসভা"
    ],
    "তানোর উপজেলা": [
      "কলমা ইউনিয়ন",
      "বাধাইড় ইউনিয়ন",
      "পাঁচন্দর ইউনিয়ন",
      "সরনজাই ইউনিয়ন",
      "তালন্দ ইউনিয়ন",
      "কামারগাঁ ইউনিয়ন",
      "চান্দুড়িয়া ইউনিয়ন",
      "তানোর পৌরসভা",
      "মুণ্ডুমালা পৌরসভা"
    ],
    "মোহনপুর উপজেলা": [
      "ধুরইল ইউনিয়ন",
      "ঘাসিগ্রাম ইউনিয়ন",
      "রায়ঘাটি ইউনিয়ন",
      "মৌগাছী ইউনিয়ন",
      "বাকশিমইল ইউনিয়ন",
      "জাহানাবাদ ইউনিয়ন"
    ],
    "দুর্গাপুর উপজেলা": [
      "নওপাড়া ইউনিয়ন",
      "কিসমত গণকৈড় ইউনিয়ন",
      "পানানগর ইউনিয়ন",
      "দেলুয়াবাড়ী ইউনিয়ন",
      "মাড়িয়া ইউনিয়ন",
      "জয়নগর ইউনিয়ন",
      "দুর্গাপুর পৌরসভা"
    ],
    "বাগমারা উপজেলা": [
      "গোবিন্দপাড়া ইউনিয়ন",
      "নরদাশ ইউনিয়ন",
      "দ্বীপপুর ইউনিয়ন",
      "কাচারী কোয়ালীপাড়া ইউনিয়ন",
      "শ্রীপুর ইউনিয়ন",
      "গনিপুর ইউনিয়ন",
      "আউচপাড়া ইউনিয়ন",
      "শুভডাঙ্গা ইউনিয়ন",
      "মাড়িয়া ইউনিয়ন",
      "বাসুপাড়া ইউনিয়ন",
      "ঝিকরা ইউনিয়ন",
      "গোয়ালকান্দি ইউনিয়ন",
      "হামিরকুৎসা ইউনিয়ন",
      "যোগীপাড়া ইউনিয়ন",
      "সোনাডাঙ্গা ইউনিয়ন",
      "ভবানীগঞ্জ পৌরসভা"
    ],
    "গোদাগাড়ী উপজেলা": [
      "গোদাগাড়ী ইউনিয়ন",
      "মোহনপুর ইউনিয়ন",
      "পাকড়ী ইউনিয়ন",
      "ঋষিকুল ইউনিয়ন",
      "গোগ্রাম ইউনিয়ন",
      "মাটিকাটা ইউনিয়ন",
      "দেওপাড়া ইউনিয়ন",
      "চব্বিশনগর ইউনিয়ন",
      "গোদাগাড়ী পৌরসভা",
      "কাঁকনহাট পৌরসভা"
    ]
  };

  const getVillagesForUnion = (upazilaName: string, unionName: string): string[] => {
    if (upazilaName === "পুঠিয়া উপজেলা") {
      let dbUnionName = unionName;
      if (unionName === "পুঠিয়া সদর ইউনিয়ন") dbUnionName = "১নং পুঠিয়া সদর ইউনিয়ন";
      
      const filtered = VILLAGES_DATABASE.filter(
        (v) => v.union === dbUnionName
      ).map((v) => v.name);

      if (unionName === "পুঠিয়া পৌরসভা") {
        return ["পুঠিয়া বাজার", "রাজবাড়ী", "উপজেলা চত্বর", "কান্দ্রা", "কাঁচুপাড়া", "গোপালপুর", "অন্যান্য (নিজে লিখুন)"];
      }

      if (filtered.length > 0) {
        return [...new Set(filtered)].sort().concat("অন্যান্য (নিজে লিখুন)");
      }
    }

    return ["১নং ওয়ার্ড", "২নং ওয়ার্ড", "৩নং ওয়ার্ড", "অন্যান্য (নিজে লিখুন)"];
  };

  const handleUpazilaChange = (newUpazila: string) => {
    setUpazila(newUpazila);
    const unionsForUpazila = unionMapping[newUpazila] || [];
    const firstUnion = unionsForUpazila[0] || "";
    setUnion(firstUnion);
    
    if (firstUnion) {
      const villagesForUnion = getVillagesForUnion(newUpazila, firstUnion);
      const firstVillage = villagesForUnion[0] || "";
      setVillage(firstVillage);
      if (firstVillage !== "অন্যান্য (নিজে লিখুন)") {
        setCustomVillage("");
      }
    } else {
      setVillage("");
      setCustomVillage("");
    }
  };

  const handleUnionChange = (newUnion: string) => {
    setUnion(newUnion);
    const villagesForUnion = getVillagesForUnion(upazila, newUnion);
    const firstVillage = villagesForUnion[0] || "";
    setVillage(firstVillage);
    if (firstVillage !== "অন্যান্য (নিজে লিখুন)") {
      setCustomVillage("");
    }
  };

  // Ensure dynamic village initialization on registry view toggle
  useEffect(() => {
    if (isRegister) {
      const initialVillages = getVillagesForUnion("পুঠিয়া উপজেলা", "বানেশ্বর ইউনিয়ন");
      if (initialVillages.length > 0 && !village) {
        setVillage(initialVillages[0]);
      }
    }
  }, [isRegister]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      if (isForgotPassword) {
        if (!email) {
          throw new Error("দয়া করে আপনার ইমেইল ঠিকানাটি প্রদান করুন।");
        }
        await resetPassword(email);
        setSuccessMessage("আপনার ইমেইলে পাসওয়ার্ড রিসেট করার লিঙ্ক পাঠানো হয়েছে। অনুগ্রহ করে আপনার ইনবক্স (বা স্প্যাম ফোল্ডার) চেক করুন।");
      } else if (isRegister) {
        // Validation
        const finalVillage = village === "অন্যান্য (নিজে লিখুন)" ? customVillage.trim() : village;
        if (!email || !password || !name || !phone || !finalVillage || !gender) {
          throw new Error("দয়া করে সব বাধ্যতামূলক তথ্য প্রদান করুন।");
        }
        if (phone.length < 11) {
          throw new Error("সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন।");
        }
        if (password.length < 6) {
          throw new Error("পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।");
        }
        await registerWithEmail(email, password, name, phone, finalVillage, union, gender, bloodGroup, isBloodDonor, upazila);
        onClose();
      } else {
        if (!email || !password) {
          throw new Error("ইমেইল এবং পাসওয়ার্ড প্রদান করুন।");
        }
        await loginWithEmail(email, password, rememberMe);
        onClose();
      }
    } catch (err: any) {
      console.error("AuthModal error:", err);
      setError(getFriendlyAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error("Google Login Error in AuthModal:", err);
      setError(getFriendlyAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Box */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="bg-gradient-to-b from-[#f2fcf9] via-[#f7fcfb] to-[#eaf5f2] border border-emerald-100 rounded-[28px] w-full max-w-md relative shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 font-sans select-none"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-emerald-100/50 hover:bg-emerald-200/70 text-emerald-900 rounded-full transition-colors cursor-pointer z-20"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Central Lock Emblem Header */}
        <div className="pt-7 pb-2 px-6 text-center relative z-10 flex flex-col items-center">
          <div className="w-[90px] h-[90px] rounded-full bg-emerald-50/80 border border-emerald-100 flex items-center justify-center shadow-[0_8px_30px_rgba(16,185,129,0.12)] mb-3">
            <div className="w-[72px] h-[72px] rounded-full bg-[#E5FDF6] border-[2px] border-emerald-300/40 flex items-center justify-center shadow-inner">
              <div className="w-[58px] h-[58px] rounded-full bg-white flex items-center justify-center shadow-[0_4px_16px_rgba(16,185,129,0.06)] border border-white">
                <svg className="w-7 h-7 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-black text-[#01412F] tracking-tight">
            {isForgotPassword ? "পাসওয়ার্ড ভুলে গেছেন?" : isRegister ? "নতুন অ্যাকাউন্ট তৈরি করুন" : "স্বাগতম! ফিরে এসেছেন?"}
          </h2>
          <p className="text-xs font-bold text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
            {isForgotPassword 
              ? "আপনার ইমেইল ঠিকানা দিলে রিসেট লিঙ্ক পাঠানো হবে" 
              : isRegister 
              ? "সহজেই অ্যাকাউন্ট তৈরি করে সকল নাগরিক সেবা উপভোগ করুন" 
              : "আপনার অ্যাকাউন্ট লগইন করে সেবাগুলো উপভোগ করুন"}
          </p>
        </div>

        {/* Form area */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2 space-y-4 no-scrollbar">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-[18px] text-xs font-bold flex flex-col gap-2 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            </motion.div>
          )}

          {successMessage && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[18px] text-xs font-bold flex items-center gap-2 shadow-sm"
            >
              <span>✅</span>
              <span>{successMessage}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isRegister && !isForgotPassword && (
              <>
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#01412F]/80 ml-2">
                    পুরো নাম *
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600">
                      <User size={18} className="stroke-[2.5]" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: মোঃ জসিম উদ্দিন"
                      value={name || ""}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500 transition-all font-bold text-slate-700 placeholder-slate-300 text-xs sm:text-sm shadow-sm"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#01412F]/80 ml-2">
                    মোবাইল নম্বর *
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600">
                      <Phone size={18} className="stroke-[2.5]" />
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="যেমন: 01711XXXXXX"
                      value={phone || ""}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500 transition-all font-bold text-slate-700 placeholder-slate-300 text-xs sm:text-sm shadow-sm"
                    />
                  </div>
                </div>

                {/* Upazila */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#01412F]/80 ml-2">
                    উপজেলা *
                  </label>
                  <div className="relative">
                    <select
                      value={upazila}
                      onChange={(e) => handleUpazilaChange(e.target.value)}
                      className="w-full px-4 py-3.5 bg-white border border-slate-100 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all font-bold text-slate-700 text-xs sm:text-sm cursor-pointer shadow-sm appearance-none"
                    >
                      {upazilas.map((upz) => (
                        <option key={upz} value={upz}>{upz}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Union / Blood Group Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-[#01412F]/80 ml-2">ইউনিয়ন *</label>
                    <div className="relative">
                      <select
                        value={union}
                        onChange={(e) => handleUnionChange(e.target.value)}
                        className="w-full pl-4 pr-8 py-3.5 bg-white border border-slate-100 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all font-bold text-slate-700 text-xs sm:text-sm cursor-pointer shadow-sm appearance-none"
                      >
                        {(unionMapping[upazila] || []).map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-[#01412F]/80 ml-2 flex items-center gap-1">
                      <Droplet className="w-3.5 h-3.5 text-rose-500" /> রক্তের গ্রুপ *
                    </label>
                    <div className="relative">
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full pl-4 pr-8 py-3.5 bg-white border border-slate-100 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all font-bold text-slate-700 text-xs sm:text-sm cursor-pointer shadow-sm appearance-none"
                      >
                        {bloodGroups.map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Village */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#01412F]/80 ml-2">
                    গ্রামের নাম *
                  </label>
                  <div className="relative">
                    <select
                      value={village}
                      onChange={(e) => {
                        setVillage(e.target.value);
                        if (e.target.value !== "অন্যান্য (নিজে লিখুন)") {
                          setCustomVillage("");
                        }
                      }}
                      className="w-full pl-4 pr-8 py-3.5 bg-white border border-slate-100 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all font-bold text-slate-700 text-xs sm:text-sm cursor-pointer shadow-sm appearance-none"
                    >
                      {getVillagesForUnion(upazila, union).map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Custom Village Input if 'অন্যান্য (নিজে লিখুন)' is selected */}
                {village === "অন্যান্য (নিজে লিখুন)" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <label className="text-xs font-black text-[#01412F]/80 ml-2">
                      আপনার গ্রামের নাম লিখুন *
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600">
                        <Home size={18} className="stroke-[2.5]" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="যেমন: জিউপাড়া"
                        value={customVillage}
                        onChange={(e) => setCustomVillage(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500 transition-all font-bold text-slate-700 placeholder-slate-300 text-xs sm:text-sm shadow-sm"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[#01412F]/80 ml-2">লিঙ্গ *</label>
                  <div className="flex gap-4 px-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700">
                      <input
                        type="radio"
                        name="gender"
                        value="পুরুষ"
                        checked={gender === "পুরুষ"}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span>পুরুষ</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700">
                      <input
                        type="radio"
                        name="gender"
                        value="মহিলা"
                        checked={gender === "মহিলা"}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span>মহিলা</span>
                    </label>
                  </div>
                </div>

                {/* Ready to Donate Blood Checkbox */}
                <div className="flex items-center gap-2 py-1 px-1">
                  <input
                    type="checkbox"
                    id="bloodDonorCheckModal"
                    checked={isBloodDonor}
                    onChange={(e) => setIsBloodDonor(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="bloodDonorCheckModal" className="text-xs font-bold text-slate-600 cursor-pointer">
                    আমি স্বেচ্ছায় রক্তদানে ইচ্ছুক (রক্তদাতার তালিকায় যোগ করুন)
                  </label>
                </div>
              </>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-[#01412F]/80 ml-2">
                {isRegister ? "ইমেইল ঠিকানা *" : "ইমেইল বা মোবাইল নম্বর"}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600">
                  <Mail size={18} className="stroke-[2.5]" />
                </div>
                <input
                  type={isRegister ? "email" : "text"}
                  required
                  placeholder={isRegister ? "example@mail.com" : "example@mail.com বা 017xxxxxxxxx"}
                  value={email || ""}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500 transition-all font-bold text-slate-700 placeholder-slate-300 text-xs sm:text-sm shadow-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            {!isForgotPassword && (
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#01412F]/80 ml-2">
                  পাসওয়ার্ড {isRegister && "(অন্তত ৬ অক্ষর)"}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600">
                    <Lock size={18} className="stroke-[2.5]" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password || ""}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 bg-white border border-slate-100 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500 transition-all font-bold text-slate-700 placeholder-slate-300 text-xs sm:text-sm shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Remember me & Forgot password link for Login state */}
            {!isRegister && !isForgotPassword && (
              <div className="flex justify-between items-center px-1 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-[18px] h-[18px] border-2 border-slate-300 rounded-[6px] peer-checked:bg-emerald-600 peer-checked:border-emerald-600 transition-all flex items-center justify-center">
                      <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-slate-500">আমাকে মনে রাখুন</span>
                </label>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError("");
                    setSuccessMessage("");
                  }}
                  className="text-[11px] font-black text-[#009664] hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#009664] hover:bg-[#007f54] text-white rounded-[20px] font-black text-sm flex items-center justify-center gap-2 transition-all shadow-[0_6px_20px_rgba(0,150,100,0.18)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group mt-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>{isForgotPassword ? "রিসেট লিঙ্ক পাঠান" : isRegister ? "নিবন্ধন সম্পন্ন করুন" : "লগইন করুন"}</span>
                  <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Separator */}
          {!isForgotPassword && (
            <>
              <div className="relative flex items-center justify-center py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/60"></div>
                </div>
                <span className="relative px-4 bg-[#f7fcfb] text-xs font-bold text-slate-400">অথবা</span>
              </div>

              {/* Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3.5 bg-white border border-slate-100 text-slate-700 rounded-[20px] font-black text-xs sm:text-sm flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>গুগল দিয়ে প্রবেশ করুন</span>
              </button>
            </>
          )}

          {/* Footer Toggle */}
          <div className="text-center pt-2">
            {isForgotPassword ? (
              <p className="text-xs sm:text-sm font-bold text-slate-400">
                মনে পড়েছে?{" "}
                <button 
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setIsRegister(false);
                    setError("");
                    setSuccessMessage("");
                  }}
                  className="text-[#009664] font-black hover:underline cursor-pointer"
                >
                  লগইন করুন
                </button>
              </p>
            ) : isRegister ? (
              <p className="text-xs sm:text-sm font-bold text-slate-400">
                ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
                <button 
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setIsForgotPassword(false);
                    setError("");
                    setSuccessMessage("");
                  }}
                  className="text-[#009664] font-black hover:underline cursor-pointer"
                >
                  লগইন করুন
                </button>
              </p>
            ) : (
              <p className="text-xs sm:text-sm font-bold text-slate-400">
                অ্যাকাউন্ট নেই?{" "}
                <button 
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setIsForgotPassword(false);
                    setError("");
                    setSuccessMessage("");
                  }}
                  className="text-[#009664] font-black hover:underline cursor-pointer"
                >
                  নতুন অ্যাকাউন্ট তৈরি করুন
                </button>
              </p>
            )}
          </div>

        </div>

      </motion.div>
    </div>
  );
};
