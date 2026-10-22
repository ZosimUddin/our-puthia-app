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
  Sliders,
  Image,
  Upload,
  Copy,
  Trash2,
  Edit,
  Eye,
  Plus,
  Flame,
  Check,
  ChevronRight,
  Share2
} from 'lucide-react';
import { FootballPosterConfig, FootballMatch, FootballTournament, PosterTemplateSize } from '../../../types/football';
import {
  subscribePosters,
  subscribeMatches,
  subscribeTournaments,
  savePoster,
  deletePoster,
  getPosters
} from '../../../services/footballService';
import { FootballPosterCanvas } from '../../../components/football/FootballPosterCanvas';

// Pre-defined Design Presets matching local tournament styles
const DESIGN_PRESETS = [
  {
    id: 'mohipara_classic',
    name: 'মহিপাড়া ২০২৬ রেফারেন্স (মাস্টার টেমপ্লেট)',
    desc: 'হলুদ-লাল-সবুজ ৩ডি রিবন, ফ্লাডলাইট, ট্রফি ও ফায়ার ভিএস',
    themeColor: 'crimson' as const,
    vsStyle: 'fiery' as const,
    motto: '“খেলাধুলা সুস্থ দেহ, সুন্দর মন, গড়ে তোলে আগামীর স্বপ্ন”',
    headerBanner: 'আদর্শ ও ঐতিহ্যবাহী',
    mainTitle: 'প্রাইজ মানি ফুটবল টুর্নামেন্ট',
    subTitle: 'মহিপাড়া ২০২৬ এর',
    matchRibbon: 'দ্বিতীয় ম্যাচ',
    showTrophies: true,
    showBallAndPlayer: true,
    showMotto: true
  },
  {
    id: 'gold_cup_final',
    name: 'গোল্ড কাপ মেগা ফাইনাল',
    desc: 'রয়্যাল গোল্ডেন চ্যাম্পিয়নশিপ ফিনিশ ও ডাবল গোল্ড ট্রফি',
    themeColor: 'gold' as const,
    vsStyle: 'golden' as const,
    motto: '“মাদককে না বলুন, খেলাধুলাকে হ্যাঁ বলুন”',
    headerBanner: 'ঐতিহাসিক পুঠিয়া রাজবাড়ী কাপ',
    mainTitle: 'গ্র্যান্ড ফাইনাল ফুটবল ২০২৬',
    subTitle: 'চ্যাম্পিয়নশিপ ট্রফি ফাইট',
    matchRibbon: 'ফাইনাল ম্যাচ',
    showTrophies: true,
    showBallAndPlayer: true,
    showMotto: true
  },
  {
    id: 'night_showdown',
    name: 'নাইট ফ্লাডলাইট ডার্বি',
    desc: 'ঘন নীল স্টেডিয়াম, তীব্র ফ্লাডলাইট বিম ও ইলেকট্রিক নিয়ন ভিএস',
    themeColor: 'royal_blue' as const,
    vsStyle: 'neon' as const,
    motto: '“শক্তির লড়াই, মাঠের গর্জন”',
    headerBanner: 'পুঠিয়া প্রিমিয়ার ফুটবল',
    mainTitle: 'সুপার কাপ নকআউট ২০২৬',
    subTitle: 'রাত্রিকালীন মেগা শোডাউন',
    matchRibbon: 'প্রথম সেমিফাইনাল',
    showTrophies: true,
    showBallAndPlayer: true,
    showMotto: true
  },
  {
    id: 'green_arena',
    name: 'সবুজ মাঠ ঐতিহ্যবাহী টুর্নামেন্ট',
    desc: 'সবুজ ঘাসের গালিচা ও ঐতিহ্যবাহী ক্লাব ব্যাজ',
    themeColor: 'emerald' as const,
    vsStyle: 'fiery' as const,
    motto: '“একতাই বল, মাঠেই মিলবে বন্ধুত্ব”',
    headerBanner: 'উপজেলা ক্রীড়া সংস্থা পরিচালিত',
    mainTitle: 'স্বাধীনতা গোল্ডকাপ ফুটবল',
    subTitle: 'পুঠিয়া পিএন মাঠ ২০২৬',
    matchRibbon: '৩য় রাউন্ড',
    showTrophies: true,
    showBallAndPlayer: true,
    showMotto: true
  }
];

