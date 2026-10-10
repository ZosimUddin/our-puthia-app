import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { MyMediaLibraryModal } from './adda/MyMediaLibraryModal';
import { getCleanAvatar, getUserInitial } from '../utils/avatarUtils';

interface CreatePostBoxProps {
  onOpenCreateModal: (action?: 'photo' | 'video' | 'general' | 'color') => void;
  onOpenMediaLibrary?: () => void;
}

export function CreatePostBox({ onOpenCreateModal }: CreatePostBoxProps) {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);

  const handleAvatarClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      navigate(`/profile/${user.uid}`);
    }
  };

  const handleClick = (action?: 'photo' | 'video' | 'general' | 'color') => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    onOpenCreateModal(action);
  };

  // Determine avatar photo vs letter avatar using unified avatar resolver
  const userAvatar = getCleanAvatar(userProfile, user);

  useEffect(() => {
    setAvatarErr(false);
  }, [userAvatar, userProfile?.photoURL, user?.photoURL]);

  const rawName = userProfile?.name || user?.displayName || user?.email?.split('@')[0] || '';
  const initial = getUserInitial(userProfile, user, 'আ');

  const firstName = rawName.trim().split(/\s+/)[0] || 'নাগরিক';

  return (
    <div className="bg-white rounded-none sm:rounded-2xl border-y sm:border border-slate-200/80 p-3 sm:p-4 mb-2 sm:mb-3.5 shadow-2xs">
      {/* Top Row: Gradient Ring Avatar + Rounded Input */}
      <div className="flex gap-3 items-center">
        {/* Rainbow Story Ring Avatar */}
        <button 
          onClick={handleAvatarClick}
          className="p-[2.5px] bg-gradient-to-tr from-[#FF8A00] via-[#E52E71] via-[#9B51E0] to-[#0091FF] rounded-full shrink-0 shadow-xs cursor-pointer active:scale-95 transition-transform"
          title="প্রোফাইল দেখুন"
        >
          <div className="p-[1.5px] bg-white rounded-full">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-[#0091FF] text-white">
              {userAvatar && !avatarErr ? (
                <img 
                  key={`create-post-avatar-${userAvatar}`}
                  src={userAvatar}
                  alt={rawName || "User"}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarErr(true)}
                />
              ) : (
                <span className="font-black text-base select-none">{initial}</span>
              )}
            </div>
          </div>
        </button>

        {/* Input Trigger */}
        <button 
          onClick={() => handleClick('general')}
          className="flex-grow text-left px-5 py-2.5 bg-slate-50 hover:bg-slate-100/90 rounded-full text-slate-500 text-sm font-medium transition-all border border-slate-100 cursor-pointer shadow-2xs"
        >
          {user ? `কী ভাবছেন, ${firstName}?` : 'কী ভাবছেন?'}
        </button>
      </div>

      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      )}

      {showMediaModal && user && (
        <MyMediaLibraryModal
          userId={user.uid}
          userName={userProfile?.name || user.displayName || 'নাগরিক'}
          isOpen={showMediaModal}
          onClose={() => setShowMediaModal(false)}
        />
      )}
    </div>
  );
}
