import React, { useState, useEffect } from 'react';
import { BarChart3, Trophy, Users, Shield, TrendingUp, Award } from 'lucide-react';
import {
  subscribeTournaments,
  subscribeMatches,
  subscribePlayers,
  subscribeClubs
} from '../../../services/footballService';
import { FootballMatch, FootballPlayer } from '../../../types/football';

export const FootballReportsPage: React.FC = () => {
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [players, setPlayers] = useState<FootballPlayer[]>([]);

  useEffect(() => {
    const unsubM = subscribeMatches(setMatches);
    const unsubP = subscribePlayers(setPlayers);
    return () => {
      unsubM();
      unsubP();
    };
  }, []);

  const totalGoals = matches.reduce((acc, m) => acc + (m.homeScore || 0) + (m.awayScore || 0), 0);
  const completedMatchesCount = matches.filter(m => m.status === 'full_time').length;
  const avgGoals = completedMatchesCount > 0 ? (totalGoals / completedMatchesCount).toFixed(1) : '0';

  const topScorers = [...players]
    .sort((a, b) => (b.totalGoals || 0) - (a.totalGoals || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <BarChart3 className="text-emerald-700" size={20} />
          <span>রিপোর্ট ও পরিসংখ্যান (Tournament Analytics & Insights)</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium">টুর্নামেন্টের গোল গড়, শীর্ষ গোলদাতা, কার্ড পরিসংখ্যান ও ক্লাব পারফরম্যান্স।</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500">মোট গোল সংখ্যা</span>
          <p className="text-3xl font-black text-slate-900">{totalGoals}</p>
          <p className="text-[11px] font-bold text-emerald-700">গড় {avgGoals} গোল প্রতি ম্যাচে</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500">অনুষ্ঠিত ম্যাচ</span>
          <p className="text-3xl font-black text-slate-900">{completedMatchesCount}</p>
          <p className="text-[11px] font-bold text-blue-700">মোট {matches.length}টি নির্ধারিত</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500">শীর্ষ গোলদাতা</span>
          <p className="text-3xl font-black text-slate-900">{topScorers[0]?.name || 'তথ্য নেই'}</p>
          <p className="text-[11px] font-bold text-purple-700">{topScorers[0]?.totalGoals || 0}টি গোল</p>
        </div>
      </div>

      {/* Top Scorers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Award size={16} className="text-amber-500" />
          <span>শীর্ষ গোলদাতা তালিকা (Golden Boot Leaderboard)</span>
        </h3>

        <div className="divide-y divide-slate-100 text-xs font-bold">
          {topScorers.length === 0 ? (
            <p className="py-6 text-center text-slate-400">কোনো খেলোয়াড়ের গোলের তথ্য নথিভুক্ত হয়নি</p>
          ) : (
            topScorers.map((p, idx) => (
              <div key={p.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-black">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-black text-slate-900">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">জার্সি #{p.jerseyNumber}</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-amber-50 rounded-xl text-amber-800 font-black border border-amber-200">
                  {p.totalGoals || 0} গোল
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
