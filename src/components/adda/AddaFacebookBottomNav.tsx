import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Users, 
  Tv, 
  MessageCircle, 
  Bell, 
  Menu,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationPanel } from '../user/NotificationPanel';
import { AuthModal } from '../AuthModal';
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

interface AddaFacebookBottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const AddaFacebookBottomNav: React.FC<AddaFacebookBottomNavProps> = ({
  activeTab = 'feed',
  onTabChange
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile } = useAuth();
  const { unreadCount: notifUnreadCount } = useNotifications();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  const toBengaliNumber = (num: number | string): string => {
    if (num === null || num === undefined) return '';
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num
      .toString()
      .replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
  };

  // Unread messages count
  useEffect(() => {
    if (!user) {
      setUnreadMsgCount(0);
      return;
    }

    let unreadFromChats = 0;
    let unreadFromConversations = 0;
    let unreadFromNotifications = 0;

    const updateTotal = () => {
      setUnreadMsgCount(unreadFromChats + unreadFromConversations + unreadFromNotifications);
    };

    // 1. Listen to 'chats' collection
    let unsub1 = () => {};
    try {
      const q1 = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid)
      );
      unsub1 = onSnapshot(q1, (snapshot) => {
        let total = 0;
        snapshot.docs.forEach(d => {
          const data = d.data();
          if (data.unreadCount) {
            if (typeof data.unreadCount === 'object') {
              total += Number(data.unreadCount[user.uid] || data.unreadCount['guest_or_user'] || 0);
            } else if (typeof data.unreadCount === 'number' && data.lastSenderId !== user.uid) {
              total += data.unreadCount;
            }
          } else if (data.unread && typeof data.unread === 'object') {
            total += Number(data.unread[user.uid] || 0);
          }
        });
        unreadFromChats = total;
        updateTotal();
      }, () => {});
    } catch (e) {
      console.warn("Unread chats error", e);
    }

    // 2. Listen to 'conversations' collection
    let unsub2 = () => {};
    try {
      const q2 = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', user.uid)
      );
      unsub2 = onSnapshot(q2, (snapshot) => {
        let total = 0;
        snapshot.docs.forEach(d => {
          const data = d.data();
          if (data.unreadCount) {
            if (typeof data.unreadCount === 'object') {
              total += Number(data.unreadCount[user.uid] || data.unreadCount['guest_or_user'] || 0);
            } else if (typeof data.unreadCount === 'number' && data.lastSenderId !== user.uid) {
              total += data.unreadCount;
            }
          } else if (data.unread && typeof data.unread === 'object') {
            total += Number(data.unread[user.uid] || 0);
          }
        });
        unreadFromConversations = total;
        updateTotal();
      }, () => {});
    } catch (e) {
      console.warn("Unread conversations error", e);
    }

    // 3. Listen to message-type notifications if any
    let unsub3 = () => {};
    try {
      const q3 = query(
        collection(db, 'notifications'),
        where('recipientId', '==', user.uid),
        where('read', '==', false)
      );
      unsub3 = onSnapshot(q3, (snapshot) => {
        let count = 0;
        snapshot.docs.forEach(d => {
          const data = d.data();
          if (['message', 'chat', 'chat_message', 'direct_message'].includes(data.type)) {
            count++;
          }
        });
        unreadFromNotifications = count;
        updateTotal();
      }, () => {});
    } catch (e) {
      console.warn("Unread msg notifs error", e);
    }

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [user]);

  const rawAvatar = userProfile?.photoURL || (userProfile as any)?.avatarUrl || user?.photoURL || '';
  const userAvatar = (rawAvatar && !rawAvatar.includes('dicebear') && !rawAvatar.includes('avataaars') && !rawAvatar.includes('unsplash')) ? rawAvatar : '';
  const userInitial = (userProfile?.name?.trim()?.charAt(0) || user?.displayName?.trim()?.charAt(0) || user?.email?.trim()?.charAt(0) || 'প').toUpperCase();

  const navItems = [
    {
      id: 'back',
      label: 'পেছনে',
      icon: ArrowLeft,
      action: () => {
        if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
          navigate(-1);
        } else {
          navigate('/');
        }
      },
      isActive: false
    },
    {
      id: 'feed',
      label: 'ফিড',
      icon: Home,
      action: () => {
        if (onTabChange) onTabChange('feed');
        navigate('/adda');
      },
      isActive: location.pathname === '/adda' || location.pathname === '/discussion'
    },
    {
      id: 'friends',
      label: 'বন্ধুরা',
      icon: Users,
      action: () => {
        if (!user) {
          setIsAuthModalOpen(true);
        } else {
          navigate('/friends');
        }
      },
      isActive: location.pathname === '/friends' || location.pathname === '/adda/friends'
    },
    {
      id: 'reels',
      label: 'ভিডিও',
      icon: WatchVideoIcon,
      action: () => navigate('/reels'),
      isActive: location.pathname === '/reels'
    },
    {
      id: 'notifications',
      label: 'নোটিফিকেশন',
      icon: Bell,
      badge: notifUnreadCount,
      action: () => {
        navigate('/notifications');
      },
      isActive: isNotifOpen || location.pathname === '/notifications'
    },
    {
      id: 'profile',
      label: 'প্রোফাইল',
      isAvatar: true,
      action: () => {
        if (!user) {
          setIsAuthModalOpen(true);
        } else {
          navigate(`/profile/${user.uid}`);
        }
      },
      isActive: location.pathname.startsWith('/profile')
    }
  ];

  return (
    <>
      <nav 
        className="fixed bottom-0 left-0 right-0 w-full h-[58px] pb-[env(safe-area-inset-bottom,0px)] z-40 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] px-1 flex items-center justify-around"
        id="adda-facebook-bottom-navigation"
      >
        <div className="flex-1 flex items-center justify-around h-full max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.isActive;

            return (
              <button
                key={item.id}
                onClick={item.action}
                className="flex-1 flex flex-col items-center justify-center h-full px-0.5 relative cursor-pointer focus:outline-none select-none min-h-[44px] transition-colors border-0 bg-transparent"
                title={item.label}
              >
                {/* Active Indicator Top Line */}
                {active && (
                  <div className="absolute top-0 left-2 right-2 h-[3px] bg-emerald-600 rounded-b-full" />
                )}

                <div className="relative flex items-center justify-center">
                  {item.isAvatar ? (
                    <div className={`w-7 h-7 rounded-full overflow-hidden border flex items-center justify-center ${active ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-slate-300'}`}>
                      {userAvatar ? (
                        <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#0B7A3B] text-white flex items-center justify-center text-[10px] font-bold select-none">
                          {userInitial}
                        </div>
                      )}
                    </div>
                  ) : Icon ? (
                    <Icon 
                      size={22} 
                      strokeWidth={active ? 2.5 : 2} 
                      className={`transition-transform duration-150 ${active ? 'text-emerald-700 scale-105' : 'text-slate-500'}`} 
                    />
                  ) : null}

                  {/* Badge */}
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pulse leading-none">
                      {toBengaliNumber(item.badge! > 99 ? '99+' : item.badge!)}
                    </span>
                  )}
                </div>

                <span className={`text-[10px] tracking-tight mt-0.5 ${active ? 'text-emerald-700 font-black' : 'text-slate-500 font-semibold'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Global Modals */}
      {isNotifOpen && (
        <NotificationPanel
          isOpen={isNotifOpen}
          onClose={() => setIsNotifOpen(false)}
          mode="modal"
        />
      )}

      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}
    </>
  );
};

export default AddaFacebookBottomNav;
