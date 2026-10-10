import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, IdCard, HelpCircle, Megaphone, CalendarClock,
  FileCheck2, MapPin, Bell, ShieldCheck, Diamond, Gift,
  ShieldAlert, Users, Headset, ArrowRight, ChevronRight, Sparkles, Lock, Wrench, Vote, Percent, Pill, CloudSun, Map, Car
} from 'lucide-react';
import { motion } from 'motion/react';
import Header from '../../components/home/Header';
import Footer from '../../components/home/Footer';
import BottomNavigation from '../../components/home/BottomNavigation';
import { Sidebar } from '../../components/Sidebar';
import { useAuth } from '../../contexts/AuthContext';

const ExclusiveFeaturesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const popularFeatures = [
    { title: 'বাংলাদেশ ভ্রমণ ম্যাপ', desc: '৬৪ জেলার ভ্রমণ ট্র্যাকার, কাস্টম ম্যাপ ও ইমেজ জেনারেটর', icon: <Map size={24} strokeWidth={1.5} />, color: 'text-[#009664]', bg: 'bg-emerald-50', path: '/travel-map' },
    { title: 'পুঠিয়া গাড়ি ভাড়া ও রাইড', desc: 'ভ্যান, অটো রিকশা, সিএনজি, নছিমন, পিকআপ ও মাইক্রোবাস', icon: <Car size={24} strokeWidth={1.5} />, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/vehicle-rental' },
    { title: 'আবহাওয়া ও পূর্বাভাস', desc: 'লাইভ আবহাওয়া, ১৬ দিনের পূর্বাভাস, বৃষ্টিপাত ও কৃষি পরামর্শ', icon: <CloudSun size={24} strokeWidth={1.5} />, color: 'text-blue-600', bg: 'bg-blue-50', path: '/weather' },
    { title: 'ওষুধের দাম ও তথ্য', desc: 'ওষুধের খুচরা মূল্য, জেনেরিক বিকল্প, বিলের হিসাব ও তথ্য', icon: <Pill size={24} strokeWidth={1.5} />, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/medicines' },
    { title: 'স্মার্ট রিমাইন্ডার', desc: 'গুরুত্বপূর্ণ তারিখ ও কাজের রিমাইন্ডার সেট করুন', icon: <CalendarClock size={24} strokeWidth={1.5} />, color: 'text-amber-600', bg: 'bg-amber-50', path: '/reminder' },
  ];

  return (
    <div className="min-h-screen bg-[#fafcfb] flex flex-col font-sans">
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
        <div className="px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Sparkles size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 leading-tight">এক্সক্লুসিভ ফিচার</h1>
              <p className="text-[14px] font-bold text-slate-500 mt-0.5">ভ্রমণ ম্যাপ, গাড়ি ভাড়া, আবহাওয়া, ওষুধের দাম ও রিমাইন্ডার</p>
            </div>
          </div>

          <div className="space-y-6">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#e6f7ef] to-[#f0fcf7] rounded-[24px] p-5 flex items-center gap-4 relative overflow-hidden border border-emerald-100/50 shadow-sm">
          <div className="relative z-10 w-[72px] h-[72px] shrink-0 flex items-center justify-center">
             <div className="absolute inset-0 bg-[#009664] opacity-20 rounded-full blur-md"></div>
             <div className="absolute inset-0 bg-[#009664] rounded-[16px] flex items-center justify-center shadow-lg shadow-emerald-500/30">
               <ShieldCheck size={36} className="text-white" strokeWidth={1.5} />
             </div>
             <div className="absolute -top-2 -left-2 bg-amber-400 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#e6f7ef] shadow-sm">
               <Star size={12} className="text-white fill-white" />
             </div>
          </div>
          <div className="relative z-10 flex-1 py-1">
            <h3 className="text-[16px] font-black text-[#01412F] leading-tight mb-1.5">বিশেষ সেবার মাধ্যমে<br/>সহজ হোক আপনার জীবন</h3>
            <p className="text-xs font-bold text-slate-500 leading-snug">
              ভ্রমণ ম্যাপ, পুঠিয়া গাড়ি ভাড়া ও রাইড, আবহাওয়া পূর্বাভাস, ওষুধের তালিকা ও স্মার্ট রিমাইন্ডার।
            </p>
          </div>
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-100 rounded-full blur-[40px] opacity-50 pointer-events-none"></div>
        </div>

        {/* Popular Features */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star size={20} className="text-[#009664] fill-[#009664]" strokeWidth={1} />
            <h2 className="text-[16px] font-black text-slate-800">জনপ্রিয় ফিচার</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {popularFeatures.map((feature, idx) => (
              <motion.button 
                key={idx}
                onClick={() => feature.path && navigate(feature.path)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[20px] p-4 flex flex-col items-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-slate-100/80 hover:border-emerald-100 hover:shadow-md transition-all relative group cursor-pointer"
              >
                <div className={`w-[60px] h-[60px] rounded-full ${feature.bg} flex items-center justify-center shrink-0 mb-3 group-hover:scale-110 transition-transform`}>
                  <div className={feature.color}>{feature.icon}</div>
                </div>
                
                <h3 className="text-[14px] font-black text-slate-800 leading-tight mb-1.5 group-hover:text-[#009664] transition-colors">{feature.title}</h3>
                <p className="text-xs font-bold text-slate-400 leading-snug mb-6">{feature.desc}</p>
                
                <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-[#009664]" strokeWidth={2.5} />
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        </div>
        </div>
      </main>

      <Footer />
      <BottomNavigation activeTab="services" onTabChange={() => {}} />
    </div>
  );
};

export default ExclusiveFeaturesPage;

