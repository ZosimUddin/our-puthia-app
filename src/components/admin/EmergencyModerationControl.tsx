import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  MessageCircle, 
  FileText, 
  UserPlus, 
  MessageSquare, 
  CheckCircle2, 
  RefreshCw, 
  Megaphone, 
  Clock, 
  ShieldCheck, 
  Radio, 
  Siren, 
  Eye, 
  AlertOctagon,
  Sparkles,
  Ban
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { logAuditActivity } from '../../services/auditLogger';
import toast from 'react-hot-toast';

export interface EmergencyLockdownConfig {
  isLockdownActive: boolean;
  blockNewPosts: boolean;
  blockNewComments: boolean;
  blockNewRegistrations: boolean;
  limitMessaging: boolean;
  emergencyReason: string;
  broadcastBannerMessage: string;
  activatedBy: string;
  activatedAt: string;
  updatedAt: string;
}

export const EmergencyModerationControl: React.FC = () => {
  const { user, userProfile } = useAuth();

  // State
  const [config, setConfig] = useState<EmergencyLockdownConfig>({
    isLockdownActive: false,
    blockNewPosts: false,
    blockNewComments: false,
    blockNewRegistrations: false,
    limitMessaging: false,
    emergencyReason: 'জরুরি সাইবার নিরাপত্তা ও সার্বিক আইনশৃঙ্খলা রক্ষা বজায় রাখার স্বার্থে',
    broadcastBannerMessage: '⚠️ জরুরি নিরাপত্তামূলক ব্যবস্থার অংশ হিসেবে আড্ডার নতুন পোস্ট ও কমেন্ট প্রকাশ সাময়িকভাবে নিয়ন্ত্রিত রয়েছে।',
    activatedBy: '',
    activatedAt: '',
    updatedAt: ''
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'enable' | 'disable'>('enable');

  // 1. Live Firestore Listener for Emergency Settings
  useEffect(() => {
    setLoading(true);
    const settingsRef = doc(db, 'system_settings', 'emergency_lockdown');
    
    const unsubscribe = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setConfig({
          isLockdownActive: Boolean(d.isLockdownActive),
          blockNewPosts: Boolean(d.blockNewPosts),
          blockNewComments: Boolean(d.blockNewComments),
          blockNewRegistrations: Boolean(d.blockNewRegistrations),
          limitMessaging: Boolean(d.limitMessaging),
          emergencyReason: d.emergencyReason || 'জরুরি সাইবার নিরাপত্তা ও সার্বিক আইনশৃঙ্খলা বজায় রাখার স্বার্থে',
          broadcastBannerMessage: d.broadcastBannerMessage || '⚠️ জরুরি নিরাপত্তামূলক ব্যবস্থার অংশ হিসেবে আড্ডার নতুন পোস্ট ও কমেন্ট প্রকাশ সাময়িকভাবে নিয়ন্ত্রিত রয়েছে।',
          activatedBy: d.activatedBy || '',
          activatedAt: d.activatedAt ? (typeof d.activatedAt === 'string' ? d.activatedAt : new Date(d.activatedAt.seconds * 1000).toISOString()) : '',
          updatedAt: d.updatedAt ? (typeof d.updatedAt === 'string' ? d.updatedAt : new Date(d.updatedAt.seconds * 1000).toISOString()) : ''
        });
      } else {
        // Initialize default doc
        setDoc(settingsRef, {
          isLockdownActive: false,
          blockNewPosts: false,
          blockNewComments: false,
          blockNewRegistrations: false,
          limitMessaging: false,
          emergencyReason: 'জরুরি সাইবার নিরাপত্তা ও সার্বিক আইনশৃঙ্খলা বজায় রাখার স্বার্থে',
          broadcastBannerMessage: '⚠️ জরুরি নিরাপত্তামূলক ব্যবস্থার অংশ হিসেবে আড্ডার নতুন পোস্ট ও কমেন্ট প্রকাশ সাময়িকভাবে নিয়ন্ত্রিত রয়েছে।',
          activatedBy: '',
          updatedAt: serverTimestamp()
        }).catch(() => null);
      }
      setLoading(false);
    }, (err) => {
      console.error('Firestore emergency_lockdown listener error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Save Settings to Firestore
  const handleSaveSettings = async (newConfig: EmergencyLockdownConfig, isToggleMaster = false) => {
    setUpdating(true);
    try {
      const settingsRef = doc(db, 'system_settings', 'emergency_lockdown');
      
      const payload = {
        ...newConfig,
        activatedBy: userProfile?.name || user?.displayName || 'সুপার এডমিন',
        activatedAt: newConfig.isLockdownActive ? new Date().toISOString() : newConfig.activatedAt,
        updatedAt: serverTimestamp()
      };

      await setDoc(settingsRef, payload, { merge: true });

      // Audit Log
      await logAuditActivity({
        action: newConfig.isLockdownActive ? 'ENABLE_EMERGENCY_LOCKDOWN' : 'DISABLE_EMERGENCY_LOCKDOWN',
        details: `সুপার এডমিন ইমার্জেন্সি মোড ${newConfig.isLockdownActive ? 'চালু (🔴 Lock Down Active)' : 'বন্ধ (🟢 Normal Mode)'} করেছেন। বিবরণ: [পোস্ট: ${newConfig.blockNewPosts ? 'বন্ধ' : 'খোলা'}, কমেন্ট: ${newConfig.blockNewComments ? 'বন্ধ' : 'খোলা'}, রেজিস্ট্রেশন: ${newConfig.blockNewRegistrations ? 'বন্ধ' : 'খোলা'}, মেসেজিং: ${newConfig.limitMessaging ? 'সীমিত' : 'স্বাভাবিক'}]`,
        category: 'security',
        severity: 'critical',
        targetType: 'system'
      });

      if (isToggleMaster) {
        if (newConfig.isLockdownActive) {
          toast.error('🔴 Lock Down Adda ইমার্জেন্সি লকডাউন সফলভাবে চালু করা হয়েছে!');
        } else {
          toast.success('🟢 ইমার্জেন্সি লকডাউন প্রত্যাহার করে স্বাভাবিক মোড চালু করা হয়েছে!');
        }
      } else {
        toast.success('⚙️ ইমার্জেন্সি মডারেশন কনফিগারেশন আপডেট করা হয়েছে');
      }

      setShowConfirmModal(false);
    } catch (err) {
      console.error(err);
      toast.error('ইমার্জেন্সি মোড আপডেটে সমস্যা হয়েছে');
    } finally {
      setUpdating(false);
    }
  };

  // Master One-Click Toggle
  const handleMasterToggle = () => {
    const nextState = !config.isLockdownActive;
    const updated: EmergencyLockdownConfig = {
      ...config,
      isLockdownActive: nextState,
      // If enabling master, turn all 4 switches on by default for instant security
      blockNewPosts: nextState ? true : false,
      blockNewComments: nextState ? true : false,
      blockNewRegistrations: nextState ? true : false,
      limitMessaging: nextState ? true : false
    };

    handleSaveSettings(updated, true);
  };

  // Individual Switch Toggle
  const handleSwitchToggle = (key: keyof EmergencyLockdownConfig) => {
    const updated = {
      ...config,
      [key]: !config[key],
      // If at least one switch is active, keep master lockdown active
      isLockdownActive: !config[key] || config.blockNewPosts || config.blockNewComments || config.blockNewRegistrations || config.limitMessaging
    };
    handleSaveSettings(updated, false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center text-slate-400 border border-slate-100 shadow-2xs">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-rose-600 mb-2" />
        <p className="text-xs font-bold">ইমার্জেন্সি সেটিং ডাটাবেজ লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-fade-in font-sans pb-16">
      
      {/* 1. MASTER EMERGENCY BANNER */}
      <div className={`border rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden transition-all duration-500 ${
        config.isLockdownActive
          ? 'bg-gradient-to-br from-rose-950 via-red-900 to-rose-900 border-rose-500/80 ring-4 ring-rose-500/30'
          : 'bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 border-slate-700'
      }`}>
        {/* Glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className={`p-4 rounded-2xl border backdrop-blur-md shadow-md shrink-0 ${
              config.isLockdownActive
                ? 'bg-rose-500/30 text-rose-200 border-rose-400/50 animate-pulse'
                : 'bg-white/10 text-white border-white/20'
            }`}>
              <Siren className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full border shadow-2xs ${
                  config.isLockdownActive
                    ? 'bg-rose-500 text-white border-rose-300 animate-bounce'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${config.isLockdownActive ? 'bg-white animate-ping' : 'bg-emerald-400'}`} />
                  {config.isLockdownActive ? '🔴 LOCK DOWN ADDA ACTIVE' : '🟢 NORMAL SYSTEM STATUS'}
                </span>

                {config.activatedAt && (
                  <span className="text-[11px] font-bold bg-black/40 text-slate-300 px-2.5 py-0.5 rounded-full border border-white/10">
                    সর্বশেষ আপডেট: {new Date(config.activatedAt).toLocaleString('bn-BD')}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Emergency Moderation Command Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 font-medium mt-1 max-w-2xl">
                জরুরি সাইবার নিরাপত্তা বা সামাজিক স্থিতিশীলতার প্রয়োজনে এক ক্লিকে প্ল্যাটফর্মের পোস্ট, কমেন্ট, মেসেজিং ও নতুন রেজিস্টার নিয়ন্ত্রণ
              </p>
            </div>
          </div>

          {/* MASTER LOCK DOWN BUTTON */}
          <button
            onClick={() => {
              setConfirmAction(config.isLockdownActive ? 'disable' : 'enable');
              setShowConfirmModal(true);
            }}
            disabled={updating}
            className={`px-6 py-4 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-xl flex items-center gap-2.5 cursor-pointer shrink-0 active:scale-95 ${
              config.isLockdownActive
                ? 'bg-white text-rose-900 hover:bg-rose-50 border border-rose-200'
                : 'bg-rose-600 text-white hover:bg-rose-700 border border-rose-500 shadow-rose-900/40'
            }`}
          >
            {config.isLockdownActive ? (
              <>
                <Unlock size={18} className="text-rose-700" />
                <span>ইমার্জেন্সি লকডাউন প্রত্যাহার করুন</span>
              </>
            ) : (
              <>
                <Lock size={18} className="text-white" />
                <span>🔴 LOCK DOWN ADDA এক ক্লিকে চালু করুন</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. GRANULAR EMERGENCY CONTROLS (4 SWITCHES) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Switch 1: Block New Posts */}
        <div className={`p-5 rounded-3xl border transition-all space-y-3 ${
          config.blockNewPosts
            ? 'bg-rose-50/80 border-rose-300 shadow-xs'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-2xl ${config.blockNewPosts ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <FileText size={20} />
            </div>

            <button
              onClick={() => handleSwitchToggle('blockNewPosts')}
              disabled={updating}
              className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                config.blockNewPosts ? 'bg-rose-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-900">১. নতুন পোস্ট বন্ধ (Block Posts)</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              আড্ডা সামাজিক ফিডে যেকোনো নতুন কন্টেন্ট বা পোস্ট প্রকাশ সম্পূর্ণ স্থগিত থাকবে।
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold">
            <span className={config.blockNewPosts ? 'text-rose-700' : 'text-slate-400'}>
              {config.blockNewPosts ? '⛔ পোস্ট প্রকাশ ব্লকড' : '🟢 পোস্ট প্রকাশ সচল'}
            </span>
          </div>
        </div>

        {/* Switch 2: Block New Comments */}
        <div className={`p-5 rounded-3xl border transition-all space-y-3 ${
          config.blockNewComments
            ? 'bg-rose-50/80 border-rose-300 shadow-xs'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-2xl ${config.blockNewComments ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <MessageSquare size={20} />
            </div>

            <button
              onClick={() => handleSwitchToggle('blockNewComments')}
              disabled={updating}
              className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                config.blockNewComments ? 'bg-rose-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-900">২. নতুন কমেন্ট বন্ধ (Block Comments)</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              বিদ্যমান কোনো পোস্টে নতুন মন্তব্য বা আলোচনা যোগ করার সুবিধা স্থগিত থাকবে।
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold">
            <span className={config.blockNewComments ? 'text-rose-700' : 'text-slate-400'}>
              {config.blockNewComments ? '⛔ কমেন্ট থ্রেড লকড' : '🟢 কমেন্ট খোলা'}
            </span>
          </div>
        </div>

        {/* Switch 3: Block New Registrations */}
        <div className={`p-5 rounded-3xl border transition-all space-y-3 ${
          config.blockNewRegistrations
            ? 'bg-rose-50/80 border-rose-300 shadow-xs'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-2xl ${config.blockNewRegistrations ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <UserPlus size={20} />
            </div>

            <button
              onClick={() => handleSwitchToggle('blockNewRegistrations')}
              disabled={updating}
              className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                config.blockNewRegistrations ? 'bg-rose-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-900">৩. নতুন সাইন-আপ বন্ধ (Block Signups)</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              সাময়িক সময়ের জন্য নতুন ইউজারদের একাউন্ট খোলা বা রেজিস্ট্রেশন স্থগিত থাকবে।
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold">
            <span className={config.blockNewRegistrations ? 'text-rose-700' : 'text-slate-400'}>
              {config.blockNewRegistrations ? '⛔ রেজিস্ট্রেশন বন্ধ' : '🟢 রেজিস্ট্রেশন খোলা'}
            </span>
          </div>
        </div>

        {/* Switch 4: Limit Messaging */}
        <div className={`p-5 rounded-3xl border transition-all space-y-3 ${
          config.limitMessaging
            ? 'bg-rose-50/80 border-rose-300 shadow-xs'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-2xl ${config.limitMessaging ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <MessageCircle size={20} />
            </div>

            <button
              onClick={() => handleSwitchToggle('limitMessaging')}
              disabled={updating}
              className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                config.limitMessaging ? 'bg-rose-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-900">৪. মেসেজিং সীমিত (Limit Messaging)</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              মেসেঞ্জারে স্প্যামিং রোধে মেসেজিং শুধুমাত্র ভেরিফাইড ইউজারদের মধ্যে সীমিত থাকবে।
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold">
            <span className={config.limitMessaging ? 'text-rose-700' : 'text-slate-400'}>
              {config.limitMessaging ? '⛔ মেসেজিং সীমিত' : '🟢 মেসেজিং স্বাভাবিক'}
            </span>
          </div>
        </div>

      </div>

      {/* 3. BROADCAST BANNER & REASON FORM */}
      <div className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Megaphone className="text-[#0B7A3B]" size={20} />
          <div>
            <h3 className="text-sm font-black text-slate-900">ইমার্জেন্সি নোটিশ ও ব্রডকাস্ট বার্তা</h3>
            <p className="text-xs text-slate-500 font-medium">লকডাউন চলাকালীন নাগরিক ফিডের শীর্ষে প্রদর্শনযোগ্য জরুরি বার্তা</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">ইমার্জেন্সি মোডের অফিশিয়াল কারণ:</label>
            <input
              type="text"
              value={config.emergencyReason}
              onChange={(e) => setConfig({ ...config, emergencyReason: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B7A3B]"
              placeholder="যেমন: জরুরি সাইবার নিরাপত্তা ও কন্টেন্ট মডারেশনের জন্য..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">ফিডের শীর্ষে প্রদর্শিত নাগরিক ব্রডকাস্ট নোটিশ:</label>
            <textarea
              rows={2}
              value={config.broadcastBannerMessage}
              onChange={(e) => setConfig({ ...config, broadcastBannerMessage: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B7A3B]"
              placeholder="ফিডের শীর্ষে প্রদর্শিত লাল ব্যানার নোটিশ..."
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => handleSaveSettings(config, false)}
              disabled={updating}
              className="px-5 py-2.5 bg-[#0B7A3B] hover:bg-emerald-800 text-white text-xs font-black rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              {updating ? 'সংরক্ষণ হচ্ছে...' : 'নোটিশ ও কনফিগারেশন সেভ করুন'}
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- CONFIRMATION MODAL ---------------- */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4 font-sans"
            >
              <div className="flex items-center gap-3 text-rose-700">
                <div className="p-3 bg-rose-100 rounded-2xl">
                  <AlertOctagon size={28} />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {confirmAction === 'enable' ? '🔴 LOCK DOWN ADDA নিশ্চিতকরণ' : '🟢 লকডাউন প্রত্যাহার নিশ্চিতকরণ'}
                  </h3>
                  <p className="text-xs text-slate-500">সুপার এডমিন সিকিউরিটি কমান্ড</p>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {confirmAction === 'enable' ? (
                  <>
                    আপনি কি নিশ্চিত যে আপনি এক ক্লিকে <strong>আড্ডা সোশ্যাল ইমার্জেন্সি লকডাউন</strong> চালু করতে চান?
                    এর ফলে নতুন পোস্ট, কমেন্ট, মেসেজিং ও রেজিস্টার বন্ধ হয়ে যাবে।
                  </>
                ) : (
                  <>
                    আপনি কি নিশ্চিত যে ইমার্জেন্সি লকডাউন প্রত্যাহার করে প্ল্যাটফর্মের স্বাভাবিক কার্যক্রম পুনর্বহাল করতে চান?
                  </>
                )}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleMasterToggle}
                  disabled={updating}
                  className={`px-5 py-2.5 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition disabled:opacity-50 ${
                    confirmAction === 'enable' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  {updating ? 'কার্যকর হচ্ছে...' : confirmAction === 'enable' ? 'হ্যাঁ, লকডাউন চালু করুন' : 'হ্যাঁ, লকডাউন প্রত্যাহার করুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default EmergencyModerationControl;
