import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send, AlertTriangle, MessageSquare, ArrowLeft, Loader2, CloudOff, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { addFeedback, addComplaint } from '../../api';
import { indexedDbQueueService } from '../../services/indexedDbQueueService';
import { OfflineQueueStatusBanner } from '../common/OfflineQueueStatusBanner';

interface FeedbackReportFormProps {
  onBack: () => void;
}

export const FeedbackReportForm: React.FC<FeedbackReportFormProps> = ({ onBack }) => {
  const { user, userProfile } = useAuth();
  const [type, setType] = useState<'feedback' | 'complaint'>('feedback');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isOfflineQueued, setIsOfflineQueued] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const isDeviceOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    const feedbackPayload = {
      name: userProfile?.name || 'Unknown',
      phone: userProfile?.phone || '',
      rating,
      message: message.trim(),
      userId: userProfile?.uid || user?.uid || undefined,
      createdAt: new Date().toISOString()
    };

    const complaintPayload = {
      title: title.trim(),
      complainantName: userProfile?.name || 'Unknown',
      complainantPhone: userProfile?.phone || '',
      category: 'General',
      unionName: userProfile?.union || 'Banerswar',
      description: message.trim(),
      status: 'Pending' as const,
      userId: userProfile?.uid || user?.uid || undefined,
      createdAt: new Date().toISOString()
    };

    if (!isDeviceOnline) {
      // Offline mode: queue in IndexedDB
      try {
        if (type === 'feedback') {
          await indexedDbQueueService.enqueue('feedback', 'feedbacks', feedbackPayload, {
            requiresAuth: false,
            isAnonymous: !userProfile
          });
        } else {
          await indexedDbQueueService.enqueue('complaint', 'complaints', complaintPayload, {
            requiresAuth: true,
            isAnonymous: false
          });
        }
        setIsOfflineQueued(true);
        setSuccess(true);
      } catch (err: any) {
        setErrorMessage(err?.message || 'অফলাইনে সংরক্ষণ করতে ব্যর্থ হয়েছে।');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Online mode: attempt direct Firestore submission
    try {
      if (type === 'feedback') {
        await addFeedback(feedbackPayload);
      } else {
        await addComplaint(complaintPayload);
      }
      setIsOfflineQueued(false);
      setSuccess(true);
    } catch (err: any) {
      console.warn('[FeedbackReportForm] Direct submission failed, attempting offline fallback:', err);
      // Fallback to offline queue on network failure
      try {
        if (type === 'feedback') {
          await indexedDbQueueService.enqueue('feedback', 'feedbacks', feedbackPayload, {
            requiresAuth: false,
            isAnonymous: !userProfile
          });
        } else {
          await indexedDbQueueService.enqueue('complaint', 'complaints', complaintPayload, {
            requiresAuth: true,
            isAnonymous: false
          });
        }
        setIsOfflineQueued(true);
        setSuccess(true);
      } catch (fallbackErr: any) {
        setErrorMessage(fallbackErr?.message || 'সার্ভারে বা অফলাইনে জমা দিতে সমস্যা হয়েছে।');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 text-center bg-white rounded-[40px] shadow-sm border border-emerald-100 space-y-4">
        {isOfflineQueued ? (
          <>
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <CloudOff size={32} />
            </div>
            <h3 className="text-xl font-black text-amber-950 mb-1">অফলাইনে সংরক্ষিত হয়েছে!</h3>
            <p className="text-sm font-bold text-gray-600 leading-relaxed max-w-sm mx-auto">
              ইন্টারনেট সংযোগ না থাকায় বার্তাটি স্থানীয় ডিভাইসে সুরক্ষিতভাবে সংরক্ষিত আছে। ইন্টারনেট ফিরে এলে স্বয়ংক্রিয়ভাবে জমা হবে।
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Send size={32} />
            </div>
            <h3 className="text-xl font-black text-emerald-950 mb-1">ধন্যবাদ!</h3>
            <p className="text-sm font-bold text-gray-500 max-w-sm mx-auto">
              আপনার বার্তাটি সফলভাবে সার্ভারে জমা হয়েছে।
            </p>
          </>
        )}
        <button onClick={onBack} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs hover:bg-emerald-700 transition">
          ঠিক আছে
        </button>
      </div>
    );
  }

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6"
    >
      <OfflineQueueStatusBanner typeFilter={type} />

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={() => setType('feedback')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${type === 'feedback' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'}`}>মতামত</button>
        <button type="button" onClick={() => setType('complaint')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${type === 'complaint' ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-500'}`}>অভিযোগ</button>
      </div>

      {type === 'complaint' && (
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">অভিযোগের বিষয়</label>
          <input required value={title || ""} onChange={e => setTitle(e.target.value)} className="w-full mt-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm" placeholder="বিষয় লিখুন" />
        </div>
      )}

      <div>
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{type === 'feedback' ? 'মতামত' : 'বিস্তারিত বিবরণ'}</label>
        <textarea required value={message || ""} onChange={e => setMessage(e.target.value)} className="w-full mt-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm h-32" placeholder="আপনার বার্তাটি লিখুন..." />
      </div>

      {type === 'feedback' && (
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">রেটিং (১-৫)</label>
          <div className="flex gap-2 mt-2">
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} type="button" onClick={() => setRating(i)} className={`w-10 h-10 rounded-full font-black text-sm ${rating >= i ? 'bg-amber-400 text-white' : 'bg-gray-100'}`}>
                {i}
              </button>
            ))}
          </div>
        </div>
      )}

      <button disabled={loading} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-200 flex items-center justify-center gap-2">
        {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />} {loading ? 'পাঠানো হচ্ছে...' : 'পাঠান'}
      </button>
    </motion.form>
  );
};
