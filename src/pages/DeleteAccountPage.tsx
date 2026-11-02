import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  ArrowLeft, 
  Trash2, 
  AlertTriangle, 
  ShieldAlert, 
  Info,
  CheckCircle2,
  Lock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { toast } from "sonner";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "../firebase";
import { requestAccountDeletion } from "../services/privacySecurityService";
import SEO from "../components/SEO";

export default function DeleteAccountPage() {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const displayName = user?.displayName || "সম্মানিত নাগরিক";

  const handleDeleteRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error(language === "en" ? "Please enter your password" : "অনুগ্রহ করে আপনার পাসওয়ার্ড প্রদান করুন");
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!user || !user.email) return;
    setIsDeleting(true);
    try {
      // 1. Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // 2. Request Deletion in Firestore (Grace period starts)
      await requestAccountDeletion(user.uid, "User requested permanent deletion via account settings page.");

      // 3. Inform user and Logout
      toast.success(language === "en" 
        ? "Account deletion request submitted. 30-day grace period started." 
        : "অ্যাকাউন্ট মোছার আবেদন সফলভাবে জমা হয়েছে। ৩০ দিনের গ্রেস পিরিয়ড শুরু হয়েছে।"
      );
      
      setTimeout(async () => {
        await logout();
        navigate("/login");
      }, 2000);

    } catch (err: any) {
      console.error(err);
      const msg = err.code === "auth/wrong-password" 
        ? (language === "en" ? "Incorrect password. Please try again." : "ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।")
        : (language === "en" ? "Failed to verify identity. Please try again later." : "পরিচয় যাচাই করতে ব্যর্থ হয়েছে। পরে আবার চেষ্টা করুন।");
      toast.error(msg);
    } finally {
      setIsDeleting(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12 select-none text-slate-900">
      <SEO 
        title={language === "en" ? "Delete Account - Amader Puthia" : "অ্যাকাউন্ট মুছুন - আমাদের পুঠিয়া"}
        description="Permanently delete your Amader Puthia account and all associated data"
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-2xs">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 active:scale-95 transition cursor-pointer border-none bg-transparent"
          >
            <ArrowLeft size={22} className="stroke-[2.5]" />
          </button>
          <h1 className="text-xl font-black text-slate-950 tracking-tight">
            {language === "en" ? "Delete Account" : "অ্যাকাউন্ট মুছুন"}
          </h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-5">
        {/* Warning Box */}
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3.5">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-2xs">
            <Trash2 size={20} className="text-rose-600" />
          </div>
          <p className="text-[13px] font-bold text-rose-800 leading-relaxed">
            {language === "en" 
              ? "Amader Puthia (Website & Android App) account and all data permanent removal instructions."
              : "আমাদের পুঠিয়া (ওয়েবসাইট ও Android অ্যাপ) অ্যাকাউন্ট এবং এর সব তথ্য স্থায়ীভাবে মোছার উপায়।"}
          </p>
        </div>

        {/* What will be deleted section */}
        <div className="space-y-3">
          <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" />
            <span>{language === "en" ? "What will be deleted" : "যা মুছে যাবে"}</span>
          </h2>
          
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-4">
            <ul className="space-y-3">
              {[
                { 
                  bn: "প্রোফাইল: নাম, মোবাইল নম্বর, ইমেইল, ছবি, এলাকা", 
                  en: "Profile: Name, Mobile, Email, Photos, Location" 
                },
                { 
                  bn: "রক্তদাতার তথ্য, রক্তের অনুরোধ ও কথোপকথন", 
                  en: "Blood Donor Info: Requests and Chats" 
                },
                { 
                  bn: "আড্ডার পোস্ট, ছবি, মন্তব্য, মেসেজ ও বন্ধু তালিকা", 
                  en: "Adda: Posts, Photos, Comments, Messages, Friends" 
                },
                { 
                  bn: "আপনার দেওয়া রাইড, চাকরি ও টিউশনের বিজ্ঞপ্তি, পয়েন্ট", 
                  en: "Ads: Ride, Job & Tuition notices, Points" 
                },
                { 
                  bn: "নোটিফিকেশনের টোকেন ও লগইন সেশন", 
                  en: "System: Notification tokens & Login sessions" 
                }
              ].map((item, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                  <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                    {language === "en" ? item.en : item.bn}
                  </p>
                </li>
              ))}
            </ul>
            
            <p className="text-[12px] text-slate-500 leading-relaxed italic border-t border-slate-50 pt-3">
              {language === "en"
                ? "Data is removed immediately from production; however, it may remain in secure server backups for up to 30 days. Anonymous statistics (like total visit count) may persist."
                : "মোছার সাথে সাথে তথ্য সরিয়ে ফেলা হয়; সার্ভারের নিরাপত্তা-ব্যাকআপ থেকে সর্বোচ্চ ৩০ দিনে মুছে যায়। নামবিহীন পরিসংখ্যান (যেমন মোট ভিজিট সংখ্যা) থেকে যেতে পারে।"}
            </p>
          </div>
        </div>

        {/* How to delete section */}
        <div className="space-y-3">
          <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
            <Info size={20} className="text-blue-500" />
            <span>{language === "en" ? "How to delete" : "যেভাবে মুছবেন"}</span>
          </h2>
          
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="font-black text-slate-900 text-sm">১.</span>
                <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                  <strong className="text-slate-900">{language === "en" ? "App: " : "এপে: "}</strong>
                  {language === "en" 
                    ? "Go to Me tab → Delete Account → Confirm with password." 
                    : "নিচের আমি ট্যাব → অ্যাকাউন্ট মুছুন → পাসওয়ার্ড দিয়ে নিশ্চিত করুন।"}
                </p>
              </div>
              <div className="flex gap-3">
                <span className="font-black text-slate-900 text-sm">২.</span>
                <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                  <strong className="text-slate-900">{language === "en" ? "Website: " : "ওয়েবসাইটে: "}</strong>
                  {language === "en" 
                    ? "Login and enter password in the box below." 
                    : "লগইন করে এই পেজেই নিচের বক্সে পাসওয়ার্ড দিন।"}
                </p>
              </div>
              <div className="flex gap-3">
                <span className="font-black text-slate-900 text-sm">৩.</span>
                <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                  <strong className="text-slate-900">{language === "en" ? "If unable to login: " : "লগইন করতে না পারলে: "}</strong>
                  {language === "en" 
                    ? "Send request with registered mobile number via contact page - will be deleted within 7 days after verification." 
                    : "নিচের যোগাযোগে আপনার নিবন্ধিত মোবাইল নম্বরসহ অনুরোধ পাঠান — যাচাই করে ৭ দিনের মধ্যে মুছে দেওয়া হবে।"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Deletion Form */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">
                {language === "en" ? "Currently Logged In" : "লগইন আছেন"}
              </p>
              <h3 className="text-[15px] font-black text-slate-950">
                {displayName}
              </h3>
            </div>
          </div>

          <form onSubmit={handleDeleteRequest} className="space-y-4">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={18} />
              </div>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={language === "en" ? "Password" : "পাসওয়ার্ড"}
                className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition font-medium text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isDeleting}
              className="w-full h-14 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-black text-base rounded-2xl shadow-lg shadow-rose-600/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <Trash2 size={20} />
              <span>{language === "en" ? "Permanently Delete Account" : "অ্যাকাউন্ট স্থায়ীভাবে মুছুন"}</span>
            </button>
          </form>
        </div>

        {/* Contact Section */}
        <div className="space-y-3 px-1 pt-2">
          <h2 className="text-[13px] font-black text-slate-500 uppercase tracking-wider">
            {language === "en" ? "Contact" : "যোগাযোগ"}
          </h2>
          <ul className="space-y-2">
            <li>
              <button 
                onClick={() => navigate("/contact")}
                className="text-[13px] font-bold text-slate-700 hover:text-indigo-600 flex items-center gap-2 transition"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span>{language === "en" ? "Website Contact Page" : "ওয়েবসাইটে মতামত দিন পেজ"}</span>
              </button>
            </li>
          </ul>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-slate-100 space-y-5 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert size={32} strokeWidth={2.5} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-950">
                {language === "en" ? "Are you sure?" : "আপনি কি নিশ্চিত?"}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                {language === "en" 
                  ? "Your account will be permanently deleted after 30 days. This action cannot be undone once the period expires."
                  : "আপনার অ্যাকাউন্টটি ৩০ দিন পর স্থায়ীভাবে মুছে ফেলা হবে। এই সময়ের পর তথ্য আর ফিরে পাওয়া যাবে না।"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm rounded-xl transition cursor-pointer"
              >
                {language === "en" ? "Cancel" : "বাতিল করুন"}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="h-12 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm rounded-xl transition cursor-pointer flex items-center justify-center"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  language === "en" ? "Delete Now" : "মুছে ফেলুন"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
