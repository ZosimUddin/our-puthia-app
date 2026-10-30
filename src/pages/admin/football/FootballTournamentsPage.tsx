import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Plus,
  Calendar,
  MapPin,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Shield,
  Layers,
  Sparkles,
  X,
  AlertTriangle
} from 'lucide-react';
import { FootballTournament, TournamentFormat, TournamentStatus } from '../../../types/football';
import {
  subscribeTournaments,
  saveTournament,
  deleteTournament,
  getVenues
} from '../../../services/footballService';

export const FootballTournamentsPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<FootballTournament[]>([]);
  const [venues, setVenues] = useState<{ id: string; name: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Partial<FootballTournament> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeTournaments(setTournaments);
    getVenues().then(v => setVenues(v.map(item => ({ id: item.id, name: item.name }))));
    return () => unsub();
  }, []);

  const handleOpenCreate = () => {
    setEditingTournament({
      name: '',
      nameEn: '',
      season: '2026',
      year: 2026,
      organizer: 'আমাদের পুঠিয়া ক্রীড়া পরিষদ',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      venueName: 'মহিপাড়া উচ্চ বিদ্যালয় মাঠ',
      venueAddress: 'দুর্গাপুর, রাজশাহী',
      format: 'knockout',
      matchDurationMinutes: 90,
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      tieBreakOrder: ['gd', 'gf', 'h2h'],
      description: 'খেলাধুলা সুস্থ দেহ, সুন্দর মন, গড়ে তোলে আগামীর স্বপ্ন।',
      status: 'ongoing',
      participatingTeamIds: []
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: FootballTournament) => {
    setEditingTournament({ ...t });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTournament || !editingTournament.name) return;

    try {
      setIsSubmitting(true);
      await saveTournament(editingTournament);
      setIsModalOpen(false);
      setEditingTournament(null);
    } catch (err) {
      console.error('Error saving tournament:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteTournament(id, name);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting tournament:', err);
    }
  };

  const getStatusBadge = (status: TournamentStatus) => {
    switch (status) {
      case 'ongoing':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">চলমান</span>;
      case 'registration_open':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">নিবন্ধন উন্মুক্ত</span>;
      case 'upcoming':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">আসন্ন</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-800 border border-slate-200">সমাপ্ত</span>;
      case 'draft':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">খসড়া</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Trophy className="text-amber-500" size={20} />
            <span>ফুটবল টুর্নামেন্ট ব্যবস্থাপনা (Tournament CRUD)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            মোট {tournaments.length}টি টুর্নামেন্ট রেকর্ড পাওয়া গেছে।
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-[#0B7A3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>নতুন টুর্নামেন্ট যোগ করুন</span>
        </button>
      </div>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tournaments.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
            <Trophy size={40} className="mx-auto text-slate-300" />
            <h4 className="text-sm font-black text-slate-700">কোনো টুর্নামেন্ট যুক্ত করা হয়নি</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              নতুন ফুটবল টুর্নামেন্ট তৈরি করতে উপরের বোতামে ক্লিক করুন।
            </p>
          </div>
        ) : (
          tournaments.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-emerald-300 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-black">
                    সিজন {t.season}
                  </span>
                  {getStatusBadge(t.status)}
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-2">{t.name}</h3>
                  {t.nameEn && <p className="text-[11px] text-slate-400 font-medium">{t.nameEn}</p>}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600 font-bold">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-emerald-700 shrink-0" />
                    <span>{t.startDate} হতে {t.endDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-rose-600 shrink-0" />
                    <span className="truncate">{t.venueName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers size={13} className="text-blue-600 shrink-0" />
                    <span>ফরম্যাট: {t.format === 'knockout' ? 'নকআউট' : t.format === 'league' ? 'লিগ' : 'গ্রুপ + নকআউট'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black text-slate-500">
                    দল: {t.participatingTeamIds?.length || 0}টি
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(t)}
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    title="সম্পাদনা করুন"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(t.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 border border-rose-100 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-black text-slate-900">টুর্নামেন্ট মুছে ফেলতে চান?</h4>
              <p className="text-xs text-slate-500 font-medium">
                এই টুর্নামেন্টটি মুছে ফেললে সংশ্লিষ্ট তথ্য মুছে যাবে। আপনি কি নিশ্চিত?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  const trn = tournaments.find(x => x.id === deleteConfirmId);
                  if (trn) handleDelete(trn.id, trn.name);
                }}
                className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl"
              >
                হ্যাঁ, মুছুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Tournament Modal */}
      {isModalOpen && editingTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-5 border border-slate-200 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trophy className="text-amber-500" size={20} />
                <h3 className="text-lg font-black text-slate-900">
                  {editingTournament.id ? 'টুর্নামেন্ট সম্পাদনা' : 'নতুন টুর্নামেন্ট তৈরি'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-black text-slate-700">টুর্নামেন্টের পুরো নাম (বাংলা) *</label>
                  <input
                    type="text"
                    required
                    value={editingTournament.name || ''}
                    onChange={(e) => setEditingTournament({ ...editingTournament, name: e.target.value })}
                    placeholder="উদা: আদর্শ ও ঐতিহ্যবাহী প্রাইজ মানি ফুটবল টুর্নামেন্ট মহিপাড়া ২০২৬"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#0B7A3B]/20 focus:border-[#0B7A3B] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">ইংরেজি নাম (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={editingTournament.nameEn || ''}
                    onChange={(e) => setEditingTournament({ ...editingTournament, nameEn: e.target.value })}
                    placeholder="Mohipada Football Tournament 2026"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#0B7A3B]/20 focus:border-[#0B7A3B] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">সিজন / বছর *</label>
                  <input
                    type="text"
                    required
                    value={editingTournament.season || ''}
                    onChange={(e) => setEditingTournament({ ...editingTournament, season: e.target.value })}
                    placeholder="2026"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#0B7A3B]/20 focus:border-[#0B7A3B] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">আয়োজক সংস্থা / সংগঠন *</label>
                  <input
                    type="text"
                    required
                    value={editingTournament.organizer || ''}
                    onChange={(e) => setEditingTournament({ ...editingTournament, organizer: e.target.value })}
                    placeholder="মহিপাড়া যুব সমাজ ও আদর্শ ক্রীড়া কল্যাণ সংসদ"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#0B7A3B]/20 focus:border-[#0B7A3B] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">টুর্নামেন্ট ফরম্যাট *</label>
                  <select
                    value={editingTournament.format || 'knockout'}
                    onChange={(e) => setEditingTournament({ ...editingTournament, format: e.target.value as TournamentFormat })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#0B7A3B]/20 focus:border-[#0B7A3B] outline-none"
                  >
                    <option value="knockout">নকআউট (Knockout)</option>
                    <option value="league">লিগ সিস্টেম (Round Robin League)</option>
                    <option value="group_knockout">গ্রুপ পর্ব + নকআউট</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">শুরুর তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={editingTournament.startDate || ''}
                    onChange={(e) => setEditingTournament({ ...editingTournament, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#0B7A3B]/20 focus:border-[#0B7A3B] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">সমাপ্তির তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={editingTournament.endDate || ''}
                    onChange={(e) => setEditingTournament({ ...editingTournament, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#0B7A3B]/20 focus:border-[#0B7A3B] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">প্রধান ভেন্যু / মাঠের নাম *</label>
                  <input
                    type="text"
                    required
                    value={editingTournament.venueName || ''}
                    onChange={(e) => setEditingTournament({ ...editingTournament, venueName: e.target.value })}
                    placeholder="মহিপাড়া উচ্চ বিদ্যালয় মাঠ"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#0B7A3B]/20 focus:border-[#0B7A3B] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">মাঠের ঠিকানা / উপজেলা *</label>
                  <input
                    type="text"
                    required
                    value={editingTournament.venueAddress || ''}
                    onChange={(e) => setEditingTournament({ ...editingTournament, venueAddress: e.target.value })}
                    placeholder="দুর্গাপুর, রাজশাহী"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#0B7A3B]/20 focus:border-[#0B7A3B] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">স্ট্যাটাস / প্রকাশ অবস্থা *</label>
                  <select
                    value={editingTournament.status || 'ongoing'}
                    onChange={(e) => setEditingTournament({ ...editingTournament, status: e.target.value as TournamentStatus })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#0B7A3B]/20 focus:border-[#0B7A3B] outline-none"
                  >
                    <option value="ongoing">চলমান (Ongoing)</option>
                    <option value="upcoming">আসন্ন (Upcoming)</option>
                    <option value="registration_open">নিবন্ধন উন্মুক্ত (Registration Open)</option>
                    <option value="draft">খসড়া (Draft)</option>
                    <option value="completed">সমাপ্ত (Completed)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">ম্যাচের স্থিতিকাল (মিনিট)</label>
                  <input
                    type="number"
                    value={editingTournament.matchDurationMinutes || 90}
                    onChange={(e) => setEditingTournament({ ...editingTournament, matchDurationMinutes: parseInt(e.target.value) || 90 })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#0B7A3B]/20 focus:border-[#0B7A3B] outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-black text-slate-700">সংক্ষিপ্ত বিবরণ ও নিয়মাবলী</label>
                  <textarea
                    rows={3}
                    value={editingTournament.description || ''}
                    onChange={(e) => setEditingTournament({ ...editingTournament, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#0B7A3B]/20 focus:border-[#0B7A3B] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#0B7A3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
