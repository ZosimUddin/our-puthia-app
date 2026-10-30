import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Table, Trophy, Shield, ArrowLeft } from 'lucide-react';
import { FootballStandings, FootballTournament } from '../../types/football';
import { subscribeTournaments, subscribeStandings } from '../../services/footballService';
import SEO from '../../components/SEO';

export const FootballPublicStandings: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId?: string }>();
  const [tournaments, setTournaments] = useState<FootballTournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(tournamentId || '');
  const [standings, setStandings] = useState<FootballStandings | null>(null);

  useEffect(() => {
    const unsub = subscribeTournaments(list => {
      setTournaments(list);
      if (!selectedTournamentId && list.length > 0) {
        setSelectedTournamentId(tournamentId || list[0].id);
      }
    });
    return () => unsub();
  }, [tournamentId]);

  useEffect(() => {
    if (!selectedTournamentId) return;
    const unsub = subscribeStandings(selectedTournamentId, setStandings);
    return () => unsub();
  }, [selectedTournamentId]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SEO
        title="ফুটবল পয়েন্ট টেবিল ও স্ট্যান্ডিংস — আমাদের পুঠিয়া"
        description="টুর্নামেন্টের অফিসিয়াল পয়েন্ট টেবিল, দলের অবস্থান, গোল পার্থক্য ও সাম্প্রতিক ফর্ম সরাসরি দেখুন।"
      />

      <div className="bg-[#0B7A3B] text-white py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-2">
          <Link to="/football" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-100 hover:text-white">
            <ArrowLeft size={14} />
            <span>ফুটবল পোর্টালে ফিরুন</span>
          </Link>
          <h1 className="text-2xl font-black">পয়েন্ট টেবিল (Tournament Standings)</h1>
          <p className="text-xs text-emerald-100">প্রতিটি দলের ম্যাচ সংখ্যা, জয়, ড্র, পরাজয়, গোল ব্যবধান এবং অর্জিত পয়েন্ট।</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {tournaments.length > 1 && (
          <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-black text-slate-700">টুর্নামেন্ট:</span>
            <select
              value={selectedTournamentId}
              onChange={e => setSelectedTournamentId(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold outline-none max-w-sm"
            >
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-600">
                  <th className="py-3 px-4 w-12 text-center">অবস্থান</th>
                  <th className="py-3 px-4">দল</th>
                  <th className="py-3 px-3 text-center">ম্যাচ</th>
                  <th className="py-3 px-3 text-center text-emerald-700">জয়</th>
                  <th className="py-3 px-3 text-center">ড্র</th>
                  <th className="py-3 px-3 text-center text-rose-600">হার</th>
                  <th className="py-3 px-3 text-center">দেওয়া গোল</th>
                  <th className="py-3 px-3 text-center">খাওয়া গোল</th>
                  <th className="py-3 px-3 text-center font-black">ব্যবধান</th>
                  <th className="py-3 px-4 text-center font-black text-slate-900 bg-emerald-50">পয়েন্ট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
                {!standings || standings.rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      কোনো দলের পয়েন্ট তথ্য পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  standings.rows.map((row, idx) => (
                    <tr key={row.teamId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-center font-black">
                        <span className={`w-6 h-6 rounded-lg inline-flex items-center justify-center text-xs ${
                          idx === 0 ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900 flex items-center gap-2">
                        <Shield size={15} className="text-emerald-700" />
                        <span>{row.teamName}</span>
                      </td>
                      <td className="py-3 px-3 text-center">{row.played}</td>
                      <td className="py-3 px-3 text-center text-emerald-700 font-black">{row.won}</td>
                      <td className="py-3 px-3 text-center text-slate-500">{row.drawn}</td>
                      <td className="py-3 px-3 text-center text-rose-600">{row.lost}</td>
                      <td className="py-3 px-3 text-center">{row.goalsFor}</td>
                      <td className="py-3 px-3 text-center">{row.goalsAgainst}</td>
                      <td className="py-3 px-3 text-center font-black">{row.goalDifference}</td>
                      <td className="py-3 px-4 text-center font-black text-sm text-[#0B7A3B] bg-emerald-50">
                        {row.points}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
