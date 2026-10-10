import React, { useState, useEffect } from 'react';
import { 
  onNewsSnapshot, 
  createNews, 
  updateNews, 
  deleteNews, 
  onCitizenReportsSnapshot, 
  updateCitizenReportStatus, 
  convertCitizenReportToNews,
  NewsItem, 
  CitizenNewsReport 
} from '../services/newsService';
import { useAuth } from '../contexts/AuthContext';
import { 
  Newspaper, Plus, Edit2, Trash2, Save, X, Loader2, Image as ImageIcon, 
  Send, Clock, User, Tag, Eye, Heart, MessageSquare, CheckCircle, XCircle, 
  Megaphone, ArrowUpRight, Check, AlertCircle, RefreshCw 
} from 'lucide-react';
import toast from 'react-hot-toast';

const toBengaliNumber = (num: number | string): string => {
  if (num === undefined || num === null) return "০";
  return String(num).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
};

export default function ContentNewsManagement() {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'news' | 'citizen_reports'>('news');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [citizenReports, setCitizenReports] = useState<CitizenNewsReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("এইমাত্র");

  // Form State
  const [formData, setFormData] = useState<Partial<NewsItem>>({
    title: '',
    content: '',
    category: 'উন্নয়ন',
    image: '',
    authorName: 'আমাদের পুঠিয়া প্রতিনিধি',
    reporterLocation: 'পুঠিয়া, রাজশাহী',
    featured: false,
    status: 'published'
  });

  // 1. Subscribe to Live News & Citizen Reports (Firebase Real-Time Listeners)
  useEffect(() => {
    setIsLoading(true);
    const unsubscribeNews = onNewsSnapshot((items) => {
      setNews(items);
      setIsLoading(false);
      setLastSyncedTime(new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    });

    const unsubscribeReports = onCitizenReportsSnapshot((reports) => {
      setCitizenReports(reports);
      setLastSyncedTime(new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    });

    return () => {
      unsubscribeNews();
      unsubscribeReports();
    };
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastSyncedTime(new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsRefreshing(false);
      toast.success('ফায়ারবেস রিয়েল-টাইম ডাটা সিঙ্ক সম্পন্ন!', { icon: '⚡' });
    }, 600);
  };

  const handleSave = async () => {
    if (!formData.title?.trim() || !formData.content?.trim()) {
      toast.error('শিরোনাম এবং কন্টেন্ট দেওয়া আবশ্যক');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await updateNews(editingId, formData, { uid: user?.uid || 'admin', email: user?.email || '', name: userProfile?.name });
        toast.success('সংবাদ সফলভাবে আপডেট হয়েছে!');
      } else {
        await createNews(formData, { uid: user?.uid || 'admin', email: user?.email || '', name: userProfile?.name });
        toast.success('নতুন সংবাদ প্রকাশিত হয়েছে!');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving news:', error);
      toast.error('সংবাদ সংরক্ষণ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'উন্নয়ন',
      image: '',
      authorName: userProfile?.name || 'আমাদের পুঠিয়া প্রতিনিধি',
      reporterLocation: 'পুঠিয়া, রাজশাহী',
      featured: false,
      status: 'published'
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleEdit = (item: NewsItem) => {
    setFormData({
      title: item.title,
      content: item.content,
      category: item.category,
      image: item.image || '',
      authorName: item.authorName || 'আমাদের পুঠিয়া প্রতিনিধি',
      reporterLocation: item.reporterLocation || 'পুঠিয়া, রাজশাহী',
      featured: Boolean(item.featured),
      status: item.status || 'published'
    });
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    
    try {
      await deleteNews(id, { uid: user?.uid || 'admin', email: user?.email || '', name: userProfile?.name });
      toast.success('সংবাদ মুছে ফেলা হয়েছে');
    } catch (error) {
      console.error('Error deleting news:', error);
      toast.error('মুছে ফেলতে সমস্যা হয়েছে।');
    }
  };

  const handleApproveReport = async (report: CitizenNewsReport) => {
    try {
      await convertCitizenReportToNews(report, { uid: user?.uid || 'admin', name: userProfile?.name });
      toast.success('নাগরিক সংবাদটি মূল পোর্টালে প্রকাশিত হয়েছে!');
    } catch (err) {
      console.error('Error approving citizen report:', err);
      toast.error('অনুমোদন করা সম্ভব হয়নি।');
    }
  };

  const handleRejectReport = async (reportId: string) => {
    
    try {
      await updateCitizenReportStatus(reportId, 'rejected', 'প্রশাসনিক বিবেচনায় বাতিল করা হয়েছে');
      toast.success('প্রতিবেদনটি প্রত্যাখ্যান করা হয়েছে');
    } catch (err) {
      toast.error('ব্যর্থ হয়েছে');
    }
  };

  const pendingReportsCount = citizenReports.filter(r => r.status === 'pending').length;

  return (
    <div className="w-full space-y-6 animate-fade-in font-sans">
      
      {/* 1. Header Banner & Live Control */}
      <div className="bg-gradient-to-br from-[#0B7A3B] via-[#01412F] to-[#042A1E] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-emerald-300/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-xs shrink-0">
              <Newspaper className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                  রিয়েল-টাইম লাইভ
                </span>
                <span className="text-[11px] font-bold bg-emerald-950/60 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                  সর্বশেষ সিঙ্ক: {lastSyncedTime}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                সংবাদ ও তথ্য ব্যবস্থাপনা
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1">
                ফায়ারবেস রিয়েল-টাইম ডাটাবেস দিয়ে সব সংবাদ ও নাগরিক রিপোর্ট অটো-সিঙ্ক হচ্ছে
              </p>
            </div>
          </div>

          {/* Action Tabs & Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-950/60 hover:bg-emerald-950 text-emerald-100 border border-emerald-400/30 text-xs font-bold transition-all cursor-pointer"
              title="তাত্ক্ষণিক রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-300' : ''}`} />
              <span>রিফ্রেশ</span>
            </button>

            <div className="flex bg-emerald-950/70 p-1.5 rounded-2xl border border-emerald-400/30 backdrop-blur-md">
              <button
                onClick={() => setActiveTab('news')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'news' 
                    ? 'bg-white text-[#0B7A3B] shadow-md' 
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                সংবাদ তালিকা ({toBengaliNumber(news.length)})
              </button>
              <button
                onClick={() => setActiveTab('citizen_reports')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'citizen_reports' 
                    ? 'bg-white text-[#0B7A3B] shadow-md' 
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                নাগরিক রিপোর্ট
                {pendingReportsCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center animate-pulse">
                    {toBengaliNumber(pendingReportsCount)}
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'news' && (
              <button 
                onClick={() => {
                  if (isAdding) resetForm();
                  else setIsAdding(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-2xl text-xs font-black transition-all shadow-md shadow-black/20 cursor-pointer"
              >
                {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{isAdding ? 'বাতিল' : 'নতুন সংবাদ লিখুন'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Real-Time Live Status Bar in Green Theme */}
      <div className="p-4 bg-white border border-emerald-100 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0B7A3B]"></span>
          </span>
          <span className="font-black text-[#0B7A3B]">ফায়ারবেস লাইভ কানেকশন সক্রিয়:</span>
          <span className="text-slate-500">কোনো রিলোড ছাড়াই নতুন পোস্ট বা পরিবর্তন সরাসরি প্রতিফলিত হয়</span>
        </div>
        <div className="flex items-center gap-2.5 text-[11px]">
          <span className="bg-emerald-50 text-[#0B7A3B] border border-emerald-200 px-3 py-1 rounded-xl font-black">
            {toBengaliNumber(news.length)} টি প্রকাশিত সংবাদ
          </span>
        </div>
      </div>

      {/* 3. Write / Edit Form */}
      {isAdding && activeTab === 'news' && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-emerald-200 shadow-sm space-y-4">
          <h4 className="font-black text-slate-900 text-sm flex items-center gap-2 pb-3 border-b border-emerald-100">
            <Edit2 className="w-4 h-4 text-[#0B7A3B]" />
            {editingId ? 'সংবাদ সম্পাদনা করুন' : 'নতুন সংবাদ প্রকাশ করুন'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 uppercase">সংবাদের শিরোনাম *</label>
              <input 
                type="text" 
                value={formData.title || ""}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-emerald-50/40 border border-emerald-200 text-slate-900 px-3.5 py-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
                placeholder="আকর্ষণীয় শিরোনাম লিখুন"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 uppercase">ক্যাটাগরি</label>
              <select 
                value={formData.category || "উন্নয়ন"}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-emerald-50/40 border border-emerald-200 text-slate-900 px-3.5 py-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0B7A3B]"
              >
                <option value="উন্নয়ন">উন্নয়ন</option>
                <option value="রাজনীতি">রাজনীতি</option>
                <option value="শিক্ষা">শিক্ষা</option>
                <option value="খেলা">খেলাধুলা</option>
                <option value="অপরাধ">অপরাধ</option>
                <option value="সামাজিক">সামাজিক</option>
                <option value="সংস্কৃতি">সংস্কৃতি</option>
                <option value="অন্যান্য">অন্যান্য</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-slate-700 uppercase">সংবাদের বিস্তারিত কন্টেন্ট *</label>
            <textarea 
              rows={5}
              value={formData.content || ""}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full bg-emerald-50/40 border border-emerald-200 text-slate-900 p-3.5 rounded-xl text-xs focus:outline-none focus:border-[#0B7A3B] leading-relaxed"
              placeholder="সংবাদের বিস্তারিত এখানে লিখুন..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 uppercase">ছবির লিঙ্ক (Image URL)</label>
              <input 
                type="url" 
                value={formData.image || ""}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
                className="w-full bg-emerald-50/40 border border-emerald-200 text-slate-900 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#0B7A3B]"
                placeholder='/logo.svg'
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 uppercase">প্রতিবেদক (Author)</label>
              <input 
                type="text" 
                value={formData.authorName || ""}
                onChange={(e) => setFormData({...formData, authorName: e.target.value})}
                className="w-full bg-emerald-50/40 border border-emerald-200 text-slate-900 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#0B7A3B]"
                placeholder="প্রতিবেদকের নাম"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input 
              type="checkbox"
              id="admin-feat"
              checked={Boolean(formData.featured)}
              onChange={(e) => setFormData({...formData, featured: e.target.checked})}
              className="w-4 h-4 text-[#0B7A3B] rounded cursor-pointer"
            />
            <label htmlFor="admin-feat" className="text-xs font-bold text-slate-700 cursor-pointer">
              প্রধান সংবাদ (Featured Slider) হিসেবে পিন করুন
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-emerald-100">
            <button 
              type="button" 
              onClick={resetForm}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              বাতিল
            </button>
            <button 
              type="button" 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0B7A3B] hover:bg-[#085a2b] text-white rounded-xl text-xs font-black shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{editingId ? 'আপডেট করুন' : 'প্রকাশ করুন'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. TAB 1: NEWS ARTICLES LIST */}
      {activeTab === 'news' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-emerald-100">
              <Loader2 className="w-8 h-8 animate-spin text-[#0B7A3B] mb-2" />
              <p className="text-xs font-bold">সংবাদ তালিকা লোড হচ্ছে...</p>
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-emerald-100 text-slate-500">
              <Newspaper className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-black">কোনো সংবাদ পাওয়া যায়নি</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {news.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white border border-emerald-100 hover:border-[#0B7A3B] hover:shadow-md rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all shadow-2xs group"
                >
                  <div className="flex gap-3">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-emerald-50 shrink-0 border border-emerald-100">
                      {item.image ? (
                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#0B7A3B]">
                          <Newspaper className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-[#0B7A3B] border border-emerald-200">
                          {item.category}
                        </span>
                        {item.featured && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                            প্রধান
                          </span>
                        )}
                      </div>
                      <h4 className="font-black text-sm text-slate-900 line-clamp-1 group-hover:text-[#0B7A3B] transition-colors">{item.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">{item.content}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-emerald-50 text-xs text-slate-500">
                    <div className="flex items-center gap-3 text-[11px] font-bold">
                      <span className="flex items-center gap-1 text-slate-600">
                        <Eye className="w-3.5 h-3.5 text-[#0B7A3B]" />
                        {toBengaliNumber(item.views || 0)}
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        {toBengaliNumber(item.likesCount || 0)}
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                        {toBengaliNumber(item.commentsCount || 0)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0B7A3B] transition-colors cursor-pointer"
                        title="সম্পাদনা"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                        title="মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 2: CITIZEN REPORTS QUEUE */}
      {activeTab === 'citizen_reports' && (
        <div className="space-y-4">
          {citizenReports.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-emerald-100 text-slate-500">
              <Megaphone className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-black">বর্তমানে কোনো নাগরিক সংবাদ জমা নেই</p>
            </div>
          ) : (
            <div className="space-y-3">
              {citizenReports.map((report) => (
                <div 
                  key={report.id}
                  className="bg-white border border-emerald-100 hover:border-[#0B7A3B] rounded-2xl p-5 space-y-3 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-[#0B7A3B] flex items-center justify-center font-black text-xs">
                        {report.reporterName[0]}
                      </div>
                      <div>
                        <h5 className="font-black text-sm text-slate-900">{report.reporterName}</h5>
                        <p className="text-[11px] text-slate-400 font-mono">{report.reporterPhone} • {report.reporterLocation}</p>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                      report.status === 'approved' ? 'bg-emerald-100 text-[#0B7A3B] border border-emerald-200' :
                      report.status === 'rejected' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                      'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {report.status === 'approved' ? 'অনুমোদিত' : report.status === 'rejected' ? 'বাতিল' : 'পর্যালোচনাধীন'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100 leading-relaxed font-medium">
                    {report.reporterContent}
                  </p>

                  {report.imageUrl && (
                    <div className="max-w-xs rounded-xl overflow-hidden border border-emerald-200">
                      <img src={report.imageUrl} alt="" className="w-full h-32 object-cover" />
                    </div>
                  )}

                  {report.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-100">
                      <button
                        onClick={() => handleRejectReport(report.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        প্রত্যাখ্যান করুন
                      </button>
                      <button
                        onClick={() => handleApproveReport(report)}
                        className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-[#0B7A3B] hover:bg-[#085a2b] text-white text-xs font-black shadow transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>অনুমোদন ও সংবাদ প্রকাশ</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
