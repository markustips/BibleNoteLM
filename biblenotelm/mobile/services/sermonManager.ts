/**
 * Sermon Manager Service
 * Combines local storage (audio) with Firebase (metadata)
 * 
 * Storage Strategy:
 * - Audio files: Stored LOCALLY on device only (saves bandwidth/costs)
 * - Thumbnails: Small images stored in Firebase Storage
 * - Metadata: All sermon info stored in Firebase Firestore
 */

import { Timestamp } from 'firebase/firestore';
import { 
  createSermon as createSermonMetadata,
  getSermon as getSermonMetadata,
  getSermonsByUser,
  updateSermon as updateSermonMetadata,
  deleteSermon as deleteSermonDoc,
  markSermonHasLocalAudio,
  updateSermonTranscript,
  updateSermonAISummary,
  incrementPlayCount as incrementFirebasePlayCount
} from '../firebase/services/sermonService';
import {
  saveSermonAudioLocally,
  getSermonAudioLocally,
  deleteSermonAudioLocally,
  saveSermonMetadataLocally,
  deleteSermonMetadataLocally,
  getLocalSermonMetadata,
  markSermonSynced,
  getUnsyncedSermons,
  getLocalStorageSize,
  formatBytes
} from './localStorageService';
import { SermonDocument } from '../firebase/schema';

// ============================================
// TYPES
// ============================================
export interface LocalSermon {
  id: string;
  title: string;
  speaker?: string;
  description?: string;
  duration: number;
  recordedAt: Date;
  hasLocalAudio: boolean;
  synced: boolean;
  
  // AI Content (from Firebase)
  transcript?: string;
  aiSummary?: string;
  aiKeyPoints?: string[];
}

// ============================================
// SERMON CREATION
// ============================================

/**
 * Record and save a new sermon
 * 1. Save audio locally on device
 * 2. Create metadata document in Firebase
 */
export const recordSermon = async (
  userId: string,
  audioBlob: Blob,
  title: string,
  speaker?: string,
  churchId?: string
): Promise<string> => {
  // Calculate duration (approximate from blob size, or pass actual duration)
  const duration = Math.round(audioBlob.size / 16000); // Rough estimate
  
  // 1. Create sermon metadata in Firebase first to get ID
  const sermonId = await createSermonMetadata({
    userId,
    churchId,
    title,
    speaker,
    duration,
    hasLocalAudio: false,
    transcriptStatus: 'pending',
    playCount: 0,
    likeCount: 0,
    shareCount: 0,
    isPublic: false,
    isProcessing: true
  });
  
  // 2. Save audio locally on device
  const localPath = await saveSermonAudioLocally(sermonId, audioBlob);
  
  // 3. Update Firebase with local audio info
  await markSermonHasLocalAudio(sermonId, localPath, duration);
  
  // 4. Save local metadata for offline access
  await saveSermonMetadataLocally({
    id: sermonId,
    title,
    speaker,
    duration,
    recordedAt: new Date().toISOString(),
    localPath,
    synced: true
  });
  
  return sermonId;
};

/**
 * Record sermon offline (when no internet)
 * Only saves locally, syncs metadata later
 */
export const recordSermonOffline = async (
  audioBlob: Blob,
  title: string,
  speaker?: string
): Promise<string> => {
  // Generate temporary ID
  const tempId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const duration = Math.round(audioBlob.size / 16000);
  
  // Save audio locally
  const localPath = await saveSermonAudioLocally(tempId, audioBlob);
  
  // Save metadata for later sync
  await saveSermonMetadataLocally({
    id: tempId,
    title,
    speaker,
    duration,
    recordedAt: new Date().toISOString(),
    localPath,
    synced: false // Will sync when online
  });
  
  return tempId;
};

// ============================================
// SERMON RETRIEVAL
// ============================================

/**
 * Get sermon with local audio
 * Combines Firebase metadata with local audio
 */
export const getSermon = async (sermonId: string): Promise<{
  metadata: SermonDocument | null;
  audioBlob: Blob | null;
}> => {
  // Get metadata from Firebase
  const metadata = await getSermonMetadata(sermonId);
  
  // Get audio from local storage
  const audioBlob = await getSermonAudioLocally(sermonId);
  
  return { metadata, audioBlob };
};

/**
 * Get user's sermons (metadata only)
 */
