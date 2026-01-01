/**
 * Event Integration Example
 * Complete example showing how to use all event services together
 * This demonstrates the full event registration and management flow
 */

import {
  getEvent,
  registerForEvent,
  cancelEventRegistration,
  getAttendeeWithCalendarSync,
  updateAttendeeCalendarSync,
  getEventsPendingSync,
} from '../firebase/services/eventService';

import {
  saveEventReminder,
  getCalendarSettings,
  saveCalendarSettings,
  cleanupExpiredEventData,
} from './eventLocalStorageService';

import {
  scheduleEventReminder,
  autoScheduleReminder,
  cancelEventReminder,
  setupNotificationListeners,
  cleanupPastEventReminders,
} from './eventReminderService';

import {
  syncEventToCalendars,
  removeSyncedEvent,
  updateCalendarSyncStatus,
} from './calendarSyncService';

import {
  downloadAndCacheEventImage,
  getEventImageDataUrl,
  preCacheEventImages,
  clearEventImagesCache,
} from './eventImageCacheService';

import { EventDocument } from '../firebase/schema';
import { Timestamp } from 'firebase/firestore';

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize event system on app startup
 */
export const initializeEventSystem = async (): Promise<void> => {
  console.log('Initializing event system...');

  // Setup notification listeners
  setupNotificationListeners();

  // Clean up old data
  await cleanupPastEventReminders();
  await cleanupExpiredEventData(30); // Delete data older than 30 days

  console.log('Event system initialized');
};

// ============================================
// EVENT REGISTRATION FLOW
// ============================================

/**
 * Complete event registration flow
 * 1. Register user for event in Firebase
 * 2. Cache event image locally
 * 3. Schedule reminder notification
 * 4. Sync to user's calendars
 */
