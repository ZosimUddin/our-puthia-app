import { 
  getServiceItemDetailSchema, 
  parseBengaliPrice, 
  convertBengaliDigitsToEnglish, 
  toSafeIsoDate 
} from '../src/utils/seoHelpers.ts';

console.log("========================================================");
console.log("   PHASE 4, STEP 4.4: JOBPOSTING & PRODUCT SCHEMA TEST SUITE");
console.log("========================================================");

let passedCount = 0;
const totalTests = 18;

const mockJobConfig = { id: 'job', title: 'চাকরির খবর', collectionName: 'jobs', icon: '💼', subtitle: '', fieldsSchema: { nameKey: 'title' } };
const mockProductConfig = { id: 'marketplace', title: 'মার্কেটপ্লেস', collectionName: 'products', icon: '🛒', subtitle: '', fieldsSchema: { nameKey: 'title' } };
const mockDoctorConfig = { id: 'doctor', title: 'ডাক্তার নির্দেশিকা', collectionName: 'doctors', icon: '👨‍⚕️', subtitle: '', fieldsSchema: { nameKey: 'name' } };

// JobPosting Test 1: Valid job with complete employer data
try {
  const validJob = {
    title: 'কম্পিউটার অপারেটর',
    description: 'উপজেলা শিক্ষা অফিসে কম্পিউটার অপারেটর নিয়োগ।',
    organization: 'উপজেলা শিক্ষা অফিস, পুঠিয়া',
    createdAt: '2026-08-15T10:00:00.000Z',
    deadline: '2026-12-31T23:59:59.000Z',
    location: 'পুঠিয়া সদর',
    salary: '১৫,০০০ টাকা'
  };
  const res = getServiceItemDetailSchema(mockJobConfig, validJob, 'job1');
  const jobSchema = res['@graph'].find((g) => g['@type'] === 'JobPosting');

  if (jobSchema && jobSchema.title === 'কম্পিউটার অপারেটর' && jobSchema.hiringOrganization.name === 'উপজেলা শিক্ষা অফিস, পুঠিয়া' && jobSchema.baseSalary.value.value === 15000) {
    console.log("[Job Test 1] ✅ PASS: Valid job with complete employer data generates compliant JobPosting schema");
    passedCount++;
  } else {
    console.error("[Job Test 1] ❌ FAIL: Invalid JobPosting schema", jobSchema);
  }
} catch (e) {
  console.error("[Job Test 1] ❌ FAIL: Exception", e);
}

// JobPosting Test 2: Missing employer -> Omit JobPosting schema
try {
  const jobNoOrg = {
    title: 'পার্ট-টাইম ডেলিভারি বয়',
    description: 'জরুরি ডেলিভারি ম্যান প্রয়োজন।',
    createdAt: '2026-08-15T10:00:00.000Z'
  };
  const res = getServiceItemDetailSchema(mockJobConfig, jobNoOrg, 'job2');
  const jobSchema = res['@graph'].find((g) => g['@type'] === 'JobPosting');

  if (!jobSchema) {
    console.log("[Job Test 2] ✅ PASS: Missing employer/organization safely omits JobPosting schema (no fake org created)");
    passedCount++;
  } else {
    console.error("[Job Test 2] ❌ FAIL: JobPosting schema was incorrectly generated without employer", jobSchema);
  }
} catch (e) {
  console.error("[Job Test 2] ❌ FAIL: Exception", e);
}

// JobPosting Test 3: Missing datePosted -> Omit JobPosting schema
try {
  const jobNoDate = {
    title: 'হিসাবরক্ষক',
    description: 'ডিজিটাল সেন্টারে হিসাবরক্ষক লাগবে।',
    organization: 'বানেশ্বর ট্রৈডার্স'
  };
  const res = getServiceItemDetailSchema(mockJobConfig, jobNoDate, 'job3');
  const jobSchema = res['@graph'].find((g) => g['@type'] === 'JobPosting');

  if (!jobSchema) {
    console.log("[Job Test 3] ✅ PASS: Missing datePosted safely omits JobPosting schema");
    passedCount++;
  } else {
    console.error("[Job Test 3] ❌ FAIL: JobPosting generated without datePosted", jobSchema);
  }
} catch (e) {
  console.error("[Job Test 3] ❌ FAIL: Exception", e);
}

