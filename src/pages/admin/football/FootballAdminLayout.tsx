import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Trophy,
  LayoutDashboard,
  Calendar,
  Users,
  Shield,
  Palette,
  Radio,
  FileCheck2,
  Table,
  Bell,
  MapPin,
  Sparkles,
  Layers,
  BarChart3,
  History,
  Settings,
  ExternalLink
} from 'lucide-react';

export const FOOTBALL_SUBMENUS = [
  { name: 'ফুটবল ড্যাশবোর্ড', path: '/admin/football', icon: LayoutDashboard },
  { name: 'টুর্নামেন্ট ব্যবস্থাপনা', path: '/admin/football/tournaments', icon: Trophy },
  { name: 'ক্লাব ও দল', path: '/admin/football/clubs', icon: Shield },
  { name: 'খেলোয়াড় ব্যবস্থাপনা', path: '/admin/football/players', icon: Users },
  { name: 'ম্যাচ শিডিউল', path: '/admin/football/matches', icon: Calendar },
  { name: 'ব্যানার ডিজাইনার', path: '/admin/football/banner-designer', icon: Palette },
  { name: 'লাইভ স্কোর', path: '/admin/football/live-score', icon: Radio },
  { name: 'ফলাফল', path: '/admin/football/results', icon: FileCheck2 },
  { name: 'পয়েন্ট টেবিল', path: '/admin/football/standings', icon: Table },
  { name: 'নোটিফিকেশন', path: '/admin/football/notifications', icon: Bell },
  { name: 'মাঠ ও ভেন্যু', path: '/admin/football/venues', icon: MapPin },
  { name: 'স্পনসর', path: '/admin/football/sponsors', icon: Sparkles },
  { name: 'ডিজাইন টেমপ্লেট', path: '/admin/football/templates', icon: Layers },
  { name: 'রিপোর্ট ও পরিসংখ্যান', path: '/admin/football/reports', icon: BarChart3 },
  { name: 'অ্যাক্টিভিটি লগ', path: '/admin/football/activity-logs', icon: History },
  { name: 'ফুটবল সিস্টেম সেটিংস', path: '/admin/football/settings', icon: Settings },
];

export const FootballAdminLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden min-w-0">
      {/* Top Banner & Hub Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-[#0B7A3B] to-teal-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden border border-emerald-600/30">
        <div className="absolute -right-6 -bottom-6 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 text-xs font-black">
              <Trophy size={14} className="text-yellow-300" />
              <span>আমাদের পুঠিয়া — ফুটবল টুর্নামেন্ট কমান্ড সেন্টার</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              ফুটবল টুর্নামেন্ট অটোমেশন ও ব্যবস্থাপনা
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
              টুর্নামেন্ট তৈরি, দল ও খেলোয়াড় নিবন্ধন, অটোমেটেড ফিক্সচার শিডিউল, লাইভ স্কোর সেন্টার, স্ট্যান্ডিংস এবং পেশাদার ব্যানার ডিজাইন পরিচালনা করুন।
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="/football"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all border border-white/20 shadow-xs backdrop-blur-xs active:scale-95"
            >
              <span>পাবলিক পোর্টাল</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Submenu Navigation Bar */}
      <div className="bg-white p-1.5 sm:p-2 rounded-2xl border border-slate-200/80 shadow-xs w-full max-w-full overflow-hidden">
        <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 no-scrollbar scroll-smooth touch-pan-x w-full min-w-0">
          {FOOTBALL_SUBMENUS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/admin/football' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 select-none ${
                  isActive
                    ? 'bg-[#0B7A3B] text-white font-black shadow-xs ring-1 ring-[#0B7A3B]'
                    : 'bg-slate-50 text-slate-700 hover:text-[#0B7A3B] hover:bg-emerald-50 border border-slate-100'
                }`}
              >
                <Icon size={15} className="shrink-0" />
                <span className="shrink-0">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Nested Sub-route View */}
      <Outlet />
    </div>
  );
};
