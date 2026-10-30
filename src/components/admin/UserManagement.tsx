import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  ShieldCheck, 
  ShieldAlert, 
  Ban, 
  CheckCircle2, 
  XCircle,
  UserCheck,
  UserX,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MoreVertical,
  RefreshCw,
  Filter,
  Shield,
  Trash2,
  Edit,
  Eye,
  Key
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getAllUsers, updateUserRole, deleteUserAccount, createUserAccount } from "../../api";
import { UserProfile } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { db } from "../../firebase";
import { doc, updateDoc } from "firebase/firestore";

type UserStatus = 'active' | 'suspended' | 'banned';

export interface ExtendedUserProfile extends Partial<UserProfile> {
  uid: string;
  name: string;
  email?: string;
  phone?: string;
  role?: UserProfile['role'];
  status?: UserStatus;
  statusReason?: string;
  nidNumber?: string;
  union?: string;
  village?: string;
  createdAt?: string;
  photoURL?: string;
  isBlocked?: boolean;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<ExtendedUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "suspended" | "banned">("all");
  const [actionLoading, setActionLoading] = useState(false);

  // Selected User Modal / Drawer
  const [selectedUser, setSelectedUser] = useState<ExtendedUserProfile | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [targetRole, setTargetRole] = useState<UserProfile['role']>('user');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "user" as UserProfile['role'],
    union: "পুঠিয়া পৌরসভা"
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      const normalized = data.map((u: any) => ({
        ...u,
        status: u.status || (u.isBlocked ? 'banned' : 'active'),
        role: u.role || 'user'
      }));
      setUsers(normalized);
    } catch (err: any) {
      toast.error("ইউজার লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusToggle = async (userItem: ExtendedUserProfile, nextStatus: UserStatus) => {
    setActionLoading(true);
    try {
      const docRef = doc(db, "users", userItem.uid);
      await updateDoc(docRef, {
        status: nextStatus,
        isBlocked: nextStatus === 'banned',
        updatedAt: new Date().toISOString()
      });

      setUsers(prev => prev.map(u => u.uid === userItem.uid ? { ...u, status: nextStatus, isBlocked: nextStatus === 'banned' } : u));
      toast.success(`ইউজার ${userItem.name || 'অ্যাকাউন্ট'} স্ট্যাটাস ${nextStatus} করা হয়েছে`);
    } catch (err) {
      toast.error("স্ট্যাটাস পরিবর্তনে সমস্যা হয়েছে");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await updateUserRole(selectedUser.uid, targetRole);
      setUsers(prev => prev.map(u => u.uid === selectedUser.uid ? { ...u, role: targetRole } : u));
      toast.success(`রোল সফলভাবে ${targetRole} এ পরিবর্তন করা হয়েছে`);
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (err) {
      toast.error("রোল পরিবর্তন ব্যর্থ হয়েছে");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (uid: string, name: string) => {
    
    setActionLoading(true);
    try {
      await deleteUserAccount(uid);
      setUsers(prev => prev.filter(u => u.uid !== uid));
      toast.success("ইউজার অ্যাকাউন্ট মুছে ফেলা হয়েছে");
    } catch (err) {
      toast.error("মুছে ফেলতে ব্যর্থ হয়েছে");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast.error("নাম ও ইমেইল অবশ্যই পূরণ করুন");
      return;
    }
    setActionLoading(true);
    try {
      await createUserAccount({
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        phone: newUser.phone.trim(),
        role: newUser.role,
        union: newUser.union
      });
      toast.success("নতুন ইউজার তৈরি হয়েছে");
      setShowAddModal(false);
      setNewUser({ name: "", email: "", phone: "", role: "user", union: "পুঠিয়া পৌরসভা" });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "ইউজার তৈরিতে সমস্যা হয়েছে");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered list
  const filteredUsers = users.filter(u => {
    const matchSearch = (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone || "").includes(searchTerm);
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchStatus = filterStatus === "all" || (u.status || "active") === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const counts = {
    total: users.length,
    active: users.filter(u => (u.status || 'active') === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    banned: users.filter(u => u.status === 'banned' || u.isBlocked).length,
    admins: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              নাগরিক ইউজার ও রোল কন্ট্রোল
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              সুপার অ্যাডমিন
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            পুঠিয়া প্ল্যাটফর্মের সকল নাগরিক, অ্যাডমিন, এডিটর ও মডারেটর অ্যাকাউন্ট ম্যানেজ করুন।
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>রিফ্রেশ</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus size={15} />
            <span>নতুন ইউজার তৈরি করুন</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">মোট ইউজার</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{counts.total}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-emerald-700">সক্রিয় (Active)</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{counts.active}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-amber-700">স্থগিত (Suspended)</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{counts.suspended}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-rose-700">নিষিদ্ধ (Banned)</p>
          <p className="text-2xl font-black text-rose-600 mt-1">{counts.banned}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="নাম, ফোন বা ইমেইল দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">সকল রোল</option>
            <option value="super_admin">👑 সুপার অ্যাডমিন</option>
            <option value="admin">🛡️ অ্যাডমিন</option>
            <option value="editor">📝 এডিটর</option>
            <option value="moderator">🛡️ মডারেটর</option>
            <option value="user">👤 সাধারণ নাগরিক</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">সকল স্ট্যাটাস</option>
            <option value="active">🟢 সক্রিয়</option>
            <option value="suspended">🟡 স্থগিত</option>
            <option value="banned">🔴 নিষিদ্ধ</option>
          </select>
        </div>
      </div>

      {/* User Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-xs font-bold">ইউজার ডেটা লোড হচ্ছে...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">কোনো ইউজার পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400 mt-1">অন্য কোনো নাম বা ফিল্টার দিয়ে খুঁজুন</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="p-4">নাগরিক / ইউজার</th>
                  <th className="p-4">যোগাযোগ</th>
                  <th className="p-4">রোল (Role)</th>
                  <th className="p-4">স্ট্যাটাস</th>
                  <th className="p-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((userItem) => {
                  const roleBadge = 
                    userItem.role === 'super_admin' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                    userItem.role === 'admin' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                    userItem.role === 'editor' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                    userItem.role === 'moderator' ? 'bg-purple-100 text-purple-900 border-purple-300' :
                    'bg-slate-100 text-slate-700 border-slate-200';

                  const statusBadge = 
                    userItem.status === 'suspended' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    userItem.status === 'banned' || userItem.isBlocked ? 'bg-rose-50 text-rose-800 border-rose-200' :
                    'bg-emerald-50 text-emerald-800 border-emerald-200';

                  return (
                    <tr key={userItem.uid} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Avatar */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0">
                            {userItem.photoURL ? (
                              <img src={userItem.photoURL} alt={userItem.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              (userItem.name || "U")[0].toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{userItem.name || "নামহীন ইউজার"}</p>
                            <p className="text-[11px] text-slate-400 truncate">{userItem.union || "পুঠিয়া"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="p-4">
                        <p className="font-medium text-slate-700">{userItem.email || "ইমেইল নেই"}</p>
                        <p className="text-[11px] text-slate-400">{userItem.phone || "ফোন নেই"}</p>
                      </td>

                      {/* Role */}
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge}`}>
                          {userItem.role === 'super_admin' ? '👑 সুপার অ্যাডমিন' :
                           userItem.role === 'admin' ? '🛡️ অ্যাডমিন' :
                           userItem.role === 'editor' ? '📝 এডিটর' :
                           userItem.role === 'moderator' ? '🛡️ মডারেটর' : '👤 নাগরিক'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}>
                          {userItem.status === 'suspended' ? 'স্থগিত' :
                           userItem.status === 'banned' || userItem.isBlocked ? 'নিষিদ্ধ' : 'সক্রিয়'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Role Switch button */}
                          <button
                            onClick={() => {
                              setSelectedUser(userItem);
                              setTargetRole(userItem.role || 'user');
                              setShowRoleModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="রোল পরিবর্তন করুন"
                          >
                            <Key size={14} />
                          </button>

                          {/* Ban/Unban toggle */}
                          {userItem.status === 'banned' || userItem.isBlocked ? (
                            <button
                              onClick={() => handleStatusToggle(userItem, 'active')}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                              title="আনব্যান করুন"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusToggle(userItem, 'banned')}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                              title="ব্যান করুন"
                            >
                              <Ban size={14} />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteUser(userItem.uid, userItem.name || 'ইউজার')}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 transition"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      <AnimatePresence>
        {showRoleModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
            >
              <h3 className="text-base font-black text-slate-900">
                ইউজার রোল পরিবর্তন করুন
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                ইউজার: <span className="font-bold text-slate-800">{selectedUser.name}</span> ({selectedUser.email})
              </p>

              <div className="mt-4 space-y-2">
                {[
                  { role: 'user', label: '👤 সাধারণ নাগরিক (User)', desc: 'সাইট ব্রাউজ ও সেবা গ্রহণ' },
                  { role: 'editor', label: '📝 কন্টেন্ট এডিটর (Editor)', desc: 'সংবাদ ও নোটিশ প্রকাশ' },
                  { role: 'moderator', label: '🛡️ মডারেটর (Moderator)', desc: 'আড্ডা ও রিপোর্ট রিভিউ' },
                  { role: 'admin', label: '🛡️ অ্যাডমিনিস্ট্রেটর (Admin)', desc: 'সাধারণ অ্যাডমিন সুবিধা' },
                  { role: 'super_admin', label: '👑 সুপার অ্যাডমিন (Master)', desc: 'সর্বোচ্চ নিয়ন্ত্রণ ক্ষমতা' },
                ].map((r) => (
                  <label
                    key={r.role}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      targetRole === r.role ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="userRole"
                      value={r.role}
                      checked={targetRole === r.role}
                      onChange={() => setTargetRole(r.role as any)}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800">{r.label}</p>
                      <p className="text-[11px] text-slate-500">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleRoleChange}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5"
                >
                  {actionLoading && <Loader2 size={14} className="animate-spin" />}
                  <span>সংরক্ষণ করুন</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
            >
              <h3 className="text-base font-black text-slate-900">
                নতুন ইউজার অ্যাকাউন্ট তৈরি করুন
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                সরাসরি প্ল্যাটফর্মে নতুন নাগরিক বা অ্যাডমিন যুক্ত করুন
              </p>

              <form onSubmit={handleCreateUser} className="space-y-3.5 mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">পূর্ণ নাম *</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="যেমন: মোঃ করিম হাসান"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ইমেইল ঠিকানা *</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">মোবাইল নাম্বার</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">রোল</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="user">নাগরিক (User)</option>
                      <option value="editor">এডিটর (Editor)</option>
                      <option value="moderator">মডারেটর</option>
                      <option value="admin">অ্যাডমিন</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ইউনিয়ন</label>
                    <select
                      value={newUser.union}
                      onChange={(e) => setNewUser({ ...newUser, union: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="পুঠিয়া পৌরসভা">পুঠিয়া পৌরসভা</option>
                      <option value="পুঠিয়া ইউনিয়ন">পুঠিয়া ইউনিয়ন</option>
                      <option value="বেলপুকুরিয়া">বেলপুকুরিয়া</option>
                      <option value="বানেশ্বর">বানেশ্বর</option>
                      <option value="ভালুকগাছি">ভালুকগাছি</option>
                      <option value="শিলমাড়িয়া">শিলমাড়িয়া</option>
                      <option value="জিউপাড়া">জিউপাড়া</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5"
                  >
                    {actionLoading && <Loader2 size={14} className="animate-spin" />}
                    <span>অ্যাকাউন্ট তৈরি করুন</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
