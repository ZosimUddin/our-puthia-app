export interface DistrictInfo {
  id: string;
  nameEn: string;
  nameBn: string;
  divisionId: string;
  divisionNameBn: string;
  divisionNameEn: string;
  lat: number;
  lng: number;
  touristSpots?: string[];
}

export interface DivisionInfo {
  id: string;
  nameBn: string;
  nameEn: string;
  districts: DistrictInfo[];
}

export const BANGLADESH_DIVISIONS: DivisionInfo[] = [
  {
    id: 'dhaka',
    nameBn: 'ঢাকা বিভাগ',
    nameEn: 'Dhaka',
    districts: [
      { id: 'dhaka', nameEn: 'Dhaka', nameBn: 'ঢাকা', divisionId: 'dhaka', divisionNameBn: 'ঢাকা বিভাগ', divisionNameEn: 'Dhaka', lat: 23.8103, lng: 90.4125, touristSpots: ['লালবাগ কেল্লা', 'আহসান মঞ্জিল', 'সংসদ ভবন'] },
      { id: 'gazipur', nameEn: 'Gazipur', nameBn: 'গাজীপুর', divisionId: 'dhaka', divisionNameBn: 'ঢাকা বিভাগ', divisionNameEn: 'Dhaka', lat: 23.9999, lng: 90.4203, touristSpots: ['বঙ্গবন্ধু সাফারি পার্ক', 'ভাওয়াল জাতীয় উদ্যান'] },
      { id: 'kishoreganj', nameEn: 'Kishoreganj', nameBn: 'কিশোরগঞ্জ', divisionId: 'dhaka', divisionNameBn: 'ঢাকা বিভাগ', divisionNameEn: 'Dhaka', lat: 24.4449, lng: 90.7765, touristSpots: ['নিকলী হাওর', 'শোলাকিয়া ইদগাহ'] },
      { id: 'gopalganj', nameEn: 'Gopalganj', nameBn: 'গোপালগঞ্জ', divisionId: 'dhaka', divisionNameBn: 'ঢাকা বিভাগ', divisionNameEn: 'Dhaka', lat: 23.0051, lng: 89.8267, touristSpots: ['টুঙ্গিপাড়া বঙ্গবন্ধু স্মৃতিসৌধ'] },
      { id: 'tangail', nameEn: 'Tangail', nameBn: 'টাঙ্গাইল', divisionId: 'dhaka', divisionNameBn: 'ঢাকা বিভাগ', divisionNameEn: 'Dhaka', lat: 24.2513, lng: 89.9167, touristSpots: ['মহেড়া জমিদার বাড়ি', 'আতিয়া মসজিদ'] },
      { id: 'narayanganj', nameEn: 'Narayanganj', nameBn: 'নারায়ণগঞ্জ', divisionId: 'dhaka', divisionNameBn: 'ঢাকা বিভাগ', divisionNameEn: 'Dhaka', lat: 23.6238, lng: 90.5000, touristSpots: ['সোনারগাঁও লোকশিল্প জাদুঘর', 'পানাম নগর'] },
      { id: 'narsingdi', nameEn: 'Narsingdi', nameBn: 'নরসিংদী', divisionId: 'dhaka', divisionNameBn: 'ঢাকা বিভাগ', divisionNameEn: 'Dhaka', lat: 23.9193, lng: 90.7176, touristSpots: ['উয়ারী-বটেশ্বর Archaeological site'] },
      { id: 'faridpur', nameEn: 'Faridpur', nameBn: 'ফরিদপুর', divisionId: 'dhaka', divisionNameBn: 'ঢাকা বিভাগ', divisionNameEn: 'Dhaka', lat: 23.6070, lng: 89.8429, touristSpots: ['পল্লীকবি জসীম উদ্দীনের বাড়ি'] },
      { id: 'madaripur', nameEn: 'Madaripur', nameBn: 'মাদারীপুর', divisionId: 'dhaka', divisionNameBn: 'ঢাকা বিভাগ', divisionNameEn: 'Dhaka', lat: 23.1641, lng: 90.1897, touristSpots: ['শকুনী হ্রদ'] },
      { id: 'manikganj', nameEn: 'Manikganj', nameBn: 'মানিকগঞ্জ', divisionId: 'dhaka', divisionNameBn: 'ঢাকা বিভাগ', divisionNameEn: 'Dhaka', lat: 23.8644, lng: 90.0047, touristSpots: ['বালিহাটি প্রাসাদ'] },
      { id: 'munshiganj', nameEn: 'Munshiganj', nameBn: 'মুন্সীগঞ্জ', divisionId: 'dhaka', divisionNameBn: 'ঢাকা বিভাগ', divisionNameEn: 'Dhaka', lat: 23.5422, lng: 90.5305, touristSpots: ['ইদ্রাকপুর কেল্লা', 'সোনারং জোড়া মঠ'] },
      { id: 'rajbari', nameEn: 'Rajbari', nameBn: 'রাজবাড়ী', divisionId: 'dhaka', divisionNameBn: 'ঢাকা বিভাগ', divisionNameEn: 'Dhaka', lat: 23.7574, lng: 89.6444, touristSpots: ['মীর মশাররফ হোসেন স্মৃতিকেন্দ্র'] },
      { id: 'shariatpur', nameEn: 'Shariatpur', nameBn: 'শরীয়তপুর', divisionId: 'dhaka', divisionNameBn: 'ঢাকা বিভাগ', divisionNameEn: 'Dhaka', lat: 23.2423, lng: 90.4348, touristSpots: ['নড়িয়া জাজিরা পদ্মার পার'] }
    ]
  },
  {
    id: 'chattogram',
    nameBn: 'চট্টগ্রাম বিভাগ',
    nameEn: 'Chattogram',
    districts: [
      { id: 'chattogram', nameEn: 'Chattogram', nameBn: 'চট্টগ্রাম', divisionId: 'chattogram', divisionNameBn: 'চট্টগ্রাম বিভাগ', divisionNameEn: 'Chattogram', lat: 22.3569, lng: 91.7832, touristSpots: ['পতেঙ্গা সমুদ্র সৈকত', 'ফয়েজ লেক', 'নেভাল বিচ'] },
      { id: 'coxsbazar', nameEn: 'Coxs Bazar', nameBn: 'কক্সবাজার', divisionId: 'chattogram', divisionNameBn: 'চট্টগ্রাম বিভাগ', divisionNameEn: 'Chattogram', lat: 21.4272, lng: 92.0058, touristSpots: ['বিশ্বের দীর্ঘতম সৈকত', 'ইনানী বিচ', 'মেরিন ড্রাইভ'] },
      { id: 'cumilla', nameEn: 'Cumilla', nameBn: 'কুমিল্লা', divisionId: 'chattogram', divisionNameBn: 'চট্টগ্রাম বিভাগ', divisionNameEn: 'Chattogram', lat: 23.4607, lng: 91.1809, touristSpots: ['শালবন বিহার', 'ময়নামতি জাদুঘর', 'ধর্মসাগর'] },
      { id: 'khagrachhari', nameEn: 'Khagrachhari', nameBn: 'খাগড়াছড়ি', divisionId: 'chattogram', divisionNameBn: 'চট্টগ্রাম বিভাগ', divisionNameEn: 'Chattogram', lat: 23.1193, lng: 91.9847, touristSpots: ['আলুটিলা গুহা', 'রিঝাং ঝরনা'] },
      { id: 'chandpur', nameEn: 'Chandpur', nameBn: 'চাঁদপুর', divisionId: 'chattogram', divisionNameBn: 'চট্টগ্রাম বিভাগ', divisionNameEn: 'Chattogram', lat: 23.2321, lng: 90.6631, touristSpots: ['তিন নদীর মোহনা (ইলিশ চত্বর)'] },
      { id: 'noakhali', nameEn: 'Noakhali', nameBn: 'নোয়াখালী', divisionId: 'chattogram', divisionNameBn: 'চট্টগ্রাম বিভাগ', divisionNameEn: 'Chattogram', lat: 22.8696, lng: 91.0993, touristSpots: ['পর্ফেল্ড পার্ক', 'নিঝুম দ্বীপ'] },
      { id: 'feni', nameEn: 'Feni', nameBn: 'ফেনী', divisionId: 'chattogram', divisionNameBn: 'চট্টগ্রাম বিভাগ', divisionNameEn: 'Chattogram', lat: 23.0159, lng: 91.3976, touristSpots: ['বিজয় সিংহ দিঘি', 'মুহুরী প্রজেক্ট'] },
      { id: 'bandarban', nameEn: 'Bandarban', nameBn: 'বান্দরবান', divisionId: 'chattogram', divisionNameBn: 'চট্টগ্রাম বিভাগ', divisionNameEn: 'Chattogram', lat: 22.1953, lng: 92.2184, touristSpots: ['নীলগিরি', 'স্বর্ণ মন্দির', 'বগালেক', 'নাফাখুম'] },
      { id: 'brahmanbaria', nameEn: 'Brahmanbaria', nameBn: 'ব্রাহ্মণবাড়িয়া', divisionId: 'chattogram', divisionNameBn: 'চট্টগ্রাম বিভাগ', divisionNameEn: 'Chattogram', lat: 23.9571, lng: 91.1119, touristSpots: ['কালভৈরব মন্দির', 'আরিফাইল মসজিদ'] },
      { id: 'rangamati', nameEn: 'Rangamati', nameBn: 'রাঙ্গামাটি', divisionId: 'chattogram', divisionNameBn: 'চট্টগ্রাম বিভাগ', divisionNameEn: 'Chattogram', lat: 22.6533, lng: 92.1753, touristSpots: ['কাপ্তাই লেক', 'ঝুলন্ত সেতু', 'শুভলং ঝরনা'] },
      { id: 'lakshmipur', nameEn: 'Lakshmipur', nameBn: 'লক্ষ্মীপুর', divisionId: 'chattogram', divisionNameBn: 'চট্টগ্রাম বিভাগ', divisionNameEn: 'Chattogram', lat: 22.9447, lng: 90.8282, touristSpots: ['শ্রীরামপুর রাজবাড়ি', 'মিয়ার বাজার মসজিদ'] }
    ]
  },
  {
    id: 'sylhet',
    nameBn: 'সিলেট বিভাগ',
    nameEn: 'Sylhet',
    districts: [
      { id: 'sylhet', nameEn: 'Sylhet', nameBn: 'সিলেট', divisionId: 'sylhet', divisionNameBn: 'সিলেট বিভাগ', divisionNameEn: 'Sylhet', lat: 24.8949, lng: 91.8687, touristSpots: ['জাফলং', 'হযরত শাহজালাল (রঃ) মাজার', 'বিছানাকান্দি', 'রাতারগুল'] },
      { id: 'moulvibazar', nameEn: 'Moulvibazar', nameBn: 'মৌলভীবাজার', divisionId: 'sylhet', divisionNameBn: 'সিলেট বিভাগ', divisionNameEn: 'Sylhet', lat: 24.4829, lng: 91.7774, touristSpots: ['শ্রীমঙ্গল চা বাগান', 'লাউয়াছড়া জাতীয় উদ্যান', 'মাধবকুণ্ড ঝরনা'] },
      { id: 'sunamganj', nameEn: 'Sunamganj', nameBn: 'সুনামগঞ্জ', divisionId: 'sylhet', divisionNameBn: 'সিলেট বিভাগ', divisionNameEn: 'Sylhet', lat: 25.0658, lng: 91.3950, touristSpots: ['টাঙ্গুয়ার হাওর', 'হাসন রাজা মিউজিয়াম', 'যাদুকাটা নদী'] },
      { id: 'habiganj', nameEn: 'Habiganj', nameBn: 'হবিগঞ্জ', divisionId: 'sylhet', divisionNameBn: 'সিলেট বিভাগ', divisionNameEn: 'Sylhet', lat: 24.3749, lng: 91.4155, touristSpots: ['সাতছড়ি জাতীয় উদ্যান', 'রেমা-কালেঙ্গা বনাঞ্চল'] }
    ]
  },
  {
    id: 'barishal',
    nameBn: 'বরিশাল বিভাগ',
    nameEn: 'Barishal',
    districts: [
      { id: 'barishal', nameEn: 'Barishal', nameBn: 'বরিশাল', divisionId: 'barishal', divisionNameBn: 'বরিশাল বিভাগ', divisionNameEn: 'Barishal', lat: 22.7010, lng: 90.3535, touristSpots: ['ভাসমান পেয়ারা বাজার', 'দুর্গাসাগর দিঘি'] },
      { id: 'jhalokati', nameEn: 'Jhalokati', nameBn: 'ঝালকাঠি', divisionId: 'barishal', divisionNameBn: 'বরিশাল বিভাগ', divisionNameEn: 'Barishal', lat: 22.6406, lng: 90.1987, touristSpots: ['ভীমকাঠি পেয়ারা বাজার', 'সুকনকাঠি পার্ক'] },
      { id: 'patuakhali', nameEn: 'Patuakhali', nameBn: 'পটুয়াখালী', divisionId: 'barishal', divisionNameBn: 'বরিশাল বিভাগ', divisionNameEn: 'Barishal', lat: 22.3596, lng: 90.3298, touristSpots: ['কুয়াকাটা সমুদ্র সৈকত', 'ফাতরার বন'] },
      { id: 'pirojpur', nameEn: 'Pirojpur', nameBn: 'পিরোজপুর', divisionId: 'barishal', divisionNameBn: 'বরিশাল বিভাগ', divisionNameEn: 'Barishal', lat: 22.5841, lng: 89.9720, touristSpots: ['রায়েরকাঠি জমিদার বাড়ি'] },
      { id: 'barguna', nameEn: 'Barguna', nameBn: 'বরগুনা', divisionId: 'barishal', divisionNameBn: 'বরিশাল বিভাগ', divisionNameEn: 'Barishal', lat: 22.1570, lng: 90.1258, touristSpots: ['শুভ সন্ধ্যা সমুদ্র সৈকত', 'হরিণঘাটা বন'] },
      { id: 'bhola', nameEn: 'Bhola', nameBn: 'ভোলা', divisionId: 'barishal', divisionNameBn: 'বরিশাল বিভাগ', divisionNameEn: 'Barishal', lat: 22.6859, lng: 90.6481, touristSpots: ['চর কুকরি মুকরি', 'মনপুরা দ্বীপ'] }
    ]
  },
  {
    id: 'khulna',
    nameBn: 'খুলনা বিভাগ',
    nameEn: 'Khulna',
    districts: [
      { id: 'khulna', nameEn: 'Khulna', nameBn: 'খুলনা', divisionId: 'khulna', divisionNameBn: 'খুলনা বিভাগ', divisionNameEn: 'Khulna', lat: 22.8456, lng: 89.5403, touristSpots: ['সুন্দরবন', 'রূপসা নদী রিভার ভিউ', 'শিরোমণি স্মৃতিসৌধ'] },
      { id: 'kushtia', nameEn: 'Kushtia', nameBn: 'কুষ্টিয়া', divisionId: 'khulna', divisionNameBn: 'খুলনা বিভাগ', divisionNameEn: 'Khulna', lat: 23.9013, lng: 89.1204, touristSpots: ['লালন শাহের মাজার', 'রবীন্দ্রনাথ ঠাকুরের কুঠিবাড়ি'] },
      { id: 'chuadanga', nameEn: 'Chuadanga', nameBn: 'চুয়াডাঙ্গা', divisionId: 'khulna', divisionNameBn: 'খুলনা বিভাগ', divisionNameEn: 'Khulna', lat: 23.6401, lng: 88.8418, touristSpots: ['কেদারগঞ্জ নীলকুঠি', 'গাজী কালুর দরগাহ'] },
      { id: 'jhenaidah', nameEn: 'Jhenaidah', nameBn: 'ঝিনাইদহ', divisionId: 'khulna', divisionNameBn: 'খুলনা বিভাগ', divisionNameEn: 'Khulna', lat: 23.5450, lng: 89.1726, touristSpots: ['নলডাঙ্গা রাজবাড়ি', 'মিয়া জানের মঠ'] },
      { id: 'narail', nameEn: 'Narail', nameBn: 'নড়াইল', divisionId: 'khulna', divisionNameBn: 'খুলনা বিভাগ', divisionNameEn: 'Khulna', lat: 23.1725, lng: 89.5126, touristSpots: ['এস এম সুলতান শিশুস্বর্গ', 'চিত্রা নদী'] },
      { id: 'bagerhat', nameEn: 'Bagerhat', nameBn: 'বাগেরহাট', divisionId: 'khulna', divisionNameBn: 'খুলনা বিভাগ', divisionNameEn: 'Khulna', lat: 22.6602, lng: 89.7895, touristSpots: ['ষাট গম্বুজ মসজিদ', 'খান জাহান আলীর মাজার'] },
      { id: 'magura', nameEn: 'Magura', nameBn: 'মাগুরা', divisionId: 'khulna', divisionNameBn: 'খুলনা বিভাগ', divisionNameEn: 'Khulna', lat: 23.4873, lng: 89.4199, touristSpots: ['শ্রীপুর জমিদার বাড়ি', 'সিদ্ধেশ্বরী মঠ'] },
      { id: 'meherpur', nameEn: 'Meherpur', nameBn: 'মেহেরপুর', divisionId: 'khulna', divisionNameBn: 'খুলনা বিভাগ', divisionNameEn: 'Khulna', lat: 23.7622, lng: 88.6318, touristSpots: ['মুজিবনগর স্মৃতিসৌধ', 'আমঝুপি নীলকুঠি'] },
      { id: 'jashore', nameEn: 'Jashore', nameBn: 'যশোর', divisionId: 'khulna', divisionNameBn: 'খুলনা বিভাগ', divisionNameEn: 'Khulna', lat: 23.1664, lng: 89.2081, touristSpots: ['মাইকেল মধুসূদন দত্তের বাড়ি', 'গদখালী ফুলের রাজ্য'] },
      { id: 'satkhira', nameEn: 'Satkhira', nameBn: 'সাতক্ষীরা', divisionId: 'khulna', divisionNameBn: 'খুলনা বিভাগ', divisionNameEn: 'Khulna', lat: 22.7185, lng: 89.0705, touristSpots: ['সুন্দরবন মুন্সীগঞ্জ ট্যুরিজম', 'মোজাফফর গার্ডেন'] }
    ]
  },
  {
    id: 'rajshahi',
    nameBn: 'রাজশাহী বিভাগ',
    nameEn: 'Rajshahi',
    districts: [
      { id: 'rajshahi', nameEn: 'Rajshahi', nameBn: 'রাজশাহী', divisionId: 'rajshahi', divisionNameBn: 'রাজশাহী বিভাগ', divisionNameEn: 'Rajshahi', lat: 24.3745, lng: 88.6042, touristSpots: ['পুঠিয়া রাজবাড়ি', 'পদ্মা পার টি-বাঁধ', 'বরেন্দ্র গবেষণা জাদুঘর'] },
      { id: 'chapainawabganj', nameEn: 'Chapainawabganj', nameBn: 'চাঁপাইনবাবগঞ্জ', divisionId: 'rajshahi', divisionNameBn: 'রাজশাহী বিভাগ', divisionNameEn: 'Rajshahi', lat: 24.5965, lng: 88.2775, touristSpots: ['ছোট সোনা মসজিদ', 'আমের বাগান', 'তাঁতিপার'] },
      { id: 'jaipurhat', nameEn: 'Jaipurhat', nameBn: 'জয়পুরহাট', divisionId: 'rajshahi', divisionNameBn: 'রাজশাহী বিভাগ', divisionNameEn: 'Rajshahi', lat: 25.0968, lng: 89.0227, touristSpots: ['পাহাড়পুর বৌদ্ধ বিহার সংলগ্ন পার্ক', 'নন্দাইল দিঘি'] },
      { id: 'naogaon', nameEn: 'Naogaon', nameBn: 'নওগাঁ', divisionId: 'rajshahi', divisionNameBn: 'রাজশাহী বিভাগ', divisionNameEn: 'Rajshahi', lat: 24.8103, lng: 88.9414, touristSpots: ['সোমপুর মহাবিহার (পাহাড়পুর)', 'কুসুম্বা মসজিদ', 'পতিসর রবীন্দ্রনাথ কুঠিবাড়ি'] },
      { id: 'natore', nameEn: 'Natore', nameBn: 'নাটোর', divisionId: 'rajshahi', divisionNameBn: 'রাজশাহী বিভাগ', divisionNameEn: 'Rajshahi', lat: 24.4102, lng: 89.0076, touristSpots: ['উত্তরা গণভবন', 'কাঁচাগোল্লা প্রসিদ্ধ স্থান', 'নাটোর রাজবাড়ি'] },
      { id: 'pabna', nameEn: 'Pabna', nameBn: 'পাবনা', divisionId: 'rajshahi', divisionNameBn: 'রাজশাহী বিভাগ', divisionNameEn: 'Rajshahi', lat: 24.0064, lng: 89.2496, touristSpots: ['হার্ডিঞ্জ ব্রিজ', 'অনুকূলচন্দ্রের আশ্রম', 'ঈশ্বরদী রূপপুর পরিবেশ'] },
      { id: 'bogura', nameEn: 'Bogura', nameBn: 'বগুড়া', divisionId: 'rajshahi', divisionNameBn: 'রাজশাহী বিভাগ', divisionNameEn: 'Rajshahi', lat: 24.8481, lng: 89.3730, touristSpots: ['মহাস্থানগড়', 'ভাসু বিহার', 'দই ঐতিহ্য'] },
      { id: 'sirajganj', nameEn: 'Sirajganj', nameBn: 'সিরাজগঞ্জ', divisionId: 'rajshahi', divisionNameBn: 'রাজশাহী বিভাগ', divisionNameEn: 'Rajshahi', lat: 24.4539, lng: 89.7008, touristSpots: ['বঙ্গবন্ধু যমুনা সেতু', 'নবরত্ন মন্দির', 'রবীন্দ্র কাচারি বাড়ি (শাহজাদপুর)'] }
    ]
  },
  {
    id: 'rangpur',
    nameBn: 'রংপুর বিভাগ',
    nameEn: 'Rangpur',
    districts: [
      { id: 'rangpur', nameEn: 'Rangpur', nameBn: 'রংপুর', divisionId: 'rangpur', divisionNameBn: 'রংপুর বিভাগ', divisionNameEn: 'Rangpur', lat: 25.7439, lng: 89.2752, touristSpots: ['তাজহাট রাজবাড়ি', 'ভিন্নজগত থিম পার্ক', 'পায়রাবন্দে বেগম রোকেয়ার বাড়ি'] },
      { id: 'kurigram', nameEn: 'Kurigram', nameBn: 'কুড়িগ্রাম', divisionId: 'rangpur', divisionNameBn: 'রংপুর বিভাগ', divisionNameEn: 'Rangpur', lat: 25.8054, lng: 89.6361, touristSpots: ['চান্দামারী মসজিদ', 'ধরলা সেতু পার'] },
      { id: 'gaibandha', nameEn: 'Gaibandha', nameBn: 'গাইবান্ধা', divisionId: 'rangpur', divisionNameBn: 'রংপুর বিভাগ', divisionNameEn: 'Rangpur', lat: 25.3288, lng: 89.5403, touristSpots: ['বালাসী ঘাট', 'মীরবাগ জমিদার বাড়ি'] },
      { id: 'thakurgaon', nameEn: 'Thakurgaon', nameBn: 'ঠাকুরগাঁও', divisionId: 'rangpur', divisionNameBn: 'রংপুর বিভাগ', divisionNameEn: 'Rangpur', lat: 26.0337, lng: 88.4617, touristSpots: ['জগদ্দল রাজবাড়ি', 'বলিয়া মসজিদ'] },
      { id: 'dinajpur', nameEn: 'Dinajpur', nameBn: 'দিনাজপুর', divisionId: 'rangpur', divisionNameBn: 'রংপুর বিভাগ', divisionNameEn: 'Rangpur', lat: 25.6217, lng: 88.6355, touristSpots: ['কান্তজীর মন্দির', 'রামসাগর দিঘি', 'দিনাজপুর রাজবাড়ি'] },
      { id: 'nilphamari', nameEn: 'Nilphamari', nameBn: 'নীলফামারী', divisionId: 'rangpur', divisionNameBn: 'রংপুর বিভাগ', divisionNameEn: 'Rangpur', lat: 25.9318, lng: 88.8561, touristSpots: ['নীলসাগর দিঘি', 'তিস্তা ব্যারেজ'] },
      { id: 'panchagarh', nameEn: 'Panchagarh', nameBn: 'পঞ্চগড়', divisionId: 'rangpur', divisionNameBn: 'রংপুর বিভাগ', divisionNameEn: 'Rangpur', lat: 26.3411, lng: 88.5541, touristSpots: ['বাংলাবান্ধা জিরো পয়েন্ট', 'চা বাগান', 'কঞ্চনজঙ্ঘা দৃশ্যমান স্থান'] },
      { id: 'lalmonirhat', nameEn: 'Lalmonirhat', nameBn: 'লালমনিরহাট', divisionId: 'rangpur', divisionNameBn: 'রংপুর বিভাগ', divisionNameEn: 'Rangpur', lat: 25.9165, lng: 89.4532, touristSpots: ['তিস্তা ব্যারেজ', 'হরিচ্ছায়া জিরো পয়েন্ট'] }
    ]
  },
  {
    id: 'mymensingh',
    nameBn: 'ময়মনসিংহ বিভাগ',
    nameEn: 'Mymensingh',
    districts: [
      { id: 'mymensingh', nameEn: 'Mymensingh', nameBn: 'ময়মনসিংহ', divisionId: 'mymensingh', divisionNameBn: 'ময়মনসিংহ বিভাগ', divisionNameEn: 'Mymensingh', lat: 24.7471, lng: 90.4203, touristSpots: ['শশী লজ', 'বাংলাদেশ কৃষি বিশ্ববিদ্যালয়', 'মুক্তাগাছা রাজবাড়ি'] },
      { id: 'jamalpur', nameEn: 'Jamalpur', nameBn: 'জামালপুর', divisionId: 'mymensingh', divisionNameBn: 'ময়মনসিংহ বিভাগ', divisionNameEn: 'Mymensingh', lat: 24.9375, lng: 89.9378, touristSpots: ['গান্ধী আশ্রম', 'দেওয়ানগঞ্জ চিনিকল পরিবেশ'] },
      { id: 'netrokona', nameEn: 'Netrokona', nameBn: 'নেত্রকোনা', divisionId: 'mymensingh', divisionNameBn: 'ময়মনসিংহ বিভাগ', divisionNameEn: 'Mymensingh', lat: 24.8709, lng: 90.7279, touristSpots: ['বিরিশিরি সাদা মাটির পাহাড়', 'সুসং দুর্গাপুর', 'ডিংসোত্র ঝরনা'] },
      { id: 'sherpur', nameEn: 'Sherpur', nameBn: 'শেরপুর', divisionId: 'mymensingh', divisionNameBn: 'ময়মনসিংহ বিভাগ', divisionNameEn: 'Mymensingh', lat: 25.0205, lng: 90.0153, touristSpots: ['গজনী অবকাশ কেন্দ্র', 'মধুটিলা ইকোপার্ক'] }
    ]
  }
];

export const ALL_DISTRICTS: DistrictInfo[] = BANGLADESH_DIVISIONS.flatMap(div => div.districts);

export const MAP_THEMES = [
  { id: 'emerald', name: 'সবুজ (Emerald)', primary: '#059669', bg: '#e6f7ef', text: '#01412F', accent: '#10b981' },
  { id: 'midnight', name: 'নীল (Midnight)', primary: '#2563eb', bg: '#eff6ff', text: '#1e3a8a', accent: '#3b82f6' },
  { id: 'sunset', name: 'কমলা (Sunset)', primary: '#ea580c', bg: '#fff7ed', text: '#7c2d12', accent: '#f97316' },
  { id: 'sky', name: 'আকাশি (Sky Cyan)', primary: '#0891b2', bg: '#ecfeff', text: '#164e63', accent: '#06b6d4' },
  { id: 'dark', name: 'ডার্ক থিম (Dark Mode)', primary: '#10b981', bg: '#0f172a', text: '#f8fafc', accent: '#34d399' }
];
