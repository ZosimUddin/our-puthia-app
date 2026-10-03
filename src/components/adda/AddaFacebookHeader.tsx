import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MessageCircle, 
  Users, 
  Menu,
  Home,
  Tv,
  Bell,
  ArrowLeft,
  MoreVertical,
  MoreHorizontal,
  Plus
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

// Modern Facebook Watch / Video Icon
const WatchVideoIcon: React.FC<{ size?: number; className?: string; strokeWidth?: number }> = ({ 
  size = 22, 
  className = "", 
  strokeWidth = 2 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="20" height="15" x="2" y="4.5" rx="3.5" />
    <polygon points="10 8.5 15.5 12 10 15.5 10 8.5" fill="currentColor" stroke="none" />
  </svg>
);

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
  const isProfileActive = location.pathname.startsWith('/profile') || activeTab === 'profile';

  const handleProfileClick = () => {
    setIsNotifOpen(false);
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      if (onTabChange) onTabChange('profile');
      navigate(`/profile/${user.uid}`);
    }
  };

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
      label: 'হোম',
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
      label: 'বন্ধু',
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
      id: 'reels',
      label: 'ভিডিও',
      icon: WatchVideoIcon,
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
    <>
      {/* ========================================================================= */}
      {/* 1. TOP ROW: VIBRANT GRADIENT HEADER (GREEN THEME)                        */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#0B7A3B] via-[#059669] to-[#10B981] shadow-md select-none" id="adda-facebook-header">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-4 h-15 flex items-center justify-between">
          {/* Left: 'প' Logo & 'আড্ডা' Title */}
          <div className="flex items-center gap-2.5">
            <Link to="/adda" className="flex items-center gap-2.5 no-underline group">
              {/* Logo: White square with green 'প' and leaf */}
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center relative shadow-sm shrink-0 group-hover:scale-105 transition">
                <span className="text-[#0B7A3B] text-xl font-black">প</span>
                <div className="absolute -top-1 -right-1 w-4 h-4 text-[#82C91E]">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8.13,20C11,20 13.85,18.08 15,15C16.59,10.72 19.97,8.53 22,7C16.73,7 17,8 17,8Z" />
                  </svg>
                </div>
              </div>
              
              <span className="text-2xl font-black text-white tracking-tight">আড্ডা</span>
            </Link>
          </div>

          {/* Right: Action Buttons (Search, Messages, Hamburger Menu) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* 1. Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition active:scale-95 cursor-pointer border-0 shadow-2xs"
              title="অনুসন্ধান করুন"
              aria-label="Search"
            >
              <Search size={19} strokeWidth={2.5} />
            </button>

            {/* 3. Messages / Chat Button */}
            <button
              type="button"
              onClick={() => navigate('/messages')}
              className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition active:scale-95 cursor-pointer border-0 shadow-2xs"
              title="মেসেঞ্জার ও মেসেজ"
              aria-label="Messages"
            >
              <div className="relative flex items-center justify-center">
                <MessageCircle size={19} strokeWidth={2.5} />
                {unreadMsgCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">
                    {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                  </span>
                )}
              </div>
            </button>

            {/* 3. Hamburger / Menu Button (Navigates directly to Settings Page matching Screenshot 2) */}
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition active:scale-95 cursor-pointer border-0 shadow-2xs"
              title="সেটিংস ও অ্যাকাউন্ট"
              aria-label="Settings"
            >
              <Menu size={21} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. FIXED BOTTOM NAVIGATION BAR (Exact previous top style without text)    */}
      {/* ========================================================================= */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-safe select-none"
        aria-label="Bottom Navigation"
      >
        <div className="max-w-md sm:max-w-lg mx-auto px-2 flex items-center justify-around h-14">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.isActive;

            return (
              <button
                key={tab.id}
                onClick={tab.action}
                className={`flex-1 flex items-center justify-center h-10 mx-1 rounded-xl relative transition-all duration-300 border-0 cursor-pointer ${
                  active 
                    ? 'bg-gradient-to-r from-[#0B7A3B] to-[#059669] text-white shadow-md' 
                    : 'text-slate-500 hover:bg-slate-50 bg-transparent'
                }`}
                title={tab.label}
                aria-label={tab.label}
              >
                <div className="relative flex items-center justify-center">
                  <Icon 
                    size={22} 
                    strokeWidth={active ? 2.5 : 2} 
                  />
                  
                  {/* Badge */}
                  {tab.badge && !active && (
                    <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white leading-none">
                      {tab.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          
          {/* 5th Tab: Original Profile Tab (Direct Profile System Navigation) */}
          <button
            onClick={handleProfileClick}
            className={`flex-1 flex items-center justify-center h-10 mx-1 rounded-xl relative transition-all duration-300 border-0 cursor-pointer ${
              isProfileActive 
                ? 'bg-gradient-to-r from-[#0B7A3B] to-[#059669] text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50 bg-transparent'
            }`}
            title="আমার প্রোফাইল"
            aria-label="আমার প্রোফাইল"
          >
            <div className="relative flex items-center justify-center">
              {userProfile?.photoURL ? (
                <img 
                  src={userProfile.photoURL} 
                  alt="Profile" 
                  className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full object-cover border-2 ${
                    isProfileActive ? 'border-white' : 'border-slate-200'
                  }`} 
                />
              ) : (
                <div className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                  isProfileActive ? 'bg-white text-[#0B7A3B]' : 'bg-[#0B7A3B] text-white'
                }`}>
                  {userProfile?.name?.charAt(0) || user?.email?.charAt(0) || 'প'}
                </div>
              )}
            </div>
          </button>
        </div>
      </nav>

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
    </>
  );
};

export default AddaFacebookHeader;
