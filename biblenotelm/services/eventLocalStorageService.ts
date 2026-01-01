/**
 * Event Local Storage Service
 * Handles local storage for event-related data to reduce cloud storage costs
 * - Event images stored locally
 * - Event reminders stored locally
 * - Calendar sync preferences stored locally
 */

import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { LocalEventReminder, LocalEventImage, LocalCalendarSettings } from '../firebase/schema';

// ============================================
// CONSTANTS
// ============================================
const EVENT_IMAGES_DIR = 'event_images';
const EVENT_REMINDERS_KEY = 'event_reminders';
const CALENDAR_SETTINGS_KEY = 'calendar_settings';

// ============================================
// EVENT IMAGE STORAGE (LOCAL ONLY)
// ============================================

/**
 * Save event image locally to avoid cloud storage costs
 * @param eventId - Event ID
 * @param imageBlob - Image blob data
 * @param generateThumbnail - Whether to generate a compressed thumbnail
 * @returns LocalEventImage with file paths
 */
export const saveEventImageLocally = async (
  eventId: string,
  imageBlob: Blob,
  generateThumbnail: boolean = true
): Promise<LocalEventImage> => {
  try {
    // Ensure directory exists
    await ensureDirectory(EVENT_IMAGES_DIR);

    // Convert blob to base64
    const base64Data = await blobToBase64(imageBlob);

    // Save original image
    const fileName = `${eventId}_${Date.now()}.jpg`;
    const filePath = `${EVENT_IMAGES_DIR}/${fileName}`;

    await Filesystem.writeFile({
      path: filePath,
      data: base64Data,
      directory: Directory.Data,
    });

    let thumbnailPath: string | undefined;

    // Generate thumbnail if requested
    if (generateThumbnail) {
      const thumbnailBlob = await createThumbnail(imageBlob, 200, 200);
      const thumbnailBase64 = await blobToBase64(thumbnailBlob);
      thumbnailPath = `${EVENT_IMAGES_DIR}/${eventId}_thumb.jpg`;

      await Filesystem.writeFile({
        path: thumbnailPath,
        data: thumbnailBase64,
        directory: Directory.Data,
      });
    }

    const imageData: LocalEventImage = {
      id: `${eventId}_${Date.now()}`,
      eventId,
      localFilePath: filePath,
      thumbnailPath,
      downloadedAt: new Date().toISOString(),
    };

    // Save metadata
    await saveEventImageMetadata(imageData);

    return imageData;
  } catch (error) {
    console.error('Error saving event image locally:', error);
    throw error;
  }
};

/**
 * Get event image from local storage
 * @param eventId - Event ID
 * @param useThumbnail - Whether to get thumbnail or full image
 * @returns Image blob or null
 */
export const getEventImageLocally = async (
  eventId: string,
  useThumbnail: boolean = false
): Promise<Blob | null> => {
  try {
    const metadata = await getEventImageMetadata(eventId);
    if (!metadata) return null;

    const filePath = useThumbnail && metadata.thumbnailPath
      ? metadata.thumbnailPath
      : metadata.localFilePath;

    const result = await Filesystem.readFile({
      path: filePath,
      directory: Directory.Data,
    });

    return base64ToBlob(result.data as string, 'image/jpeg');
  } catch (error) {
    console.log(`Event image not found locally: ${eventId}`);
    return null;
  }
};

/**
 * Delete event image from local storage
 * @param eventId - Event ID
 */
export const deleteEventImageLocally = async (eventId: string): Promise<void> => {
  try {
    const metadata = await getEventImageMetadata(eventId);
    if (!metadata) return;

    // Delete main image
    await Filesystem.deleteFile({
      path: metadata.localFilePath,
      directory: Directory.Data,
    }).catch(() => {});

    // Delete thumbnail
    if (metadata.thumbnailPath) {
      await Filesystem.deleteFile({
        path: metadata.thumbnailPath,
        directory: Directory.Data,
      }).catch(() => {});
    }

    // Remove metadata
    await removeEventImageMetadata(eventId);
  } catch (error) {
    console.log(`Could not delete event image: ${eventId}`);
  }
};

/**
 * Save event image metadata
 */