// JobPosting Test 4: Bengali date parsing (২০২৬-০৮-১৫ -> ISO 8601 string)
try {
  const bengaliDateJob = {
    title: 'অফিস সহকারী',
    description: 'উপজেলা কার্যালয়ে সহকারী নিয়োগ।',
    organization: 'উপজেলা পরিষদ',
    createdAt: '২০২৬-০৮-১৫'
  };
  const res = getServiceItemDetailSchema(mockJobConfig, bengaliDateJob, 'job4');
  const jobSchema = res['@graph'].find((g) => g['@type'] === 'JobPosting');

  if (jobSchema && jobSchema.datePosted === '2026-08-15T00:00:00.000Z') {
    console.log("[Job Test 4] ✅ PASS: Bengali numeral ISO date string parsed cleanly to standard ISO 8601");
    passedCount++;
  } else {
    console.error("[Job Test 4] ❌ FAIL: Bengali date parsing failed", jobSchema);
  }
} catch (e) {
  console.error("[Job Test 4] ❌ FAIL: Exception", e);
}

// JobPosting Test 5: Invalid date -> Omit JobPosting schema
try {
  const invalidDateJob = {
    title: 'সিকিউরিটি গার্ড',
    description: 'নাইট গার্ড প্রয়োজন।',
    organization: 'রাজবাড়ী সমিতি',
    createdAt: 'আগস্ট মাসের ১৫ তারিখ'
  };
  const res = getServiceItemDetailSchema(mockJobConfig, invalidDateJob, 'job5');
  const jobSchema = res['@graph'].find((g) => g['@type'] === 'JobPosting');

  if (!jobSchema) {
    console.log("[Job Test 5] ✅ PASS: Ambiguous/non-standard date string safely omits JobPosting schema");
    passedCount++;
  } else {
    console.error("[Job Test 5] ❌ FAIL: JobPosting generated with invalid date", jobSchema);
  }
} catch (e) {
  console.error("[Job Test 5] ❌ FAIL: Exception", e);
}

// JobPosting Test 6: Closed job (status === 'closed') -> Omit active JobPosting schema
try {
  const closedJob = {
    title: 'ম্যানেজার',
    description: 'শোরুম ম্যানেজার নিয়োগ।',
    organization: 'আল-মদিনা শোরুম',
    createdAt: '2026-08-01T00:00:00.000Z',
    status: 'closed'
  };
  const res = getServiceItemDetailSchema(mockJobConfig, closedJob, 'job6');
  const jobSchema = res['@graph'].find((g) => g['@type'] === 'JobPosting');

  if (!jobSchema) {
    console.log("[Job Test 6] ✅ PASS: Closed job (status === 'closed') omits active JobPosting schema");
    passedCount++;
  } else {
    console.error("[Job Test 6] ❌ FAIL: Closed job generated active JobPosting schema", jobSchema);
  }
} catch (e) {
  console.error("[Job Test 6] ❌ FAIL: Exception", e);
}

// JobPosting Test 7: Expired job (deadline in the past) -> Omit active JobPosting schema
try {
  const expiredJob = {
    title: 'ড্রাইভার',
    description: 'ট্রাক ড্রাইভার প্রয়োজন।',
    organization: 'পুঠিয়া পরিবহন',
    createdAt: '2026-01-01T00:00:00.000Z',
    deadline: '2026-02-01T00:00:00.000Z'
  };
  const res = getServiceItemDetailSchema(mockJobConfig, expiredJob, 'job7');
  const jobSchema = res['@graph'].find((g) => g['@type'] === 'JobPosting');

  if (!jobSchema) {
    console.log("[Job Test 7] ✅ PASS: Expired job (deadline in past) omits active JobPosting schema");
    passedCount++;
  } else {
    console.error("[Job Test 7] ❌ FAIL: Expired job generated active JobPosting schema", jobSchema);
  }
} catch (e) {
  console.error("[Job Test 7] ❌ FAIL: Exception", e);
}

// JobPosting Test 8: Missing salary -> Valid JobPosting schema without baseSalary
try {
  const noSalaryJob = {
    title: 'ডাটা এন্ট্রি অপারেটর',
    description: 'প্রতিদিন ৪ ঘণ্টা কাজের সুযোগ।',
    organization: 'আইটি হাব পুঠিয়া',
    createdAt: '2026-08-15T00:00:00.000Z'
  };
  const res = getServiceItemDetailSchema(mockJobConfig, noSalaryJob, 'job8');
  const jobSchema = res['@graph'].find((g) => g['@type'] === 'JobPosting');

  if (jobSchema && !jobSchema.baseSalary) {
    console.log("[Job Test 8] ✅ PASS: Missing salary produces valid JobPosting schema without baseSalary field");
    passedCount++;
  } else {
    console.error("[Job Test 8] ❌ FAIL: Missing salary handling failed", jobSchema);
  }
} catch (e) {
  console.error("[Job Test 8] ❌ FAIL: Exception", e);
}

