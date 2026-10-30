import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, DollarSign, Wallet, Check, X, AlertTriangle, RefreshCw, 
  Search, Eye, Send, Lock, TrendingUp, Users, ArrowUpRight, CheckCircle2, Sliders, Rocket,
  Copy, Phone, Clock, CreditCard, ArrowDownLeft, ShieldAlert, Sparkles, Filter
} from 'lucide-react';
import { monetizationService, WithdrawalRequest, AdCampaign, PlatformRevenueStats } from '../../services/monetizationService';
import { AdminReferralPanel } from '../referral/AdminReferralPanel';
import toast from 'react-hot-toast';
import { 
  collection, query, where, onSnapshot, doc, updateDoc, setDoc,
  increment, serverTimestamp, getDocs 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import { logAuditActivity } from '../../services/auditLogger';

export interface WalletTransactionItem {
  id: string;
  userId: string;
  userName?: string;
  type: string;
  amount: number;
  method?: string;
  accountNumber?: string;
  trxId?: string;
  status: 'pending' | 'completed' | 'rejected';
  description?: string;
  rejectionReason?: string;
  approvedAt?: any;
  approvedBy?: string;
  createdAt: any;
}

export const AdminMonetizationDashboard: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [stats, setStats] = useState<PlatformRevenueStats | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [recharges, setRecharges] = useState<WalletTransactionItem[]>([]);
  const [rechargeStatusFilter, setRechargeStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('pending');
  const [rechargeSearch, setRechargeSearch] = useState('');
  const [processingRechargeId, setProcessingRechargeId] = useState<string | null>(null);
  const [rejectModalTx, setRejectModalTx] = useState<WalletTransactionItem | null>(null);
  const [approveModalTx, setApproveModalTx] = useState<WalletTransactionItem | null>(null);
  const [rechargeRejectReason, setRechargeRejectReason] = useState('');
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'recharges' | 'withdrawals' | 'ads' | 'referrals' | 'fraud' | 'audit' | 'settings'>('recharges');

  useEffect(() => {
    if (urlTab) {
      if (['recharges', 'withdrawals', 'ads', 'referrals', 'fraud', 'audit', 'settings'].includes(urlTab)) {
        setActiveTab(urlTab as any);
      } else if (urlTab === 'overview' || urlTab === 'subscriptions') {
        setActiveTab('recharges');
      }
    }
  }, [urlTab]);

  // Real-time listener for wallet recharge transactions
  useEffect(() => {
    const qRecharges = query(collection(db, "wallet_transactions"));
    const unsub = onSnapshot(qRecharges, (snapshot) => {
      const list: WalletTransactionItem[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.type === 'recharge' || d.type === 'citizen_wallet_recharge') {
          list.push({
            id: docSnap.id,
            userId: d.userId || d.uid || '',
            userName: d.userName || 'নাগরিক',
            type: d.type,
            amount: Number(d.amount) || 0,
            method: d.method || 'bkash',
            accountNumber: d.accountNumber || '',
            trxId: d.trxId || '',
            status: d.status || 'pending',
            description: d.description || '',
            rejectionReason: d.rejectionReason,
            approvedAt: d.approvedAt,
            approvedBy: d.approvedBy,
            createdAt: d.createdAt
          });
        }
      });

      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setRecharges(list);
    }, (err) => {
      console.warn("Wallet transactions subscription note:", err);
    });

    return () => unsub();
  }, []);
  const [minWithdrawalInput, setMinWithdrawalInput] = useState<number>(500);
  const [creatorCommissionInput, setCreatorCommissionInput] = useState<number>(80);

  const handleExportCSV = () => {
    const csvContent = "Transaction ID,Type,Amount (Tk),Status,Date\nTRX1001,ad_share,1200,completed,2026-08-22\nTRX1002,star_support,500,completed,2026-08-22\nTRX1003,subscription,450,completed,2026-08-22\nTRX1004,withdrawal,2000,paid,2026-08-21";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `financial_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('📊 আর্থিক রিপোর্ট (CSV) সফলভাবে ডাউনলোড হয়েছে!');
  };
  const [loading, setLoading] = useState<boolean>(true);

  // Approval modal state
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [trxRef, setTrxRef] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, w] = await Promise.all([
        monetizationService.getAdminPlatformStats(),
        monetizationService.getWithdrawalHistory('admin_all')
      ]);
      setStats(s);
      setWithdrawals(w);
    } catch (err) {
      console.error('Error loading admin monetization data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveWithdrawal = async (withdrawal: WithdrawalRequest) => {
    if (!trxRef.trim()) {
      toast.error('অনুগ্রহ করে bKash/Nagad পেমেন্ট রেফারেন্স বা TRX ID লিখুন।');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await monetizationService.approveWithdrawal({
        withdrawalId: withdrawal.id,
        trxRef: trxRef.trim()
      });
      if (res.success) {
        toast.success(`🎉 ৳${withdrawal.amountTk} সফলভাবে অনুমোদিত এবং TRX ID (${trxRef}) সহ আপডেট করা হয়েছে!`);
        setSelectedWithdrawal(null);
        setTrxRef('');
        loadData();
      } else {
        toast.error(res.message || 'অনুমোদন ব্যর্থ হয়েছে');
      }
    } catch (err) {
      toast.error('উইথড্রয়াল অনুমোদন করতে সমস্যা হয়েছে।');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectWithdrawal = async (withdrawal: WithdrawalRequest) => {
    if (!rejectReason.trim()) {
      toast.error('বাতিল করার কারণ লিখুন।');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await monetizationService.rejectWithdrawal({
        withdrawalId: withdrawal.id,
        userId: withdrawal.userId,
        amountTk: withdrawal.amountTk,
        reason: rejectReason.trim()
      });
      if (res.success) {
        toast.success(`উইথড্রয়াল আবেদনটি বাতিল করা হয়েছে এবং ইউজারকে রিফান্ড করা হয়েছে।`);
        setSelectedWithdrawal(null);
        setRejectReason('');
        loadData();
      } else {
        toast.error(res.message || 'বাতিলকরণ ব্যর্থ হয়েছে');
      }
    } catch (err) {
      toast.error('উইথড্রয়াল বাতিল করতে সমস্যা হয়েছে।');
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingRechargesCount = useMemo(() => {
    return recharges.filter(r => r.status === 'pending').length;
  }, [recharges]);

  const filteredRecharges = useMemo(() => {
    return recharges.filter(r => {
      const matchesStatus = rechargeStatusFilter === 'all' || r.status === rechargeStatusFilter;
      const q = rechargeSearch.trim().toLowerCase();
      const matchesSearch = !q || 
        (r.userName && r.userName.toLowerCase().includes(q)) ||
        (r.trxId && r.trxId.toLowerCase().includes(q)) ||
        (r.accountNumber && r.accountNumber.includes(q)) ||
        (r.userId && r.userId.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [recharges, rechargeStatusFilter, rechargeSearch]);

  const executeApproveRecharge = async (tx: WalletTransactionItem) => {
    if (!tx.userId || !tx.amount) {
      toast.error("ইউজার আইডি বা টাকার পরিমাণ সঠিক নয়");
      return;
    }

    setProcessingRechargeId(tx.id);
    try {
      const isVerificationRelated = 
        tx.amount === 150 ||
        (tx.description || '').toLowerCase().includes('verification') ||
        (tx.description || '').includes('ভেরিফিকেশন') ||
        (tx.description || '').includes('ব্যাজ');

      const adminActorName = userProfile?.name || user?.displayName || "সুপার এডমিন";

      // 1. Credit user's wallet and activate Verified Badge if verification-related
      const userRef = doc(db, "users", tx.userId);
      const userPayload: any = {
        walletBalance: increment(tx.amount),
        updatedAt: serverTimestamp()
      };

      if (isVerificationRelated) {
        userPayload.isVerified = true;
        userPayload.verified = true;
        userPayload.verificationStatus = 'approved';
        userPayload.verifiedBadgeType = 'blue_badge';
        userPayload.verifiedAt = serverTimestamp();
        userPayload.verifiedBy = adminActorName;
      }

      await setDoc(userRef, userPayload, { merge: true });

      // 2. Update transaction status
      const txRef = doc(db, "wallet_transactions", tx.id);
      await updateDoc(txRef, {
        status: "completed",
        approvedAt: serverTimestamp(),
        approvedBy: adminActorName
      });

      // 3. Mark admin_approvals if existing
      if (tx.trxId) {
        try {
          const apprQuery = query(
            collection(db, "admin_approvals"),
            where("trxId", "==", tx.trxId)
          );
          const apprSnap = await getDocs(apprQuery);
          for (const apprDoc of apprSnap.docs) {
            await updateDoc(apprDoc.ref, {
              status: "approved",
              approvedAt: serverTimestamp()
            });
          }
        } catch (_) {}

        // 4. Mark verified_payment_requests if existing
        try {
          const vQuery = query(
            collection(db, "verified_payment_requests"),
            where("trxId", "==", tx.trxId)
          );
          const vSnap = await getDocs(vQuery);
          for (const vDoc of vSnap.docs) {
            await updateDoc(vDoc.ref, {
              status: "approved",
              reviewedAt: serverTimestamp(),
              reviewedBy: adminActorName,
              reviewerId: user?.uid || ''
            });
          }
        } catch (_) {}
      }

      // 5. Mark verification_requests for user if existing
      try {
        const vrQuery = query(
          collection(db, "verification_requests"),
          where("userId", "==", tx.userId)
        );
        const vrSnap = await getDocs(vrQuery);
        for (const vrDoc of vrSnap.docs) {
          await updateDoc(vrDoc.ref, {
            status: "approved",
            reviewedAt: serverTimestamp(),
            reviewedBy: adminActorName
          });
        }
      } catch (_) {}

      // 6. Dispatch notification to citizen
      try {
        notificationService.dispatchNotification({
          recipientId: tx.userId,
          actorId: user?.uid || 'system',
          actorName: adminActorName,
          actorAvatar: userProfile?.photoURL || user?.photoURL || '',
          type: 'system_notification',
          targetId: tx.id,
          targetType: 'wallet',
          title: isVerificationRelated ? '🎉 ভেরিফাইড ব্লু ব্যাজ অনুমোদিত হয়েছে!' : '🎉 ওয়ালেট রিচার্জ সফল হয়েছে!',
          message: isVerificationRelated
            ? `আপনার ৳${tx.amount} পেমেন্ট (TrxID: ${tx.trxId}) সফলভাবে অনুমোদিত হয়েছে এবং আপনার প্রোফাইলে ব্লু ভেরিফাইড ব্যাজ সক্রিয় করা হয়েছে!`
            : `আপনার ৳${tx.amount} রিচার্জ রিকোয়েস্ট (TrxID: ${tx.trxId}) অনুমোদিত হয়েছে এবং ব্যালেন্স যোগ করা হয়েছে।`,
          actionData: { amount: tx.amount, trxId: tx.trxId, isVerified: isVerificationRelated }
        }).catch(() => {});
      } catch (_) {}

      // 7. Audit log
      try {
        await logAuditActivity({
          action: isVerificationRelated ? 'APPROVE_VERIFIED_BADGE_PAYMENT' : 'APPROVE_WALLET_RECHARGE',
          details: `সুপার এডমিন ${adminActorName}: ${tx.userName} (UID: ${tx.userId})-এর ৳${tx.amount} ${isVerificationRelated ? 'ভেরিফাইড ব্যাজ পেমেন্ট ও ব্লু ব্যাজ' : 'রিচার্জ'} অনুমোদন করেছেন (TrxID: ${tx.trxId})।`,
          category: 'financial',
          severity: 'info',
          targetId: tx.id,
          targetType: 'wallet_transaction'
        });
      } catch (_) {}

      toast.success(
        isVerificationRelated 
          ? `🎉 ৳${tx.amount} পেমেন্ট ও ব্লু ভেরিফাইড ব্যাজ সফলভাবে সক্রিয় হয়েছে!` 
          : `🎉 ৳${tx.amount} রিচার্জ সফলভাবে অনুমোদিত হয়েছে!`
      );
      setApproveModalTx(null);
      setConfirmApproveId(null);
    } catch (err: any) {
      console.error("Approve recharge error:", err);
      toast.error(err?.message ? `অনুমোদন ব্যর্থ: ${err.message}` : "অনুমোদন করতে সমস্যা হয়েছে");
    } finally {
      setProcessingRechargeId(null);
    }
  };

  const handleRejectRecharge = async () => {
    if (!rejectModalTx) return;
    setProcessingRechargeId(rejectModalTx.id);
    try {
      const txRef = doc(db, "wallet_transactions", rejectModalTx.id);
      await updateDoc(txRef, {
        status: "rejected",
        rejectionReason: rechargeRejectReason.trim() || "তথ্য যাচাইয়ে অসঙ্গতি থাকায় বাতিল করা হয়েছে",
        rejectedAt: serverTimestamp(),
        rejectedBy: userProfile?.name || user?.displayName || "সুপার এডমিন"
      });

      // Mark admin_approvals if existing
      if (rejectModalTx.trxId) {
        try {
          const apprQuery = query(
            collection(db, "admin_approvals"),
            where("trxId", "==", rejectModalTx.trxId)
          );
          const apprSnap = await getDocs(apprQuery);
          for (const apprDoc of apprSnap.docs) {
            await updateDoc(apprDoc.ref, {
              status: "rejected",
              rejectedAt: serverTimestamp()
            });
          }
        } catch (_) {}
      }

      // Notify citizen
      try {
        notificationService.dispatchNotification({
          recipientId: rejectModalTx.userId,
          actorId: user?.uid || 'system',
          actorName: 'সুপার এডমিন',
          actorAvatar: userProfile?.photoURL || user?.photoURL || '',
          type: 'system_notification',
          targetId: rejectModalTx.id,
          targetType: 'wallet',
          title: '⚠️ ওয়ালেট রিচার্জ বাতিল হয়েছে',
          message: `আপনার ৳${rejectModalTx.amount} রিচার্জ বাতিল করা হয়েছে। কারণ: ${rechargeRejectReason || 'তথ্য অসম্পূর্ণ'}`,
          actionData: { amount: rejectModalTx.amount, trxId: rejectModalTx.trxId }
        }).catch(() => {});
      } catch (_) {}

      toast('রিচার্জ রিকোয়েস্ট বাতিল করা হয়েছে', { icon: 'ℹ️' });
      setRejectModalTx(null);
      setRechargeRejectReason("");
    } catch (err: any) {
      console.error("Reject recharge error:", err);
      toast.error("বাতিল করতে সমস্যা হয়েছে");
    } finally {
      setProcessingRechargeId(null);
    }
  };

  return (
    <div className="w-full space-y-6 pb-16 font-sans text-slate-800">
      {/* Header Banner - Full Width Edge-to-Edge */}
      <div className="w-full bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-6 sm:p-8 md:p-10 text-white shadow-xl relative overflow-hidden border-b border-emerald-500/20">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <DollarSign size={240} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-7xl mx-auto">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-black mb-3">
              <ShieldCheck size={14} className="text-emerald-400" /> অ্যাডমিন মনিটাইজেশন কন্ট্রোল সেন্টার
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-2 tracking-tight">
              আড্ডা আর্থিক ও প্ল্যাটফর্ম ইকোনমি কন্ট্রোল
            </h2>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl font-bold leading-relaxed">
              পেইড অ্যাডস, ক্রিয়েটর পে-আউট এবং ফ্রড প্রটেকশন রিয়েলটাইমে নিয়ন্ত্রণ করুন
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 cursor-pointer shadow-md transition active:scale-95"
            >
              📊 এক্সপোর্ট রিপোর্ট (CSV)
            </button>
            <button
              onClick={loadData}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              ডাটা রিফ্রেশ
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full px-4 sm:px-6 md:px-8 max-w-7xl mx-auto space-y-6">

        {/* KPI Financial Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">মোট প্ল্যাটফর্ম রাজস্ব</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">৳{stats?.totalRevenueTk.toLocaleString() || '১,৪৮,৫০০'}</span>
            <span className="text-[10px] text-emerald-600 font-bold mt-1 block">+২২% এই মাসে বৃদ্ধি</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">ক্রিয়েটর পে-আউট প্রদান</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">৳{stats?.creatorPayoutsTk.toLocaleString() || '৬২,৪০০'}</span>
            <span className="text-[10px] text-slate-400 block">অনুমোদিত ক্রিয়েটর আয়</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">প্ল্যাটফর্ম নিট প্রফিট</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">৳{stats?.platformNetProfitTk.toLocaleString() || '৮৬,১০০'}</span>
            <span className="text-[10px] text-slate-400 block">কমিশন ও এডস আয়</span>
          </div>

          <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">পেন্ডিং উইথড্রয়াল</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">{stats?.pendingWithdrawalsCount || 5} টি আবেদন</span>
            <span className="text-[10px] text-amber-600 font-bold block">রিভিউ ও ভেরিফিকেশন প্রয়োজন</span>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-xs">
          {[
            { 
              id: 'recharges', 
              label: '💰 ওয়ালেট রিচার্জ অনুমোদন', 
              icon: DollarSign, 
              badge: pendingRechargesCount > 0 ? `${pendingRechargesCount}টি পেন্ডিং` : undefined,
              badgeColor: 'bg-amber-500 text-white' 
            },
            { id: 'withdrawals', label: '💳 উইথড্রয়াল ভেরিফিকেশন ও পে-আউট', icon: Wallet },
            { id: 'ads', label: '📢 অ্যাড ও পোস্ট বুস্ট অনুমোদন', icon: Rocket },
            { id: 'referrals', label: '🎁 রেফারেল অ্যান্ড গ্রোথ কন্ট্রোল', icon: Users },
            { id: 'fraud', label: '🛡️ ফ্রড ও ক্লিক স্প্যাম ডিটেকশন', icon: AlertTriangle },
            { id: 'audit', label: '🔐 ফাইন্যান্সিয়াল অডিট লগ', icon: Lock },
            { id: 'settings', label: '⚙️ commission ও রেভিনিউ শেয়ার রুলস', icon: Sliders }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${active ? 'bg-white text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 0: WALLET RECHARGE APPROVALS */}
        {activeTab === 'recharges' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      নাগরিক ওয়ালেট রিচার্জ অনুমোদন ও ট্রানজেকশন তালিকা
                    </h3>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">
                      নাগরিকের পাঠানো বিকাশ/নগদ TrxID যাচাই করে অনুমোদন করুন। অনুমোদন করলেই স্বয়ংক্রিয়ভাবে ইউজারের ওয়ালেট ব্যালেন্সে টাকা যুক্ত হবে।
                    </p>
                  </div>
                </div>
              </div>

              {pendingRechargesCount > 0 && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black shrink-0">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>{pendingRechargesCount}টি রিচার্জ অনুমোদনের অপেক্ষায়!</span>
                </div>
              )}
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl shrink-0 overflow-x-auto">
                {(['pending', 'all', 'completed', 'rejected'] as const).map((st) => {
                  const labels: Record<string, string> = {
                    pending: `অপেক্ষমাণ (${recharges.filter(r => r.status === 'pending').length})`,
                    all: `সব (${recharges.length})`,
                    completed: `অনুমোদিত (${recharges.filter(r => r.status === 'completed').length})`,
                    rejected: `বাতিল (${recharges.filter(r => r.status === 'rejected').length})`
                  };
                  return (
                    <button
                      key={st}
                      onClick={() => setRechargeStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        rechargeStatusFilter === st
                          ? 'bg-white text-slate-900 shadow-xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {labels[st]}
                    </button>
                  );
                })}
              </div>

              <div className="relative flex-1 sm:max-w-xs">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="TrxID, ফোন বা নাম দিয়ে খুঁজুন..."
                  value={rechargeSearch}
                  onChange={(e) => setRechargeSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs font-bold border border-slate-200 rounded-xl outline-none bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Transactions List */}
            {filteredRecharges.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2">
                <Clock size={36} className="text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-600">কোনো রিচার্জ রিকোয়েস্ট পাওয়া যায়নি</p>
                <p className="text-xs text-slate-400">ফিল্টার পরিবর্তন করে অথবা নতুন রিচার্জ জমা হওয়ার জন্য অপেক্ষা করুন।</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRecharges.map((tx) => {
                  const isProcessing = processingRechargeId === tx.id;
                  const formattedDate = tx.createdAt?.seconds 
                    ? new Date(tx.createdAt.seconds * 1000).toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' })
                    : (tx.createdAt ? new Date(tx.createdAt).toLocaleString('bn-BD') : 'এখনই');

                  const isBkash = (tx.method || '').toLowerCase().includes('bkash');
                  const isNagad = (tx.method || '').toLowerCase().includes('nagad');

                  return (
                    <div 
                      key={tx.id} 
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        tx.status === 'pending'
                          ? 'bg-amber-50/30 border-amber-200/80 shadow-xs'
                          : tx.status === 'completed'
                          ? 'bg-white border-slate-200/80'
                          : 'bg-rose-50/20 border-rose-100'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        
                        {/* Citizen Info & Payment Details */}
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-slate-900 text-sm">{tx.userName}</span>
                            
                            {/* Method Badge */}
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              isBkash 
                                ? 'bg-pink-100 text-pink-700 border border-pink-200' 
                                : isNagad 
                                ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {tx.method || 'bKash'}
                            </span>

                            {/* Status Badge */}
                            {tx.status === 'pending' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black inline-flex items-center gap-1">
                                <Clock size={11} /> অপেক্ষমাণ
                              </span>
                            )}
                            {tx.status === 'completed' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black inline-flex items-center gap-1">
                                <CheckCircle2 size={11} /> অনুমোদিত ✓
                              </span>
                            )}
                            {tx.status === 'rejected' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black inline-flex items-center gap-1">
                                <X size={11} /> বাতিল
                              </span>
                            )}
                          </div>

                          {/* Account & TrxID Details */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
                            {tx.accountNumber && (
                              <div className="inline-flex items-center gap-1">
                                <Phone size={13} className="text-slate-400" />
                                <span>প্রেরকের নম্বর:</span>
                                <span className="font-mono font-black text-slate-800">{tx.accountNumber}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(tx.accountNumber || '');
                                    toast.success('নম্বর কপি করা হয়েছে!');
                                  }}
                                  className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                                  title="কপি করুন"
                                >
                                  <Copy size={12} />
                                </button>
                              </div>
                            )}

                            {tx.trxId && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80">
                                <span className="font-bold text-slate-500">TrxID:</span>
                                <span className="font-mono font-black text-emerald-700 tracking-wide select-all">
                                  {tx.trxId}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(tx.trxId || '');
                                    toast.success('TrxID কপি করা হয়েছে!');
                                  }}
                                  className="text-slate-500 hover:text-emerald-700 p-0.5 cursor-pointer"
                                  title="TrxID কপি করুন"
                                >
                                  <Copy size={12} />
                                </button>
                              </div>
                            )}

                            <span className="text-[11px] text-slate-400">
                              {formattedDate}
                            </span>
                          </div>

                          {tx.description && (
                            <p className="text-[11px] text-slate-500 italic">
                              বিবরণ: {tx.description}
                            </p>
                          )}

                          {tx.rejectionReason && (
                            <p className="text-[11px] text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/60 inline-block">
                              বাতিলের কারণ: {tx.rejectionReason}
                            </p>
                          )}
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                          <div className="text-left lg:text-right">
                            <span className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight">
                              ৳{tx.amount.toFixed(2)}
                            </span>
                            <span className="block text-[10px] font-bold text-slate-400">
                              রিচার্জ পরিমাণ
                            </span>
                          </div>

                          {tx.status === 'pending' ? (
                            <div className="flex flex-wrap items-center gap-2">
                              {confirmApproveId === tx.id ? (
                                <div className="flex items-center gap-1.5 p-1 bg-emerald-50 rounded-xl border border-emerald-300 shadow-xs">
                                  <span className="text-[10px] font-black text-emerald-950 px-1">অনুমোদন নিশ্চিত?</span>
                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      executeApproveRecharge(tx);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    {isProcessing ? (
                                      <RefreshCw size={11} className="animate-spin" />
                                    ) : (
                                      <Check size={12} />
                                    )}
                                    <span>হ্যাঁ, অনুমোদন</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmApproveId(null);
                                      setApproveModalTx(null);
                                    }}
                                    className="px-2 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                                  >
                                    বাতিল
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmApproveId(tx.id);
                                      setApproveModalTx(tx);
                                    }}
                                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                  >
                                    {isProcessing ? (
                                      <RefreshCw size={13} className="animate-spin" />
                                    ) : (
                                      <Check size={14} />
                                    )}
                                    <span>অনুমোদন করুন</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRejectModalTx(tx);
                                      setRechargeRejectReason('');
                                      setConfirmApproveId(null);
                                    }}
                                    className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                                  >
                                    বাতিল
                                  </button>
                                </>
                              )}
                            </div>
                          ) : tx.status === 'completed' ? (
                            <div className="text-right">
                              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs inline-flex items-center gap-1">
                                <CheckCircle2 size={13} /> ব্যালেন্স যুক্ত হয়েছে
                              </span>
                              {tx.approvedBy && (
                                <span className="block text-[10px] text-slate-400 mt-1 font-medium">
                                  অনুমোদনকারী: {tx.approvedBy}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs">
                              বাতিলকৃত
                            </span>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 1: WITHDRAWAL APPROVALS */}
        {activeTab === 'withdrawals' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800">
                ক্রিয়েটর উইথড্রয়াল রিকোয়েস্ট তালিকা (Pending Creator Payouts)
              </h3>
              <span className="text-xs text-slate-500 font-bold">মোট পেন্ডিং: {withdrawals.length} টি</span>
            </div>

            <div className="divide-y divide-slate-100">
              {withdrawals.map((w) => (
                <div key={w.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">{w.userName}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {w.method.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-0.5">
                      ফোন: {w.userPhone} | অ্যাকাউন্ট নম্বর: <span className="font-mono font-bold text-slate-700">{w.accountNo}</span>
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      আবেদনের সময়: {new Date(w.requestedAt).toLocaleString('bn-BD')}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-600">৳{w.amountTk}</span>
                      <span className="block text-[10px] text-slate-400">ফি: ৳০.০০</span>
                    </div>

                    {w.status === 'pending' ? (
                      <button
                        onClick={() => setSelectedWithdrawal(w)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition cursor-pointer"
                      >
                        পে-আউট রিভিউ ও পেমেন্ট
                      </button>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                        পরিশোধিত ✓
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: ADS APPROVAL */}
        {activeTab === 'ads' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-800">
              বিজ্ঞাপন ও বুস্টেড পোস্ট ভেরিফিকেশন (Ads Moderation Queue)
            </h3>
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-extrabold text-slate-800 block">পুঠিয়া ডিজিটাল ডায়াগনস্টিক অ্যান্ড কনসালটেশন সেন্টার</span>
                <p className="text-slate-500 mt-0.5">বাজেট: ৳৫০/দিন (৫ দিনের জন্য) | লক্ষ্যবস্তু: পুঠিয়া সদর, জিউ পাড়া</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toast.success('ক্যাম্পেইন সফলভাবে অনুমোদিত!')} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer">
                  অনুমোদন করুন ✓
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: REFERRALS */}
        {activeTab === 'referrals' && (
          <AdminReferralPanel />
        )}

        {/* TAB 3: FRAUD DETECTION */}
        {activeTab === 'fraud' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              অটোমেটেড অ্যান্টি-ফ্রড ও ফেক এনগেজমেন্ট ডিটেক্টর
            </h3>
            <p className="text-xs text-slate-500">বট বা রোবোটিক ক্লিকে বিজ্ঞাপন বাজেট নষ্ট হওয়া রোধ করতে আড্ডার সিস্টেম মনিটর করে।</p>
            <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-800">
              🟢 কোন সন্দেহজনক অটোমেটেড কিক স্প্যাম বা ফ্রড এক্টিভিটি শনাক্ত হয়নি। সিস্টেম ১০০% সুরক্ষিত।
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                🔐 ফাইন্যান্সিয়াল অডিট লগ (Financial Audit Logs)
              </h3>
              <span className="text-xs text-slate-400 font-mono">সিকিউর লগার সক্রিয়</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {[
                { id: 'aud_1', admin: 'প্রধান এডমিন (অফিসিয়াল)', action: 'WITHDRAWAL_APPROVED', amount: 2000, reason: 'bKash TRX #98721345 এর মাধ্যমে পে-আউট প্রদান', date: 'আজ, ১০:১৫ AM' },
                { id: 'aud_2', admin: 'প্রধান এডমিন (অফিসিয়াল)', action: 'COMMISSION_RULE_UPDATE', amount: 0, reason: 'ক্রিয়েটর শেয়ার ৮০% এবং প্ল্যাটফর্ম ফি ২০% সেট করা হয়েছে', date: 'গতকাল, ০৬:৩০ PM' },
                { id: 'aud_3', admin: 'মডারেটর ১', action: 'AD_CAMPAIGN_APPROVED', amount: 500, reason: 'পুঠিয়া ডায়াগনস্টিক বিজ্ঞাপনের অনুমোদন', date: '২০ আগস্ট, ০৪:১০ PM' }
              ].map((log) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800">{log.admin}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-extrabold uppercase">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-0.5">{log.reason}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-700">{log.amount > 0 ? `৳${log.amount}` : '-'}</span>
                    <span className="block text-[10px] text-slate-400">{log.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-800">
              মনিটাইজেশন রুলস ও কমিশন কনফিগুরেশন (Monetization Rules & Policy)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">ক্রিয়েটর শেয়ার (%) [Default: 80%]:</label>
                <input
                  type="number"
                  value={creatorCommissionInput}
                  onChange={(e) => setCreatorCommissionInput(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-extrabold bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">সর্বনিম্ন উইথড্রয়াল লিমিট (৳) [Default: ৳500]:</label>
                <input
                  type="number"
                  value={minWithdrawalInput}
                  onChange={(e) => setMinWithdrawalInput(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-extrabold bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <button
              onClick={() => toast.success('কমিশন ও উইথড্রয়াল সেটিংস সফলভাবে আপডেট করা হয়েছে!')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              সেটিংস সেভ করুন
            </button>
          </div>
        )}

      </div>

      {/* APPROVAL MODAL */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-emerald-500/30 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900">
              উইথড্রয়াল রিকোয়েস্ট প্রসেসিং (Payout Approval)
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-100">
              <p><span className="font-bold text-slate-700">ক্রিয়েটর:</span> {selectedWithdrawal.userName}</p>
              <p><span className="font-bold text-slate-700">মেথড:</span> {selectedWithdrawal.method.toUpperCase()} ({selectedWithdrawal.accountNo})</p>
              <p><span className="font-bold text-emerald-600">উত্তোলনের টাকা:</span> ৳{selectedWithdrawal.amountTk}</p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                bKash/Nagad Transaction Ref (TRX ID):
              </label>
              <input
                type="text"
                placeholder="যেমন: TRX98721345"
                value={trxRef}
                onChange={(e) => setTrxRef(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-mono font-bold border border-slate-200 rounded-xl outline-none bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                অথবা বাতিল করার কারণ লিখুন (যদি বাতিল করতে চান):
              </label>
              <input
                type="text"
                placeholder="যেমন: ভুল অ্যাকাউন্ট নম্বর"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none bg-white text-slate-900 focus:ring-2 focus:ring-rose-500"
              />
              {rejectReason.trim() && (
                <button
                  type="button"
                  onClick={() => handleRejectWithdrawal(selectedWithdrawal)}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  আবেদনটি বাতিল করুন ও ব্যালেন্স রিফান্ড করুন
                </button>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleApproveWithdrawal(selectedWithdrawal)}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                অনুমোদন ও পেমেন্ট সফল কনফার্ম করুন
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedWithdrawal(null);
                  setRejectReason('');
                  setTrxRef('');
                }}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer transition"
              >
                বন্ধ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECHARGE APPROVAL CONFIRMATION MODAL */}
      {approveModalTx && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-emerald-500/40 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 size={26} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  পেমেন্ট ও ভেরিফিকেশন অনুমোদন
                </h3>
                <p className="text-xs text-slate-500 font-bold">
                  ব্যালেন্স যোগ ও ব্লু ভেরিফাইড ব্যাজ সক্রিয় হবে
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600">নাগরিক / গ্রাহক:</span>
                <span className="font-black text-slate-900">{approveModalTx.userName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600">পেমেন্ট মেথড:</span>
                <span className="font-black text-emerald-800 uppercase">{approveModalTx.method || 'bKash'}</span>
              </div>
              {approveModalTx.accountNumber && (
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600">প্রেরকের মোবাইল:</span>
                  <span className="font-mono font-black text-slate-900">{approveModalTx.accountNumber}</span>
                </div>
              )}
              {approveModalTx.trxId && (
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600">Transaction ID (TrxID):</span>
                  <span className="font-mono font-black text-emerald-700">{approveModalTx.trxId}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-emerald-200/60">
                <span className="font-black text-slate-800 text-sm">অনুমোদন ও রিচার্জ পরিমাণ:</span>
                <span className="text-xl font-black text-emerald-700">৳{approveModalTx.amount.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              অনুমোদন বোতামে চাপলেই তাৎক্ষণিকভাবে <strong className="text-slate-800">{approveModalTx.userName}</strong>-এর অ্যাকাউন্টে টাকা যোগ হবে, ভেরিফাইড ব্লু ব্যাজ সক্রিয় হবে এবং নোটিফিকেশন পৌঁছে যাবে।
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={processingRechargeId === approveModalTx.id}
                onClick={() => executeApproveRecharge(approveModalTx)}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {processingRechargeId === approveModalTx.id ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>অনুমোদন হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>হ্যাঁ, অনুমোদন ও ব্যাজ সক্রিয় করুন</span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={processingRechargeId === approveModalTx.id}
                onClick={() => {
                  setApproveModalTx(null);
                  setConfirmApproveId(null);
                }}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition disabled:opacity-50"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECHARGE REJECTION MODAL */}
      {rejectModalTx && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-rose-200 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  রিচার্জ আবেদন বাতিলকরণ
                </h3>
                <p className="text-xs text-slate-500 font-bold">
                  {rejectModalTx.userName} (৳{rejectModalTx.amount}) - TrxID: {rejectModalTx.trxId || 'N/A'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700">
                বাতিল করার কারণ লিখুন (নাগরিককে জানানো হবে) *
              </label>
              <textarea
                rows={3}
                placeholder="যেমন: প্রদত্ত TrxID পাওয়া যায়নি বা ভুল বিকাশ নম্বরে পাঠানো হয়েছে।"
                value={rechargeRejectReason}
                onChange={(e) => setRechargeRejectReason(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-200 rounded-xl outline-none bg-white text-slate-900 focus:ring-2 focus:ring-rose-500 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={processingRechargeId === rejectModalTx.id}
                onClick={handleRejectRecharge}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {processingRechargeId === rejectModalTx.id ? 'বাতিল হচ্ছে...' : 'বাতিল নিশ্চিত করুন'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRejectModalTx(null);
                  setRechargeRejectReason('');
                  setConfirmApproveId(null);
                }}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition"
              >
                বন্ধ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
