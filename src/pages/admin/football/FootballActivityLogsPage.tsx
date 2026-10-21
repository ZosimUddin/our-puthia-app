import React, { useState, useEffect } from 'react';
import { History, Shield, User, Clock, Search } from 'lucide-react';
import { db } from '../../../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { ACTIVITY_LOGS_COL } from '../../../services/footballService';
import { FootballActivityLog } from '../../../types/football';

export const FootballActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<FootballActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, ACTIVITY_LOGS_COL), orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as FootballActivityLog)));
    } catch (err) {
      console.warn('Error loading football activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <History className="text-slate-700" size={20} />
          <span>ফুটবল সিস্টেম অ্যাক্টিভিটি লগ (Audit Trail & Activity Logs)</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          সকল টুর্নামেন্ট সৃষ্টি, ম্যাচ সময়সূচি পরিবর্তন, স্কোর আপডেট এবং ব্যানারের প্রশাসনিক ইতিহাস।
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {logs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-bold">
              এখনো কোনো প্রশাসনিক কার্যক্রম নথিভুক্ত হয়নি।
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black uppercase">
                      {log.action}
                    </span>
                    <span className="text-xs font-black text-slate-900">{log.entityName}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{log.details}</p>
                  <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                    <User size={11} />
                    <span>{log.actorName} ({log.actorEmail})</span>
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                  {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString('bn-BD') : 'সম্প্রতি'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
