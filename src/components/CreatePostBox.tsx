import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { Image as ImageIcon, Video, HardDrive, Sparkles, Smile } from 'lucide-react';
import { MyMediaLibraryModal } from './adda/MyMediaLibraryModal';

interface CreatePostBoxProps {
  onOpenCreateModal: (action?: 'photo' | 'video' | 'general') => void;
  onOpenMediaLibrary?: () => void;
}

export function CreatePostBox({ onOpenCreateModal, onOpenMediaLibrary }: CreatePostBoxProps) {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);

  const handleAvatarClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      navigate(`/profile/${user.uid}`);
    }
  };

  const handleClick = (action?: 'photo' | 'video' | 'general') => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    onOpenCreateModal(action);
  };

  const handleMediaClick = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (onOpenMediaLibrary) {
      onOpenMediaLibrary();
    } else {
      setShowMediaModal(true);
    }
  };

  const userAvatar = userProfile?.photoURL || user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'guest'}`;

  return (
    <div className="bg-white rounded-none sm:rounded-2xl border-y sm:border border-slate-200/80 p-3 sm:p-3.5 mb-2 sm:mb-3.5 shadow-2xs">
      {/* Facebook Home Style Single Row: Avatar + Input Pill + Photo Shortcut */}
      <div className="flex gap-2.5 sm:gap-3 items-center">
        <button 
          onClick={handleAvatarClick}
          className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 cursor-pointer hover:ring-2 hover:ring-[#1877F2] active:scale-95 transition-all p-0"
          title={user ? 'আপনার প্রোফাইল দেখুন' : 'লগইন করুন'}
        >
          <img 
            src={userAvatar}
            alt={userProfile?.name || user?.displayName || "User"}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </button>
        <button 
          onClick={() => handleClick('general')}
          className="flex-grow text-left px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 rounded-full text-slate-600 text-xs sm:text-sm font-normal transition-all border-0 cursor-pointer"
        >
          {user ? `${(userProfile?.name || user.displayName || 'নাগরিক').split(' ')[0]}, আপনার মনে কি চলছে?` : 'আপনার মতামত শেয়ার করুন...'}
        </button>
        <button
          onClick={() => handleClick('photo')}
          title="ছবি / ভিডিও পোস্ট করুন"
          className="p-2 sm:px-3 sm:py-2 rounded-full hover:bg-emerald-50 text-emerald-600 flex items-center justify-center transition border-0 bg-transparent cursor-pointer flex-shrink-0"
        >
          <ImageIcon size={22} className="text-emerald-600" />
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


