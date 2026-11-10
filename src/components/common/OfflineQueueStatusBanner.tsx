import React, { useEffect, useState } from 'react';
import { CloudOff, RefreshCw, AlertCircle, Trash2, ShieldAlert, Check, X } from 'lucide-react';
import { auth } from '../../firebase';
import { indexedDbQueueService, OfflineSubmissionItem } from '../../services/indexedDbQueueService';

interface OfflineQueueStatusBannerProps {
  typeFilter?: 'feedback' | 'complaint' | 'correction';
}

export const OfflineQueueStatusBanner: React.FC<OfflineQueueStatusBannerProps> = ({ typeFilter }) => {
  const [items, setItems] = useState<OfflineSubmissionItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [confirmingDiscardId, setConfirmingDiscardId] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      const currentUid = auth.currentUser?.uid;
      // F-C1-01: User Queue Isolation — only load items belonging to current user or anonymous
      const userSubmissions = await indexedDbQueueService.getUserSubmissions(currentUid);
      const filtered = typeFilter ? userSubmissions.filter((i) => i.type === typeFilter) : userSubmissions;
      setItems(filtered);
    } catch (e) {
      console.warn('[OfflineQueueStatusBanner] Error loading queue items:', e);
    }
  };

  useEffect(() => {
    loadItems();
    const handleUpdate = () => loadItems();
    window.addEventListener('puthia_offline_queue_updated', handleUpdate);

    // Also listen to auth changes to immediately isolate user items on login/logout
    const unsubscribeAuth = auth.onAuthStateChanged(() => {
      loadItems();
    });

    return () => {
      window.removeEventListener('puthia_offline_queue_updated', handleUpdate);
      unsubscribeAuth();
    };
  }, [typeFilter]);

  if (items.length === 0) {
    return null;
  }

  const pendingItems = items.filter((i) => i.status === 'pending' || i.status === 'syncing');
  const failedItems = items.filter((i) => i.status === 'failed');

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await indexedDbQueueService.processQueue({ forceRetry: true });
    } finally {
      setIsSyncing(false);
      loadItems();
    }
  };

  // F-C1-06: Discard Confirmation handler
  const handleConfirmDiscard = async (id: string) => {
    await indexedDbQueueService.remove(id);
    setConfirmingDiscardId(null);
    loadItems();
  };

  const handleCancelDiscard = () => {
    setConfirmingDiscardId(null);
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs text-amber-900 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CloudOff className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="font-black">
            অফলাইন কিউ:{' '}
            <span className="font-bold">
              {pendingItems.length > 0 && `${pendingItems.length}টি পেন্ডিং `}
              {failedItems.length > 0 && `(${failedItems.length}টি ব্যর্থ)`}
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={handleManualSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-1 rounded-xl bg-amber-600 px-2.5 py-1 text-[11px] font-black text-white hover:bg-amber-700 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'সিঙ্ক হচ্ছে...' : 'এখনই সিঙ্ক'}
        </button>
      </div>

      <p className="text-[11px] text-amber-800 leading-snug">
        ইন্টারনেট না থাকায় আপনার বার্তা স্থানীয় ডিভাইসে সংরক্ষিত আছে। ইন্টারনেট সংযোগ নিশ্চিত হলে স্বয়ংক্রিয়ভাবে সার্ভারে জমা হবে।
      </p>

      {/* Unencrypted Local Storage Privacy Notice */}
      <div className="flex items-start gap-1.5 rounded-xl bg-amber-100/70 p-2 text-[10px] text-amber-900 border border-amber-200/60">
        <ShieldAlert className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
        <span>
          <strong>গোপনীয়তা সতর্কতা:</strong> অফলাইন ড্রাফট ব্রাউজারের লোকাল স্টোরেজে সংরক্ষিত থাকে (ডিভাইস লেভেলে এনক্রিপ্টেড নয়)। শেয়ার্ড ডিভাইসে অন্য কাউকে ব্যবহারের পূর্বে ড্রাফট মুছে ফেলা বা সিঙ্ক করা নিশ্চিত করুন।
        </span>
      </div>

      {failedItems.length > 0 && (
        <div className="space-y-1.5 pt-1.5 border-t border-amber-200/80">
          <div className="text-[11px] font-black text-rose-700 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>জমা দিতে ব্যর্থ হওয়া এন্ট্রি:</span>
          </div>
          {failedItems.map((f) => (
            <div
              key={f.id}
              className="rounded-xl bg-white/90 p-2 border border-amber-200 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-[11px]">
                  <span className="font-black text-slate-800">
                    {f.type === 'complaint' ? 'অভিযোগ' : f.type === 'correction' ? 'সংশোধনী' : 'মতামত'}:
                  </span>{' '}
                  <span className="text-slate-600">
                    {f.lastErrorMessage || 'পুনরায় চেষ্টার প্রয়োজন'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => indexedDbQueueService.retryItem(f.id)}
                    className="rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white hover:bg-emerald-700"
                  >
                    আবার চেষ্টা
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDiscardId(f.id)}
                    className="rounded-lg bg-rose-100 p-1 text-rose-700 hover:bg-rose-200"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* F-C1-06: Inline Discard Confirmation Dialog */}
              {confirmingDiscardId === f.id && (
                <div className="flex items-center justify-between rounded-lg bg-rose-50 p-1.5 border border-rose-200 text-[10px] text-rose-900 animate-fadeIn">
                  <span className="font-bold">এই ড্রাফটটি স্থায়ীভাবে মুছে ফেলতে চান?</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleConfirmDiscard(f.id)}
                      className="inline-flex items-center gap-0.5 rounded-md bg-rose-600 px-2 py-0.5 font-black text-white hover:bg-rose-700"
                    >
                      <Check className="h-2.5 w-2.5" /> হ্যাঁ, মুছুন
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelDiscard}
                      className="inline-flex items-center gap-0.5 rounded-md bg-slate-200 px-2 py-0.5 font-bold text-slate-700 hover:bg-slate-300"
                    >
                      <X className="h-2.5 w-2.5" /> বাতিল
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
