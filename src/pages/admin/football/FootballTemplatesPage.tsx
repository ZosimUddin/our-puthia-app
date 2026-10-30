import React from 'react';
import { Layers, Palette, Eye, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FootballTemplatesPage: React.FC = () => {
  const templates = [
    {
      id: 'mohipada_classic',
      name: 'মহিপাড়া ক্লাসিক ফ্লাডলাইট নাইট (রেফারেন্স স্টাইল)',
      desc: 'স্টেডিয়াম ফ্লাডলাইট, গোল্ডেন ট্রফি ও ডায়নামিক কার্ভ রিবন স্টাইল',
      badge: 'জনপ্রিয় ও নির্বাচিত',
      aspect: '16:9, 1200x630, 1080x1080, 1080x1350',
      active: true
    },
    {
      id: 'modern_dark',
      name: 'মডার্ন ডার্ক প্রাইজ মানি প্রো',
      desc: 'ডার্ক নিয়ন গ্লো, আধুনিক টিম শিল্ড ও মিনিমাল টেক্সট লেআউট',
      badge: 'প্রো স্টাইল',
      aspect: '16:9, 1:1, 4:5',
      active: true
    },
    {
      id: 'victory_gold',
      name: 'গোল্ডেন চ্যাম্পিয়নশিপ ফাইনাল',
      desc: 'ফাইনাল ও সেমিফাইনাল ম্যাচের আকর্ষণীয় গোল্ডেন লাক্সারি ফ্রেম',
      badge: 'ফাইনাল স্পেশাল',
      aspect: '16:9, 1:1',
      active: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Layers className="text-indigo-600" size={20} />
          <span>ডিজাইন টেমপ্লেট সংগ্রহ (Poster Template Gallery)</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          ফুটবল পোস্টার ও ব্যানার ডিজাইনারের জন্য পূর্বনির্ধারিত প্রিমিয়াম টেমপ্লেটসমূহ।
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {templates.map(t => (
          <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                {t.badge}
              </span>
              <h3 className="text-base font-black text-slate-900">{t.name}</h3>
              <p className="text-xs text-slate-500 font-medium">{t.desc}</p>
              <p className="text-[11px] text-slate-400 font-bold pt-2">সাপোর্টেড সাইজ: {t.aspect}</p>
            </div>

            <Link
              to="/admin/football/banner-designer"
              className="w-full py-2 bg-[#0B7A3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-black text-center flex items-center justify-center gap-2 shadow-xs"
            >
              <span>এই টেমপ্লেটে ব্যানার বানান</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
