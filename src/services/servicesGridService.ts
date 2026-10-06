import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface HomepageGridServiceItem {
  id: string;
  label: string;
  iconName: string;
  bgColor: string;
  path: string;
  enabled: boolean;
  order: number;
  badge?: string;
  badgeColor?: string;
  category?: string;
  isCustom?: boolean;
}

export const DEFAULT_64_SERVICES_GRID: HomepageGridServiceItem[] = [
  { id: "doctors", label: "ডাক্তার", iconName: "Stethoscope", bgColor: "bg-emerald-50 text-emerald-700", path: "/doctors", enabled: true, order: 1, category: "স্বাস্থ্য" },
  { id: "hospitals", label: "হাসপাতাল", iconName: "Hospital", bgColor: "bg-emerald-50 text-emerald-700", path: "/hospitals", enabled: true, order: 2, category: "স্বাস্থ্য" },
  { id: "diagnostic", label: "ডায়াগনস্টিক", iconName: "Activity", bgColor: "bg-emerald-50 text-emerald-700", path: "/diagnostic", enabled: true, order: 3, category: "স্বাস্থ্য" },
  { id: "smart-map", label: "স্মার্ট ম্যাপ", iconName: "Compass", bgColor: "bg-[#006a4e] text-white shadow-xs", path: "/smart-map", enabled: true, order: 4, category: "অন্যান্য", badge: "লাইভ", badgeColor: "bg-red-600 text-white" },
  { id: "blood", label: "রক্ত", iconName: "Droplet", bgColor: "bg-emerald-50 text-emerald-700", path: "/blood-donor", enabled: true, order: 5, category: "স্বাস্থ্য", badge: "জরুরি", badgeColor: "bg-red-600 text-white" },
  { id: "car-rental", label: "গাড়ি ভাড়া", iconName: "Car", bgColor: "bg-emerald-50 text-emerald-700", path: "/vehicle-rental", enabled: false, order: 6, category: "পরিবহন" },
  { id: "emergency", label: "জরুরী সেবা", iconName: "HeartPulse", bgColor: "bg-emerald-50 text-emerald-700", path: "/emergency", enabled: true, order: 7, category: "জরুরি", badge: "২৪/৭", badgeColor: "bg-red-600 text-white" },
  { id: "fire-service", label: "ফায়ার সার্ভিস", iconName: "Flame", bgColor: "bg-emerald-50 text-emerald-700", path: "/fire-service", enabled: true, order: 8, category: "জরুরি" },
  { id: "police", label: "থানা-পুলিশ", iconName: "ShieldAlert", bgColor: "bg-emerald-50 text-emerald-700", path: "/police", enabled: true, order: 9, category: "জরুরি" },
  { id: "lawyer", label: "আইনজীবী", iconName: "Gavel", bgColor: "bg-emerald-50 text-emerald-700", path: "/lawyers", enabled: true, order: 10, category: "অন্যান্য" },
  { id: "entrepreneur", label: "উদ্যোক্তা", iconName: "Lightbulb", bgColor: "bg-emerald-50 text-emerald-700", path: "/entrepreneurs", enabled: true, order: 11, category: "ব্যবসা" },
  { id: "business", label: "ব্যবসা ও প্রতিষ্ঠান", iconName: "Store", bgColor: "bg-emerald-50 text-emerald-700", path: "/business", enabled: true, order: 12, category: "ব্যবসা" },
  { id: "pharmacy", label: "ফার্মেসি", iconName: "Pill", bgColor: "bg-emerald-50 text-emerald-700", path: "/pharmacy", enabled: true, order: 13, category: "স্বাস্থ্য" },
  { id: "transport-services", label: "পরিবহন সেবা", iconName: "Bus", bgColor: "bg-emerald-50 text-emerald-700", path: "/transport", enabled: true, order: 14, category: "পরিবহন" },
  { id: "bus", label: "বাসের সময়সূচি", iconName: "Bus", bgColor: "bg-emerald-50 text-emerald-700", path: "/bus-stands", enabled: false, order: 15, category: "পরিবহন" },
  { id: "train", label: "ট্রেনের সময়সূচি", iconName: "Train", bgColor: "bg-emerald-50 text-emerald-700", path: "/train", enabled: false, order: 16, category: "পরিবহন" },
  { id: "house-rent", label: "টু-লেট", iconName: "Home", bgColor: "bg-emerald-50 text-emerald-700", path: "/house-rent", enabled: true, order: 17, category: "ব্যবসা" },
  { id: "marketplace", label: "ক্রয়-বিক্রয়", iconName: "ShoppingBag", bgColor: "bg-emerald-50 text-emerald-700", path: "/marketplace", enabled: true, order: 18, category: "ব্যবসা" },
  { id: "hotel", label: "হোটেল", iconName: "Hotel", bgColor: "bg-emerald-50 text-emerald-700", path: "/hotels", enabled: true, order: 19, category: "ব্যবসা" },
  { id: "restaurant", label: "রেস্টুরেন্ট", iconName: "Utensils", bgColor: "bg-emerald-50 text-emerald-700", path: "/restaurants", enabled: true, order: 20, category: "ব্যবসা" },
  { id: "tourism", label: "দর্শণীয় স্থান", iconName: "MapPin", bgColor: "bg-emerald-50 text-emerald-700", path: "/tourism", enabled: true, order: 21, category: "অন্যান্য" },
  { id: "flat-land", label: "ফ্ল্যাট ও জমি", iconName: "Warehouse", bgColor: "bg-emerald-50 text-emerald-700", path: "/land-sale", enabled: false, order: 22, category: "ব্যবসা" },
  { id: "technician", label: "মিস্ত্রি ও কারিগর", iconName: "Hammer", bgColor: "bg-emerald-50 text-emerald-700", path: "/mistri", enabled: true, order: 23, category: "অন্যান্য" },
  { id: "nursery", label: "নার্সারি", iconName: "Leaf", bgColor: "bg-emerald-50 text-emerald-700", path: "/nursery", enabled: true, order: 24, category: "কৃষি" },
  { id: "electricity", label: "বিদ্যুৎ অফিস", iconName: "Zap", bgColor: "bg-emerald-50 text-emerald-700", path: "/electricity", enabled: true, order: 25, category: "সরকারি" },
  { id: "education", label: "শিক্ষা প্রতিষ্ঠান", iconName: "GraduationCap", bgColor: "bg-emerald-50 text-emerald-700", path: "/education", enabled: true, order: 26, category: "শিক্ষা" },
  { id: "courier", label: "কুরিয়ার সার্ভিস", iconName: "Truck", bgColor: "bg-emerald-50 text-emerald-700", path: "/courier", enabled: true, order: 27, category: "পরিবহন" },
  { id: "video", label: "ভিডিও ও ছবি", iconName: "Play", bgColor: "bg-emerald-50 text-emerald-700", path: "/video-gallery", enabled: true, order: 28, category: "অন্যান্য" },
  { id: "parlor", label: "পার্লার", iconName: "Sparkles", bgColor: "bg-emerald-50 text-emerald-700", path: "/parlor", enabled: true, order: 29, category: "ব্যবসা" },
  { id: "mosque", label: "মসজিদ ও ধর্মীয়", iconName: "Moon", bgColor: "bg-emerald-50 text-emerald-700", path: "/mosques", enabled: true, order: 30, category: "ধর্মীয়" },
  { id: "news", label: "পত্রিকা", iconName: "Newspaper", bgColor: "bg-emerald-50 text-emerald-700", path: "/news", enabled: false, order: 31, category: "মিডিয়া" },
  { id: "journalists", label: "সাংবাদিক", iconName: "Mic", bgColor: "bg-emerald-50 text-emerald-700", path: "/journalists", enabled: true, order: 32, category: "মিডিয়া" },
  { id: "content-creator", label: "কনটেন্ট ক্রিয়েটর", iconName: "Video", bgColor: "bg-emerald-50 text-emerald-700", path: "/content-creators", enabled: true, order: 33, category: "মিডিয়া" },
  { id: "mela", label: "মেলা ও উৎসব", iconName: "Tent", bgColor: "bg-emerald-50 text-emerald-700", path: "/mela", enabled: true, order: 34, category: "অন্যান্য" },
  { id: "sports", label: "খেলাধুলা", iconName: "Trophy", bgColor: "bg-emerald-50 text-emerald-700", path: "/sports", enabled: true, order: 35, category: "অন্যান্য" },
  { id: "ngo", label: "এনজিও", iconName: "Globe", bgColor: "bg-emerald-50 text-emerald-700", path: "/ngo", enabled: true, order: 36, category: "সামাজিক" },
  { id: "orphanage", label: "এতিমখানা", iconName: "Heart", bgColor: "bg-emerald-50 text-emerald-700", path: "/orphanages", enabled: true, order: 37, category: "সামাজিক" },
  { id: "zakat", label: "যাকাত", iconName: "Coins", bgColor: "bg-emerald-50 text-emerald-700", path: "/zakat", enabled: false, order: 38, category: "ধর্মীয়" },
  { id: "volunteer", label: "স্বেচ্ছাসেবক", iconName: "HelpingHand", bgColor: "bg-emerald-50 text-emerald-700", path: "/volunteer", enabled: true, order: 39, category: "সামাজিক" },
  { id: "community-clinic", label: "কম্যুনিটি ক্লিনিক", iconName: "Cross", bgColor: "bg-emerald-50 text-emerald-700", path: "/community-clinic", enabled: true, order: 40, category: "স্বাস্থ্য" },
  { id: "vaccination-center", label: "টিকাদান কেন্দ্র", iconName: "Syringe", bgColor: "bg-emerald-50 text-emerald-700", path: "/vaccination", enabled: true, order: 41, category: "স্বাস্থ্য" },
  { id: "all-banks", label: "ব্যাংক ও ফাইন্যান্স", iconName: "Landmark", bgColor: "bg-emerald-50 text-emerald-700", path: "/finance/bank", enabled: true, order: 42, category: "সরকারি" },
  { id: "insurance", label: "বীমা সেবা", iconName: "ShieldCheck", bgColor: "bg-emerald-50 text-emerald-700", path: "/insurance", enabled: true, order: 43, category: "ব্যবসা" },
  { id: "upazila-intro", label: "উপজেলা প্রশাসন", iconName: "Building2", bgColor: "bg-emerald-50 text-emerald-700", path: "/upazila-intro", enabled: true, order: 44, category: "সরকারি" },
  { id: "officers", label: "কর্মকর্তা ও কর্মচারী", iconName: "BadgeCheck", bgColor: "bg-emerald-50 text-emerald-700", path: "/officers", enabled: false, order: 45, category: "সরকারি" },
  { id: "govt-offices", label: "সরকারি অফিস", iconName: "Building", bgColor: "bg-emerald-50 text-emerald-700", path: "/offices", enabled: false, order: 46, category: "সরকারি" },
  { id: "unions", label: "ইউনিয়ন", iconName: "Map", bgColor: "bg-emerald-50 text-emerald-700", path: "/unions", enabled: false, order: 47, category: "সরকারি" },
  { id: "eidgah", label: "ঈদগাহ", iconName: "Sun", bgColor: "bg-emerald-50 text-emerald-700", path: "/eidgah", enabled: true, order: 48, category: "ধর্মীয়" },
  { id: "graveyard", label: "কবরস্থান", iconName: "Trees", bgColor: "bg-emerald-50 text-emerald-700", path: "/graveyard", enabled: true, order: 49, category: "ধর্মীয়" },
  { id: "temple", label: "মন্দির", iconName: "Milestone", bgColor: "bg-emerald-50 text-emerald-700", path: "/temple", enabled: true, order: 50, category: "ধর্মীয়" },
  { id: "cng-auto", label: "সিএনজি / অটো", iconName: "Navigation", bgColor: "bg-[#009664] text-white", path: "/cng-auto", enabled: false, order: 51, category: "পরিবহন" },
  { id: "local-transport", label: "লোকাল বাস পরিবহন", iconName: "Route", bgColor: "bg-[#009664] text-white", path: "/local-transport", enabled: false, order: 52, category: "পরিবহন" },
  { id: "ride-share", label: "বাইক/রাইড শেয়ার", iconName: "Bike", bgColor: "bg-[#009664] text-white", path: "/ride-share", enabled: false, order: 53, category: "পরিবহন" },
  { id: "petrol-pump", label: "পেট্রোল পাম্প", iconName: "Fuel", bgColor: "bg-emerald-50 text-emerald-700", path: "/petrol-pump", enabled: true, order: 54, category: "পরিবহন" },
  { id: "freelancing", label: "ফ্রিল্যান্সিং", iconName: "Laptop", bgColor: "bg-emerald-50 text-emerald-700", path: "/freelancing", enabled: true, order: 55, category: "আইটি" },
  { id: "coaching", label: "কোচিং ও প্রাইভেট", iconName: "BookMarked", bgColor: "bg-emerald-50 text-emerald-700", path: "/coaching", enabled: true, order: 56, category: "শিক্ষা" },
  { id: "library", label: "লাইব্রেরি", iconName: "Library", bgColor: "bg-emerald-50 text-emerald-700", path: "/libraries", enabled: true, order: 57, category: "শিক্ষা" },
  { id: "it-center", label: "আইটি সেন্টার", iconName: "Cpu", bgColor: "bg-emerald-50 text-emerald-700", path: "/it-centers", enabled: true, order: 58, category: "আইটি" },
  { id: "computer-training", label: "কম্পিউটার প্রশিক্ষণ", iconName: "Monitor", bgColor: "bg-emerald-50 text-emerald-700", path: "/computer-training", enabled: true, order: 59, category: "আইটি" },
  { id: "digital-service-center", label: "ডিজিটাল সেবা কেন্দ্র", iconName: "QrCode", bgColor: "bg-emerald-50 text-emerald-700", path: "/technology", enabled: true, order: 60, category: "আইটি" },
  { id: "internet", label: "ইন্টারনেট", iconName: "Wifi", bgColor: "bg-emerald-50 text-emerald-700", path: "/internet-service", enabled: true, order: 61, category: "আইটি" },
  { id: "local-service", label: "স্থানীয় সেবা", iconName: "Wrench", bgColor: "bg-emerald-50 text-emerald-700", path: "/local-services", enabled: true, order: 62, category: "অন্যান্য" },
  { id: "jobs", label: "চাকরি ও সুযোগ", iconName: "FileCheck", bgColor: "bg-emerald-50 text-emerald-700", path: "/jobs", enabled: true, order: 63, category: "শিক্ষা" },
  { id: "agriculture", label: "কৃষি তথ্য ও পরামর্শ", iconName: "Sprout", bgColor: "bg-emerald-50 text-emerald-700", path: "/agriculture", enabled: true, order: 64, category: "কৃষি" }
];

