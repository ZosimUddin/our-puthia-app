import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Radio, ArrowLeft, Trophy } from 'lucide-react';
import { FootballMatch } from '../../types/football';
import { subscribeMatches } from '../../services/footballService';
import SEO from '../../components/SEO';

export const FootballPublicMatches: React.FC = () => {
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'live' | 'full_time'>('all');

  useEffect(() => {
    const unsub = subscribeMatches(setMatches);
    return () => unsub();
  }, []);

  const filtered = matches.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'live') return m.status === 'live' || m.status === 'half_time';
    return m.status === filter;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SEO
        title="ফুটবল ম্যাচ সময়সূচি ও ফিক্সচার — আমাদের পুঠিয়া"
        description="সকল ফুটবল টুর্নামেন্টের ম্যাচের তারিখ, সময়, ভেন্যু ও ফলাফল দেখুন।"
      />

      <div className="bg-[#0B7A3B] text-white py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-2">
          <Link to="/football" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-100 hover:text-white">
            <ArrowLeft size={14} />
            <span>ফুটবল পোর্টালে ফিরুন</span>
          </Link>
          <h1 className="text-2xl font-black">ম্যাচ শিডিউল ও সময়সূচি (Fixtures)</h1>
          <p className="text-xs text-emerald-100">পুঠিয়া অঞ্চলের সকল টুর্নামেন্টের খেলার দিনক্ষণ ও মাঠের বিবরণ।</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* Filter buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'সব ম্যাচ' },
            { id: 'live', label: '🔴 লাইভ ম্যাচ' },
            { id: 'scheduled', label: 'আসন্ন ম্যাচসমূহ' },
            { id: 'full_time', label: 'সমাপ্ত ফলাফল' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                filter === f.id
                  ? 'bg-[#0B7A3B] text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Matches list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-dashed">
              কোনো ম্যাচ পাওয়া যায়নি।
            </div>
          ) : (
            filtered.map(m => (
              <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] font-black">
                  <span className="text-[#0B7A3B]">{m.matchNumberText || 'ম্যাচ'} • {m.groupOrRound}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    m.status === 'live' ? 'bg-rose-100 text-rose-700 font-black animate-pulse' :
                    m.status === 'full_time' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-800'
                  }`}>
                    {m.status === 'live' ? '🔴 লাইভ' : m.status === 'full_time' ? 'সমাপ্ত' : 'নির্ধারিত'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl">
                  <span className="text-xs sm:text-sm font-black text-slate-900 truncate flex-1">{m.homeTeamName}</span>
                  <span className="px-3 py-1 bg-slate-900 text-white rounded-lg font-black text-xs sm:text-sm">
                    {m.homeScore} - {m.awayScore}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 truncate flex-1 text-right">{m.awayTeamName}</span>
                </div>

                <div className="text-[11px] text-slate-500 font-bold space-y-1">
                  <p className="flex items-center gap-1.5">
                    <Clock size={12} className="text-emerald-700" />
                    <span>{m.matchDate} ({m.dayOfWeekBangla}) • {m.kickoffTime}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-rose-500" />
                    <span className="truncate">{m.venueName}</span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