const saveEventImageMetadata = async (imageData: LocalEventImage): Promise<void> => {
  const images = await getAllEventImageMetadata();
  const index = images.findIndex(img => img.eventId === imageData.eventId);

  if (index >= 0) {
    images[index] = imageData;
  } else {
    images.push(imageData);
  }

  await Preferences.set({
    key: 'event_images_metadata',
    value: JSON.stringify(images),
  });
};

/**
 * Get event image metadata
 */
const getEventImageMetadata = async (eventId: string): Promise<LocalEventImage | null> => {
  const images = await getAllEventImageMetadata();
  return images.find(img => img.eventId === eventId) || null;
};

/**
 * Get all event image metadata
 */
const getAllEventImageMetadata = async (): Promise<LocalEventImage[]> => {
  try {
    const result = await Preferences.get({ key: 'event_images_metadata' });
    return result.value ? JSON.parse(result.value) : [];
  } catch (error) {
    return [];
  }
};

/**
 * Remove event image metadata
 */
const removeEventImageMetadata = async (eventId: string): Promise<void> => {
  const images = await getAllEventImageMetadata();
  const filtered = images.filter(img => img.eventId !== eventId);

  await Preferences.set({
    key: 'event_images_metadata',
    value: JSON.stringify(filtered),
  });
};

// ============================================
// EVENT REMINDERS (LOCAL ONLY)
// ============================================

/**
 * Save or update event reminder
 * @param reminder - Event reminder data
 */
export const saveEventReminder = async (
  reminder: Omit<LocalEventReminder, 'createdAt'>
): Promise<LocalEventReminder> => {
  const reminders = await getAllEventReminders();
  const index = reminders.findIndex(r => r.eventId === reminder.eventId);

  const newReminder: LocalEventReminder = {
    ...reminder,
    createdAt: new Date().toISOString(),
  };

  if (index >= 0) {
    reminders[index] = newReminder;
  } else {
    reminders.push(newReminder);
  }

  await Preferences.set({
    key: EVENT_REMINDERS_KEY,
    value: JSON.stringify(reminders),
  });

  return newReminder;
};

/**
 * Get event reminder
 * @param eventId - Event ID
 */
export const getEventReminder = async (eventId: string): Promise<LocalEventReminder | null> => {
  const reminders = await getAllEventReminders();
  return reminders.find(r => r.eventId === eventId) || null;
};

/**
 * Get all event reminders
 */
export const getAllEventReminders = async (): Promise<LocalEventReminder[]> => {
  try {
    const result = await Preferences.get({ key: EVENT_REMINDERS_KEY });
    return result.value ? JSON.parse(result.value) : [];
  } catch (error) {
    return [];
  }
};

/**
 * Get active (enabled) event reminders
 */
export const getActiveEventReminders = async (): Promise<LocalEventReminder[]> => {
  const reminders = await getAllEventReminders();
  return reminders.filter(r => r.isEnabled);
};

/**
 * Delete event reminder
 * @param eventId - Event ID
 */
export const deleteEventReminder = async (eventId: string): Promise<void> => {
  const reminders = await getAllEventReminders();
  const filtered = reminders.filter(r => r.eventId !== eventId);

  await Preferences.set({
    key: EVENT_REMINDERS_KEY,
    value: JSON.stringify(filtered),
  });
};

/**
 * Toggle event reminder
 * @param eventId - Event ID
 * @param enabled - Whether to enable or disable
 */
export const toggleEventReminder = async (eventId: string, enabled: boolean): Promise<void> => {
  const reminders = await getAllEventReminders();
  const reminder = reminders.find(r => r.eventId === eventId);

  if (reminder) {
    reminder.isEnabled = enabled;

    await Preferences.set({
      key: EVENT_REMINDERS_KEY,
      value: JSON.stringify(reminders),
    });
  }
};

/**
 * Update reminder notification ID
 * @param eventId - Event ID
 * @param notificationId - Local notification ID
 */
export const updateReminderNotificationId = async (
  eventId: string,
  notificationId: number
): Promise<void> => {
  const reminders = await getAllEventReminders();
  const reminder = reminders.find(r => r.eventId === eventId);

  if (reminder) {
    reminder.localNotificationId = notificationId;

    await Preferences.set({
      key: EVENT_REMINDERS_KEY,
      value: JSON.stringify(reminders),
    });
  }
};

/**
 * Mark event as added to device calendar
 * @param eventId - Event ID
 * @param calendarEventId - Native calendar event ID
 */
