import React, { useState, useEffect } from 'react';
import {
  Table,
  RefreshCw,
  Trophy,
  Shield,
  Sparkles,
  Info
} from 'lucide-react';
import { FootballStandings, FootballTournament } from '../../../types/football';
import {
  subscribeStandings,
  subscribeTournaments,
  recalculateStandings
} from '../../../services/footballService';

export const FootballStandingsPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<FootballTournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [standings, setStandings] = useState<FootballStandings | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => {
    const unsubTournaments = subscribeTournaments((tList) => {
      setTournaments(tList);
      if (tList.length > 0 && !selectedTournamentId) {
        setSelectedTournamentId(tList[0].id);
      }
    });

    return () => unsubTournaments();
  }, []);

  useEffect(() => {
    if (!selectedTournamentId) return;
    const unsubStandings = subscribeStandings(selectedTournamentId, setStandings);
    return () => unsubStandings();
  }, [selectedTournamentId]);

  const handleRecalculate = async () => {
    if (!selectedTournamentId) return;
    try {
      setIsRecalculating(true);
      await recalculateStandings(selectedTournamentId);
    } catch (err) {
      console.error('Recalculation error:', err);
    } finally {
      setIsRecalculating(false);
    }
  };

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Table className="text-emerald-700" size={20} />
            <span>পয়েন্ট টেবিল ও স্ট্যান্ডিংস (Tournament Standings)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            অনুমোদিত ফলাফল অনুযায়ী প্রতিটি দলের ম্যাচ, জয়, ড্র, পরাজয়, গোল ব্যবধান এবং মোট পয়েন্ট।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTournamentId}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
            className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none max-w-xs"
          >
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <button
            type="button"
            disabled={isRecalculating || !selectedTournamentId}
            onClick={handleRecalculate}
            className="px-4 py-2 bg-[#0B7A3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRecalculating ? 'animate-spin' : ''} />
            <span>{isRecalculating ? 'গণনা হচ্ছে...' : 'পুনর্গণনা করুন'}</span>
          </button>
        </div>
      </div>

      {/* Standings Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" />
            <h3 className="text-sm font-black text-slate-900">
              {selectedTournament?.name || 'ফুটবল টুর্নামেন্ট স্ট্যান্ডিংস'}
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            রুলস: জয় = {selectedTournament?.pointsForWin || 3} পয়েন্ট, ড্র = {selectedTournament?.pointsForDraw || 1} পয়েন্ট
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-600">
                <th className="py-3 px-4 w-12 text-center">অবস্থান</th>
                <th className="py-3 px-4">দল (Club/Team)</th>
                <th className="py-3 px-3 text-center">ম্যাচ (P)</th>
                <th className="py-3 px-3 text-center text-emerald-700">জয় (W)</th>
                <th className="py-3 px-3 text-center text-slate-500">ড্র (D)</th>
                <th className="py-3 px-3 text-center text-rose-600">হার (L)</th>
                <th className="py-3 px-3 text-center">দেওয়া গোল (GF)</th>
                <th className="py-3 px-3 text-center">খাওয়া গোল (GA)</th>
                <th className="py-3 px-3 text-center font-black">ব্যবধান (GD)</th>
                <th className="py-3 px-4 text-center font-black text-slate-900 bg-emerald-50/60">পয়েন্ট (PTS)</th>
                <th className="py-3 px-4 text-center">ফর্ম (Form)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
              {!standings || standings.rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    এখনো কোনো দলের পয়েন্ট হিসাব করা হয়নি। 'পুনর্গণনা করুন' বোতামে চাপ দিন।
                  </td>
                </tr>
              ) : (
                standings.rows.map((row, idx) => (
                  <tr key={row.teamId} className={`hover:bg-slate-50/70 transition-colors ${idx === 0 ? 'bg-amber-50/20' : ''}`}>
                    <td className="py-3 px-4 text-center font-black">
                      <span className={`w-6 h-6 rounded-lg inline-flex items-center justify-center text-xs ${
                        idx === 0 ? 'bg-amber-400 text-slate-950 shadow-2xs font-black' :
                        idx === 1 ? 'bg-slate-200 text-slate-700' :
                        idx === 2 ? 'bg-amber-100 text-amber-800' : 'text-slate-500'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900 flex items-center gap-2">
                      <Shield size={16} className="text-emerald-700 shrink-0" />
                      <span>{row.teamName}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-medium">{row.played}</td>
                    <td className="py-3 px-3 text-center text-emerald-700 font-black">{row.won}</td>
                    <td className="py-3 px-3 text-center text-slate-500 font-medium">{row.drawn}</td>
                    <td className="py-3 px-3 text-center text-rose-600 font-medium">{row.lost}</td>
                    <td className="py-3 px-3 text-center font-medium">{row.goalsFor}</td>
                    <td className="py-3 px-3 text-center font-medium">{row.goalsAgainst}</td>
                    <td className="py-3 px-3 text-center font-black">
                      {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                    </td>
                    <td className="py-3 px-4 text-center font-black text-sm text-[#0B7A3B] bg-emerald-50/60">
                      {row.points}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {row.form && row.form.length > 0 ? (
                          row.form.map((f, i) => (
                            <span
                              key={i}
                              className={`w-4 h-4 rounded text-[9px] font-black inline-flex items-center justify-center text-white ${
                                f === 'W' ? 'bg-emerald-600' : f === 'D' ? 'bg-slate-400' : 'bg-rose-500'
                              }`}
                            >
                              {f}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
