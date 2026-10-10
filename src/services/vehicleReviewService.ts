import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDocs,
  where 
} from 'firebase/firestore';
import { VehicleReview, DriverRatingStats } from '../pages/modules/VehicleRental/types';
import { sampleReviews } from '../pages/modules/VehicleRental/data';
import { logAuditActivity } from './auditLogger';

const STORAGE_KEY = 'p_vehicle_reviews';

/**
 * Get locally cached reviews combined with initial sample reviews
 */
export function getLocalReviews(): VehicleReview[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    const ids = new Set(parsed.map((r: VehicleReview) => r.id));
    return [...parsed, ...sampleReviews.filter(r => !ids.has(r.id))];
  } catch {
    return sampleReviews;
  }
}

/**
 * Save review locally
 */
export function saveLocalReview(review: VehicleReview) {
  try {
    const existing = getLocalReviews();
    const updated = [review, ...existing.filter(r => r.id !== review.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save review in localStorage', e);
  }
}

/**
 * Submit a new driver and vehicle review
 */
export async function submitDriverReview(
  reviewData: Omit<VehicleReview, 'id' | 'createdAt'>
): Promise<VehicleReview> {
  const newId = 'rev-' + Date.now();
  const fullReview: VehicleReview = {
    ...reviewData,
    id: newId,
    createdAt: new Date().toISOString()
  };

  // 1. Save to local storage immediately
  saveLocalReview(fullReview);

  // 2. Persist to Firestore
  try {
    const docRef = await addDoc(collection(db, 'vehicle_reviews'), {
      ...fullReview,
      createdAtServer: serverTimestamp()
    });
    fullReview.id = docRef.id;
  } catch (err) {
    console.warn('Firestore review submission warning:', err);
  }

  // 3. Try to update vehicle document if exists in Firestore
  try {
    if (reviewData.vehicleId) {
      const vRef = doc(db, 'vehicle_rentals', reviewData.vehicleId);
      // Calculate updated rating
      const currentReviews = getLocalReviews().filter(r => r.vehicleId === reviewData.vehicleId);
      const totalRatings = currentReviews.reduce((sum, r) => sum + (r.rating || 5), 0);
      const avgRating = Number((totalRatings / Math.max(1, currentReviews.length)).toFixed(1));
      
      await updateDoc(vRef, {
        rating: avgRating,
        reviewCount: currentReviews.length
      });
    }
  } catch {
    // Graceful fallback if vehicle doc is local seed
  }

  // 4. Log audit trail
  try {
    await logAuditActivity({
      customUser: reviewData.userName || 'Passenger',
      customEmail: reviewData.userPhone || 'passenger@puthia.app',
      action: 'VEHICLE_DRIVER_REVIEW_SUBMITTED',
      category: 'service',
      severity: 'info',
      details: `Review submitted for driver: ${reviewData.driverName || 'N/A'}, Vehicle: ${reviewData.vehicleName || reviewData.vehicleId}. Rating: ${reviewData.driverRating || reviewData.rating}★`
    });
  } catch {}

  return fullReview;
}

/**
 * Subscribe to reviews for a specific vehicle or all vehicles
 */
export function subscribeToReviews(
  vehicleId: string | undefined,
  callback: (reviews: VehicleReview[]) => void
): () => void {
  try {
    const q = query(collection(db, 'vehicle_reviews'), orderBy('createdAtServer', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreReviews: VehicleReview[] = [];
      snapshot.forEach(docSnap => {
        firestoreReviews.push({
          id: docSnap.id,
          ...docSnap.data()
        } as VehicleReview);
      });

      const fsIds = new Set(firestoreReviews.map(r => r.id));
      const localOnly = getLocalReviews().filter(r => !fsIds.has(r.id));
      const allMerged = [...firestoreReviews, ...localOnly];

      if (vehicleId) {
        callback(allMerged.filter(r => r.vehicleId === vehicleId));
      } else {
        callback(allMerged);
      }
    }, (error) => {
      console.warn('Firestore reviews subscription fallback:', error);
      const fallback = getLocalReviews();
      callback(vehicleId ? fallback.filter(r => r.vehicleId === vehicleId) : fallback);
    });

    return unsubscribe;
  } catch {
    const fallback = getLocalReviews();
    callback(vehicleId ? fallback.filter(r => r.vehicleId === vehicleId) : fallback);
    return () => {};
  }
}

/**
 * Compute Driver Statistics & Feedback Metrics
 */
export function computeDriverStats(
  reviews: VehicleReview[],
  driverName?: string,
  driverPhone?: string
): DriverRatingStats {
  const driverReviews = reviews.filter(r => {
    if (driverPhone && r.driverPhone === driverPhone) return true;
    if (driverName && r.driverName?.toLowerCase() === driverName.toLowerCase()) return true;
    return false;
  });

  if (driverReviews.length === 0) {
    return {
      driverName: driverName || 'চালক',
      driverPhone,
      averageRating: 4.9,
      totalReviews: 0,
      safetyScore: 5.0,
      punctualityScore: 4.9,
      behaviorScore: 5.0,
      recommendationRate: 98,
      tags: { 'নিরাপদ ড্রাইভিং': 5, 'সময়নিষ্ঠ': 4, 'বিনয়ী চালক': 6 }
    };
  }

  const totalReviews = driverReviews.length;
  const avg = driverReviews.reduce((sum, r) => sum + (r.driverRating || r.rating || 5), 0) / totalReviews;
  const safety = driverReviews.reduce((sum, r) => sum + (r.safetyRating || 5), 0) / totalReviews;
  const punctuality = driverReviews.reduce((sum, r) => sum + (r.punctualityRating || 5), 0) / totalReviews;
  const behavior = driverReviews.reduce((sum, r) => sum + (r.behaviorRating || 5), 0) / totalReviews;
  
  const recommendedCount = driverReviews.filter(r => r.recommended !== false).length;
  const recommendationRate = Math.round((recommendedCount / totalReviews) * 100);

  const tags: { [key: string]: number } = {};
  driverReviews.forEach(r => {
    if (r.feedbackTags && Array.isArray(r.feedbackTags)) {
      r.feedbackTags.forEach(t => {
        tags[t] = (tags[t] || 0) + 1;
      });
    }
  });

  return {
    driverName: driverName || 'চালক',
    driverPhone,
    averageRating: Number(avg.toFixed(1)),
    totalReviews,
    safetyScore: Number(safety.toFixed(1)),
    punctualityScore: Number(punctuality.toFixed(1)),
    behaviorScore: Number(behavior.toFixed(1)),
    recommendationRate,
    tags
  };
}

/**
 * Delete a review (Staff / Admin / Author)
 */
export async function deleteVehicleReview(reviewId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'vehicle_reviews', reviewId));
  } catch {}

  try {
    const existing = getLocalReviews();
    const filtered = existing.filter(r => r.id !== reviewId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {}

  return true;
}
