/**
 * Event Image Cache Service
 * Manages downloading, caching, and serving event images from local storage
 * Reduces cloud bandwidth and improves offline functionality
 */

import {
  saveEventImageLocally,
  getEventImageLocally,
  deleteEventImageLocally,
  getEventImagesStorageSize,
  formatBytes,
} from './eventLocalStorageService';

// ============================================
// IMAGE DOWNLOAD & CACHING
// ============================================

/**
 * Download and cache event image from URL
 * @param eventId - Event ID
 * @param imageUrl - Remote image URL
 * @param generateThumbnail - Whether to generate thumbnail
 * @returns Local file path
 */
export const downloadAndCacheEventImage = async (
  eventId: string,
  imageUrl: string,
  generateThumbnail: boolean = true
): Promise<string> => {
  try {
    // Check if image is already cached
    const cachedImage = await getEventImageLocally(eventId);
    if (cachedImage) {
      console.log('Image already cached for event:', eventId);
      return 'cached';
    }

    // Download image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const blob = await response.blob();

    // Save locally
    const localImage = await saveEventImageLocally(eventId, blob, generateThumbnail);

    return localImage.localFilePath;
  } catch (error) {
    console.error('Failed to download and cache event image:', error);
    throw error;
  }
};

/**
 * Get event image (from cache or download if not cached)
 * @param eventId - Event ID
 * @param imageUrl - Remote image URL (used if not cached)
 * @param useThumbnail - Whether to use thumbnail version
 * @returns Image blob or null
 */
export const getEventImage = async (
  eventId: string,
  imageUrl?: string,
  useThumbnail: boolean = false
): Promise<Blob | null> => {
  try {
    // Try to get from cache first
    let image = await getEventImageLocally(eventId, useThumbnail);

    // If not cached and URL provided, download and cache
    if (!image && imageUrl) {
      await downloadAndCacheEventImage(eventId, imageUrl);
      image = await getEventImageLocally(eventId, useThumbnail);
    }

    return image;
  } catch (error) {
    console.error('Failed to get event image:', error);
    return null;
  }
};

/**
 * Get event image as data URL for display
 * @param eventId - Event ID
 * @param imageUrl - Remote image URL (fallback)
 * @param useThumbnail - Whether to use thumbnail
 * @returns Data URL string or null
 */
export const getEventImageDataUrl = async (
  eventId: string,
  imageUrl?: string,
  useThumbnail: boolean = false
): Promise<string | null> => {
  try {
    const blob = await getEventImage(eventId, imageUrl, useThumbnail);
    if (!blob) return null;

    return await blobToDataUrl(blob);
  } catch (error) {
    console.error('Failed to get event image data URL:', error);
    return null;
  }
};

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Pre-cache images for multiple events
 * Useful for offline mode preparation
 * @param events - Array of events with image URLs
 * @param onProgress - Optional progress callback
 */
