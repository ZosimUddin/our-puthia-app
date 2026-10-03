import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  History, 
  Plus, 
  CreditCard, 
  ReceiptText, 
  X, 
  Check, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw,
  Smartphone,
  Building2,
  Copy,
  Clock,
  ShieldCheck,
  Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  orderBy, 
  limit,
  doc,
  updateDoc,
  increment
} from "firebase/firestore";
import SEO from "../../components/SEO";

interface TransactionItem {
  id: string;
  type: 'recharge' | 'withdraw' | 'reward' | 'payment' | 'earning';
  amount: number;
  method?: string;
  accountNumber?: string;
  trxId?: string;
  status: 'pending' | 'completed' | 'approved' | 'rejected';
  description?: string;
  createdAt: any;
}

export const WalletPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  // Modal States
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'recharge' | 'withdraw'>('all');

  // Recharge Form State
  const [rechargeAmount, setRechargeAmount] = useState<number>(100);
  const [customRechargeAmount, setCustomRechargeAmount] = useState<string>("");
  const [rechargeMethod, setRechargeMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [senderNumber, setSenderNumber] = useState("");
  const [trxId, setTrxId] = useState("");
  const [isSubmittingRecharge, setIsSubmittingRecharge] = useState(false);

  // Withdraw Form State
  const [withdrawAmount, setWithdrawAmount] = useState<number>(500);
  const [withdrawMethod, setWithdrawMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // Transactions State
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Wallet Balance
  const walletBalance: number = Number((userProfile as any)?.walletBalance || 0);

  // Calculate Total In and Total Out
  const totalIn = transactions
    .filter(t => (t.type === 'recharge' || t.type === 'reward' || t.type === 'earning') && (t.status === 'completed' || t.status === 'approved'))
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const totalOut = transactions
    .filter(t => (t.type === 'withdraw' || t.type === 'payment') && (t.status === 'completed' || t.status === 'approved'))
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // Real-time Firestore listener for transactions
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "wallet_transactions"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: TransactionItem[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as TransactionItem);
        });
        setTransactions(list);
        setLoading(false);
      },
      (error) => {
        console.warn("Wallet transactions listener error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Handle Recharge Submission
  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = customRechargeAmount ? Number(customRechargeAmount) : rechargeAmount;

    if (!finalAmount || finalAmount < 10) {
      toast.error("ন্যূনতম রিচার্জ পরিমাণ ১০ টাকা");
      return;
    }

    if (!senderNumber.trim()) {
      toast.error("অনুগ্রহ করে যে নম্বর থেকে টাকা পাঠিয়েছেন তা লিখুন");
      return;
    }

    if (!trxId.trim()) {
      toast.error("অনুগ্রহ করে TrxID প্রদান করুন");
      return;
    }

    setIsSubmittingRecharge(true);
    try {
      if (user?.uid) {
        await addDoc(collection(db, "wallet_transactions"), {
          userId: user.uid,
          userName: userProfile?.name || user.displayName || "নাগরিক",
          type: "recharge",
          amount: finalAmount,
          method: rechargeMethod,
          accountNumber: senderNumber,
          trxId: trxId.toUpperCase(),
          status: "pending",
          description: `${rechargeMethod.toUpperCase()} রিচার্জ রিকোয়েস্ট`,
          createdAt: serverTimestamp()
        });

        // Also add admin approval task
        await addDoc(collection(db, "admin_approvals"), {
          type: "wallet_recharge",
          userId: user.uid,
          userName: userProfile?.name || user.displayName || "নাগরিক",
          amount: finalAmount,
          method: rechargeMethod,
          accountNumber: senderNumber,
          trxId: trxId.toUpperCase(),
          status: "pending",
          createdAt: serverTimestamp()
        });
      }

      setShowRechargeModal(false);
      setSenderNumber("");
      setTrxId("");
      setCustomRechargeAmount("");
      toast.success("রিচার্জের রিকোয়েস্ট সফলভাবে জমা হয়েছে! অ্যাডমিন যাচাই করার পর ব্যালেন্স যুক্ত হবে।");
    } catch (err) {
      console.error("Recharge error:", err);
      toast.error("রিচার্জ রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে");
    } finally {
      setIsSubmittingRecharge(false);
    }
  };

  // Handle Withdraw Submission
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (withdrawAmount < 500) {
      toast.error("ন্যূনতম উত্তোলন পরিমাণ ৫০০ টাকা");
      return;
    }

    if (withdrawAmount > walletBalance) {
      toast.error("আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই");
      return;
    }

    if (!withdrawAccount.trim()) {
      toast.error("অনুগ্রহ করে আপনার বিকাশ/নগদ নম্বর প্রদান করুন");
      return;
    }

    setIsSubmittingWithdraw(true);
    try {
      if (user?.uid) {
        // Record withdrawal transaction
        await addDoc(collection(db, "wallet_transactions"), {
          userId: user.uid,
          userName: userProfile?.name || user.displayName || "নাগরিক",
          type: "withdraw",
          amount: withdrawAmount,
          method: withdrawMethod,
          accountNumber: withdrawAccount,
          status: "pending",
          description: `${withdrawMethod.toUpperCase()} উইথড্র রিকোয়েস্ট`,
          createdAt: serverTimestamp()
        });

        // Add to withdrawals collection
        await addDoc(collection(db, "withdrawals"), {
          userId: user.uid,
          userName: userProfile?.name || user.displayName || "নাগরিক",
          userPhone: userProfile?.phone || withdrawAccount,
          amount: withdrawAmount,
          method: withdrawMethod,
          accountNumber: withdrawAccount,
          status: "pending",
          createdAt: serverTimestamp()
        });

        // Deduct from wallet balance
        await updateDoc(doc(db, "users", user.uid), {
          walletBalance: increment(-withdrawAmount)
        });
      }

      setShowWithdrawModal(false);
      setWithdrawAccount("");
      toast.success("উত্তোলনের আবেদন সফলভাবে জমা হয়েছে! ২৪ ঘণ্টার মধ্যে টাকা পাঠিয়ে দেওয়া হবে।");
    } catch (err) {
      console.error("Withdraw error:", err);
      toast.error("উত্তোলন আবেদন পাঠাতে সমস্যা হয়েছে");
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(user?.uid ? `/profile/${user.uid}` : "/adda");
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (selectedFilter === 'all') return true;
    return t.type === selectedFilter;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-16 select-none text-slate-900">
      <SEO 
        title="Wallet - ওয়ালেট" 
        description="আপনার ওয়ালেট ব্যালেন্স, রিচার্জ ও লেনদেনের বিবরণী"
        path="/wallet"
      />

      {/* ========================================================================= */}
      {/* 1. TOP APP BAR (Back Arrow + Centered Wallet Title + History Icon)        */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-2xs">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 active:scale-95 transition cursor-pointer border-none bg-transparent"
            title="ফিরে যান"
            aria-label="Back"
          >
            <ArrowLeft size={22} className="stroke-[2.5]" />
          </button>

          <h1 className="text-xl font-black text-slate-950 tracking-tight">
            Wallet
          </h1>

          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 active:scale-95 transition cursor-pointer border-none bg-transparent"
            title="লেনদেনের হিস্টোরি"
            aria-label="History"
          >
            <History size={21} className="stroke-[2.3]" />
          </button>
        </div>
      </header>

      {/* Main Wallet Canvas */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">

        {/* ========================================================================= */}
        {/* 2. GRADIENT BALANCE CARD (Matching Screenshot 2)                          */}
        {/* ========================================================================= */}
        <div className="rounded-[28px] bg-gradient-to-br from-[#0068FF] via-[#0082FF] to-[#0095FF] text-white p-6 shadow-md relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />

          {/* Top Row: Available Balance + BDT Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white/90">
              Available Balance
            </span>
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-black shadow-2xs">
              ৳ BDT
            </span>
          </div>

          {/* Large Main Amount */}
          <div className="mt-2 mb-4">
            <h2 className="text-4xl font-black tracking-tight text-white">
              ৳ {walletBalance.toFixed(2)}
            </h2>
          </div>

          {/* Divider */}
          <div className="border-t border-white/20 pt-3.5 flex items-center justify-between">
            {/* Total In */}
            <div>
              <p className="text-xs text-white/80 font-medium">Total In</p>
              <p className="text-sm sm:text-base font-black text-white mt-0.5">
                ৳ {totalIn.toFixed(2)}
              </p>
            </div>

            {/* Total Out */}
            <div className="text-right">
              <p className="text-xs text-white/80 font-medium">Total Out</p>
              <p className="text-sm sm:text-base font-black text-white mt-0.5">
                ৳ {totalOut.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. THREE ACTION CARDS GRID (Recharge, Withdraw, Transaction History)      */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {/* 3.1 Recharge Card */}
          <button
            type="button"
            onClick={() => setShowRechargeModal(true)}
            className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-2xs border border-slate-100/90 hover:bg-slate-50 transition active:scale-95 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0091FF] flex items-center justify-center mb-2.5 shadow-2xs">
              <Plus size={24} className="stroke-[2.5]" />
            </div>
            <span className="text-[13px] font-black text-slate-900 leading-tight">
              Recharge
            </span>
          </button>

          {/* 3.2 Withdraw Card */}
          <button
            type="button"
            onClick={() => setShowWithdrawModal(true)}
            className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-2xs border border-slate-100/90 hover:bg-slate-50 transition active:scale-95 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#00C853] flex items-center justify-center mb-2.5 shadow-2xs">
              <CreditCard size={22} className="stroke-[2.3]" />
            </div>
            <span className="text-[13px] font-black text-slate-900 leading-tight">
              Withdraw
            </span>
          </button>

          {/* 3.3 Transaction History Card */}
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="bg-white rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-2xs border border-slate-100/90 hover:bg-slate-50 transition active:scale-95 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-amber-50 text-[#FF9800] flex items-center justify-center mb-2.5 shadow-2xs">
              <History size={22} className="stroke-[2.3]" />
            </div>
            <span className="text-[12.5px] font-black text-slate-900 leading-tight">
              Transaction History
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 4. TRANSACTIONS LIST SECTION (Matching Screenshot 2)                      */}
        {/* ========================================================================= */}
        <div className="pt-2 space-y-3">
          {/* Header Row */}
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[15px] font-black text-slate-950">
              Transactions
            </h3>
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="text-[#0091FF] hover:text-blue-700 text-xs font-black cursor-pointer border-none bg-transparent"
            >
              See All
            </button>
          </div>

          {/* Transactions Card Container */}
          <div className="bg-white rounded-3xl p-4 shadow-2xs border border-slate-100/90 min-h-[220px] flex flex-col justify-center">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium">
                লোড হচ্ছে...
              </div>
            ) : transactions.length === 0 ? (
              /* Empty State matching Screenshot 2 */
              <div className="py-10 flex flex-col items-center justify-center text-center">
                <ReceiptText size={48} className="text-slate-300 stroke-[1.4] mb-3" />
                <p className="text-slate-400 font-medium text-[13px]">
                  No transactions yet
                </p>
              </div>
            ) : (
              /* Live Transaction Items */
              <div className="divide-y divide-slate-100">
                {transactions.slice(0, 5).map((t) => {
                  const isPositive = t.type === 'recharge' || t.type === 'reward' || t.type === 'earning';
                  return (
                    <div key={t.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                        </div>
                        <div>
                          <p className="text-[13px] font-black text-slate-950">
                            {t.description || (t.type === 'recharge' ? 'ব্যালেন্স রিচার্জ' : 'টাকা উত্তোলন')}
                          </p>
                          <p className="text-[10.5px] text-slate-400 mt-0.5">
                            {t.method?.toUpperCase()} • {t.status === 'completed' || t.status === 'approved' ? 'সফল' : t.status === 'pending' ? 'অনুমোদনের অপেক্ষায়' : 'বাতিল'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-[14px] font-black ${
                          isPositive ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {isPositive ? '+' : '-'}৳{t.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 5. RECHARGE MODAL                                                         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showRechargeModal && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0091FF] flex items-center justify-center">
                    <Plus size={18} strokeWidth={3} />
                  </div>
                  <h3 className="font-black text-slate-950 text-base">
                    ওয়ালেট রিচার্জ (Recharge)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRechargeModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center border-0 bg-transparent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRechargeSubmit} className="space-y-4">
                {/* Amount Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">রিচার্জের পরিমাণ নির্বাচন করুন</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[50, 100, 200, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setRechargeAmount(amt);
                          setCustomRechargeAmount("");
                        }}
                        className={`py-2.5 rounded-2xl text-xs font-black transition border cursor-pointer ${
                          rechargeAmount === amt && !customRechargeAmount
                            ? 'bg-[#0091FF] text-white border-[#0091FF] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        ৳{amt}
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    value={customRechargeAmount}
                    onChange={(e) => setCustomRechargeAmount(e.target.value)}
                    placeholder="অথবা অন্য পরিমাণ লিখুন (যেমন: ৩০০)"
                    className="w-full mt-1.5 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold outline-none focus:border-[#0091FF]"
                  />
                </div>

                {/* Method Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">পেমেন্ট মেথড</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRechargeMethod('bkash')}
                      className={`p-2.5 rounded-2xl flex flex-col items-center justify-center border cursor-pointer transition ${
                        rechargeMethod === 'bkash'
                          ? 'border-[#E2136E] bg-pink-50/50 text-[#E2136E] font-black shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <span className="text-xs font-black">বিকাশ (bKash)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRechargeMethod('nagad')}
                      className={`p-2.5 rounded-2xl flex flex-col items-center justify-center border cursor-pointer transition ${
                        rechargeMethod === 'nagad'
                          ? 'border-[#F7941D] bg-amber-50/50 text-[#F7941D] font-black shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <span className="text-xs font-black">নগদ (Nagad)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRechargeMethod('rocket')}
                      className={`p-2.5 rounded-2xl flex flex-col items-center justify-center border cursor-pointer transition ${
                        rechargeMethod === 'rocket'
                          ? 'border-[#8C3494] bg-purple-50/50 text-[#8C3494] font-black shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <span className="text-xs font-black">রকেট (Rocket)</span>
                    </button>
                  </div>
                </div>

                {/* Payment Instructions Banner */}
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/60 text-xs text-blue-900 space-y-1">
                  <p className="font-bold">সেন্ড মানি করার নম্বর (Send Money Number):</p>
                  <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-blue-200">
                    <span className="font-black text-sm text-[#0091FF]">01700000000</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("01700000000");
                        toast.success("নম্বর কপি করা হয়েছে");
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold border-0 bg-transparent cursor-pointer flex items-center gap-1"
                    >
                      <Copy size={13} />
                      কপি
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1">টাকা পাঠিয়ে নিচের বক্সে আপনার নম্বর ও TrxID লিখে সাবমিট করুন।</p>
                </div>

                {/* Sender Number & TrxID */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">যে নম্বর থেকে টাকা পাঠিয়েছেন</label>
                    <input
                      type="tel"
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-[#0091FF]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">ট্রানজেকশন আইডি (TrxID)</label>
                    <input
                      type="text"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="যেমন: 9J76KLOP8"
                      className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono uppercase font-bold outline-none focus:border-[#0091FF]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingRecharge}
                    className="w-full py-3 bg-[#0091FF] hover:bg-blue-600 text-white font-black text-xs sm:text-sm rounded-2xl transition shadow-xs border-0 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingRecharge ? "যাচাইকরণ হচ্ছে..." : "রিচার্জ নিশ্চিত করুন"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 6. WITHDRAW MODAL                                                         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#00C853] flex items-center justify-center">
                    <CreditCard size={18} />
                  </div>
                  <h3 className="font-black text-slate-950 text-base">
                    টাকা উত্তোলন (Withdraw)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center border-0 bg-transparent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Current Balance Notice */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-800 font-bold">উত্তোলনযোগ্য ব্যালেন্স</p>
                  <p className="text-lg font-black text-emerald-700 mt-0.5">৳{walletBalance.toFixed(2)}</p>
                </div>
                <span className="text-[11px] font-bold text-slate-500">ন্যূনতম ৫০০ টাকা</span>
              </div>

              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700">উত্তোলনের পরিমাণ (টাকা)</label>
                  <input
                    type="number"
                    min={500}
                    max={walletBalance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-black outline-none focus:border-[#00C853]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">উত্তোলনের মাধ্যম</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('bkash')}
                      className={`p-2.5 rounded-2xl flex items-center justify-center border cursor-pointer transition ${
                        withdrawMethod === 'bkash'
                          ? 'border-[#E2136E] bg-pink-50/50 text-[#E2136E] font-black shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <span className="text-xs font-black">বিকাশ (bKash)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('nagad')}
                      className={`p-2.5 rounded-2xl flex items-center justify-center border cursor-pointer transition ${
                        withdrawMethod === 'nagad'
                          ? 'border-[#F7941D] bg-amber-50/50 text-[#F7941D] font-black shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <span className="text-xs font-black">নগদ (Nagad)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">আপনার বিকাশ/নগদ পার্সোনাল নম্বর</label>
                  <input
                    type="tel"
                    value={withdrawAccount}
                    onChange={(e) => setWithdrawAccount(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-[#00C853]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingWithdraw || walletBalance < 500}
                    className="w-full py-3 bg-[#00C853] hover:bg-emerald-600 text-white font-black text-xs sm:text-sm rounded-2xl transition shadow-xs border-0 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingWithdraw ? "আবেদন জমা হচ্ছে..." : "উত্তোলনের আবেদন জমা দিন"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 7. TRANSACTION HISTORY DETAIL MODAL                                       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <History size={19} className="text-[#0091FF]" />
                  <h3 className="font-black text-slate-950 text-base">
                    সকল লেনদেন (Transactions)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center border-0 bg-transparent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2 shrink-0">
                {(['all', 'recharge', 'withdraw'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setSelectedFilter(f)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition border cursor-pointer ${
                      selectedFilter === f
                        ? 'bg-[#0091FF] text-white border-[#0091FF]'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {f === 'all' ? 'সকল' : f === 'recharge' ? 'রিচার্জ' : 'উত্তোলন'}
                  </button>
                ))}
              </div>

              {/* Transactions List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {filteredTransactions.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    কোনো লেনদেন পাওয়া যায়নি
                  </div>
                ) : (
                  filteredTransactions.map((t) => {
                    const isPositive = t.type === 'recharge' || t.type === 'reward' || t.type === 'earning';
                    return (
                      <div key={t.id} className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                          }`}>
                            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900">
                              {t.description || (t.type === 'recharge' ? 'ব্যালেন্স রিচার্জ' : 'টাকা উত্তোলন')}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {t.method?.toUpperCase()} {t.trxId ? `• TrxID: ${t.trxId}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`text-xs font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isPositive ? '+' : '-'}৳{t.amount.toFixed(2)}
                          </p>
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 ${
                            t.status === 'completed' || t.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-600'
                              : t.status === 'pending'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-rose-50 text-rose-600'
                          }`}>
                            {t.status === 'completed' || t.status === 'approved' ? 'সফল' : t.status === 'pending' ? 'পেন্ডিং' : 'বাতিল'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WalletPage;
