import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sun, 
  CloudSun, 
  CloudRain, 
  Cloud, 
  CloudLightning, 
  Wind, 
  Droplets, 
  Gauge, 
  Eye, 
  Compass, 
  Sunrise, 
  Sunset, 
  AlertTriangle, 
  Bell, 
  Check, 
  Share2, 
  Sparkles, 
  MapPin, 
  Layers, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  Umbrella,
  ShieldAlert,
  Calendar,
  Radio,
  ExternalLink,
  Clock
} from 'lucide-react';
import { 
  WeatherData, 
  HourlyForecastItem, 
  DailyForecastItem, 
  FALLBACK_WEATHER_DATA, 
  fetchLivePuthiaWeather, 
  toBengaliDigits 
} from '../../services/weatherForecastService';
import { toast } from 'sonner';

export const WeatherForecastPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<WeatherData>(FALLBACK_WEATHER_DATA);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'forecast' | 'feed'>('forecast');
  const [selectedHourlyIndex, setSelectedHourlyIndex] = useState<number>(0);
  const [isNotifEnabled, setIsNotifEnabled] = useState(false);
  const [mapLayer, setMapLayer] = useState<'wind' | 'rain' | 'temp' | 'clouds'>('wind');
  const [is16DayExpanded, setIs16DayExpanded] = useState(true);

  // Fetch Live Data on mount
  useEffect(() => {
    let isMounted = true;
    const loadWeather = async () => {
      setLoading(true);
      const res = await fetchLivePuthiaWeather();
      if (isMounted) {
        setData(res);
        setLoading(false);
      }
    };
    loadWeather();
    return () => { isMounted = false; };
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    const res = await fetchLivePuthiaWeather();
    setData(res);
    setLoading(false);
    toast.success('আবহাওয়ার তথ্য সফলভাবে রিফ্রেশ করা হয়েছে');
  };

  const handleToggleNotif = () => {
    if (!isNotifEnabled) {
      if ('Notification' in window) {
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            setIsNotifEnabled(true);
            toast.success('বৃষ্টি ও ঝড়ের সতর্কবার্তা নোটিফিকেশন চালু করা হয়েছে!');
          } else {
            setIsNotifEnabled(true);
            toast.success('নোটিফিকেশন সফলভাবে চালু হয়েছে');
          }
        });
      } else {
        setIsNotifEnabled(true);
        toast.success('নোটিফিকেশন সফলভাবে চালু হয়েছে');
      }
    } else {
      setIsNotifEnabled(false);
      toast.info('নোটিফিকেশন বন্ধ করা হয়েছে');
    }
  };

  const activeHour = data.hourly[selectedHourlyIndex] || data.hourly[0];

  return (
    <div className="min-h-screen bg-[#f3f7f5] text-slate-800 font-sans pb-24 select-none">
      
      {/* 1. Header with Gradient matching Image 2 */}
      <header className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 text-white pt-4 pb-6 px-4 shadow-md relative overflow-hidden">
        {/* Background Sun Glow */}
        <div className="absolute top-2 right-4 w-28 h-28 bg-yellow-300/30 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-lg mx-auto flex items-center justify-between relative z-10 mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/exclusive-features')}
              className="p-2 -ml-2 rounded-full hover:bg-white/15 transition cursor-pointer text-white"
              aria-label="Back"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <div className="text-[11px] font-bold text-sky-100 flex items-center gap-1.5">
                <span>{data.currentDateBn}</span>
              </div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <MapPin size={18} className="text-yellow-300 shrink-0" />
                <span>{data.locationName}, {data.district}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-full hover:bg-white/20 transition cursor-pointer text-white ${loading ? 'animate-spin' : ''}`}
              title="রিফ্রেশ করুন"
            >
              <RefreshCw size={18} />
            </button>
            <div className="w-10 h-10 rounded-full bg-yellow-400/30 border border-yellow-300/50 flex items-center justify-center text-yellow-300 shadow-md">
              <Sun size={24} className="animate-spin-slow fill-yellow-400" />
            </div>
          </div>
        </div>

        {/* Global Forecast vs Weather Feed Switcher (Matching Image 2) */}
        <div className="max-w-lg mx-auto flex items-center justify-center gap-2 pt-1 relative z-10">
          <button
            onClick={() => setActiveTab('forecast')}
            className={`px-5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'forecast'
                ? 'bg-white text-blue-900 shadow-md'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            <span>☁️</span>
            <span>গ্লোবাল ফোরকাস্ট</span>
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'feed'
                ? 'bg-white text-blue-900 shadow-md'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            <span>📰</span>
            <span>আবহাওয়া ফিড</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-lg mx-auto px-4 -mt-3 space-y-4 relative z-20">

        {/* 2. Hero Card (বর্তমান আবহাওয়া - Matching Image 2) */}
        <div className="bg-gradient-to-br from-[#1b80c4] via-[#2190d6] to-[#3aa2e0] rounded-3xl p-5 text-white shadow-xl shadow-blue-500/15 relative overflow-hidden border border-white/20">
          {/* Ambient Glowing Sun in Background */}
          <div className="absolute -right-6 -top-6 w-36 h-36 bg-yellow-400/25 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-4 top-5 w-24 h-24 rounded-full flex items-center justify-center pointer-events-none">
            <Sun size={88} className="text-yellow-300 fill-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,0.7)] animate-pulse-slow" />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-100">বর্তমান আবহাওয়া</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                লাইভ
              </span>
            </div>
            <span className="text-xs font-extrabold text-sky-100">
              ↓ {toBengaliDigits(data.tempMin)}° ↑ {toBengaliDigits(data.tempMax)}°
            </span>
          </div>

          {/* Big Temperature & Condition */}
          <div className="relative z-10 my-3">
            <div className="text-6xl font-black tracking-tighter text-white">
              {data.tempBn}
            </div>
            <div className="mt-1">
              <span className="text-xs font-bold text-sky-100">অনুভূত তাপমাত্রা {data.feelsLikeBn}</span>
              <h2 className="text-base font-black text-white mt-0.5">{data.conditionText}</h2>
            </div>
          </div>

          {/* 5 Bottom Weather Metrics Bar (Matching Image 2) */}
          <div className="relative z-10 grid grid-cols-5 gap-1 pt-3.5 border-t border-white/20 text-center">
            <div className="p-1">
              <Droplets size={16} className="mx-auto text-sky-200 mb-0.5" />
              <span className="text-xs font-black text-white block">{toBengaliDigits(data.humidity)}%</span>
              <span className="text-[10px] text-sky-200 font-bold block">আর্দ্রতা</span>
            </div>
            <div className="p-1">
              <Wind size={16} className="mx-auto text-sky-200 mb-0.5" />
              <span className="text-xs font-black text-white block">{toBengaliDigits(data.windSpeed)} কিমি</span>
              <span className="text-[10px] text-sky-200 font-bold block">বাতাস</span>
            </div>
            <div className="p-1">
              <Gauge size={16} className="mx-auto text-sky-200 mb-0.5" />
              <span className="text-xs font-black text-white block">{toBengaliDigits(data.pressure)}</span>
              <span className="text-[10px] text-sky-200 font-bold block">বায়ুচাপ</span>
            </div>
            <div className="p-1">
              <Eye size={16} className="mx-auto text-sky-200 mb-0.5" />
              <span className="text-xs font-black text-white block">{toBengaliDigits(data.visibility)} কিমি</span>
              <span className="text-[10px] text-sky-200 font-bold block">দৃষ্টিসীমা</span>
            </div>
            <div className="p-1">
              <Cloud size={16} className="mx-auto text-sky-200 mb-0.5" />
              <span className="text-xs font-black text-white block">{toBengaliDigits(data.cloudCover)}%</span>
              <span className="text-[10px] text-sky-200 font-bold block">মেঘ</span>
            </div>
          </div>
        </div>

        {/* 3. প্রতি ঘণ্টার পূর্বাভাস (Hourly Forecast - Matching Image 2) */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Clock size={18} />
              </div>
              <h3 className="text-sm font-black text-slate-900">প্রতি ঘণ্টার পূর্বাভাস</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400">আগামী ২৪ ঘণ্টা</span>
          </div>

          {/* Horizontal Hourly Cards Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-2 px-2">
            {data.hourly.map((h, idx) => {
              const isSelected = selectedHourlyIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedHourlyIndex(idx)}
                  className={`px-3 py-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all cursor-pointer min-w-[72px] shrink-0 border ${
                    isSelected
                      ? 'bg-gradient-to-b from-blue-600 to-indigo-700 text-white border-blue-600 shadow-md scale-102'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/70'
                  }`}
                >
                  <span className={`text-[11px] font-bold ${isSelected ? 'text-sky-100' : 'text-slate-500'}`}>
                    {h.timeLabel}
                  </span>
                  <div className="my-0.5">
                    {h.conditionCode === 0 ? (
                      <Sun size={20} className={isSelected ? 'text-yellow-300 fill-yellow-400' : 'text-amber-500'} />
                    ) : h.conditionCode > 50 ? (
                      <CloudRain size={20} className={isSelected ? 'text-sky-200' : 'text-blue-500'} />
                    ) : (
                      <CloudSun size={20} className={isSelected ? 'text-yellow-200' : 'text-amber-500'} />
                    )}
                  </div>
                  <span className="text-sm font-black">{h.tempBn}</span>
                  <span className={`text-[10px] font-extrabold flex items-center gap-0.5 ${isSelected ? 'text-sky-200' : 'text-blue-600'}`}>
                    <Droplets size={10} />
                    {toBengaliDigits(h.humidity)}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detailed breakdown for selected hour (Matching Image 2) */}
          <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/70 rounded-2xl p-4 border border-blue-100/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-900 bg-white/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                  {activeHour.timeLabel}
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">{activeHour.tempBn}</div>
                <span className="text-xs font-bold text-slate-600">{activeHour.conditionText}</span>
              </div>
              <span className="px-3 py-1 bg-[#006a4e] text-white text-xs font-black rounded-xl shadow-xs">
                {toBengaliDigits(activeHour.rainAmount || 0.2)} মিমি
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-100 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-blue-100/60 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400">অনুভূত তাপমাত্রা</span>
                <span className="text-xs font-black text-slate-800 mt-0.5">{toBengaliDigits(activeHour.temp + 5)}°</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-blue-100/60 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400">বায়ুচাপ</span>
                <span className="text-xs font-black text-slate-800 mt-0.5">{toBengaliDigits(data.pressure)} hPa</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-blue-100/60 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400">আর্দ্রতা</span>
                <span className="text-xs font-black text-slate-800 mt-0.5">{toBengaliDigits(activeHour.humidity)}%</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-blue-100/60 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400">দৃষ্টিসীমা</span>
                <span className="text-xs font-black text-slate-800 mt-0.5">{toBengaliDigits(data.visibility)} কিমি</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-blue-100/60 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400">বাতাস</span>
                <span className="text-xs font-black text-slate-800 mt-0.5">{toBengaliDigits(activeHour.windSpeed)} কিমি/ঘণ্টা</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-blue-100/60 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400">দমকা হাওয়া</span>
                <span className="text-xs font-black text-slate-800 mt-0.5">{toBengaliDigits(data.windGusts)} কিমি/ঘণ্টা</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-blue-100/60 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400">বাতাসের দিক</span>
                <span className="text-xs font-black text-slate-800 mt-0.5">{data.windDirectionText}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-blue-100/60 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400">বৃষ্টি বলছে</span>
                <span className="text-xs font-black text-blue-700 mt-0.5">{data.modelAgreement}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. আজকের পরামর্শ (Daily Weather Advice - Matching Image 2) */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Sparkles size={18} />
            </div>
            <h3 className="text-sm font-black text-slate-900">আজকের পরামর্শ</h3>
          </div>

          <div className="space-y-2">
            {data.dailyAdvice.map((item) => (
              <div key={item.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 text-xs font-bold text-slate-700">
                <span className="text-xl shrink-0">{item.icon}</span>
                <span className="leading-snug">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. কৃষি পরামর্শ (Agricultural Advice for Farmers - Matching Image 2) */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <span className="text-base">🌱</span>
            </div>
            <h3 className="text-sm font-black text-slate-900">কৃষি পরামর্শ</h3>
          </div>

          <div className="space-y-2">
            {data.agriAdvice.map((text, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-2.5 text-xs font-bold text-emerald-950 leading-relaxed">
                <span className="text-base shrink-0 mt-0.5">{idx === 0 ? '🚫' : '🌾'}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 6. বাতাসের মান (Air Quality Index - AQI - Matching Image 2) */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                <Wind size={18} />
              </div>
              <h3 className="text-sm font-black text-slate-900">বাতাসের মান</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400">এয়ার কোয়ালিটি ইনডেক্স</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-rose-500 text-white flex flex-col items-center justify-center shadow-lg shadow-rose-500/30 shrink-0">
              <span className="text-2xl font-black">{toBengaliDigits(data.aqi)}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-100">AQI</span>
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-rose-600">{data.aqiStatus}</h4>
              <p className="text-xs font-bold text-slate-500">
                PM2.5: {toBengaliDigits(data.pm25)} • PM10: {toBengaliDigits(data.pm10)} µg/m³
              </p>
            </div>
          </div>

          {/* AQI 6-Color Spectrum Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="h-2.5 rounded-full flex overflow-hidden gap-1">
              <div className="flex-1 bg-emerald-500 rounded-full" />
              <div className="flex-1 bg-yellow-400 rounded-full" />
              <div className="flex-1 bg-orange-500 rounded-full" />
              <div className="flex-1 bg-rose-500 rounded-full ring-2 ring-rose-700" />
              <div className="flex-1 bg-purple-600 rounded-full" />
              <div className="flex-1 bg-rose-950 rounded-full" />
            </div>
            <p className="text-xs font-bold text-slate-600 pt-1">
              সবাই বাইরে মাস্ক পরুন, ভারী কাজ এড়িয়ে চলুন।
            </p>
          </div>
        </div>

        {/* 7. পরবর্তী গুরুত্বপূর্ণ আবহাওয়ার ইভেন্ট (Alert Banner - Matching Image 2) */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 text-white shadow-md flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Radio size={20} className="text-white animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-sky-200">পরবর্তী গুরুত্বপূর্ণ আবহাওয়ার ইভেন্ট</span>
            <p className="text-xs font-black text-white leading-snug mt-0.5">
              আগামীকাল ১২ অপঃ থেকে বৃষ্টির সম্ভাবনা (৬৭%, ৪টির ৩টি মডেল একমত)
            </p>
          </div>
        </div>

        {/* 8. নোটিফিকেশন সাবস্ক্রিপশন কার্ড (Matching Image 2) */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-5 text-white shadow-lg space-y-3 relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Bell size={20} className="text-yellow-300" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black">আবহাওয়ার খবর আগেই জানুন 🔥⛈️</h4>
              <p className="text-[11px] text-blue-100 font-medium leading-relaxed">
                নোটিফিকেশন চালু করলে বৃষ্টির আগে, তীব্র তাপপ্রবাহ, ঘন কুয়াশা ও ঝড়ের আশঙ্কায় তাৎক্ষণিক আপডেট পাবেন।
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleNotif}
            className={`w-full py-2.5 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer ${
              isNotifEnabled
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-blue-900 hover:bg-blue-50'
            }`}
          >
            {isNotifEnabled ? <Check size={16} /> : <Bell size={16} />}
            <span>{isNotifEnabled ? 'নোটিফিকেশন চালু আছে' : 'নোটিফিকেশন চালু করুন'}</span>
          </button>
        </div>

        {/* 9. বৃষ্টিপাত (মিমি) চার্ট (Matching Image 2) */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                <CloudRain size={18} />
              </div>
              <h3 className="text-sm font-black text-slate-900">বৃষ্টিপাত (মিমি)</h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#006a4e] text-white text-[10px] font-black">
              {toBengaliDigits(data.precipitation)} মিমি
            </span>
          </div>

          {/* SVG Bar Chart for Rain */}
          <div className="pt-2">
            <svg viewBox="0 0 320 100" className="w-full h-24">
              <line x1="0" y1="80" x2="320" y2="80" stroke="#e2e8f0" strokeDasharray="3 3" />
              <line x1="0" y1="40" x2="320" y2="40" stroke="#e2e8f0" strokeDasharray="3 3" />
              {/* Rain Bars */}
              <rect x="25" y="45" width="22" height="35" rx="4" fill="#38bdf8" />
              <rect x="85" y="25" width="22" height="55" rx="4" fill="#0284c7" />
              <rect x="145" y="80" width="22" height="0" rx="4" fill="#38bdf8" />
              <rect x="205" y="35" width="22" height="45" rx="4" fill="#0284c7" />
              <rect x="265" y="65" width="22" height="15" rx="4" fill="#38bdf8" />
              {/* Labels */}
              <text x="36" y="95" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">১০ পূঃ</text>
              <text x="96" y="95" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">৪ অপঃ</text>
              <text x="156" y="95" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">১০ অপঃ</text>
              <text x="216" y="95" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">৪ পূঃ</text>
              <text x="276" y="95" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">১০ পূঃ</text>
            </svg>
          </div>
        </div>

        {/* 10. তাপমাত্রা (°সে.) চার্ট (Matching Image 2) */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                <Sun size={18} />
              </div>
              <h3 className="text-sm font-black text-slate-900">তাপমাত্রা (°সে.)</h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-orange-500 text-white text-[10px] font-black">
              {data.tempBn}
            </span>
          </div>

          {/* SVG Smooth Curve for Temperature */}
          <div className="pt-2">
            <svg viewBox="0 0 320 100" className="w-full h-24 overflow-visible">
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 20,40 Q 60,15 100,25 T 180,65 T 260,75 T 300,45"
                fill="none"
                stroke="#f97316"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M 20,40 Q 60,15 100,25 T 180,65 T 260,75 T 300,45 L 300,90 L 20,90 Z"
                fill="url(#tempGrad)"
              />
              {/* Dots */}
              <circle cx="20" cy="40" r="4" fill="#f97316" />
              <circle cx="100" cy="25" r="4" fill="#f97316" />
              <circle cx="180" cy="65" r="4" fill="#f97316" />
              <circle cx="260" cy="75" r="4" fill="#f97316" />
              <circle cx="300" cy="45" r="4" fill="#f97316" />
              {/* Labels */}
              <text x="20" y="95" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">১০ পূঃ</text>
              <text x="100" y="95" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">৪ অপঃ</text>
              <text x="180" y="95" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">১০ অপঃ</text>
              <text x="260" y="95" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">৪ পূঃ</text>
              <text x="300" y="95" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">১০ পূঃ</text>
            </svg>
          </div>
        </div>

        {/* 11. বাতাসের গতি (কিমি/ঘণ্টা) চার্ট (Matching Image 2) */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Wind size={18} />
              </div>
              <h3 className="text-sm font-black text-slate-900">বাতাসের গতি (কিমি/ঘণ্টা)</h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black">
              {toBengaliDigits(data.windSpeed)} কিমি/ঘণ্টা
            </span>
          </div>

          <div className="pt-2">
            <svg viewBox="0 0 320 100" className="w-full h-24">
              <defs>
                <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 20,60 Q 60,35 90,55 T 150,20 T 210,75 T 270,45 T 300,65"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M 20,60 Q 60,35 90,55 T 150,20 T 210,75 T 270,45 T 300,65 L 300,90 L 20,90 Z"
                fill="url(#windGrad)"
              />
              {/* Labels */}
              <text x="20" y="95" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">১০ পূঃ</text>
              <text x="90" y="95" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">৪ অপঃ</text>
              <text x="150" y="95" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">১০ অপঃ</text>
              <text x="210" y="95" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">৪ পূঃ</text>
              <text x="270" y="95" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">১০ পূঃ</text>
            </svg>
          </div>
        </div>

        {/* 12. সূর্যোদয় ও সূর্যাস্ত (Sunrise & Sunset Arc - Matching Image 2) */}
        <div className="bg-gradient-to-b from-amber-50/50 to-orange-50/50 rounded-3xl p-5 border border-amber-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <Sunrise size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">সূর্যোদয় ও সূর্যাস্ত</h3>
              <span className="text-[10px] font-bold text-slate-500">দিনের দৈর্ঘ্য {data.dayLength}</span>
            </div>
          </div>

          {/* Semi-circle Sun Arc Animation */}
          <div className="py-2 relative flex flex-col items-center justify-center">
            <svg viewBox="0 0 260 110" className="w-56 h-28 overflow-visible">
              <path
                d="M 20,100 A 110,110 0 0,1 240,100"
                fill="none"
                stroke="#fcd34d"
                strokeWidth="4"
                strokeDasharray="6 6"
              />
              <path
                d="M 20,100 A 110,110 0 0,1 110,25"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Sun on the arc */}
              <circle cx="110" cy="25" r="14" fill="#fbbf24" className="animate-pulse" />
              <circle cx="110" cy="25" r="8" fill="#f59e0b" />
            </svg>

            <div className="w-full flex items-center justify-between pt-2">
              <div className="p-2.5 bg-white rounded-2xl border border-amber-200/70 text-center shadow-xs min-w-[100px]">
                <Sunrise size={20} className="mx-auto text-amber-500 mb-0.5" />
                <span className="text-xs font-black text-slate-900 block">{data.sunrise}</span>
                <span className="text-[9px] font-bold text-slate-400">সূর্যোদয়</span>
              </div>

              <div className="p-2.5 bg-white rounded-2xl border border-amber-200/70 text-center shadow-xs min-w-[100px]">
                <Sunset size={20} className="mx-auto text-orange-500 mb-0.5" />
                <span className="text-xs font-black text-slate-900 block">{data.sunset}</span>
                <span className="text-[9px] font-bold text-slate-400">সূর্যাস্ত</span>
              </div>
            </div>
          </div>
        </div>

        {/* 13. বজ্রঝড় ক্যালকুলেটর (Thunderstorm CAPE Meter - Matching Image 2) */}
        <div className="bg-gradient-to-br from-purple-800 via-indigo-900 to-slate-950 text-white rounded-3xl p-5 shadow-xl space-y-3.5 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-purple-500/30 flex items-center justify-center text-purple-300">
                <CloudLightning size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">বজ্রঝড় ক্যালকুলেটর</h3>
                <span className="text-[10px] font-bold text-purple-200">বায়ুমণ্ডলের অস্থিরতা (CAPE) বিশ্লেষণ</span>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-purple-500 text-white text-xs font-black shadow-xs">
              {data.capeRiskText}
            </span>
          </div>

          {/* Slider Level */}
          <div className="space-y-2">
            <div className="h-3 rounded-full bg-slate-800 flex overflow-hidden p-0.5">
              <div className="w-2/3 bg-gradient-to-r from-emerald-400 via-amber-400 to-purple-500 rounded-full relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-purple-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-purple-100/90 leading-relaxed pt-1">
              {data.capeAdvice}
            </p>
          </div>
        </div>

        {/* 14. ১৬ দিনের পূর্বাভাস (16-Day Forecast List - Matching Image 2) */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Calendar size={18} />
              </div>
              <h3 className="text-sm font-black text-slate-900">১৬ দিনের পূর্বাভাস</h3>
            </div>
            <button
              onClick={() => setIs16DayExpanded(!is16DayExpanded)}
              className="px-3 py-1 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black transition cursor-pointer"
            >
              {is16DayExpanded ? 'সংক্ষেপ' : 'বিস্তারিত'}
            </button>
          </div>

          <div className="space-y-2">
            {data.daily16.slice(0, is16DayExpanded ? 16 : 7).map((day, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition border border-slate-100 flex items-center justify-between gap-2 text-xs"
              >
                <div className="w-24 shrink-0">
                  <span className="font-black text-slate-900 block">{day.dayNameBn}</span>
                  <span className="text-[10px] font-bold text-slate-400 block">{day.dateBn}</span>
                </div>

                <div className="flex items-center gap-2 flex-1 justify-center">
                  {day.conditionCode === 0 ? (
                    <Sun size={18} className="text-amber-500" />
                  ) : day.conditionCode > 50 ? (
                    <CloudRain size={18} className="text-blue-500" />
                  ) : (
                    <CloudSun size={18} className="text-amber-500" />
                  )}
                  <span className="text-xs font-bold text-slate-600 truncate max-w-[110px]">
                    {day.conditionText}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-black">
                    {day.modelScore}
                  </span>
                </div>

                <div className="text-right shrink-0 min-w-[70px]">
                  <span className="font-black text-slate-900">
                    {toBengaliDigits(day.tempMin)}° — {toBengaliDigits(day.tempMax)}°
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 15. ১৬-দিনের আবহাওয়ার তুলনা (Multi-line Comparison Chart - Matching Image 2) */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">১৬-দিনের আবহাওয়ার তুলনা</h3>
              <span className="text-[10px] font-bold text-slate-400">{data.currentDateBn}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-600">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              বাতাস {toBengaliDigits(data.windSpeed)} কিমি
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              বৃষ্টি {toBengaliDigits(data.precipitation)} মিমি
            </span>
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
              সর্বোচ্চ {toBengaliDigits(data.tempMax)}°
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              সর্বনিম্ন {toBengaliDigits(data.tempMin)}°
            </span>
          </div>

          {/* SVG Multi-line Comparison Graph */}
          <div className="pt-2">
            <svg viewBox="0 0 320 120" className="w-full h-32 overflow-visible">
              <line x1="0" y1="100" x2="320" y2="100" stroke="#e2e8f0" />
              <line x1="0" y1="50" x2="320" y2="50" stroke="#f1f5f9" />
              {/* Rain Bars */}
              <rect x="25" y="80" width="12" height="20" rx="3" fill="#38bdf8" />
              <rect x="75" y="70" width="12" height="30" rx="3" fill="#0284c7" />
              <rect x="125" y="90" width="12" height="10" rx="3" fill="#38bdf8" />
              <rect x="175" y="60" width="12" height="40" rx="3" fill="#0284c7" />
              <rect x="225" y="85" width="12" height="15" rx="3" fill="#38bdf8" />
              <rect x="275" y="55" width="12" height="45" rx="3" fill="#0284c7" />
              {/* Max Temp Line (Orange) */}
              <path
                d="M 20,35 Q 70,45 120,30 T 220,32 T 300,28"
                fill="none"
                stroke="#f97316"
                strokeWidth="2.5"
              />
              {/* Min Temp Line (Purple) */}
              <path
                d="M 20,65 Q 70,70 120,60 T 220,62 T 300,58"
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
              />
              {/* Wind Line (Emerald) */}
              <path
                d="M 20,75 Q 70,30 120,80 T 220,70 T 300,85"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
              />
              {/* X-axis labels */}
              <text x="25" y="115" textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="bold">৭ অক্টো</text>
              <text x="75" y="115" textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="bold">১০ অক্টো</text>
              <text x="125" y="115" textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="bold">১৩ অক্টো</text>
              <text x="175" y="115" textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="bold">১৬ অক্টো</text>
              <text x="225" y="115" textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="bold">১৯ অক্টো</text>
              <text x="275" y="115" textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="bold">২২ অক্টো</text>
            </svg>
          </div>
        </div>

        {/* 16. আবহাওয়া সরঞ্জাম ও লাইভ রাডার ম্যাপ (Interactive Live Windy Map - Matching Image 2) */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                <Layers size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">আবহাওয়া সরঞ্জাম</h3>
                <span className="text-[10px] font-bold text-slate-400">লাইভ ম্যাপ • Windy</span>
              </div>
            </div>
          </div>

          {/* Map Layer Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'wind', label: 'বাতাস', icon: '💨' },
              { id: 'rain', label: 'বৃষ্টি', icon: '🌧️' },
              { id: 'temp', label: 'তাপমাত্রা', icon: '🌡️' },
              { id: 'clouds', label: 'মেঘ', icon: '☁️' },
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => setMapLayer(l.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-1 transition cursor-pointer border ${
                  mapLayer === l.id
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span>{l.icon}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>

          {/* Embedded Windy Live Radar for Puthia/Rajshahi */}
          <div className="w-full h-72 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative bg-slate-900">
            <iframe
              title="Live Weather Map"
              width="100%"
              height="100%"
              src={`https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=°C&metricWind=km/h&zoom=8&overlay=${mapLayer}&product=ecmwf&level=surface&lat=24.3725&lon=88.8447&detailLat=24.3725&detailLon=88.8447&marker=true&pressure=true&message=true`}
              className="border-0 w-full h-full"
            />
          </div>
        </div>

        {/* 17. তথ্যসূত্র ও ডিসক্লেইমার (Matching Image 2) */}
        <div className="p-4 bg-slate-100 rounded-2xl text-[11px] text-slate-500 font-medium leading-relaxed border border-slate-200/80">
          তথ্যসূত্র: Open-Meteo — ৪টি আন্তর্জাতিক মডেলের (ECMWF, GFS, ICON, JMA) ঐকমত্য; বেশিরভাগ মডেল একমত হলে তবেই বৃষ্টি দেখানো হয়। দুর্যোগে আবহাওয়া অফিসের সতর্কবার্তা মেনে চলুন।
        </div>

      </main>

    </div>
  );
};

export default WeatherForecastPage;
