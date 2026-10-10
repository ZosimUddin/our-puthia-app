import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Globe, Sparkles, Download, Share2, Search, Check, X, Camera, 
  RotateCcw, Compass, Map, Trophy, Calendar, Info, Layers, ChevronRight,
  ArrowLeft, Palette, FileText, CheckCircle2, Bookmark, Lightbulb, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import Header from '../../../components/home/Header';
import Footer from '../../../components/home/Footer';
import BottomNavigation from '../../../components/home/BottomNavigation';
import { Sidebar } from '../../../components/Sidebar';
import { useAuth } from '../../../contexts/AuthContext';
import { BANGLADESH_DIVISIONS, ALL_DISTRICTS, MAP_THEMES, DistrictInfo } from '../../../data/bangladeshDistricts';
import { WORLD_CONTINENTS, ALL_WORLD_COUNTRIES } from '../../../data/worldCountries';
import { BangladeshMapSVG } from './BangladeshMapSVG';
import { WorldMapSVG } from './WorldMapSVG';
import { travelMapService } from '../../../services/travelMapService';
import toast from 'react-hot-toast';

type ActiveTab = 'my-map' | 'world-map' | 'destinations' | 'quiz' | 'planner' | 'hidden-gems';

export const TravelMapPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('my-map');

  // Selected Districts Array
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('user_travel_districts');
      return saved ? JSON.parse(saved) : ['rajshahi', 'dhaka', 'chattogram', 'coxsbazar'];
    } catch {
      return ['rajshahi', 'dhaka', 'chattogram', 'coxsbazar'];
    }
  });

  // Selected World Countries Array
  const [selectedWorldCountries, setSelectedWorldCountries] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('user_travel_world_countries');
      return saved ? JSON.parse(saved) : ['bangladesh'];
    } catch {
      return ['bangladesh'];
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [worldSearchQuery, setWorldSearchQuery] = useState('');
  const [activeTheme, setActiveTheme] = useState(MAP_THEMES[0]);
  const [showLabels, setShowLabels] = useState(true);

  // Customization
  const [userName, setUserName] = useState(user?.displayName || '');
  const [userPhoto, setUserPhoto] = useState<string | null>(user?.photoURL || null);

  // Global live user counter
  const [globalCounter, setGlobalCounter] = useState(100);
  const [isDownloading, setIsDownloading] = useState(false);

  // Quiz state
  const [quizScore, setQuizScore] = useState(0);
  const [quizQuestionIdx, setQuizQuestionIdx] = useState(0);

  // Trip planner state
  const [plannerDestination, setPlannerDestination] = useState('');
  const [plannerDays, setPlannerDays] = useState(3);
  const [plannerBudget, setPlannerBudget] = useState(5000);
  const [savedPlans, setSavedPlans] = useState<{ id: string; dest: string; days: number; budget: number }[]>([]);

  useEffect(() => {
    // Subscribe to live Firestore stats
    const unsubscribe = travelMapService.subscribeStats((stats) => {
      setGlobalCounter(stats.totalUsersCount);
    });

    // Auto-increment live usage counter in Firestore once per session
    if (!sessionStorage.getItem('map_visit_counted')) {
      sessionStorage.setItem('map_visit_counted', 'true');
      travelMapService.incrementMapCounter().catch(() => {});
    }

    return () => unsubscribe();
  }, []);

  // Real-time Firestore Sync for logged-in user
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = travelMapService.subscribeUserMap(user.uid, (data) => {
      if (data) {
        if (data.selectedDistricts) setSelectedDistricts(data.selectedDistricts);
        if (data.selectedWorldCountries) setSelectedWorldCountries(data.selectedWorldCountries);
        if (data.userName) setUserName(data.userName);
        if (data.userPhoto) setUserPhoto(data.userPhoto);
        if (typeof data.showLabels === 'boolean') setShowLabels(data.showLabels);
        if (data.themeId) {
          const matched = MAP_THEMES.find(t => t.id === data.themeId);
          if (matched) setActiveTheme(matched);
        }
      }
    });
    return () => unsub();
  }, [user?.uid]);

  // Save changes to Firestore and localStorage in real-time
  const saveRealtimeMapState = (
    districts: string[], 
    worldCountries: string[],
    themeId: string, 
    nameStr: string, 
    photoStr: string | null, 
    labelsBool: boolean
  ) => {
    try {
      localStorage.setItem('user_travel_districts', JSON.stringify(districts));
      localStorage.setItem('user_travel_world_countries', JSON.stringify(worldCountries));
    } catch {}

    if (user?.uid) {
      travelMapService.saveUserMap({
        userId: user.uid,
        selectedDistricts: districts,
        selectedWorldCountries: worldCountries,
        themeId,
        userName: nameStr,
        userPhoto: photoStr || undefined,
        showLabels: labelsBool
      }).catch(() => {});
    }
  };

  // District Selection Handlers
  const toggleDistrict = (id: string) => {
    const next = selectedDistricts.includes(id) 
      ? selectedDistricts.filter(d => d !== id) 
      : [...selectedDistricts, id];
    setSelectedDistricts(next);
    saveRealtimeMapState(next, selectedWorldCountries, activeTheme.id, userName, userPhoto, showLabels);
  };

  const selectAllDistricts = () => {
    const all = ALL_DISTRICTS.map(d => d.id);
    setSelectedDistricts(all);
    saveRealtimeMapState(all, selectedWorldCountries, activeTheme.id, userName, userPhoto, showLabels);
    toast.success('সব ৬৪টি জেলা নির্বাচিত করা হয়েছে!');
  };

  const clearAllDistricts = () => {
    setSelectedDistricts([]);
    saveRealtimeMapState([], selectedWorldCountries, activeTheme.id, userName, userPhoto, showLabels);
    toast('সকল জেলা সিলেকশন মুছে ফেলা হয়েছে', { icon: '🧹' });
  };

  const selectDivisionDistricts = (divisionId: string) => {
    const div = BANGLADESH_DIVISIONS.find(d => d.id === divisionId);
    if (!div) return;
    const divDistrictIds = div.districts.map(d => d.id);
    const allSelected = divDistrictIds.every(id => selectedDistricts.includes(id));

    let next: string[];
    if (allSelected) {
      next = selectedDistricts.filter(id => !divDistrictIds.includes(id));
    } else {
      next = Array.from(new Set([...selectedDistricts, ...divDistrictIds]));
    }
    setSelectedDistricts(next);
    saveRealtimeMapState(next, selectedWorldCountries, activeTheme.id, userName, userPhoto, showLabels);
  };

  // World Country Selection Handlers
  const toggleWorldCountry = (id: string) => {
    const next = selectedWorldCountries.includes(id)
      ? selectedWorldCountries.filter(c => c !== id)
      : [...selectedWorldCountries, id];
    setSelectedWorldCountries(next);
    saveRealtimeMapState(selectedDistricts, next, activeTheme.id, userName, userPhoto, showLabels);
  };

  const selectAllCountriesInContinent = (continentId: string) => {
    const cont = WORLD_CONTINENTS.find(c => c.id === continentId);
    if (!cont) return;
    const countryIds = cont.countries.map(c => c.id);
    const allSelected = countryIds.every(id => selectedWorldCountries.includes(id));

    let next: string[];
    if (allSelected) {
      next = selectedWorldCountries.filter(id => !countryIds.includes(id));
    } else {
      next = Array.from(new Set([...selectedWorldCountries, ...countryIds]));
    }
    setSelectedWorldCountries(next);
    saveRealtimeMapState(selectedDistricts, next, activeTheme.id, userName, userPhoto, showLabels);
  };

  const clearAllWorldCountries = () => {
    setSelectedWorldCountries([]);
    saveRealtimeMapState(selectedDistricts, [], activeTheme.id, userName, userPhoto, showLabels);
    toast('সকল দেশ সিলেকশন মুছে ফেলা হয়েছে', { icon: '🧹' });
  };

  // Image & Photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserPhoto(reader.result as string);
        toast.success('ছবি সফলভাবে যুক্ত করা হয়েছে!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Export & Download
  const downloadMap = async (format: 'png' | 'jpg' | 'pdf') => {
    const element = document.getElementById('bangladesh-map-canvas');
    if (!element) return;
    setIsDownloading(true);
    toast.loading('ম্যাপ প্রসেস ও ডাউনলোড করা হচ্ছে...', { id: 'dl' });

    try {
      // Increment global counter in Firestore
      travelMapService.incrementMapCounter().catch(() => {});

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: activeTheme.bg
      });

      if (format === 'png' || format === 'jpg') {
        const image = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 1.0);
        const link = document.createElement('a');
        link.download = `bangladesh-travel-map-${userName || 'user'}.${format}`;
        link.href = image;
        link.click();
        toast.success(`ম্যাপ ${format.toUpperCase()} ফরম্যাটে ডাউনলোড সম্পন্ন!`, { id: 'dl' });
      } else if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
        pdf.save(`bangladesh-travel-map-${userName || 'user'}.pdf`);
        toast.success('ম্যাপ PDF ডকুমেন্ট হিসেবে সেভ করা হয়েছে!', { id: 'dl' });
      }
    } catch {
      toast.error('ডাউনলোড করতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন', { id: 'dl' });
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadWorldMap = async (format: 'png' | 'jpg' | 'pdf') => {
    const element = document.getElementById('world-map-canvas');
    if (!element) return;
    setIsDownloading(true);
    toast.loading('বিশ্ব ম্যাপ প্রসেস ও ডাউনলোড করা হচ্ছে...', { id: 'dl-world' });

    try {
      travelMapService.incrementMapCounter().catch(() => {});

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: activeTheme.bg
      });

      if (format === 'png' || format === 'jpg') {
        const image = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 1.0);
        const link = document.createElement('a');
        link.download = `world-travel-map-${userName || 'user'}.${format}`;
        link.href = image;
        link.click();
        toast.success(`বিশ্ব ম্যাপ ${format.toUpperCase()} ফরম্যাটে ডাউনলোড সম্পন্ন!`, { id: 'dl-world' });
      } else if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
        pdf.save(`world-travel-map-${userName || 'user'}.pdf`);
        toast.success('বিশ্ব ম্যাপ PDF ডাউনলোড সম্পন্ন!', { id: 'dl-world' });
      }
    } catch (err) {
      toast.error('ডাউনলোড করার সময় সমস্যা হয়েছে', { id: 'dl-world' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareMap = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'আমার বাংলাদেশ ভ্রমণ ম্যাপ - আমাদের পুঠিয়া',
          text: `আমি বাংলাদেশের ৬৪টি জেলার মধ্যে ${selectedDistricts.length}টি জেলা ভ্রমণ করেছি! আপনি কতটি জেলা ঘুরেছেন?`,
          url: window.location.href
        });
      } catch {
        // Fallback copy
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('লিংক কপি করা হয়েছে!');
    }
  };

  // Filtered districts
  const filteredDivisions = BANGLADESH_DIVISIONS.map(division => ({
    ...division,
    districts: division.districts.filter(d => 
      d.nameBn.includes(searchQuery) || 
      d.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(div => div.districts.length > 0);

  // Quiz Data
  const quizQuestions = [
    {
      q: 'বিশ্বের দীর্ঘতম প্রাকৃতিক বালুকাময় সমুদ্র সৈকত কোনটি?',
      options: ['পতেঙ্গা সমুদ্র সৈকত', 'কুয়াকাটা সমুদ্র সৈকত', 'কক্সবাজার সমুদ্র সৈকত', 'শুভ সন্ধ্যা সৈকত'],
      answer: 2
    },
    {
      q: 'ষাট গম্বুজ মসজিদ বাংলাদেশের কোন জেলায় অবস্থিত?',
      options: ['খুলনা', 'বাগেরহাট', 'যশোর', 'সাতক্ষীরা'],
      answer: 1
    },
    {
      q: 'ঐতিহাসিক পুঠিয়া রাজবাড়ি এবং শিব মন্দির কোন জেলায় অবস্থিত?',
      options: ['রাজশাহী', 'নাটোর', 'পাবনা', 'বগুড়া'],
      answer: 0
    },
    {
      q: 'টাঙ্গুয়ার হাওর কোন জেলায় অবস্থিত?',
      options: ['সিলেট', 'সুনামগঞ্জ', 'মৌলভীবাজার', 'হবিগঞ্জ'],
      answer: 1
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Header user={user} onMenuClick={() => setIsSidebarOpen(true)} onSearch={() => {}} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={(p) => { setIsSidebarOpen(false); navigate(p.startsWith('/') ? p : `/${p}`); }} />

      <main className="flex-1 pb-24">
        {/* Navigation Tabs Bar */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 py-2.5 overflow-x-auto no-scrollbar shadow-xs">
          <div className="flex items-center gap-2 max-w-4xl mx-auto min-w-max">
            <button
              onClick={() => setActiveTab('my-map')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'my-map' 
                  ? 'bg-[#009664] text-white shadow-md shadow-emerald-600/20' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Map size={16} />
              <span>আমার ম্যাপ</span>
            </button>

            <button
              onClick={() => setActiveTab('world-map')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'world-map' 
                  ? 'bg-[#009664] text-white shadow-md shadow-emerald-600/20' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Globe size={16} />
              <span>বিশ্ব ম্যাপ</span>
            </button>

            <button
              onClick={() => setActiveTab('destinations')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'destinations' 
                  ? 'bg-[#009664] text-white shadow-md shadow-emerald-600/20' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Compass size={16} />
              <span>কোথায় ঘুরবেন</span>
            </button>

            <button
              onClick={() => setActiveTab('quiz')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'quiz' 
                  ? 'bg-[#009664] text-white shadow-md shadow-emerald-600/20' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Trophy size={16} />
              <span>খেলা</span>
            </button>

            <button
              onClick={() => setActiveTab('planner')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'planner' 
                  ? 'bg-[#009664] text-white shadow-md shadow-emerald-600/20' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Calendar size={16} />
              <span>ট্রিপ প্ল্যানার</span>
            </button>

            <button
              onClick={() => setActiveTab('hidden-gems')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'hidden-gems' 
                  ? 'bg-[#009664] text-white shadow-md shadow-emerald-600/20' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Sparkles size={16} />
              <span>লুকানো রত্ন</span>
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-5">
          {/* TAB 1: MY MAP (আমার ম্যাপ) */}
          {activeTab === 'my-map' && (
            <div className="space-y-6">
              {/* Hero Banner Header */}
              <div className="relative rounded-[28px] overflow-hidden bg-gradient-to-br from-[#01412F] via-[#009664] to-[#047857] p-6 text-white shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-black text-emerald-100 mb-3 border border-white/20">
                    <Sparkles size={14} className="text-amber-300" />
                    <span>৬৪ জেলা • ৮ বিভাগ ভ্রমণ ট্র্যাকার</span>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-black leading-tight mb-2">
                    বাংলাদেশের কতটুকু ঘুরে দেখেছেন?
                  </h1>
                  <p className="text-xs md:text-sm font-bold text-emerald-100/90 leading-relaxed max-w-xl mb-4">
                    যে জেলাগুলোতে গিয়েছেন সেগুলো বেছে নিন, পছন্দের রঙের থিম দিন, আর ডাউনলোড করুন আপনার ভ্রমণের সুন্দর একটি ম্যাপ।
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button 
                      onClick={() => {
                        const el = document.getElementById('district-selection-section');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-5 py-2.5 rounded-2xl bg-white text-[#01412F] text-xs font-black hover:bg-amber-300 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <span>জেলা বাছাই শুরু করুন ↓</span>
                    </button>

                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-black/20 backdrop-blur-md text-[11px] font-black text-emerald-100 border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>{globalCounter.toLocaleString('bn-BD')} জন ইতিমধ্যে এই ম্যাপ ব্যবহার করেছেন</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Split: Left Checklist, Right Live Map */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Controls & District Checklist (7 cols) */}
                <div id="district-selection-section" className="lg:col-span-7 space-y-5">
                  
                  {/* Search and Bulk Actions */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                        <MapPin size={18} className="text-[#009664]" />
                        <span>যেসব জেলায় গিয়েছি</span>
                      </h2>
                      <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-50 text-[#009664] border border-emerald-100">
                        {selectedDistricts.length} / ৬৪ জেলা
                      </span>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="জেলা খুঁজুন..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#009664] focus:bg-white transition-all"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button 
                        onClick={selectAllDistricts}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-[#009664] text-slate-700 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 border border-slate-200/60"
                      >
                        <Check size={14} />
                        <span>সব বাছাই করুন</span>
                      </button>
                      <button 
                        onClick={clearAllDistricts}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 border border-slate-200/60"
                      >
                        <RotateCcw size={14} />
                        <span>সব মুছুন</span>
                      </button>
                    </div>
                  </div>

                  {/* Divisions & Districts Checklist */}
                  <div className="space-y-4">
                    {filteredDivisions.map((division) => {
                      const divDistrictIds = division.districts.map(d => d.id);
                      const visitedInDiv = divDistrictIds.filter(id => selectedDistricts.includes(id)).length;
                      const isAllDivSelected = divDistrictIds.length > 0 && visitedInDiv === divDistrictIds.length;

                      return (
                        <div key={division.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
                          {/* Division Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-black text-slate-800">{division.nameBn}</h3>
                              <span className="text-[10px] font-bold text-slate-400">
                                {visitedInDiv}/{division.districts.length}
                              </span>
                            </div>
                            <button 
                              onClick={() => selectDivisionDistricts(division.id)}
                              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                                isAllDivSelected 
                                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                                  : 'bg-emerald-50 text-[#009664] hover:bg-emerald-100'
                              }`}
                            >
                              {isAllDivSelected ? 'বিভাগ বাতিল' : 'সব বাছাই'}
                            </button>
                          </div>

                          {/* Districts Pills Grid */}
                          <div className="flex flex-wrap gap-1.5">
                            {division.districts.map((district) => {
                              const isSelected = selectedDistricts.includes(district.id);
                              return (
                                <button
                                  key={district.id}
                                  onClick={() => toggleDistrict(district.id)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                                    isSelected 
                                      ? 'bg-[#009664] text-white border-[#009664] shadow-xs' 
                                      : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:border-slate-300 hover:bg-slate-100'
                                  }`}
                                >
                                  {isSelected && <Check size={12} strokeWidth={3} />}
                                  <span>{district.nameBn}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Map Styling Controls */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Palette size={16} className="text-[#009664]" />
                      <span>ম্যাপ কাস্টমাইজেশন ও থিম</span>
                    </h3>

                    {/* Color Themes */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 mb-2 block">থিম সিলেক্ট করুন:</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {MAP_THEMES.map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => setActiveTheme(theme)}
                            className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                              activeTheme.id === theme.id 
                                ? 'border-[#009664] bg-emerald-50/50 shadow-xs' 
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: theme.primary }}></span>
                            <span className="text-[11px] font-bold text-slate-700 truncate">{theme.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Personalization Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 mb-1 block">আপনার নাম (ঐচ্ছিক):</label>
                        <input 
                          type="text" 
                          placeholder="আপনার নাম লিখুন..."
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#009664]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 mb-1 block">আপনার ছবি (ঐচ্ছিক):</label>
                        <label className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 transition-all">
                          <Camera size={14} className="text-[#009664]" />
                          <span className="truncate">{userPhoto ? 'ছবি পরিবর্তন করুন' : 'ছবি যোগ করুন'}</span>
                          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        </label>
                      </div>
                    </div>

                    {/* Label Toggle */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-bold text-slate-700">জেলার নাম প্রদর্শন করুন</span>
                      <button 
                        type="button"
                        role="switch"
                        aria-checked={showLabels}
                        onClick={() => {
                          const nextVal = !showLabels;
                          setShowLabels(nextVal);
                          saveRealtimeMapState(selectedDistricts, selectedWorldCountries, activeTheme.id, userName, userPhoto, nextVal);
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${showLabels ? 'bg-[#009664]' : 'bg-slate-300'}`}
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${showLabels ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>

                </div>

                {/* Right Interactive Live Map Preview & Download Options (5 cols) */}
                <div className="lg:col-span-5 space-y-5">
                  
                  {/* Live Interactive Map Display */}
                  <BangladeshMapSVG 
                    selectedDistrictIds={selectedDistricts}
                    themeColor={activeTheme.primary}
                    themeBg={activeTheme.bg}
                    themeText={activeTheme.text}
                    showLabels={showLabels}
                    onDistrictClick={toggleDistrict}
                    userName={userName}
                    userPhoto={userPhoto || undefined}
                  />

                  {/* Download & Export Action Box */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
                    <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Download size={16} className="text-[#009664]" />
                      <span>আপনার ভ্রমণ ম্যাপ ডাউনলোড করুন</span>
                    </h3>

                    <p className="text-[11px] font-bold text-slate-500 leading-snug">
                      ফেসবুক, ইনস্টাগ্রাম বা হোয়াটসঅ্যাপে শেয়ার করার জন্য হাই-রেজুলেশন ইমেজে ডাউনলোড করুন।
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        onClick={() => downloadMap('png')}
                        disabled={isDownloading}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                      >
                        <span>↓ PNG</span>
                      </button>

                      <button
                        onClick={() => downloadMap('jpg')}
                        disabled={isDownloading}
                        className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                      >
                        <span>↓ JPG</span>
                      </button>

                      <button
                        onClick={() => downloadMap('pdf')}
                        disabled={isDownloading}
                        className="py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                      >
                        <span>↓ PDF</span>
                      </button>
                    </div>

                    <button
                      onClick={handleShareMap}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-200"
                    >
                      <Share2 size={14} className="text-[#009664]" />
                      <span>ম্যাপ লিংক শেয়ার করুন</span>
                    </button>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* TAB 2: WORLD MAP (বিশ্ব ম্যাপ) */}
          {activeTab === 'world-map' && (
            <div className="space-y-6">
              
              {/* 1. Hero Banner matching Image 2 */}
              <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-slate-900 to-teal-950/90 pointer-events-none" />
                <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                  <Globe size={320} className="text-white" />
                </div>

                <div className="relative z-10 max-w-2xl space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-black border border-white/10">
                    <Globe size={14} />
                    <span>১৯৪টি দেশ • ৬ মহাদেশ</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    পৃথিবীর কতটুকু ঘুরে দেখেছেন?
                  </h1>

                  <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed">
                    যেসব দেশে গিয়েছেন সেগুলো বেছে নিন, পছন্দের রঙের থিম দিন, আর ডাউনলোড করুন আপনার বিশ্ব ভ্রমণের সুন্দর একটি ম্যাপ।
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        const el = document.getElementById('world-country-list');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-5 py-2.5 rounded-2xl bg-white text-slate-900 hover:bg-emerald-400 font-black text-xs sm:text-sm shadow-lg transition-all cursor-pointer flex items-center gap-2"
                    >
                      <span>দেশ বাছাই শুরু করুন ↓</span>
                    </button>

                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-xs font-bold text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span><b>{(46800 + globalCounter).toLocaleString('bn-BD')} জন</b> ইতিমধ্যে এই ম্যাপ ব্যবহার করছেন</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-white/10 text-[11px] font-bold text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black text-[10px]">১</span>
                      <span>দেশ বাছাই করুন</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black text-[10px]">২</span>
                      <span>থিম বেছে নিন</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black text-[10px]">৩</span>
                      <span>PNG, JPG বা PDF ডাউনলোড করুন</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Main World Travel Tracker Section */}
              <div id="world-country-list" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Controls & Country Selection (7 cols) */}
                <div className="lg:col-span-7 space-y-5">
                  
                  {/* Header & Search */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="text-base font-black text-slate-800">যেসব দেশে গিয়েছি</h2>
                        <p className="text-xs font-bold text-slate-400">দেশগুলোর উপর ক্লিক করে ট্র্যাকিং আনলক করুন</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#009664] font-black text-xs border border-emerald-200">
                        {selectedWorldCountries.length}/১৯৪
                      </span>
                    </div>

                    {/* Search & Clear */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text"
                          placeholder="দেশ খুঁজুন (বাংলা বা English)..."
                          value={worldSearchQuery}
                          onChange={(e) => setWorldSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#009664] focus:bg-white transition-all"
                        />
                        {worldSearchQuery && (
                          <button onClick={() => setWorldSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      <button 
                        onClick={clearAllWorldCountries}
                        className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-black transition-all cursor-pointer flex items-center gap-1 border border-slate-200/60 shrink-0"
                      >
                        <RotateCcw size={14} />
                        <span>সব মুছুন</span>
                      </button>
                    </div>
                  </div>

                  {/* Continent Wise Country Checklist */}
                  <div className="space-y-4">
                    {WORLD_CONTINENTS.map((continent) => {
                      const matchingCountries = continent.countries.filter(c => 
                        !worldSearchQuery || 
                        c.nameBn.toLowerCase().includes(worldSearchQuery.toLowerCase()) || 
                        c.nameEn.toLowerCase().includes(worldSearchQuery.toLowerCase())
                      );

                      if (matchingCountries.length === 0) return null;

                      const visitedInCont = continent.countries.filter(c => selectedWorldCountries.includes(c.id)).length;
                      const isAllSelected = continent.countries.length > 0 && visitedInCont === continent.countries.length;

                      return (
                        <div key={continent.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-black text-slate-800">{continent.nameBn}</h3>
                              <span className="text-[10px] font-bold text-slate-400">
                                {visitedInCont}/{continent.countries.length}
                              </span>
                            </div>
                            <button 
                              onClick={() => selectAllCountriesInContinent(continent.id)}
                              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                                isAllSelected 
                                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                                  : 'bg-emerald-50 text-[#009664] hover:bg-emerald-100'
                              }`}
                            >
                              {isAllSelected ? 'বিভাগ বাতিল' : 'সব বাছাই'}
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {matchingCountries.map((country) => {
                              const isSelected = selectedWorldCountries.includes(country.id);
                              return (
                                <button
                                  key={country.id}
                                  onClick={() => toggleWorldCountry(country.id)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                                    isSelected 
                                      ? 'bg-[#009664] text-white border-[#009664] shadow-xs' 
                                      : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:border-slate-300 hover:bg-slate-100'
                                  }`}
                                >
                                  {isSelected && <Check size={12} strokeWidth={3} />}
                                  <span>{country.nameBn}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Theme & Customization Box */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Palette size={16} className="text-[#009664]" />
                      <span>ম্যাপ কাস্টমাইজেশন ও থিম</span>
                    </h3>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 mb-2 block">থিম সিলেক্ট করুন:</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {MAP_THEMES.map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => setActiveTheme(theme)}
                            className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                              activeTheme.id === theme.id 
                                ? 'border-[#009664] bg-emerald-50/50 shadow-xs' 
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: theme.primary }}></span>
                            <span className="text-[11px] font-bold text-slate-700 truncate">{theme.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 mb-1 block">আপনার নাম:</label>
                        <input 
                          type="text" 
                          placeholder="আপনার নাম লিখুন..."
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#009664]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 mb-1 block">ছবি কাস্টমাইজ:</label>
                        <div className="flex items-center gap-1.5">
                          <label className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 transition-all">
                            <Camera size={14} className="text-[#009664]" />
                            <span className="truncate">{userPhoto ? 'ছবি বদলান' : 'ছবি যোগ করুন'}</span>
                            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                          </label>
                          {userPhoto && (
                            <button
                              onClick={() => setUserPhoto(null)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer"
                            >
                              সরান
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-bold text-slate-700">দেশের নাম প্রদর্শন করুন</span>
                      <button 
                        type="button"
                        role="switch"
                        aria-checked={showLabels}
                        onClick={() => {
                          const nextVal = !showLabels;
                          setShowLabels(nextVal);
                          saveRealtimeMapState(selectedDistricts, selectedWorldCountries, activeTheme.id, userName, userPhoto, nextVal);
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${showLabels ? 'bg-[#009664]' : 'bg-slate-300'}`}
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${showLabels ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>

                </div>

                {/* Right Interactive World Map Display & Download (5 cols) */}
                <div className="lg:col-span-5 space-y-5">
                  
                  <WorldMapSVG 
                    selectedCountryIds={selectedWorldCountries}
                    themeColor={activeTheme.primary}
                    themeBg={activeTheme.bg}
                    themeText={activeTheme.text}
                    showLabels={showLabels}
                    onCountryClick={toggleWorldCountry}
                    userName={userName}
                    userPhoto={userPhoto || undefined}
                  />

                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-[11px] font-bold text-amber-900 flex items-start gap-2">
                    <Lightbulb size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>টিপস: ম্যাপের দেশে সরাসরি ক্লিক করে বাছাই করতে পারেন! ছোট দেশগুলো তালিকা থেকে বাছাই করা সহজ।</span>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
                    <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Download size={16} className="text-[#009664]" />
                      <span>আপনার বিশ্ব ম্যাপ ডাউনলোড করুন</span>
                    </h3>

                    <p className="text-[11px] font-bold text-slate-500 leading-snug">
                      সামাজিক যোগাযোগ মাধ্যমে শেয়ার করার জন্য হাই-রেজুলেশন ইমেজে ভ্রমণ ম্যাপ ডাউনলোড করুন।
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        onClick={() => downloadWorldMap('png')}
                        disabled={isDownloading}
                        className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                      >
                        <span>↓ PNG</span>
                      </button>

                      <button
                        onClick={() => downloadWorldMap('jpg')}
                        disabled={isDownloading}
                        className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                      >
                        <span>↓ JPG</span>
                      </button>

                      <button
                        onClick={() => downloadWorldMap('pdf')}
                        disabled={isDownloading}
                        className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                      >
                        <span>↓ PDF</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 3: DESTINATIONS (কোথায় ঘুরবেন) */}
          {activeTab === 'destinations' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Compass className="text-[#009664]" size={20} />
                  <span>বাংলাদেশের সেরা ভ্রমণ স্থানসমূহ</span>
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-0.5">জনপ্রিয় দর্শনীয় স্থানের তালিকা ও ভ্রমণ গাইড</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ALL_DISTRICTS.filter(d => d.touristSpots && d.touristSpots.length > 0).slice(0, 10).map((district) => (
                  <div key={district.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#009664]">
                        {district.divisionNameBn}
                      </span>
                      <span className="text-xs font-bold text-slate-400">{district.nameBn} জেলা</span>
                    </div>

                    <h3 className="text-sm font-black text-slate-800 mb-2">{district.nameBn}-এর বিখ্যাত স্থানসমূহ:</h3>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {district.touristSpots?.map((spot, idx) => (
                        <span key={idx} className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 flex items-center gap-1">
                          <MapPin size={12} className="text-[#009664]" />
                          <span>{spot}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: QUIZ (খেলা) */}
          {activeTab === 'quiz' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Trophy size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800">বাংলাদেশ ভূগোল ও ভ্রমণ কুইজ</h2>
                  <p className="text-xs font-bold text-slate-500">আপনার সাধারণ জ্ঞান পরীক্ষা করুন</p>
                </div>
              </div>

              {quizQuestionIdx < quizQuestions.length ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>প্রশ্ন {quizQuestionIdx + 1} / {quizQuestions.length}</span>
                    <span>স্কোর: {quizScore}</span>
                  </div>

                  <h3 className="text-base font-black text-slate-800">
                    {quizQuestions[quizQuestionIdx].q}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {quizQuestions[quizQuestionIdx].options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (idx === quizQuestions[quizQuestionIdx].answer) {
                            setQuizScore(prev => prev + 10);
                            toast.success('সঠিক উত্তর! +১০ পয়েন্ট');
                          } else {
                            toast.error('ভুল উত্তর!');
                          }
                          setQuizQuestionIdx(prev => prev + 1);
                        }}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-800 text-xs font-bold border border-slate-200 text-left transition-all cursor-pointer"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <Trophy size={48} className="mx-auto text-amber-500" />
                  <h3 className="text-lg font-black text-slate-800">কুইজ সমাপ্ত!</h3>
                  <p className="text-sm font-bold text-slate-600">আপনার মোট অর্জিত পয়েন্ট: {quizScore}</p>
                  <button 
                    onClick={() => { setQuizQuestionIdx(0); setQuizScore(0); }}
                    className="px-5 py-2 rounded-xl bg-[#009664] text-white text-xs font-black shadow-md cursor-pointer"
                  >
                    আবার খেলুন
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PLANNER (ট্রিপ প্ল্যানার) */}
          {activeTab === 'planner' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#009664] flex items-center justify-center">
                  <Calendar size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800">স্মার্ট ট্রিপ প্ল্যানার</h2>
                  <p className="text-xs font-bold text-slate-500">আপনার ভ্রমণের বাজেট ও পরিকল্পনা তৈরি করুন</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">গন্তব্যস্থল:</label>
                  <input 
                    type="text" 
                    placeholder="যেমন: কক্সবাজার বা সাজেক"
                    value={plannerDestination}
                    onChange={(e) => setPlannerDestination(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#009664]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">দিন সংখ্যা:</label>
                  <input 
                    type="number" 
                    value={plannerDays}
                    onChange={(e) => setPlannerDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#009664]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">আনুমানিক বাজেট (টাকা):</label>
                  <input 
                    type="number" 
                    value={plannerBudget}
                    onChange={(e) => setPlannerBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#009664]"
                  />
                </div>
              </div>

              <button 
                onClick={() => {
                  if (!plannerDestination) {
                    toast.error('অনুগ্রহ করে গন্তব্যস্থল লিখুন');
                    return;
                  }
                  setSavedPlans(prev => [...prev, { id: Date.now().toString(), dest: plannerDestination, days: plannerDays, budget: plannerBudget }]);
                  setPlannerDestination('');
                  toast.success('প্ল্যান সংরক্ষণ করা হয়েছে!');
                }}
                className="w-full py-2.5 rounded-xl bg-[#009664] text-white text-xs font-black cursor-pointer shadow-md"
              >
                + নতুন প্ল্যান যোগ করুন
              </button>

              {savedPlans.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-black text-slate-800">সংরক্ষিত ট্রিপসমূহ:</h3>
                  {savedPlans.map(p => (
                    <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-bold">
                      <div>
                        <span className="font-black text-slate-800">{p.dest}</span> — {p.days} দিন
                      </div>
                      <span className="text-[#009664] font-black">৳{p.budget}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: HIDDEN GEMS (লুকানো রত্ন) */}
          {activeTab === 'hidden-gems' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Sparkles className="text-amber-500" size={20} />
                  <span>বাংলাদেশের লুকানো সৌন্দর্য ও ঐতিহ্য</span>
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-0.5">অপ্রচলিত কিন্তু নয়নাভিরাম দর্শনীয় স্থান</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">রাজশাহী • পুঠিয়া</span>
                  <h3 className="text-sm font-black text-slate-800">পুঠিয়া রাজবাড়ি ও শিব মন্দির কমপ্লেক্স</h3>
                  <p className="text-xs font-bold text-slate-500 leading-relaxed">
                    পোড়ামাটির চমৎকার ভাস্কর্য সংবলিত মন্দির এবং সুবিশাল রাজবাড়ির অনন্য স্থাপত্যশৈলী।
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">নেত্রকোনা • দুর্গাপুর</span>
                  <h3 className="text-sm font-black text-slate-800">বিরিশিরি চীনা মাটির নীল হ্রদ</h3>
                  <p className="text-xs font-bold text-slate-500 leading-relaxed">
                    স্বচ্ছ নীল ও সবুজ জলের বিরিশিরি হ্রদ এবং পাহাড়ের প্রাকৃতিক সৌন্দর্য।
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
      <BottomNavigation activeTab="services" onTabChange={() => {}} />
    </div>
  );
};

export default TravelMapPage;
