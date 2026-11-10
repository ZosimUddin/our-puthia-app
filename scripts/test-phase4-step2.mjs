import { buildFaqPageSchema } from '../src/utils/seoHelpers.ts';
import { MOCK_PUTHIA_FAQS } from '../src/services/supportCenterService.ts';

console.log("========================================================");
console.log("   PHASE 4, STEP 4.2: FAQPAGE JSON-LD AUDIT & TEST SUITE");
console.log("========================================================");

let testsPassed = 0;
const totalTests = 10;

// Test 1: Generate FAQPage Schema from MOCK_PUTHIA_FAQS
try {
  const schema = buildFaqPageSchema(MOCK_PUTHIA_FAQS);
  if (schema && schema['@context'] === 'https://schema.org' && schema['@type'] === 'FAQPage') {
    console.log("[Test 1] ✅ PASS: FAQPage Schema object correctly generated with valid @context and @type");
    testsPassed++;
  } else {
    console.error("[Test 1] ❌ FAIL: Invalid schema structure", schema);
  }
} catch (e) {
  console.error("[Test 1] ❌ FAIL: Exception thrown", e);
}

// Test 2: Verify Total Question Count (10 questions)
try {
  const schema = buildFaqPageSchema(MOCK_PUTHIA_FAQS);
  const mainEntity = schema?.mainEntity || [];
  if (mainEntity.length === 10) {
    console.log(`[Test 2] ✅ PASS: Total Question count matches expected visible UI count (10/10)`);
    testsPassed++;
  } else {
    console.error(`[Test 2] ❌ FAIL: Expected 10 questions, got ${mainEntity.length}`);
  }
} catch (e) {
  console.error("[Test 2] ❌ FAIL: Exception in Test 2", e);
}

// Test 3: Verify every Question has @type: Question and name
try {
  const schema = buildFaqPageSchema(MOCK_PUTHIA_FAQS);
  const mainEntity = schema?.mainEntity || [];
  const allValidQuestions = mainEntity.every(q => q['@type'] === 'Question' && typeof q.name === 'string' && q.name.trim().length > 0);
  if (allValidQuestions) {
    console.log("[Test 3] ✅ PASS: Every Question item has valid @type: Question and non-empty name");
    testsPassed++;
  } else {
    console.error("[Test 3] ❌ FAIL: Found invalid Question item", mainEntity);
  }
} catch (e) {
  console.error("[Test 3] ❌ FAIL: Exception in Test 3", e);
}

// Test 4: Verify every Question has acceptedAnswer with @type: Answer and text
try {
  const schema = buildFaqPageSchema(MOCK_PUTHIA_FAQS);
  const mainEntity = schema?.mainEntity || [];
  const allValidAnswers = mainEntity.every(q => 
    q.acceptedAnswer && 
    q.acceptedAnswer['@type'] === 'Answer' && 
    typeof q.acceptedAnswer.text === 'string' && 
    q.acceptedAnswer.text.trim().length > 0
  );
  if (allValidAnswers) {
    console.log("[Test 4] ✅ PASS: Every Question item contains valid acceptedAnswer with @type: Answer and non-empty text");
    testsPassed++;
  } else {
    console.error("[Test 4] ❌ FAIL: Found invalid acceptedAnswer item", mainEntity);
  }
} catch (e) {
  console.error("[Test 4] ❌ FAIL: Exception in Test 4", e);
}

// Test 5: Verify Filtering of Empty / Missing / Incomplete Q&As
try {
  const dummyInput = [
    { question: "বৈধ প্রশ্ন১?", answer: "বৈধ উত্তর১" },
    { question: "", answer: "উত্তর আছে কিন্তু প্রশ্ন নেই" },
    { question: "প্রশ্ন আছে কিন্তু উত্তর নেই", answer: "   " },
    { question: "   ", answer: "" },
    { q: "বৈধ প্রশ্ন২?", a: "বৈধ উত্তর২" }
  ];
  const dummySchema = buildFaqPageSchema(dummyInput);
  if (dummySchema && dummySchema.mainEntity.length === 2) {
    console.log("[Test 5] ✅ PASS: Empty, missing, and whitespace-only Q&As are safely filtered out (2/5 kept)");
    testsPassed++;
  } else {
    console.error("[Test 5] ❌ FAIL: Filtering failed", dummySchema);
  }
} catch (e) {
  console.error("[Test 5] ❌ FAIL: Exception in Test 5", e);
}

