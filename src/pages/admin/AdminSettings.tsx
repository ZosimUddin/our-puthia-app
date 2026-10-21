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
  AlertCircle,
  KeyRound,
  Lock,
  ShieldAlert,
  Shield
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  EmailSettings,
  DEFAULT_EMAIL_SETTINGS,
  getEmailSettings,
  updateEmailSettings,
  sendWelcomeEmail,
  sendPasswordResetCustomEmail,
  sendSecurityAlertEmail,
  generateWelcomeEmailHtml,
  generatePasswordResetEmailHtml,
  generateSecurityAlertEmailHtml
} from "../../services/emailService";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const [activeMainTab, setActiveMainTab] = useState<"welcome_email" | "password_reset_email" | "security_alert_email" | "site">("welcome_email");

  // Email Configuration State
  const [emailConfig, setEmailConfig] = useState<EmailSettings>(DEFAULT_EMAIL_SETTINGS);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState<"welcome" | "reset" | "security" | null>(null);

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

  const handleSendTestEmail = async (type: "welcome" | "reset" | "security") => {
    if (!testEmail || !testEmail.includes("@")) {
      toast.error("দয়া করে সঠিক টেস্ট ইমেইল ঠিকানা প্রদান করুন");
      return;
    }

    setIsSendingTest(true);
    try {
      let success = false;
      if (type === "welcome") {
        success = await sendWelcomeEmail({
          to: testEmail.trim(),
          name: testName.trim() || "সম্মানিত নাগরিক",
          stars: emailConfig.welcomeBonusStars || 20
        });
      } else if (type === "reset") {
        success = await sendPasswordResetCustomEmail({
          to: testEmail.trim(),
          name: testName.trim() || "সম্মানিত ব্যবহারকারী"
        });
      } else {
        success = await sendSecurityAlertEmail({
          to: testEmail.trim(),
          name: testName.trim() || "সম্মানিত ব্যবহারকারী",
          device: "Google Chrome (Windows 11)",
          location: "পুঠিয়া, রাজশাহী (আনুমানিক)"
        });
      }

      if (success) {
        toast.success(`টেস্ট ${type === "welcome" ? "স্বাগতম" : type === "reset" ? "পাসওয়ার্ড রিসেট" : "নিরাপত্তা সতর্কতা"} ইমেইল সফলভাবে মেইল কিউতে যুক্ত করা হয়েছে (${testEmail})!`);
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
                অ্যাডমিন সেটিংস ও ইমেইল নোটিফিকেশন হাব
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                পোর্টাল সেটিংস, স্বয়ংক্রিয় ওয়েলকাম ইমেইল, পাসওয়ার্ড রিসেট ও নিরাপত্তা লগইন অ্যালার্ট
              </p>
            </div>

            {/* Main Tabs Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto border border-slate-200 overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setActiveMainTab("welcome_email")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeMainTab === "welcome_email"
                    ? "bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Mail size={14} className={activeMainTab === "welcome_email" ? "text-emerald-600" : "text-slate-400"} />
                <span>স্বাগতম ইমেইল</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMainTab("password_reset_email")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeMainTab === "password_reset_email"
                    ? "bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <KeyRound size={14} className={activeMainTab === "password_reset_email" ? "text-emerald-600" : "text-slate-400"} />
                <span>পাসওয়ার্ড রিসেট</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMainTab("security_alert_email")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeMainTab === "security_alert_email"
                    ? "bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Shield size={14} className={activeMainTab === "security_alert_email" ? "text-rose-600" : "text-slate-400"} />
                <span>নিরাপত্তা অ্যালার্ট</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMainTab("site")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeMainTab === "site"
                    ? "bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sliders size={14} className={activeMainTab === "site" ? "text-emerald-600" : "text-slate-400"} />
                <span>সাইট সেটিংস</span>
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
            {/* 1. Header Hero Card */}
            <div
              className={`rounded-3xl p-6 shadow-md border relative overflow-hidden text-white ${
                activeMainTab === "security_alert_email"
                  ? "bg-gradient-to-r from-rose-950 via-red-900 to-rose-900 border-rose-800/50"
                  : "bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-950 border-emerald-700/50"
              }`}
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-white/10 text-white border border-white/20 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                      {activeMainTab === "welcome_email" ? (
                        <Mail size={12} className="text-emerald-300" />
                      ) : activeMainTab === "password_reset_email" ? (
                        <KeyRound size={12} className="text-emerald-300" />
                      ) : (
                        <Shield size={12} className="text-rose-300" />
                      )}
                      {activeMainTab === "welcome_email"
                        ? "স্বাগতম ইমেইল কনফিগারেশন"
                        : activeMainTab === "password_reset_email"
                        ? "পাসওয়ার্ড রিসেট ইমেইল কনফিগারেশন"
                        : "লগইন নিরাপত্তা অ্যালার্ট ইমেইল"}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        (activeMainTab === "welcome_email"
                          ? emailConfig.welcomeEmailEnabled
                          : activeMainTab === "password_reset_email"
                          ? emailConfig.passwordResetEmailEnabled
                          : emailConfig.securityAlertEmailEnabled)
                          ? "bg-emerald-400/20 text-emerald-300 border-emerald-400/40"
                          : "bg-rose-500/20 text-rose-300 border-rose-400/40"
                      }`}
                    >
                      {(activeMainTab === "welcome_email"
                        ? emailConfig.welcomeEmailEnabled
                        : activeMainTab === "password_reset_email"
                        ? emailConfig.passwordResetEmailEnabled
                        : emailConfig.securityAlertEmailEnabled)
                        ? "🟢 সার্ভিস সক্রিয়"
                        : "🔴 সার্ভিস নিষ্ক্রিয়"}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-white">
                    {activeMainTab === "welcome_email"
                      ? "নতুন অ্যাকাউন্ট স্বাগতম ইমেইল পরিচালনা"
                      : activeMainTab === "password_reset_email"
                      ? "পাসওয়ার্ড পরিবর্তন ও রিসেট ইমেইল পরিচালনা"
                      : "অস্বাভাবিক বা নতুন লগইন কার্যক্রম শনাক্তকরণ অ্যালার্ট"}
                  </h2>
                  <p className="text-xs md:text-sm text-slate-100/90 max-w-2xl font-medium">
                    {activeMainTab === "welcome_email"
                      ? "নতুন ব্যবহারকারী একাউন্ট রেজিস্ট্রেশন করলে তাদের ইনবক্সে পুঠিয়ার আন্তরিক স্বাগতম বার্তা পৌঁছাবে। এখানে বার্তা ও প্রেরকের তথ্য কাস্টমাইজ করুন।"
                      : activeMainTab === "password_reset_email"
                      ? "ব্যবহারকারী পাসওয়ার্ড পরিবর্তন অনুরোধ করলে তাদের ইনবক্সে পাঠানো সুরক্ষিত রিসেট ইমেইল বার্তা ও বোতাম পরিচালনা করুন।"
                      : "নতুন ডিভাইস বা অপরিচিত অবস্থান থেকে লগইন হলে ব্যবহারকারীকে তাৎক্ষণিক নিরাপত্তা সতর্কবার্তা ও ডিভাইস লগইন বিবরণ পাঠিয়ে অ্যাকাউন্ট সুরক্ষিত রাখুন।"}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setShowPreviewModal(
                        activeMainTab === "welcome_email"
                          ? "welcome"
                          : activeMainTab === "password_reset_email"
                          ? "reset"
                          : "security"
                      )
                    }
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black transition flex items-center gap-2 border border-white/20 cursor-pointer active:scale-95"
                  >
                    <Eye size={15} />
                    <span>লাইভ প্রিভিউ দেখুন</span>
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
                        <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                          {activeMainTab === "welcome_email"
                            ? "✨"
                            : activeMainTab === "password_reset_email"
                            ? "🔐"
                            : "🛡️"}
                        </span>
                        <h3 className="text-base font-black text-slate-900">
                          {activeMainTab === "welcome_email"
                            ? "স্বয়ংক্রিয় ওয়েলকাম ইমেইল সার্ভিস (Welcome Email Toggle)"
                            : activeMainTab === "password_reset_email"
                            ? "স্বয়ংক্রিয় পাসওয়ার্ড রিসেট ইমেইল সার্ভিস (Password Reset Toggle)"
                            : "নতুন/অস্বাভাবিক লগইন নিরাপত্তা অ্যালার্ট (Security Alert Toggle)"}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 font-medium pl-10 max-w-2xl">
                        {activeMainTab === "welcome_email"
                          ? "সক্রিয় থাকলে কোনো নতুন নাগরিক একাউন্ট রেজিস্ট্রেশন করার সাথে সাথে স্বয়ংক্রিয়ভাবে তার ইনবক্সে সুন্দর একটি পুঠিয়া শুভেচ্ছা ইমেইল চলে যাবে।"
                          : activeMainTab === "password_reset_email"
                          ? "সক্রিয় থাকলে কোনো ব্যবহারকারী পাসওয়ার্ড রিসেট করতে চাইলে ফায়ারবেসের মাধ্যমে তার ইনবক্সে এই নির্ধারিত নিরাপত্তা বার্তাটি চলে যাবে।"
                          : "সক্রিয় থাকলে অ্যাকাউন্টে কোনো নতুন ডিভাইস বা স্থান থেকে লগইন কার্যক্রম শনাক্ত হলে তাৎক্ষণিক সতর্কতা বার্তা পাঠানো হবে।"}
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input
                        type="checkbox"
                        checked={
                          activeMainTab === "welcome_email"
                            ? emailConfig.welcomeEmailEnabled
                            : activeMainTab === "password_reset_email"
                            ? emailConfig.passwordResetEmailEnabled
                            : emailConfig.securityAlertEmailEnabled
                        }
                        onChange={(e) => {
                          if (activeMainTab === "welcome_email") {
                            setEmailConfig({ ...emailConfig, welcomeEmailEnabled: e.target.checked });
                          } else if (activeMainTab === "password_reset_email") {
                            setEmailConfig({ ...emailConfig, passwordResetEmailEnabled: e.target.checked });
                          } else {
                            setEmailConfig({ ...emailConfig, securityAlertEmailEnabled: e.target.checked });
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>

                {/* Specific Tab Settings */}
                {activeMainTab === "welcome_email" ? (
                  /* Welcome Email Specific Customization */
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Mail className="text-emerald-600" size={18} />
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        স্বাগতম ইমেইল কনটেন্ট ও বিষয়
                      </h3>
                    </div>

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
                      <p className="text-[10px] text-slate-400 mt-1">ইনবক্সে ব্যবহারকারীর কাছে এই বিষয় লাইনটি প্রদর্শিত হবে।</p>
                    </div>

                    {/* Bonus Stars Section */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                ) : activeMainTab === "password_reset_email" ? (
                  /* Password Reset Specific Customization */
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <KeyRound className="text-emerald-600" size={18} />
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        পাসওয়ার্ড রিসেট ইমেইল কনটেন্ট
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1.5">
                          পাসওয়ার্ড রিসেট সাবজেক্ট (Subject Line)
                        </label>
                        <input
                          type="text"
                          value={emailConfig.passwordResetSubject}
                          onChange={(e) =>
                            setEmailConfig({ ...emailConfig, passwordResetSubject: e.target.value })
                          }
                          placeholder="আপনার “আমাদের পুঠিয়া” অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করুন 🔐"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">পাসওয়ার্ড রিসেটের ইমেইল বিষয়।</p>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1.5">
                          অ্যাকশন বাটনের টেক্সট (Button Label)
                        </label>
                        <input
                          type="text"
                          value={emailConfig.passwordResetButtonText}
                          onChange={(e) =>
                            setEmailConfig({ ...emailConfig, passwordResetButtonText: e.target.value })
                          }
                          placeholder="নতুন পাসওয়ার্ড সেট করুন"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">ইমেইলে দেওয়া বোতামের নাম।</p>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <ShieldAlert size={15} className="text-amber-700 shrink-0" />
                        নিরাপত্তা নোট:
                      </p>
                      <p className="text-amber-800 leading-relaxed">
                        ইমেইলে স্বয়ংক্রিয়ভাবে আপনার সাইটের নিরাপদ লিঙ্ক <code>https://our-puthia-app.vercel.app</code> সংযুক্ত থাকে এবং নিরাপত্তার স্বার্থে নির্ধারিত সময় পর লিঙ্কটি মেয়াদোত্তীর্ণ হবে।
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Security Alert Specific Customization */
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Shield className="text-rose-600" size={18} />
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        লগইন নিরাপত্তা অ্যালার্ট কনটেন্ট
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1.5">
                          নিরাপত্তা সতর্কতা সাবজেক্ট (Subject Line)
                        </label>
                        <input
                          type="text"
                          value={emailConfig.securityAlertSubject}
                          onChange={(e) =>
                            setEmailConfig({ ...emailConfig, securityAlertSubject: e.target.value })
                          }
                          placeholder="সতর্কতা: আপনার “আমাদের পুঠিয়া” অ্যাকাউন্টে নতুন বা অস্বাভাবিক লগইন কার্যক্রম শনাক্ত করা হয়েছে 🛡️"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-rose-500/30 focus:outline-none"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">ব্যবহারকারীর ইনবক্সে প্রদর্শিত সতর্কতা বিষয়।</p>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1.5">
                          নিরাপত্তা বাটনের টেক্সট (Button Label)
                        </label>
                        <input
                          type="text"
                          value={emailConfig.securityAlertButtonText}
                          onChange={(e) =>
                            setEmailConfig({ ...emailConfig, securityAlertButtonText: e.target.value })
                          }
                          placeholder="অ্যাকাউন্টের নিরাপত্তা দেখুন"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-rose-500/30 focus:outline-none"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">ইমেইলে প্রদর্শিত সুরক্ষা অ্যাকশন বাটন।</p>
                      </div>
                    </div>

                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <ShieldCheck size={15} className="text-rose-700 shrink-0" />
                        লগইন ডিটেইলস স্বয়ংক্রিয় সংযোজন:
                      </p>
                      <p className="text-rose-800 leading-relaxed">
                        ইমেইল পাঠানোর সময় সিস্টেম স্বয়ংক্রিয়ভাবে ইউজারের বর্তমান লগইন সময়, ব্রাউজার/ডিভাইসের নাম এবং আনুমানিক অবস্থান (পুঠিয়া, রাজশাহী) ইমেইল বডিতে ছক আকারে সাজিয়ে দেবে।
                      </p>
                    </div>
                  </div>
                )}

                {/* Common Sender Information Grid */}
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
                    <div className="md:col-span-2">
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
                  টেস্ট ইমেইল পাঠিয়ে যাচাই করুন (Send Test Email Sandbox)
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                আপনার সেভ করা সেটিংস ও টেমপ্লেট কেমন দেখায় তা পরীক্ষা করতে যেকোনো ইমেইলে একটি পরীক্ষামূলক বার্তা পাঠান:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="প্রাপকের নাম"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="আপনার টেস্ট ইমেইল ঠিকানা"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleSendTestEmail(
                        activeMainTab === "welcome_email"
                          ? "welcome"
                          : activeMainTab === "password_reset_email"
                          ? "reset"
                          : "security"
                      )
                    }
                    disabled={isSendingTest}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {isSendingTest ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>
                      {activeMainTab === "welcome_email"
                        ? "টেস্ট ওয়েলকাম"
                        : activeMainTab === "password_reset_email"
                        ? "টেস্ট রিসেট"
                        : "টেস্ট নিরাপত্তা"}
                    </span>
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
                  <h3 className="text-base font-black text-slate-900">
                    {showPreviewModal === "welcome"
                      ? "স্বাগতম ইমেইল লাইভ প্রিভিউ"
                      : showPreviewModal === "reset"
                      ? "পাসওয়ার্ড রিসেট ইমেইল লাইভ প্রিভিউ"
                      : "লগইন নিরাপত্তা অ্যালার্ট লাইভ প্রিভিউ"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Toggle preview type */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal("welcome")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    showPreviewModal === "welcome"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  স্বাগতম ইমেইল
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal("reset")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    showPreviewModal === "reset"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  পাসওয়ার্ড রিসেট ইমেইল
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal("security")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    showPreviewModal === "security"
                      ? "bg-rose-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  নিরাপত্তা অ্যালার্ট ইমেইল
                </button>
              </div>

              {/* Render Simulated Email Template */}
              <div
                className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-slate-50 p-2"
                dangerouslySetInnerHTML={{
                  __html:
                    showPreviewModal === "welcome"
                      ? generateWelcomeEmailHtml({
                          name: "মো: জোসিম উদ্দিন",
                          email: "test@example.com",
                          stars: emailConfig.welcomeBonusStars || 20,
                          appUrl: emailConfig.websiteUrl,
                          senderName: emailConfig.senderName,
                          supportEmail: emailConfig.supportEmail
                        })
                      : showPreviewModal === "reset"
                      ? generatePasswordResetEmailHtml({
                          name: "মো: জোসিম উদ্দিন",
                          email: "test@example.com",
                          resetLink: `${emailConfig.websiteUrl}/login?reset=true`,
                          appUrl: emailConfig.websiteUrl,
                          senderName: emailConfig.senderName,
                          buttonText: emailConfig.passwordResetButtonText
                        })
                      : generateSecurityAlertEmailHtml({
                          name: "মো: জোসিম উদ্দিন",
                          email: "test@example.com",
                          time: new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" }),
                          device: "Google Chrome (Windows 11)",
                          location: "পুঠিয়া, রাজশাহী (আনুমানিক)",
                          appUrl: emailConfig.websiteUrl,
                          securityLink: `${emailConfig.websiteUrl}/profile`,
                          buttonText: emailConfig.securityAlertButtonText
                        })
                }}
              />

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(null)}
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
