import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Users,
  Trophy,
  CheckCircle,
  XCircle,
  X,
  Sparkles
} from 'lucide-react';
import { FootballClub, FootballTeam, FootballTournament } from '../../../types/football';
import {
  subscribeClubs,
  subscribeTeams,
  subscribeTournaments,
  saveClub,
  saveTeam
} from '../../../services/footballService';

export const FootballClubsPage: React.FC = () => {
  const [clubs, setClubs] = useState<FootballClub[]>([]);
  const [teams, setTeams] = useState<FootballTeam[]>([]);
  const [tournaments, setTournaments] = useState<FootballTournament[]>([]);
  const [activeTab, setActiveTab] = useState<'clubs' | 'teams'>('clubs');

  const [isClubModalOpen, setIsClubModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Partial<FootballClub> | null>(null);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Partial<FootballTeam> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubClubs = subscribeClubs(setClubs);
    const unsubTeams = subscribeTeams(setTeams);
    const unsubTournaments = subscribeTournaments(setTournaments);
    return () => {
      unsubClubs();
      unsubTeams();
      unsubTournaments();
    };
  }, []);

  const handleOpenCreateClub = () => {
    setEditingClub({
      name: '',
      nameEn: '',
      address: 'পুঠিয়া, রাজশাহী',
      contactPhone: '',
      status: 'approved'
    });
    setIsClubModalOpen(true);
  };

  const handleSaveClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClub || !editingClub.name) return;
    try {
      setIsSubmitting(true);
      await saveClub(editingClub);
      setIsClubModalOpen(false);
      setEditingClub(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCreateTeam = () => {
    setEditingTeam({
      name: '',
      shortName: '',
      tournamentId: tournaments[0]?.id || '',
      badgeColor: '#1E40AF',
      coachName: '',
      captainName: '',
      registrationStatus: 'approved',
      squadPlayerIds: []
    });
    setIsTeamModalOpen(true);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam || !editingTeam.name) return;
    try {
      setIsSubmitting(true);
      await saveTeam(editingTeam);
      setIsTeamModalOpen(false);
      setEditingTeam(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Shield className="text-emerald-700" size={20} />
            <span>ক্লাব ও টুর্নামেন্ট টিম ব্যবস্থাপনা</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            মোট {clubs.length}টি নিবন্ধিত ক্লাব এবং {teams.length}টি সক্রিয় টুর্নামেন্ট দল
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'clubs' ? (
            <button
              type="button"
              onClick={handleOpenCreateClub}
              className="px-4 py-2 bg-[#0B7A3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={16} />
              <span>নতুন ক্লাব যোগ করুন</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenCreateTeam}
              className="px-4 py-2 bg-[#0B7A3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={16} />
              <span>নতুন দল (Team) যোগ করুন</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('clubs')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'clubs'
              ? 'bg-[#0B7A3B] text-white shadow-2xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          নিবন্ধিত ক্লাবসমূহ ({clubs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'teams'
              ? 'bg-[#0B7A3B] text-white shadow-2xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          টুর্নামেন্ট দলসমূহ ({teams.length})
        </button>
      </div>

      {/* Content depending on tab */}
      {activeTab === 'clubs' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-black text-sm">
                    {c.logoUrl ? <img src={c.logoUrl} alt={c.name} className="w-full h-full object-contain" /> : <Shield size={20} />}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    c.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {c.status === 'approved' ? 'অনুমোদিত' : 'অপেক্ষমাণ'}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 leading-tight">{c.name}</h4>
                  {c.nameEn && <p className="text-[10px] text-slate-400 font-medium">{c.nameEn}</p>}
                </div>
                <div className="text-[11px] text-slate-500 font-bold space-y-1">
                  <p className="flex items-center gap-1.5 truncate">
                    <MapPin size={12} className="text-rose-500 shrink-0" />
                    <span>{c.address}</span>
                  </p>
                  {c.contactPhone && (
                    <p className="flex items-center gap-1.5">
                      <Phone size={12} className="text-emerald-600 shrink-0" />
                      <span>{c.contactPhone}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingClub({ ...c });
                    setIsClubModalOpen(true);
                  }}
                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                  title="এডিট"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((t) => {
            const trn = tournaments.find(x => x.id === t.tournamentId);
            return (
              <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-xs"
                      style={{ backgroundColor: t.badgeColor || '#1E40AF' }}
                    >
                      <Shield size={20} />
                    </div>
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      স্কোয়াড: {t.squadPlayerIds?.length || 0} জন
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 leading-tight">{t.name}</h4>
                    {t.shortName && <p className="text-[11px] text-slate-500 font-bold">{t.shortName}</p>}
                  </div>
                  <div className="text-[11px] text-slate-500 font-bold space-y-1 pt-1 border-t border-slate-100">
                    <p className="text-emerald-800 font-black truncate">টুর্নামেন্ট: {trn?.name || 'অনির্ধারিত'}</p>
                    {t.coachName && <p>কোচ: {t.coachName}</p>}
                    {t.captainName && <p>অধিনায়ক: {t.captainName}</p>}
                  </div>
                </div>
                <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeam({ ...t });
                      setIsTeamModalOpen(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                    title="এডিট"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Club Modal */}
      {isClubModalOpen && editingClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingClub.id ? 'ক্লাব সম্পাদনা' : 'নতুন ক্লাব যোগ করুন'}
              </h3>
              <button type="button" onClick={() => setIsClubModalOpen(false)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveClub} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">ক্লাবের নাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  value={editingClub.name || ''}
                  onChange={(e) => setEditingClub({ ...editingClub, name: e.target.value })}
                  placeholder="নিউ ঈগল ফুটবল একাডেমি"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">ঠিকানা / এলাকা *</label>
                <input
                  type="text"
                  required
                  value={editingClub.address || ''}
                  onChange={(e) => setEditingClub({ ...editingClub, address: e.target.value })}
                  placeholder="হাট গোদাগাড়ী, রাজশাহী"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">যোগাযোগের নম্বর</label>
                <input
                  type="text"
                  value={editingClub.contactPhone || ''}
                  onChange={(e) => setEditingClub({ ...editingClub, contactPhone: e.target.value })}
                  placeholder="০১৭০০-০০০০০০"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">অনুমোদনের অবস্থা</label>
                <select
                  value={editingClub.status || 'approved'}
                  onChange={(e) => setEditingClub({ ...editingClub, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                >
                  <option value="approved">অনুমোদিত (Approved)</option>
                  <option value="pending">অপেক্ষমাণ (Pending)</option>
                  <option value="suspended">স্থগিত (Suspended)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClubModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#0B7A3B] text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Modal */}
      {isTeamModalOpen && editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingTeam.id ? 'দল সম্পাদনা' : 'নতুন দল (Team) যোগ করুন'}
              </h3>
              <button type="button" onClick={() => setIsTeamModalOpen(false)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveTeam} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">টুর্নামেন্ট নির্বাচন করুন *</label>
                <select
                  required
                  value={editingTeam.tournamentId || ''}
                  onChange={(e) => setEditingTeam({ ...editingTeam, tournamentId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                >
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">দলের পুরো নাম *</label>
                <input
                  type="text"
                  required
                  value={editingTeam.name || ''}
                  onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                  placeholder="নিউ ঈগল ফুটবল একাডেমি"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">সংক্ষিপ্ত নাম ও এলাকা</label>
                <input
                  type="text"
                  value={editingTeam.shortName || ''}
                  onChange={(e) => setEditingTeam({ ...editingTeam, shortName: e.target.value })}
                  placeholder="হাট গোদাগাড়ী"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">প্রধান কোচ</label>
                  <input
                    type="text"
                    value={editingTeam.coachName || ''}
                    onChange={(e) => setEditingTeam({ ...editingTeam, coachName: e.target.value })}
                    placeholder="কোচের নাম"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">অধিনায়ক (Captain)</label>
                  <input
                    type="text"
                    value={editingTeam.captainName || ''}
                    onChange={(e) => setEditingTeam({ ...editingTeam, captainName: e.target.value })}
                    placeholder="অধিনায়কের নাম"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">ব্যাজ / ব্যানার থিম কালার</label>
                <input
                  type="color"
                  value={editingTeam.badgeColor || '#1E40AF'}
                  onChange={(e) => setEditingTeam({ ...editingTeam, badgeColor: e.target.value })}
                  className="w-full h-9 rounded-xl border border-slate-200 cursor-pointer"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#0B7A3B] text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
