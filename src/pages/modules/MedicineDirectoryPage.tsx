import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Mic, 
  MicOff,
  Calculator, 
  Clock, 
  Pill, 
  Sparkles, 
  FileText, 
  ChevronRight, 
  ShieldCheck, 
  Info, 
  Check, 
  X, 
  Type,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Medicine, HealthProblemCategory, CalculatorItem } from '../../types/medicine';
import { 
  HEALTH_PROBLEM_CATEGORIES, 
  DOSAGE_FORMS, 
  POPULAR_SEARCH_KEYWORDS,
  INITIAL_MEDICINES 
} from '../../data/initialMedicines';
import { medicineService } from '../../services/medicineService';
import { MedicineDetailsModal } from '../../components/medicine/MedicineDetailsModal';
import { MedicineCalculatorModal } from '../../components/medicine/MedicineCalculatorModal';
import { PriceReportModal } from '../../components/medicine/PriceReportModal';
import { AdminMedicineModal } from '../../components/medicine/AdminMedicineModal';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

const MedicineDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  // Data State
  const [medicines, setMedicines] = useState<Medicine[]>(INITIAL_MEDICINES);
  const [selectedCategory, setSelectedCategory] = useState<HealthProblemCategory | 'all'>('all');
  const [selectedDosageForm, setSelectedDosageForm] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals State
  const [activeMedicine, setActiveMedicine] = useState<Medicine | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calculatorItems, setCalculatorItems] = useState<CalculatorItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('temp_calculator_items') || '[]');
    } catch {
      return [];
    }
  });
  const [isPriceReportOpen, setIsPriceReportOpen] = useState(false);
  const [reportingMed, setReportingMed] = useState<Medicine | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Recently Viewed Medicines
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('recently_viewed_meds') || '["med_anasec_20"]');
    } catch {
      return ['med_anasec_20'];
    }
  });

  // Voice Search State
  const [isListening, setIsListening] = useState(false);

  // Font Size Scaler (AA)
  const [fontScale, setFontScale] = useState<'normal' | 'large' | 'xlarge'>('normal');

  // Check if current user is Super Admin
  const isSuperAdmin = userProfile?.role === 'super_admin' || userProfile?.role === 'admin' || user?.email === 'mdzosimuddin31@gmail.com';

  // Real-time Firestore Subscription
  useEffect(() => {
    const unsubscribe = medicineService.subscribeMedicines((data) => {
      if (data && data.length > 0) {
        setMedicines(data);
      }
    });
    return () => unsubscribe();
  }, []);

  // Save calculator items to localStorage
  useEffect(() => {
    localStorage.setItem('temp_calculator_items', JSON.stringify(calculatorItems));
  }, [calculatorItems]);

  const toBengaliNumber = (num: number = 0) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toFixed(2).replace(/[0-9]/g, (d) => bengaliDigits[parseInt(d)]);
  };

  // Open Details Modal and record recently viewed
  const handleOpenDetails = (med: Medicine) => {
    setActiveMedicine(med);
    medicineService.incrementViews(med.id);
    
    // Update recently viewed
    const updated = [med.id, ...recentlyViewedIds.filter(id => id !== med.id)].slice(0, 5);
    setRecentlyViewedIds(updated);
    localStorage.setItem('recently_viewed_meds', JSON.stringify(updated));
  };

  // Open Calculator with a specific medicine pre-added
  const handleAddMedToCalculator = (med: Medicine) => {
    const existingIndex = calculatorItems.findIndex(i => i.medicine.id === med.id);
    let updated: CalculatorItem[];
    if (existingIndex > -1) {
      updated = [...calculatorItems];
      updated[existingIndex].quantity += 1;
    } else {
      updated = [...calculatorItems, {
        medicine: med,
        quantity: 1,
        packageType: 'piece',
        totalPrice: med.unitPrice
      }];
    }
    setCalculatorItems(updated);
    setIsCalculatorOpen(true);
    toast.success(`${med.brandName} ক্যালকুলেটরে যোগ করা হয়েছে`);
  };

  // Voice Search Handler
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.info('আপনার ব্রাউজারে ভয়েস সার্চ সাপোর্ট নেই। কিবোর্ড ব্যবহার করুন।');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'bn-BD';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        toast.info('ওষুধের নাম বলুন...');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.error('ভয়েস শনাক্ত করা যায়নি');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Filtered Medicines List
  const filteredMedicines = useMemo(() => {
    return medicines.filter((med) => {
      // 1. Search Query Filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesBrand = med.brandName.toLowerCase().includes(query) || (med.brandNameBn && med.brandNameBn.includes(query));
        const matchesGeneric = med.genericName.toLowerCase().includes(query) || (med.genericNameBn && med.genericNameBn.includes(query));
        const matchesCompany = med.manufacturer.toLowerCase().includes(query) || (med.manufacturerBn && med.manufacturerBn.includes(query));
        const matchesIndication = med.indications && med.indications.toLowerCase().includes(query);
        if (!matchesBrand && !matchesGeneric && !matchesCompany && !matchesIndication) {
          return false;
        }
      }

      // 2. Health Problem Category Filter
      if (selectedCategory !== 'all') {
        if (!med.categories || !med.categories.includes(selectedCategory)) {
          return false;
        }
      }

      // 3. Dosage Form Filter
      if (selectedDosageForm !== 'all') {
        if (med.dosageForm !== selectedDosageForm) {
          return false;
        }
      }

      return true;
    });
  }, [medicines, searchQuery, selectedCategory, selectedDosageForm]);

  // Recently viewed medicine objects
  const recentlyViewedMedicines = useMemo(() => {
    return recentlyViewedIds
      .map(id => medicines.find(m => m.id === id))
      .filter((m): m is Medicine => m !== undefined);
  }, [recentlyViewedIds, medicines]);

  // Alternative medicines for active medicine
  const alternatives = useMemo(() => {
    if (!activeMedicine) return [];
    return medicineService.getAlternativesByGeneric(activeMedicine.genericName, activeMedicine.id);
  }, [activeMedicine, medicines]);

  // Font scale class helper
  const getFontScaleClass = () => {
    if (fontScale === 'large') return 'text-[15px]';
    if (fontScale === 'xlarge') return 'text-[16px]';
    return 'text-sm';
  };

  return (
    <div className={`min-h-screen bg-[#f8faf9] text-slate-800 font-sans pb-24 select-none ${getFontScaleClass()}`}>
      
      {/* 1. Header with Back, Title, Calculator Icon Badge, Font Size Adjuster */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/services')}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-700 transition cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              ওষুধের দাম ও তথ্য
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Super Admin Control */}
            {isSuperAdmin && (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-xs cursor-pointer"
                title="ওষুধ অ্যাডমিন প্যানেল"
              >
                <Plus size={14} />
                <span>অ্যাডমিন</span>
              </button>
            )}

            {/* Prescription / Calculator Icon with Badge (Matching 2nd picture) */}
            <button
              onClick={() => setIsCalculatorOpen(true)}
              className="relative p-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition cursor-pointer"
              title="ওষুধের হিসাব"
              aria-label="Calculator"
            >
              <FileText size={20} className="text-emerald-700" />
              {calculatorItems.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs px-0.5">
                  {calculatorItems.length}
                </span>
              )}
            </button>

            {/* Font Size Adjuster (AA) */}
            <button
              onClick={() => {
                if (fontScale === 'normal') setFontScale('large');
                else if (fontScale === 'large') setFontScale('xlarge');
                else setFontScale('normal');
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-black transition cursor-pointer"
              title="লেখার সাইজ পরিবর্তন করুন"
            >
              AA
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-xl mx-auto px-4 pt-4 space-y-4">

        {/* 2. Search Bar with Voice Search Button */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search size={18} className="absolute left-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ওষুধ, জেনেরিক বা কোম্পানির নাম"
              className="w-full pl-10 pr-11 py-3 bg-white rounded-2xl border border-slate-200/90 text-sm font-bold text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            <button
              onClick={handleVoiceSearch}
              className={`absolute right-3 p-1.5 rounded-full transition cursor-pointer ${
                isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-400 hover:text-emerald-600'
              }`}
              title="মুখে বলে খুঁজুন"
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          </div>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* 3. জনপ্রিয় খোঁজ (Popular Search Tags) */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500">জনপ্রিয় খোঁজ</span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
            {POPULAR_SEARCH_KEYWORDS.map((item) => {
              const isSelected = searchQuery.toLowerCase() === item.query.toLowerCase() || searchQuery === item.label;
              return (
                <button
                  key={item.query}
                  onClick={() => setSearchQuery(isSelected ? '' : item.label)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer border shadow-2xs ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200/90 hover:border-emerald-400 hover:text-emerald-700'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. ওষুধের হিসাব Banner (Green Gradient Card matching Image 2) */}
        <div
          onClick={() => setIsCalculatorOpen(true)}
          className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl p-4 text-white shadow-md shadow-emerald-700/20 flex items-center justify-between gap-3 cursor-pointer group hover:opacity-95 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs shrink-0 shadow-inner">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black leading-tight">ওষুধের হিসাব</h3>
              <p className="text-[11px] font-semibold text-emerald-100 mt-0.5 leading-snug">
                কোন ওষুধ কতটা লাগবে, মোট কত টাকা — দোকানের বিলের সাথে মিলিয়ে নিন
              </p>
            </div>
          </div>
          <ChevronRight size={22} className="text-white/80 group-hover:translate-x-1 transition-transform shrink-0" />
        </div>

        {/* 5. সম্প্রতি দেখা (Recently Viewed Card matching Image 2) */}
        {recentlyViewedMedicines.length > 0 && searchQuery.trim() === '' && selectedCategory === 'all' && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
              <Clock size={15} className="text-slate-400" />
              <span>সম্প্রতি দেখা</span>
            </div>

            <div className="space-y-2">
              {recentlyViewedMedicines.slice(0, 1).map((med) => (
                <div
                  key={med.id}
                  onClick={() => handleOpenDetails(med)}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-3 hover:border-emerald-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                      <Pill size={22} className="text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {med.brandName}
                        </span>
                        {med.brandNameBn && (
                          <span className="text-xs font-bold text-slate-500">
                            ({med.brandNameBn})
                          </span>
                        )}
                        <span className="text-xs font-extrabold text-slate-500">
                          {med.strength}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-teal-700 truncate">
                        {med.genericName} {med.genericNameBn && <span className="text-slate-500 font-medium">({med.genericNameBn})</span>}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                        {med.dosageFormBn} • {med.manufacturerBn || med.manufacturer}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-slate-900 block">
                      ৳{toBengaliNumber(med.unitPrice)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold block">
                      প্রতি পিস
                    </span>
                    {med.packSizeText && (
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        {med.packSizeText}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. সমস্যা অনুযায়ী খুঁজুন (Browse by Condition / Symptoms 2-Column Grid matching Image 2) */}
        {searchQuery.trim() === '' && (
          <div className="space-y-2.5">
            <h2 className="text-sm font-black text-slate-900">সমস্যা অনুযায়ী খুঁজুন</h2>
            <div className="grid grid-cols-2 gap-2">
              {HEALTH_PROBLEM_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800'
                    }`}
                  >
                    <span className="text-xl shrink-0">{cat.emoji}</span>
                    <span className="text-xs font-black truncate">{cat.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. ধরন অনুযায়ী (Dosage Forms Horizontal Pills) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500">ধরন অনুযায়ী</h3>
            {selectedDosageForm !== 'all' && (
              <button
                onClick={() => setSelectedDosageForm('all')}
                className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                সব ধরন
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
            {DOSAGE_FORMS.map((form) => {
              const isSelected = selectedDosageForm === form.id;
              return (
                <button
                  key={form.id}
                  onClick={() => setSelectedDosageForm(isSelected && form.id !== 'all' ? 'all' : form.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all cursor-pointer border shadow-2xs ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200/90 hover:border-emerald-300 hover:text-emerald-700'
                  }`}
                >
                  <span className="text-sm shrink-0">{form.emoji}</span>
                  <span className="shrink-0">{form.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 8. একই ওষুধ, কম দামে (Info Card matching Image 2) */}
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-3.5 rounded-2xl border border-teal-100 flex items-start gap-2.5 text-xs text-teal-950 shadow-2xs">
          <Sparkles size={18} className="text-teal-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-black text-teal-900 leading-tight">একই ওষুধ, কম দামে</h4>
            <p className="text-[11px] text-teal-800/90 font-medium leading-relaxed">
              প্রতিটি ওষুধের পেজে একই উপাদানের অন্য কোম্পানির ওষুধ দাম অনুযায়ী দেখানো হয় — ডাক্তারের সাথে কথা বলে নিতে পারেন।
            </p>
          </div>
        </div>

        {/* 9. বেশি দেখা ওষুধ / Medicines List matching Image 2 */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">
              {searchQuery ? `খোঁজের ফলাফল (${filteredMedicines.length}টি)` : selectedCategory !== 'all' ? 'ক্যাটাগরির ওষুধসমূহ' : 'বেশি দেখা ওষুধ'}
            </h3>
            {(searchQuery || selectedCategory !== 'all' || selectedDosageForm !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedDosageForm('all');
                }}
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                ফিল্টার রিসেট
              </button>
            )}
          </div>

          {filteredMedicines.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
              <Pill size={36} className="mx-auto text-slate-300" />
              <p className="text-xs font-black text-slate-700">কোনো ওষুধ পাওয়া যায়নি</p>
              <p className="text-[11px] text-slate-400">নাম বা জেনেরিক ঠিক আছে কি না চেক করুন।</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMedicines.map((med) => (
                <div
                  key={med.id}
                  onClick={() => handleOpenDetails(med)}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-3 hover:border-emerald-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-amber-50/80 border border-amber-100/70 flex items-center justify-center shrink-0">
                      <Pill size={22} className="text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {med.brandName}
                        </span>
                        {med.brandNameBn && (
                          <span className="text-xs font-bold text-slate-500">
                            ({med.brandNameBn})
                          </span>
                        )}
                        <span className="text-xs font-extrabold text-slate-500">
                          {med.strength}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-teal-700 truncate">
                        {med.genericName} {med.genericNameBn && <span className="text-slate-500 font-medium">({med.genericNameBn})</span>}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                        {med.dosageFormBn} • {med.manufacturerBn || med.manufacturer}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-slate-900 block">
                      ৳{toBengaliNumber(med.unitPrice)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold block">
                      প্রতি পিস
                    </span>
                    {med.packSizeText && (
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        {med.packSizeText}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 10. Bottom Community Verification Notice matching Image 2 */}
        <div className="bg-slate-100/80 rounded-2xl p-4 space-y-2 text-slate-600 text-xs border border-slate-200/60">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              প্রতিটি ওষুধের দাম হালনাগাদের তারিখ দেখানো আছে। দোকানে আলাদা দাম পেলে ওষুধের পেজে <span className="font-bold text-slate-800">"দাম জানান"</span> চাপুন — যাচাইয়ের পর সবার জন্য হালনাগাদ হবে।
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 leading-relaxed font-medium">
            ⚕️ তথ্য শুধু জানার জন্য — ডাক্তারের পরামর্শ ছাড়া ওষুধ খাবেন না বা বদলাবেন না। দাম দোকানভেদে কিছুটা আলাদা হতে পারে।
          </div>
        </div>

      </main>

      {/* Details Modal */}
      <AnimatePresence>
        {activeMedicine && (
          <MedicineDetailsModal
            medicine={activeMedicine}
            alternatives={alternatives}
            onClose={() => setActiveMedicine(null)}
            onSelectAlternative={(alt) => setActiveMedicine(alt)}
            onOpenCalculatorWithMed={(med) => handleAddMedToCalculator(med)}
            onOpenPriceReport={(med) => {
              setReportingMed(med);
              setIsPriceReportOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Calculator Modal */}
      <AnimatePresence>
        {isCalculatorOpen && (
          <MedicineCalculatorModal
            initialItems={calculatorItems}
            allMedicines={medicines}
            onClose={() => setIsCalculatorOpen(false)}
            onClear={() => setCalculatorItems([])}
            onUpdateItems={(items) => setCalculatorItems(items)}
          />
        )}
      </AnimatePresence>

      {/* Price Report Modal */}
      <AnimatePresence>
        {isPriceReportOpen && reportingMed && (
          <PriceReportModal
            medicine={reportingMed}
            onClose={() => {
              setIsPriceReportOpen(false);
              setReportingMed(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Super Admin Modal */}
      <AnimatePresence>
        {isAdminModalOpen && (
          <AdminMedicineModal
            medicines={medicines}
            onClose={() => setIsAdminModalOpen(false)}
            onRefresh={() => {}}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default MedicineDirectoryPage;
