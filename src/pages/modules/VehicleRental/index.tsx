import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, Search, Filter, Phone, Plus, MapPin, ShieldCheck, CheckCircle2, 
  Sparkles, Share2, Compass, Clock, ArrowLeft, Navigation, Layers, 
  AlertCircle, Calendar, DollarSign, X, ChevronRight, Fuel, Truck,
  HelpCircle, Star, Info, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Header from '../../../components/home/Header';
import Footer from '../../../components/home/Footer';
import BottomNavigation from '../../../components/home/BottomNavigation';
import { Sidebar } from '../../../components/Sidebar';
import { useAuth } from '../../../contexts/AuthContext';
import { VehicleCard } from './VehicleCard';
import { VehicleDetailsModal } from './VehicleDetailsModal';
import { BookingModal } from './BookingModal';
import { AddVehicleModal } from './AddVehicleModal';
import { AdminVehicleModal } from './AdminVehicleModal';
import { ProviderProfileModal } from './ProviderProfileModal';
import { ReportModal } from './ReportModal';
import { DriverReviewModal } from './DriverReviewModal';
import { subscribeToReviews } from '../../../services/vehicleReviewService';
import { 
  CATEGORY_CHIPS, 
  PUTHIA_UNIONS, 
  PUTHIA_ROUTE_FARES, 
  initialVehicles 
} from './data';
import { Vehicle, VehicleCategory, BookingRequest, VehicleReview } from './types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { toast } from 'sonner';

const toBengaliNumber = (num: number | string): string => {
  const englishToBengaliMap: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return String(num).replace(/[0-9]/g, (digit) => englishToBengaliMap[digit] || digit);
};

