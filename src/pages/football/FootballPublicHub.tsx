import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Calendar,
  Radio,
  Table,
  MapPin,
  Clock,
  Shield,
  Palette,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import {
  FootballTournament,
  FootballMatch,
  FootballStandings,
  FootballPosterConfig
} from '../../types/football';
import {
  subscribeTournaments,
  subscribeMatches,
  subscribePosters,
  subscribeStandings,
  seedInitialFootballDataIfEmpty
} from '../../services/footballService';
import SEO from '../../components/SEO';

export const FootballPublicHub: React.FC = () => {
  const [tournaments, setTournaments] = useState<FootballTournament[]>([]);
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [posters, setPosters] = useState<FootballPosterConfig[]>([]);
  const [standings, setStandings] = useState<FootballStandings | null>(null);

  useEffect(() => {
    // Seed initial poster data if empty
    seedInitialFootballDataIfEmpty();

    const unsubT = subscribeTournaments(setTournaments);
    const unsubM = subscribeMatches(setMatches);
    const unsubP = subscribePosters(setPosters);

    return () => {
      unsubT();
      unsubM();
      unsubP();
    };
  }, []);

  useEffect(() => {
    if (tournaments.length > 0) {
      const unsubS = subscribeStandings(tournaments[0].id, setStandings);
      return () => unsubS();
    }
  }, [tournaments]);

  const liveMatches = matches.filter(m => m.status === 'live' || m.status === 'half_time' || m.status === 'second_half');
  const upcomingMatches = matches.filter(m => m.status === 'scheduled');
  const completedMatches = matches.filter(m => m.status === 'full_time');
  const featuredTournament = tournaments[0];
  const publishedPosters = posters.filter(p => p.status === 'published');

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SEO
        title="ফুটবল টুর্নামেন্ট পোর্টাল — আমাদের পুঠিয়া"
        description="পুঠিয়া উপজেলার সকল ফুটবল টুর্নামেন্ট, ম্যাচ শিডিউল, লাইভ স্কোর, ফলাফল, পয়েন্ট টেবিল ও আকর্ষণীয় পোস্টার দেখুন।"
      />

      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-emerald-950 via-[#0B7A3B] to-teal-950 text-white overflow-hidden py-10 sm:py-16 px-4">
        {/* Glow & Lighting overlays */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-yellow-300 text-xs font-black">
            <Trophy size={14} className="text-yellow-400" />
            <span>আমাদের পুঠিয়া — ফুটবল টুর্নামেন্ট পোর্টাল ২০২৬</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            খেলাধুলা সুস্থ দেহ, সুন্দর মন, গড়ে তোলে আগামীর স্বপ্ন
          </h1>

          <p className="text-xs sm:text-base text-emerald-100 max-w-2xl mx-auto font-medium leading-relaxed">
            পুঠিয়া ও দুর্গাপুরের ঐতিহ্যবাহী ফুটবল টুর্নামেন্টের লাইভ স্কোর, ম্যাচ সূচি, ফলাফল এবং পয়েন্ট টেবিল রিয়েল-টাইমে জানুন।
          </p>

          {/* Quick Nav Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Link
              to="/football/live"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              <Radio size={14} className="animate-pulse" />
              <span>লাইভ ম্যাচ সেন্টার</span>
            </Link>
            <Link
              to="/football/matches"
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-black backdrop-blur-xs border border-white/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Calendar size={14} />
              <span>ম্যাচ সূচি</span>
            </Link>
            <Link
              to="/football/tournaments"
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-black backdrop-blur-xs border border-white/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Trophy size={14} />
              <span>টুর্নামেন্টসমূহ</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6 space-y-8">
        {/* Live Match Alert Ticker (if any live match) */}
        {liveMatches.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white shadow-xl border border-rose-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-black text-rose-200">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400 animate-ping inline-block" />
                <span>এখন মাঠে লাইভ খেলা চলছে!</span>
              </span>
              <Link to="/football/live" className="text-xs font-bold text-yellow-300 hover:underline flex items-center gap-1">
                <span>লাইভ কমেন্ট্রি ও স্কোর</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {liveMatches.map(m => (
              <div key={m.id} className="flex items-center justify-between gap-4 bg-black/30 p-3 rounded-xl border border-white/10">
                <span className="text-sm font-black flex-1 truncate">{m.homeTeamName}</span>
                <span className="px-4 py-1.5 bg-rose-600 rounded-xl font-black text-lg text-white shadow-md">
                  {m.homeScore} - {m.awayScore}
                </span>
                <span className="text-sm font-black flex-1 truncate text-right">{m.awayTeamName}</span>
              </div>
            ))}
          </div>
        )}

        {/* Featured Tournament Banner / Poster */}
        {publishedPosters.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                <span>চলমান টুর্নামেন্ট ও পরবর্তী ম্যাচ ব্যানার</span>
              </h2>
              <Link to={`/football/posters/${publishedPosters[0].id}`} className="text-xs font-bold text-[#0B7A3B] hover:underline">
                ব্যানার বিস্তারিত &rarr;
              </Link>
            </div>

            <div className="rounded-3xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 text-center md:text-left">
                <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase">
                  {publishedPosters[0].matchRibbonText || 'ম্যাচ ব্যানার'}
                </span>
                <h3 className="text-xl sm:text-3xl font-black leading-tight text-white">
                  {publishedPosters[0].mainTitleText}
                </h3>
                <p className="text-xs sm:text-sm text-yellow-300 font-bold">
                  {publishedPosters[0].subTitleText}
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2 text-xs text-slate-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-emerald-400" />
                    {publishedPosters[0].dateText} ({publishedPosters[0].dayText})
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-blue-400" />
                    {publishedPosters[0].timeText}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-rose-400" />
                    {publishedPosters[0].venueText}
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-center gap-2">
                <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center space-y-1">
                  <p className="text-xs font-bold text-slate-300">মুখোমুখি লড়াই</p>
                  <p className="text-sm sm:text-base font-black text-white">
                    {publishedPosters[0].teamAName} <span className="text-amber-400">VS</span> {publishedPosters[0].teamBName}
                  </p>
                </div>
                <Link
                  to="/football/matches"
                  className="px-5 py-2.5 bg-[#0B7A3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95"
                >
                  ম্যাচ বিস্তারিত দেখুন
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Two Columns: Upcoming Fixtures & Recent Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming Matches Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                <span>আসন্ন ম্যাচ সূচি</span>
              </h3>
              <Link to="/football/matches" className="text-xs font-bold text-[#0B7A3B] hover:underline">
                সবগুলো &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingMatches.length === 0 ? (
                <p className="py-6 text-center text-slate-400 text-xs font-bold">আপাতত কোনো আসন্ন ম্যাচ নেই</p>
              ) : (
                upcomingMatches.slice(0, 4).map(m => (
                  <div key={m.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span className="text-[#0B7A3B] font-black">{m.matchNumberText || 'ম্যাচ'}</span>
                      <span>{m.matchDate} ({m.kickoffTime})</span>
                    </div>
                    <div className="flex items-center justify-between font-black text-xs text-slate-900">
                      <span className="truncate flex-1">{m.homeTeamName}</span>
                      <span className="px-2 text-slate-400 font-bold">vs</span>
                      <span className="truncate flex-1 text-right">{m.awayTeamName}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <MapPin size={10} />
                      <span>{m.venueName}</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Results Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Trophy size={16} className="text-amber-500" />
                <span>সাম্প্রতিক ফলাফল</span>
              </h3>
              <Link to="/football/results" className="text-xs font-bold text-[#0B7A3B] hover:underline">
                সব ফলাফল &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {completedMatches.length === 0 ? (
                <p className="py-6 text-center text-slate-400 text-xs font-bold">কোনো সমাপ্ত ম্যাচের ফলাফল নথিভুক্ত নেই</p>
              ) : (
                completedMatches.slice(0, 4).map(m => (
                  <div key={m.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span>{m.matchNumberText || 'ম্যাচ'} • {m.matchDate}</span>
                      <span className="text-emerald-700 font-black">চূড়ান্ত স্কোর</span>
                    </div>
                    <div className="flex items-center justify-between font-black text-xs text-slate-900">
                      <span className="truncate flex-1">{m.homeTeamName}</span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white font-black text-xs mx-2">
                        {m.homeScore} - {m.awayScore}
                      </span>
                      <span className="truncate flex-1 text-right">{m.awayTeamName}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Standings Snippet */}
        {standings && standings.rows.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Table size={16} className="text-emerald-700" />
                <span>পয়েন্ট টেবিল — {standings.tournamentName}</span>
              </h3>
              <Link to={`/football/standings/${standings.tournamentId}`} className="text-xs font-bold text-[#0B7A3B] hover:underline">
                সম্পূর্ণ টেবিল &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bold border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-500 border-b">
                    <th className="py-2 px-3 text-center">#</th>
                    <th className="py-2 px-3">দল</th>
                    <th className="py-2 px-2 text-center">ম্যাচ</th>
                    <th className="py-2 px-2 text-center text-emerald-700">জয়</th>
                    <th className="py-2 px-2 text-center">ড্র</th>
                    <th className="py-2 px-2 text-center text-rose-600">হার</th>
                    <th className="py-2 px-2 text-center">গোল পার্থক্য</th>
                    <th className="py-2 px-3 text-center font-black text-[#0B7A3B]">পয়েন্ট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {standings.rows.slice(0, 5).map((r, i) => (
                    <tr key={r.teamId}>
                      <td className="py-2.5 px-3 text-center font-black text-slate-500">{i + 1}</td>
                      <td className="py-2.5 px-3 font-black text-slate-900">{r.teamName}</td>
                      <td className="py-2.5 px-2 text-center font-medium">{r.played}</td>
                      <td className="py-2.5 px-2 text-center text-emerald-700 font-black">{r.won}</td>
                      <td className="py-2.5 px-2 text-center font-medium">{r.drawn}</td>
                      <td className="py-2.5 px-2 text-center text-rose-600 font-medium">{r.lost}</td>
                      <td className="py-2.5 px-2 text-center font-black">{r.goalDifference}</td>
                      <td className="py-2.5 px-3 text-center font-black text-[#0B7A3B]">{r.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