export const FootballBannerDesignerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const matchIdParam = searchParams.get('matchId');
  const posterIdParam = searchParams.get('posterId');

  // Active view tab: editor, preview, or gallery
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'gallery'>('editor');

  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [tournaments, setTournaments] = useState<FootballTournament[]>([]);
  const [savedPosters, setSavedPosters] = useState<FootballPosterConfig[]>([]);

  const DEFAULT_CONFIG: FootballPosterConfig = {
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
    teamALogoUrl: '',
    teamBName: 'কিশোর কেলি ফুটবল একাডেমি',
    teamBLocation: 'মোহনপুর',
    teamBLogoUrl: '',
    dateText: '২২/১০/২০২৬',
    timeText: '৩ ঘটিকা',
    dayText: 'বৃহস্পতিবার',
    venueText: 'মহিপাড়া উচ্চ বিদ্যালয় মাঠ',
    venueSubText: 'দুর্গাপুর, রাজশাহী',
    organizerText: 'আয়োজনে: মহিপাড়া যুব সমাজ ও আদর্শ ক্রীড়া কল্যাণ পরিষদ',
    themeColor: 'crimson',
    backgroundStyle: 'stadium_night',
    vsStyle: 'fiery',
    showTrophies: true,
    showBallAndPlayer: true,
    showMotto: true,
    status: 'published',
    version: 1,
    createdAt: null,
    updatedAt: null,
    createdBy: 'admin'
  };

  const [currentConfig, setCurrentConfig] = useState<FootballPosterConfig>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const unsubPosters = subscribePosters((list) => {
      setSavedPosters(list);
      if (posterIdParam) {
        const found = list.find(p => p.id === posterIdParam);
        if (found) {
          setCurrentConfig(found);
        }
      } else if (list.length > 0 && !currentConfig.id) {
        // If not editing an existing one, keep default or load first
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
      teamALogoUrl: m.homeTeamLogo || prev.teamALogoUrl,
      teamBName: m.awayTeamName.split(',')[0],
      teamBLocation: m.awayTeamName.split(',')[1]?.trim() || '',
      teamBLogoUrl: m.awayTeamLogo || prev.teamBLogoUrl,
      dateText: m.matchDate,
      timeText: `${m.kickoffTime} ঘটিকা`,
      dayText: m.dayOfWeekBangla || 'বৃহস্পতিবার',
      venueText: m.venueName,
      venueSubText: m.venueAddress || trn?.venueAddress || 'দুর্গাপুর, রাজশাহী',
      mainTitleText: trn?.name ? (trn.name.includes('প্রাইজ মানি') ? 'প্রাইজ মানি ফুটবল টুর্নামেন্ট' : trn.name) : prev.mainTitleText
    }));
  };

  const applyPreset = (preset: typeof DESIGN_PRESETS[0]) => {
    setCurrentConfig(prev => ({
      ...prev,
      mottoText: preset.motto,
      curvedHeaderBanner: preset.headerBanner,
      mainTitleText: preset.mainTitle,
      subTitleText: preset.subTitle,
      matchRibbonText: preset.matchRibbon,
      vsStyle: preset.vsStyle,
      showTrophies: preset.showTrophies,
      showBallAndPlayer: preset.showBallAndPlayer,
      showMotto: preset.showMotto,
      themeColor: preset.themeColor
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

  const handleCreateNew = () => {
    setCurrentConfig({
      ...DEFAULT_CONFIG,
      id: ''
    });
    setSearchParams({});
    setActiveTab('editor');
  };

  const handleLoadPoster = (poster: FootballPosterConfig) => {
    setCurrentConfig(poster);
    setSearchParams({ posterId: poster.id });
    setActiveTab('editor');
  };

  const handleDuplicatePoster = (poster: FootballPosterConfig) => {
    setCurrentConfig({
      ...poster,
      id: '',
      matchRibbonText: `${poster.matchRibbonText || 'ম্যাচ'} (কপি)`
    });
    setSearchParams({});
    setActiveTab('editor');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই ব্যানারটি মুছে ফেলতে চান?')) return;
    try {
      await deletePoster(id);
      if (currentConfig.id === id) {
        handleCreateNew();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Image Upload helper for Team Logos
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, team: 'A' | 'B') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (team === 'A') {
        setCurrentConfig(prev => ({ ...prev, teamALogoUrl: dataUrl }));
      } else {
        setCurrentConfig(prev => ({ ...prev, teamBLogoUrl: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Palette size={20} />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                অটোমেটেড ফুটবল ম্যাচ ব্যানার ডিজাইনার (Poster Studio)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                ফ্লাডলাইট, ট্রফি, স্টেডিয়াম, দুই দলের লোগো ও ফায়ার VS সহ হাই-রেজ্যুলেশন পোস্টার মেকার।
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCreateNew}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus size={14} />
            <span>নতুন ব্যানার</span>
          </button>

          {saveSuccess && (
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 animate-bounce">
              <CheckCircle2 size={14} />
              <span>সংরক্ষিত!</span>
            </span>
          )}

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave('draft')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            ড্রাফট সেভ
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave('published')}
            className="px-4 py-2 bg-[#0B7A3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save size={14} />
            <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ ও প্রকাশ'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Especially critical on mobile phones) */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('editor')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'editor'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders size={14} />
          <span>ডিজাইন এডিটর</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'preview'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eye size={14} />
          <span>লাইভ প্রিভিউ ও ডাউনলোড</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gallery')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'gallery'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers size={14} />
          <span>সংরক্ষিত ({savedPosters.length})</span>
        </button>
      </div>

      {/* Main Studio Body */}
      {activeTab === 'gallery' ? (
        /* ========================================================================= */
        /* SAVED POSTERS GALLERY & RE-EDITING MANAGEMENT                             */
        /* ========================================================================= */
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Layers size={16} className="text-blue-600" />
                <span>তৈরি করা ব্যানারসমূহ (সংরক্ষিত ও পরে সম্পাদনাযোগ্য)</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                যেকোনো ব্যানার নির্বাচন করে পুনরায় এডিট, ডুপ্লিকেট অথবা ডাউনলোড করতে পারবেন।
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreateNew}
              className="px-3.5 py-1.5 bg-[#0B7A3B] text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={14} />
              <span>নতুন তৈরি করুন</span>
            </button>
          </div>

          {savedPosters.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Palette size={32} className="mx-auto text-slate-300" />
              <p className="text-xs font-bold">এখনও কোনো ব্যানার সংরক্ষণ করা হয়নি।</p>
              <p className="text-[11px] text-slate-400">এডিটরে তথ্য লিখে 'সংরক্ষণ' বাটনে ক্লিক করুন।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedPosters.map((poster) => (
                <div
                  key={poster.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    currentConfig.id === poster.id
                      ? 'border-[#0B7A3B] bg-emerald-50/30 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {poster.matchRibbonText || 'ম্যাচ'}
                      </span>
                      <h4 className="text-xs font-black text-slate-900 mt-1 line-clamp-1">
                        {poster.mainTitleText}
                      </h4>
                      <p className="text-[11px] text-slate-600 font-bold mt-0.5">
                        {poster.teamAName} <span className="text-red-600 font-black">VS</span> {poster.teamBName}
                      </p>
                    </div>

                    <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                      v{poster.version || 1}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 font-medium flex items-center justify-between border-t border-slate-100 pt-2">
                    <span>📅 {poster.dateText} ({poster.timeText})</span>
                    <span>📍 {poster.venueText?.split(' ')[0]}</span>
                  </div>

                  {/* Actions for this saved poster */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleLoadPoster(poster)}
                      className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer"
                      title="এই ব্যানারটি এডিটরে খুলুন"
                    >
                      <Edit size={12} />
                      <span>সম্পাদনা</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicatePoster(poster)}
                      className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                      title="অনুরূপ ব্যানার তৈরি করতে কপি করুন"
                    >
                      <Copy size={12} />
                      <span>ডুপ্লিকেট</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(poster.id)}
                      className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[11px] font-bold flex items-center justify-center transition-all cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* STUDIO EDITOR & LIVE PREVIEW GRID (Side-by-side or responsive)            */
        /* ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Controls (Hidden on mobile if tab is 'preview') */}
          <div className={`space-y-4 ${activeTab === 'preview' ? 'hidden lg:block lg:col-span-5' : 'lg:col-span-5'}`}>
            
            {/* 1. Quick Presets Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                <span>রেডিমেড ডিজাইন টেমপ্লেট ও কালার প্রিসেট</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DESIGN_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all cursor-pointer group active:scale-98"
                  >
                    <p className="text-xs font-black text-slate-900 group-hover:text-[#0B7A3B]">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Match Sync from Database */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Calendar size={14} className="text-blue-600" />
                  <span>সিডিউল করা ম্যাচ থেকে স্বয়ংক্রিয় পূরণ</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ১-ক্লিক অটোফিল
                </span>
              </div>

              <select
                value={currentConfig.matchId || ''}
                onChange={(e) => {
                  const match = matches.find(m => m.id === e.target.value);
                  if (match) applyMatchData(match);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none bg-slate-50 focus:bg-white focus:border-emerald-500"
              >
                <option value="">ম্যানুয়াল তথ্য অথবা ম্যাচ নির্বাচন করুন...</option>
                {matches.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.matchNumberText || 'ম্যাচ'}: {m.homeTeamName} বনাম {m.awayTeamName} ({m.matchDate})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Poster Dimensions / Ratio */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Sliders size={14} className="text-purple-600" />
                <span>পোস্টার সাইজ ও রেশিও</span>
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
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      currentConfig.size === s.size
                        ? 'border-[#0B7A3B] bg-emerald-50/70 text-[#0B7A3B] ring-1 ring-emerald-400'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <p className="text-xs font-black">{s.label}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Text & Header Ribbons */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <span className="text-xs font-black text-slate-800">⚽ টুর্নামেন্ট ও রিবন কনটেন্ট</span>

              <div className="space-y-2.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-600">শীর্ষ বাণী / মটো</label>
                    <label className="flex items-center gap-1 text-[10px] text-slate-500 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentConfig.showMotto !== false}
                        onChange={(e) => setCurrentConfig({ ...currentConfig, showMotto: e.target.checked })}
                      />
                      <span>দেখান</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={currentConfig.mottoText}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, mottoText: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-amber-700">হলুদ কার্ভ টেক্সট</label>
                    <input
                      type="text"
                      value={currentConfig.curvedHeaderBanner}
                      onChange={(e) => setCurrentConfig({ ...currentConfig, curvedHeaderBanner: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-emerald-700">সবুজ রিবন টেক্সট</label>
                    <input
                      type="text"
                      value={currentConfig.subTitleText}
                      onChange={(e) => setCurrentConfig({ ...currentConfig, subTitleText: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-rose-700">মূল শিরোনাম (লাল ৩ডি রিবন)</label>
                  <input
                    type="text"
                    value={currentConfig.mainTitleText}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, mainTitleText: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-red-800">ম্যাচ নম্বর রিবন</label>
                  <input
                    type="text"
                    value={currentConfig.matchRibbonText}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, matchRibbonText: e.target.value })}
                    placeholder="উদা: দ্বিতীয় ম্যাচ / ফাইনাল"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 5. Team A & Team B Management */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <span className="text-xs font-black text-slate-800">🛡️ দল ও লোগো নির্ধারণ</span>

              {/* Team A (Home) */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-900">দল ১ (হোম দল - নীল থিম)</span>
                  <label className="text-[10px] font-black text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200 cursor-pointer flex items-center gap-1">
                    <Upload size={10} />
                    <span>লোগো আপলোড</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLogoUpload(e, 'A')}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="দলের নাম"
                    value={currentConfig.teamAName}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, teamAName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-bold outline-none"
                  />
                  <input
                    type="text"
                    placeholder="এলাকা / থানা"
                    value={currentConfig.teamALocation || ''}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, teamALocation: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-bold outline-none"
                  />
                </div>
              </div>

              {/* Team B (Away) */}
              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-900">দল ২ (অ্যাওয়ে দল - লাল থিম)</span>
                  <label className="text-[10px] font-black text-rose-700 bg-white px-2 py-0.5 rounded-md border border-rose-200 cursor-pointer flex items-center gap-1">
                    <Upload size={10} />
                    <span>লোগো আপলোড</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLogoUpload(e, 'B')}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="দলের নাম"
                    value={currentConfig.teamBName}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, teamBName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-bold outline-none"
                  />
                  <input
                    type="text"
                    placeholder="এলাকা / থানা"
                    value={currentConfig.teamBLocation || ''}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, teamBLocation: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 6. VS Design & Graphic Elements Toggle */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <span className="text-xs font-black text-slate-800">🔥 VS ও গ্রাফিক্স স্টাইল</span>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'fiery', label: '🔥 ফায়ার ও স্পার্ক', desc: 'রেফারেন্স পোস্টার' },
                  { id: 'neon', label: '⚡ ইলেকট্রিক নিয়ন', desc: 'আধুনিক থান্ডার' },
                  { id: 'golden', label: '👑 মেটালিক গোল্ড', desc: 'রয়্যাল চ্যাম্পিয়ন' },
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setCurrentConfig({ ...currentConfig, vsStyle: v.id as any })}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      currentConfig.vsStyle === v.id
                        ? 'border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-400 font-black'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-[11px] font-black">{v.label}</p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentConfig.showTrophies !== false}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, showTrophies: e.target.checked })}
                  />
                  <span>🏆 দুই পাশে ট্রফি</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentConfig.showBallAndPlayer !== false}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, showBallAndPlayer: e.target.checked })}
                  />
                  <span>⚽ ফুটবল ও প্লেয়ার</span>
                </label>
              </div>
            </div>

            {/* 7. Date, Time, Day, Venue */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <span className="text-xs font-black text-slate-800">📅 তারিখ, সময় ও ভেন্যু</span>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-red-700">তারিখ</label>
                  <input
                    type="text"
                    value={currentConfig.dateText}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, dateText: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-teal-700">সময়</label>
                  <input
                    type="text"
                    value={currentConfig.timeText}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, timeText: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-purple-700">রোজ (বার)</label>
                  <input
                    type="text"
                    value={currentConfig.dayText}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, dayText: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600">মাঠের নাম (ভেন্যু)</label>
                  <input
                    type="text"
                    value={currentConfig.venueText}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, venueText: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-600">উপজেলা ও জেলা</label>
                  <input
                    type="text"
                    value={currentConfig.venueSubText || ''}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, venueSubText: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Poster Preview (Always shown on desktop, shown on mobile when tab is 'preview') */}
          <div className={`space-y-4 ${activeTab === 'editor' ? 'hidden lg:block lg:col-span-7' : 'lg:col-span-7'}`}>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 sticky top-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                    <Sparkles size={16} />
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      লাইভ রিয়েল-টাইম প্রিভিউ (Live Preview)
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      সব পরিবর্তন লাইভ আপডেট হচ্ছে
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSave('published')}
                    className="px-3 py-1.5 bg-[#0B7A3B] hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <Save size={13} />
                    <span>সেভ</span>
                  </button>
                </div>
              </div>

              {/* The Interactive Poster Canvas */}
              <FootballPosterCanvas
                config={currentConfig}
                onExportSuccess={() => {
                  // Export callback
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