// Product Test 1: Valid product with numeric price
try {
  const numericProd = {
    title: 'স্মার্টফোন স্যামসাং',
    description: 'ব্যবহৃত স্যামসাং গ্যালাক্সি মোবাইল সম্পূর্ণ সচল।',
    price: 18500,
    imageUrl: 'https://example.com/phone.jpg',
    sellerName: 'মোঃ আব্দুল করিম',
    status: 'available'
  };
  const res = getServiceItemDetailSchema(mockProductConfig, numericProd, 'p1');
  const prodSchema = res['@graph'].find((g) => g['@type'] === 'Product');

  if (prodSchema && prodSchema.offers && prodSchema.offers.price === 18500 && prodSchema.offers.priceCurrency === 'BDT' && prodSchema.offers.availability === 'https://schema.org/InStock') {
    console.log("[Product Test 1] ✅ PASS: Valid product with numeric price generates compliant Product & Offer schema");
    passedCount++;
  } else {
    console.error("[Product Test 1] ❌ FAIL: Numeric price product schema failed", prodSchema);
  }
} catch (e) {
  console.error("[Product Test 1] ❌ FAIL: Exception", e);
}

// Product Test 2: Bengali numeral price (৳১৫,০০০ -> 15000)
try {
  const bengaliPriceProd = {
    title: 'রাইস কুকার',
    description: 'নতুন ওয়ালটন রাইস কুকার।',
    price: '৳৩,৫০০ টাকা',
    sellerName: 'বানেশ্বর ইলেকট্রনিক্স'
  };
  const res = getServiceItemDetailSchema(mockProductConfig, bengaliPriceProd, 'p2');
  const prodSchema = res['@graph'].find((g) => g['@type'] === 'Product');

  if (prodSchema && prodSchema.offers && prodSchema.offers.price === 3500) {
    console.log("[Product Test 2] ✅ PASS: Bengali numeral price string '৳৩,৫০০ টাকা' parsed to numeric 3500 BDT");
    passedCount++;
  } else {
    console.error("[Product Test 2] ❌ FAIL: Bengali price parsing failed", prodSchema);
  }
} catch (e) {
  console.error("[Product Test 2] ❌ FAIL: Exception", e);
}

// Product Test 3: Comma-formatted price ("15,000" -> 15000)
try {
  const commaPriceProd = {
    title: 'সাইকেল',
    description: 'হিরো রানিং সাইকেল।',
    price: '12,500 BDT',
    sellerName: 'করিম স্টোর'
  };
  const res = getServiceItemDetailSchema(mockProductConfig, commaPriceProd, 'p3');
  const prodSchema = res['@graph'].find((g) => g['@type'] === 'Product');

  if (prodSchema && prodSchema.offers && prodSchema.offers.price === 12500) {
    console.log("[Product Test 3] ✅ PASS: Comma-formatted price '12,500 BDT' parsed to numeric 12500 BDT");
    passedCount++;
  } else {
    console.error("[Product Test 3] ❌ FAIL: Comma price parsing failed", prodSchema);
  }
} catch (e) {
  console.error("[Product Test 3] ❌ FAIL: Exception", e);
}

// Product Test 4: Missing price -> Valid Product schema without Offer
try {
  const noPriceProd = {
    title: 'পুরাতন বই সেট',
    description: 'এইচএসসি বিজ্ঞান বিভাগের সকল বই।',
    sellerName: 'জসিম উদ্দিন'
  };
  const res = getServiceItemDetailSchema(mockProductConfig, noPriceProd, 'p4');
  const prodSchema = res['@graph'].find((g) => g['@type'] === 'Product');

  if (prodSchema && !prodSchema.offers) {
    console.log("[Product Test 4] ✅ PASS: Missing price omits Offer schema while preserving valid Product schema");
    passedCount++;
  } else {
    console.error("[Product Test 4] ❌ FAIL: Missing price offer omission failed", prodSchema);
  }
} catch (e) {
  console.error("[Product Test 4] ❌ FAIL: Exception", e);
}

// Product Test 5: Invalid/Ambiguous price ("আলোচনা সাপেক্ষে") -> Omit Offer
try {
  const ambiguousPriceProd = {
    title: 'জমি কেনাবেচা',
    description: 'বানেশ্বর বাজারে ৫ শতক জমি।',
    price: 'আলোচনা সাপেক্ষে',
    sellerName: 'মালিক'
  };
  const res = getServiceItemDetailSchema(mockProductConfig, ambiguousPriceProd, 'p5');
  const prodSchema = res['@graph'].find((g) => g['@type'] === 'Product');

  if (prodSchema && !prodSchema.offers) {
    console.log("[Product Test 5] ✅ PASS: Ambiguous price 'আলোচনা সাপেক্ষে' safely omits Offer schema");
    passedCount++;
  } else {
    console.error("[Product Test 5] ❌ FAIL: Ambiguous price failed", prodSchema);
  }
} catch (e) {
  console.error("[Product Test 5] ❌ FAIL: Exception", e);
}

