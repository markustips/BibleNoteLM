/**
 * Event Reminder Service
 * Handles local notifications and reminders for events
 * Uses Capacitor Local Notifications plugin
 */

import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { EventDocument } from '../firebase/schema';
import {
  saveEventReminder,
  getEventReminder,
  getAllEventReminders,
  deleteEventReminder,
  updateReminderNotificationId,
  getCalendarSettings,
} from './eventLocalStorageService';

// ============================================
// NOTIFICATION SCHEDULING
// ============================================

/**
 * Schedule a reminder notification for an event
 * @param event - Event to create reminder for
 * @param minutesBefore - Minutes before event to trigger reminder (default: from settings)
 * @returns Notification ID
 */
export const scheduleEventReminder = async (
  event: EventDocument,
  minutesBefore?: number
): Promise<number> => {
  try {
    // Request permissions first
    const permission = await LocalNotifications.requestPermissions();

    if (permission.display !== 'granted') {
      throw new Error('Notification permissions not granted');
    }

    // Get default reminder time from settings if not provided
    if (!minutesBefore) {
      const settings = await getCalendarSettings();
      minutesBefore = settings.defaultReminderMinutes;
    }

    // Calculate notification time
    const eventTime = event.startDate.toDate();
    const reminderTime = new Date(eventTime.getTime() - minutesBefore * 60 * 1000);

    // Generate unique notification ID
    const notificationId = Math.floor(Math.random() * 1000000);

    // Prepare notification
    const notifications: ScheduleOptions = {
      notifications: [
        {
          id: notificationId,
          title: 'Event Reminder',
          body: `${event.title} starts in ${minutesBefore} minutes`,
          schedule: {
            at: reminderTime,
          },
          extra: {
            eventId: event.id,
            eventTitle: event.title,
          },
          actionTypeId: 'EVENT_REMINDER',
          sound: 'default',
        },
      ],
    };

    // Schedule notification
    await LocalNotifications.schedule(notifications);

    // Save reminder to local storage
    await saveEventReminder({
      id: `reminder_${event.id}`,
      eventId: event.id,
      eventTitle: event.title,
      eventStartDate: event.startDate.toDate().toISOString(),
      reminderMinutesBefore: minutesBefore,
      isEnabled: true,
      localNotificationId: notificationId,
      addedToDeviceCalendar: false,
    });

    return notificationId;
  } catch (error) {
    console.error('Failed to schedule event reminder:', error);
    throw error;
  }
};

/**
 * Schedule multiple reminders for an event (e.g., 1 day before, 1 hour before)
 * @param event - Event to create reminders for
 * @param reminderTimes - Array of minutes before event
 * @returns Array of notification IDs
 */
export const scheduleMultipleEventReminders = async (
  event: EventDocument,
  reminderTimes: number[]
): Promise<number[]> => {
  const notificationIds: number[] = [];

  for (const minutes of reminderTimes) {
    try {
      const notificationId = await scheduleEventReminder(event, minutes);
      notificationIds.push(notificationId);
    } catch (error) {
      console.error(`Failed to schedule reminder at ${minutes} minutes:`, error);
    }
  }

  return notificationIds;
};

/**
 * Cancel event reminder
 * @param eventId - Event ID
 */
export const cancelEventReminder = async (eventId: string): Promise<void> => {
  try {
    const reminder = await getEventReminder(eventId);

    if (!reminder || !reminder.localNotificationId) {
      return;
    }

    // Cancel the notification
    await LocalNotifications.cancel({
      notifications: [{ id: reminder.localNotificationId }],
    });

    // Remove from local storage
    await deleteEventReminder(eventId);
  } catch (error) {
    console.error('Failed to cancel event reminder:', error);
    throw error;
  }
};

/**
 * Reschedule event reminder with new time
 * @param eventId - Event ID
 * @param event - Updated event data
 * @param minutesBefore - New reminder time
 */
export const rescheduleEventReminder = async (
  eventId: string,
  event: EventDocument,
  minutesBefore?: number
): Promise<void> => {
  // Cancel existing reminder
  await cancelEventReminder(eventId);

  // Schedule new reminder
  await scheduleEventReminder(event, minutesBefore);
};

/**
 * Update all event reminders
 * Useful when events are updated or when syncing from server
 * @param events - Array of events to update reminders for
 */
export const updateAllEventReminders = async (events: EventDocument[]): Promise<void> => {
  const existingReminders = await getAllEventReminders();

  for (const event of events) {
    const existingReminder = existingReminders.find(r => r.eventId === event.id);

    if (existingReminder && existingReminder.isEnabled) {
      // Reschedule if event time changed
      const savedEventTime = new Date(existingReminder.eventStartDate);
      const currentEventTime = event.startDate.toDate();

      if (savedEventTime.getTime() !== currentEventTime.getTime()) {
        await rescheduleEventReminder(
          event.id,
          event,
          existingReminder.reminderMinutesBefore
        );
      }
    }
  }
};

/**
 * Clean up past event reminders
 * Removes reminders for events that have already occurred
 */
