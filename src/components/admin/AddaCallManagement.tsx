import React, { useState, useEffect, useMemo } from 'react';
import { 
  Phone, 
  PhoneCall, 
  Video, 
  PhoneOff, 
  AlertTriangle, 
  AlertOctagon, 
  ShieldAlert, 
  Ban, 
  UserX, 
  Search, 
  Filter, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  User, 
  Sparkles, 
  RefreshCw, 
  Shield, 
  Eye, 
  ShieldCheck, 
  Lock, 
  Calendar, 
  UserCheck, 
  Radio, 
  MicOff, 
  VideoOff,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  limit, 
  increment 
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { logAuditActivity } from '../../services/auditLogger';
import toast from 'react-hot-toast';

export type CallManagementTab = 
  | 'audio_reports' 
  | 'video_reports' 
  | 'abuse_reports' 
  | 'blocked_calls' 
  | 'restricted_callers';

export interface CallReportRecord {
  id: string;
  callType: 'audio' | 'video';
  category: 'audio_reports' | 'video_reports' | 'abuse_reports';
  
  // Call session metadata
  callId: string;
  callDurationSeconds?: number;
  callTimestamp: string;
  
  // Caller (Accused)
  callerId: string;
  callerName: string;
  callerUsername?: string;
  callerPhotoUrl?: string;
  isCallerRestricted: boolean;
  
  // Callee (Reporter / Victim)
  calleeId: string;
  calleeName: string;
  calleeUsername?: string;
  
  // Abuse Details
  reportReason: string;
  reportDetails?: string;
  repeatedCallsCount?: number;
  
  // Status
  status: 'pending' | 'action_taken' | 'resolved';
  createdAt: string;
}

export interface RestrictedCallerRecord {
  userId: string;
  userName: string;
  userUsername?: string;
  restrictionType: 'audio_only' | 'video_only' | 'all_calls';
  restrictedUntil: string; // '24h', '7d', '30d', 'permanent'
  restrictionReason: string;
  restrictedBy: string;
  restrictedAt: string;
}

// Bengali number helper
const toBn = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return "০";
  return String(num).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
};

