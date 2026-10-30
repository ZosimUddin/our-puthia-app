import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  X,
  Filter
} from 'lucide-react';
import { FootballPlayer, FootballTeam, PlayerPosition } from '../../../types/football';
import {
  subscribePlayers,
  subscribeTeams,
  savePlayer
} from '../../../services/footballService';

export const FootballPlayersPage: React.FC = () => {
  const [players, setPlayers] = useState<FootballPlayer[]>([]);
  const [teams, setTeams] = useState<FootballTeam[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Partial<FootballPlayer> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubPlayers = subscribePlayers(setPlayers);
    const unsubTeams = subscribeTeams(setTeams);
    return () => {
      unsubPlayers();
      unsubTeams();
    };
  }, []);

  const handleOpenCreate = () => {
    setEditingPlayer({
      name: '',
      jerseyNumber: 10,
      position: 'forward',
      currentTeamId: teams[0]?.id || '',
      isActive: true,
      totalGoals: 0,
      yellowCards: 0,
      redCards: 0
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer || !editingPlayer.name) return;

    try {
      setIsSubmitting(true);
      await savePlayer(editingPlayer);
      setIsModalOpen(false);
      setEditingPlayer(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.jerseyNumber.toString().includes(searchQuery);
    const matchesTeam = !selectedTeamFilter || p.currentTeamId === selectedTeamFilter;
    return matchesSearch && matchesTeam;
  });

  const getPositionLabel = (pos: PlayerPosition) => {
    switch (pos) {
      case 'goalkeeper': return 'গোলরক্ষক (GK)';
      case 'defender': return 'ডিফেন্ডার (DF)';
      case 'midfielder': return 'মিডফিল্ডার (MF)';
      case 'forward': return 'ফরোয়ার্ড / স্ট্রাইকার (FW)';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Users className="text-purple-600" size={20} />
            <span>খেলোয়াড় তালিকা ও স্কোয়াড ব্যবস্থাপনা (Roster & Players)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            মোট {players.length} জন খেলোয়াড় নিবন্ধিত
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-[#0B7A3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>নতুন খেলোয়াড় নিবন্ধন করুন</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="খেলোয়াড়ের নাম বা জার্সি নং দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#0B7A3B]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <select
            value={selectedTeamFilter}
            onChange={(e) => setSelectedTeamFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none w-full sm:w-auto"
          >
            <option value="">সব দলের খেলোয়াড়</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Players Table / Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-600">
                <th className="py-3 px-4">জার্সি</th>
                <th className="py-3 px-4">খেলোয়াড়ের নাম</th>
                <th className="py-3 px-4">দল (Team)</th>
                <th className="py-3 px-4">পজিশন</th>
                <th className="py-3 px-4 text-center">গোল</th>
                <th className="py-3 px-4 text-center">কার্ড (হলুদ/লাল)</th>
                <th className="py-3 px-4 text-center">অবস্থা</th>
                <th className="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    কোনো খেলোয়াড় পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((p) => {
                  const team = teams.find(t => t.id === p.currentTeamId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                          {p.jerseyNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900">
                        {p.name}
                      </td>
                      <td className="py-3 px-4 text-emerald-800">
                        {team?.name || 'অনির্ধারিত'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {getPositionLabel(p.position)}
                      </td>
                      <td className="py-3 px-4 text-center font-black text-emerald-700">
                        {p.totalGoals || 0}
                      </td>
                      <td className="py-3 px-4 text-center text-[11px] font-bold">
                        <span className="text-amber-600">{p.yellowCards || 0} 🟨</span> / <span className="text-rose-600">{p.redCards || 0} 🟥</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {p.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPlayer({ ...p });
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                        >
                          <Edit2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Player Modal */}
      {isModalOpen && editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingPlayer.id ? 'খেলোয়াড় তথ্য সম্পাদনা' : 'নতুন খেলোয়াড় নিবন্ধন'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">খেলোয়াড়ের পুরো নাম *</label>
                <input
                  type="text"
                  required
                  value={editingPlayer.name || ''}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                  placeholder="উদা: হাসান মাহমুদ"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">জার্সি নম্বর *</label>
                  <input
                    type="number"
                    required
                    value={editingPlayer.jerseyNumber || 10}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, jerseyNumber: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">পজিশন *</label>
                  <select
                    value={editingPlayer.position || 'forward'}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, position: e.target.value as PlayerPosition })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="forward">ফরোয়ার্ড / স্ট্রাইকার</option>
                    <option value="midfielder">মিডফিল্ডার</option>
                    <option value="defender">ডিফেন্ডার</option>
                    <option value="goalkeeper">গোলরক্ষক</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">দল নির্বাচন করুন *</label>
                <select
                  value={editingPlayer.currentTeamId || ''}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, currentTeamId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                >
                  <option value="">দল নির্বাচন করুন</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