const FIRESTORE_DOC = 'site_content/homepage_services_grid';

export class ServicesGridService {
  /**
   * Subscribe to real-time Homepage Services Grid items
   */
  static subscribeToServicesGrid(callback: (items: HomepageGridServiceItem[]) => void): () => void {
    try {
      const docRef = doc(db, FIRESTORE_DOC);
      return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists() && Array.isArray(docSnap.data().items)) {
          const rawItems = docSnap.data().items as HomepageGridServiceItem[];
          const enriched = rawItems.map(item => {
            let badgeColor = item.badgeColor;
            if (item.badge === 'লাইভ' || item.badge === 'জরুরি' || item.badge === '২৪/৭' || item.id === 'smart-map' || item.id === 'blood' || item.id === 'emergency') {
              badgeColor = 'bg-red-600 text-white';
            }
            return {
              ...item,
              badgeColor: badgeColor || (item.badge ? 'bg-red-600 text-white' : undefined),
              // Ensure uniform green theme across all services
              bgColor: item.bgColor?.includes('text-white') ? item.bgColor : 'bg-emerald-50 text-emerald-700'
            };
          });
          const sorted = enriched.sort((a, b) => a.order - b.order);
          callback(sorted);
        } else {
          callback(DEFAULT_64_SERVICES_GRID);
        }
      }, (error) => {
        console.warn('[ServicesGridService] Firestore snapshot error, using default green grid:', error);
        callback(DEFAULT_64_SERVICES_GRID);
      });
    } catch (e) {
      console.warn('[ServicesGridService] Setup error, falling back to default green grid:', e);
      callback(DEFAULT_64_SERVICES_GRID);
      return () => {};
    }
  }

  /**
   * Update entire grid ordering or items (Admin only)
   */
  static async updateServicesGrid(items: HomepageGridServiceItem[]): Promise<boolean> {
    try {
      const docRef = doc(db, FIRESTORE_DOC);
      await setDoc(docRef, { items, updatedAt: new Date().toISOString() }, { merge: true });
      return true;
    } catch (error) {
      console.error('[ServicesGridService] updateServicesGrid error:', error);
      return false;
    }
  }

  /**
   * Reset services grid to default 64 items (Admin only)
   */
  static async resetToDefault(): Promise<boolean> {
    try {
      const docRef = doc(db, FIRESTORE_DOC);
      await setDoc(docRef, { items: DEFAULT_64_SERVICES_GRID, updatedAt: new Date().toISOString() });
      return true;
    } catch (error) {
      console.error('[ServicesGridService] resetToDefault error:', error);
      return false;
    }
  }

  static async saveServicesGrid(items: HomepageGridServiceItem[]): Promise<boolean> {
    return this.updateServicesGrid(items);
  }

  static async resetToDefaultGrid(): Promise<boolean> {
    return this.resetToDefault();
  }
}