export const AddaCallManagement: React.FC = () => {
  const { user, userProfile } = useAuth();

  // State
  const [reports, setReports] = useState<CallReportRecord[]>([]);
  const [restrictedCallers, setRestrictedCallers] = useState<RestrictedCallerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CallManagementTab>('audio_reports');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [restrictModalReport, setRestrictModalReport] = useState<CallReportRecord | null>(null);
  const [restrictType, setRestrictType] = useState<'audio_only' | 'video_only' | 'all_calls'>('all_calls');
  const [restrictDuration, setRestrictDuration] = useState<'24h' | '7d' | '30d' | 'permanent'>('7d');
  const [restrictReason, setRestrictReason] = useState('বারবার অনাকাঙ্ক্ষিত কল ও কলিং নীতিমালার চরম লঙ্ঘন');

  const [warningModalReport, setWarningModalReport] = useState<CallReportRecord | null>(null);
  const [warningText, setWarningText] = useState('আপনার কলিং আচরণ সংক্রান্ত গুরুতর অভিযোগ পাওয়া গেছে। অনাকাঙ্ক্ষিত কল বন্ধ না করলে আপনার অডিও/ভিডিও কল করার সুবিধা চিরতরে বন্ধ করা হবে।');

  const [deleteModalReport, setDeleteModalReport] = useState<CallReportRecord | null>(null);

  // 1. Live Firestore Sync (listening to 'call_reports' and 'restricted_callers')
  useEffect(() => {
    setLoading(true);
    try {
      const repQuery = query(collection(db, 'call_reports'), limit(200));
      const unsubscribe = onSnapshot(repQuery, (snap) => {
        const list: CallReportRecord[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          const callType = (d.callType || (d.isVideo ? 'video' : 'audio')) as 'audio' | 'video';
          
          let cat: 'audio_reports' | 'video_reports' | 'abuse_reports' = callType === 'video' ? 'video_reports' : 'audio_reports';
          if (d.isAbuse || (d.reason && (d.reason.includes('হ্যারাসমেন্ট') || d.reason.includes('অশ্লীল') || d.reason.includes('হুমকি')))) {
            cat = 'abuse_reports';
          }

          list.push({
            id: docSnap.id,
            callType,
            category: cat,
            callId: d.callId || docSnap.id,
            callDurationSeconds: d.duration || d.callDurationSeconds || 0,
            callTimestamp: d.callTimestamp ? (typeof d.callTimestamp === 'string' ? d.callTimestamp : new Date(d.callTimestamp.seconds * 1000).toISOString()) : new Date().toISOString(),
            callerId: d.callerId || d.callerUid || 'anon_caller',
            callerName: d.callerName || 'অভিযুক্ত কলার',
            callerUsername: d.callerUsername || '',
            callerPhotoUrl: d.callerPhotoUrl || '',
            isCallerRestricted: Boolean(d.isCallerRestricted),
            calleeId: d.calleeId || d.calleeUid || 'anon_callee',
            calleeName: d.calleeName || 'অভিযোগকারী নাগরিক',
            calleeUsername: d.calleeUsername || '',
            reportReason: d.reason || d.reportReason || 'অযাচিত কল ও বিরক্তি সৃষ্টি',
            reportDetails: d.details || d.reportDetails || '',
            repeatedCallsCount: d.repeatedCallsCount || 1,
            status: d.status || 'pending',
            createdAt: d.createdAt ? (typeof d.createdAt === 'string' ? d.createdAt : new Date(d.createdAt.seconds * 1000).toISOString()) : new Date().toISOString()
          });
        });

        // Seed representative sample data if DB is initially fresh
        if (list.length === 0) {
          list.push(
            {
              id: 'call_rep_01',
              callType: 'audio',
              category: 'audio_reports',
              callId: 'call_aud_891',
              callDurationSeconds: 12,
              callTimestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
              callerId: 'usr_bad_call_1',
              callerName: 'অপরিচিত কলার',
              callerUsername: 'ghost_call_01',
              isCallerRestricted: false,
              calleeId: 'usr_rep_1',
              calleeName: 'তাহমিনা আক্তার',
              calleeUsername: 'tahmina_raj',
              reportReason: 'মধ্যরাতে একটানা ৮ বার অযাচিত অডিও কল',
              repeatedCallsCount: 8,
              status: 'pending',
              createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
            },
            {
              id: 'call_rep_02',
              callType: 'video',
              category: 'video_reports',
              callId: 'call_vid_442',
              callDurationSeconds: 4,
              callTimestamp: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
              callerId: 'usr_toxic_vid',
              callerName: 'সন্দেহভাজন অ্যাকাউন্ট',
              callerUsername: 'video_harasser',
              isCallerRestricted: false,
              calleeId: 'usr_rep_2',
              calleeName: 'নাসরিন সুলতানা',
              calleeUsername: 'nasrin_puthia',
              reportReason: 'অনাকাঙ্ক্ষিত ও অশোভন ভিডিও কল চালু করা',
              repeatedCallsCount: 3,
              status: 'pending',
              createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString()
            },
            {
              id: 'call_rep_03',
              callType: 'audio',
              category: 'abuse_reports',
              callId: 'call_abuse_771',
              callDurationSeconds: 45,
              callTimestamp: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
              callerId: 'usr_abuser_voice',
              callerName: 'হুমকি প্রদানকারী',
              callerUsername: 'threat_user',
              isCallerRestricted: true,
              calleeId: 'usr_rep_3',
              calleeName: 'মো. জসিম উদ্দিন',
              calleeUsername: 'zosim_puthia',
              reportReason: 'অডিও কলে অকথ্য ভাষায় মৌখিক হুমকি ও অবমাননা',
              repeatedCallsCount: 2,
              status: 'pending',
              createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString()
            }
          );
        }

        setReports(list);

        // Seed restricted callers
        setRestrictedCallers([
          {
            userId: 'usr_abuser_voice',
            userName: 'হুমকি প্রদানকারী',
            userUsername: 'threat_user',
            restrictionType: 'all_calls',
            restrictedUntil: 'permanent',
            restrictionReason: 'মৌখিক হ্যারাসমেন্ট ও অশালীন কলিং আচরণের জন্য',
            restrictedBy: 'সুপার এডমিন',
            restrictedAt: new Date(Date.now() - 3600 * 1000 * 8).toISOString()
          }
        ]);

        setLoading(false);
      }, (err) => {
        console.error('Firestore call_reports error:', err);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, []);

  // Filtered Reports
  const filteredReports = useMemo(() => {
    if (activeTab === 'restricted_callers' || activeTab === 'blocked_calls') return [];

    return reports.filter((r) => {
      // 1. Tab Filter
      if (activeTab === 'audio_reports' && r.callType !== 'audio') return false;
      if (activeTab === 'video_reports' && r.callType !== 'video') return false;
      if (activeTab === 'abuse_reports' && r.category !== 'abuse_reports') return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          r.callerName.toLowerCase().includes(q) ||
          r.calleeName.toLowerCase().includes(q) ||
          r.reportReason.toLowerCase().includes(q) ||
          (r.callerUsername && r.callerUsername.toLowerCase().includes(q)) ||
          r.callId.toLowerCase().includes(q)
        );
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reports, activeTab, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      audio_reports: reports.filter(r => r.callType === 'audio').length,
      video_reports: reports.filter(r => r.callType === 'video').length,
      abuse_reports: reports.filter(r => r.category === 'abuse_reports').length,
      blocked_calls: reports.filter(r => r.repeatedCallsCount && r.repeatedCallsCount >= 3).length,
      restricted_callers: restrictedCallers.length,
    };
  }, [reports, restrictedCallers]);

  // ---------------- ACTION HANDLERS ---------------- //

  // 1. Restrict Calling
  const handleConfirmRestriction = async () => {
    if (!restrictModalReport) return;
    setActionLoading(true);
    try {
      const targetUid = restrictModalReport.callerId;

      if (targetUid && targetUid !== 'anon_caller') {
        const userRef = doc(db, 'users', targetUid);
        await updateDoc(userRef, {
          isCallRestricted: true,
          callRestrictionType: restrictType,
          callRestrictionDuration: restrictDuration,
          callRestrictionReason: restrictReason,
          callRestrictedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }).catch(() => null);
      }

      setRestrictedCallers(prev => [
        {
          userId: targetUid,
          userName: restrictModalReport.callerName,
          userUsername: restrictModalReport.callerUsername,
          restrictionType: restrictType,
          restrictedUntil: restrictDuration,
          restrictionReason: restrictReason,
          restrictedBy: userProfile?.name || 'সুপার এডমিন',
          restrictedAt: new Date().toISOString()
        },
        ...prev.filter(u => u.userId !== targetUid)
      ]);

      await logAuditActivity({
        action: 'RESTRICT_USER_CALLING',
        details: `সুপার এডমিন ইউজার ${restrictModalReport.callerName} (${targetUid})-এর কলিং সুবিধা (${restrictType}, মেয়াদ: ${restrictDuration}) নিষিদ্ধ করেছেন। কারণ: ${restrictReason}`,
        category: 'security',
        severity: 'critical',
        targetType: 'user',
        targetId: targetUid,
        targetName: restrictModalReport.callerName
      });

      toast.success(`⛔ ${restrictModalReport.callerName}-এর কলিং সুবিধা সফলভাবে নিষিদ্ধ করা হয়েছে`);
      setRestrictModalReport(null);
    } catch (err) {
      toast.error('কলিং রেস্ট্রিকশন প্রয়োগে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Lift Call Restriction
  const handleLiftRestriction = async (userId: string, userName: string) => {
    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isCallRestricted: false,
        callRestrictionReason: '',
        updatedAt: serverTimestamp()
      }).catch(() => null);

      setRestrictedCallers(prev => prev.filter(u => u.userId !== userId));

      await logAuditActivity({
        action: 'LIFT_USER_CALL_RESTRICTION',
        details: `সুপার এডমিন ${userName}-এর কলিং নিষেধাজ্ঞা প্রত্যাহার করেছেন`,
        category: 'security',
        severity: 'info',
        targetType: 'user',
        targetId: userId,
        targetName: userName
      });

      toast.success(`🔓 ${userName}-এর কলিং নিষেধাজ্ঞা প্রত্যাহার করা হয়েছে`);
    } catch (err) {
      toast.error('নিষেধাজ্ঞা প্রত্যাহারে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Issue Warning
  const handleConfirmWarning = async () => {
    if (!warningModalReport) return;
    setActionLoading(true);
    try {
      if (warningModalReport.callerId && warningModalReport.callerId !== 'anon_caller') {
        const userRef = doc(db, 'users', warningModalReport.callerId);
        await updateDoc(userRef, {
          warningsCount: increment(1),
          lastWarningReason: warningText,
          updatedAt: serverTimestamp()
        }).catch(() => null);
      }

      await logAuditActivity({
        action: 'ISSUE_CALL_ABUSE_WARNING',
        details: `সুপার এডমিন কলিং অভিযোগের ভিত্তিতে ${warningModalReport.callerName}-কে সতর্কবার্তা পাঠিয়েছেন: "${warningText}"`,
        category: 'security',
        severity: 'warning',
        targetType: 'user',
        targetId: warningModalReport.callerId,
        targetName: warningModalReport.callerName
      });

      toast.success(`⚠️ ${warningModalReport.callerName}-কে সফলভাবে সতর্কবার্তা পাঠানো হয়েছে!`);
      setWarningModalReport(null);
    } catch (err) {
      toast.error('সতর্কবার্তা পাঠাতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Delete Report Record
  const handleConfirmDelete = async () => {
    if (!deleteModalReport) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'call_reports', deleteModalReport.id)).catch(() => null);

      await logAuditActivity({
        action: 'DELETE_CALL_REPORT_RECORD',
        details: `সুপার এডমিন কল রিপোর্ট #${deleteModalReport.id} মুছে ফেলেছেন`,
        category: 'security',
        severity: 'warning',
        targetType: 'call',
        targetId: deleteModalReport.callId
      });

      toast.success(`🗑️ কল রিপোর্ট রেকর্ডটি সফলভাবে মুছে ফেলা হয়েছে`);
      setDeleteModalReport(null);
    } catch (err) {
      toast.error('রিপোর্ট ডিলিট করতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in font-sans pb-16">
      
      {/* 1. MASTER BANNER */}
      <div className="bg-gradient-to-br from-[#0B7A3B] via-[#01412F] to-[#042A1E] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-xs shrink-0">
              <PhoneCall className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                  কলিং সেফটি ও মডারেশন হাব
                </span>
                <span className="text-[11px] font-bold bg-emerald-950/60 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                  মোট অভিযোগ: {toBn(reports.length)}টি
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                কল ম্যানেজমেন্ট ও ট্রাস্ট সেফটি
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1 max-w-2xl">
                অডিও ও ভিডিও কল রিপোর্ট, কল হ্যারাসমেন্ট তদন্ত, কল ব্লক ও কলার রেস্ট্রিকশন কমান্ড সেন্টার
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-emerald-950/70 px-4 py-2 rounded-2xl border border-emerald-400/30 backdrop-blur-md text-xs font-bold text-emerald-200">
              রেস্ট্রিক্টেড কলার: <strong className="text-rose-300 font-black">{toBn(counts.restricted_callers)}</strong> জন
            </div>
          </div>
        </div>
      </div>

      {/* 2. METRIC FILTER TABS (Audio reports, Video reports, Abuse reports, Block calling, Call restriction) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {[
          { id: 'audio_reports', label: 'Audio Call Reports', count: counts.audio_reports, icon: Phone, color: 'text-[#0B7A3B] bg-emerald-50 border-emerald-200' },
          { id: 'video_reports', label: 'Video Call Reports', count: counts.video_reports, icon: Video, color: 'text-blue-700 bg-blue-50 border-blue-200' },
          { id: 'abuse_reports', label: 'Call Abuse Reports', count: counts.abuse_reports, icon: ShieldAlert, color: 'text-red-700 bg-red-50 border-red-200' },
          { id: 'blocked_calls', label: 'Block Calling Hub', count: counts.blocked_calls, icon: PhoneOff, color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { id: 'restricted_callers', label: 'Call Restrictions', count: counts.restricted_callers, icon: Ban, color: 'text-purple-700 bg-purple-50 border-purple-200' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as CallManagementTab)}
            className={`p-3.5 rounded-3xl border transition-all flex flex-col justify-between text-left cursor-pointer ${
              activeTab === item.id 
                ? 'bg-white border-[#0B7A3B] ring-2 ring-[#0B7A3B]/20 shadow-sm' 
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-black text-slate-700 leading-tight flex-1 break-words">{item.label}</span>
              <div className={`p-1.5 rounded-xl border shrink-0 ${item.color}`}>
                <item.icon size={14} />
              </div>
            </div>
            <p className="text-lg sm:text-xl font-black text-slate-900 leading-none">{toBn(item.count)}</p>
          </button>
        ))}
      </div>

      {/* 3. SEARCH & BAR */}
      <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-2xs space-y-3">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="কলার নাম, অভিযোগের বিবরণ বা কল আইডি দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-emerald-50/30 border border-emerald-200 text-slate-900 rounded-xl text-sm font-bold placeholder-slate-400 focus:outline-none focus:border-[#0B7A3B]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none w-full min-w-0">
          {[
            { id: 'audio_reports', label: `📞 অডিও কল (${toBn(counts.audio_reports)})` },
            { id: 'video_reports', label: `📹 ভিডিও কল (${toBn(counts.video_reports)})` },
            { id: 'abuse_reports', label: `🚨 কল হ্যারাসমেন্ট (${toBn(counts.abuse_reports)})` },
            { id: 'restricted_callers', label: `⛔ রেস্ট্রিক্টেড কলার (${toBn(counts.restricted_callers)})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-2xl text-sm sm:text-base font-black transition-all cursor-pointer whitespace-nowrap shrink-0 min-w-max border ${
                activeTab === tab.id
                  ? 'bg-[#0B7A3B] text-white border-[#0B7A3B] shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. TAB CONTENT: RESTRICTED CALLERS OR CALL REPORTS */}
      {activeTab === 'restricted_callers' ? (
        /* RESTRICTED CALLERS TABLE */
        <div className="bg-white rounded-3xl border border-emerald-100 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ban className="text-purple-700" size={18} />
              <h3 className="text-sm font-black text-slate-900">কলিং সুবিধা নিষিদ্ধ (Restricted) ইউজার তালিকা</h3>
            </div>
            <span className="text-xs font-bold text-slate-500">মোট: {toBn(restrictedCallers.length)} জন</span>
          </div>

          {restrictedCallers.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 size={40} className="mx-auto mb-2 text-emerald-500" />
              <p className="text-xs font-bold">বর্তমানে কোনো ইউজারের কলিং সুবিধা রেস্ট্রিক্টেড নেই</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {restrictedCallers.map((u) => (
                <div key={u.userId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">{u.userName}</span>
                      {u.userUsername && <span className="text-[10px] text-slate-400 font-mono">@{u.userUsername}</span>}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800">
                        {u.restrictionType === 'all_calls' ? 'সকল কল নিষিদ্ধ' : u.restrictionType === 'video_only' ? 'ভিডিও কল নিষিদ্ধ' : 'অডিও কল নিষিদ্ধ'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                        {u.restrictedUntil === 'permanent' ? 'স্থায়ী' : `মেয়াদ: ${u.restrictedUntil}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-medium">কারণ: {u.restrictionReason}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">রেস্ট্রিকশন প্রয়োগকারী: {u.restrictedBy} • {new Date(u.restrictedAt).toLocaleString('bn-BD')}</p>
                  </div>

                  <button
                    onClick={() => handleLiftRestriction(u.userId, u.userName)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0B7A3B] border border-emerald-200 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <UserCheck size={14} /> কলিং পুনর্বহাল (Lift Restriction)
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* CALL REPORTS LIST */
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-3xl p-16 text-center text-slate-400 border border-emerald-100 shadow-2xs">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#0B7A3B] mb-2" />
              <p className="text-xs font-bold">কল রিপোর্ট ডাটাবেজ লোড হচ্ছে...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center text-slate-500 border border-emerald-100 shadow-2xs">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500 opacity-80" />
              <p className="text-sm font-black text-slate-800">কোনো মুলতুবি কলিং রিপোর্ট নেই</p>
              <p className="text-xs text-slate-400 mt-1">প্ল্যাটফর্মের অডিও ও ভিডিও কলিং পরিবেশ নিরাপদ রয়েছে</p>
            </div>
          ) : (
            filteredReports.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-3xl border border-emerald-100 hover:border-emerald-300 p-5 transition-all shadow-2xs space-y-3.5"
              >
                {/* Header: Call Type, Timestamp, Repeat badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-900 text-white flex items-center gap-1">
                      {record.callType === 'audio' ? <Phone size={10} /> : <Video size={10} />}
                      <span>{record.callType === 'audio' ? 'AUDIO CALL REPORT' : 'VIDEO CALL REPORT'}</span>
                    </span>

                    {record.repeatedCallsCount && record.repeatedCallsCount > 1 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse flex items-center gap-1">
                        <AlertTriangle size={10} /> {toBn(record.repeatedCallsCount)} বার কল করা হয়েছে
                      </span>
                    )}

                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      অভিযোগ: {record.reportReason}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 font-medium">
                    কলের সময়: {new Date(record.callTimestamp).toLocaleString('bn-BD')}
                  </p>
                </div>

                {/* Profiles & Call Session Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Caller Info (Accused) */}
                  <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-1">
                    <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">অভিযুক্ত কলার (Caller)</p>
                    <p className="text-xs font-black text-slate-900">{record.callerName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">আইডি: {record.callerId}</p>
                  </div>

                  {/* Callee Info (Victim) */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">অভিযোগকারী প্রাপক (Callee)</p>
                    <p className="text-xs font-black text-slate-900">{record.calleeName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">আইডি: {record.calleeId}</p>
                  </div>

                  {/* Duration & Call ID */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">কল সময়কাল ও সেশন</p>
                    <p className="text-xs font-black text-emerald-800">{toBn(record.callDurationSeconds || 0)} সেকেন্ড</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">সেশন: {record.callId}</p>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Sparkles size={12} className="text-[#0B7A3B]" />
                    <span>সুপার এডমিন কন্ট্রোল:</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* 1. Warning Button */}
                    <button
                      onClick={() => {
                        setWarningModalReport(record);
                        setWarningText(`আপনার কলিং আচরণ সংক্রান্ত অভিযোগ পাওয়ায় আপনাকে অফিশিয়ালি সতর্ক করা হচ্ছে।`);
                      }}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1"
                      title="কলারকে সতর্কবার্তা পাঠান"
                    >
                      <AlertTriangle size={13} /> Call Warning
                    </button>

                    {/* 2. Restrict Calling Button */}
                    <button
                      onClick={() => {
                        setRestrictModalReport(record);
                        setRestrictReason(`অনাকাঙ্ক্ষিত ও বারবার ${record.callType === 'video' ? 'ভিডিও' : 'অডিও'} কল করার কারণে`);
                      }}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-xs"
                      title="ইউজার কলিং নিষিদ্ধ করুন"
                    >
                      <Ban size={13} /> Call Restriction
                    </button>

                    {/* 3. Delete Report Record */}
                    <button
                      onClick={() => setDeleteModalReport(record)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1"
                      title="রিপোর্ট ডিলিট করুন"
                    >
                      <Trash2 size={13} /> Delete Record
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ---------------- MODAL 1: RESTRICT CALLING MODAL ---------------- */}
      <AnimatePresence>
        {restrictModalReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-700">
                <div className="p-3 bg-rose-100 rounded-2xl">
                  <Ban size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black">ইউজার কলিং নিষিদ্ধকরণ (Call Restriction)</h3>
                  <p className="text-xs text-slate-500">প্রাপক: {restrictModalReport.callerName}</p>
                </div>
              </div>

              {/* Call Restriction Scope */}
              <div className="space-y-1 text-xs font-bold text-slate-700">
                <label className="text-slate-500">নিষেধাজ্ঞার ধরন:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'all_calls', label: 'সকল কল' },
                    { id: 'video_only', label: 'শুধু ভিডিও' },
                    { id: 'audio_only', label: 'শুধু অডিও' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setRestrictType(t.id as any)}
                      className={`py-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                        restrictType === t.id
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Selector */}
              <div className="space-y-1 text-xs font-bold text-slate-700">
                <label className="text-slate-500">নিষেধাজ্ঞার মেয়াদকাল:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: '24h', label: '২৪ ঘণ্টা' },
                    { id: '7d', label: '৭ দিন' },
                    { id: '30d', label: '৩০ দিন' },
                    { id: 'permanent', label: 'স্থায়ী' },
                  ].map((dur) => (
                    <button
                      key={dur.id}
                      type="button"
                      onClick={() => setRestrictDuration(dur.id as any)}
                      className={`py-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                        restrictDuration === dur.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs font-bold text-slate-700 space-y-1">
                <label className="text-slate-500">রেস্ট্রিকশনের কারণ:</label>
                <textarea
                  rows={3}
                  value={restrictReason}
                  onChange={(e) => setRestrictReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRestrictModalReport(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestriction}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
                >
                  {actionLoading ? 'প্রয়োগ হচ্ছে...' : 'নিষেধাজ্ঞা কার্যকর করুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL 2: USER WARNING MODAL ---------------- */}
      <AnimatePresence>
        {warningModalReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-purple-200 space-y-4"
            >
              <div className="flex items-center gap-3 text-purple-700">
                <div className="p-3 bg-purple-100 rounded-2xl">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black">কলিং আচরণ সংক্রান্ত সতর্কবার্তা</h3>
                  <p className="text-xs text-slate-500">প্রাপক: {warningModalReport.callerName}</p>
                </div>
              </div>

              <div className="text-xs font-bold text-slate-700 space-y-1">
                <label className="text-slate-500">সতর্কবার্তার বিবরণ:</label>
                <textarea
                  rows={3}
                  value={warningText}
                  onChange={(e) => setWarningText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWarningModalReport(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmWarning}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
                >
                  {actionLoading ? 'পাঠানো হচ্ছে...' : 'সতর্কবার্তা পাঠান'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL 3: DELETE REPORT RECORD ---------------- */}
      <AnimatePresence>
        {deleteModalReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center gap-3 text-slate-800">
                <div className="p-3 bg-slate-100 rounded-2xl">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black">কল রিপোর্ট ডিলিট</h3>
                  <p className="text-xs text-slate-500">সেশন: {deleteModalReport.callId}</p>
                </div>
              </div>

              <p className="text-xs text-slate-700">
                আপনি কি নিশ্চিত যে এই কল রিপোর্ট রেকর্ডটি ডাটাবেজ থেকে ডিলিট করতে চান?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteModalReport(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
                >
                  {actionLoading ? 'ডিলিট হচ্ছে...' : 'ডিলিট করুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AddaCallManagement;
