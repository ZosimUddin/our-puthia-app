import React from "react";
import { Link, useLocation } from "react-router-dom";

const Footer: React.FC<{ className?: string }> = ({ className }) => {
  const location = useLocation();
  const isHomePage = location.pathname === "/" || location.pathname === "/home";

  if (!isHomePage) return null;

  return (
    <footer className={`pt-4 pb-2 px-4 bg-transparent ${className || ""}`}>
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-1">
        {/* Links row - Single line, no dots, tighter spacing */}
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] font-black text-slate-500 uppercase tracking-tight">
          <Link to="/terms" className="hover:text-emerald-700 transition-colors">ব্যবহারের শর্তাবলী</Link>
          <Link to="/privacy" className="hover:text-emerald-700 transition-colors">গোপনীয়তা নীতি</Link>
          <Link to="/delete-account" className="hover:text-emerald-700 transition-colors">অ্যাকাউন্ট মুছুন</Link>
          <Link to="/guidelines" className="hover:text-emerald-700 transition-colors">শিশু সুরক্ষা</Link>
        </div>

        {/* Copyright row */}
        <div className="text-[10px] font-bold text-slate-400 tracking-tight">
          © 2026 আমাদের পুঠিয়া • তথ্যাভান্ডার সংরক্ষিত — স্বয়ংক্রিয়ভাবে কপি করা নিষেধ
        </div>

        {/* Disclaimer row */}
        <div className="text-[10px] leading-relaxed text-slate-400 max-w-lg font-bold px-4">
          আমাদের পুঠিয়া একটি বেসরকারি কমিউনিটি উদ্যোগ — কোনো সরকারি দপ্তরের সাথে যুক্ত নয়। সরকারি সেবার আনুষ্ঠানিক তথ্যের জন্য <a href="https://bangladesh.gov.bd" target="_blank" rel="noopener noreferrer" className="text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-emerald-600 transition-all">bangladesh.gov.bd</a> ও সংশ্লিষ্ট দপ্তর দেখুন।
        </div>
      </div>
    </footer>
  );
};

export default Footer;