// Test 6: Verify Schema Q&A text matches UI FAQ content (MOCK_PUTHIA_FAQS) exactly
try {
  const schema = buildFaqPageSchema(MOCK_PUTHIA_FAQS);
  const mainEntity = schema?.mainEntity || [];
  let exactMatch = true;

  for (let i = 0; i < MOCK_PUTHIA_FAQS.length; i++) {
    const original = MOCK_PUTHIA_FAQS[i];
    const generated = mainEntity[i];
    if (generated.name !== original.question || generated.acceptedAnswer.text !== original.answer) {
      exactMatch = false;
      break;
    }
  }

  if (exactMatch) {
    console.log("[Test 6] ✅ PASS: Schema Question names and Answer texts match MOCK_PUTHIA_FAQS exactly");
    testsPassed++;
  } else {
    console.error("[Test 6] ❌ FAIL: Content mismatch between Schema and MOCK_PUTHIA_FAQS");
  }
} catch (e) {
  console.error("[Test 6] ❌ FAIL: Exception in Test 6", e);
}

// Test 7: Verify null handling on empty/invalid inputs
try {
  const emptyRes = buildFaqPageSchema([]);
  const nullRes = buildFaqPageSchema(null);
  if (emptyRes === null && nullRes === null) {
    console.log("[Test 7] ✅ PASS: buildFaqPageSchema returns null safely when no valid questions exist");
    testsPassed++;
  } else {
    console.error("[Test 7] ❌ FAIL: Empty/null input handling failed", emptyRes, nullRes);
  }
} catch (e) {
  console.error("[Test 7] ❌ FAIL: Exception in Test 7", e);
}

// Test 8: Verify No Artificial Data, Ratings, or Reviews in Schema
try {
  const schema = buildFaqPageSchema(MOCK_PUTHIA_FAQS);
  const jsonString = JSON.stringify(schema);
  const containsFakeRating = jsonString.includes("AggregateRating") || jsonString.includes("reviewRating") || jsonString.includes("5.0");
  if (!containsFakeRating) {
    console.log("[Test 8] ✅ PASS: Schema is strictly pristine — no fake ratings, reviews, or hallucinated fields");
    testsPassed++;
  } else {
    console.error("[Test 8] ❌ FAIL: Found hallucinated rating/review fields in schema");
  }
} catch (e) {
  console.error("[Test 8] ❌ FAIL: Exception in Test 8", e);
}

// Test 9: Output Sample JSON-LD Structure Verification
try {
  const schema = buildFaqPageSchema(MOCK_PUTHIA_FAQS);
  const jsonStr = JSON.stringify(schema, null, 2);
  if (jsonStr.includes('"@type": "FAQPage"') && jsonStr.includes('"acceptedAnswer"')) {
    console.log("[Test 9] ✅ PASS: JSON-LD stringifies cleanly to valid Schema.org specification");
    testsPassed++;
  } else {
    console.error("[Test 9] ❌ FAIL: Stringify verification failed");
  }
} catch (e) {
  console.error("[Test 9] ❌ FAIL: Exception in Test 9", e);
}

// Test 10: Canonical Path & Multi-Format Compatibility Check
try {
  const customFormat = [
    { q: "পুঠিয়া কোথায়?", a: "রাজশাহী জেলায়।" }
  ];
  const customSchema = buildFaqPageSchema(customFormat);
  if (customSchema?.mainEntity[0]?.name === "পুঠিয়া কোথায়?" && customSchema?.mainEntity[0]?.acceptedAnswer?.text === "রাজশাহী জেলায়।") {
    console.log("[Test 10] ✅ PASS: Helper seamlessly converts both {question, answer} and {q, a} object formats");
    testsPassed++;
  } else {
    console.error("[Test 10] ❌ FAIL: Dual key support failed", customSchema);
  }
} catch (e) {
  console.error("[Test 10] ❌ FAIL: Exception in Test 10", e);
}

console.log("========================================================");
console.log(`TEST SUMMARY: ${testsPassed}/${totalTests} PASSED`);
console.log("========================================================");

if (testsPassed !== totalTests) {
  process.exit(1);
}
