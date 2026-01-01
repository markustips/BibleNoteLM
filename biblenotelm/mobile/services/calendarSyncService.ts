/**
 * Calendar Sync Service
 * Handles syncing events to external calendars (Google, Outlook, Apple)
 * and managing calendar event IDs
 */

import { Timestamp } from 'firebase/firestore';
import { EventDocument, EventAttendeeDocument } from '../firebase/schema';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getCalendarSettings } from './eventLocalStorageService';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface CalendarEvent {
  title: string;
  description: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  isAllDay: boolean;
  timezone: string;
  reminderMinutes?: number;
}

export interface CalendarSyncResult {
  success: boolean;
  provider: 'google' | 'outlook' | 'apple';
  eventId?: string;
  error?: string;
}

// ============================================
// GOOGLE CALENDAR SYNC
// ============================================

/**
 * Sync event to Google Calendar
 * Requires Google Calendar API setup and OAuth
 * @param event - Event to sync
 * @param accessToken - Google OAuth access token
 * @returns Sync result with Google Calendar event ID
 */
export const syncToGoogleCalendar = async (
  event: CalendarEvent,
  accessToken: string
): Promise<CalendarSyncResult> => {
  try {
    const googleEvent = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: event.isAllDay
        ? { date: event.startDate.toISOString().split('T')[0] }
        : { dateTime: event.startDate.toISOString(), timeZone: event.timezone },
      end: event.endDate
        ? event.isAllDay
          ? { date: event.endDate.toISOString().split('T')[0] }
          : { dateTime: event.endDate.toISOString(), timeZone: event.timezone }
        : undefined,
      reminders: event.reminderMinutes
        ? {
            useDefault: false,
            overrides: [{ method: 'popup', minutes: event.reminderMinutes }],
          }
        : { useDefault: true },
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleEvent),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to sync to Google Calendar');
    }

    const data = await response.json();

    return {
      success: true,
      provider: 'google',
      eventId: data.id,
    };
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    return {
      success: false,
      provider: 'google',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Update Google Calendar event
 * @param googleEventId - Google Calendar event ID
 * @param event - Updated event data
 * @param accessToken - Google OAuth access token
 */
export const updateGoogleCalendarEvent = async (
  googleEventId: string,
  event: CalendarEvent,
  accessToken: string
): Promise<CalendarSyncResult> => {
  try {
    const googleEvent = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: event.isAllDay
        ? { date: event.startDate.toISOString().split('T')[0] }
        : { dateTime: event.startDate.toISOString(), timeZone: event.timezone },
      end: event.endDate
        ? event.isAllDay
          ? { date: event.endDate.toISOString().split('T')[0] }
          : { dateTime: event.endDate.toISOString(), timeZone: event.timezone }
        : undefined,
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleEvent),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update Google Calendar event');
    }

    return {
      success: true,
      provider: 'google',
      eventId: googleEventId,
    };
  } catch (error) {
    return {
      success: false,
      provider: 'google',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Delete event from Google Calendar
 * @param googleEventId - Google Calendar event ID
 * @param accessToken - Google OAuth access token
 */
export const deleteGoogleCalendarEvent = async (
  googleEventId: string,
  accessToken: string
): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Failed to delete Google Calendar event:', error);
    return false;
  }
};

// ============================================
// MICROSOFT OUTLOOK CALENDAR SYNC
// ============================================

/**
 * Sync event to Outlook Calendar
 * Requires Microsoft Graph API setup and OAuth
 * @param event - Event to sync
 * @param accessToken - Microsoft OAuth access token
 * @returns Sync result with Outlook event ID
 */
