export type VehicleCategory = 
  | 'all' 
  | 'van'
  | 'autorickshaw'
  | 'cng'
  | 'nosimon'
  | 'pickup'
  | 'microbus'
  | 'car' 
  | 'ambulance' 
  | 'truck'
  | 'covered_van' 
  | 'motorcycle' 
  | 'bus' 
  | 'other';

export type ServiceType = 
  | 'hourly' 
  | 'daily' 
  | 'monthly' 
  | 'long_distance' 
  | 'local' 
  | 'airport' 
  | 'wedding' 
  | 'tour' 
  | 'office' 
  | 'cargo';

export type VehicleStatus = 
  | 'draft'
  | 'pending'
  | 'published'
  | 'booked'
  | 'unavailable'
  | 'suspended'
  | 'rejected'
  | 'archived';

export interface VehicleProvider {
  id: string;
  name: string;
  businessName: string;
  profileImage?: string;
  isVerified: boolean;
  rating: number;
  phone: string;
  whatsapp?: string;
  email?: string;
  serviceArea: string;
  address?: string;
  union?: string;
  area?: string;
  totalVehicles?: number;
  verificationStatus?: 'pending' | 'verified' | 'rejected' | 'suspended';
}

export interface DriverInfo {
  name?: string;
  experience?: string;
  phone?: string;
  rating?: number;
  licenseVerified?: boolean;
}

export interface VehicleRules {
  minBookingHours?: number;
  maxPassengers?: number;
  fuelIncluded?: boolean;
  tollIncluded?: boolean;
  parkingIncluded?: boolean;
  extraHourCharge?: number;
  cancellationPolicy?: string;
  rulesText?: string;
}

export interface VehiclePricing {
  hourly?: number;
  halfDay?: number;
  daily?: number;
  monthly?: number;
  perKm?: number;
  longDistanceRate?: number;
  longDistanceNote?: string;
}

export interface Vehicle {
  id: string;
  slug: string;
  name: string;
  type: VehicleCategory;
  typeLabel: string;
  brand: string;
  model: string;
  modelYear: string;
  imageUrl: string;
  gallery: string[];
  seatCapacity: number;
  isAC: boolean;
  fuelType: string; // Octane, CNG, Diesel, Electric
  transmission: string; // Automatic, Manual
  luggageCapacity?: string;
  driverOption: 'with_driver' | 'without_driver' | 'both';
  services: ServiceType[];
  serviceArea: string[];
  location: {
    union: string;
    area: string;
    address: string;
    lat?: number;
    lng?: number;
  };
  pricing: VehiclePricing;
  provider: VehicleProvider;
  driverInfo?: DriverInfo;
  rules: VehicleRules;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  status: VehicleStatus;
  bookedDates?: string[]; // Array of YYYY-MM-DD
  createdAt: string;
  description?: string;
}

export interface BookingRequest {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehicleType: string;
  providerId: string;
  providerName: string;
  providerPhone: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  pickupLocation: string;
  destination: string;
  date: string;
  startTime: string;
  endTime: string;
  passengerCount: number;
  driverRequired: boolean;
  cargoType?: string;
  approxLoad?: string;
  note?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'confirmed' | 'completed' | 'cancelled';
  totalPrice?: number;
  createdAt: string;
}

export interface VehicleReview {
  id: string;
  vehicleId: string;
  vehicleName?: string;
  driverName?: string;
  driverPhone?: string;
  userId?: string;
  userName: string;
  userPhone?: string;
  userAvatar?: string;
  rating: number; // সামগ্রিক রেটিং (১-৫)
  driverRating?: number; // চালকের নির্দিষ্ট রেটিং (১-৫)
  punctualityRating?: number; // সময়ানুবর্তিতা (১-৫)
  behaviorRating?: number; // আচরণ ও ভদ্রতা (১-৫)
  safetyRating?: number; // নিরাপদ ড্রাইভিং (১-৫)
  cleanlinessRating?: number; // বাহনের পরিচ্ছন্নতা (১-৫)
  date: string;
  rideDate?: string;
  rideRoute?: string; // e.g. 'পুঠিয়া সদর → বানেশ্বর বাজার'
  farePaid?: string | number;
  comment: string;
  feedbackTags?: string[]; // e.g. ['নিরাপদ ড্রাইভিং', 'সময়নিষ্ঠ', 'বিনয়ী চালক', 'ন্যায্য ভাড়া']
  recommended?: boolean; // অন্য যাত্রীদের সুপারিশ করবেন কি না
  verifiedRide?: boolean;
  status?: 'published' | 'pending' | 'flagged';
  createdAt?: string;
}

export interface DriverRatingStats {
  driverName: string;
  driverPhone?: string;
  averageRating: number;
  totalReviews: number;
  safetyScore: number;
  punctualityScore: number;
  behaviorScore: number;
  recommendationRate: number; // percentage e.g. 96
  tags: { [key: string]: number };
}

export interface VehicleReport {
  id: string;
  vehicleId: string;
  vehicleName: string;
  reason: string;
  description: string;
  reporterPhone?: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface VehicleFilterState {
  category: string;
  serviceType: string;
  driverOption: string;
  seating: string;
  union: string;
  area: string;
  availability: string;
  minPrice: number;
  maxPrice: number;
  isAC: boolean;
}
