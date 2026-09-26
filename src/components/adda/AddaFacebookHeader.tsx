import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MessageCircle, 
  Users, 
  Menu,
  Home,
  Tv,
  Bell,
  ArrowLeft
} from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { AddaSearchModal } from './search/AddaSearchModal';
import { NotificationPanel } from '../user/NotificationPanel';
import { AuthModal } from '../AuthModal';
import { Sidebar } from '../Sidebar';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface AddaFacebookHeaderProps {
  onOpenCreateModal?: (action?: 'photo' | 'video' | 'general') => void;
  activeTab?: 'feed' | 'friends' | 'reels' | 'marketplace' | 'notifications' | 'menu' | string;
  onTabChange?: (tab: string) => void;
}

export const AddaFacebookHeader: React.FC<AddaFacebookHeaderProps> = ({
  onOpenCreateModal,
  activeTab = 'feed',
  onTabChange
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile } = useAuth();
  const { unreadCount: notifUnreadCount } = useNotifications();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [incomingRequestsCount, setIncomingRequestsCount] = useState(0);
  const [unreadPostsCount, setUnreadPostsCount] = useState(0);
  const [unreadReelsCount, setUnreadReelsCount] = useState(0);

  // Real-time friend requests count for friends tab badge
  useEffect(() => {
    if (!user) {
      setIncomingRequestsCount(0);
      return;
    }
    try {
      const q = query(
        collection(db, 'friend_requests'),
        where('receiverId', '==', user.uid),
        where('status', '==', 'pending')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setIncomingRequestsCount(snapshot.size);
      }, () => {});
      return () => unsubscribe();
    } catch (e) {
      console.warn("Friend reqs count listener error", e);
    }
  }, [user]);

  // Real-time unread messages count
  useEffect(() => {
    if (!user) {
      setUnreadMsgCount(0);
      return;
    }

    try {
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let totalUnread = 0;
        snapshot.docs.forEach(d => {
          const data = d.data();
          if (data.unreadCounts && data.unreadCounts[user.uid]) {
            totalUnread += Number(data.unreadCounts[user.uid]) || 0;
          }
        });
        setUnreadMsgCount(totalUnread);
      }, () => {});
      return () => unsubscribe();
    } catch (e) {
      console.warn("Unread msg count error", e);
    }
  }, [user]);

  // Top Tabs Configuration (Facebook Style with Site Design System Color: Emerald Green #0B7A3B)
  const isFeedActive = location.pathname === '/adda' || location.pathname === '/discussion';
  const isFriendsActive = location.pathname === '/friends' || location.pathname === '/adda/friends';
  const isReelsActive = location.pathname === '/reels';

  // Clear feed unread count when visiting feed
  useEffect(() => {
    if (isFeedActive) {
      setUnreadPostsCount(0);
    }
  }, [isFeedActive]);

  // Clear reels unread count when visiting reels
  useEffect(() => {
    if (isReelsActive) {
      setUnreadReelsCount(0);
    }
  }, [isReelsActive]);

  const tabs = [
    {
      id: 'feed',
      label: 'ফিড',
      icon: Home,
      isActive: isFeedActive && !isNotifOpen,
      badge: unreadPostsCount > 0 ? (unreadPostsCount > 99 ? '99+' : unreadPostsCount) : null,
      action: () => {
        setIsNotifOpen(false);
        setUnreadPostsCount(0);
        if (onTabChange) onTabChange('feed');
        if (!isFeedActive) navigate('/adda');
      }
    },
    {
      id: 'friends',
      label: 'বন্ধুরা',
      icon: Users,
      isActive: isFriendsActive,
      badge: incomingRequestsCount > 0 ? (incomingRequestsCount > 99 ? '99+' : incomingRequestsCount) : null,
      action: () => {
        setIsNotifOpen(false);
        if (!user) {
          setIsAuthModalOpen(true);
        } else {
          if (onTabChange) onTabChange('friends');
          navigate('/friends');
        }
      }
    },
    {
      id: 'messages',
      label: 'মেসেঞ্জার',
      icon: MessageCircle,
      isActive: location.pathname === '/messages',
      badge: unreadMsgCount > 0 ? (unreadMsgCount > 99 ? '99+' : unreadMsgCount) : null,
      action: () => {
        setIsNotifOpen(false);
        navigate('/messages');
      }
    },
    {
      id: 'reels',
      label: 'ভিডিও',
      icon: Tv,
      isActive: isReelsActive,
      badge: unreadReelsCount > 0 ? (unreadReelsCount > 99 ? '99+' : unreadReelsCount) : null,
      action: () => {
        setIsNotifOpen(false);
        setUnreadReelsCount(0);
        navigate('/reels');
      }
    },
    {
      id: 'notifications',
      label: 'নোটিফিকেশন',
      icon: Bell,
      isActive: isNotifOpen || activeTab === 'notifications' || location.pathname === '/notifications',
      badge: notifUnreadCount > 0 ? (notifUnreadCount > 99 ? '99+' : notifUnreadCount) : null,
      action: () => {
        setIsNotifOpen(false);
        navigate('/notifications');
      }
    }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs select-none" id="adda-facebook-header">
      {/* ========================================================================= */}
      {/* 1. TOP ROW: BRAND LOGO & BACK (LEFT) & ACTION BUTTONS [🔍, ☰] (RIGHT)   */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-15 flex items-center justify-between gap-2">
        {/* Left: Back button + Brand Title & Subtitle in Site Design System Emerald Green (#0B7A3B) */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#0B7A3B] flex items-center justify-center transition active:scale-95 cursor-pointer border-0 shadow-2xs shrink-0"
            title="পেছনে ফিরে যান"
            aria-label="Back"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>

          <div className="flex flex-col justify-center min-w-0">
            <Link 
              to="/adda" 
              className="flex items-center gap-1.5 no-underline group focus:outline-none"
              aria-label="আড্ডা হোম"
            >
              <span className="text-[20px] sm:text-[23px] font-black tracking-tight text-[#0B7A3B] leading-tight group-hover:opacity-90 transition-opacity">
                আড্ডা
              </span>
            </Link>
          </div>
        </div>

        {/* Middle Search Input on Desktop */}
        <div className="hidden md:flex flex-1 max-w-xs mx-4">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 hover:bg-emerald-50/60 text-slate-500 rounded-full text-xs font-bold transition text-left cursor-pointer border border-transparent hover:border-emerald-200"
          >
            <Search size={15} className="text-slate-400" />
            <span className="truncate">আড্ডায় খুঁজুন (মানুষ, পোস্ট, রিল)...</span>
          </button>
        </div>

        {/* Right Action Buttons: [🔍] Search, [☰] Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Search Button [🔍] */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-emerald-50 active:scale-95 text-slate-800 hover:text-[#0B7A3B] flex items-center justify-center transition cursor-pointer border-0 shadow-2xs"
            title="অনুসন্ধান"
            aria-label="Search"
          >
            <Search size={19} strokeWidth={2.2} />
          </button>

          {/* Menu Button [☰] */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-emerald-50 active:scale-95 text-slate-800 hover:text-[#0B7A3B] flex items-center justify-center transition cursor-pointer border-0 shadow-2xs"
            title="মেনু ও সেবা ড্রয়ার"
            aria-label="Menu"
          >
            <Menu size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SECOND ROW: TOP NAVIGATION TABS (HOME, FRIENDS, MSGS, REELS, BELL, MKT) */}
      {/* ========================================================================= */}
      <div className="border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-1 flex items-center justify-around h-11 sm:h-12">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.isActive;

            return (
              <button
                key={tab.id}
                onClick={tab.action}
                className="flex-1 flex flex-col items-center justify-center h-full relative cursor-pointer group select-none min-h-[44px] transition-colors border-0 bg-transparent"
                title={tab.label}
                aria-label={tab.label}
              >
                {/* Active Indicator Underline (Facebook Blue #1877F2) */}
                {active && (
                  <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-[#1877F2] rounded-t-full shadow-xs" />
                )}

                <div className="relative flex items-center justify-center">
                  <Icon 
                    size={22} 
                    strokeWidth={active ? 2.5 : 2} 
                    className={`transition-all group-active:scale-90 ${
                      active ? 'text-[#1877F2]' : 'text-slate-500 group-hover:text-slate-800'
                    }`}
                  />

                  {/* Red Notification Badge */}
                  {tab.badge && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 bg-[#E11D2E] text-white text-[9.5px] font-black rounded-full flex items-center justify-center border-2 border-white leading-none shadow-xs">
                      {tab.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Modals */}
      {isSearchOpen && (
        <AddaSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          currentUserId={user?.uid}
        />
      )}

      {isNotifOpen && (
        <NotificationPanel
          isOpen={isNotifOpen}
          onClose={() => setIsNotifOpen(false)}
        />
      )}

      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

      {/* Citizen Sidebar Drawer */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNavigate={(path) => {
          setIsSidebarOpen(false);
          if (path === 'home') {
            navigate('/');
          } else if (path.startsWith('/')) {
            navigate(path);
          } else {
            navigate(`/${path}`);
          }
        }}
        activeItem="/adda"
      />
    </header>
  );
};

export default AddaFacebookHeader;
