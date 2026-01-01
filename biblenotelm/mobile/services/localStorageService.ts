/**
 * Local Storage Service
 * Handles local file storage on device for audio files, Bible data, and offline content
 * Uses Capacitor Filesystem for file storage and Preferences for key-value data
 */

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

// ============================================
// CONSTANTS
// ============================================
const SERMONS_DIR = 'sermons';
const BIBLE_DIR = 'bible';
const CACHE_DIR = 'cache';

// Keys for local storage of notes, highlights, bookmarks
const BIBLE_NOTES_KEY = 'bible_notes';
const BIBLE_HIGHLIGHTS_KEY = 'bible_highlights';
const BIBLE_BOOKMARKS_KEY = 'bible_bookmarks';

// ============================================
// SERMON AUDIO STORAGE
// ============================================

/**
 * Save sermon audio locally
 * @param sermonId - Unique sermon identifier
 * @param audioBlob - Audio blob data
 * @returns Local file path
 */
export const saveSermonAudioLocally = async (
  sermonId: string, 
  audioBlob: Blob
): Promise<string> => {
  try {
    // Convert blob to base64
    const base64Data = await blobToBase64(audioBlob);
    
    // Create directory if it doesn't exist
    await ensureDirectory(SERMONS_DIR);
    
    const fileName = `${sermonId}.webm`;
    const filePath = `${SERMONS_DIR}/${fileName}`;
    
    await Filesystem.writeFile({
      path: filePath,
      data: base64Data,
      directory: Directory.Data,
    });
    
    return filePath;
  } catch (error) {
    console.error('Error saving sermon audio locally:', error);
    throw error;
  }
};

/**
 * Get sermon audio from local storage
 * @param sermonId - Unique sermon identifier
 * @returns Audio blob or null if not found
 */
export const getSermonAudioLocally = async (sermonId: string): Promise<Blob | null> => {
  try {
    const filePath = `${SERMONS_DIR}/${sermonId}.webm`;
    
    const result = await Filesystem.readFile({
      path: filePath,
      directory: Directory.Data,
    });
    
    // Convert base64 back to blob
    return base64ToBlob(result.data as string, 'audio/webm');
  } catch (error) {
    console.log(`Sermon audio not found locally: ${sermonId}`);
    return null;
  }
};

/**
 * Delete sermon audio from local storage
 * @param sermonId - Unique sermon identifier
 */
export const deleteSermonAudioLocally = async (sermonId: string): Promise<void> => {
  try {
    const filePath = `${SERMONS_DIR}/${sermonId}.webm`;
    
    await Filesystem.deleteFile({
      path: filePath,
      directory: Directory.Data,
    });
  } catch (error) {
    console.log(`Could not delete sermon audio: ${sermonId}`);
  }
};

/**
 * Get all locally stored sermon IDs
 * @returns Array of sermon IDs stored locally
 */
export const getLocalSermonIds = async (): Promise<string[]> => {
  try {
    const result = await Filesystem.readdir({
      path: SERMONS_DIR,
      directory: Directory.Data,
    });
    
    return result.files
      .filter(file => file.name.endsWith('.webm'))
      .map(file => file.name.replace('.webm', ''));
  } catch (error) {
    return [];
  }
};

/**
 * Get total size of locally stored sermons
 * @returns Size in bytes
 */
export const getLocalStorageSize = async (): Promise<number> => {
  try {
    const result = await Filesystem.readdir({
      path: SERMONS_DIR,
      directory: Directory.Data,
    });
    
    let totalSize = 0;
    for (const file of result.files) {
      if (file.size) {
        totalSize += file.size;
      }
    }
    
    return totalSize;
  } catch (error) {
    return 0;
  }
};

// ============================================
// BIBLE VERSION STORAGE
// ============================================

/**
 * Save Bible version data locally
 * @param version - Bible version code (e.g., "KJV", "NIV")
 * @param data - Bible data object
 */
