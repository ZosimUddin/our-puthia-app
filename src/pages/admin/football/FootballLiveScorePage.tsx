import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Radio,
  Clock,
  Play,
  Pause,
  PlusCircle,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Shield,
  RotateCcw,
  Flag,
  User,
  ArrowRightLeft
} from 'lucide-react';
import { FootballMatch, MatchEvent, MatchEventType, FootballPlayer } from '../../../types/football';
import {
  subscribeMatches,
  subscribeMatchEvents,
  saveMatch,
  addMatchEvent,
  deleteMatchEvent,
  getPlayers
} from '../../../services/footballService';

export const FootballLiveScorePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const matchIdParam = searchParams.get('matchId');

  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>(matchIdParam || '');
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [players, setPlayers] = useState<FootballPlayer[]>([]);

  // Event modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventType, setEventType] = useState<MatchEventType>('goal');
  const [eventTeamId, setEventTeamId] = useState<string>('');
  const [eventMinute, setEventMinute] = useState<number>(1);
  const [eventPlayerName, setEventPlayerName] = useState<string>('');
  const [eventDescription, setEventDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeMatches((list) => {
      setMatches(list);
      if (!selectedMatchId && list.length > 0) {
        // prefer live match, otherwise first scheduled
        const live = list.find(m => m.status === 'live');
        setSelectedMatchId(live?.id || list[0].id);
      }
    });

    getPlayers().then(setPlayers);

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedMatchId) return;
    const unsubEvents = subscribeMatchEvents(selectedMatchId, setEvents);
    return () => unsubEvents();
  }, [selectedMatchId]);

  const currentMatch = matches.find(m => m.id === selectedMatchId);

  const handleUpdateStatus = async (status: FootballMatch['status'], period: FootballMatch['period']) => {
    if (!currentMatch) return;
    await saveMatch({
      id: currentMatch.id,
      status,
      period
    });
  };

  const handleManualMinuteChange = async (min: number) => {
    if (!currentMatch) return;
    await saveMatch({
      id: currentMatch.id,
      currentMinute: Math.max(0, min)
    });
  };

  const handleOpenAddEvent = (type: MatchEventType) => {
    if (!currentMatch) return;
    setEventType(type);
    setEventTeamId(currentMatch.homeTeamId);
    setEventMinute(currentMatch.currentMinute || 1);
    setEventPlayerName('');
    setEventDescription('');
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMatch || !eventTeamId) return;

    try {
      setIsSubmitting(true);
      const teamName = eventTeamId === currentMatch.homeTeamId ? currentMatch.homeTeamName : currentMatch.awayTeamName;
      let desc = eventDescription;
      if (!desc) {
        if (eventType === 'goal') desc = `${eventPlayerName ? eventPlayerName + ' এর' : ''} গোল!`;
        else if (eventType === 'yellow_card') desc = `${eventPlayerName ? eventPlayerName + ' কে' : ''} হলুদ কার্ড প্রদর্শন`;
        else if (eventType === 'red_card') desc = `${eventPlayerName ? eventPlayerName + ' কে' : ''} লাল কার্ড প্রদর্শন`;
        else desc = `${eventType} ইভেন্ট`;
      }

      await addMatchEvent(currentMatch.id, currentMatch.tournamentId, {
        matchId: currentMatch.id,
        tournamentId: currentMatch.tournamentId,
        type: eventType,
        teamId: eventTeamId,
        teamName,
        playerName: eventPlayerName,
        minute: eventMinute,
        description: desc
      });

      setIsEventModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!currentMatch) return;
    await deleteMatchEvent(eventId, currentMatch.id);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Radio className="text-rose-600 animate-pulse" size={20} />
            <span>লাইভ ম্যাচ ও স্কোর সেন্টার (Live Match Control Hub)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            লাইভ স্কোর, গোল, ফাউল, কার্ড এবং সাবস্টিটিউশন রিয়েল-টাইম পরিচালনা করুন।
          </p>
        </div>

        {/* Match Selector */}
        <select
          value={selectedMatchId}
          onChange={(e) => setSelectedMatchId(e.target.value)}
          className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none max-w-sm"
        >
          {matches.map(m => (
            <option key={m.id} value={m.id}>
              {m.matchNumberText || 'ম্যাচ'}: {m.homeTeamName} vs {m.awayTeamName} ({m.status === 'live' ? '🔴 লাইভ' : m.status})
            </option>
          ))}
        </select>
      </div>

      {!currentMatch ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
          কোনো ম্যাচ সিলেক্ট করা হয়নি।
        </div>
      ) : (
        <div className="space-y-6">
          {/* Authoritative Live Scoreboard Banner */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              {/* Match Header info */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span className="text-yellow-400 font-black">{currentMatch.tournamentName}</span>
                <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-black animate-pulse flex items-center gap-1.5">
                  <Radio size={12} />
                  <span>
                    {currentMatch.status === 'live' ? 'লাইভ ম্যাচ চলমান' : 
                     currentMatch.status === 'half_time' ? 'বিরতি (Half-Time)' :
                     currentMatch.status === 'full_time' ? 'পূর্ণ সময় সমাপ্ত' : 'শিডিউলকৃত'}
                  </span>
                </span>
                <span>{currentMatch.venueName}</span>
              </div>

              {/* Main Score & Teams Display */}
              <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 text-center">
                {/* Home Team */}
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-2xl font-black text-white">{currentMatch.homeTeamName}</h3>
                  <p className="text-xs text-blue-400 font-bold">হোম দল</p>
                </div>

                {/* Central Score & Clock */}
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-4xl sm:text-6xl font-black tracking-tight text-white">{currentMatch.homeScore}</span>
                    <span className="text-2xl sm:text-4xl font-bold text-slate-600">-</span>
                    <span className="text-4xl sm:text-6xl font-black tracking-tight text-white">{currentMatch.awayScore}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700">
                    <Clock size={14} className="text-emerald-400" />
                    <span className="text-sm font-black text-emerald-300">{currentMatch.currentMinute}' মিনিট</span>
                  </div>
                </div>

                {/* Away Team */}
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-2xl font-black text-white">{currentMatch.awayTeamName}</h3>
                  <p className="text-xs text-rose-400 font-bold">অ্যাওয়ে দল</p>
                </div>
              </div>

              {/* Match State Controls */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('live', 'first_half')}
                  className="px-3 py-1.5 bg-[#0B7A3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  ▶ ১ম অর্ধ শুরু
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('half_time', 'half_time')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  ⏸ হাফ-টাইম (বিরতি)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('live', 'second_half')}
                  className="px-3 py-1.5 bg-[#0B7A3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  ▶ ২য় অর্ধ শুরু
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('full_time', 'finished')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  ⏹ ম্যাচ সমাপ্তি (Full Time)
                </button>
                <div className="flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-xl">
                  <span className="text-[10px] text-slate-400">মিনিট:</span>
                  <input
                    type="number"
                    value={currentMatch.currentMinute || 0}
                    onChange={(e) => handleManualMinuteChange(parseInt(e.target.value) || 0)}
                    className="w-14 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-center text-xs font-black text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Event Triggers Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-black text-slate-800">লাইভ ইভেন্ট যোগ করুন:</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenAddEvent('goal')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                ⚽ গোল যোগ করুন
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddEvent('penalty_goal')}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                🎯 পেনাল্টি গোল
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddEvent('yellow_card')}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                🟨 হলুদ কার্ড
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddEvent('red_card')}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                🟥 লাল কার্ড
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddEvent('substitution')}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                🔄 সাবস্টিটিউশন
              </button>
            </div>
          </div>

          {/* Events Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <h4 className="text-sm font-black text-slate-900">ম্যাচ ইভেন্ট টাইমলাইন ({events.length}টি ঘটনা নথিভুক্ত)</h4>

            <div className="space-y-2">
              {events.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-bold">
                  এখনো কোনো গোল বা কার্ডের ঘটনা ঘটেনি।
                </div>
              ) : (
                events.map((ev) => (
                  <div key={ev.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 bg-slate-50/50 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {ev.minute}'
                      </span>
                      <div>
                        <p className="text-xs font-black text-slate-900">{ev.description}</p>
                        <p className="text-[10px] text-slate-500 font-bold">{ev.teamName}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="ইভেন্ট মুছুন / স্কোর প্রত্যাহার"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Match Event Modal */}
      {isEventModalOpen && currentMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-slate-900">
              লাইভ ইভেন্ট এন্ট্রি: {eventType === 'goal' ? '⚽ গোল' : eventType === 'yellow_card' ? '🟨 হলুদ কার্ড' : 'ইভেন্ট'}
            </h3>

            <form onSubmit={handleSaveEvent} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">কোন দলের জন্য? *</label>
                <select
                  required
                  value={eventTeamId}
                  onChange={(e) => setEventTeamId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                >
                  <option value={currentMatch.homeTeamId}>{currentMatch.homeTeamName} (Home)</option>
                  <option value={currentMatch.awayTeamId}>{currentMatch.awayTeamName} (Away)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">খেলার কততম মিনিট? *</label>
                  <input
                    type="number"
                    required
                    value={eventMinute}
                    onChange={(e) => setEventMinute(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">খেলোয়াড়ের নাম</label>
                  <input
                    type="text"
                    value={eventPlayerName}
                    onChange={(e) => setEventPlayerName(e.target.value)}
                    placeholder="উদা: হাসান মাহমুদ"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">বিবরণ (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="উদা: দূরপাল্লার শটে দুর্দান্ত গোল!"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#0B7A3B] text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
                >
                  সংরক্ষণ ও স্কোর আপডেট
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
