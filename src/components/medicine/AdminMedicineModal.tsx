import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  Pill, 
  Building2, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Medicine, MedicinePriceReport, HealthProblemCategory, MedicineDosageForm } from '../../types/medicine';
import { HEALTH_PROBLEM_CATEGORIES } from '../../data/initialMedicines';
import { medicineService } from '../../services/medicineService';
import { toast } from 'sonner';

interface AdminMedicineModalProps {
  medicines: Medicine[];
  onClose: () => void;
  onRefresh: () => void;
}

export const AdminMedicineModal: React.FC<AdminMedicineModalProps> = ({
  medicines,
  onClose,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'add' | 'list' | 'reports'>('add');
  const [reports, setReports] = useState<MedicinePriceReport[]>([]);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);

  // Form State
  const [brandName, setBrandName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [strength, setStrength] = useState('');
  const [dosageForm, setDosageForm] = useState<MedicineDosageForm>('tablet');
  const [dosageFormBn, setDosageFormBn] = useState('ট্যাবলেট');
  const [manufacturer, setManufacturer] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [packSizeText, setPackSizeText] = useState('');
  const [categories, setCategories] = useState<HealthProblemCategory[]>(['fever_pain']);
  const [indications, setIndications] = useState('');
  const [dosageInstruction, setDosageInstruction] = useState('');
  const [sideEffects, setSideEffects] = useState('');
  const [precautions, setPrecautions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subscribe to real-time price reports
  useEffect(() => {
    const unsub = medicineService.subscribePriceReports((data) => {
      setReports(data);
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setEditingMed(null);
    setBrandName('');
    setGenericName('');
    setStrength('');
    setDosageForm('tablet');
    setDosageFormBn('ট্যাবলেট');
    setManufacturer('');
    setUnitPrice('');
    setPackSizeText('');
    setCategories(['fever_pain']);
    setIndications('');
    setDosageInstruction('');
    setSideEffects('');
    setPrecautions('');
  };

  const handleEditClick = (med: Medicine) => {
    setEditingMed(med);
    setBrandName(med.brandName);
    setGenericName(med.genericName);
    setStrength(med.strength);
    setDosageForm(med.dosageForm);
    setDosageFormBn(med.dosageFormBn);
    setManufacturer(med.manufacturer);
    setUnitPrice(med.unitPrice.toString());
    setPackSizeText(med.packSizeText || '');
    setCategories(med.categories);
    setIndications(med.indications || '');
    setDosageInstruction(med.dosageInstruction || '');
    setSideEffects(med.sideEffects || '');
    setPrecautions(med.precautions || '');
    setActiveTab('add');
  };

  const handleToggleCategory = (catId: HealthProblemCategory) => {
    if (categories.includes(catId)) {
      if (categories.length > 1) {
        setCategories(categories.filter(c => c !== catId));
      }
    } else {
      setCategories([...categories, catId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(unitPrice);
    if (!brandName.trim() || !genericName.trim() || isNaN(price) || price <= 0) {
      toast.error('ওষুধের নাম, জেনেরিক এবং সঠিক মূল্য দিন');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingMed) {
        await medicineService.updateMedicine(editingMed.id, {
          brandName: brandName.trim(),
          genericName: genericName.trim(),
          strength: strength.trim(),
          dosageForm,
          dosageFormBn,
          manufacturer: manufacturer.trim(),
          unitPrice: price,
          packSizeText: packSizeText.trim() || undefined,
          categories,
          indications: indications.trim() || undefined,
          dosageInstruction: dosageInstruction.trim() || undefined,
          sideEffects: sideEffects.trim() || undefined,
          precautions: precautions.trim() || undefined,
          lastUpdated: new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })
        });
        toast.success('ওষুধের তথ্য সফলভাবে আপডেট করা হয়েছে!');
      } else {
        await medicineService.addMedicine({
          brandName: brandName.trim(),
          genericName: genericName.trim(),
          strength: strength.trim(),
          dosageForm,
          dosageFormBn,
          manufacturer: manufacturer.trim(),
          unitPrice: price,
          packSizeText: packSizeText.trim() || undefined,
          categories,
          indications: indications.trim() || undefined,
          dosageInstruction: dosageInstruction.trim() || undefined,
          sideEffects: sideEffects.trim() || undefined,
          precautions: precautions.trim() || undefined,
          isPopular: true,
          lastUpdated: new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })
        });
        toast.success('নতুন ওষুধ সফলভাবে যুক্ত করা হয়েছে!');
      }
      resetForm();
      onRefresh();
    } catch (err) {
      toast.error('অপারেশন ব্যর্থ হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত "${name}" ওষুধটি ডিলিট করতে চান?`)) return;
    try {
      await medicineService.deleteMedicine(id);
      toast.success('ওষুধটি ডিলিট করা হয়েছে');
      onRefresh();
    } catch (e) {
      toast.error('ডিলিট করতে সমস্যা হয়েছে');
    }
  };

  const handleApproveReport = async (report: MedicinePriceReport) => {
    try {
      await medicineService.reviewPriceReport(report.id, 'verified', report.medicineId, report.reportedUnitPrice);
      toast.success(`দাম ৳${report.reportedUnitPrice} হিসেবে আপডেট ও অনুমোদিত হয়েছে!`);
      onRefresh();
    } catch (e) {
      toast.error('রিপোর্ট প্রসেস করতে ব্যর্থ');
    }
  };

  const handleRejectReport = async (reportId: string) => {
    try {
      await medicineService.reviewPriceReport(reportId, 'rejected');
      toast.info('রিপোর্টটি বাতিল করা হয়েছে');
    } catch (e) {
      toast.error('বাতিল করতে ব্যর্থ');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-base font-black">ওষুধ ডিরেক্টরি ম্যানেজমেন্ট প্যানেল</h3>
              <p className="text-[11px] text-slate-400 font-bold">সুপার অ্যাডমিন কন্ট্রোল ও দাম আপডেট</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-black">
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-3 text-center border-b-2 transition cursor-pointer ${
              activeTab === 'add' 
                ? 'border-emerald-600 text-emerald-700 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {editingMed ? 'ওষুধ সম্পাদনা করুন' : '+ নতুন ওষুধ যোগ করুন'}
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-3 text-center border-b-2 transition cursor-pointer ${
              activeTab === 'list' 
                ? 'border-emerald-600 text-emerald-700 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            সকল ওষুধের তালিকা ({medicines.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 py-3 text-center border-b-2 transition cursor-pointer relative ${
              activeTab === 'reports' 
                ? 'border-emerald-600 text-emerald-700 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            দামের রিপোর্ট ({reports.filter(r => r.status === 'pending').length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'add' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">ওষুধের নাম (Brand Name)*</label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="যেমন: Napa, Sergel"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">পাওয়ার / মাত্রা (Strength)*</label>
                  <input
                    type="text"
                    required
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    placeholder="যেমন: 500 mg, 20 mg, 1%"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">জেনেরিক উপাদান (Generic Name)*</label>
                  <input
                    type="text"
                    required
                    value={genericName}
                    onChange={(e) => setGenericName(e.target.value)}
                    placeholder="যেমন: Paracetamol, Esomeprazole"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">প্রস্তুতকারক কোম্পানি (Manufacturer)*</label>
                  <input
                    type="text"
                    required
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    placeholder="যেমন: Square Pharmaceuticals PLC"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">খুচরা মূল্য প্রতি পিস (MRP ৳)*</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="যেমন: 2.50"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">ওষুধের ধরন</label>
                  <select
                    value={dosageForm}
                    onChange={(e) => {
                      const val = e.target.value as MedicineDosageForm;
                      setDosageForm(val);
                      const bnMap: Record<MedicineDosageForm, string> = {
                        tablet: 'ট্যাবলেট',
                        capsule: 'ক্যাপসুল',
                        syrup: 'সিরাপ',
                        suspension: 'সাসপেনশন',
                        drop: 'ড্রপ',
                        ointment: 'মলম / ক্রিম',
                        cream: 'ক্রিম',
                        injection: 'ইনজেকশন',
                        inhaler: 'ইনহেলার',
                        suppository: 'সাপোজিটরি',
                        saline: 'স্যালাইন',
                        gel: 'জেল'
                      };
                      setDosageFormBn(bnMap[val] || 'ট্যাবলেট');
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="tablet">ট্যাবলেট (Tablet)</option>
                    <option value="capsule">ক্যাপসুল (Capsule)</option>
                    <option value="syrup">সিরাপ (Syrup)</option>
                    <option value="drop">ড্রপ (Drop)</option>
                    <option value="ointment">মলম / ক্রিম (Ointment)</option>
                    <option value="injection">ইনজেকশন (Injection)</option>
                    <option value="inhaler">ইনহেলার (Inhaler)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">প্যাক সাইজ টেক্সট</label>
                  <input
                    type="text"
                    value={packSizeText}
                    onChange={(e) => setPackSizeText(e.target.value)}
                    placeholder="যেমন: ১০টির পাতা ৳২৫.০০"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Health Problem Categories */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">সমস্যা ক্যাটাগরি (যেসব সমস্যায় ব্যবহৃত হয়):</label>
                <div className="flex flex-wrap gap-1.5">
                  {HEALTH_PROBLEM_CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => handleToggleCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                        categories.includes(cat.id)
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Indications */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">রোগের বিবরণ ও নির্দেশিকা (Indications)</label>
                <textarea
                  rows={2}
                  value={indications}
                  onChange={(e) => setIndications(e.target.value)}
                  placeholder="যেমন: জ্বর, তীব্র মাথাব্যথা, মাইগ্রেন ও শারীরিক ব্যথায় দ্রুত কার্যকরী..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Dosage Instruction */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">সেবন বিধি ও মাত্রা (Dosage Instruction)</label>
                <textarea
                  rows={2}
                  value={dosageInstruction}
                  onChange={(e) => setDosageInstruction(e.target.value)}
                  placeholder="যেমন: ১টি করে ট্যাবলেট দিনে ৩ বার খাবারের পর পানির সাথে সেব্য..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {editingMed && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    বাতিল
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
                >
                  <Check size={16} />
                  <span>{isSubmitting ? 'প্রসেস হচ্ছে...' : editingMed ? 'আপডেট সংরক্ষণ করুন' : 'ওষুধ সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'list' && (
            <div className="space-y-2">
              {medicines.map((med) => (
                <div 
                  key={med.id}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800">{med.brandName}</span>
                      <span className="text-[10px] font-bold text-emerald-600">{med.strength}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-bold">{med.dosageFormBn}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">{med.genericName} • {med.manufacturer}</p>
                    <span className="text-xs font-black text-emerald-700 mt-0.5 block">৳{med.unitPrice} / পিস</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditClick(med)}
                      className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-white rounded-xl transition cursor-pointer"
                      title="সম্পাদনা"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(med.id, med.brandName)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="ডিলিট"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-3">
              {reports.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <p className="text-xs font-bold">এখনও কোনো দামের রিপোর্ট জমা পড়েনি</p>
                </div>
              ) : (
                reports.map((rep) => (
                  <div 
                    key={rep.id}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-slate-800">{rep.brandName}</span>
                        <p className="text-[10px] text-slate-400">{rep.genericName}</p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        rep.status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                        rep.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rep.status === 'verified' ? 'অনুমোদিত' : rep.status === 'rejected' ? 'বাতিল' : 'অপেক্ষমান'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-0.5">
                      <p>দাবিকৃত নতুন মূল্য: <span className="font-black text-emerald-700">৳{rep.reportedUnitPrice}</span></p>
                      {rep.pharmacyName && <p>দোকান/ফার্মেসি: <span className="font-bold">{rep.pharmacyName}</span> ({rep.location})</p>}
                      {rep.reporterPhone && <p>রিপোর্টার ফোন: <span className="font-bold">{rep.reporterPhone}</span></p>}
                    </div>

                    {rep.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleRejectReport(rep.id)}
                          className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold"
                        >
                          বাতিল
                        </button>
                        <button
                          onClick={() => handleApproveReport(rep)}
                          className="px-4 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-black shadow-xs"
                        >
                          দাম অনুমোদন করুন
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
