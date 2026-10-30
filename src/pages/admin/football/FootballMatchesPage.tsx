import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  MapPin,
  Clock,
  Palette,
  Radio,
  AlertTriangle,
  CheckCircle,
  X,
  Filter,
  Wand2
} from 'lucide-react';
import {
  FootballMatch,
  FootballTournament,
  FootballTeam,
  FootballVenue
} from '../../../types/football';
import {
  subscribeMatches,
  subscribeTournaments,
  subscribeTeams,
  getVenues,
  saveMatch,
  checkMatchConflicts,
  generateRoundRobinFixtures,
  generateKnockoutFixtures,
  GeneratedFixtureDraft
} from '../../../services/footballService';

export const FootballMatchesPage: React.FC = () => {
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [tournaments, setTournaments] = useState<FootballTournament[]>([]);
  const [teams, setTeams] = useState<FootballTeam[]>([]);
  const [venues, setVenues] = useState<FootballVenue[]>([]);

  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Partial<FootballMatch> | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automated fixture generation modal
  const [isFixtureModalOpen, setIsFixtureModalOpen] = useState(false);
  const [fixtureType, setFixtureType] = useState<'round_robin' | 'knockout'>('knockout');
  const [fixtureStartDate, setFixtureStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [fixtureTime, setFixtureTime] = useState('15:00');
  const [generatedDrafts, setGeneratedDrafts] = useState<GeneratedFixtureDraft[]>([]);

  useEffect(() => {
    const unsubMatches = subscribeMatches(setMatches);
    const unsubTournaments = subscribeTournaments((data) => {
      setTournaments(data);
      if (data.length > 0 && !selectedTournamentId) {
        setSelectedTournamentId(data[0].id);
      }
    });
    const unsubTeams = subscribeTeams(setTeams);
    getVenues().then(setVenues);

    return () => {
      unsubMatches();
      unsubTournaments();
      unsubTeams();
    };
  }, []);

  const getBanglaDay = (dateStr: string) => {
    const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    const d = new Date(dateStr);
    return isNaN(d.getDay()) ? '' : days[d.getDay()];
  };

  const handleOpenCreate = () => {
    const trn = tournaments.find(t => t.id === selectedTournamentId) || tournaments[0];
    const availableTeams = teams.filter(t => !selectedTournamentId || t.tournamentId === selectedTournamentId);
    
    setEditingMatch({
      tournamentId: trn?.id || '',
      tournamentName: trn?.name || 'ফুটবল টুর্নামেন্ট',
      groupOrRound: 'প্রথম পর্ব',
      matchNumber: matches.length + 1,
      matchNumberText: `${matches.length + 1}ম ম্যাচ`,
      homeTeamId: availableTeams[0]?.id || '',
      homeTeamName: availableTeams[0]?.name || '',
      awayTeamId: availableTeams[1]?.id || '',
      awayTeamName: availableTeams[1]?.name || '',
      matchDate: new Date().toISOString().split('T')[0],
      kickoffTime: '15:00',
      dayOfWeekBangla: getBanglaDay(new Date().toISOString().split('T')[0]),
      venueName: trn?.venueName || 'মহিপাড়া উচ্চ বিদ্যালয় মাঠ',
      venueAddress: trn?.venueAddress || 'দুর্গাপুর, রাজশাহী',
      refereeName: 'জাতীয় রেফারি',
      durationMinutes: 90,
      homeScore: 0,
      awayScore: 0,
      status: 'scheduled',
      period: 'scheduled',
      resultApproved: false
    });
    setConflicts([]);
    setIsModalOpen(true);
  };

  const handleCheckConflicts = async () => {
    if (!editingMatch?.matchDate || !editingMatch?.kickoffTime || !editingMatch?.homeTeamId || !editingMatch?.awayTeamId) return;
    const detected = await checkMatchConflicts(
      editingMatch.matchDate,
      editingMatch.kickoffTime,
      editingMatch.homeTeamId,
      editingMatch.awayTeamId,
      editingMatch.venueId,
      editingMatch.id
    );
    setConflicts(detected.map(c => c.message));
  };

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch || !editingMatch.homeTeamId || !editingMatch.awayTeamId) return;

    if (editingMatch.homeTeamId === editingMatch.awayTeamId) {
      alert('একই দলকে উভয় পক্ষে রাখা যাবে না!');
      return;
    }

    try {
      setIsSubmitting(true);
      await saveMatch({
        ...editingMatch,
        dayOfWeekBangla: editingMatch.matchDate ? getBanglaDay(editingMatch.matchDate) : ''
      });
      setIsModalOpen(false);
      setEditingMatch(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Automated Fixture Generation
  const handleGeneratePreview = () => {
    const trnTeams = teams.filter(t => t.tournamentId === selectedTournamentId);
    if (trnTeams.length < 2) {
      alert('এই টুর্নামেন্টে কমপক্ষে ২টি দল নিবন্ধিত থাকতে হবে!');
      return;
    }
    const currentTrn = tournaments.find(t => t.id === selectedTournamentId);
    const venueName = currentTrn?.venueName || 'মহিপাড়া উচ্চ বিদ্যালয় মাঠ';

    let drafts: GeneratedFixtureDraft[] = [];
    if (fixtureType === 'round_robin') {
      drafts = generateRoundRobinFixtures(trnTeams, fixtureStartDate, fixtureTime, venueName);
    } else {
      drafts = generateKnockoutFixtures(trnTeams, fixtureStartDate, fixtureTime, venueName);
    }
    setGeneratedDrafts(drafts);
  };

  const handleSaveGeneratedFixtures = async () => {
    if (generatedDrafts.length === 0) return;
    const currentTrn = tournaments.find(t => t.id === selectedTournamentId);
    try {
      setIsSubmitting(true);
      for (const d of generatedDrafts) {
        await saveMatch({
          tournamentId: selectedTournamentId,
          tournamentName: currentTrn?.name || 'ফুটবল টুর্নামেন্ট',
          groupOrRound: d.roundOrGroup,
          matchNumber: d.matchNumber,
          matchNumberText: d.matchNumberText,
          homeTeamId: d.homeTeamId,
          homeTeamName: d.homeTeamName,
          homeTeamLogo: d.homeTeamLogo,
          awayTeamId: d.awayTeamId,
          awayTeamName: d.awayTeamName,
          awayTeamLogo: d.awayTeamLogo,
          matchDate: d.matchDate,
          kickoffTime: d.kickoffTime,
          dayOfWeekBangla: getBanglaDay(d.matchDate),
          venueName: d.venueName,
          venueAddress: currentTrn?.venueAddress || 'দুর্গাপুর, রাজশাহী',
          durationMinutes: currentTrn?.matchDurationMinutes || 90,
          homeScore: 0,
          awayScore: 0,
          status: 'scheduled',
          period: 'scheduled',
          resultApproved: false
        });
      }
      setIsFixtureModalOpen(false);
      setGeneratedDrafts([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMatches = matches.filter(m => !selectedTournamentId || m.tournamentId === selectedTournamentId);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Calendar className="text-blue-600" size={20} />
            <span>ম্যাচ শিডিউল ও ফিক্সচার অটোমেশন (Match Schedule)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            মোট {filteredMatches.length}টি ম্যাচ তালিকাভুক্ত রয়েছে।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              handleGeneratePreview();
              setIsFixtureModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Wand2 size={15} />
            <span>অটো ফিক্সচার জেনারেটর</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-[#0B7A3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>নতুন ম্যাচ শিডিউল</span>
          </button>
        </div>
      </div>

      {/* Tournament Filter */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
        <Filter size={15} className="text-slate-400" />
        <span className="text-xs font-bold text-slate-500">টুর্নামেন্ট:</span>
        <select
          value={selectedTournamentId}
          onChange={(e) => setSelectedTournamentId(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none flex-1 max-w-md"
        >
          <option value="">সব টুর্নামেন্টের ম্যাচ</option>
          {tournaments.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Matches List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMatches.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
            <Calendar size={36} className="mx-auto text-slate-300" />
            <h4 className="text-sm font-black text-slate-700">কোনো ম্যাচ পাওয়া যায়নি</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              নতুন ম্যাচ তৈরি করতে উপরের বোতামে ক্লিক করুন অথবা অটো ফিক্সচার তৈরি করুন।
            </p>
          </div>
        ) : (
          filteredMatches.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 flex flex-col justify-between hover:border-blue-300 transition-all space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-black">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {m.matchNumberText || `ম্যাচ #${m.matchNumber}`} • {m.groupOrRound}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${
                    m.status === 'live' ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse font-black' :
                    m.status === 'full_time' ? 'bg-slate-100 text-slate-700 font-bold' :
                    'bg-emerald-50 text-emerald-800 font-bold'
                  }`}>
                    {m.status === 'live' ? '🔴 লাইভ ম্যাচ' : m.status === 'full_time' ? 'সমাপ্ত' : 'নির্ধারিত'}
                  </span>
                </div>

                {/* Score / Teams Row */}
                <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl">
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{m.homeTeamName}</p>
                    <span className="text-[10px] text-slate-400 font-bold">হোম দল</span>
                  </div>

                  <div className="px-3 py-1 rounded-lg bg-slate-900 text-white font-black text-sm sm:text-base shrink-0 shadow-xs">
                    {m.homeScore} - {m.awayScore}
                  </div>

                  <div className="flex-1 text-right min-w-0">
                    <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{m.awayTeamName}</p>
                    <span className="text-[10px] text-slate-400 font-bold">অ্যাওয়ে দল</span>
                  </div>
                </div>

                {/* Match Time & Venue */}
                <div className="text-[11px] text-slate-500 font-bold space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-emerald-700 shrink-0" />
                    <span>{m.matchDate} ({m.dayOfWeekBangla || 'সময়'}) • {m.kickoffTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-rose-600 shrink-0" />
                    <span className="truncate">{m.venueName}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/football/banner-designer?matchId=${m.id}`}
                    className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-[10.5px] font-black flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
                    title="এই ম্যাচের ব্যানার তৈরি করুন"
                  >
                    <Palette size={12} />
                    <span>ব্যানার বানান</span>
                  </Link>

                  <Link
                    to={`/admin/football/live-score?matchId=${m.id}`}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[10.5px] font-black flex items-center gap-1.5 transition-all"
                  >
                    <Radio size={12} />
                    <span>লাইভ কন্ট্রোল</span>
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingMatch({ ...m });
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                  title="এডিট করুন"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual Match Create / Edit Modal */}
      {isModalOpen && editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl my-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingMatch.id ? 'ম্যাচ সময়সূচি সম্পাদনা' : 'নতুন ম্যাচ শিডিউল'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>

            {/* Conflict Warnings */}
            {conflicts.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-black flex items-center gap-1 text-amber-800">
                  <AlertTriangle size={14} />
                  <span>সংঘর্ষের সতর্কতা (Conflict Detected):</span>
                </p>
                {conflicts.map((c, i) => (
                  <p key={i} className="text-[11px] font-medium">{c}</p>
                ))}
              </div>
            )}

            <form onSubmit={handleSaveMatch} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">টুর্নামেন্ট *</label>
                  <select
                    required
                    value={editingMatch.tournamentId || ''}
                    onChange={(e) => {
                      const t = tournaments.find(x => x.id === e.target.value);
                      setEditingMatch({
                        ...editingMatch,
                        tournamentId: e.target.value,
                        tournamentName: t?.name || ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  >
                    {tournaments.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">রাউন্ড / পর্ব *</label>
                  <input
                    type="text"
                    required
                    value={editingMatch.groupOrRound || 'প্রথম পর্ব'}
                    onChange={(e) => setEditingMatch({ ...editingMatch, groupOrRound: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">হোম দল (Team A) *</label>
                  <select
                    required
                    value={editingMatch.homeTeamId || ''}
                    onChange={(e) => {
                      const selected = teams.find(x => x.id === e.target.value);
                      setEditingMatch({
                        ...editingMatch,
                        homeTeamId: e.target.value,
                        homeTeamName: selected?.name || ''
                      });
                    }}
                    onBlur={handleCheckConflicts}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="">দল নির্বাচন করুন</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">অ্যাওয়ে দল (Team B) *</label>
                  <select
                    required
                    value={editingMatch.awayTeamId || ''}
                    onChange={(e) => {
                      const selected = teams.find(x => x.id === e.target.value);
                      setEditingMatch({
                        ...editingMatch,
                        awayTeamId: e.target.value,
                        awayTeamName: selected?.name || ''
                      });
                    }}
                    onBlur={handleCheckConflicts}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="">দল নির্বাচন করুন</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">ম্যাচ নম্বর টেক্সট *</label>
                  <input
                    type="text"
                    required
                    value={editingMatch.matchNumberText || '১ম ম্যাচ'}
                    onChange={(e) => setEditingMatch({ ...editingMatch, matchNumberText: e.target.value })}
                    placeholder="উদা: দ্বিতীয় ম্যাচ"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={editingMatch.matchDate || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingMatch({
                        ...editingMatch,
                        matchDate: val,
                        dayOfWeekBangla: getBanglaDay(val)
                      });
                    }}
                    onBlur={handleCheckConflicts}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">কিক-অফ সময় *</label>
                  <input
                    type="time"
                    required
                    value={editingMatch.kickoffTime || '15:00'}
                    onChange={(e) => setEditingMatch({ ...editingMatch, kickoffTime: e.target.value })}
                    onBlur={handleCheckConflicts}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">মাঠ / ভেন্যু *</label>
                <input
                  type="text"
                  required
                  value={editingMatch.venueName || ''}
                  onChange={(e) => setEditingMatch({ ...editingMatch, venueName: e.target.value })}
                  placeholder="মহিপাড়া উচ্চ বিদ্যালয় মাঠ"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#0B7A3B] text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Automated Fixture Generator Modal with Live Preview */}
      {isFixtureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl my-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wand2 className="text-purple-600" size={20} />
                <h3 className="text-base font-black text-slate-900">
                  স্বয়ংক্রিয় ফিক্সচার জেনারেটর (Automated Fixture Generator)
                </h3>
              </div>
              <button type="button" onClick={() => setIsFixtureModalOpen(false)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">ফিক্সচার পদ্ধতি</label>
                <select
                  value={fixtureType}
                  onChange={(e) => setFixtureType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                >
                  <option value="knockout">নকআউট টুর্নামেন্ট (Knockout Bracket)</option>
                  <option value="round_robin">রাউন্ড-রবিন লিগ (Round Robin)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">শুরুর তারিখ</label>
                <input
                  type="date"
                  value={fixtureStartDate}
                  onChange={(e) => setFixtureStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">কিক-অফ সময়</label>
                <input
                  type="time"
                  value={fixtureTime}
                  onChange={(e) => setFixtureTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleGeneratePreview}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
              >
                প্রিভিউ দেখুন
              </button>
            </div>

            {/* Generated Drafts Preview */}
            <div className="space-y-2 pt-2 border-t border-slate-100 max-h-60 overflow-y-auto">
              <h4 className="text-xs font-black text-slate-700">
                জেনারেট হওয়া ম্যাচসমূহ ({generatedDrafts.length}টি ম্যাচ তৈরি হবে):
              </h4>
              {generatedDrafts.map((d, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="text-purple-700 font-black">{d.matchNumberText} ({d.roundOrGroup})</span>
                  <span>{d.homeTeamName} বনাম {d.awayTeamName}</span>
                  <span className="text-slate-500 font-medium text-[11px]">{d.matchDate}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFixtureModalOpen(false)}
                className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={generatedDrafts.length === 0 || isSubmitting}
                onClick={handleSaveGeneratedFixtures}
                className="px-5 py-2 bg-[#0B7A3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'সেভ হচ্ছে...' : 'সব ম্যাচ সংরক্ষণ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
