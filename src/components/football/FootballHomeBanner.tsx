import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trophy, Radio, Calendar, ChevronRight, MapPin, Sparkles } from "lucide-react";
import { subscribeMatches } from "../../services/footballService";
import { FootballMatch } from "../../types/football";

export const FootballHomeBanner: React.FC = () => {
  const [liveMatches, setLiveMatches] = useState<FootballMatch[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<FootballMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeMatches((matches) => {
      const live = matches.filter(
        (m) =>
          m.status === "live" ||
          m.status === "half_time" ||
          m.status === "second_half" ||
          m.status === "extra_time" ||
          m.status === "penalties"
      );
      const upcoming = matches
        .filter((m) => m.status === "scheduled")
        .slice(0, 2);
      setLiveMatches(live);
      setUpcomingMatches(upcoming);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const hasLive = liveMatches.length > 0;
  const currentLive = hasLive ? liveMatches[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 my-4">
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-linear-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white shadow-md border border-emerald-700/40 p-4 sm:p-5 md:p-6 transition-all hover:shadow-lg">
        {/* Decorative background glows */}
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Left Title & Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Trophy size={13} className="text-amber-400" />
                ফুটবল টুর্নামেন্ট হাব
              </span>

              {hasLive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-600 text-white animate-pulse shadow-xs">
                  <Radio size={12} className="animate-spin" />
                  ম্যাচ লাইভ চলছে
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-emerald-200">
                  <Sparkles size={11} className="text-amber-300" />
                  নতুন সংস্করণ
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>⚽</span>
              {hasLive && currentLive ? (
                <span>
                  {currentLive.homeTeamName} {currentLive.homeScore ?? 0} - {currentLive.awayScore ?? 0} {currentLive.awayTeamName}
                </span>
              ) : (
                <span>পুঠিয়া ফুটবল টুর্নামেন্ট ও লাইভ স্কোর অটোমেশন</span>
              )}
            </h3>

            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 line-clamp-1">
              {hasLive && currentLive ? (
                <span>
                  মিনিট: {currentLive.currentMinute ? `${currentLive.currentMinute}'` : "চলমান"} • ভেন্যু: {currentLive.venueName || "পুঠিয়া পিএন হাই স্কুল মাঠ"}
                </span>
              ) : upcomingMatches.length > 0 ? (
                <span>
                  পরবর্তী ম্যাচ: {upcomingMatches[0].homeTeamName} বনাম {upcomingMatches[0].awayTeamName} ({upcomingMatches[0].matchDate})
                </span>
              ) : (
                <span>লাইভ স্কোর, সম্পূর্ণ ফিক্সচার, পয়েন্ট টেবিল, দলের তালিকা ও এইচডি ম্যাচ পোস্টার</span>
              )}
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <Link
              to="/football"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs md:text-sm transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <span>ফুটবল হাবে যান</span>
              <ChevronRight size={15} />
            </Link>

            {hasLive ? (
              <Link
                to="/football/live"
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs md:text-sm transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
              >
                <Radio size={14} className="animate-pulse" />
                <span>লাইভ স্কোর</span>
              </Link>
            ) : (
              <Link
                to="/football/posters"
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs md:text-sm transition-all border border-white/15 active:scale-95 flex items-center gap-1.5"
              >
                <span>ম্যাচ পোস্টার</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
