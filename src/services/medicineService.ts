import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  increment 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Medicine, MedicinePriceReport, SavedPrescription } from '../types/medicine';
import { INITIAL_MEDICINES } from '../data/initialMedicines';

const MEDICINES_COLLECTION = 'medicines';
const PRICE_REPORTS_COLLECTION = 'medicine_price_reports';
const PRESCRIPTIONS_COLLECTION = 'saved_prescriptions';

class MedicineService {
  private localCache: Medicine[] = [...INITIAL_MEDICINES];
  private isInitialized = false;

  // Initialize and Seed Default Medicines if DB is empty
  async initializeDatabase(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const snap = await getDocs(collection(db, MEDICINES_COLLECTION));
      if (snap.empty) {
        console.log("Seeding initial medicines to Firestore...");
        for (const med of INITIAL_MEDICINES) {
          await setDoc(doc(db, MEDICINES_COLLECTION, med.id), {
            ...med,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }
      this.isInitialized = true;
    } catch (e) {
      console.warn("Could not seed medicines to Firestore, using offline fallback:", e);
    }
  }

  // Real-time listener for all medicines
  subscribeMedicines(onUpdate: (medicines: Medicine[]) => void): () => void {
    try {
      const q = query(collection(db, MEDICINES_COLLECTION));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Medicine[] = [];
            snapshot.forEach((doc) => {
              list.push({ id: doc.id, ...doc.data() } as Medicine);
            });
            this.localCache = list;
            onUpdate(list);
          } else {
            // DB is empty, trigger seed in background and send initial
            this.initializeDatabase().catch(() => {});
            onUpdate(this.localCache);
          }
        },
        (error) => {
          console.warn("Firestore medicines real-time listener error:", error);
          onUpdate(this.localCache);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.warn("Error subscribing to medicines:", err);
      onUpdate(this.localCache);
      return () => {};
    }
  }

  // Get single medicine by ID
  async getMedicineById(id: string): Promise<Medicine | null> {
    try {
      const docRef = doc(db, MEDICINES_COLLECTION, id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Medicine;
      }
    } catch (e) {
      console.warn("Failed to fetch medicine from Firestore:", e);
    }
    return this.localCache.find(m => m.id === id) || null;
  }

  // Find same generic alternative medicines (Cheaper alternatives)
  getAlternativesByGeneric(genericName: string, currentMedicineId: string): Medicine[] {
    if (!genericName) return [];
    const normalized = genericName.trim().toLowerCase();
    return this.localCache
      .filter(m => m.id !== currentMedicineId && m.genericName.toLowerCase().includes(normalized))
      .sort((a, b) => a.unitPrice - b.unitPrice);
  }

  // Increment view count
  async incrementViews(id: string): Promise<void> {
    try {
      const docRef = doc(db, MEDICINES_COLLECTION, id);
      await updateDoc(docRef, {
        viewsCount: increment(1)
      });
    } catch (e) {
      // Local fallback
      const found = this.localCache.find(m => m.id === id);
      if (found) {
        found.viewsCount = (found.viewsCount || 0) + 1;
      }
    }
  }

  // Super Admin: Create new medicine
  async addMedicine(medicineData: Omit<Medicine, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, MEDICINES_COLLECTION), {
      ...medicineData,
      viewsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  // Super Admin: Update existing medicine
  async updateMedicine(id: string, updateData: Partial<Medicine>): Promise<void> {
    const docRef = doc(db, MEDICINES_COLLECTION, id);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  }

  // Super Admin: Delete medicine
  async deleteMedicine(id: string): Promise<void> {
    const docRef = doc(db, MEDICINES_COLLECTION, id);
    await deleteDoc(docRef);
  }

  // Submit User Price Report (Crowdsourced)
  async submitPriceReport(report: Omit<MedicinePriceReport, 'id' | 'status' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, PRICE_REPORTS_COLLECTION), {
      ...report,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    return docRef.id;
  }

  // Super Admin: Real-time price reports listener
  subscribePriceReports(onUpdate: (reports: MedicinePriceReport[]) => void): () => void {
    try {
      const q = query(collection(db, PRICE_REPORTS_COLLECTION), orderBy('createdAt', 'desc'));
      return onSnapshot(
        q,
        (snapshot) => {
          const list: MedicinePriceReport[] = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as MedicinePriceReport);
          });
          onUpdate(list);
        },
        (error) => {
          console.warn("Price reports listener error:", error);
          onUpdate([]);
        }
      );
    } catch (e) {
      console.warn("Error subscribing to price reports:", e);
      onUpdate([]);
      return () => {};
    }
  }

  // Super Admin: Review & approve/reject price report
  async reviewPriceReport(reportId: string, status: 'verified' | 'rejected', medicineId?: string, newUnitPrice?: number): Promise<void> {
    const reportRef = doc(db, PRICE_REPORTS_COLLECTION, reportId);
    await updateDoc(reportRef, { status });

    if (status === 'verified' && medicineId && newUnitPrice !== undefined) {
      const medRef = doc(db, MEDICINES_COLLECTION, medicineId);
      await updateDoc(medRef, {
        unitPrice: newUnitPrice,
        lastUpdated: new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }),
        updatedAt: serverTimestamp()
      });
    }
  }

  // Save Prescription / Bill Calculation
  async savePrescription(prescription: Omit<SavedPrescription, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, PRESCRIPTIONS_COLLECTION), {
        ...prescription,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (e) {
      // Local storage fallback
      const saved = JSON.parse(localStorage.getItem('saved_prescriptions') || '[]');
      const newId = 'local_' + Date.now();
      saved.unshift({ ...prescription, id: newId, createdAt: new Date().toISOString() });
      localStorage.setItem('saved_prescriptions', JSON.stringify(saved));
      return newId;
    }
  }

  // Get Saved Prescriptions for user
  async getSavedPrescriptions(userId?: string): Promise<SavedPrescription[]> {
    if (userId) {
      try {
        const q = query(collection(db, PRESCRIPTIONS_COLLECTION), where('userId', '==', userId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list: SavedPrescription[] = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() } as SavedPrescription));
          return list;
        }
      } catch (e) {
        console.warn("Error fetching user prescriptions:", e);
      }
    }
    return JSON.parse(localStorage.getItem('saved_prescriptions') || '[]');
  }
}

export const medicineService = new MedicineService();