export const getUserSermons = async (userId: string, limit: number = 20): Promise<SermonDocument[]> => {
  return getSermonsByUser(userId, limit);
};

/**
 * Get sermons available offline
 */
export const getOfflineSermons = async (): Promise<LocalSermon[]> => {
  const localMetadata = await getLocalSermonMetadata();
  
  return localMetadata.map(m => ({
    id: m.id,
    title: m.title,
    speaker: m.speaker,
    duration: m.duration,
    recordedAt: new Date(m.recordedAt),
    hasLocalAudio: true,
    synced: m.synced
  }));
};

// ============================================
// SERMON PLAYBACK
// ============================================

/**
 * Play sermon audio
 * Returns audio URL for playback
 */
export const playSermon = async (sermonId: string): Promise<string | null> => {
  const audioBlob = await getSermonAudioLocally(sermonId);
  
  if (audioBlob) {
    // Increment play count in Firebase
    try {
      await incrementFirebasePlayCount(sermonId);
    } catch (error) {
      console.log('Could not update play count (offline?)');
    }
    
    // Return blob URL for playback
    return URL.createObjectURL(audioBlob);
  }
  
  return null;
};

// ============================================
// SERMON DELETION
// ============================================

/**
 * Delete sermon completely
 * Removes both local audio and Firebase metadata
 */
export const deleteSermon = async (sermonId: string, userId: string): Promise<void> => {
  // Delete local audio
  await deleteSermonAudioLocally(sermonId);
  
  // Delete local metadata
  await deleteSermonMetadataLocally(sermonId);
  
  // Delete from Firebase (only if it was synced)
  try {
    await deleteSermonDoc(sermonId, userId);
  } catch (error) {
    console.log('Could not delete from Firebase (may not exist)');
  }
};

/**
 * Delete only local audio (keep metadata in Firebase)
 * Useful for freeing up space
 */
export const deleteLocalAudioOnly = async (sermonId: string): Promise<void> => {
  await deleteSermonAudioLocally(sermonId);
  await deleteSermonMetadataLocally(sermonId);
  
  // Update Firebase to show no local audio
  try {
    await updateSermonMetadata(sermonId, {
      hasLocalAudio: false,
      localAudioPath: undefined
    });
  } catch (error) {
    console.log('Could not update Firebase');
  }
};

// ============================================
// SYNC OPERATIONS
// ============================================

/**
 * Sync unsynced sermons to Firebase
 * Call this when coming back online
 */
export const syncPendingSermons = async (userId: string, churchId?: string): Promise<number> => {
  const unsyncedSermons = await getUnsyncedSermons();
  let syncedCount = 0;
  
  for (const sermon of unsyncedSermons) {
    try {
      // Create metadata in Firebase
      const firebaseId = await createSermonMetadata({
        userId,
        churchId,
        title: sermon.title,
        speaker: sermon.speaker,
        duration: sermon.duration,
        hasLocalAudio: true,
        localAudioPath: sermon.localPath,
        transcriptStatus: 'pending',
        playCount: 0,
        likeCount: 0,
        shareCount: 0,
        isPublic: false,
        isProcessing: false
      });
      
      // If original ID was temporary, we need to rename the audio file
      if (sermon.id.startsWith('offline_')) {
        const audioBlob = await getSermonAudioLocally(sermon.id);
        if (audioBlob) {
          await deleteSermonAudioLocally(sermon.id);
          await saveSermonAudioLocally(firebaseId, audioBlob);
          
          // Update local metadata with new ID
          await deleteSermonMetadataLocally(sermon.id);
          await saveSermonMetadataLocally({
            ...sermon,
            id: firebaseId,
            synced: true
          });
        }
      } else {
        await markSermonSynced(sermon.id);
      }
      
      syncedCount++;
    } catch (error) {
      console.error(`Failed to sync sermon ${sermon.id}:`, error);
    }
  }
  
  return syncedCount;
};

// ============================================
// STORAGE MANAGEMENT
// ============================================

/**
 * Get total local storage used by sermons
 */
export const getSermonStorageUsed = async (): Promise<string> => {
  const bytes = await getLocalStorageSize();
  return formatBytes(bytes);
};

/**
 * Check if sermon audio is available locally
 */
export const isSermonAvailableOffline = async (sermonId: string): Promise<boolean> => {
  const audio = await getSermonAudioLocally(sermonId);
  return audio !== null;
};