export const saveBibleVersionLocally = async (
  version: string, 
  data: object
): Promise<void> => {
  try {
    await ensureDirectory(BIBLE_DIR);
    
    const filePath = `${BIBLE_DIR}/${version}.json`;
    
    await Filesystem.writeFile({
      path: filePath,
      data: JSON.stringify(data),
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    
    // Track downloaded versions
    const versions = await getDownloadedBibleVersions();
    if (!versions.includes(version)) {
      versions.push(version);
      await Preferences.set({
        key: 'downloaded_bible_versions',
        value: JSON.stringify(versions),
      });
    }
  } catch (error) {
    console.error('Error saving Bible version locally:', error);
    throw error;
  }
};

/**
 * Get Bible version data from local storage
 * @param version - Bible version code
 * @returns Bible data object or null
 */
export const getBibleVersionLocally = async (version: string): Promise<object | null> => {
  try {
    const filePath = `${BIBLE_DIR}/${version}.json`;
    
    const result = await Filesystem.readFile({
      path: filePath,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    
    return JSON.parse(result.data as string);
  } catch (error) {
    console.log(`Bible version not found locally: ${version}`);
    return null;
  }
};

/**
 * Delete Bible version from local storage
 * @param version - Bible version code
 */
export const deleteBibleVersionLocally = async (version: string): Promise<void> => {
  try {
    const filePath = `${BIBLE_DIR}/${version}.json`;
    
    await Filesystem.deleteFile({
      path: filePath,
      directory: Directory.Data,
    });
    
    // Update downloaded versions list
    const versions = await getDownloadedBibleVersions();
    const filtered = versions.filter(v => v !== version);
    await Preferences.set({
      key: 'downloaded_bible_versions',
      value: JSON.stringify(filtered),
    });
  } catch (error) {
    console.log(`Could not delete Bible version: ${version}`);
  }
};

/**
 * Get list of downloaded Bible versions
 * @returns Array of version codes
 */
export const getDownloadedBibleVersions = async (): Promise<string[]> => {
  try {
    const result = await Preferences.get({ key: 'downloaded_bible_versions' });
    return result.value ? JSON.parse(result.value) : [];
  } catch (error) {
    return [];
  }
};

// ============================================
// KEY-VALUE PREFERENCES STORAGE
// ============================================

/**
 * Save a preference value
 */
export const setPreference = async (key: string, value: string): Promise<void> => {
  await Preferences.set({ key, value });
};

/**
 * Get a preference value
 */
export const getPreference = async (key: string): Promise<string | null> => {
  const result = await Preferences.get({ key });
  return result.value;
};

/**
 * Remove a preference
 */
export const removePreference = async (key: string): Promise<void> => {
  await Preferences.remove({ key });
};

/**
 * Clear all preferences
 */
export const clearPreferences = async (): Promise<void> => {
  await Preferences.clear();
};

// ============================================
// OFFLINE SERMON METADATA CACHE
// ============================================

interface SermonMetadata {
  id: string;
  title: string;
  speaker?: string;
  duration: number;
  recordedAt: string;
  localPath: string;
  synced: boolean;
}

/**
 * Save sermon metadata for offline access
 */
export const saveSermonMetadataLocally = async (metadata: SermonMetadata): Promise<void> => {
  const sermons = await getLocalSermonMetadata();
  const index = sermons.findIndex(s => s.id === metadata.id);
  
  if (index >= 0) {
    sermons[index] = metadata;
  } else {
    sermons.push(metadata);
  }
  
  await Preferences.set({
    key: 'local_sermon_metadata',
    value: JSON.stringify(sermons),
  });
};

/**
 * Get all local sermon metadata
 */
export const getLocalSermonMetadata = async (): Promise<SermonMetadata[]> => {
  try {
    const result = await Preferences.get({ key: 'local_sermon_metadata' });
    return result.value ? JSON.parse(result.value) : [];
  } catch (error) {
    return [];
  }
};

/**
 * Delete sermon metadata
 */
export const deleteSermonMetadataLocally = async (sermonId: string): Promise<void> => {
  const sermons = await getLocalSermonMetadata();
  const filtered = sermons.filter(s => s.id !== sermonId);
  
  await Preferences.set({
    key: 'local_sermon_metadata',
    value: JSON.stringify(filtered),
  });
};

/**
 * Mark sermon as synced with Firebase
 */
export const markSermonSynced = async (sermonId: string): Promise<void> => {
  const sermons = await getLocalSermonMetadata();
  const sermon = sermons.find(s => s.id === sermonId);
  
  if (sermon) {
    sermon.synced = true;
    await Preferences.set({
      key: 'local_sermon_metadata',
      value: JSON.stringify(sermons),
    });
  }
};

/**
 * Get unsynced sermons (for background upload)
 */
export const getUnsyncedSermons = async (): Promise<SermonMetadata[]> => {
  const sermons = await getLocalSermonMetadata();
  return sermons.filter(s => !s.synced);
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Ensure directory exists
 */
const ensureDirectory = async (path: string): Promise<void> => {
  try {
    await Filesystem.mkdir({
      path,
      directory: Directory.Data,
      recursive: true,
    });
  } catch (error) {
    // Directory may already exist
  }
};

/**
 * Convert Blob to base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix if present
      const base64Data = base64.split(',')[1] || base64;
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Convert base64 string to Blob
 */
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteArrays: Uint8Array[] = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  
  return new Blob(byteArrays, { type: mimeType });
};

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Clear all local sermon data
 */
export const clearAllLocalSermons = async (): Promise<void> => {
  try {
    await Filesystem.rmdir({
      path: SERMONS_DIR,
      directory: Directory.Data,
      recursive: true,
    });
    
    await Preferences.remove({ key: 'local_sermon_metadata' });
  } catch (error) {
    console.error('Error clearing local sermons:', error);
  }
};

/**
 * Clear all cached data (not sermons or Bible)
 */
export const clearCache = async (): Promise<void> => {
  try {
    await Filesystem.rmdir({
      path: CACHE_DIR,
      directory: Directory.Data,
      recursive: true,
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// ============================================
// BIBLE NOTES (LOCAL ONLY)
// ============================================

interface LocalBibleNote {
  id: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  version: string;
  note: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Save or update a Bible note locally
 */
export const saveBibleNote = async (note: LocalBibleNote): Promise<void> => {
  const notes = await getAllBibleNotes();
  const index = notes.findIndex(n => n.id === note.id);
  
  if (index >= 0) {
    notes[index] = { ...note, updatedAt: new Date().toISOString() };
  } else {
    notes.push({
      ...note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  await Preferences.set({
    key: BIBLE_NOTES_KEY,
    value: JSON.stringify(notes),
  });
};

/**
 * Get all Bible notes
 */
export const getAllBibleNotes = async (): Promise<LocalBibleNote[]> => {
  try {
    const result = await Preferences.get({ key: BIBLE_NOTES_KEY });
    return result.value ? JSON.parse(result.value) : [];
  } catch (error) {
    return [];
  }
};

/**
 * Get notes for a specific verse or chapter
 */
export const getBibleNotes = async (
  book: string,
  chapter: number,
  verse?: number
): Promise<LocalBibleNote[]> => {
  const notes = await getAllBibleNotes();
  return notes.filter(n => 
    n.book === book && 
    n.chapter === chapter && 
    (verse === undefined || (n.verseStart <= verse && (n.verseEnd ?? n.verseStart) >= verse))
  );
};

/**
 * Delete a Bible note
 */
export const deleteBibleNote = async (noteId: string): Promise<void> => {
  const notes = await getAllBibleNotes();
  const filtered = notes.filter(n => n.id !== noteId);
  
  await Preferences.set({
    key: BIBLE_NOTES_KEY,
    value: JSON.stringify(filtered),
  });
};

/**
 * Search notes by text or tags
 */
export const searchBibleNotes = async (query: string): Promise<LocalBibleNote[]> => {
  const notes = await getAllBibleNotes();
  const lowerQuery = query.toLowerCase();
  
  return notes.filter(n => 
    n.note.toLowerCase().includes(lowerQuery) ||
    n.tags?.some(t => t.toLowerCase().includes(lowerQuery))
  );
};

// ============================================
// BIBLE HIGHLIGHTS (LOCAL ONLY)
// ============================================

interface LocalHighlight {
  id: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  version: string;
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'orange';
  createdAt: string;
}

/**
 * Save a highlight
 */
export const saveHighlight = async (highlight: Omit<LocalHighlight, 'createdAt'>): Promise<void> => {
  const highlights = await getAllHighlights();
  
  // Remove existing highlight for same verse range (replace)
  const filtered = highlights.filter(h => 
    !(h.book === highlight.book && 
      h.chapter === highlight.chapter && 
      h.verseStart === highlight.verseStart &&
      h.verseEnd === highlight.verseEnd)
  );
  
  filtered.push({
    ...highlight,
    createdAt: new Date().toISOString(),
  });
  
  await Preferences.set({
    key: BIBLE_HIGHLIGHTS_KEY,
    value: JSON.stringify(filtered),
  });
};

/**
 * Get all highlights
 */
export const getAllHighlights = async (): Promise<LocalHighlight[]> => {
  try {
    const result = await Preferences.get({ key: BIBLE_HIGHLIGHTS_KEY });
    return result.value ? JSON.parse(result.value) : [];
  } catch (error) {
    return [];
  }
};

/**
 * Get highlights for a specific chapter
 */
export const getChapterHighlights = async (
  book: string,
  chapter: number
): Promise<LocalHighlight[]> => {
  const highlights = await getAllHighlights();
  return highlights.filter(h => h.book === book && h.chapter === chapter);
};

/**
 * Remove a highlight
 */
export const removeHighlight = async (highlightId: string): Promise<void> => {
  const highlights = await getAllHighlights();
  const filtered = highlights.filter(h => h.id !== highlightId);
  
  await Preferences.set({
    key: BIBLE_HIGHLIGHTS_KEY,
    value: JSON.stringify(filtered),
  });
};

/**
 * Get highlights by color
 */
export const getHighlightsByColor = async (
  color: LocalHighlight['color']
): Promise<LocalHighlight[]> => {
  const highlights = await getAllHighlights();
  return highlights.filter(h => h.color === color);
};

// ============================================
// BIBLE BOOKMARKS (LOCAL ONLY)
// ============================================

interface LocalBookmark {
  id: string;
  book: string;
  chapter: number;
  verse?: number;
  version: string;
  label?: string;
  createdAt: string;
}

/**
 * Save a bookmark
 */
export const saveBookmark = async (bookmark: Omit<LocalBookmark, 'createdAt'>): Promise<void> => {
  const bookmarks = await getAllBookmarks();
  
  // Check if bookmark already exists for this location
  const exists = bookmarks.some(b => 
    b.book === bookmark.book && 
    b.chapter === bookmark.chapter && 
    b.verse === bookmark.verse
  );
  
  if (!exists) {
    bookmarks.push({
      ...bookmark,
      createdAt: new Date().toISOString(),
    });
    
    await Preferences.set({
      key: BIBLE_BOOKMARKS_KEY,
      value: JSON.stringify(bookmarks),
    });
  }
};

/**
 * Get all bookmarks
 */
export const getAllBookmarks = async (): Promise<LocalBookmark[]> => {
  try {
    const result = await Preferences.get({ key: BIBLE_BOOKMARKS_KEY });
    return result.value ? JSON.parse(result.value) : [];
  } catch (error) {
    return [];
  }
};

/**
 * Check if a location is bookmarked
 */
export const isBookmarked = async (
  book: string,
  chapter: number,
  verse?: number
): Promise<boolean> => {
  const bookmarks = await getAllBookmarks();
  return bookmarks.some(b => 
    b.book === book && 
    b.chapter === chapter && 
    b.verse === verse
  );
};

/**
 * Remove a bookmark
 */
export const removeBookmark = async (bookmarkId: string): Promise<void> => {
  const bookmarks = await getAllBookmarks();
  const filtered = bookmarks.filter(b => b.id !== bookmarkId);
  
  await Preferences.set({
    key: BIBLE_BOOKMARKS_KEY,
    value: JSON.stringify(filtered),
  });
};

/**
 * Update bookmark label
 */
export const updateBookmarkLabel = async (
  bookmarkId: string,
  label: string
): Promise<void> => {
  const bookmarks = await getAllBookmarks();
  const bookmark = bookmarks.find(b => b.id === bookmarkId);
  
  if (bookmark) {
    bookmark.label = label;
    await Preferences.set({
      key: BIBLE_BOOKMARKS_KEY,
      value: JSON.stringify(bookmarks),
    });
  }
};

/**
 * Clear all Bible study data (notes, highlights, bookmarks)
 */
export const clearAllBibleStudyData = async (): Promise<void> => {
  await Preferences.remove({ key: BIBLE_NOTES_KEY });
  await Preferences.remove({ key: BIBLE_HIGHLIGHTS_KEY });
  await Preferences.remove({ key: BIBLE_BOOKMARKS_KEY });
};

/**
 * Export all Bible study data (for backup)
 */
export const exportBibleStudyData = async (): Promise<{
  notes: LocalBibleNote[];
  highlights: LocalHighlight[];
  bookmarks: LocalBookmark[];
}> => {
  return {
    notes: await getAllBibleNotes(),
    highlights: await getAllHighlights(),
    bookmarks: await getAllBookmarks(),
  };
};

/**
 * Import Bible study data (from backup)
 */
export const importBibleStudyData = async (data: {
  notes?: LocalBibleNote[];
  highlights?: LocalHighlight[];
  bookmarks?: LocalBookmark[];
}): Promise<void> => {
  if (data.notes) {
    await Preferences.set({
      key: BIBLE_NOTES_KEY,
      value: JSON.stringify(data.notes),
    });
  }
  if (data.highlights) {
    await Preferences.set({
      key: BIBLE_HIGHLIGHTS_KEY,
      value: JSON.stringify(data.highlights),
    });
  }
  if (data.bookmarks) {
    await Preferences.set({
      key: BIBLE_BOOKMARKS_KEY,
      value: JSON.stringify(data.bookmarks),
    });
  }
};