export const preCacheEventImages = async (
  events: Array<{ id: string; imageURL?: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  const total = events.filter(e => e.imageURL).length;
  let current = 0;

  for (const event of events) {
    if (event.imageURL) {
      try {
        await downloadAndCacheEventImage(event.id, event.imageURL);
        current++;
        onProgress?.(current, total);
      } catch (error) {
        console.error(`Failed to cache image for event ${event.id}:`, error);
      }
    }
  }
};

/**
 * Clear cache for specific events
 * @param eventIds - Array of event IDs to clear
 */
export const clearEventImagesCache = async (eventIds: string[]): Promise<void> => {
  for (const eventId of eventIds) {
    try {
      await deleteEventImageLocally(eventId);
    } catch (error) {
      console.error(`Failed to clear cache for event ${eventId}:`, error);
    }
  }
};

/**
 * Clear old event images (events that have passed)
 * @param eventIds - Array of current/upcoming event IDs to keep
 */
export const clearOldEventImages = async (currentEventIds: string[]): Promise<void> => {
  // This would require reading all cached image metadata
  // and removing ones not in the currentEventIds list
  // Implementation depends on how you track cached images
  console.log('Clearing old event images...');
};

// ============================================
// CACHE MANAGEMENT
// ============================================

/**
 * Get cache statistics
 * @returns Cache stats object
 */
export const getCacheStats = async (): Promise<{
  totalSize: number;
  totalSizeFormatted: string;
  imageCount: number;
}> => {
  try {
    const totalSize = await getEventImagesStorageSize();

    return {
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      imageCount: 0, // Would need to implement counting cached images
    };
  } catch (error) {
    return {
      totalSize: 0,
      totalSizeFormatted: '0 Bytes',
      imageCount: 0,
    };
  }
};

/**
 * Check if cache is getting full
 * @param maxSizeBytes - Maximum allowed cache size (default: 100MB)
 * @returns True if cache is over threshold
 */
export const isCacheFull = async (maxSizeBytes: number = 100 * 1024 * 1024): Promise<boolean> => {
  const stats = await getCacheStats();
  return stats.totalSize > maxSizeBytes;
};

/**
 * Manage cache size - delete oldest images if cache is full
 * @param maxSizeBytes - Maximum cache size
 */
export const manageCacheSize = async (maxSizeBytes: number = 100 * 1024 * 1024): Promise<void> => {
  const isFull = await isCacheFull(maxSizeBytes);

  if (isFull) {
    console.log('Cache is full, cleaning up old images...');
    // Implementation would involve:
    // 1. Get all cached images with metadata (including download date)
    // 2. Sort by download date (oldest first)
    // 3. Delete oldest images until under threshold
  }
};

// ============================================
// IMAGE OPTIMIZATION
// ============================================

/**
 * Compress image before caching
 * @param blob - Original image blob
 * @param quality - Compression quality (0-1)
 * @param maxWidth - Maximum width
 * @param maxHeight - Maximum height
 * @returns Compressed image blob
 */
export const compressImage = async (
  blob: Blob,
  quality: number = 0.8,
  maxWidth: number = 1200,
  maxHeight: number = 1200
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (compressedBlob) => {
          if (compressedBlob) {
            resolve(compressedBlob);
          } else {
            reject(new Error('Could not compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Could not load image'));
    img.src = URL.createObjectURL(blob);
  });
};

/**
 * Download, compress, and cache event image
 * @param eventId - Event ID
 * @param imageUrl - Remote image URL
 * @param compressQuality - Compression quality (0-1)
 */
export const downloadCompressAndCacheImage = async (
  eventId: string,
  imageUrl: string,
  compressQuality: number = 0.8
): Promise<void> => {
  try {
    // Download original
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const originalBlob = await response.blob();

    // Compress
    const compressedBlob = await compressImage(originalBlob, compressQuality);

    // Save locally
    await saveEventImageLocally(eventId, compressedBlob, true);

    console.log(
      `Image compressed and cached. Original: ${formatBytes(originalBlob.size)}, Compressed: ${formatBytes(compressedBlob.size)}`
    );
  } catch (error) {
    console.error('Failed to download, compress, and cache image:', error);
    throw error;
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert blob to data URL
 */
const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Check if image URL is already cached
 * @param eventId - Event ID
 */
export const isImageCached = async (eventId: string): Promise<boolean> => {
  const image = await getEventImageLocally(eventId);
  return image !== null;
};

/**
 * Get image size from cache
 * @param eventId - Event ID
 */
export const getCachedImageSize = async (eventId: string): Promise<number> => {
  try {
    const blob = await getEventImageLocally(eventId);
    return blob ? blob.size : 0;
  } catch (error) {
    return 0;
  }
};

// ============================================
// OFFLINE MODE HELPERS
// ============================================

/**
 * Prepare for offline mode by caching all event images
 * @param events - Events to cache images for
 */
export const prepareOfflineMode = async (
  events: Array<{ id: string; imageURL?: string }>
): Promise<void> => {
  console.log(`Preparing offline mode for ${events.length} events...`);

  await preCacheEventImages(events, (current, total) => {
    console.log(`Cached ${current}/${total} images`);
  });

  console.log('Offline mode preparation complete');
};

/**
 * Check if device is ready for offline mode
 * @param events - Events that should be available offline
 * @returns True if all event images are cached
 */
export const isReadyForOffline = async (
  events: Array<{ id: string; imageURL?: string }>
): Promise<boolean> => {
  const eventsWithImages = events.filter(e => e.imageURL);

  for (const event of eventsWithImages) {
    const isCached = await isImageCached(event.id);
    if (!isCached) {
      return false;
    }
  }

  return true;
};
