import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  ShieldAlert, 
  UserCheck, 
  ChevronRight, 
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

interface AdminQuickActionsSidebarWidgetProps {
  onItemClick?: () => void;
  isCollapsed?: boolean;
}

export const AdminQuickActionsSidebarWidget: React.FC<AdminQuickActionsSidebarWidgetProps> = ({
  onItemClick,
  isCollapsed = false
}) => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const [pendingBusinesses, setPendingBusinesses] = useState<number>(0);
  const [pendingReports, setPendingReports] = useState<number>(0);
  const [pendingVerifications, setPendingVerifications] = useState<number>(0);

  // Check if current user is an Admin, Super Admin, or Staff
  const isStaff = 
    userProfile?.role === 'super_admin' || 
    userProfile?.role === 'admin' || 
    userProfile?.role === 'moderator' || 
    userProfile?.role === 'editor' || 
    userProfile?.role === 'staff' ||
    user?.email === 'mdzosimuddin31@gmail.com' ||
    user?.email === 'mdzosimuddin47@gmail.com' ||
    user?.email === 'josimuddinadds@gmail.com';

  useEffect(() => {
    if (!isStaff) return;

    const unsubs: (() => void)[] = [];

    // 1. Pending Businesses (local_shops with verified: false or status: pending)
    try {
      const qShops = query(collection(db, 'local_shops'), where('verified', '==', false));
      const unsubShops = onSnapshot(qShops, (snap) => {
        setPendingBusinesses(snap.size);
      }, (err) => console.warn('Quick actions shops count notice:', err));
      unsubs.push(unsubShops);
    } catch (e) {}

    // 2. Pending Reports (reports with status pending or investigating)
    try {
      const qReports = query(collection(db, 'reports'));
      const unsubReports = onSnapshot(qReports, (snap) => {
        const activeCount = snap.docs.filter((d) => {
          const s = d.data().status;
          return !s || s === 'pending' || s === 'investigating' || s === 'open';
        }).length;
        setPendingReports(activeCount);
      }, (err) => console.warn('Quick actions reports count notice:', err));
      unsubs.push(unsubReports);
    } catch (e) {}

    // 3. User Verification Requests
    try {
      const qVerif = query(collection(db, 'users'), where('nidStatus', '==', 'pending'));
      const unsubVerif = onSnapshot(qVerif, (snap) => {
        setPendingVerifications(snap.size);
      }, (err) => console.warn('Quick actions verifications count notice:', err));
      unsubs.push(unsubVerif);
    } catch (e) {}

    return () => unsubs.forEach((fn) => fn());
  }, [isStaff]);

  if (!isStaff) return null;

  const quickActionItems = [
    {
      id: 'businesses',
      title: 'ব্যবসা অনুমোদন',
      fullTitle: 'পেন্ডিং ব্যবসা অনুমোদন',
      subtitle: 'দোকান ও ব্যবসা প্রোফাইল',
      count: pendingBusinesses,
      path: '/admin/businesses',
      icon: Store,
      color: 'amber',
      accentBg: 'bg-amber-50',
      accentText: 'text-amber-800',
      badgeBg: 'bg-amber-500 text-slate-950 font-black',
      borderHover: 'hover:border-amber-300 hover:bg-amber-50/50'
    },
    {
      id: 'reports',
      title: 'নতুন রিপোর্ট',
      fullTitle: 'নাগরিক রিপোর্ট ও অভিযোগ',
      subtitle: 'ফ্ল্যাগড কনটেন্ট ও ইউজার রিপোর্ট',
      count: pendingReports,
      path: '/admin/reports-hub',
      icon: ShieldAlert,
      color: 'rose',
      accentBg: 'bg-rose-50',
      accentText: 'text-rose-700',
      badgeBg: 'bg-rose-500 text-white font-black',
      borderHover: 'hover:border-rose-300 hover:bg-rose-50/50'
    },
    {
      id: 'verifications',
      title: 'ইউজার ভেরিফিকেশন',
      fullTitle: 'ইউজার ভেরিফিকেশন আবেদন',
      subtitle: 'এনআইডি ও ট্রাস্ট ব্যাজ আবেদন',
      count: pendingVerifications,
      path: '/admin/verification',
      icon: UserCheck,
      color: 'blue',
      accentBg: 'bg-blue-50',
      accentText: 'text-blue-700',
      badgeBg: 'bg-blue-600 text-white font-black',
      borderHover: 'hover:border-blue-300 hover:bg-blue-50/50'
    }
  ];

  const handleActionClick = (path: string) => {
    if (onItemClick) onItemClick();
    navigate(path);
  };

  if (isCollapsed) {
    return (
      <div className="py-2.5 my-2 border-y border-slate-100 flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0B7A3B] flex items-center justify-center" title="Admin Quick Actions">
          <Zap size={16} />
        </div>
        {quickActionItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleActionClick(item.path)}
              className="relative p-2.5 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition border-none bg-transparent cursor-pointer group"
              title={`${item.fullTitle} (${item.count}টি অপেক্ষমাণ)`}
            >
              <Icon size={18} />
              {item.count > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="my-2 p-2.5 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50/60 rounded-2xl border border-emerald-100/90 shadow-2xs space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1">
            <Zap size={12} className="text-[#0B7A3B]" />
            <span>অ্যাডমিন কুইক অ্যাকশন</span>
          </span>
        </div>
        <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-[#0B7A3B]">
          Quick Actions
        </span>
      </div>

      {/* 3 One-Click Action Cards */}
      <div className="space-y-1.5">
        {quickActionItems.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => handleActionClick(action.path)}
              className={`w-full text-left p-2 rounded-xl bg-white border border-slate-100 flex items-center justify-between gap-2.5 transition-all cursor-pointer group shadow-2xs ${action.borderHover} active:scale-[0.98]`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg ${action.accentBg} ${action.accentText} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11.5px] font-black text-slate-900 truncate group-hover:text-emerald-800 transition-colors">
                      {action.title}
                    </p>
                  </div>
                  <p className="text-[9.5px] text-slate-500 font-medium truncate">
                    {action.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {action.count > 0 ? (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${action.badgeBg} shadow-2xs animate-pulse`}>
                    {action.count}টি
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-bold px-1.5 py-0.5 rounded-md bg-slate-50">
                    ০
                  </span>
                )}
                <ChevronRight size={13} className="text-slate-300 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AdminQuickActionsSidebarWidget;
