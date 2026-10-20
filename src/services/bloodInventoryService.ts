import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "../firebase";
import { logAuditActivity } from "./auditLogger";

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";
export type StockStatus = "available" | "low" | "critical";

export interface BloodInventoryItem {
  id: string;
  bloodGroup: BloodGroup;
  bagsAvailable: number;
  reservedBags: number;
  hospitalName: string;
  location: string;
  contactPhone: string;
  status: StockStatus;
  lastUpdated?: any;
  updatedBy?: string;
  updatedByEmail?: string;
  notes?: string;
}

export interface BloodStockLog {
  id?: string;
  bloodGroup: BloodGroup;
  previousBags: number;
  newBags: number;
  changeAmount: number;
  reason: string;
  adminName: string;
  adminEmail: string;
  timestamp?: any;
}

export const INITIAL_BLOOD_STOCK: BloodInventoryItem[] = [
  {
    id: "A_POS",
    bloodGroup: "A+",
    bagsAvailable: 14,
    reservedBags: 2,
    hospitalName: "পুঠিয়া উপজেলা স্বাস্থ্য কমপ্লেক্স ব্লাড ব্যাংক",
    location: "উপজেলা কমপ্লেক্স ভবন, পুঠিয়া, রাজশাহী",
    contactPhone: "01711-001122",
    status: "available",
    notes: "পর্যাপ্ত মজুদ রয়েছে",
    updatedBy: "উপজেলা স্বাস্থ্য এডমিন"
  },
  {
    id: "A_NEG",
    bloodGroup: "A-",
    bagsAvailable: 2,
    reservedBags: 0,
    hospitalName: "পুঠিয়া উপজেলা স্বাস্থ্য কমপ্লেক্স ব্লাড ব্যাংক",
    location: "উপজেলা কমপ্লেক্স ভবন, পুঠিয়া, রাজশাহী",
    contactPhone: "01711-001122",
    status: "low",
    notes: "জরুরি রক্তদাতা প্রয়োজন",
    updatedBy: "উপজেলা স্বাস্থ্য এডমিন"
  },
  {
    id: "B_POS",
    bloodGroup: "B+",
    bagsAvailable: 18,
    reservedBags: 3,
    hospitalName: "পুঠিয়া উপজেলা স্বাস্থ্য কমপ্লেক্স ব্লাড ব্যাংক",
    location: "উপজেলা কমপ্লেক্স ভবন, পুঠিয়া, রাজশাহী",
    contactPhone: "01711-001122",
    status: "available",
    notes: "নিয়মিত রক্তদান ক্যাম্প চলছে",
    updatedBy: "উপজেলা স্বাস্থ্য এডমিন"
  },
  {
    id: "B_NEG",
    bloodGroup: "B-",
    bagsAvailable: 1,
    reservedBags: 1,
    hospitalName: "রেড ক্রিসেন্ট ব্লাড ব্যাংক পুঠিয়া শাখা",
    location: "থানা রোড, পুঠিয়া সদর",
    contactPhone: "01722-334455",
    status: "critical",
    notes: "জরুরি স্টক শেষ পর্যায়ে, নেগেটিভ ডোনার প্রস্তুত রাখুন",
    updatedBy: "রেড ক্রিসেন্ট পুঠিয়া"
  },
  {
    id: "O_POS",
    bloodGroup: "O+",
    bagsAvailable: 22,
    reservedBags: 4,
    hospitalName: "পুঠিয়া উপজেলা স্বাস্থ্য কমপ্লেক্স ব্লাড ব্যাংক",
    location: "উপজেলা কমপ্লেক্স ভবন, পুঠিয়া, রাজশাহী",
    contactPhone: "01711-001122",
    status: "available",
    notes: "পর্যাপ্ত মজুদ রয়েছে",
    updatedBy: "উপজেলা স্বাস্থ্য এডমিন"
  },
  {
    id: "O_NEG",
    bloodGroup: "O-",
    bagsAvailable: 0,
    reservedBags: 0,
    hospitalName: "পুঠিয়া উপজেলা স্বাস্থ্য কমপ্লেক্স ব্লাড ব্যাংক",
    location: "উপজেলা কমপ্লেক্স ভবন, পুঠিয়া, রাজশাহী",
    contactPhone: "01711-001122",
    status: "critical",
    notes: "স্টক শূন্য! ও-নেগেটিভ জরুরি রক্তদাতা প্রয়োজন",
    updatedBy: "উপজেলা স্বাস্থ্য এডমিন"
  },
  {
    id: "AB_POS",
    bloodGroup: "AB+",
    bagsAvailable: 8,
    reservedBags: 1,
    hospitalName: "পুঠিয়া উপজেলা স্বাস্থ্য কমপ্লেক্স ব্লাড ব্যাংক",
    location: "উপজেলা কমপ্লেক্স ভবন, পুঠিয়া, রাজশাহী",
    contactPhone: "01711-001122",
    status: "available",
    notes: "পর্যাপ্ত স্টক রয়েছে",
    updatedBy: "উপজেলা স্বাস্থ্য এডমিন"
  },
  {
    id: "AB_NEG",
    bloodGroup: "AB-",
    bagsAvailable: 1,
    reservedBags: 0,
    hospitalName: "রেড ক্রিসেন্ট ব্লাড ব্যাংক পুঠিয়া শাখা",
    location: "থানা রোড, পুঠিয়া সদর",
    contactPhone: "01722-334455",
    status: "low",
    notes: "সংকটজনক পরিস্থিতি, ডোনার প্রয়োজন",
    updatedBy: "রেড ক্রিসেন্ট পুঠিয়া"
  }
];

