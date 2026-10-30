import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trophy,
  Calendar,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { FootballMatch, FootballTournament } from '../../../types/football';
import {
  subscribeMatches,
  subscribeTournaments,
  saveMatch,
  recalculateStandings
} from '../../../services/footballService';

export const FootballResultsPage: React.FC = () => {
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [tournaments, setTournaments] = useState<FootballTournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsubMatches = subscribeMatches(setMatches);
    const unsubTournaments = subscribeTournaments((tList) => {
      setTournaments(tList);
      if (tList.length > 0 && !selectedTournamentId) {
        setSelectedTournamentId(tList[0].id);
      }
    });

    return () => {
      unsubMatches();
      unsubTournaments();
    };
  }, []);

  const completedMatches = matches.filter(
    m => (!selectedTournamentId || m.tournamentId === selectedTournamentId) &&
         (m.status === 'full_time' || m.resultApproved)
  );

  const handleApproveResult = async (match: FootballMatch) => {
    try {
      setIsProcessing(true);
      await saveMatch({
        id: match.id,
        resultApproved: true,
        status: 'full_time'
      });
      // Recalculate standings idempotently!
      await recalculateStandings(match.tournamentId);
    } catch (err) {
      console.error('Error approving result:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevokeApproval = async (match: FootballMatch) => {
    try {
      setIsProcessing(true);
      await saveMatch({
        id: match.id,
        resultApproved: false
      });
      await recalculateStandings(match.tournamentId);
    } catch (err) {
      console.error('Error revoking approval:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileCheck2 className="text-emerald-700" size={20} />
            <span>ফলাফল যাচাই ও অনুমোদন (Result Approval & Standings Sync)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            ম্যাচের চূড়ান্ত ফলাফল অনুমোদন করলে পয়েন্ট টেবিল ও পরিসংখ্যান স্বয়ংক্রিয়ভাবে পুনর্গণনা হয়।
          </p>
        </div>

        {/* Tournament Filter */}
        <select
          value={selectedTournamentId}
          onChange={(e) => setSelectedTournamentId(e.target.value)}
          className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
        >
          <option value="">সব টুর্নামেন্টের ফলাফল</option>
          {tournaments.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Results List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {completedMatches.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 space-y-2">
            <FileCheck2 size={36} className="mx-auto text-slate-300" />
            <h4 className="text-sm font-black text-slate-700">কোনো সমাপ্ত ম্যাচের ফলাফল পাওয়া যায়নি</h4>
            <p className="text-xs text-slate-400">লাইভ স্কোর পেজে ম্যাচ শেষ হলে ফলাফল এখানে পর্যালোচনার জন্য প্রদর্শিত হবে।</p>
          </div>
        ) : (
          completedMatches.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4 hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500">{m.matchNumberText || 'ম্যাচ'} • {m.matchDate}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                  m.resultApproved
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {m.resultApproved ? '✓ অনুমোদিত ফলাফল' : '⏳ অনুমোদনের অপেক্ষায়'}
                </span>
              </div>

              {/* Match Score Row */}
              <div className="flex items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl">
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate">{m.homeTeamName}</p>
                </div>
                <div className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-black text-lg shadow-xs">
                  {m.homeScore} - {m.awayScore}
                </div>
                <div className="flex-1 text-right min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate">{m.awayTeamName}</p>
                </div>
              </div>

              {/* Winner Announcement */}
              <div className="text-center text-xs font-black">
                {m.homeScore > m.awayScore ? (
                  <span className="text-emerald-700">বিজয়ী: {m.homeTeamName} 🎉</span>
                ) : m.homeScore < m.awayScore ? (
                  <span className="text-emerald-700">বিজয়ী: {m.awayTeamName} 🎉</span>
                ) : (
                  <span className="text-slate-600">ম্যাচ ড্র হয়েছে 🤝</span>
                )}
              </div>

              {/* Approval Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400">
                  {m.venueName}
                </span>

                <div className="flex items-center gap-2">
                  {!m.resultApproved ? (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleApproveResult(m)}
                      className="px-3.5 py-1.5 bg-[#0B7A3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      অনুমোদন ও পয়েন্ট যোগ
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleRevokeApproval(m)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      অনুমোদন প্রত্যাহার
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
