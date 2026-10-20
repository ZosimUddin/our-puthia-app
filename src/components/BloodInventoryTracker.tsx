import React, { useState, useEffect } from "react";
import {
  Droplet,
  Plus,
  Minus,
  RefreshCw,
  Hospital,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Edit3,
  Search,
  Filter,
  History,
  Info,
  MapPin,
  ChevronRight,
  Send,
  X,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  BloodInventoryItem,
  BloodGroup,
  StockStatus,
  BloodStockLog,
  subscribeToBloodInventory,
  updateBloodStock,
  subscribeToStockLogs,
  INITIAL_BLOOD_STOCK
} from "../services/bloodInventoryService";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

interface BloodInventoryTrackerProps {
  onOpenEmergencyRequest?: (bloodGroup?: string) => void;
}

export const BloodInventoryTracker: React.FC<BloodInventoryTrackerProps> = ({
  onOpenEmergencyRequest
}) => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<BloodInventoryItem[]>([]);
  const [stockLogs, setStockLogs] = useState<BloodStockLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [showLogModal, setShowLogModal] = useState(false);

  // Admin Stock Edit Modal State
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<BloodInventoryItem | null>(null);
  const [editBags, setEditBags] = useState<number>(0);
  const [editReserved, setEditReserved] = useState<number>(0);
  const [editHospital, setEditHospital] = useState<string>("");
  const [editLocation, setEditLocation] = useState<string>("");
  const [editPhone, setEditPhone] = useState<string>("");
  const [editStatus, setEditStatus] = useState<StockStatus>("available");
  const [editNotes, setEditNotes] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  const isAdminOrStaff =
    user?.role === "admin" ||
    user?.role === "super_admin" ||
    user?.role === "moderator" ||
    user?.role === "editor";

  useEffect(() => {
    const unsubscribeInventory = subscribeToBloodInventory((data) => {
      setInventory(data);
      setLoading(false);
    });

    const unsubscribeLogs = subscribeToStockLogs((logs) => {
      setStockLogs(logs);
    });

    return () => {
      unsubscribeInventory();
      unsubscribeLogs();
    };
  }, []);

  const totalBags = inventory.reduce((acc, curr) => acc + (curr.bagsAvailable || 0), 0);
  const totalReserved = inventory.reduce((acc, curr) => acc + (curr.reservedBags || 0), 0);
  const criticalCount = inventory.filter((item) => item.bagsAvailable <= 1).length;

  const handleOpenEditModal = (item: BloodInventoryItem) => {
    setSelectedItemForEdit(item);
    setEditBags(item.bagsAvailable || 0);
    setEditReserved(item.reservedBags || 0);
    setEditHospital(item.hospitalName || "পুঠিয়া উপজেলা স্বাস্থ্য কমপ্লেক্স ব্লাড ব্যাংক");
    setEditLocation(item.location || "উপজেলা কমপ্লেক্স ভবন, পুঠিয়া, রাজশাহী");
    setEditPhone(item.contactPhone || "01711-001122");
    setEditStatus(item.status || "available");
    setEditNotes("");
  };

  const handleSaveStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForEdit) return;

    setIsUpdating(true);
    try {
      await updateBloodStock(
        {
          id: selectedItemForEdit.id,
          bloodGroup: selectedItemForEdit.bloodGroup,
          bagsAvailable: Math.max(0, editBags),
          reservedBags: Math.max(0, editReserved),
          hospitalName: editHospital,
          location: editLocation,
          contactPhone: editPhone,
          status: editStatus,
          notes: editNotes.trim() || undefined
        },
        {
          uid: user?.uid || "admin",
          name: user?.displayName || user?.email?.split("@")[0] || "অ্যাডমিনিস্ট্রেটর",
          email: user?.email || "admin@puthia.gov.bd"
        },
        editNotes.trim()
      );

      toast.success(`${selectedItemForEdit.bloodGroup} গ্রুপের রক্ত স্টক সফলভাবে আপডেট করা হয়েছে!`);
      setSelectedItemForEdit(null);
    } catch (err) {
      console.error("Error updating stock:", err);
      toast.error("রক্তের স্টক আপডেট করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.bloodGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedFilter === "all") return matchesSearch;
    if (selectedFilter === "critical") return matchesSearch && (item.status === "critical" || item.bagsAvailable <= 1);
    if (selectedFilter === "low") return matchesSearch && (item.status === "low" || (item.bagsAvailable > 1 && item.bagsAvailable <= 3));
    if (selectedFilter === "available") return matchesSearch && item.status === "available" && item.bagsAvailable > 3;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Live Real-time Stats */}
      <div className="bg-gradient-to-br from-rose-900 via-rose-800 to-red-950 text-white rounded-3xl p-5 md:p-6 shadow-lg border border-rose-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-rose-500/20 text-rose-200 border border-rose-400/30 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                লাইভ রিয়েল-টাইম স্টক আপডেট
              </span>
              {isAdminOrStaff && (
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-black">
                  অ্যাডমিন এডিট মোড সক্রিয়
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLogModal(true)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/15 cursor-pointer"
              >
                <History size={14} className="text-rose-300" />
                <span>স্টক হিস্ট্রি</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                <Droplet className="text-rose-400 fill-rose-400 w-7 h-7" />
                পুঠিয়া ব্লাড ব্যাংক ইনভেন্টরি ট্র্যাকার
              </h2>
              <p className="text-xs md:text-sm text-rose-100/90 font-medium mt-1">
                উপজেলা স্বাস্থ্য কমপ্লেক্স ও রক্তদান কেন্দ্র সমূহের বর্তমান রক্তের ব্যাগ মজুদ সংখ্যা
              </p>
            </div>

            {isAdminOrStaff && (
              <div className="shrink-0">
                <button
                  onClick={() => handleOpenEditModal(inventory[0] || INITIAL_BLOOD_STOCK[0])}
                  className="px-4 py-2.5 bg-white text-rose-900 hover:bg-rose-50 font-black text-xs rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus size={16} className="text-rose-600" />
                  <span>স্টক আপডেট করুন</span>
                </button>
              </div>
            )}
          </div>

          {/* Key Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="text-[11px] font-bold text-rose-200">মোট মজুদ রক্ত</div>
              <div className="text-2xl md:text-3xl font-black text-white mt-0.5">{totalBags} ব্যাগ</div>
              <div className="text-[10px] text-rose-200/80 mt-0.5 flex items-center gap-1">
                <TrendingUp size={11} className="text-emerald-400" />
                ৮টি গ্রুপসহ
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="text-[11px] font-bold text-rose-200">সংরক্ষিত ব্যাগ</div>
              <div className="text-2xl md:text-3xl font-black text-amber-300 mt-0.5">{totalReserved} ব্যাগ</div>
              <div className="text-[10px] text-rose-200/80 mt-0.5">রোগীর জন্য বুকড</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="text-[11px] font-bold text-rose-200">সংকটজনক গ্রুপ</div>
              <div className="text-2xl md:text-3xl font-black text-rose-300 mt-0.5">{criticalCount}টি</div>
              <div className="text-[10px] text-rose-200/80 mt-0.5">জরুরি ডোনার দরকার</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="text-[11px] font-bold text-rose-200">কেন্দ্রীয় হাসপাতাল</div>
              <div className="text-xs font-black text-white mt-1 truncate">পুঠিয়া উপজেলা হাসপাতাল</div>
              <div className="text-[10px] text-rose-200/80 mt-0.5 truncate">২৪/৭ জরুরি সার্ভিস</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Control Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="রক্তের গ্রুপ বা হাসপাতাল খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "all", label: "সব গ্রুপ" },
              { id: "available", label: "পর্যাপ্ত মজুদ" },
              { id: "low", label: "স্বল্পতা" },
              { id: "critical", label: "জরুরি সংকট" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  selectedFilter === f.id
                    ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Blood Stock Inventory Grid (8 Groups Cards) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-slate-100 h-48 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <Droplet size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-black text-slate-700">কোনো ইনভেন্টরি তথ্য পাওয়া যায়নি</p>
          <p className="text-xs text-slate-400 mt-1">অন্য কোনো ফিল্টার বা অনুসন্ধান টার্ম চেষ্টা করুন</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredInventory.map((item) => {
            const isCritical = item.bagsAvailable <= 1 || item.status === "critical";
            const isLow = !isCritical && (item.bagsAvailable <= 3 || item.status === "low");

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl p-4 border transition-all duration-200 shadow-xs relative flex flex-col justify-between ${
                  isCritical
                    ? "border-rose-300 ring-1 ring-rose-200 bg-rose-50/20"
                    : isLow
                    ? "border-amber-300 bg-amber-50/20"
                    : "border-slate-200/80 hover:border-rose-300"
                }`}
              >
                <div>
                  {/* Top Row: Blood Group & Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm border ${
                          isCritical
                            ? "bg-rose-600 text-white border-rose-700"
                            : isLow
                            ? "bg-amber-500 text-white border-amber-600"
                            : "bg-red-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {item.bloodGroup}
                      </div>

                      <div>
                        <div className="text-xs font-black text-slate-900">{item.bloodGroup} গ্রুপ রক্ত</div>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border mt-0.5 ${
                            isCritical
                              ? "bg-rose-100 text-rose-800 border-rose-200"
                              : isLow
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isCritical ? "bg-rose-600 animate-ping" : isLow ? "bg-amber-600" : "bg-emerald-600"
                            }`}
                          />
                          {isCritical ? "জরুরি সংকট" : isLow ? "স্বল্প মজুদ" : "পর্যাপ্ত মজুদ"}
                        </span>
                      </div>
                    </div>

                    {isAdminOrStaff && (
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="স্টক সম্পাদনা করুন"
                      >
                        <Edit3 size={15} />
                      </button>
                    )}
                  </div>

                  {/* Stock Quantity Meter */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 mb-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-bold text-slate-500">মজুদ পরিমাণ</span>
                      <div className="text-right">
                        <span className="text-xl font-black text-slate-900">{item.bagsAvailable}</span>
                        <span className="text-xs text-slate-500 font-bold ml-1">ব্যাগ</span>
                      </div>
                    </div>

                    {/* Visual Meter Bar */}
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isCritical ? "bg-rose-600" : isLow ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, (item.bagsAvailable / 25) * 100))}%` }}
                      />
                    </div>

                    {item.reservedBags > 0 && (
                      <div className="text-[10px] font-bold text-amber-700 flex items-center justify-between pt-0.5">
                        <span>সংরক্ষিত রোগী ব্যাগ:</span>
                        <span>{item.reservedBags} ব্যাগ</span>
                      </div>
                    )}
                  </div>

                  {/* Location & Hospital details */}
                  <div className="space-y-1 text-xs text-slate-600 mb-3">
                    <div className="flex items-start gap-1.5 font-semibold text-slate-800">
                      <Hospital size={13} className="text-rose-600 shrink-0 mt-0.5" />
                      <span className="truncate">{item.hospitalName}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-500 text-[11px]">
                      <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  </div>

                  {item.notes && (
                    <div className="p-2 bg-rose-50/60 rounded-lg text-[10px] font-medium text-rose-900 border border-rose-100 mb-3">
                      ℹ️ {item.notes}
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  {isCritical || item.bagsAvailable === 0 ? (
                    <button
                      onClick={() => onOpenEmergencyRequest?.(item.bloodGroup)}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <AlertTriangle size={13} />
                      <span>জরুরি রক্তের রিকোয়েস্ট করুন</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenEmergencyRequest?.(item.bloodGroup)}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Droplet size={13} className="text-rose-400 fill-rose-400" />
                      <span>রক্তের আবেদন করুন</span>
                    </button>
                  )}

                  <a
                    href={`tel:${item.contactPhone}`}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Phone size={12} className="text-emerald-600" />
                    <span>কল করুন ({item.contactPhone})</span>
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 4. ADMIN STOCK UPDATE MODAL */}
      <AnimatePresence>
        {selectedItemForEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedItemForEdit(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                  {selectedItemForEdit.bloodGroup}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {selectedItemForEdit.bloodGroup} গ্রুপ স্টক আপডেট
                  </h3>
                  <p className="text-xs text-slate-500">ব্লাড ব্যাংকের রিয়েল-টাইম মজুদের পরিমাণ সেট করুন</p>
                </div>
              </div>

              <form onSubmit={handleSaveStockUpdate} className="space-y-4">
                {/* Bag Quantity Adjuster */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-xs font-black text-slate-700 block">উপলব্ধ রক্তের ব্যাগ সংখ্যা (Bags)</label>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setEditBags(Math.max(0, editBags - 1))}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-300 flex items-center justify-center text-slate-700 font-bold hover:bg-rose-50 cursor-pointer active:scale-90 transition"
                    >
                      <Minus size={16} />
                    </button>

                    <input
                      type="number"
                      min={0}
                      value={editBags}
                      onChange={(e) => setEditBags(parseInt(e.target.value) || 0)}
                      className="w-24 text-center py-2 text-2xl font-black bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500/30 focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => setEditBags(editBags + 1)}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-300 flex items-center justify-center text-slate-700 font-bold hover:bg-rose-50 cursor-pointer active:scale-90 transition"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Quick increment buttons */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {[-5, -1, 1, 5, 10].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setEditBags(Math.max(0, editBags + val))}
                        className="px-2.5 py-1 bg-white hover:bg-rose-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        {val > 0 ? `+${val}` : val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reserved Bags */}
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">সংরক্ষিত ব্যাগ (Reserved)</label>
                  <input
                    type="number"
                    min={0}
                    value={editReserved}
                    onChange={(e) => setEditReserved(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>

                {/* Status selector */}
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">স্টক স্ট্যাটাস নির্বাচন</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as StockStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  >
                    <option value="available">🟢 পর্যাপ্ত মজুদ (Available)</option>
                    <option value="low">🟡 স্বল্প মজুদ (Low Stock)</option>
                    <option value="critical">🔴 জরুরি সংকট (Critical Shortage)</option>
                  </select>
                </div>

                {/* Storage Hospital / Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1">হাসপাতাল / প্রতিষ্ঠান</label>
                    <input
                      type="text"
                      value={editHospital}
                      onChange={(e) => setEditHospital(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1">জরুরি ফোন নম্বর</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Reason Notes */}
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">আপডেটের বিবরণ / নোট (ঐচ্ছিক)</label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="যেমন: রক্তদান ক্যাম্প হতে ১৫ ব্যাগ সংগ্রহ করা হয়েছে"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedItemForEdit(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUpdating ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    <span>স্টক সংরক্ষণ করুন</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. STOCK UPDATE LOGS MODAL */}
      <AnimatePresence>
        {showLogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl relative max-h-[85vh] overflow-y-auto space-y-4"
            >
              <button
                onClick={() => setShowLogModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2">
                <History className="text-rose-600" size={20} />
                <h3 className="text-base font-black text-slate-900">সাম্প্রতিক স্টক আপডেট হিস্ট্রি</h3>
              </div>

              <div className="space-y-2">
                {stockLogs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-bold">
                    কোনো সাম্প্রতিক স্টক আপডেটের রেকর্ড পাওয়া যায়নি।
                  </div>
                ) : (
                  stockLogs.map((log, idx) => (
                    <div
                      key={log.id || idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md">
                            {log.bloodGroup}
                          </span>
                          <span className="font-bold text-slate-900">
                            {log.previousBags} ব্যাগ ➔ {log.newBags} ব্যাগ
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">{log.reason}</p>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                          আপডেট করেছেন: {log.adminName}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString("bn-BD") : "সাম্প্রতিক"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
