import { MarketplaceItem } from '../../../types';

export interface MarketplaceCategory {
  id: string;
  label: string;
  emoji: string;
}

export const CATEGORIES: MarketplaceCategory[] = [
  { id: 'mobile', label: 'মোবাইল', emoji: '📱' },
  { id: 'laptop', label: 'ল্যাপটপ', emoji: '💻' },
  { id: 'bicycle', label: 'বাইসাইকেল', emoji: '🚲' },
  { id: 'motorcycle', label: 'মোটরসাইকেল', emoji: '🏍️' },
  { id: 'car', label: 'গাড়ি', emoji: '🚗' },
  { id: 'furniture', label: 'বাসা ও আসবাব', emoji: '🏠' },
  { id: 'electronics', label: 'ইলেকট্রনিক্স', emoji: '📺' },
  { id: 'fashion', label: 'ফ্যাশন', emoji: '👕' },
  { id: 'agri', label: 'কৃষি পণ্য', emoji: '🌾' },
  { id: 'livestock', label: 'গবাদি পশু', emoji: '🐄' },
  { id: 'books', label: 'বই', emoji: '📚' },
  { id: 'toys', label: 'শিশু সামগ্রী', emoji: '🧸' },
  { id: 'repair_service', label: 'মেরামত ও টেক সার্ভিস', emoji: '🛠️' },
  { id: 'education_service', label: 'শিক্ষাদান ও টিউটর', emoji: '🎓' },
  { id: 'delivery_service', label: 'ডেলিভারি ও কুরিয়ার', emoji: '📦' },
  { id: 'it_service', label: 'ডিজিটাল ও আইটি সেবা', emoji: '💻' },
  { id: 'home_service', label: 'বাসাবাড়ি ও রাজমিস্ত্রি', emoji: '🧹' },
  { id: 'other', label: 'অন্যান্য', emoji: '🛒' }
];

export const IMAGE_PRESETS = [
  { label: 'পুঠিয়ার আম', url: '/logo.svg' },
  { label: 'খেজুরের খাঁটি গুড়', url: '/logo.svg' },
  { label: 'ধান/চাল ফসলাদি', url: '/logo.svg' },
  { label: 'স্মার্টফোন', url: '/logo.svg' },
  { label: 'মোটরসাইকেল', url: '/logo.svg' },
  { label: 'জমি ও বাড়ি', url: '/logo.svg' },
  { label: 'ল্যাপটপ ও কম্পিউটার', url: '/logo.svg' },
  { label: 'অন্যান্য জিনিসপত্র', url: '/logo.svg' }
];
