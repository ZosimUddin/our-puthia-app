import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface TravelMapStats {
  totalUsersCount: number;
}

export interface UserTravelMapData {
  userId: string;
  selectedDistricts: string[];
  selectedWorldCountries?: string[];
  themeId: string;
  userName?: string;
  userPhoto?: string;
  showLabels: boolean;
  updatedAt?: any;
}

const STATS_DOC_ID = 'travel_map_global_stats';

export const travelMapService = {
  subscribeStats(callback: (stats: TravelMapStats) => void) {
    const docRef = doc(db, 'system_stats', STATS_DOC_ID);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({ totalUsersCount: typeof data.totalUsersCount === 'number' ? data.totalUsersCount : 100 });
      } else {
        const initial = { totalUsersCount: 100 };
        setDoc(docRef, initial).catch(() => {});
        callback(initial);
      }
    }, () => {
      callback({ totalUsersCount: 100 });
    });
  },

  subscribeUserMap(userId: string, callback: (data: UserTravelMapData | null) => void) {
    if (!userId) return () => {};
    const docRef = doc(db, 'travel_maps', userId);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserTravelMapData);
      } else {
        callback(null);
      }
    }, () => {
      callback(null);
    });
  },

  async saveUserMap(data: UserTravelMapData): Promise<void> {
    if (!data.userId) return;
    try {
      const docRef = doc(db, 'travel_maps', data.userId);
      await setDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('Failed to save travel map:', e);
    }
  },

  async resetCounterTo100(): Promise<void> {
    try {
      const docRef = doc(db, 'system_stats', STATS_DOC_ID);
      await setDoc(docRef, { totalUsersCount: 100 }, { merge: true });
    } catch (e) {
      console.warn('Failed to reset counter:', e);
    }
  },

  async incrementMapCounter(): Promise<number> {
    try {
      const docRef = doc(db, 'system_stats', STATS_DOC_ID);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        await setDoc(docRef, { totalUsersCount: 101 });
        return 101;
      }
      const current = snap.data().totalUsersCount;
      // If previous count was legacy millions, reset to 100
      const base = (typeof current === 'number' && current < 100000) ? current : 100;
      await setDoc(docRef, { totalUsersCount: base + 1 }, { merge: true });
      return base + 1;
    } catch {
      return 101;
    }
  }
};