export default function VehicleRentalPage() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'vehicles' | 'fares' | 'emergency' | 'reviews'>('vehicles');

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUnion, setSelectedUnion] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [liveReviews, setLiveReviews] = useState<VehicleReview[]>([]);
  const [myBookings, setMyBookings] = useState<BookingRequest[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('user_saved_vehicles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal States
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [bookingVehicle, setBookingVehicle] = useState<Vehicle | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [reportVehicle, setReportVehicle] = useState<Vehicle | null>(null);
  const [providerVehicle, setProviderVehicle] = useState<Vehicle | null>(null);
  const [reviewVehicle, setReviewVehicle] = useState<Vehicle | null>(null);
  const [reviewTargetDriver, setReviewTargetDriver] = useState<{ name?: string; phone?: string; route?: string } | undefined>(undefined);

  // Check Admin Role
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  // Load My Bookings from localStorage
  useEffect(() => {
    try {
      const bks = JSON.parse(localStorage.getItem('p_vehicle_bookings') || '[]');
      setMyBookings(bks);
    } catch {
      setMyBookings([]);
    }
  }, []);

  // Listen to live reviews across Puthia
  useEffect(() => {
    const unsub = subscribeToReviews(undefined, (revs) => {
      setLiveReviews(revs);
    });
    return () => unsub();
  }, []);

  // Load Vehicles from Firestore with local fallback
  useEffect(() => {
    try {
      const q = query(collection(db, 'vehicle_rentals'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list: Vehicle[] = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as Vehicle);
          });
          // Merge with initialVehicles without duplicates
          const firestoreIds = new Set(list.map(v => v.id));
          const combined = [...list, ...initialVehicles.filter(v => !firestoreIds.has(v.id))];
          setVehicles(combined);
        } else {
          setVehicles(initialVehicles);
        }
      }, (err) => {
        console.warn('Firestore subscription fallback:', err);
        setVehicles(initialVehicles);
      });
      return () => unsub();
    } catch {
      setVehicles(initialVehicles);
    }
  }, []);

  // Filtered Vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      // Category Filter
      if (selectedCategory !== 'all' && v.type !== selectedCategory) {
        return false;
      }
      // Union Filter
      if (selectedUnion !== 'all' && v.location?.union !== selectedUnion) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const queryStr = searchQuery.toLowerCase();
        const matchesName = v.name?.toLowerCase().includes(queryStr);
        const matchesType = v.typeLabel?.toLowerCase().includes(queryStr);
        const matchesArea = v.location?.area?.toLowerCase().includes(queryStr) || v.location?.union?.toLowerCase().includes(queryStr);
        const matchesDriver = v.driverInfo?.name?.toLowerCase().includes(queryStr);
        const matchesProvider = v.provider?.businessName?.toLowerCase().includes(queryStr) || v.provider?.name?.toLowerCase().includes(queryStr);
        if (!matchesName && !matchesType && !matchesArea && !matchesDriver && !matchesProvider) {
          return false;
        }
      }
      return true;
    });
  }, [vehicles, selectedCategory, selectedUnion, searchQuery]);

  // Toggle Saved Vehicle
  const handleToggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = savedIds.includes(id) ? savedIds.filter(i => i !== id) : [...savedIds, id];
    setSavedIds(next);
    try {
      localStorage.setItem('user_saved_vehicles', JSON.stringify(next));
    } catch {}
    toast.success(savedIds.includes(id) ? 'সংরক্ষণ তালিকা থেকে সরানো হয়েছে' : 'গাড়িটি সংরক্ষণ করা হয়েছে');
  };

  // Direct Share
  const handleShare = (vehicle: Vehicle, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: vehicle.name,
        text: `${vehicle.name} - ${vehicle.provider?.businessName}, পুঠিয়া।`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('লিংক কপি করা হয়েছে!');
    }
  };

  // Add Vehicle Success
  const handleAddSuccess = (newVeh: Vehicle) => {
    setVehicles(prev => [newVeh, ...prev]);
    toast.success('গাড়ি সফলভাবে তালিকায় যুক্ত করা হয়েছে!');
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col font-sans">
      <Header 
        user={user} 
        onMenuClick={() => setIsSidebarOpen(true)} 
        onSearch={() => {}} 
      />
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNavigate={(path) => {
          setIsSidebarOpen(false);
          navigate(path.startsWith('/') ? path : `/${path}`);
        }} 
      />

      <main className="flex-1 pb-24">
        {/* Top Sticky Bar */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate(-1)} 
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer"
                title="ফিরে যান"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight flex items-center gap-1.5">
                  <Car size={18} className="text-[#006a4e]" />
                  <span>পুঠিয়া গাড়ি ও যানবাহন ভাড়া</span>
                </h1>
                <p className="text-[11px] font-bold text-slate-500 hidden sm:block">
                  রাজশাহী পুঠিয়া উপজেলার সকল ভ্যান, অটো, সিএনজি, নছিমন, পিকআপ ও মাইক্রোবাস
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => setIsAdminModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-all cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <ShieldCheck size={14} />
                  <span className="hidden sm:inline">অ্যাডমিন</span>
                </button>
              )}

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#006a4e] hover:bg-[#00543e] active:scale-97 text-white text-xs font-black transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Plus size={15} />
                <span>গাড়ি যোগ করুন</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          
          {/* Hero Banner with Emergency Quick Action */}
          <div className="bg-gradient-to-r from-[#004d38] via-[#006a4e] to-[#003828] rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden shadow-lg border border-emerald-700/40">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-6 translate-y-6">
              <Car size={240} className="text-white" />
            </div>

            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-black border border-white/20 backdrop-blur-xs">
                <Sparkles size={13} />
                <span>পুঠিয়া উপজেলা লোকাল পরিবহন নেটওয়ার্ক</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black leading-tight text-white">
                প্রয়োজন অনুযায়ী পুঠিয়ার যেকোনো গাড়ি সরাসরি বুকিং করুন
              </h2>

              <p className="text-xs sm:text-sm font-medium text-emerald-100/90 leading-relaxed">
                ভ্যান গাড়ি, ইজিবাইক অটো, সিএনজি, নছিমন, পিকআপ, মাইক্রোবাস, কার থেকে শুরু করে জরুরি অ্যাম্বুলেন্স — ড্রাইভারের সাথে সরাসরি কথা বলুন অথবা ভাড়ার তালিকা দেখুন।
              </p>

              {/* Action Buttons inside Banner */}
              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <a 
                  href="tel:01712998877"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-all shadow-md flex items-center gap-1.5"
                >
                  <Phone size={14} className="animate-bounce" />
                  <span>জরুরি অ্যাম্বুলেন্স (২৪ ঘণ্টা)</span>
                </a>

                <button
                  onClick={() => setActiveTab('fares')}
                  className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-black text-xs transition-all backdrop-blur-sm border border-white/25 flex items-center gap-1.5 cursor-pointer"
                >
                  <Navigation size={14} />
                  <span>ইউনিয়ন ভাড়া তালিকা দেখুন</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x">
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`shrink-0 min-w-fit px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'vehicles' 
                  ? 'bg-[#006a4e] text-white shadow-xs' 
                  : 'bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/60 shadow-2xs'
              }`}
            >
              <Car size={14} className="shrink-0" />
              <span className="shrink-0">সকল গাড়ি ও চালক ({filteredVehicles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('fares')}
              className={`shrink-0 min-w-fit px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'fares' 
                  ? 'bg-[#006a4e] text-white shadow-xs' 
                  : 'bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/60 shadow-2xs'
              }`}
            >
              <Navigation size={14} className="shrink-0" />
              <span className="shrink-0">পুঠিয়া রুট ও ভাড়া তালিকা</span>
            </button>

            <button
              onClick={() => setActiveTab('emergency')}
              className={`shrink-0 min-w-fit px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'emergency' 
                  ? 'bg-rose-600 text-white shadow-xs' 
                  : 'bg-white/80 hover:bg-white text-rose-700 hover:text-rose-800 border border-rose-200/60 shadow-2xs'
              }`}
            >
              <Phone size={14} className="shrink-0" />
              <span className="shrink-0">জরুরি কল তালিকা</span>
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`shrink-0 min-w-fit px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'reviews' 
                  ? 'bg-amber-500 text-slate-900 shadow-xs font-extrabold' 
                  : 'bg-white/80 hover:bg-white text-amber-800 hover:text-amber-900 border border-amber-200/60 shadow-2xs'
              }`}
            >
              <Star size={14} className="fill-amber-400 text-amber-500 shrink-0" />
              <span className="shrink-0">যাত্রীদের রিভিউ ও রেটিং ({liveReviews.length})</span>
            </button>
          </div>

          {/* TAB 1: VEHICLE DIRECTORY */}
          {activeTab === 'vehicles' && (
            <div className="space-y-4">
              
              {/* Search & Union Filter Controls */}
              <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-100/90 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <div className="relative flex-1 w-full">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="গাড়ির নাম, চালক, নম্বর বা এলাকা খুঁজুন..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#006a4e] focus:bg-white transition-all"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Union Select */}
                  <div className="w-full sm:w-48 shrink-0">
                    <select
                      value={selectedUnion}
                      onChange={(e) => setSelectedUnion(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-700 focus:outline-none focus:border-[#006a4e] cursor-pointer"
                    >
                      <option value="all">সব ইউনিয়ন</option>
                      {PUTHIA_UNIONS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Counter status badge */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1 pt-0.5 border-t border-slate-100/80">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#006a4e]"></span>
                    <span>মোট <strong className="text-[#006a4e] font-black">{toBengaliNumber(filteredVehicles.length)}</strong> টি যানবাহন পাওয়া গেছে</span>
                  </span>

                  {(selectedCategory !== 'all' || selectedUnion !== 'all' || searchQuery) && (
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setSelectedUnion('all');
                        setSearchQuery('');
                      }}
                      className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                    >
                      ফিল্টার রিসেট
                    </button>
                  )}
                </div>
              </div>

              {/* Category Chips Bar */}
              <div className="flex items-center gap-2 overflow-x-auto py-1.5 px-0.5 no-scrollbar scroll-smooth touch-pan-x">
                {CATEGORY_CHIPS.map(chip => {
                  const isSelected = selectedCategory === chip.id;
                  return (
                    <button
                      key={chip.id}
                      onClick={() => setSelectedCategory(chip.id)}
                      className={`shrink-0 min-w-fit px-3.5 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                        isSelected 
                          ? 'bg-[#006a4e] text-white border-[#006a4e] shadow-xs scale-[1.02]' 
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm shrink-0">{chip.icon}</span>
                      <span className="whitespace-nowrap shrink-0">{chip.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Vehicle Cards Grid */}
              {filteredVehicles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredVehicles.map((vehicle) => (
                    <VehicleCard 
                      key={vehicle.id}
                      vehicle={vehicle}
                      savedIds={savedIds}
                      onToggleSave={handleToggleSave}
                      onShare={handleShare}
                      onSelect={(v) => setSelectedVehicle(v)}
                      onOpenBooking={(v, e) => {
                        e.stopPropagation();
                        setBookingVehicle(v);
                      }}
                      onOpenReviewModal={(v, e) => {
                        e.stopPropagation();
                        setReviewVehicle(v);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-slate-300 space-y-3">
                  <Car size={40} className="mx-auto text-slate-300" />
                  <h3 className="text-base font-black text-slate-700">কোনো গাড়ি পাওয়া যায়নি</h3>
                  <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto">
                    আপনার সার্চ বা ফিল্টারের সাথে মিলে এমন কোনো গাড়ি পাওয়া যায়নি। ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedUnion('all');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-all"
                  >
                    ফিল্টার ক্লিয়ার করুন
                  </button>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: PUTHIA ROUTE & FARES TABLE */}
          {activeTab === 'fares' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100/90 shadow-xs">
                <h2 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-1.5">
                  <Navigation size={18} className="text-[#006a4e]" />
                  <span>পুঠিয়া উপজেলার ইউনিয়ন ভিত্তিক আনুমানিক ভাড়ার তালিকা</span>
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-1">
                  লোকাল অটো, ভ্যান, সিএনজি ও রিজার্ভের প্রমিত ভাড়া নির্দেশিকা
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {PUTHIA_ROUTE_FARES.map((rf) => (
                  <div key={rf.id} className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100/90 shadow-xs hover:border-emerald-200/80 hover:shadow-md transition-all space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#006a4e]"></span>
                        <h3 className="text-xs sm:text-sm font-black text-slate-800">
                          {rf.from} ⇄ {rf.to}
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-100/90">
                        দূরত্ব: {rf.distance}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-emerald-50/70 p-2.5 rounded-2xl border border-emerald-100/80">
                        <span className="text-[10px] font-bold text-emerald-800 block">ইজিবাইক/অটো</span>
                        <span className="font-black text-[#006a4e] text-sm">{rf.autoFare}</span>
                      </div>

                      <div className="bg-amber-50/70 p-2.5 rounded-2xl border border-amber-100/80">
                        <span className="text-[10px] font-bold text-amber-800 block">ভ্যান গাড়ি</span>
                        <span className="font-black text-amber-700 text-sm">{rf.vanFare}</span>
                      </div>

                      <div className="bg-blue-50/70 p-2.5 rounded-2xl border border-blue-100/80">
                        <span className="text-[10px] font-bold text-blue-800 block">সিএনজি</span>
                        <span className="font-black text-blue-700 text-sm">{rf.cngFare}</span>
                      </div>

                      <div className="bg-purple-50/70 p-2.5 rounded-2xl border border-purple-100/80">
                        <span className="text-[10px] font-bold text-purple-800 block">রিজার্ভ ভাড়া</span>
                        <span className="font-black text-purple-700 text-xs sm:text-sm">{rf.reserveFare}</span>
                      </div>
                    </div>

                    {rf.note && (
                      <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1 pt-1">
                        <Info size={12} className="text-[#006a4e]" />
                        <span>{rf.note}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EMERGENCY VEHICLE HOTLINE */}
          {activeTab === 'emergency' && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200/80 rounded-3xl p-4 sm:p-5 text-rose-900 shadow-xs">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle size={20} className="text-rose-600" />
                  <h2 className="text-sm font-black">পুঠিয়া জরুরি অ্যাম্বুলেন্স ও পরিবহন হটলাইন</h2>
                </div>
                <p className="text-xs font-bold text-rose-700">
                  যেকোনো জরুরি মুহূর্তে সরাসরি কল করতে নিচের নম্বরে চাপুন।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100/90 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">২৪ ঘণ্টা এসি অ্যাম্বুলেন্স</span>
                    <h3 className="text-xs sm:text-sm font-black text-slate-800 mt-1">পুঠিয়া হাসপাতাল সংলগ্ন অ্যাম্বুলেন্স</h3>
                    <p className="text-xs font-bold text-slate-500">চালক: মো: সোহেল রানা</p>
                  </div>
                  <a
                    href="tel:01712998877"
                    className="w-11 h-11 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center shadow-md shrink-0 cursor-pointer transition-all"
                  >
                    <Phone size={18} />
                  </a>
                </div>

                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100/90 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">আইসিইউ ও লাইফ সাপোর্ট</span>
                    <h3 className="text-xs sm:text-sm font-black text-slate-800 mt-1">পুঠিয়া ⇄ রামেক জরুরি সার্ভিস</h3>
                    <p className="text-xs font-bold text-slate-500">চালক: মো: নাজমুল হুদা</p>
                  </div>
                  <a
                    href="tel:01722998877"
                    className="w-11 h-11 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center shadow-md shrink-0 cursor-pointer transition-all"
                  >
                    <Phone size={18} />
                  </a>
                </div>

                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100/90 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">হাইওয়ে সিএনজি স্ট্যান্ড</span>
                    <h3 className="text-xs sm:text-sm font-black text-slate-800 mt-1">পুঠিয়া বাইপাস সিএনজি স্ট্যান্ড</h3>
                    <p className="text-xs font-bold text-slate-500">মো: জাহিদ হাসান</p>
                  </div>
                  <a
                    href="tel:01767891234"
                    className="w-11 h-11 rounded-2xl bg-[#006a4e] hover:bg-[#00543e] active:scale-95 text-white flex items-center justify-center shadow-md shrink-0 cursor-pointer transition-all"
                  >
                    <Phone size={18} />
                  </a>
                </div>

                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100/90 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#006a4e]">জরুরি পিকআপ ও পার্সেল</span>
                    <h3 className="text-xs sm:text-sm font-black text-slate-800 mt-1">বানেশ্বর পিকআপ স্ট্যান্ড</h3>
                    <p className="text-xs font-bold text-slate-500">মো: কামাল হোসেন</p>
                  </div>
                  <a
                    href="tel:01712345679"
                    className="w-11 h-11 rounded-2xl bg-[#006a4e] hover:bg-[#00543e] active:scale-95 text-white flex items-center justify-center shadow-md shrink-0 cursor-pointer transition-all"
                  >
                    <Phone size={18} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DRIVER RATINGS & PASSENGER REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-5">
              
              {/* Header Hero Banner */}
              <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10 space-y-2.5 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-amber-100 text-xs font-black backdrop-blur-xs">
                    <Star size={13} className="fill-amber-300 text-amber-300" />
                    <span>পুঠিয়া যানবাহন যাত্রী মতামত ও ড্রাইভার মূল্যায়ন</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    ভ্রমণ শেষে চালককে রেটিং ও রিভিউ প্রদান করুন
                  </h2>

                  <p className="text-xs sm:text-sm text-amber-100 font-medium leading-relaxed">
                    আপনার সৎ মতামত পুঠিয়ার অন্যান্য যাত্রীদের নিরাপদ ও নির্ভরযোগ্য বাহন খুঁজে পেতে সাহায্য করবে এবং সৎ চালকদের উৎসাহিত করবে।
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        const target = vehicles[0];
                        if (target) {
                          setReviewVehicle(target);
                          setReviewTargetDriver({ name: target.driverInfo?.name, phone: target.driverInfo?.phone });
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-amber-50 font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer border-none"
                    >
                      <Sparkles size={15} className="text-amber-600" />
                      <span>+ যেকোনো চালকের রেটিং দিন</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 1: My Bookings & Completed Rides */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006a4e] flex items-center justify-center font-black">
                      <Clock size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">আমার বুকিং ও রাইড হিস্ট্রি</h3>
                      <p className="text-[11px] font-bold text-slate-500">রাইড শেষে আপনার চালককে রেটিং দিন</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#006a4e] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/80">
                    {myBookings.length} টি বুকিং
                  </span>
                </div>

                {myBookings.length > 0 ? (
                  <div className="space-y-2.5 pt-1">
                    {myBookings.map((bk) => {
                      const matchedVeh = vehicles.find(v => v.id === bk.vehicleId) || vehicles[0];
                      return (
                        <div key={bk.id} className="p-3.5 bg-slate-50/80 hover:bg-emerald-50/40 rounded-2xl border border-slate-200/80 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-black bg-[#006a4e] text-white px-2 py-0.5 rounded-full">
                                {bk.vehicleType}
                              </span>
                              <h4 className="text-xs font-black text-slate-900">
                                {bk.vehicleName}
                              </h4>
                              <span className="text-[10px] font-bold text-slate-400">
                                📅 {bk.date}
                              </span>
                            </div>

                            <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                              <MapPin size={12} className="text-[#006a4e]" />
                              <span>{bk.pickupLocation} ➔ {bk.destination}</span>
                            </p>

                            <p className="text-[11px] font-bold text-slate-500">
                              👨‍✈️ চালক/প্রোভাইডার: {bk.providerName} ({bk.providerPhone})
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              setReviewTargetDriver({
                                name: bk.providerName,
                                phone: bk.providerPhone,
                                route: `${bk.pickupLocation} ➔ ${bk.destination}`
                              });
                              setReviewVehicle(matchedVeh);
                            }}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-900 text-xs font-black transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer border-none shrink-0"
                          >
                            <Star size={13} className="fill-slate-900 text-slate-900" />
                            <span>চালকের রেটিং দিন</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-1.5">
                    <p className="text-xs font-bold text-slate-600">
                      আপনার সাম্প্রতিক কোনো বুকিং নেই।
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      পুঠিয়ায় যেকোনো চালকের গাড়িতে যাতায়াত করে থাকলে নিচের চালকদের তালিকা থেকে সরাসরি আপনার মতামত জানাতে পারেন।
                    </p>
                  </div>
                )}
              </div>

              {/* Section 2: Top Rated Drivers Scorecards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <Sparkles size={16} className="text-amber-500" />
                      <span>পুঠিয়া উপজেলার শীর্ষ রেটিংপ্রাপ্ত চালকবৃন্দ</span>
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500">যাত্রীদের প্রশংসাপ্রাপ্ত নিরাপদ ও বিশ্বস্ত ড্রাইভার</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    {
                      name: 'মো: রানা হোসেন',
                      phone: '01711223344',
                      vehicle: 'টয়োটা নোয়া এক্স হাইব্রিড',
                      type: 'মাইক্রোবাস',
                      rating: 5.0,
                      reviews: 18,
                      tags: ['নিরাপদ ড্রাইভিং', 'সময়নিষ্ঠ', 'পরিচ্ছন্ন গাড়ি'],
                      union: 'পুঠিয়া সদর'
                    },
                    {
                      name: 'মো: রফিকুল ইসলাম',
                      phone: '01712345601',
                      vehicle: 'মিশুক অটো রিকশা (৬ সিট)',
                      type: 'অটোরিকশা',
                      rating: 4.9,
                      reviews: 24,
                      tags: ['ন্যায্য ভাড়া', 'বিনয়ী চালক', 'সৎ মানুষ'],
                      union: 'পুঠিয়া সদর / রাজবাড়ি'
                    },
                    {
                      name: 'মো: সালাম উদ্দিন',
                      phone: '01711122233',
                      vehicle: 'চার্জার ইঞ্জিন ভ্যান গাড়ি',
                      type: 'ভ্যান গাড়ি',
                      rating: 5.0,
                      reviews: 14,
                      tags: ['দক্ষ চালক', 'মালামাল বহনে সহায়ক'],
                      union: 'বানেশ্বর হাট'
                    },
                    {
                      name: 'আনিসুর রহমান',
                      phone: '01733445566',
                      vehicle: 'সিএনজি ফোর-স্ট্রোক অটো',
                      type: 'সিএনজি',
                      rating: 5.0,
                      reviews: 16,
                      tags: ['নিরাপদ ড্রাইভ', 'পরিবারের জন্য নিরাপদ'],
                      union: 'বেলপুকুরিয়া'
                    },
                    {
                      name: 'মো: আব্দুল মতিন',
                      phone: '01712998877',
                      vehicle: 'জরুরি অক্সিজেন অ্যাম্বুলেন্স',
                      type: 'অ্যাম্বুলেন্স',
                      rating: 5.0,
                      reviews: 29,
                      tags: ['২৪ ঘণ্টা সজাগ', 'জরুরি সময়ে পাশে', 'দক্ষ চালক'],
                      union: 'পুঠিয়া স্বাস্থ্য কমপ্লেক্স'
                    },
                    {
                      name: 'মো: বাবুল হোসেন',
                      phone: '01755667788',
                      vehicle: 'টাটা এইস ১-টন পিকআপ',
                      type: 'পিকআপ',
                      rating: 4.8,
                      reviews: 12,
                      tags: ['আম পরিবহনে দক্ষ', 'ন্যায্য ভাড়া'],
                      union: 'জিউপাড়া ইউনিয়ন'
                    }
                  ].map((driver, idx) => {
                    const matchedVeh = vehicles.find(v => v.driverInfo?.name === driver.name || v.name.includes(driver.vehicle)) || vehicles[0];
                    return (
                      <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2.5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006a4e] flex items-center justify-center font-black text-sm border border-emerald-100">
                              👨‍✈️
                            </div>
                            <div>
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                                {driver.name}
                              </h4>
                              <p className="text-[11px] font-bold text-slate-500">
                                {driver.type} • {driver.union}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                            <Star size={13} className="fill-amber-400 text-amber-500" />
                            <span className="text-xs font-black text-amber-700">{driver.rating}</span>
                          </div>
                        </div>

                        <div className="text-[11px] font-medium text-slate-600 bg-slate-50 p-2 rounded-xl">
                          🚗 বাহন: <span className="font-bold text-slate-800">{driver.vehicle}</span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {driver.tags.map(t => (
                            <span key={t} className="text-[9px] font-bold bg-emerald-50 text-[#006a4e] px-2 py-0.5 rounded-md border border-emerald-100">
                              {t}
                            </span>
                          ))}
                        </div>

                        <div className="pt-1 flex items-center gap-2">
                          <a
                            href={`tel:${driver.phone}`}
                            className="flex-1 py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-[#006a4e] rounded-xl text-xs font-black flex items-center justify-center gap-1 border border-emerald-100"
                          >
                            <Phone size={12} />
                            <span>কল করুন</span>
                          </a>

                          <button
                            onClick={() => {
                              setReviewTargetDriver({ name: driver.name, phone: driver.phone });
                              setReviewVehicle(matchedVeh);
                            }}
                            className="flex-1 py-1.5 px-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl text-xs font-black flex items-center justify-center gap-1 border-none cursor-pointer shadow-xs"
                          >
                            <Star size={12} className="fill-slate-900 text-slate-900" />
                            <span>রিভিউ দিন</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Live Passenger Reviews Stream */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <MessageSquare size={16} className="text-[#006a4e]" />
                      <span>সকল সাম্প্রতিক যাত্রী রিভিউ ও মূল্যায়ন</span>
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500">রিয়েল-টাইম আপডেট হওয়া যাত্রী অভিজ্ঞতা</p>
                  </div>
                  <span className="text-xs font-extrabold text-slate-500">
                    মোট {liveReviews.length} টি রিভিউ
                  </span>
                </div>

                <div className="space-y-3">
                  {liveReviews.map((rev) => (
                    <div key={rev.id} className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100/90 shadow-xs hover:border-emerald-200/80 hover:shadow-md transition-all space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={rev.userAvatar || '/logo.svg'}
                            alt={rev.userName}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs sm:text-sm font-black text-slate-900">{rev.userName}</span>
                              {rev.verifiedRide && (
                                <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                                  ✓ যাচাইকৃত ভ্রমণ
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold block">{rev.date}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-100">
                          <Star size={14} className="fill-amber-400 text-amber-500" />
                          <span className="font-black text-amber-800">{rev.driverRating || rev.rating || 5}</span>
                        </div>
                      </div>

                      {/* Route and Driver Tag */}
                      <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {rev.driverName && (
                          <span className="font-bold text-[#006a4e]">
                            👨‍✈️ চালক: {rev.driverName}
                          </span>
                        )}
                        {rev.vehicleName && (
                          <span className="text-slate-500 font-medium">
                            🚗 {rev.vehicleName}
                          </span>
                        )}
                        {rev.rideRoute && (
                          <span className="text-slate-600 font-bold">
                            📍 {rev.rideRoute}
                          </span>
                        )}
                        {rev.farePaid && (
                          <span className="text-slate-600 font-bold">
                            ৳ ভাড়া: {rev.farePaid}
                          </span>
                        )}
                      </div>

                      {/* Feedback Tags */}
                      {rev.feedbackTags && rev.feedbackTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {rev.feedbackTags.map(tag => (
                            <span key={tag} className="text-[10px] font-bold bg-emerald-50 text-[#006a4e] border border-emerald-100 px-2 py-0.5 rounded-lg">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Comment text */}
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {rev.comment}
                      </p>

                      {/* Recommendation */}
                      {rev.recommended !== false && (
                        <div className="pt-1 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                          <span>👍</span>
                          <span>এই চালকের সেবা অন্যান্য যাত্রীদের জন্য সুপারিশকৃত</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* MODALS */}
      {/* 1. Vehicle Details Modal */}
      <VehicleDetailsModal
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onOpenBooking={(v) => {
          setSelectedVehicle(null);
          setBookingVehicle(v);
        }}
        onOpenReport={(v) => {
          setSelectedVehicle(null);
          setReportVehicle(v);
        }}
        onOpenProvider={(v) => {
          setSelectedVehicle(null);
          setProviderVehicle(v);
        }}
        onOpenReviewModal={(v) => {
          setSelectedVehicle(null);
          setReviewVehicle(v);
        }}
      />

      {/* 2. Booking Modal */}
      <BookingModal
        isOpen={!!bookingVehicle}
        vehicle={bookingVehicle}
        onClose={() => setBookingVehicle(null)}
        onSuccess={() => {
          setBookingVehicle(null);
          try {
            const bks = JSON.parse(localStorage.getItem('p_vehicle_bookings') || '[]');
            setMyBookings(bks);
          } catch {}
          toast.success('বুকিং রিকোয়েস্ট সফলভাবে জমা দেওয়া হয়েছে!');
        }}
      />

      {/* 3. Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSuccess={handleAddSuccess}
      />

      {/* 4. Admin Management Modal */}
      {isAdmin && (
        <AdminVehicleModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          vehicles={vehicles}
          onUpdateVehicles={(updatedList) => setVehicles(updatedList)}
        />
      )}

      {/* 5. Provider Profile Modal */}
      {providerVehicle && providerVehicle.provider && (
        <ProviderProfileModal
          isOpen={!!providerVehicle}
          vehicle={providerVehicle}
          allVehicles={vehicles}
          onClose={() => setProviderVehicle(null)}
          onSelectVehicle={(v) => {
            setProviderVehicle(null);
            setSelectedVehicle(v);
          }}
          onOpenReviewModal={(v) => {
            setProviderVehicle(null);
            setReviewVehicle(v);
          }}
        />
      )}

      {/* 6. Report Modal */}
      {reportVehicle && (
        <ReportModal
          isOpen={!!reportVehicle}
          vehicle={reportVehicle}
          onClose={() => setReportVehicle(null)}
        />
      )}

      {/* 7. Driver Rating & Review Modal */}
      <DriverReviewModal
        isOpen={!!reviewVehicle}
        vehicle={reviewVehicle}
        driverName={reviewTargetDriver?.name}
        driverPhone={reviewTargetDriver?.phone}
        prefillRoute={reviewTargetDriver?.route}
        onClose={() => {
          setReviewVehicle(null);
          setReviewTargetDriver(undefined);
        }}
        onReviewSubmitted={(newRev) => {
          setLiveReviews(prev => [newRev, ...prev.filter(r => r.id !== newRev.id)]);
        }}
      />

      <Footer />
      <BottomNavigation activeTab="services" onTabChange={() => {}} />
    </div>
  );
}