export const cleanupPastEventReminders = async (): Promise<void> => {
  try {
    const reminders = await getAllEventReminders();
    const now = new Date();

    for (const reminder of reminders) {
      const eventTime = new Date(reminder.eventStartDate);

      // If event has passed, cancel reminder
      if (eventTime < now) {
        if (reminder.localNotificationId) {
          await LocalNotifications.cancel({
            notifications: [{ id: reminder.localNotificationId }],
          }).catch(() => {});
        }

        await deleteEventReminder(reminder.eventId);
      }
    }
  } catch (error) {
    console.error('Failed to cleanup past reminders:', error);
  }
};

// ============================================
// NOTIFICATION ACTIONS & HANDLERS
// ============================================

/**
 * Setup notification action listeners
 * Handle when user taps on a notification
 */
export const setupNotificationListeners = (): void => {
  // Listen for notification taps
  LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
    const eventId = notification.notification.extra?.eventId;

    if (eventId) {
      // Navigate to event details
      // This should be integrated with your router
      console.log('Navigate to event:', eventId);
      // Example: router.push(`/events/${eventId}`);
    }
  });

  // Listen for notification received while app is in foreground
  LocalNotifications.addListener('localNotificationReceived', (notification) => {
    console.log('Notification received:', notification);
  });
};

/**
 * Remove all notification listeners
 */
export const removeNotificationListeners = async (): Promise<void> => {
  await LocalNotifications.removeAllListeners();
};

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Cancel all event reminders
 */
export const cancelAllEventReminders = async (): Promise<void> => {
  try {
    const reminders = await getAllEventReminders();

    const notificationIds = reminders
      .filter(r => r.localNotificationId)
      .map(r => ({ id: r.localNotificationId! }));

    if (notificationIds.length > 0) {
      await LocalNotifications.cancel({ notifications: notificationIds });
    }

    // Clear all reminders from storage
    for (const reminder of reminders) {
      await deleteEventReminder(reminder.eventId);
    }
  } catch (error) {
    console.error('Failed to cancel all reminders:', error);
  }
};

/**
 * Get all pending notifications
 */
export const getPendingReminders = async (): Promise<any[]> => {
  try {
    const result = await LocalNotifications.getPending();
    return result.notifications;
  } catch (error) {
    console.error('Failed to get pending reminders:', error);
    return [];
  }
};

/**
 * Check if reminder exists for event
 * @param eventId - Event ID
 */
export const hasReminder = async (eventId: string): Promise<boolean> => {
  const reminder = await getEventReminder(eventId);
  return reminder !== null && reminder.isEnabled;
};

// ============================================
// SMART REMINDERS
// ============================================

/**
 * Schedule smart reminders based on event type and timing
 * @param event - Event to create smart reminders for
 */
export const scheduleSmartReminders = async (event: EventDocument): Promise<void> => {
  const eventTime = event.startDate.toDate();
  const now = new Date();
  const hoursUntilEvent = (eventTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  const reminderTimes: number[] = [];

  // If event is more than 24 hours away, add 1 day reminder
  if (hoursUntilEvent > 24) {
    reminderTimes.push(24 * 60); // 1 day before
  }

  // If event is more than 1 hour away, add 1 hour reminder
  if (hoursUntilEvent > 1) {
    reminderTimes.push(60); // 1 hour before
  }

  // Always add 15 minute reminder if event is at least 15 minutes away
  if (hoursUntilEvent > 0.25) {
    reminderTimes.push(15); // 15 minutes before
  }

  if (reminderTimes.length > 0) {
    await scheduleMultipleEventReminders(event, reminderTimes);
  }
};

/**
 * Auto-schedule reminders for newly registered events
 * Uses user's auto-sync settings
 * @param event - Event user just registered for
 */
export const autoScheduleReminder = async (event: EventDocument): Promise<void> => {
  const settings = await getCalendarSettings();

  if (settings.autoSyncNewEvents) {
    // Use smart reminders
    await scheduleSmartReminders(event);
  } else {
    // Use default reminder time from settings
    await scheduleEventReminder(event, settings.defaultReminderMinutes);
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format reminder time for display
 * @param minutesBefore - Minutes before event
 */
export const formatReminderTime = (minutesBefore: number): string => {
  if (minutesBefore < 60) {
    return `${minutesBefore} minute${minutesBefore !== 1 ? 's' : ''} before`;
  } else if (minutesBefore < 1440) {
    const hours = Math.floor(minutesBefore / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''} before`;
  } else {
    const days = Math.floor(minutesBefore / 1440);
    return `${days} day${days !== 1 ? 's' : ''} before`;
  }
};

/**
 * Get common reminder options for UI
 */
export const getCommonReminderOptions = (): { label: string; value: number }[] => {
  return [
    { label: 'At time of event', value: 0 },
    { label: '5 minutes before', value: 5 },
    { label: '15 minutes before', value: 15 },
    { label: '30 minutes before', value: 30 },
    { label: '1 hour before', value: 60 },
    { label: '2 hours before', value: 120 },
    { label: '1 day before', value: 1440 },
    { label: '1 week before', value: 10080 },
  ];
};
