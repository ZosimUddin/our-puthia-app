import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Calendar,
  Users,
  Shield,
  Palette,
  Radio,
  FileCheck2,
  Clock,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Play,
  TrendingUp,
  MapPin,
  RefreshCw
} from 'lucide-react';
import {
  FootballTournament,
  FootballClub,
  FootballTeam,
  FootballPlayer,
  FootballMatch,
  FootballPosterConfig
} from '../../../types/football';
import {
  subscribeTournaments,
  subscribeMatches,
  subscribeClubs,
  subscribeTeams,
  subscribePlayers,
  subscribePosters,
  seedInitialFootballDataIfEmpty
} from '../../../services/footballService';

export const FootballDashboardPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<FootballTournament[]>([]);
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [clubs, setClubs] = useState<FootballClub[]>([]);
  const [teams, setTeams] = useState<FootballTeam[]>([]);
  const [players, setPlayers] = useState<FootballPlayer[]>([]);
  const [posters, setPosters] = useState<FootballPosterConfig[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const unsubTournaments = subscribeTournaments(setTournaments);
    const unsubMatches = subscribeMatches(setMatches);
    const unsubClubs = subscribeClubs(setClubs);
    const unsubTeams = subscribeTeams(setTeams);
    const unsubPlayers = subscribePlayers(setPlayers);
    const unsubPosters = subscribePosters(setPosters);

    return () => {
      unsubTournaments();
      unsubMatches();
      unsubClubs();
      unsubTeams();
      unsubPlayers();
      unsubPosters();
    };
  }, []);

  // Filter metrics
  const ongoingTournaments = tournaments.filter(t => t.status === 'ongoing');
  const liveMatches = matches.filter(m => m.status === 'live' || m.status === 'half_time' || m.status === 'second_half');
  const upcomingMatches = matches.filter(m => m.status === 'scheduled');
  const completedMatches = matches.filter(m => m.status === 'full_time');
  const pendingApprovals = clubs.filter(c => c.status === 'pending').length + teams.filter(t => t.registrationStatus === 'pending').length;
  const publishedBanners = posters.filter(p => p.status === 'published').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayMatches = matches.filter(m => m.matchDate === todayStr);

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      await seedInitialFootballDataIfEmpty();
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          { label: 'মোট টুর্নামেন্ট', val: tournaments.length, sub: `${ongoingTournaments.length}টি চলমান`, icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'চলমান ম্যাচ', val: liveMatches.length, sub: 'লাইভ অ্যাকশন', icon: Radio, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', live: true },
          { label: 'আসন্ন ম্যাচ', val: upcomingMatches.length, sub: 'নির্ধারিত শিডিউল', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'নিবন্ধিত ক্লাব ও দল', val: `${clubs.length} / ${teams.length}`, sub: 'ক্লাব ও স্কোয়াড', icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'মোট খেলোয়াড়', val: players.length, sub: 'যাচাইকৃত প্রোফাইল', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
          { label: 'প্রকাশিত ব্যানার', val: publishedBanners, sub: `${posters.length}টি মোট ড্রাফট`, icon: Palette, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`p-4 rounded-2xl bg-white border ${card.border} shadow-2xs space-y-2 relative overflow-hidden`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 leading-tight">{card.label}</span>
                <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 tracking-tight">{card.val}</span>
                {card.live && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                  </span>
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-400">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-amber-500" size={18} />
          <span className="text-sm font-black text-slate-800">দ্রুত প্রশাসনিক অ্যাকশন:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/football/matches"
            className="px-3.5 py-2 bg-[#0B7A3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
          >
            <PlusCircle size={14} />
            <span>নতুন ম্যাচ শিডিউল</span>
          </Link>
          <Link
            to="/admin/football/banner-designer"
            className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
          >
            <Palette size={14} />
            <span>নতুন ব্যানার তৈরি</span>
          </Link>
          <Link
            to="/admin/football/live-score"
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
          >
            <Radio size={14} />
            <span>লাইভ স্কোর কন্ট্রোল</span>
          </Link>
          {tournaments.length === 0 && (
            <button
              type="button"
              disabled={isSeeding}
              onClick={handleSeed}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={isSeeding ? 'animate-spin' : ''} />
              <span>পোস্টার ম্যাচ ডেটা লোড করুন</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid: Ongoing Live Match & Upcoming Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live / Ongoing Matches Center Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
              </span>
              <h3 className="text-sm font-black text-slate-800">চলমান লাইভ ম্যাচসমূহ</h3>
            </div>
            <Link to="/admin/football/live-score" className="text-xs font-bold text-[#0B7A3B] hover:underline flex items-center gap-1">
              <span>সব দেখুন</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="p-4 space-y-3">
            {liveMatches.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <Radio size={28} className="mx-auto text-slate-300" />
                <p className="text-xs font-bold">বর্তমানে কোনো লাইভ ম্যাচ চলমান নেই</p>
                <p className="text-[11px] text-slate-400">ম্যাচ শিডিউল থেকে লাইভ শুরু করতে 'লাইভ স্কোর' পেজে যান</p>
              </div>
            ) : (
              liveMatches.map((m) => (
                <div key={m.id} className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>{m.tournamentName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] animate-pulse">
                      {m.currentMinute}' {m.period === 'half_time' ? '(হাফ-টাইম)' : 'মিনিট'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-black text-sm text-slate-800 flex-1 truncate">{m.homeTeamName}</span>
                    <div className="px-3 py-1 rounded-lg bg-slate-900 text-white font-black text-base shadow-xs">
                      {m.homeScore} - {m.awayScore}
                    </div>
                    <span className="font-black text-sm text-slate-800 flex-1 truncate text-right">{m.awayTeamName}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-rose-100 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-rose-500" />
                      {m.venueName}
                    </span>
                    <Link
                      to={`/admin/football/live-score?matchId=${m.id}`}
                      className="font-black text-rose-700 hover:underline"
                    >
                      স্কোর আপডেট করুন &rarr;
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Fixtures */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Calendar className="text-blue-600" size={16} />
              <h3 className="text-sm font-black text-slate-800">আসন্ন ম্যাচ ও সময়সূচি</h3>
            </div>
            <Link to="/admin/football/matches" className="text-xs font-bold text-[#0B7A3B] hover:underline flex items-center gap-1">
              <span>ম্যানেজ করুন</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="p-4 space-y-3">
            {upcomingMatches.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <Calendar size={28} className="mx-auto text-slate-300" />
                <p className="text-xs font-bold">সামনে কোনো নির্ধারিত ম্যাচ নেই</p>
                <Link to="/admin/football/matches" className="inline-block text-xs font-black text-[#0B7A3B] hover:underline">
                  + নতুন ম্যাচ তৈরি করুন
                </Link>
              </div>
            ) : (
              upcomingMatches.slice(0, 4).map((m) => (
                <div key={m.id} className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all flex items-center justify-between gap-3 bg-white">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                      <span className="text-emerald-700 font-black">{m.matchNumberText || 'ম্যাচ'}</span>
                      <span>•</span>
                      <span>{m.matchDate} ({m.dayOfWeekBangla || 'সময়'})</span>
                      <span>•</span>
                      <span>{m.kickoffTime}</span>
                    </div>
                    <p className="text-xs font-black text-slate-900 truncate">
                      {m.homeTeamName} বনাম {m.awayTeamName}
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin size={10} />
                      {m.venueName}
                    </p>
                  </div>

                  <Link
                    to={`/admin/football/banner-designer?matchId=${m.id}`}
                    className="shrink-0 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10.5px] font-black transition-all"
                  >
                    ব্যানার তৈরি
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Featured Tournament & Poster Showcase */}
      {posters.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette size={18} className="text-purple-600" />
              <h3 className="text-sm font-black text-slate-800">সর্বশেষ প্রস্তুতকৃত ব্যানার পোস্টার</h3>
            </div>
            <Link to="/admin/football/banner-designer" className="text-xs font-bold text-[#0B7A3B] hover:underline">
              ব্যানার এডিটর খুলুন &rarr;
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                {posters[0].matchRibbonText || 'ম্যাচ ব্যানার'}
              </span>
              <h4 className="text-base sm:text-lg font-black">{posters[0].mainTitleText}</h4>
              <p className="text-xs text-slate-300 font-medium">
                {posters[0].teamAName} VS {posters[0].teamBName} • {posters[0].dateText}
              </p>
            </div>
            <Link
              to={`/admin/football/banner-designer?posterId=${posters[0].id}`}
              className="px-4 py-2 bg-[#0B7A3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-black shrink-0 transition-all shadow-xs"
            >
              এডিট ও ডাউনলোড করুন
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
