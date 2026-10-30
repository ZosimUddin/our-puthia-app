import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { AdminActivityItem, AdminActivityToast } from '../components/common/AdminActivityToast';

/**
 * Gentle two-tone notification chime using browser Web Audio API
 */
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Tone 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Tone 2: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    gain2.gain.setValueAtTime(0.15, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.4);
  } catch (e) {
    // Audio context may be restricted before user gesture
  }
}

/**
 * Display the custom Admin Activity Toast
 */
export function showAdminActivityToast(item: AdminActivityItem, navigate?: (path: string) => void) {
  playNotificationChime();

  toast.custom((id) => (
    React.createElement(AdminActivityToast, {
      item,
      onDismiss: () => toast.dismiss(id),
      onAction: () => {
        if (navigate) {
          navigate(item.link || '/super-admin/universal?tab=verification');
        } else {
          window.location.href = item.link || '/super-admin/universal?tab=verification';
        }
      }
    })
  ), {
    duration: 8000,
    position: 'top-right'
  });
}

/**
 * Log a new service or business profile submission to the admin activity stream
 */
export async function logAdminActivitySubmission(data: {
  title: string;
  category: string;
  collectionName: string;
  submitterName?: string;
  submitterPhone?: string;
  link?: string;
}) {
  try {
    await addDoc(collection(db, 'admin_activities'), {
      title: data.title,
      category: data.category,
      collectionName: data.collectionName,
      submitterName: data.submitterName || 'সচেতন নাগরিক',
      submitterPhone: data.submitterPhone || '',
      link: data.link || `/super-admin/universal?tab=services&key=${data.collectionName}&status=pending`,
      createdAt: serverTimestamp(),
      isoDate: new Date().toISOString(),
      status: 'pending'
    });
  } catch (err) {
    console.warn('Could not record admin activity stream entry:', err);
  }
}

/**
 * React hook to listen for real-time service and business profile submissions
 * and trigger 'Admin Activity' toast notifications for staff and administrators.
 */
export function useAdminActivityNotifier(navigate: (path: string) => void) {
  const { user, userProfile } = useAuth();
  const initialLoadRef = useRef(true);
  const seenIdsRef = useRef<Set<string>>(new Set());

  // Check if current user is an Admin, Super Admin, or Staff
  const isStaff = 
    userProfile?.role === 'super_admin' || 
    userProfile?.role === 'admin' || 
    userProfile?.role === 'moderator' || 
    userProfile?.role === 'editor' || 
    userProfile?.role === 'staff' ||
    user?.email === 'mdzosimuddin31@gmail.com' ||
    user?.email === 'mdzosimuddin47@gmail.com' ||
    user?.email === 'josimuddinadds@gmail.com';

  useEffect(() => {
    if (!isStaff) return;

    const unsubs: (() => void)[] = [];

    // 1. Listen to 'admin_activities' collection
    try {
      const activitiesQuery = query(
        collection(db, 'admin_activities'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const unsubActivities = onSnapshot(activitiesQuery, (snapshot) => {
        if (initialLoadRef.current) {
          snapshot.docs.forEach((d) => seenIdsRef.current.add(d.id));
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const id = change.doc.id;
            if (!seenIdsRef.current.has(id)) {
              seenIdsRef.current.add(id);
              const data = change.doc.data();
              showAdminActivityToast({
                id,
                title: data.title || 'নতুন সাবমিশন',
                category: data.category || 'সেবা বা ব্যবসা',
                submitterName: data.submitterName || 'নাগরিক',
                submitterPhone: data.submitterPhone,
                link: data.link || '/super-admin/universal?tab=verification',
                time: 'এইমাত্র জমা হয়েছে'
              }, navigate);
            }
          }
        });
      }, (err) => {
        console.warn('Admin activities subscription notice:', err);
      });

      unsubs.push(unsubActivities);
    } catch (e) {
      console.warn('Error setting up admin activities listener:', e);
    }

    // 2. Listen to 'local_shops' for new business submissions
    try {
      const shopsQuery = query(
        collection(db, 'local_shops'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const unsubShops = onSnapshot(shopsQuery, (snapshot) => {
        if (initialLoadRef.current) {
          snapshot.docs.forEach((d) => seenIdsRef.current.add(d.id));
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const id = change.doc.id;
            const data = change.doc.data();
            // Trigger toast if unverified / pending
            if (!seenIdsRef.current.has(id) && (data.verified === false || data.status === 'pending')) {
              seenIdsRef.current.add(id);
              showAdminActivityToast({
                id,
                title: data.name || data.shopName || 'নতুন ব্যবসা প্রতিষ্ঠান',
                category: data.category || 'দোকান ও ব্যবসা ডিরেক্টরি',
                submitterName: data.owner || data.userName || 'উদ্যোক্তা',
                submitterPhone: data.phone || data.contact,
                link: '/admin/businesses',
                time: 'এইমাত্র জমা হয়েছে'
              }, navigate);
            }
          }
        });
      }, (err) => {
        console.warn('Local shops subscription notice:', err);
      });

      unsubs.push(unsubShops);
    } catch (e) {
      console.warn('Error setting up shops listener:', e);
    }

    // After setting up initial queries, allow future additions to trigger toasts
    const timer = setTimeout(() => {
      initialLoadRef.current = false;
    }, 1500);

    return () => {
      clearTimeout(timer);
      unsubs.forEach((fn) => fn());
    };
  }, [isStaff, navigate]);
}
