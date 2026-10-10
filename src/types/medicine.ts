export type MedicineDosageForm = 
  | 'tablet' 
  | 'capsule' 
  | 'syrup' 
  | 'suspension' 
  | 'drop' 
  | 'ointment' 
  | 'cream' 
  | 'injection' 
  | 'inhaler' 
  | 'suppository' 
  | 'saline' 
  | 'gel';

export type HealthProblemCategory = 
  | 'fever_pain' 
  | 'gastric' 
  | 'allergy' 
  | 'diabetes' 
  | 'hypertension' 
  | 'cough_cold' 
  | 'diarrhea' 
  | 'vitamin_calcium' 
  | 'antibiotic' 
  | 'asthma' 
  | 'worm' 
  | 'nausea_vomiting' 
  | 'skin' 
  | 'eye_ear' 
  | 'cardiac' 
  | 'other';

export interface Medicine {
  id: string;
  brandName: string;
  brandNameBn?: string;
  genericName: string;
  genericNameBn?: string;
  strength: string; // e.g. "500 mg", "20 mg", "1%"
  dosageForm: MedicineDosageForm;
  dosageFormBn: string; // e.g. "ট্যাবলেট", "ক্যাপসুল", "সিরাপ"
  manufacturer: string; // e.g. "Square Pharmaceuticals PLC"
  manufacturerBn?: string;
  unitPrice: number; // e.g. 3.50 (in BDT)
  stripPrice?: number; // e.g. 35.00
  stripQuantity?: number; // e.g. 10
  boxPrice?: number; // e.g. 350.00
  boxQuantity?: number; // e.g. 100
  packSizeText?: string; // e.g. "১০টির পাতা ৳৩৫.০০", "৬০টির বক্স ৳৩০০.৯০"
  categories: HealthProblemCategory[];
  indications?: string; // কী কী সমস্যায় খাওয়া হয়
  indicationsBn?: string;
  dosageInstruction?: string; // সেবন বিধি ও মাত্রা
  dosageInstructionBn?: string;
  sideEffects?: string; // সাধারণ পার্শ্বপ্রতিক্রিয়া
  sideEffectsBn?: string;
  precautions?: string; // সতর্কতা ও গর্ভাবস্থা
  precautionsBn?: string;
  isPopular?: boolean;
  isEssential?: boolean;
  viewsCount?: number;
  lastUpdated?: string;
  updatedAt?: any;
  createdAt?: any;
}

export interface MedicinePriceReport {
  id: string;
  medicineId: string;
  brandName: string;
  genericName: string;
  reportedUnitPrice: number;
  reportedPackPrice?: number;
  pharmacyName?: string;
  location?: string;
  comment?: string;
  reportedBy?: string;
  reporterName?: string;
  reporterPhone?: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: any;
}

export interface CalculatorItem {
  medicine: Medicine;
  quantity: number; // number of pieces/packs
  packageType: 'piece' | 'strip' | 'box';
  totalPrice: number;
}

export interface SavedPrescription {
  id: string;
  title: string;
  patientName?: string;
  date: string;
  items: CalculatorItem[];
  totalCost: number;
  discountPercentage?: number;
  finalCost: number;
  note?: string;
  userId?: string;
  createdAt?: any;
}