// Product Test 6: Available product -> Offer availability: InStock
try {
  const inStockProd = {
    title: 'ফ্রিজ ওয়ালটন',
    description: 'সচল ফ্রিজ বিক্রি হবে।',
    price: 22000,
    status: 'available'
  };
  const res = getServiceItemDetailSchema(mockProductConfig, inStockProd, 'p6');
  const prodSchema = res['@graph'].find((g) => g['@type'] === 'Product');

  if (prodSchema && prodSchema.offers.availability === 'https://schema.org/InStock') {
    console.log("[Product Test 6] ✅ PASS: Available status maps correctly to InStock");
    passedCount++;
  } else {
    console.error("[Product Test 6] ❌ FAIL: InStock mapping failed", prodSchema);
  }
} catch (e) {
  console.error("[Product Test 6] ❌ FAIL: Exception", e);
}

// Product Test 7: Sold product -> Offer availability: OutOfStock
try {
  const soldProd = {
    title: 'সেলাই মেশিন',
    description: 'সিঙ্গার সেলাই মেশিন বিক্রি হয়ে গেছে।',
    price: 4500,
    status: 'sold'
  };
  const res = getServiceItemDetailSchema(mockProductConfig, soldProd, 'p7');
  const prodSchema = res['@graph'].find((g) => g['@type'] === 'Product');

  if (prodSchema && prodSchema.offers.availability === 'https://schema.org/OutOfStock') {
    console.log("[Product Test 7] ✅ PASS: Sold status (status === 'sold') maps correctly to OutOfStock");
    passedCount++;
  } else {
    console.error("[Product Test 7] ❌ FAIL: OutOfStock mapping failed", prodSchema);
  }
} catch (e) {
  console.error("[Product Test 7] ❌ FAIL: Exception", e);
}

// Product Test 8: Missing brand -> Product schema without Brand (sellerName NOT used as brand)
try {
  const noBrandProd = {
    title: 'দেশী মুরগি',
    description: 'খামার থেকে খাঁটি মুরগি বিক্রি।',
    price: 500,
    sellerName: 'রহিম ফার্ম'
  };
  const res = getServiceItemDetailSchema(mockProductConfig, noBrandProd, 'p8');
  const prodSchema = res['@graph'].find((g) => g['@type'] === 'Product');

  if (prodSchema && !prodSchema.brand && prodSchema.offers.seller.name === 'রহিম ফার্ম') {
    console.log("[Product Test 8] ✅ PASS: Missing brand omits Brand field and puts sellerName in offers.seller (NOT brand)");
    passedCount++;
  } else {
    console.error("[Product Test 8] ❌ FAIL: Seller/Brand separation failed", prodSchema);
  }
} catch (e) {
  console.error("[Product Test 8] ❌ FAIL: Exception", e);
}

// Product Test 9: Genuine rating/review present -> AggregateRating added
try {
  const ratedProd = {
    title: 'মোবাইল চার্জার',
    description: 'ফাস্ট চার্জার ২০ ওয়াট।',
    price: 350,
    rating: 4.8,
    reviewCount: 12
  };
  const res = getServiceItemDetailSchema(mockProductConfig, ratedProd, 'p9');
  const prodSchema = res['@graph'].find((g) => g['@type'] === 'Product');

  if (prodSchema && prodSchema.aggregateRating && prodSchema.aggregateRating.ratingValue === 4.8 && prodSchema.aggregateRating.reviewCount === 12) {
    console.log("[Product Test 9] ✅ PASS: Genuine rating and reviewCount generate valid AggregateRating");
    passedCount++;
  } else {
    console.error("[Product Test 9] ❌ FAIL: Genuine rating test failed", prodSchema);
  }
} catch (e) {
  console.error("[Product Test 9] ❌ FAIL: Exception", e);
}

// Product Test 10: Rating/review absent -> AggregateRating omitted
try {
  const unratedProd = {
    title: 'বাইসাইকেল লাইট',
    description: 'রিচার্জেবল হেডলাইট।',
    price: 250
  };
  const res = getServiceItemDetailSchema(mockProductConfig, unratedProd, 'p10');
  const prodSchema = res['@graph'].find((g) => g['@type'] === 'Product');

  if (prodSchema && !prodSchema.aggregateRating) {
    console.log("[Product Test 10] ✅ PASS: Absent rating/review omits AggregateRating (no fake ratings invented)");
    passedCount++;
  } else {
    console.error("[Product Test 10] ❌ FAIL: Rating omission failed", prodSchema);
  }
} catch (e) {
  console.error("[Product Test 10] ❌ FAIL: Exception", e);
}

console.log("========================================================");
console.log(`TEST SUMMARY: ${passedCount}/${totalTests} PASSED`);
console.log("========================================================");

if (passedCount !== totalTests) {
  process.exit(1);
}
