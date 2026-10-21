import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Radio, Clock, MapPin, Trophy, Shield, ArrowLeft } from 'lucide-react';
import { FootballMatch, MatchEvent } from '../../types/football';
import {
  subscribeMatches,
  subscribeMatchEvents
} from '../../services/footballService';
import SEO from '../../components/SEO';

export const FootballPublicLiveCenter: React.FC = () => {
  const [searchParams] = useSearchParams();
  const matchIdParam = searchParams.get('matchId');

  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>(matchIdParam || '');
  const [events, setEvents] = useState<MatchEvent[]>([]);

  useEffect(() => {
    const unsub = subscribeMatches((list) => {
      setMatches(list);
      if (!selectedMatchId && list.length > 0) {
        const live = list.find(m => m.status === 'live');
        setSelectedMatchId(live?.id || list[0].id);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedMatchId) return;
    const unsubEvents = subscribeMatchEvents(selectedMatchId, setEvents);
    return () => unsubEvents();
  }, [selectedMatchId]);

  const currentMatch = matches.find(m => m.id === selectedMatchId);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SEO
        title="লাইভ ফুটবল স্কোর সেন্টার — আমাদের পুঠিয়া"
        description="লাইভ ম্যাচের রিয়েল-টাইম স্কোরবোর্ড, মিনিটের হিসাব ও গোল টাইমলাইন সরাসরি দেখুন।"
      />

      <div className="bg-slate-900 text-white py-6 px-4 border-b border-slate-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/football" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white">
            <ArrowLeft size={14} />
            <span>ফুটবল পোর্টালে ফিরুন</span>
          </Link>
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-rose-500 animate-pulse" />
            <span className="text-xs font-black text-rose-400">লাইভ স্কোর সেন্টার</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* Match Switcher Dropdown */}
        {matches.length > 1 && (
          <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-black text-slate-600">ম্যাচ নির্বাচন:</span>
            <select
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold outline-none max-w-sm"
            >
              {matches.map(m => (
                <option key={m.id} value={m.id}>
                  {m.matchNumberText || 'ম্যাচ'}: {m.homeTeamName} vs {m.awayTeamName} ({m.status === 'live' ? '🔴 লাইভ' : m.status})
                </option>
              ))}
            </select>
          </div>
        )}

        {!currentMatch ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold">
            কোনো লাইভ ম্যাচ পাওয়া যায়নি।
          </div>
        ) : (
          <div className="space-y-6">
            {/* Live Score Stadium Card */}
            <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 shadow-2xl border border-slate-800 text-center space-y-6">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span className="text-yellow-400 font-black">{currentMatch.tournamentName}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-black ${
                  currentMatch.status === 'live' ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-slate-300'
                }`}>
                  {currentMatch.status === 'live' ? '🔴 লাইভ ম্যাচ' : currentMatch.status === 'full_time' ? 'সমাপ্ত' : 'নির্ধারিত'}
                </span>
                <span>{currentMatch.venueName}</span>
              </div>

              <div className="grid grid-cols-3 items-center gap-2">
                <div className="space-y-1">
                  <h3 className="text-base sm:text-xl font-black text-white">{currentMatch.homeTeamName}</h3>
                  <p className="text-[11px] text-blue-400 font-bold">হোম দল</p>
                </div>

                <div className="flex flex-col items-center justify-center space-y-1">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-4xl sm:text-6xl font-black">{currentMatch.homeScore}</span>
                    <span className="text-2xl font-bold text-slate-500">-</span>
                    <span className="text-4xl sm:text-6xl font-black">{currentMatch.awayScore}</span>
                  </div>
                  <div className="px-3 py-0.5 rounded-full bg-slate-800 text-emerald-400 text-xs font-black flex items-center gap-1">
                    <Clock size={12} />
                    <span>{currentMatch.currentMinute}' মিনিট</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base sm:text-xl font-black text-white">{currentMatch.awayTeamName}</h3>
                  <p className="text-[11px] text-rose-400 font-bold">অ্যাওয়ে দল</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2">
                <MapPin size={13} className="text-rose-500" />
                <span>{currentMatch.venueName}, {currentMatch.venueAddress || 'পুঠিয়া, রাজশাহী'}</span>
              </div>
            </div>

            {/* Live Commentary & Events Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>ম্যাচের সরাসরি ঘটনাবলী (Live Commentary Timeline)</span>
              </h4>

              <div className="space-y-2.5">
                {events.length === 0 ? (
                  <p className="py-8 text-center text-slate-400 text-xs font-bold">
                    এখনো কোনো গোল বা কার্ডের ঘটনা ঘটেনি। খেলা শুরু হলে সরাসরি আপডেট প্রদর্শিত হবে।
                  </p>
                ) : (
                  events.map(ev => (
                    <div key={ev.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-[#0B7A3B] text-white font-black text-xs flex items-center justify-center shrink-0">
                        {ev.minute}'
                      </span>
                      <div>
                        <p className="text-xs font-black text-slate-900">{ev.description}</p>
                        <p className="text-[10px] text-slate-500 font-bold">{ev.teamName}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
