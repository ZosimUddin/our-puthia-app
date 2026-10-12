import React from "react";
import { 
  Store, 
  Landmark, 
  Award, 
  Building2 
} from "lucide-react";
import { FacebookBadgeIcon } from "./FacebookBadgeIcon";

export type VerificationType = 
  | "user" 
  | "business" 
  | "institution" 
  | "professional" 
  | "organization";

export const VERIFICATION_TYPES_CONFIG: Record<VerificationType, {
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeBg: string;
  description: string;
}> = {
  user: {
    label: "✓ Verified Citizen",
    shortLabel: "✓ Verified",
    icon: FacebookBadgeIcon,
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-800",
    borderClass: "border-emerald-200",
    badgeBg: "from-emerald-700 to-teal-800",
    description: "জাতীয় পরিচয়পত্র ও পুঠিয়া পোর্টাল ইউজার ভেরিফিকেশন সম্পন্ন।"
  },
  business: {
    label: "Verified Business",
    shortLabel: "Verified Business",
    icon: Store,
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-800",
    borderClass: "border-emerald-200",
    badgeBg: "from-emerald-600 to-teal-700",
    description: "ট্রেড লাইসেন্স ও সরেজমিনে পুঠিয়া টিম কর্তৃক ভেরিফাইড ব্যবসা প্রতিষ্ঠান।"
  },
  institution: {
    label: "Verified Institution",
    shortLabel: "Verified Institution",
    icon: Landmark,
    bgClass: "bg-indigo-50",
    textClass: "text-indigo-800",
    borderClass: "border-indigo-200",
    badgeBg: "from-indigo-600 to-purple-700",
    description: "সরকারী বা অনুমোদিত শিক্ষাপ্রতিষ্ঠান/হাসপাতাল/উপজেলা প্রতিষ্ঠান।"
  },
  professional: {
    label: "Verified Professional",
    shortLabel: "Verified Professional",
    icon: Award,
    bgClass: "bg-amber-50",
    textClass: "text-amber-900",
    borderClass: "border-amber-200",
    badgeBg: "from-amber-500 to-orange-600",
    description: "বিএমডিসি/আইনজীবী সনদ/ডিগ্রি প্রাপ্ত পেশাদার ব্যক্তি।"
  },
  organization: {
    label: "Verified Organization",
    shortLabel: "Verified Organization",
    icon: Building2,
    bgClass: "bg-teal-50",
    textClass: "text-teal-900",
    borderClass: "border-teal-200",
    badgeBg: "from-teal-600 to-cyan-700",
    description: "সমাজসেবা/অনুমোদিত ক্লাব, এনজিও বা সমাজকল্যাণ সংস্থা।"
  }
};
