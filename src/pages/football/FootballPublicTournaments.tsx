import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, MapPin, ArrowLeft, Layers, Users } from 'lucide-react';
import { FootballTournament } from '../../types/football';
import { subscribeTournaments } from '../../services/footballService';
import SEO from '../../components/SEO';

export const FootballPublicTournaments: React.FC = () => {
  const [tournaments, setTournaments] = useState<FootballTournament[]>([]);

  useEffect(() => {
    const unsub = subscribeTournaments(setTournaments);
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SEO
        title="ফুটবল টুর্নামেন্ট তালিকা — আমাদের পুঠিয়া"
        description="পুঠিয়া উপজেলার সকল ফুটবল টুর্নামেন্টের বিবরণ, ফরম্যাট, নিয়মাবলী ও আয়োজক।"
      />

      <div className="bg-[#0B7A3B] text-white py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-2">
          <Link to="/football" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-100 hover:text-white">
            <ArrowLeft size={14} />
            <span>ফুটবল পোর্টালে ফিরুন</span>
          </Link>
          <h1 className="text-2xl font-black">সকল ফুটবল টুর্নামেন্ট (Tournaments Directory)</h1>
          <p className="text-xs text-emerald-100">চলমান ও আসন্ন প্রাইজ মানি ফুটবল টুর্নামেন্টসমূহ।</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tournaments.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-dashed">
              কোনো টুর্নামেন্ট পাওয়া যায়নি।
            </div>
          ) : (
            tournaments.map(t => (
              <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black">
                    সিজন {t.season}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    ফরম্যাট: {t.format === 'knockout' ? 'নকআউট' : 'লিগ'}
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 leading-snug">{t.name}</h3>
                <p className="text-xs text-slate-600 font-medium line-clamp-2">{t.description}</p>

                <div className="text-[11px] text-slate-500 font-bold space-y-1 pt-2 border-t border-slate-100">
                  <p className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-emerald-700" />
                    <span>{t.startDate} হতে {t.endDate}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-rose-500" />
                    <span>{t.venueName}, {t.venueAddress}</span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
