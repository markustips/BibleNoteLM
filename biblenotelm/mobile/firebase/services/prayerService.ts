/**
 * Firebase Prayer Service
 * Handles all prayer-related database operations
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../config';
import { PrayerDocument, PrayingUserDocument } from '../schema';

const PRAYERS_COLLECTION = 'prayers';

// Create prayer request
export const createPrayer = async (data: Partial<PrayerDocument>): Promise<string> => {
  const prayerRef = doc(collection(db, PRAYERS_COLLECTION));
  const now = Timestamp.now();
  
  const prayerData: PrayerDocument = {
    id: prayerRef.id,
    userId: data.userId || '',
    userName: data.userName || 'Anonymous',
    title: data.title || '',
    content: data.content || '',
    category: data.category || 'other',
    isAnonymous: data.isAnonymous || false,
    visibility: data.visibility || 'church',
    status: 'active',
    prayerCount: 0,
    createdAt: now,
    updatedAt: now,
    ...data
  } as PrayerDocument;

  await setDoc(prayerRef, prayerData);
  return prayerRef.id;
};

// Get prayer by ID
export const getPrayer = async (prayerId: string): Promise<PrayerDocument | null> => {
  const prayerRef = doc(db, PRAYERS_COLLECTION, prayerId);
  const snapshot = await getDoc(prayerRef);
  
  if (snapshot.exists()) {
    return snapshot.data() as PrayerDocument;
  }
  return null;
};

// Get prayers by church
export const getPrayersByChurch = async (
  churchId: string, 
  status: 'active' | 'answered' | 'all' = 'active',
  limitCount: number = 20
): Promise<PrayerDocument[]> => {
  let q;
  
  if (status === 'all') {
    q = query(
      collection(db, PRAYERS_COLLECTION),
      where('churchId', '==', churchId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
  } else {
    q = query(
      collection(db, PRAYERS_COLLECTION),
      where('churchId', '==', churchId),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as PrayerDocument);
};

// Get prayers by user
export const getPrayersByUser = async (
  userId: string, 
  limitCount: number = 20
): Promise<PrayerDocument[]> => {
  const q = query(
    collection(db, PRAYERS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as PrayerDocument);
};

// Get public prayers
export const getPublicPrayers = async (limitCount: number = 20): Promise<PrayerDocument[]> => {
  const q = query(
    collection(db, PRAYERS_COLLECTION),
    where('visibility', '==', 'public'),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as PrayerDocument);
};

// Update prayer
export const updatePrayer = async (prayerId: string, data: Partial<PrayerDocument>): Promise<void> => {
  const prayerRef = doc(db, PRAYERS_COLLECTION, prayerId);
  await updateDoc(prayerRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

// Mark prayer as answered
export const markPrayerAnswered = async (prayerId: string, note?: string): Promise<void> => {
  const prayerRef = doc(db, PRAYERS_COLLECTION, prayerId);
  await updateDoc(prayerRef, {
    status: 'answered',
    answeredAt: serverTimestamp(),
    answeredNote: note || null,
    updatedAt: serverTimestamp()
  });
};

// Delete prayer
export const deletePrayer = async (prayerId: string): Promise<void> => {
  await deleteDoc(doc(db, PRAYERS_COLLECTION, prayerId));
};

// Add user praying for request
export const addPrayingUser = async (
  prayerId: string, 
  userId: string, 
  userName: string,
  message?: string
): Promise<void> => {
  const prayingRef = doc(db, PRAYERS_COLLECTION, prayerId, 'praying', userId);
  
  const prayingData: PrayingUserDocument = {
    userId,
    userName,
    prayedAt: Timestamp.now(),
    message
  };

  await setDoc(prayingRef, prayingData);
  
  // Increment prayer count
  await updateDoc(doc(db, PRAYERS_COLLECTION, prayerId), {
    prayerCount: increment(1)
  });
};

// Remove user from praying
export const removePrayingUser = async (prayerId: string, userId: string): Promise<void> => {
  await deleteDoc(doc(db, PRAYERS_COLLECTION, prayerId, 'praying', userId));
  
  // Decrement prayer count
  await updateDoc(doc(db, PRAYERS_COLLECTION, prayerId), {
    prayerCount: increment(-1)
  });
};

// Check if user is praying for request
export const isUserPraying = async (prayerId: string, userId: string): Promise<boolean> => {
  const prayingRef = doc(db, PRAYERS_COLLECTION, prayerId, 'praying', userId);
  const snapshot = await getDoc(prayingRef);
  return snapshot.exists();
};

// Get users praying for a request
export const getPrayingUsers = async (prayerId: string): Promise<PrayingUserDocument[]> => {
  const q = query(
    collection(db, PRAYERS_COLLECTION, prayerId, 'praying'),
    orderBy('prayedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as PrayingUserDocument);
};
