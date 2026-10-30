import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, ExternalLink } from 'lucide-react';
import { FootballSponsor } from '../../../types/football';
import { getSponsors, saveSponsor } from '../../../services/footballService';

export const FootballSponsorsPage: React.FC = () => {
  const [sponsors, setSponsors] = useState<FootballSponsor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [tier, setTier] = useState<FootballSponsor['tier']>('gold');

  useEffect(() => {
    getSponsors().then(setSponsors);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await saveSponsor({
      name,
      tier,
      logoUrl: '',
      status: 'active'
    });
    setName('');
    setIsModalOpen(false);
    getSponsors().then(setSponsors);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="text-amber-500" size={20} />
            <span>স্পনসর ও পার্টনার ব্যবস্থাপনা (Sponsors)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">টুর্নামেন্টের টাইটেল স্পনসর, গোল্ড ও অ্যাসোসিয়েট পার্টনার তালিকা।</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#0B7A3B] text-white rounded-xl text-xs font-black flex items-center gap-2"
        >
          <Plus size={16} />
          <span>নতুন স্পনসর যোগ করুন</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {sponsors.map(s => (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 shadow-2xs">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 uppercase">
              {s.tier} Sponsor
            </span>
            <h4 className="text-sm font-black text-slate-900">{s.name}</h4>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-3">
            <h3 className="text-base font-black">নতুন স্পনসর যোগ</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="স্পনসর প্রতিষ্ঠানের নাম"
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              />
              <select
                value={tier}
                onChange={e => setTier(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
              >
                <option value="title">টাইটেল স্পনসর (Title)</option>
                <option value="platinum">প্লাটিনাম পার্টনার</option>
                <option value="gold">গোল্ড স্পনসর</option>
                <option value="silver">সিলভার পার্টনার</option>
                <option value="associate">সহযোগী সংগঠন</option>
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 text-xs">বাতিল</button>
                <button type="submit" className="px-4 py-2 bg-[#0B7A3B] text-white rounded-xl text-xs font-black">সংরক্ষণ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
