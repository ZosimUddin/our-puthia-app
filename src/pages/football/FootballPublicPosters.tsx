import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Palette, Download, ArrowLeft, Share2, Sparkles } from 'lucide-react';
import { FootballPosterConfig } from '../../types/football';
import { subscribePosters } from '../../services/footballService';
import { FootballPosterCanvas } from '../../components/football/FootballPosterCanvas';
import SEO from '../../components/SEO';

export const FootballPublicPosters: React.FC = () => {
  const { posterId } = useParams<{ posterId?: string }>();
  const [posters, setPosters] = useState<FootballPosterConfig[]>([]);
  const [selectedPosterId, setSelectedPosterId] = useState<string>(posterId || '');

  useEffect(() => {
    const unsub = subscribePosters(list => {
      setPosters(list);
      if (!selectedPosterId && list.length > 0) {
        setSelectedPosterId(posterId || list[0].id);
      }
    });
    return () => unsub();
  }, [posterId]);

  const activePoster = posters.find(p => p.id === selectedPosterId) || posters[0];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SEO
        title="ফুটবল টুর্নামেন্ট ব্যানার ও পোস্টার গ্যালারি — আমাদের পুঠিয়া"
        description="ফুটবল টুর্নামেন্টের আকর্ষণীয় অফিসিয়াল ব্যানার ও পোস্টার সরাসরি দেখুন এবং হাই-রেজ্যুলেশনে ডাউনলোড করুন।"
      />

      <div className="bg-[#0B7A3B] text-white py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-2">
          <Link to="/football" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-100 hover:text-white">
            <ArrowLeft size={14} />
            <span>ফুটবল পোর্টালে ফিরুন</span>
          </Link>
          <h1 className="text-2xl font-black">অফিসিয়াল ব্যানার ও পোস্টার গ্যালারি</h1>
          <p className="text-xs text-emerald-100">উচ্চ রেজ্যুলেশনে পোস্টার ডাউনলোড করে সোশ্যাল মিডিয়ায় শেয়ার করুন।</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {posters.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {posters.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPosterId(p.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  selectedPosterId === p.id
                    ? 'bg-[#0B7A3B] text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {p.matchRibbonText || 'ব্যানার'} ({p.teamAName} vs {p.teamBName})
              </button>
            ))}
          </div>
        )}

        {activePoster ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xl space-y-6">
            <div className="text-center space-y-1">
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
                {activePoster.matchRibbonText || 'ম্যাচ পোস্টার'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">{activePoster.mainTitleText}</h2>
              <p className="text-xs text-slate-500 font-bold">
                {activePoster.teamAName} বনাম {activePoster.teamBName} • {activePoster.dateText} ({activePoster.venueText})
              </p>
            </div>

            <FootballPosterCanvas config={activePoster} />
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400 bg-white rounded-3xl border border-dashed">
            কোনো পোস্টার তৈরি করা হয়নি।
          </div>
        )}
      </div>
    </div>
  );
};