export const subscribeToBloodInventory = (
  callback: (inventory: BloodInventoryItem[]) => void
): (() => void) => {
  const inventoryRef = collection(db, "blood_inventory");

  // Initial seed check if empty
  getDocs(inventoryRef).then((snapshot) => {
    if (snapshot.empty) {
      INITIAL_BLOOD_STOCK.forEach(async (item) => {
        await setDoc(doc(db, "blood_inventory", item.id), {
          ...item,
          lastUpdated: serverTimestamp()
        });
      });
    }
  }).catch((err) => {
    console.error("Error checking initial blood inventory seed:", err);
  });

  return onSnapshot(
    inventoryRef,
    (snapshot) => {
      if (snapshot.empty) {
        callback(INITIAL_BLOOD_STOCK);
        return;
      }
      const items: BloodInventoryItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as BloodInventoryItem);
      });
      // Sort in standard order
      const orderMap: Record<string, number> = {
        "A+": 1, "A-": 2, "B+": 3, "B-": 4, "O+": 5, "O-": 6, "AB+": 7, "AB-": 8
      };
      items.sort((a, b) => (orderMap[a.bloodGroup] || 99) - (orderMap[b.bloodGroup] || 99));
      callback(items);
    },
    (error) => {
      console.error("Real-time blood inventory subscription error:", error);
      callback(INITIAL_BLOOD_STOCK);
    }
  );
};

export const updateBloodStock = async (
  item: Partial<BloodInventoryItem> & { id: string; bloodGroup: BloodGroup; bagsAvailable: number },
  adminUser: { uid: string; name: string; email: string },
  reasonNotes?: string
): Promise<void> => {
  try {
    const docRef = doc(db, "blood_inventory", item.id);
    const prevDoc = await getDocs(collection(db, "blood_inventory"));
    let prevBags = 0;
    prevDoc.forEach((d) => {
      if (d.id === item.id) {
        prevBags = d.data().bagsAvailable || 0;
      }
    });

    // Auto calculate status based on bags if not explicitly passed
    let status: StockStatus = item.status || "available";
    if (item.bagsAvailable <= 0) {
      status = "critical";
    } else if (item.bagsAvailable <= 3) {
      status = "low";
    } else if (!item.status) {
      status = "available";
    }

    const payload = {
      ...item,
      status,
      lastUpdated: serverTimestamp(),
      updatedBy: adminUser.name || "অ্যাডমিনিস্ট্রেটর",
      updatedByEmail: adminUser.email || ""
    };

    await setDoc(docRef, payload, { merge: true });

    // Log stock change activity
    await addDoc(collection(db, "blood_stock_logs"), {
      bloodGroup: item.bloodGroup,
      previousBags: prevBags,
      newBags: item.bagsAvailable,
      changeAmount: item.bagsAvailable - prevBags,
      reason: reasonNotes || "অ্যাডমিন কর্তৃক স্টক পরিবর্তন",
      adminName: adminUser.name || "অ্যাডমিন",
      adminEmail: adminUser.email || "",
      timestamp: serverTimestamp()
    });

    // Log to system audit trail
    await logAuditActivity({
      actorUid: adminUser.uid,
      customUser: adminUser.name || "অ্যাডমিন",
      customEmail: adminUser.email || "",
      actorRole: "অ্যাডমিনিস্ট্রেটর",
      action: `রক্তের স্টক আপডেট (${item.bloodGroup}): ${prevBags} ব্যাগ ➔ ${item.bagsAvailable} ব্যাগ`,
      details: `ব্লাড গ্রুপ: ${item.bloodGroup}, অবস্থা: ${status}`,
      category: "service",
      severity: "info"
    });
  } catch (error) {
    console.error("Error updating blood stock:", error);
    throw error;
  }
};

export const subscribeToStockLogs = (
  callback: (logs: BloodStockLog[]) => void
): (() => void) => {
  const logsRef = collection(db, "blood_stock_logs");
  const q = query(logsRef, orderBy("timestamp", "desc"), limit(20));
  
  return onSnapshot(q, (snapshot) => {
    const logs: BloodStockLog[] = [];
    snapshot.forEach((docSnap) => {
      logs.push({ id: docSnap.id, ...docSnap.data() } as BloodStockLog);
    });
    callback(logs);
  });
};