export const registerUserForEvent = async (
  eventId: string,
  userId: string,
  userName: string,
  options: {
    googleAccessToken?: string;
    outlookAccessToken?: string;
    customReminderMinutes?: number;
  } = {}
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`Registering user ${userId} for event ${eventId}...`);

    // 1. Get event details from Firebase
    const event = await getEvent(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // 2. Register user for event (with calendar sync enabled)
    await registerForEvent(eventId, userId, userName, true);
    console.log('✓ Registered in Firebase');

    // 3. Cache event image locally (saves bandwidth & enables offline access)
    if (event.imageURL) {
      try {
        await downloadAndCacheEventImage(eventId, event.imageURL, true);
        console.log('✓ Cached event image locally');
      } catch (error) {
        console.warn('Failed to cache image:', error);
        // Continue even if image caching fails
      }
    }

    // 4. Schedule reminder notification
    try {
      if (options.customReminderMinutes !== undefined) {
        await scheduleEventReminder(event, options.customReminderMinutes);
      } else {
        await autoScheduleReminder(event);
      }
      console.log('✓ Scheduled reminder notification');
    } catch (error) {
      console.warn('Failed to schedule reminder:', error);
      // Continue even if reminder fails
    }

    // 5. Sync to calendars based on user settings
    const settings = await getCalendarSettings();
    if (settings.autoSyncNewEvents) {
      try {
        const syncResults = await syncEventToCalendars(event, userId, {
          googleAccessToken: options.googleAccessToken,
          outlookAccessToken: options.outlookAccessToken,
        });

        const successCount = syncResults.filter(r => r.success).length;
        console.log(`✓ Synced to ${successCount} calendar(s)`);
      } catch (error) {
        console.warn('Failed to sync calendars:', error);
        // Continue even if calendar sync fails
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Event registration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// ============================================
// EVENT CANCELLATION FLOW
// ============================================

/**
 * Complete event cancellation flow
 * 1. Cancel registration in Firebase
 * 2. Cancel reminder notification
 * 3. Remove from synced calendars
 * 4. Delete cached image
 */
export const cancelUserEventRegistration = async (
  eventId: string,
  userId: string,
  options: {
    googleAccessToken?: string;
    outlookAccessToken?: string;
  } = {}
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`Cancelling registration for event ${eventId}...`);

    // 1. Get attendee info (to get calendar sync IDs)
    const attendee = await getAttendeeWithCalendarSync(eventId, userId);

    // 2. Cancel Firebase registration
    await cancelEventRegistration(eventId, userId);
    console.log('✓ Cancelled registration in Firebase');

    // 3. Cancel reminder notification
    try {
      await cancelEventReminder(eventId);
      console.log('✓ Cancelled reminder notification');
    } catch (error) {
      console.warn('Failed to cancel reminder:', error);
    }

    // 4. Remove from synced calendars
    if (attendee) {
      try {
        await removeSyncedEvent(eventId, userId, attendee, {
          googleAccessToken: options.googleAccessToken,
          outlookAccessToken: options.outlookAccessToken,
        });
        console.log('✓ Removed from synced calendars');
      } catch (error) {
        console.warn('Failed to remove from calendars:', error);
      }
    }

    // 5. Delete cached image (optional, saves storage)
    try {
      await clearEventImagesCache([eventId]);
      console.log('✓ Deleted cached image');
    } catch (error) {
      console.warn('Failed to delete cached image:', error);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Event cancellation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// ============================================
// CALENDAR SYNC MANAGEMENT
// ============================================

/**
 * Sync event to specific calendar provider
 */
export const syncEventToProvider = async (
  eventId: string,
  userId: string,
  provider: 'google' | 'outlook' | 'apple',
  accessToken?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const event = await getEvent(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const calendarEvent = {
      title: event.title,
      description: event.description,
      location: event.location?.name,
      startDate: event.startDate.toDate(),
      endDate: event.endDate?.toDate(),
      isAllDay: event.isAllDay,
      timezone: event.timezone,
    };

    let result;

    if (provider === 'google' && accessToken) {
      const { syncToGoogleCalendar } = await import('./calendarSyncService');
      result = await syncToGoogleCalendar(calendarEvent, accessToken);
    } else if (provider === 'outlook' && accessToken) {
      const { syncToOutlookCalendar } = await import('./calendarSyncService');
      result = await syncToOutlookCalendar(calendarEvent, accessToken);
    } else if (provider === 'apple') {
      const { downloadICSFile } = await import('./calendarSyncService');
      downloadICSFile(calendarEvent, `${event.title}.ics`);
      result = { success: true, provider: 'apple' };
    } else {
      throw new Error('Invalid provider or missing access token');
    }

    // Update sync status in Firebase
    if (result.success && result.eventId) {
      await updateCalendarSyncStatus(eventId, userId, provider, result.eventId);
    }

    return {
      success: result.success,
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Bulk sync pending events to calendars
 */
export const syncPendingEventsToCalendars = async (
  userId: string,
  tokens: {
    googleAccessToken?: string;
    outlookAccessToken?: string;
  }
): Promise<void> => {
  const pendingEvents = await getEventsPendingSync(userId);
  console.log(`Found ${pendingEvents.length} events pending sync`);

  for (const event of pendingEvents) {
    try {
      await syncEventToCalendars(event, userId, tokens);
      console.log(`✓ Synced event: ${event.title}`);
    } catch (error) {
      console.error(`Failed to sync event ${event.id}:`, error);
    }
  }
};

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Prepare events for offline mode
 * Cache all images and setup reminders
 */
export const prepareEventsForOffline = async (
  events: EventDocument[],
  userId: string
): Promise<void> => {
  console.log(`Preparing ${events.length} events for offline mode...`);

  // Cache all event images
  const eventsWithImages = events
    .filter(e => e.imageURL)
    .map(e => ({ id: e.id, imageURL: e.imageURL! }));

  await preCacheEventImages(eventsWithImages, (current, total) => {
    console.log(`Cached ${current}/${total} images`);
  });

  // Setup reminders for upcoming events
  const now = new Date();
  const upcomingEvents = events.filter(e => e.startDate.toDate() > now);

  for (const event of upcomingEvents) {
    try {
      await autoScheduleReminder(event);
    } catch (error) {
      console.warn(`Failed to schedule reminder for ${event.id}:`, error);
    }
  }

  console.log('✓ Offline preparation complete');
};

/**
 * Update user's calendar preferences
 */
export const updateUserCalendarPreferences = async (preferences: {
  syncToGoogleCalendar?: boolean;
  syncToOutlook?: boolean;
  syncToAppleCalendar?: boolean;
  defaultReminderMinutes?: number;
  autoSyncNewEvents?: boolean;
}): Promise<void> => {
  await saveCalendarSettings(preferences);
  console.log('✓ Calendar preferences updated');
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get event image for display
 */
export const getEventImageForDisplay = async (
  eventId: string,
  imageUrl?: string,
  useThumbnail: boolean = true
): Promise<string | null> => {
  return await getEventImageDataUrl(eventId, imageUrl, useThumbnail);
};

/**
 * Check if user has active reminder for event
 */
export const hasActiveReminder = async (eventId: string): Promise<boolean> => {
  const { getEventReminder } = await import('./eventLocalStorageService');
  const reminder = await getEventReminder(eventId);
  return reminder?.isEnabled ?? false;
};

/**
 * Update reminder time for event
 */
export const updateEventReminderTime = async (
  eventId: string,
  minutesBefore: number
): Promise<void> => {
  const event = await getEvent(eventId);
  if (!event) throw new Error('Event not found');

  const { rescheduleEventReminder } = await import('./eventReminderService');
  await rescheduleEventReminder(eventId, event, minutesBefore);
  console.log(`✓ Updated reminder to ${minutesBefore} minutes before`);
};

// ============================================
// EXAMPLE USAGE
// ============================================

/**
 * Example: Full event registration workflow
 */
export const exampleEventRegistration = async () => {
  // Initialize system
  await initializeEventSystem();

  // User registers for event
  const result = await registerUserForEvent(
    'event123',
    'user456',
    'John Doe',
    {
      googleAccessToken: 'ya29.xxx',
      customReminderMinutes: 60, // 1 hour before
    }
  );

  if (result.success) {
    console.log('Successfully registered for event!');

    // Get image for display
    const imageDataUrl = await getEventImageForDisplay('event123', undefined, true);
    if (imageDataUrl) {
      console.log('Event image loaded:', imageDataUrl.substring(0, 50) + '...');
    }
  } else {
    console.error('Registration failed:', result.error);
  }
};

/**
 * Example: Update calendar settings
 */
export const exampleUpdateCalendarSettings = async () => {
  await updateUserCalendarPreferences({
    syncToGoogleCalendar: true,
    syncToAppleCalendar: true,
    defaultReminderMinutes: 30,
    autoSyncNewEvents: true,
  });

  console.log('Calendar settings updated');
};

/**
 * Example: Prepare for offline mode
 */
export const examplePrepareOffline = async (userId: string) => {
  // Get user's registered events
  const { getUserRegisteredEvents } = await import('../firebase/services/eventService');
  const events = await getUserRegisteredEvents(userId, 50);

  // Prepare for offline
  await prepareEventsForOffline(events, userId);

  console.log('Ready for offline mode!');
};
