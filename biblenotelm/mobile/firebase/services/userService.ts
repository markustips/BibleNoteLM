/**
 * Firebase User Service
 * Handles all user-related database operations
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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config';
import { UserDocument } from '../schema';

const USERS_COLLECTION = 'users';

// Create or update user profile
export const createUser = async (userId: string, data: Partial<UserDocument>): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const now = Timestamp.now();
  
  const userData: Partial<UserDocument> = {
    id: userId,
    role: 'member',
    subscriptionTier: 'free',
    subscriptionStatus: 'active',
    preferences: {
      notifications: true,
      darkMode: false,
      bibleVersion: 'KJV',
      fontSize: 'medium',
      language: 'en'
    },
    stats: {
      sermonsRecorded: 0,
      prayersSubmitted: 0,
      eventsAttended: 0,
      lastActiveAt: now
    },
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
    fcmTokens: [],
    ...data
  };

  await setDoc(userRef, userData, { merge: true });
};

// Get user by ID
export const getUser = async (userId: string): Promise<UserDocument | null> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const snapshot = await getDoc(userRef);
  
  if (snapshot.exists()) {
    return snapshot.data() as UserDocument;
  }
  return null;
};

// Update user profile
export const updateUser = async (userId: string, data: Partial<UserDocument>): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

// Update user's last login
export const updateLastLogin = async (userId: string): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, {
    lastLoginAt: serverTimestamp(),
    'stats.lastActiveAt': serverTimestamp()
  });
};

// Join church
export const joinChurch = async (
  userId: string, 
  churchId: string, 
  churchCode: string, 
  churchName: string
): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, {
    churchId,
    churchCode,
    churchName,
    churchJoinedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

// Leave church
export const leaveChurch = async (userId: string): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, {
    churchId: null,
    churchCode: null,
    churchName: null,
    churchJoinedAt: null,
    updatedAt: serverTimestamp()
  });
};

// Update subscription
export const updateSubscription = async (
  userId: string, 
  tier: 'free' | 'basic' | 'premium',
  status: 'active' | 'cancelled' | 'expired' | 'trial' = 'active'
): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, {
    subscriptionTier: tier,
    subscriptionStatus: status,
    subscriptionStartDate: tier !== 'free' ? serverTimestamp() : null,
    updatedAt: serverTimestamp()
  });
};

// Update user role
export const updateUserRole = async (
  userId: string, 
  role: 'guest' | 'member' | 'subscriber' | 'pastor' | 'admin'
): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, {
    role,
    updatedAt: serverTimestamp()
  });
};

// Add FCM token for push notifications
export const addFcmToken = async (userId: string, token: string): Promise<void> => {
  const user = await getUser(userId);
  if (user) {
    const tokens = user.fcmTokens || [];
    if (!tokens.includes(token)) {
      tokens.push(token);
      await updateDoc(doc(db, USERS_COLLECTION, userId), {
        fcmTokens: tokens
      });
    }
  }
};

// Remove FCM token
export const removeFcmToken = async (userId: string, token: string): Promise<void> => {
  const user = await getUser(userId);
  if (user) {
    const tokens = (user.fcmTokens || []).filter(t => t !== token);
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      fcmTokens: tokens
    });
  }
};

// Get users by church
export const getUsersByChurch = async (churchId: string): Promise<UserDocument[]> => {
  const q = query(
    collection(db, USERS_COLLECTION),
    where('churchId', '==', churchId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as UserDocument);
};

// Increment user stats
export const incrementUserStat = async (
  userId: string, 
  stat: 'sermonsRecorded' | 'prayersSubmitted' | 'eventsAttended'
): Promise<void> => {
  const user = await getUser(userId);
  if (user) {
    const currentValue = user.stats[stat] || 0;
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      [`stats.${stat}`]: currentValue + 1,
      'stats.lastActiveAt': serverTimestamp()
    });
  }
};
