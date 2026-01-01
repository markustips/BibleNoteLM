/**
 * Firebase Announcement Service
 * Handles all announcement-related database operations
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
import { AnnouncementDocument } from '../schema';

const ANNOUNCEMENTS_COLLECTION = 'announcements';

// Create announcement
export const createAnnouncement = async (data: Partial<AnnouncementDocument>): Promise<string> => {
  const announcementRef = doc(collection(db, ANNOUNCEMENTS_COLLECTION));
  const now = Timestamp.now();
  
  const announcementData: AnnouncementDocument = {
    id: announcementRef.id,
    churchId: data.churchId || '',
    authorId: data.authorId || '',
    authorName: data.authorName || 'Admin',
    title: data.title || '',
    content: data.content || '',
    priority: data.priority || 'normal',
    viewCount: 0,
    isActive: true,
    isPinned: false,
    createdAt: now,
    updatedAt: now,
    ...data
  } as AnnouncementDocument;

  await setDoc(announcementRef, announcementData);
  return announcementRef.id;
};

// Get announcement by ID
export const getAnnouncement = async (announcementId: string): Promise<AnnouncementDocument | null> => {
  const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, announcementId);
  const snapshot = await getDoc(announcementRef);
  
  if (snapshot.exists()) {
    return snapshot.data() as AnnouncementDocument;
  }
  return null;
};

// Get announcements by church
export const getAnnouncementsByChurch = async (
  churchId: string, 
  activeOnly: boolean = true,
  limitCount: number = 20
): Promise<AnnouncementDocument[]> => {
  let q = query(
    collection(db, ANNOUNCEMENTS_COLLECTION),
    where('churchId', '==', churchId),
    orderBy('isPinned', 'desc'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  if (activeOnly) {
    q = query(
      collection(db, ANNOUNCEMENTS_COLLECTION),
      where('churchId', '==', churchId),
      where('isActive', '==', true),
      orderBy('isPinned', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as AnnouncementDocument);
};

// Update announcement
export const updateAnnouncement = async (
  announcementId: string, 
  data: Partial<AnnouncementDocument>
): Promise<void> => {
  const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, announcementId);
  await updateDoc(announcementRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

// Toggle announcement active status
export const toggleAnnouncementActive = async (announcementId: string): Promise<void> => {
  const announcement = await getAnnouncement(announcementId);
  if (announcement) {
    await updateDoc(doc(db, ANNOUNCEMENTS_COLLECTION, announcementId), {
      isActive: !announcement.isActive,
      updatedAt: serverTimestamp()
    });
  }
};

// Toggle announcement pinned status
export const toggleAnnouncementPinned = async (announcementId: string): Promise<void> => {
  const announcement = await getAnnouncement(announcementId);
  if (announcement) {
    await updateDoc(doc(db, ANNOUNCEMENTS_COLLECTION, announcementId), {
      isPinned: !announcement.isPinned,
      updatedAt: serverTimestamp()
    });
  }
};

// Delete announcement
export const deleteAnnouncement = async (announcementId: string): Promise<void> => {
  await deleteDoc(doc(db, ANNOUNCEMENTS_COLLECTION, announcementId));
};

// Increment view count
export const incrementAnnouncementViews = async (announcementId: string): Promise<void> => {
  await updateDoc(doc(db, ANNOUNCEMENTS_COLLECTION, announcementId), {
    viewCount: increment(1)
  });
};

// Get urgent announcements
export const getUrgentAnnouncements = async (churchId: string): Promise<AnnouncementDocument[]> => {
  const q = query(
    collection(db, ANNOUNCEMENTS_COLLECTION),
    where('churchId', '==', churchId),
    where('isActive', '==', true),
    where('priority', '==', 'urgent'),
    orderBy('createdAt', 'desc'),
    limit(5)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as AnnouncementDocument);
};
