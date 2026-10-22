import React, { useState } from "react";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { getFriendlyAuthErrorMessage } from "../utils/authMessages";
import { X, Lock, Mail, Phone, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithEmail, resetPassword } = useAuth();
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form Fields
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      if (isForgotPassword) {
        if (!emailOrPhone.trim()) {
          throw new Error("দয়া করে আপনার ইমেইল ঠিকানাটি প্রদান করুন।");
        }
        await resetPassword(emailOrPhone.trim());
        setSuccessMessage("আপনার ইমেইলে পাসওয়ার্ড রিসেট করার লিঙ্ক পাঠানো হয়েছে। অনুগ্রহ করে আপনার ইনবক্স (বা স্প্যাম ফোল্ডার) চেক করুন।");
      } else {
        if (!emailOrPhone.trim() || !password) {
          throw new Error("মোবাইল নম্বর বা ইমেইল এবং পাসওয়ার্ড প্রদান করুন।");
        }
        await loginWithEmail(emailOrPhone.trim(), password, rememberMe);
        onClose();
      }
    } catch (err: any) {
      if (
        err?.code !== 'auth/invalid-credential' && 
        err?.code !== 'auth/wrong-password' && 
        err?.code !== 'auth/user-not-found'
      ) {
        console.error("AuthModal error:", err);
      } else {
        console.warn("AuthModal notice: User entered incorrect credentials");
      }
      setError(getFriendlyAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gradient-to-b from-[#f2fcf9] via-[#f7fcfb] to-[#eaf5f2] sm:bg-black/60 sm:backdrop-blur-sm overflow-y-auto">
      {/* Backdrop (desktop only) */}
      <div className="hidden sm:block absolute inset-0" onClick={onClose} />
      
      {/* Modal Box */}
      <motion.div 
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-gradient-to-b from-[#f2fcf9] via-[#f7fcfb] to-[#eaf5f2] border-0 sm:border sm:border-emerald-100 rounded-3xl sm:rounded-[32px] w-full max-w-md relative shadow-none sm:shadow-2xl overflow-hidden flex flex-col z-10 font-sans select-none my-auto"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-emerald-100/60 hover:bg-emerald-200/80 text-emerald-900 rounded-full transition-colors cursor-pointer z-30 shadow-2xs"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Central Lock Emblem Header */}
        <div className="pt-8 pb-3 px-6 text-center relative z-10 flex flex-col items-center">
          <div className="w-[84px] h-[84px] rounded-full bg-emerald-50/80 border border-emerald-100 flex items-center justify-center shadow-[0_8px_30px_rgba(16,185,129,0.12)] mb-3">
            <div className="w-[68px] h-[68px] rounded-full bg-[#E5FDF6] border-[2px] border-emerald-300/40 flex items-center justify-center shadow-inner">
              <div className="w-[54px] h-[54px] rounded-full bg-white flex items-center justify-center shadow-[0_4px_16px_rgba(16,185,129,0.06)] border border-white">
                <Lock className="w-6 h-6 text-emerald-600 stroke-[2.5]" />
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-black text-[#01412F] tracking-tight">
            {isForgotPassword ? "পাসওয়ার্ড ভুলে গেছেন?" : "স্বাগতম! ফিরে এসেছেন?"}
          </h2>
          <p className="text-xs font-bold text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
            {isForgotPassword 
              ? "আপনার ইমেইল ঠিকানা দিলে রিসেট লিঙ্ক পাঠানো হবে" 
              : "আপনার অ্যাকাউন্ট লগইন করে সেবাগুলো উপভোগ করুন"}
          </p>
        </div>

        {/* Form area */}
        <div className="px-6 pb-7 pt-2 space-y-4">
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

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Email / Mobile Field */}
            <div className="space-y-1.5 text-left">
              <label className="block text-left text-xs font-black text-[#01412F]/80 ml-2">
                {isForgotPassword ? "আপনার ইমেইল ঠিকানা *" : "মোবাইল নম্বর বা ইমেইল *"}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600">
                  {isForgotPassword ? (
                    <Mail size={18} className="stroke-[2.5]" />
                  ) : (
                    <Phone size={18} className="stroke-[2.5]" />
                  )}
                </div>
                <input
                  type={isForgotPassword ? "email" : "text"}
                  required
                  placeholder={isForgotPassword ? "example@mail.com" : "মোবাইল নম্বর বা ইমেইল"}
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500 transition-all font-bold text-slate-700 placeholder-slate-400 text-xs sm:text-sm shadow-sm"
                />
              </div>
            </div>

            {/* Password Field (Only in Login Mode) */}
            {!isForgotPassword && (
              <div className="space-y-1.5 text-left">
                <label className="block text-left text-xs font-black text-[#01412F]/80 ml-2">
                  পাসওয়ার্ড *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600">
                    <Lock size={18} className="stroke-[2.5]" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="পাসওয়ার্ড"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 bg-white border border-slate-100 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500 transition-all font-bold text-slate-700 placeholder-slate-400 text-xs sm:text-sm shadow-sm"
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
            {!isForgotPassword && (
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
                  <span>{isForgotPassword ? "রিসেট লিঙ্ক পাঠান" : "লগইন করুন"}</span>
                  <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Back to Login Link when in Forgot Password Mode */}
          {isForgotPassword && (
            <div className="text-center pt-2">
              <p className="text-xs sm:text-sm font-bold text-slate-400">
                মনে পড়েছে?{" "}
                <button 
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setError("");
                    setSuccessMessage("");
                  }}
                  className="text-[#009664] font-black hover:underline cursor-pointer"
                >
                  লগইন করুন
                </button>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthModal;
