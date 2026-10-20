import React, { useState, useEffect } from "react";
import SiteSettingsManagement from "../../components/admin/SiteSettingsManagement";
import {
  Mail,
  Settings,
  Send,
  Save,
  CheckCircle2,
  RefreshCw,
  Eye,
  Sliders,
  Sparkles,
  ShieldCheck,
  Globe,
  AtSign,
  User,
  Heart,
  X,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  EmailSettings,
  DEFAULT_EMAIL_SETTINGS,
  getEmailSettings,
  updateEmailSettings,
  sendWelcomeEmail,
  generateWelcomeEmailHtml
} from "../../services/emailService";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const [activeMainTab, setActiveMainTab] = useState<"site" | "email">("email");

  // Email Configuration State
  const [emailConfig, setEmailConfig] = useState<EmailSettings>(DEFAULT_EMAIL_SETTINGS);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Test Email State
  const [testEmail, setTestEmail] = useState("");
  const [testName, setTestName] = useState("টেস্ট নাগরিক");
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    loadEmailSettings();
  }, []);

  const loadEmailSettings = async () => {
    setLoadingConfig(true);
    try {
      const data = await getEmailSettings();
      setEmailConfig(data);
    } catch (err) {
      console.error("Failed to load email settings:", err);
      toast.error("ইমেইল কনফিগারেশন লোড করতে ব্যর্থ হয়েছে");
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateEmailSettings(emailConfig, {
        name: user?.displayName || user?.email?.split("@")[0] || "সুপার অ্যাডমিন",
        email: user?.email || ""
      });
      toast.success("ইমেইল সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে!");
    } catch (err) {
      console.error("Error saving email settings:", err);
      toast.error("সেটিংস সংরক্ষণ করতে ব্যর্থ হয়েছে");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast.error("দয়া করে সঠিক টেস্ট ইমেইল ঠিকানা প্রদান করুন");
      return;
    }

    setIsSendingTest(true);
    try {
      const success = await sendWelcomeEmail({
        to: testEmail.trim(),
        name: testName.trim() || "সম্মানিত নাগরিক",
        stars: emailConfig.welcomeBonusStars || 20
      });

      if (success) {
        toast.success(`টেস্ট ইমেইলটি সফলভাবে ফায়ারবেস মেইল কিউতে যুক্ত করা হয়েছে (${testEmail})!`);
      } else {
        toast.error("ইমেইল সার্ভিস বর্তমানে নিষ্ক্রিয় রয়েছে অথবা ভুল ইমেইল প্রদান করা হয়েছে");
      }
    } catch (err) {
      console.error("Error sending test email:", err);
      toast.error("টেস্ট ইমেইল পাঠাতে ব্যর্থ হয়েছে");
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Top Header & Tab Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Settings className="text-emerald-600" size={22} />
                অ্যাডমিন সেটিংস ও কনফিগারেশন
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                পোর্টাল কনফিগারেশন, মেটাডেটা, নোটিফিকেশন ও স্বয়ংক্রিয় ইমেইল ব্যবস্থাপনা
              </p>
            </div>

            {/* Main Tabs Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveMainTab("email")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  activeMainTab === "email"
                    ? "bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Mail size={15} className={activeMainTab === "email" ? "text-emerald-600" : "text-slate-400"} />
                <span>ইমেইল সেটিংস</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>

              <button
                type="button"
                onClick={() => setActiveMainTab("site")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  activeMainTab === "site"
                    ? "bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sliders size={15} className={activeMainTab === "site" ? "text-emerald-600" : "text-slate-400"} />
                <span>সাধারণ সাইট সেটিংস</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeMainTab === "site" ? (
          <SiteSettingsManagement />
        ) : (
          <div className="space-y-6">
            {/* 1. Header Hero Card for Email Settings */}
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-950 text-white rounded-3xl p-6 shadow-md border border-emerald-700/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                      <Mail size={12} className="text-emerald-300" />
                      ফায়ারবেস ইমেইল অটোমেশন
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        emailConfig.welcomeEmailEnabled
                          ? "bg-emerald-400/20 text-emerald-300 border-emerald-400/40"
                          : "bg-rose-500/20 text-rose-300 border-rose-400/40"
                      }`}
                    >
                      {emailConfig.welcomeEmailEnabled ? "🟢 সার্ভিস সক্রিয়" : "🔴 সার্ভিস নিষ্ক্রিয়"}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-white">
                    স্বয়ংক্রিয় ওয়েলকাম ইমেইল কনফিগারেশন
                  </h2>
                  <p className="text-xs md:text-sm text-emerald-100/90 max-w-2xl font-medium">
                    নতুন ব্যবহারকারী একাউন্ট খুললে তাদের জিমেইলে পুঠিয়ার আন্তরিক স্বাগতম বার্তা পৌঁছাবে। এখান থেকে আপনি বার্তা পাঠানোর সুইচ ও প্রেরকের তথ্য কাস্টমাইজ করতে পারবেন।
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black transition flex items-center gap-2 border border-white/20 cursor-pointer active:scale-95"
                  >
                    <Eye size={15} />
                    <span>ইমেইল প্রিভিউ</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Main Form & Configuration Panels */}
            {loadingConfig ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <RefreshCw size={28} className="animate-spin mx-auto text-emerald-600 mb-2" />
                <p className="text-xs font-black text-slate-600">ইমেইল সেটিংস লোড করা হচ্ছে...</p>
              </div>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* Master Toggle Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs transition hover:border-emerald-300">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                          ✨
                        </span>
                        <h3 className="text-base font-black text-slate-900">
                          স্বয়ংক্রিয় ওয়েলকাম ইমেইল সার্ভিস (Toggle Switch)
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 font-medium pl-10 max-w-2xl">
                        সক্রিয় থাকলে কোনো নতুন নাগরিক একাউন্ট রেজিস্ট্রেশন করার সাথে সাথে স্বয়ংক্রিয়ভাবে তার ইনবক্সে সুন্দর একটি পুঠিয়া শুভেচ্ছা ইমেইল চলে যাবে।
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input
                        type="checkbox"
                        checked={emailConfig.welcomeEmailEnabled}
                        onChange={(e) =>
                          setEmailConfig({
                            ...emailConfig,
                            welcomeEmailEnabled: e.target.checked
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>

                {/* Sender Information Grid */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <User className="text-emerald-600" size={18} />
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      প্রেরকের তথ্য ও যোগাযোগ (Sender Information)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sender Name */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        প্রেরকের নাম (Sender Display Name)
                      </label>
                      <div className="relative">
                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={emailConfig.senderName}
                          onChange={(e) =>
                            setEmailConfig({ ...emailConfig, senderName: e.target.value })
                          }
                          placeholder="যেমন: আমাদের পুঠিয়া টিম"
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">ব্যবহারকারীর ইনবক্সে এই নামটি প্রেরক হিসেবে প্রদর্শিত হবে।</p>
                    </div>

                    {/* Sender Email */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        প্রেরকের ইমেইল (From Email)
                      </label>
                      <div className="relative">
                        <AtSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={emailConfig.senderEmail}
                          onChange={(e) =>
                            setEmailConfig({ ...emailConfig, senderEmail: e.target.value })
                          }
                          placeholder="support@ourputhia.com"
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">প্রেরকের অফিসিয়াল ইমেইল অ্যাড্রেস।</p>
                    </div>

                    {/* Reply-To Email */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        রিপ্লাই-টু ইমেইল (Reply-To Email)
                      </label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={emailConfig.replyToEmail}
                          onChange={(e) =>
                            setEmailConfig({ ...emailConfig, replyToEmail: e.target.value })
                          }
                          placeholder="support@ourputhia.com"
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">ইউজার ইমেইলে রিপ্লাই দিলে এই ঠিকানায় আসবে।</p>
                    </div>

                    {/* Support Helpline Email */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        সাপোর্ট ও যোগাযোগ ইমেইল
                      </label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={emailConfig.supportEmail}
                          onChange={(e) =>
                            setEmailConfig({ ...emailConfig, supportEmail: e.target.value })
                          }
                          placeholder="support@ourputhia.com"
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">ইমেইল ফুটারের যোগাযোগ সেকশনে দৃশ্যমান হবে।</p>
                    </div>

                    {/* Website URL */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        পোর্টাল বা ওয়েবসাইট লিংক (Portal URL)
                      </label>
                      <div className="relative">
                        <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="url"
                          value={emailConfig.websiteUrl}
                          onChange={(e) =>
                            setEmailConfig({ ...emailConfig, websiteUrl: e.target.value })
                          }
                          placeholder="https://our-puthia-app.vercel.app"
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">বাটনে ক্লিক করলে ইউজারকে এই লিংকে নিয়ে যাবে।</p>
                    </div>

                    {/* Subject Template */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        ইমেইল বিষয় (Subject Line)
                      </label>
                      <input
                        type="text"
                        value={emailConfig.subjectTemplate}
                        onChange={(e) =>
                          setEmailConfig({ ...emailConfig, subjectTemplate: e.target.value })
                        }
                        placeholder="আমাদের পুঠিয়া পরিবারে আপনাকে স্বাগতম! 💚"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">ব্যবহারকারীর ইনবক্সে প্রদর্শিত সাবজেক্ট লাইন।</p>
                    </div>
                  </div>

                  {/* Bonus Stars Section */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="includeStarBonus"
                        checked={emailConfig.includeStarBonus}
                        onChange={(e) =>
                          setEmailConfig({
                            ...emailConfig,
                            includeStarBonus: e.target.checked
                          })
                        }
                        className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                      />
                      <label htmlFor="includeStarBonus" className="text-xs font-black text-slate-800 cursor-pointer">
                        ⭐ স্বাগতম নাগরিক স্টার পয়েন্ট বোনাস উল্লেখ করুন
                      </label>
                    </div>

                    {emailConfig.includeStarBonus && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">পয়েন্ট পরিমাণ:</span>
                        <input
                          type="number"
                          min={0}
                          value={emailConfig.welcomeBonusStars}
                          onChange={(e) =>
                            setEmailConfig({
                              ...emailConfig,
                              welcomeBonusStars: parseInt(e.target.value) || 0
                            })
                          }
                          className="w-20 text-center py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black"
                        />
                        <span className="text-xs font-bold text-slate-500">স্টার</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Buttons Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-500 font-medium">
                    {emailConfig.lastUpdated && (
                      <span>সর্বশেষ আপডেট: {new Date(emailConfig.lastUpdated).toLocaleDateString("bn-BD")}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEmailConfig(DEFAULT_EMAIL_SETTINGS)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer"
                    >
                      ডিফল্ট রিসেট
                    </button>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      {isSaving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                      <span>পরিবর্তন সংরক্ষণ করুন</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* 3. Send Test Email Sandbox Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Send className="text-emerald-600" size={18} />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  টেস্ট ইমেইল পাঠিয়ে যাচাই করুন (Send Test Email)
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                আপনার সেভ করা সেটিংস ও টেমপ্লেট কেমন দেখায় তা পরীক্ষা করতে যেকোনো ইমেইলে একটি পরীক্ষামূলক বার্তা পাঠান:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="প্রাপকের নাম"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="আপনার টেস্ট ইমেইল ঠিকানা"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={isSendingTest}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {isSendingTest ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>টেস্ট ইমেইল পাঠান</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Live Email Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="text-emerald-600" size={18} />
                  <h3 className="text-base font-black text-slate-900">ইমেইল লাইভ ভিজ্যুয়াল প্রিভিউ</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Render Simulated Email Template */}
              <div
                className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-slate-50 p-2"
                dangerouslySetInnerHTML={{
                  __html: generateWelcomeEmailHtml({
                    name: "মো: জোসিম উদ্দিন",
                    email: "test@example.com",
                    stars: emailConfig.welcomeBonusStars || 20,
                    appUrl: emailConfig.websiteUrl,
                    senderName: emailConfig.senderName,
                    supportEmail: emailConfig.supportEmail
                  })
                }}
              />

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSettings;
