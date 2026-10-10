import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  Calculator, 
  Receipt, 
  Percent, 
  Share2, 
  Save, 
  Check, 
  Search,
  Pill,
  Printer
} from 'lucide-react';
import { Medicine, CalculatorItem } from '../../types/medicine';
import { medicineService } from '../../services/medicineService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface MedicineCalculatorModalProps {
  initialItems: CalculatorItem[];
  allMedicines: Medicine[];
  onClose: () => void;
  onClear: () => void;
  onUpdateItems: (items: CalculatorItem[]) => void;
}

export const MedicineCalculatorModal: React.FC<MedicineCalculatorModalProps> = ({
  initialItems,
  allMedicines,
  onClose,
  onClear,
  onUpdateItems
}) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CalculatorItem[]>(initialItems);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [prescriptionTitle, setPrescriptionTitle] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const toBengaliNumber = (num: number = 0) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toFixed(2).replace(/[0-9]/g, (d) => bengaliDigits[parseInt(d)]);
  };

  // Subtotal Calculation
  const subtotal = items.reduce((acc, item) => {
    let itemPrice = item.medicine.unitPrice;
    if (item.packageType === 'strip' && item.medicine.stripPrice) {
      itemPrice = item.medicine.stripPrice;
    } else if (item.packageType === 'strip' && item.medicine.stripQuantity) {
      itemPrice = item.medicine.unitPrice * item.medicine.stripQuantity;
    } else if (item.packageType === 'box' && item.medicine.boxPrice) {
      itemPrice = item.medicine.boxPrice;
    } else if (item.packageType === 'box' && item.medicine.boxQuantity) {
      itemPrice = item.medicine.unitPrice * item.medicine.boxQuantity;
    }
    return acc + (itemPrice * item.quantity);
  }, 0);

  const discountAmount = (subtotal * discountPercent) / 100;
  const grandTotal = Math.max(0, subtotal - discountAmount);

  // Update item quantity
  const handleUpdateQuantity = (index: number, delta: number) => {
    const updated = [...items];
    const newQty = Math.max(1, updated[index].quantity + delta);
    updated[index].quantity = newQty;
    setItems(updated);
    onUpdateItems(updated);
  };

  // Change package type (piece, strip, box)
  const handleChangePackageType = (index: number, packageType: 'piece' | 'strip' | 'box') => {
    const updated = [...items];
    updated[index].packageType = packageType;
    setItems(updated);
    onUpdateItems(updated);
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    onUpdateItems(updated);
    toast.info('ওষুধটি তালিকা থেকে সরানো হয়েছে');
  };

  // Add medicine to calculator
  const handleAddMedicine = (med: Medicine) => {
    const existingIndex = items.findIndex(i => i.medicine.id === med.id);
    let updated: CalculatorItem[];
    if (existingIndex > -1) {
      updated = [...items];
      updated[existingIndex].quantity += 1;
    } else {
      updated = [...items, {
        medicine: med,
        quantity: 1,
        packageType: 'piece',
        totalPrice: med.unitPrice
      }];
    }
    setItems(updated);
    onUpdateItems(updated);
    setSearchQuery('');
    toast.success(`${med.brandName} তালিকায় যোগ করা হয়েছে`);
  };

  // Filter medicines for searching
  const searchResults = searchQuery.trim() === '' ? [] : allMedicines.filter(m => 
    m.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.genericName.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  // Save Prescription to user record
  const handleSavePrescription = async () => {
    if (items.length === 0) {
      toast.error('তালিকায় কোনো ওষুধ নেই');
      return;
    }
    setIsSaving(true);
    try {
      await medicineService.savePrescription({
        title: prescriptionTitle.trim() || `প্রেসক্রিপশন - ${new Date().toLocaleDateString('bn-BD')}`,
        date: new Date().toLocaleDateString('bn-BD'),
        items,
        totalCost: subtotal,
        discountPercentage: discountPercent,
        finalCost: grandTotal,
        userId: user?.uid
      });
      toast.success('প্রেসক্রিপশনের হিসাব সফলভাবে সংরক্ষণ করা হয়েছে!');
      setShowSaveInput(false);
    } catch (e) {
      toast.error('সংরক্ষণ করতে সমস্যা হয়েছে');
    } finally {
      setIsSaving(false);
    }
  };

  // Share bill text
  const handleShareBill = () => {
    if (items.length === 0) return;
    let text = `📋 ওষুধের খরচের হিসাব (আমাদের পুঠিয়া অ্যাপ):\n`;
    items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.medicine.brandName} (${item.medicine.strength}) x ${item.quantity} ${item.packageType === 'piece' ? 'পিস' : item.packageType === 'strip' ? 'পাতা' : 'বক্স'}\n`;
    });
    text += `-------------------------\nমোট মূল্য: ৳${toBengaliNumber(subtotal)}\n`;
    if (discountPercent > 0) {
      text += `ডিসকাউন্ট (${discountPercent}%): -৳${toBengaliNumber(discountAmount)}\n`;
    }
    text += `সর্বমোট প্রদেয়: ৳${toBengaliNumber(grandTotal)}\n`;

    if (navigator.share) {
      navigator.share({ title: 'ওষুধের হিসাব', text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('হিসাব ক্লিপবোর্ডে কপি হয়েছে');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg max-h-[92vh] rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Calculator size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-black leading-tight">ওষুধের হিসাব ও খরচের বিল</h3>
              <p className="text-[11px] font-bold text-emerald-100">দোকানের বিলের সাথে সহজে মিলিয়ে নিন</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                onClick={onClear}
                className="p-2 rounded-full hover:bg-white/20 text-white/90 transition text-xs font-bold cursor-pointer"
                title="সব মুছুন"
              >
                রিসেট
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 text-white transition cursor-pointer"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search / Add medicine input */}
        <div className="p-3 bg-slate-50 border-b border-slate-100 relative">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ওষুধের নাম লিখে তালিকায় যোগ করুন..."
              className="w-full pl-9.5 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Quick search dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 p-1.5 space-y-1">
              {searchResults.map((med) => (
                <div
                  key={med.id}
                  onClick={() => handleAddMedicine(med)}
                  className="p-2.5 rounded-xl hover:bg-emerald-50 flex items-center justify-between cursor-pointer transition"
                >
                  <div className="flex items-center gap-2">
                    <Pill size={14} className="text-emerald-600" />
                    <div>
                      <span className="text-xs font-black text-slate-800">{med.brandName}</span>
                      <span className="text-[10px] text-slate-400 font-bold ml-1.5">{med.strength}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-600">৳{toBengaliNumber(med.unitPrice)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medicines list in calculator */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Receipt size={42} className="mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-600">তালিকায় কোনো ওষুধ যোগ করা হয়নি</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                ওপরের সার্চ বক্সে ওষুধের নাম লিখে যোগ করুন বা যেকোনো ওষুধের বিস্তারিত থেকে ক্যালকুলেটরে চাপুন।
              </p>
            </div>
          ) : (
            items.map((item, idx) => (
              <div 
                key={idx}
                className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-slate-800">{item.medicine.brandName}</span>
                    <span className="text-[10px] font-bold text-emerald-600 ml-1.5">{item.medicine.strength}</span>
                    <p className="text-[10px] text-slate-400 font-medium">{item.medicine.genericName}</p>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                  {/* Package Type Selector */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold text-slate-600">
                    <button
                      onClick={() => handleChangePackageType(idx, 'piece')}
                      className={`px-2 py-1 rounded-md transition ${item.packageType === 'piece' ? 'bg-white text-emerald-700 shadow-xs font-black' : ''}`}
                    >
                      পিস
                    </button>
                    <button
                      onClick={() => handleChangePackageType(idx, 'strip')}
                      className={`px-2 py-1 rounded-md transition ${item.packageType === 'strip' ? 'bg-white text-emerald-700 shadow-xs font-black' : ''}`}
                    >
                      পাতা
                    </button>
                    <button
                      onClick={() => handleChangePackageType(idx, 'box')}
                      className={`px-2 py-1 rounded-md transition ${item.packageType === 'box' ? 'bg-white text-emerald-700 shadow-xs font-black' : ''}`}
                    >
                      বক্স
                    </button>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg">
                      <button
                        onClick={() => handleUpdateQuantity(idx, -1)}
                        className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-l-lg transition"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-2.5 text-xs font-black text-slate-800 min-w-[24px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(idx, 1)}
                        className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-r-lg transition"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Total Price */}
                    <span className="text-xs font-black text-slate-900 min-w-[60px] text-right">
                      ৳{toBengaliNumber(
                        (item.packageType === 'strip' 
                          ? (item.medicine.stripPrice || item.medicine.unitPrice * (item.medicine.stripQuantity || 10))
                          : item.packageType === 'box'
                          ? (item.medicine.boxPrice || item.medicine.unitPrice * (item.medicine.boxQuantity || 100))
                          : item.medicine.unitPrice) * item.quantity
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Discount Selector */}
          {items.length > 0 && (
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Percent size={14} className="text-amber-500" />
                ফার্মেসি ডিসকাউন্ট:
              </span>
              <div className="flex items-center gap-1.5">
                {[0, 5, 8, 10].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDiscountPercent(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                      discountPercent === d 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {d === 0 ? '০%' : `${d}%`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Save prescription title dialog */}
          {showSaveInput && (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2">
              <input
                type="text"
                value={prescriptionTitle}
                onChange={(e) => setPrescriptionTitle(e.target.value)}
                placeholder="প্রেসক্রিপশনের নাম লিখুন (যেমন: বাবার ওষুধের হিসাব)..."
                className="w-full px-3 py-2 bg-white rounded-xl border border-emerald-200 text-xs font-bold text-slate-800 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowSaveInput(false)}
                  className="px-3 py-1.5 text-slate-500 text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleSavePrescription}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-black"
                >
                  {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ নিশ্চিত করুন'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bill Summary & Actions */}
        {items.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-white space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>মোট মূল্য (Subtotal):</span>
                <span>৳{toBengaliNumber(subtotal)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>ডিসকাউন্ট ({discountPercent}%):</span>
                  <span>-৳{toBengaliNumber(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-900 pt-1.5 border-t border-slate-100">
                <span>সর্বমোট প্রদেয় বিল:</span>
                <span className="text-emerald-700 text-lg">৳{toBengaliNumber(grandTotal)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareBill}
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                title="শেয়ার করুন"
              >
                <Share2 size={16} />
              </button>
              <button
                onClick={() => setShowSaveInput(true)}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition cursor-pointer"
                title="প্রেসক্রিপশন সংরক্ষণ করুন"
              >
                <Save size={16} />
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition active:scale-95 cursor-pointer text-center"
              >
                হিসাব শেষ করুন
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