export const markEventAddedToCalendar = async (
  eventId: string,
  calendarEventId: string
): Promise<void> => {
  const reminders = await getAllEventReminders();
  const reminder = reminders.find(r => r.eventId === eventId);

  if (reminder) {
    reminder.addedToDeviceCalendar = true;
    reminder.deviceCalendarEventId = calendarEventId;

    await Preferences.set({
      key: EVENT_REMINDERS_KEY,
      value: JSON.stringify(reminders),
    });
  }
};

// ============================================
// CALENDAR SETTINGS (LOCAL ONLY)
// ============================================

/**
 * Get calendar settings
 */
export const getCalendarSettings = async (): Promise<LocalCalendarSettings> => {
  try {
    const result = await Preferences.get({ key: CALENDAR_SETTINGS_KEY });

    if (result.value) {
      return JSON.parse(result.value);
    }

    // Return default settings
    return {
      syncToGoogleCalendar: false,
      syncToOutlook: false,
      syncToAppleCalendar: false,
      defaultReminderMinutes: 30,
      autoSyncNewEvents: false,
    };
  } catch (error) {
    return {
      syncToGoogleCalendar: false,
      syncToOutlook: false,
      syncToAppleCalendar: false,
      defaultReminderMinutes: 30,
      autoSyncNewEvents: false,
    };
  }
};

/**
 * Save calendar settings
 * @param settings - Calendar settings
 */
export const saveCalendarSettings = async (
  settings: Partial<LocalCalendarSettings>
): Promise<void> => {
  const currentSettings = await getCalendarSettings();
  const updatedSettings = { ...currentSettings, ...settings };

  await Preferences.set({
    key: CALENDAR_SETTINGS_KEY,
    value: JSON.stringify(updatedSettings),
  });
};

/**
 * Reset calendar settings to defaults
 */
export const resetCalendarSettings = async (): Promise<void> => {
  await Preferences.remove({ key: CALENDAR_SETTINGS_KEY });
};

// ============================================
// CLEANUP & MAINTENANCE
// ============================================

/**
 * Clean up expired event data
 * Removes reminders and images for events that have passed
 * @param daysOld - Delete data for events older than this many days (default: 30)
 */
export const cleanupExpiredEventData = async (daysOld: number = 30): Promise<void> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  // Clean up reminders
  const reminders = await getAllEventReminders();
  const validReminders = reminders.filter(r => {
    const eventDate = new Date(r.eventStartDate);
    return eventDate >= cutoffDate;
  });

  await Preferences.set({
    key: EVENT_REMINDERS_KEY,
    value: JSON.stringify(validReminders),
  });

  // Clean up images for expired events
  const images = await getAllEventImageMetadata();
  for (const img of images) {
    const reminder = validReminders.find(r => r.eventId === img.eventId);
    if (!reminder) {
      await deleteEventImageLocally(img.eventId);
    }
  }
};

/**
 * Get total size of locally stored event images
 * @returns Size in bytes
 */
export const getEventImagesStorageSize = async (): Promise<number> => {
  try {
    const result = await Filesystem.readdir({
      path: EVENT_IMAGES_DIR,
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

/**
 * Clear all event data (images, reminders, settings)
 */
export const clearAllEventData = async (): Promise<void> => {
  // Clear images
  try {
    await Filesystem.rmdir({
      path: EVENT_IMAGES_DIR,
      directory: Directory.Data,
      recursive: true,
    });
  } catch (error) {
    console.log('No event images to clear');
  }

  // Clear reminders
  await Preferences.remove({ key: EVENT_REMINDERS_KEY });

  // Clear settings
  await Preferences.remove({ key: CALENDAR_SETTINGS_KEY });

  // Clear metadata
  await Preferences.remove({ key: 'event_images_metadata' });
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
 * Create thumbnail from image blob
 * @param blob - Original image blob
 * @param maxWidth - Maximum width
 * @param maxHeight - Maximum height
 * @returns Thumbnail blob
 */
const createThumbnail = async (
  blob: Blob,
  maxWidth: number,
  maxHeight: number
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

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (thumbnailBlob) => {
          if (thumbnailBlob) {
            resolve(thumbnailBlob);
          } else {
            reject(new Error('Could not create thumbnail'));
          }
        },
        'image/jpeg',
        0.7 // Quality
      );
    };

    img.onerror = () => reject(new Error('Could not load image'));
    img.src = URL.createObjectURL(blob);
  });
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
