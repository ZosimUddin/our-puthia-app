import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, CheckCircle2, X } from 'lucide-react';
import { FootballVenue } from '../../../types/football';
import { getVenues, saveVenue } from '../../../services/footballService';

export const FootballVenuesPage: React.FC = () => {
  const [venues, setVenues] = useState<FootballVenue[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Partial<FootballVenue> | null>(null);

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    const list = await getVenues();
    setVenues(list);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVenue || !editingVenue.name) return;
    await saveVenue(editingVenue);
    setIsModalOpen(false);
    loadVenues();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <MapPin className="text-rose-600" size={20} />
            <span>মাঠ ও ভেন্যু ব্যবস্থাপনা (Grounds & Venues)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">টুর্নামেন্টের খেলার মাঠ, ধারণক্ষমতা ও ফ্লাডলাইট তথ্য পরিচালনা করুন।</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingVenue({
              name: '',
              location: 'পুঠিয়া, রাজশাহী',
              capacity: 5000,
              hasFloodlights: true,
              status: 'active'
            });
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-[#0B7A3B] text-white rounded-xl text-xs font-black flex items-center gap-2"
        >
          <Plus size={16} />
          <span>নতুন মাঠ যোগ করুন</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {venues.map(v => (
          <div key={v.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                {v.status === 'active' ? 'সক্রিয় মাঠ' : 'রক্ষণাবেক্ষণ'}
              </span>
              {v.hasFloodlights && (
                <span className="text-[10px] font-bold text-amber-600">💡 ফ্লাডলাইট আছে</span>
              )}
            </div>
            <h4 className="text-sm font-black text-slate-900">{v.name}</h4>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <MapPin size={12} className="text-rose-500" />
              {v.location}
            </p>
            {v.capacity && <p className="text-[11px] text-slate-400 font-bold">দর্শক ধারণক্ষমতা: ~{v.capacity.toLocaleString()} জন</p>}
          </div>
        ))}
      </div>

      {isModalOpen && editingVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-3">
            <h3 className="text-base font-black">মাঠের তথ্য যুক্ত করুন</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-black">মাঠের নাম *</label>
                <input
                  type="text"
                  required
                  value={editingVenue.name || ''}
                  onChange={(e) => setEditingVenue({ ...editingVenue, name: e.target.value })}
                  placeholder="উদা: মহিপাড়া উচ্চ বিদ্যালয় মাঠ"
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black">ঠিকানা / এলাকা *</label>
                <input
                  type="text"
                  required
                  value={editingVenue.location || ''}
                  onChange={(e) => setEditingVenue({ ...editingVenue, location: e.target.value })}
                  placeholder="দুর্গাপুর, রাজশাহী"
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="fl"
                  checked={editingVenue.hasFloodlights || false}
                  onChange={(e) => setEditingVenue({ ...editingVenue, hasFloodlights: e.target.checked })}
                />
                <label htmlFor="fl" className="text-xs font-bold text-slate-700">ফ্লাডলাইট আলোক সুবিধা আছে</label>
              </div>
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
