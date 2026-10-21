import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Palette,
  Download,
  Save,
  CheckCircle2,
  RefreshCw,
  Trophy,
  Sparkles,
  Layers,
  Calendar,
  Clock,
  MapPin,
  Shield,
  FileCheck2,
  Sliders
} from 'lucide-react';
import { FootballPosterConfig, FootballMatch, FootballTournament, PosterTemplateSize } from '../../../types/football';
import {
  subscribePosters,
  subscribeMatches,
  subscribeTournaments,
  savePoster,
  getPosters
} from '../../../services/footballService';
import { FootballPosterCanvas } from '../../../components/football/FootballPosterCanvas';

export const FootballBannerDesignerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const matchIdParam = searchParams.get('matchId');
  const posterIdParam = searchParams.get('posterId');

  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [tournaments, setTournaments] = useState<FootballTournament[]>([]);
  const [savedPosters, setSavedPosters] = useState<FootballPosterConfig[]>([]);

  const [currentConfig, setCurrentConfig] = useState<FootballPosterConfig>({
    id: '',
    tournamentId: '',
    matchId: '',
    size: 'banner_16_9',
    mottoText: '“খেলাধুলা সুস্থ দেহ, সুন্দর মন, গড়ে তোলে আগামীর স্বপ্ন”',
    curvedHeaderBanner: 'আদর্শ ও ঐতিহ্যবাহী',
    mainTitleText: 'প্রাইজ মানি ফুটবল টুর্নামেন্ট',
    subTitleText: 'মহিপাড়া ২০২৬ এর',
    matchRibbonText: 'দ্বিতীয় ম্যাচ',
    teamAName: 'নিউ ঈগল ফুটবল একাডেমি',
    teamALocation: 'হাট গোদাগাড়ী',
    teamBName: 'কিশোর কেলি ফুটবল একাডেমি',
    teamBLocation: 'মোহনপুর',
    dateText: '২২/১০/২০২৬',
    timeText: '৩ ঘটিকা',
    dayText: 'বৃহস্পতিবার',
    venueText: 'মহিপাড়া উচ্চ বিদ্যালয় মাঠ',
    venueSubText: 'দুর্গাপুর, রাজশাহী',
    organizerText: 'আয়োজনে: মহিপাড়া যুব সমাজ ও আদর্শ ক্রীড়া কল্যাণ পরিষদ',
    themeColor: 'emerald',
    backgroundStyle: 'stadium_night',
    status: 'published',
    version: 1,
    createdAt: null,
    updatedAt: null,
    createdBy: 'admin'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const unsubPosters = subscribePosters((list) => {
      setSavedPosters(list);
      if (posterIdParam) {
        const found = list.find(p => p.id === posterIdParam);
        if (found) setCurrentConfig(found);
      } else if (list.length > 0 && !currentConfig.id) {
        setCurrentConfig(list[0]);
      }
    });

    const unsubMatches = subscribeMatches((mList) => {
      setMatches(mList);
      if (matchIdParam) {
        const target = mList.find(m => m.id === matchIdParam);
        if (target) {
          applyMatchData(target);
        }
      }
    });

    const unsubTournaments = subscribeTournaments(setTournaments);

    return () => {
      unsubPosters();
      unsubMatches();
      unsubTournaments();
    };
  }, [matchIdParam, posterIdParam]);

  const applyMatchData = (m: FootballMatch) => {
    const trn = tournaments.find(t => t.id === m.tournamentId);
    setCurrentConfig(prev => ({
      ...prev,
      matchId: m.id,
      tournamentId: m.tournamentId,
      matchRibbonText: m.matchNumberText || `${m.matchNumber}ম ম্যাচ`,
      teamAName: m.homeTeamName.split(',')[0],
      teamALocation: m.homeTeamName.split(',')[1]?.trim() || '',
      teamBName: m.awayTeamName.split(',')[0],
      teamBLocation: m.awayTeamName.split(',')[1]?.trim() || '',
      dateText: m.matchDate,
      timeText: `${m.kickoffTime} ঘটিকা`,
      dayText: m.dayOfWeekBangla || 'বৃহস্পতিবার',
      venueText: m.venueName,
      venueSubText: m.venueAddress || trn?.venueAddress || 'দুর্গাপুর, রাজশাহী',
      mainTitleText: trn?.name ? (trn.name.includes('প্রাইজ মানি') ? 'প্রাইজ মানি ফুটবল টুর্নামেন্ট' : trn.name) : prev.mainTitleText
    }));
  };

  const handleSave = async (status: 'draft' | 'published' = 'published') => {
    try {
      setIsSaving(true);
      const id = await savePoster({
        ...currentConfig,
        status
      });
      setCurrentConfig(prev => ({ ...prev, id, status }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save poster config:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Designer Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Palette className="text-purple-600" size={20} />
            <span>অটোমেটেড ফুটবল ব্যানার ও পোস্টার ডিজাইনার (Poster Studio)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            রেফারেন্স পোস্টার ডিজাইন শৈলী অনুযায়ী হাই-রেজ্যুলেশন ফুটবল ম্যাচ ব্যানার ও সোশ্যাল পোস্ট প্রস্তুত করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              <span>সংরক্ষিত হয়েছে!</span>
            </span>
          )}

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave('draft')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            খসড়া সেভ
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave('published')}
            className="px-4 py-2 bg-[#0B7A3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'পোস্টার প্রকাশ করুন'}</span>
          </button>
        </div>
      </div>

      {/* Editor & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Match Sync Box */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-600" />
                <span>ম্যাচ ডেটা থেকে লোড করুন</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold">অটো-সিঙ্ক</span>
            </div>

            <select
              value={currentConfig.matchId || ''}
              onChange={(e) => {
                const match = matches.find(m => m.id === e.target.value);
                if (match) applyMatchData(match);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
            >
              <option value="">ম্যানুয়াল তথ্য অথবা ম্যাচ নির্বাচন করুন</option>
              {matches.map(m => (
                <option key={m.id} value={m.id}>
                  {m.matchNumberText || 'ম্যাচ'}: {m.homeTeamName} বনাম {m.awayTeamName} ({m.matchDate})
                </option>
              ))}
            </select>
          </div>

          {/* Size / Aspect Ratio Selector */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Sliders size={14} className="text-purple-600" />
              <span>পোস্টার সাইজ ও রেশিও নির্বাচন</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              {[
                { size: 'banner_16_9', label: '16:9 ব্যানার', desc: 'ওয়েবসাইট ব্যানার' },
                { size: 'social_landscape', label: '1200×630', desc: 'ফেসবুক ল্যান্ডস্কেপ' },
                { size: 'social_square', label: '1:1 স্কয়ার', desc: '১০৮০×১০৮০ পোস্ট' },
                { size: 'social_portrait', label: '৪:৫ পোর্ট্রেট', desc: '১০৮০×১৩৫০ পোস্ট' },
              ].map((s) => (
                <button
                  key={s.size}
                  type="button"
                  onClick={() => setCurrentConfig({ ...currentConfig, size: s.size as PosterTemplateSize })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    currentConfig.size === s.size
                      ? 'border-[#0B7A3B] bg-emerald-50/70 text-[#0B7A3B]'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="text-xs font-black">{s.label}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Text Content Inputs */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <span className="text-xs font-black text-slate-800">ব্যানারের লেখা ও তথ্য পরিবর্তন</span>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600">শীর্ষ মটো (Top Motto)</label>
                <input
                  type="text"
                  value={currentConfig.mottoText}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, mottoText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600">হলুদ কার্ভ টেক্সট</label>
                  <input
                    type="text"
                    value={currentConfig.curvedHeaderBanner}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, curvedHeaderBanner: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600">সবুজ রিবন টেক্সট</label>
                  <input
                    type="text"
                    value={currentConfig.subTitleText}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, subTitleText: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600">মূল টুর্নামেন্ট শিরোনাম (লাল রিবন)</label>
                <input
                  type="text"
                  value={currentConfig.mainTitleText}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, mainTitleText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600">ম্যাচ নম্বর রিবন (Match Ribbon)</label>
                <input
                  type="text"
                  value={currentConfig.matchRibbonText}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, matchRibbonText: e.target.value })}
                  placeholder="উদা: দ্বিতীয় ম্যাচ"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              {/* Team A & Team B Inputs */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-blue-700">টিম A নাম (হোম দল)</label>
                    <input
                      type="text"
                      value={currentConfig.teamAName}
                      onChange={(e) => setCurrentConfig({ ...currentConfig, teamAName: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-blue-700">টিম A এলাকা</label>
                    <input
                      type="text"
                      value={currentConfig.teamALocation || ''}
                      onChange={(e) => setCurrentConfig({ ...currentConfig, teamALocation: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-rose-700">টিম B নাম (অ্যাওয়ে দল)</label>
                    <input
                      type="text"
                      value={currentConfig.teamBName}
                      onChange={(e) => setCurrentConfig({ ...currentConfig, teamBName: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-rose-700">টিম B এলাকা</label>
                    <input
                      type="text"
                      value={currentConfig.teamBLocation || ''}
                      onChange={(e) => setCurrentConfig({ ...currentConfig, teamBLocation: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Date, Time, Day, Venue */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600">তারিখ</label>
                  <input
                    type="text"
                    value={currentConfig.dateText}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, dateText: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600">সময়</label>
                  <input
                    type="text"
                    value={currentConfig.timeText}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, timeText: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600">রোজ</label>
                  <input
                    type="text"
                    value={currentConfig.dayText}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, dayText: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600">মাঠ ও ভেন্যু</label>
                <input
                  type="text"
                  value={currentConfig.venueText}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, venueText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600">ভেন্যুর উপজেলা ও জেলা</label>
                <input
                  type="text"
                  value={currentConfig.venueSubText || ''}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, venueSubText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Poster Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <span>লাইভ রিয়েল-টাইম প্রিভিউ (Live Preview)</span>
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                যেকোনো পরিবর্তন সাথে সাথে প্রতিফলিত হয়
              </span>
            </div>

            {/* Poster Render Component */}
            <FootballPosterCanvas
              config={currentConfig}
              onExportSuccess={(url) => {
                // Keep URL updated
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
