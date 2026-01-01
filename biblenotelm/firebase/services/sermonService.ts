/**
 * Firebase Sermon Service
 * Handles all sermon-related database operations
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
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config';
import { SermonDocument, SermonNoteDocument } from '../schema';

const SERMONS_COLLECTION = 'sermons';

// Create sermon
export const createSermon = async (data: Partial<SermonDocument>): Promise<string> => {
  const sermonRef = doc(collection(db, SERMONS_COLLECTION));
  const now = Timestamp.now();
  
  const sermonData: SermonDocument = {
    id: sermonRef.id,
    userId: data.userId || '',
    title: data.title || 'Untitled Sermon',
    duration: data.duration || 0,
    transcriptStatus: 'pending',
    playCount: 0,
    likeCount: 0,
    shareCount: 0,
    isPublic: false,
    isProcessing: true,
    recordedAt: now,
    createdAt: now,
    updatedAt: now,
    ...data
  } as SermonDocument;

  await setDoc(sermonRef, sermonData);
  return sermonRef.id;
};

/**
 * NOTE: Audio files are stored LOCALLY on the device, not in Firebase Storage.
 * This reduces bandwidth costs and allows offline playback.
 * Use localStorageService.saveSermonAudioLocally() for audio storage.
 * 
 * Only sermon METADATA is stored in Firebase:
 * - Title, speaker, duration
 * - Transcript and AI summaries
 * - Scripture references
 * - Play counts and engagement metrics
 */

// Mark sermon as having local audio (updates metadata only)
export const markSermonHasLocalAudio = async (
  sermonId: string, 
  localPath: string,
  duration: number
): Promise<void> => {
  await updateDoc(doc(db, SERMONS_COLLECTION, sermonId), {
    hasLocalAudio: true,
    localAudioPath: localPath,
    duration,
    isProcessing: false,
    updatedAt: serverTimestamp()
  });
};

// Upload sermon thumbnail (thumbnails can be small, store in Firebase)
export const uploadSermonThumbnail = async (
  sermonId: string, 
  userId: string, 
  imageBlob: Blob
): Promise<string> => {
  const imageRef = ref(storage, `sermons/${userId}/${sermonId}/thumbnail.jpg`);
  await uploadBytes(imageRef, imageBlob);
  const url = await getDownloadURL(imageRef);
  
  await updateDoc(doc(db, SERMONS_COLLECTION, sermonId), {
    thumbnailURL: url,
    updatedAt: serverTimestamp()
  });
  
  return url;
};

// Get sermon by ID
export const getSermon = async (sermonId: string): Promise<SermonDocument | null> => {
  const sermonRef = doc(db, SERMONS_COLLECTION, sermonId);
  const snapshot = await getDoc(sermonRef);
  
  if (snapshot.exists()) {
    return snapshot.data() as SermonDocument;
  }
  return null;
};

// Get sermons by user
export const getSermonsByUser = async (
  userId: string, 
  limitCount: number = 20
): Promise<SermonDocument[]> => {
  const q = query(
    collection(db, SERMONS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as SermonDocument);
};

// Get public sermons by church
export const getSermonsByChurch = async (
  churchId: string, 
  limitCount: number = 20
): Promise<SermonDocument[]> => {
  const q = query(
    collection(db, SERMONS_COLLECTION),
    where('churchId', '==', churchId),
    where('isPublic', '==', true),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as SermonDocument);
};

// Update sermon
export const updateSermon = async (sermonId: string, data: Partial<SermonDocument>): Promise<void> => {
  const sermonRef = doc(db, SERMONS_COLLECTION, sermonId);
  await updateDoc(sermonRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

// Update transcript
export const updateSermonTranscript = async (
  sermonId: string, 
  transcript: string,
  status: 'pending' | 'processing' | 'completed' | 'failed' = 'completed'
): Promise<void> => {
  await updateDoc(doc(db, SERMONS_COLLECTION, sermonId), {
    transcript,
    transcriptStatus: status,
    isProcessing: false,
    updatedAt: serverTimestamp()
  });
};

// Update AI summary
export const updateSermonAISummary = async (
  sermonId: string, 
  aiSummary: string,
  aiKeyPoints?: string[],
  aiScriptureReferences?: { reference: string; text: string }[],
  aiTopics?: string[]
): Promise<void> => {
  await updateDoc(doc(db, SERMONS_COLLECTION, sermonId), {
    aiSummary,
    aiKeyPoints: aiKeyPoints || null,
    aiScriptureReferences: aiScriptureReferences || null,
    aiTopics: aiTopics || null,
    updatedAt: serverTimestamp()
  });
};

// Delete sermon metadata from Firebase
// NOTE: Audio files are stored locally and should be deleted via localStorageService
export const deleteSermon = async (sermonId: string, userId: string): Promise<void> => {
  // Delete thumbnail from Firebase Storage (if exists)
  try {
    const thumbRef = ref(storage, `sermons/${userId}/${sermonId}/thumbnail.jpg`);
    await deleteObject(thumbRef);
  } catch (e) {
    console.log('Thumbnail not found or already deleted');
  }
  
  // Delete document
  await deleteDoc(doc(db, SERMONS_COLLECTION, sermonId));
};

// Toggle sermon public status
export const toggleSermonPublic = async (sermonId: string): Promise<void> => {
  const sermon = await getSermon(sermonId);
  if (sermon) {
    await updateDoc(doc(db, SERMONS_COLLECTION, sermonId), {
      isPublic: !sermon.isPublic,
      updatedAt: serverTimestamp()
    });
  }
};

// Increment play count
export const incrementPlayCount = async (sermonId: string): Promise<void> => {
  await updateDoc(doc(db, SERMONS_COLLECTION, sermonId), {
    playCount: increment(1)
  });
};

// Increment like count
export const incrementLikeCount = async (sermonId: string): Promise<void> => {
  await updateDoc(doc(db, SERMONS_COLLECTION, sermonId), {
    likeCount: increment(1)
  });
};

// Add sermon note
export const addSermonNote = async (
  sermonId: string, 
  userId: string, 
  content: string,
  timestamp?: number
): Promise<string> => {
  const noteRef = doc(collection(db, SERMONS_COLLECTION, sermonId, 'notes'));
  const now = Timestamp.now();
  
  const noteData: SermonNoteDocument = {
    id: noteRef.id,
    userId,
    content,
    timestamp,
    createdAt: now,
    updatedAt: now
  };

  await setDoc(noteRef, noteData);
  return noteRef.id;
};

// Get sermon notes by user
export const getSermonNotes = async (sermonId: string, userId: string): Promise<SermonNoteDocument[]> => {
  const q = query(
    collection(db, SERMONS_COLLECTION, sermonId, 'notes'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as SermonNoteDocument);
};

// Delete sermon note
export const deleteSermonNote = async (sermonId: string, noteId: string): Promise<void> => {
  await deleteDoc(doc(db, SERMONS_COLLECTION, sermonId, 'notes', noteId));
};