export const syncToOutlookCalendar = async (
  event: CalendarEvent,
  accessToken: string
): Promise<CalendarSyncResult> => {
  try {
    const outlookEvent = {
      subject: event.title,
      body: {
        contentType: 'HTML',
        content: event.description,
      },
      start: {
        dateTime: event.startDate.toISOString(),
        timeZone: event.timezone,
      },
      end: event.endDate
        ? {
            dateTime: event.endDate.toISOString(),
            timeZone: event.timezone,
          }
        : undefined,
      location: event.location ? { displayName: event.location } : undefined,
      isAllDay: event.isAllDay,
      reminderMinutesBeforeStart: event.reminderMinutes || 15,
    };

    const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(outlookEvent),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to sync to Outlook Calendar');
    }

    const data = await response.json();

    return {
      success: true,
      provider: 'outlook',
      eventId: data.id,
    };
  } catch (error) {
    console.error('Outlook Calendar sync error:', error);
    return {
      success: false,
      provider: 'outlook',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Update Outlook Calendar event
 * @param outlookEventId - Outlook event ID
 * @param event - Updated event data
 * @param accessToken - Microsoft OAuth access token
 */
export const updateOutlookCalendarEvent = async (
  outlookEventId: string,
  event: CalendarEvent,
  accessToken: string
): Promise<CalendarSyncResult> => {
  try {
    const outlookEvent = {
      subject: event.title,
      body: {
        contentType: 'HTML',
        content: event.description,
      },
      start: {
        dateTime: event.startDate.toISOString(),
        timeZone: event.timezone,
      },
      end: event.endDate
        ? {
            dateTime: event.endDate.toISOString(),
            timeZone: event.timezone,
          }
        : undefined,
      location: event.location ? { displayName: event.location } : undefined,
      isAllDay: event.isAllDay,
    };

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/events/${outlookEventId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(outlookEvent),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update Outlook Calendar event');
    }

    return {
      success: true,
      provider: 'outlook',
      eventId: outlookEventId,
    };
  } catch (error) {
    return {
      success: false,
      provider: 'outlook',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Delete event from Outlook Calendar
 * @param outlookEventId - Outlook event ID
 * @param accessToken - Microsoft OAuth access token
 */
export const deleteOutlookCalendarEvent = async (
  outlookEventId: string,
  accessToken: string
): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/events/${outlookEventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Failed to delete Outlook Calendar event:', error);
    return false;
  }
};

// ============================================
// APPLE CALENDAR SYNC (via .ics file)
// ============================================

/**
 * Generate iCalendar (.ics) file for Apple Calendar
 * Apple Calendar doesn't have a web API, so we generate .ics files
 * @param event - Event to convert
 * @returns .ics file content as string
 */
export const generateICSFile = (event: CalendarEvent): string => {
  const formatDate = (date: Date): string => {
    return date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  };

  const uid = `${Date.now()}@biblenotelm.app`;
  const startDate = formatDate(event.startDate);
  const endDate = event.endDate ? formatDate(event.endDate) : startDate;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BibleNoteLM//Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART${event.isAllDay ? ';VALUE=DATE' : ''}:${startDate}`,
    `DTEND${event.isAllDay ? ';VALUE=DATE' : ''}:${endDate}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    event.location ? `LOCATION:${event.location}` : '',
    event.reminderMinutes
      ? `BEGIN:VALARM\nACTION:DISPLAY\nDESCRIPTION:Reminder\nTRIGGER:-PT${event.reminderMinutes}M\nEND:VALARM`
      : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  return icsContent;
};

/**
 * Download .ics file for user to add to Apple Calendar
 * @param event - Event to export
 * @param filename - Filename for the .ics file
 */
export const downloadICSFile = (event: CalendarEvent, filename: string = 'event.ics'): void => {
  const icsContent = generateICSFile(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

// ============================================
// FIREBASE EVENT ATTENDEE SYNC HELPERS
// ============================================

/**
 * Update calendar sync status in Firebase
 * @param eventId - Event ID
 * @param userId - User ID
 * @param provider - Calendar provider
 * @param externalEventId - External calendar event ID
 */
export const updateCalendarSyncStatus = async (
  eventId: string,
  userId: string,
  provider: 'google' | 'outlook' | 'apple',
  externalEventId?: string
): Promise<void> => {
  try {
    const attendeeRef = doc(db, 'events', eventId, 'attendees', userId);

    const calendarSync: Partial<EventAttendeeDocument['calendarSync']> = {
      isSynced: true,
      lastSyncedAt: Timestamp.now(),
    };

    if (provider === 'google' && externalEventId) {
      calendarSync.googleCalendarEventId = externalEventId;
    } else if (provider === 'outlook' && externalEventId) {
      calendarSync.outlookEventId = externalEventId;
    } else if (provider === 'apple' && externalEventId) {
      calendarSync.appleCalendarId = externalEventId;
    }

    await updateDoc(attendeeRef, {
      calendarSync,
    });
  } catch (error) {
    console.error('Failed to update calendar sync status:', error);
    throw error;
  }
};

/**
 * Remove calendar sync status from Firebase
 * @param eventId - Event ID
 * @param userId - User ID
 * @param provider - Calendar provider
 */
export const removeCalendarSyncStatus = async (
  eventId: string,
  userId: string,
  provider: 'google' | 'outlook' | 'apple'
): Promise<void> => {
  try {
    const attendeeRef = doc(db, 'events', eventId, 'attendees', userId);

    const updates: any = {
      'calendarSync.isSynced': false,
    };

    if (provider === 'google') {
      updates['calendarSync.googleCalendarEventId'] = null;
    } else if (provider === 'outlook') {
      updates['calendarSync.outlookEventId'] = null;
    } else if (provider === 'apple') {
      updates['calendarSync.appleCalendarId'] = null;
    }

    await updateDoc(attendeeRef, updates);
  } catch (error) {
    console.error('Failed to remove calendar sync status:', error);
    throw error;
  }
};

// ============================================
// UNIFIED SYNC FUNCTION
// ============================================

/**
 * Convert EventDocument to CalendarEvent
 */
const eventDocumentToCalendarEvent = (
  event: EventDocument,
  reminderMinutes?: number
): CalendarEvent => {
  return {
    title: event.title,
    description: event.description,
    location: event.location?.name,
    startDate: event.startDate.toDate(),
    endDate: event.endDate?.toDate(),
    isAllDay: event.isAllDay,
    timezone: event.timezone,
    reminderMinutes,
  };
};

/**
 * Sync event to user's preferred calendar(s)
 * Automatically detects which calendars to sync based on user settings
 * @param event - Event to sync
 * @param userId - User ID
 * @param tokens - OAuth tokens for different providers
 * @returns Array of sync results
 */
export const syncEventToCalendars = async (
  event: EventDocument,
  userId: string,
  tokens: {
    googleAccessToken?: string;
    outlookAccessToken?: string;
  }
): Promise<CalendarSyncResult[]> => {
  const settings = await getCalendarSettings();
  const results: CalendarSyncResult[] = [];

  const calendarEvent = eventDocumentToCalendarEvent(event, settings.defaultReminderMinutes);

  // Sync to Google Calendar
  if (settings.syncToGoogleCalendar && tokens.googleAccessToken) {
    const result = await syncToGoogleCalendar(calendarEvent, tokens.googleAccessToken);
    results.push(result);

    if (result.success && result.eventId) {
      await updateCalendarSyncStatus(event.id, userId, 'google', result.eventId);
    }
  }

  // Sync to Outlook Calendar
  if (settings.syncToOutlook && tokens.outlookAccessToken) {
    const result = await syncToOutlookCalendar(calendarEvent, tokens.outlookAccessToken);
    results.push(result);

    if (result.success && result.eventId) {
      await updateCalendarSyncStatus(event.id, userId, 'outlook', result.eventId);
    }
  }

  // Generate ICS file for Apple Calendar
  if (settings.syncToAppleCalendar) {
    downloadICSFile(calendarEvent, `${event.title.replace(/\s+/g, '_')}.ics`);
    results.push({
      success: true,
      provider: 'apple',
    });
  }

  return results;
};

/**
 * Remove event from all synced calendars
 * @param eventId - Event ID
 * @param userId - User ID
 * @param attendee - Attendee document with calendar sync info
 * @param tokens - OAuth tokens
 */
export const removeSyncedEvent = async (
  eventId: string,
  userId: string,
  attendee: EventAttendeeDocument,
  tokens: {
    googleAccessToken?: string;
    outlookAccessToken?: string;
  }
): Promise<void> => {
  const calendarSync = attendee.calendarSync;

  if (!calendarSync || !calendarSync.isSynced) {
    return;
  }

  // Remove from Google Calendar
  if (calendarSync.googleCalendarEventId && tokens.googleAccessToken) {
    await deleteGoogleCalendarEvent(calendarSync.googleCalendarEventId, tokens.googleAccessToken);
    await removeCalendarSyncStatus(eventId, userId, 'google');
  }

  // Remove from Outlook Calendar
  if (calendarSync.outlookEventId && tokens.outlookAccessToken) {
    await deleteOutlookCalendarEvent(calendarSync.outlookEventId, tokens.outlookAccessToken);
    await removeCalendarSyncStatus(eventId, userId, 'outlook');
  }

  // Note: Apple Calendar sync via .ics doesn't support automatic deletion
  // Users need to manually remove from their calendar
};
