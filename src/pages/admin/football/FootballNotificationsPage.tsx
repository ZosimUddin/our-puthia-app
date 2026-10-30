import React, { useState } from 'react';
import { Bell, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { notificationService } from '../../../services/notificationService';

export const FootballNotificationsPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusText, setStatusText] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    try {
      setIsSending(true);
      await notificationService.broadcastAdminAnnouncement({
        adminId: 'super_admin',
        adminName: 'Super Admin',
        title,
        message,
        priority: 'high',
        targetAudience: 'all',
        reason: 'Football tournament broadcast'
      });
      setStatusText('নোটিফিকেশন সফলভাবে পাঠানো হয়েছে!');
      setTitle('');
      setMessage('');
      setTimeout(() => setStatusText(''), 4000);
    } catch (err) {
      console.error('Error sending notification:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Bell className="text-indigo-600" size={20} />
          <span>ফুটবল নোটিফিকেশন হাব (Tournament Notification Center)</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium">টুর্নামেন্টের গুরুত্বপূর্ণ ম্যাচ ও লাইভ স্কোর আপডেট সকল ব্যবহারকারীর কাছে পাঠান।</p>
      </div>

      {statusText && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-black text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{statusText}</span>
        </div>
      )}

      <form onSubmit={handleSend} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-black text-slate-700">নোটিফিকেশনের শিরোনাম *</label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="উদা: আজ মহিপাড়া টুর্নামেন্টের জমজমাট দ্বিতীয় ম্যাচ!"
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-black text-slate-700">বিস্তারিত বার্তা *</label>
          <textarea
            rows={4}
            required
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="নিউ ঈগল ফুটবল একাডেমি বনাম কিশোর কেলি ফুটবল একাডেমি। বিকাল ৩টায় মহিপাড়া উচ্চ বিদ্যালয় মাঠে খেলা শুরু হবে।"
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSending}
            className="px-5 py-2.5 bg-[#0B7A3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Send size={14} />
            <span>{isSending ? 'পাঠানো হচ্ছে...' : 'ব্রডকাস্ট নোটিফিকেশন পাঠান'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
