/**
 * Firebase Church Service
 * Handles all church-related database operations
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
import { ChurchDocument, ChurchMemberDocument } from '../schema';

const CHURCHES_COLLECTION = 'churches';

// Generate unique church code
const generateChurchCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Create new church
export const createChurch = async (data: Partial<ChurchDocument>): Promise<string> => {
  const churchRef = doc(collection(db, CHURCHES_COLLECTION));
  const now = Timestamp.now();
  
  const churchData: ChurchDocument = {
    id: churchRef.id,
    name: data.name || 'New Church',
    code: data.code || generateChurchCode(),
    description: data.description,
    pastorId: data.pastorId || '',
    adminIds: data.adminIds || [],
    stats: {
      memberCount: 0,
      activeMembers: 0,
      totalSermons: 0,
      totalPrayers: 0,
      totalEvents: 0
    },
    settings: {
      allowGuestPrayers: true,
      requireApproval: false,
      publicListing: true,
      enableChat: false
    },
    createdAt: now,
    updatedAt: now,
    isActive: true,
    ...data
  } as ChurchDocument;

  await setDoc(churchRef, churchData);
  return churchRef.id;
};

// Get church by ID
export const getChurch = async (churchId: string): Promise<ChurchDocument | null> => {
  const churchRef = doc(db, CHURCHES_COLLECTION, churchId);
  const snapshot = await getDoc(churchRef);
  
  if (snapshot.exists()) {
    return snapshot.data() as ChurchDocument;
  }
  return null;
};

// Get church by code
export const getChurchByCode = async (code: string): Promise<ChurchDocument | null> => {
  const q = query(
    collection(db, CHURCHES_COLLECTION),
    where('code', '==', code.toUpperCase()),
    where('isActive', '==', true),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    return snapshot.docs[0].data() as ChurchDocument;
  }
  return null;
};

// Update church
export const updateChurch = async (churchId: string, data: Partial<ChurchDocument>): Promise<void> => {
  const churchRef = doc(db, CHURCHES_COLLECTION, churchId);
  await updateDoc(churchRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

// Add member to church
export const addChurchMember = async (
  churchId: string, 
  userId: string, 
  userName: string,
  role: 'member' | 'leader' | 'pastor' | 'admin' = 'member'
): Promise<void> => {
  const memberRef = doc(db, CHURCHES_COLLECTION, churchId, 'members', userId);
  
  const memberData: ChurchMemberDocument = {
    userId,
    role,
    joinedAt: Timestamp.now(),
    isActive: true,
    lastActiveAt: Timestamp.now()
  };

  await setDoc(memberRef, memberData);
  
  // Increment member count
  await updateDoc(doc(db, CHURCHES_COLLECTION, churchId), {
    'stats.memberCount': increment(1),
    'stats.activeMembers': increment(1)
  });
};

// Remove member from church
export const removeChurchMember = async (churchId: string, userId: string): Promise<void> => {
  const memberRef = doc(db, CHURCHES_COLLECTION, churchId, 'members', userId);
  await deleteDoc(memberRef);
  
  // Decrement member count
  await updateDoc(doc(db, CHURCHES_COLLECTION, churchId), {
    'stats.memberCount': increment(-1),
    'stats.activeMembers': increment(-1)
  });
};

// Get church members
export const getChurchMembers = async (churchId: string): Promise<ChurchMemberDocument[]> => {
  const q = query(
    collection(db, CHURCHES_COLLECTION, churchId, 'members'),
    orderBy('joinedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as ChurchMemberDocument);
};

// Update member role
export const updateMemberRole = async (
  churchId: string, 
  userId: string, 
  role: 'member' | 'leader' | 'pastor' | 'admin'
): Promise<void> => {
  const memberRef = doc(db, CHURCHES_COLLECTION, churchId, 'members', userId);
  await updateDoc(memberRef, { role });
};

// Get all public churches
export const getPublicChurches = async (limitCount: number = 20): Promise<ChurchDocument[]> => {
  const q = query(
    collection(db, CHURCHES_COLLECTION),
    where('isActive', '==', true),
    where('settings.publicListing', '==', true),
    orderBy('stats.memberCount', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as ChurchDocument);
};

// Increment church stat
export const incrementChurchStat = async (
  churchId: string, 
  stat: 'totalSermons' | 'totalPrayers' | 'totalEvents'
): Promise<void> => {
  await updateDoc(doc(db, CHURCHES_COLLECTION, churchId), {
    [`stats.${stat}`]: increment(1)
  });
};
