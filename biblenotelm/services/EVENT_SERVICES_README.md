# Event Services Documentation

Complete guide for event management with local storage, calendar sync, and reminders.

## Overview

The event system is designed to **minimize cloud storage costs** by storing user-specific data locally on the device while keeping shared event data in the cloud.

### Architecture

```
Cloud (Firebase)          Local (Device)
├─ Event metadata        ├─ Event images
├─ Attendee lists        ├─ Event reminders
└─ Calendar sync IDs     ├─ Calendar settings
                         └─ Cached event data
```

## Services

### 1. Event Local Storage Service
**File:** `eventLocalStorageService.ts`

Manages local storage for event images, reminders, and calendar settings.

#### Event Images

```typescript
import {
  saveEventImageLocally,
  getEventImageLocally,
  deleteEventImageLocally,
} from './eventLocalStorageService';

// Save image locally (saves full image + thumbnail)
const imageData = await saveEventImageLocally(
  eventId,
  imageBlob,
  true // generate thumbnail
);

// Get image from local storage
const imageBlob = await getEventImageLocally(eventId, false); // full image
const thumbnailBlob = await getEventImageLocally(eventId, true); // thumbnail

// Delete image
await deleteEventImageLocally(eventId);
```

#### Event Reminders

```typescript
import {
  saveEventReminder,
  getEventReminder,
  getAllEventReminders,
  deleteEventReminder,
} from './eventLocalStorageService';

// Create reminder
const reminder = await saveEventReminder({
  id: `reminder_${eventId}`,
  eventId,
  eventTitle: 'Sunday Service',
  eventStartDate: '2025-01-15T10:00:00Z',
  reminderMinutesBefore: 30,
  isEnabled: true,
  addedToDeviceCalendar: false,
});

// Get reminder
const reminder = await getEventReminder(eventId);

// Delete reminder
await deleteEventReminder(eventId);
```

#### Calendar Settings

```typescript
import {
  getCalendarSettings,
  saveCalendarSettings,
} from './eventLocalStorageService';

// Get settings
const settings = await getCalendarSettings();

// Update settings
await saveCalendarSettings({
  syncToGoogleCalendar: true,
  syncToOutlook: false,
  syncToAppleCalendar: true,
  defaultReminderMinutes: 30,
  autoSyncNewEvents: true,
});
```

---

### 2. Calendar Sync Service
**File:** `calendarSyncService.ts`

Handles syncing events to Google Calendar, Outlook, and Apple Calendar.

#### Google Calendar

```typescript
import {
  syncToGoogleCalendar,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from './calendarSyncService';

// Sync event to Google Calendar
const result = await syncToGoogleCalendar(
  {
    title: 'Sunday Service',
    description: 'Weekly worship service',
    startDate: new Date('2025-01-15T10:00:00'),
    endDate: new Date('2025-01-15T11:30:00'),
    isAllDay: false,
    timezone: 'America/New_York',
    reminderMinutes: 30,
  },
  googleAccessToken
);

if (result.success) {
  console.log('Google Calendar event ID:', result.eventId);
}
```

#### Outlook Calendar

```typescript
import {
  syncToOutlookCalendar,
  updateOutlookCalendarEvent,
  deleteOutlookCalendarEvent,
} from './calendarSyncService';

// Sync to Outlook
const result = await syncToOutlookCalendar(calendarEvent, outlookAccessToken);
```

#### Apple Calendar (iCalendar .ics)

```typescript
import {
  generateICSFile,
  downloadICSFile,
} from './calendarSyncService';

// Generate .ics file content
const icsContent = generateICSFile(calendarEvent);

// Download .ics file for user
downloadICSFile(calendarEvent, 'event.ics');
```

#### Unified Sync

```typescript
import { syncEventToCalendars } from './calendarSyncService';

// Automatically sync to all enabled calendars based on user settings
const results = await syncEventToCalendars(
  eventDocument,
  userId,
  {
    googleAccessToken: 'token123',
    outlookAccessToken: 'token456',
  }
);

// Results array contains sync status for each provider
results.forEach(result => {
  console.log(`${result.provider}: ${result.success ? 'Success' : 'Failed'}`);
});
```

---

### 3. Event Reminder Service
**File:** `eventReminderService.ts`

Manages local notifications and reminders using Capacitor Local Notifications.

#### Setup

```typescript
import { setupNotificationListeners } from './eventReminderService';

// Setup listeners (call once during app initialization)
setupNotificationListeners();
```

#### Schedule Reminders

```typescript
import {
  scheduleEventReminder,
  scheduleMultipleEventReminders,
  scheduleSmartReminders,
  autoScheduleReminder,
} from './eventReminderService';

// Single reminder (30 minutes before)
const notificationId = await scheduleEventReminder(eventDocument, 30);

// Multiple reminders
const notificationIds = await scheduleMultipleEventReminders(
  eventDocument,
  [1440, 60, 15] // 1 day, 1 hour, 15 minutes before
);

// Smart reminders (automatic based on event timing)
await scheduleSmartReminders(eventDocument);

// Auto-schedule based on user settings
await autoScheduleReminder(eventDocument);
```

#### Manage Reminders

```typescript
import {
  cancelEventReminder,
  rescheduleEventReminder,
  cleanupPastEventReminders,
} from './eventReminderService';

// Cancel reminder
await cancelEventReminder(eventId);

// Reschedule with new time
await rescheduleEventReminder(eventId, eventDocument, 60);

// Clean up old reminders
await cleanupPastEventReminders();
```

---

### 4. Event Image Cache Service
**File:** `eventImageCacheService.ts`

Manages downloading, caching, and serving event images locally.

#### Download & Cache

```typescript
import {
  downloadAndCacheEventImage,
  getEventImage,
  getEventImageDataUrl,
} from './eventImageCacheService';

// Download and cache image
const localPath = await downloadAndCacheEventImage(
  eventId,
  'https://example.com/event-image.jpg',
  true // generate thumbnail
);

// Get cached image (downloads if not cached)
const imageBlob = await getEventImage(
  eventId,
  'https://example.com/event-image.jpg',
  false // use full image, not thumbnail
);

// Get as data URL for display in <img> tag
const dataUrl = await getEventImageDataUrl(eventId, imageUrl, true);
```

#### Batch Operations

```typescript
import {
  preCacheEventImages,
  prepareOfflineMode,
  isReadyForOffline,
} from './eventImageCacheService';

// Pre-cache multiple event images
await preCacheEventImages(
  events.map(e => ({ id: e.id, imageURL: e.imageURL })),
  (current, total) => {
    console.log(`Cached ${current}/${total} images`);
  }
);

// Prepare for offline mode
await prepareOfflineMode(events);

// Check if ready for offline
const ready = await isReadyForOffline(events);
```

#### Cache Management

```typescript
import {
  getCacheStats,
  isCacheFull,
  manageCacheSize,
} from './eventImageCacheService';

// Get cache statistics
const stats = await getCacheStats();
console.log(`Cache size: ${stats.totalSizeFormatted}`);

// Check if cache is full (> 100MB)
const full = await isCacheFull(100 * 1024 * 1024);

// Automatically manage cache size
await manageCacheSize(100 * 1024 * 1024);
```

---

### 5. Event Service (Updated)
**File:** `firebase/services/eventService.ts`

Firebase service with calendar sync support.

```typescript
import {
  registerForEvent,
  getAttendeeWithCalendarSync,
  updateAttendeeCalendarSync,
  isEventSynced,
  getEventsPendingSync,
} from '../firebase/services/eventService';

// Register for event with calendar sync enabled
await registerForEvent(eventId, userId, userName, true);

// Get attendee with calendar sync info
const attendee = await getAttendeeWithCalendarSync(eventId, userId);
console.log('Synced:', attendee?.calendarSync?.isSynced);

// Update calendar sync status
await updateAttendeeCalendarSync(eventId, userId, {
  googleCalendarEventId: 'google123',
  isSynced: true,
  lastSyncedAt: Timestamp.now(),
});

// Check if event is synced
const synced = await isEventSynced(eventId, userId);

// Get events pending sync
const pendingEvents = await getEventsPendingSync(userId);
```

---

## Complete Example: Event Registration Flow

```typescript
import { registerForEvent, getEvent } from '../firebase/services/eventService';
import { autoScheduleReminder } from './eventReminderService';
import { syncEventToCalendars } from './calendarSyncService';
import { downloadAndCacheEventImage } from './eventImageCacheService';
import { getCalendarSettings } from './eventLocalStorageService';

async function registerUserForEvent(
  eventId: string,
  userId: string,
  userName: string,
  tokens: { googleAccessToken?: string; outlookAccessToken?: string }
) {
  try {
    // 1. Get event details
    const event = await getEvent(eventId);
    if (!event) throw new Error('Event not found');

    // 2. Register user for event
    await registerForEvent(eventId, userId, userName, true);

    // 3. Cache event image locally
    if (event.imageURL) {
      await downloadAndCacheEventImage(eventId, event.imageURL, true);
    }

    // 4. Schedule reminder based on user settings
    await autoScheduleReminder(event);

    // 5. Sync to calendars if enabled
    const settings = await getCalendarSettings();
    if (settings.autoSyncNewEvents) {
      const results = await syncEventToCalendars(event, userId, tokens);
      console.log('Calendar sync results:', results);
    }

    return {
      success: true,
      message: 'Successfully registered for event',
    };
  } catch (error) {
    console.error('Registration failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
```

---

## Storage Cost Optimization

### What's Stored Locally (FREE)
- ✅ Event images (full + thumbnails)
- ✅ Event reminders
- ✅ Calendar sync preferences
- ✅ Notification settings

### What's Stored in Cloud (PAID)
- ✅ Event metadata (title, description, date, location)
- ✅ Attendee lists
- ✅ Calendar sync IDs (small data, minimal cost)

### Cost Savings Calculation

**Scenario:** 1000 users, 100 events with images

**Without local storage:**
- 100 events × 2MB image = 200MB
- 1000 users download images = 200GB bandwidth/month
- **Cost:** ~$4-10/month

**With local storage:**
- 100 events × small metadata = ~1MB
- Images stored locally on device
- **Cost:** ~$0.10/month

**Savings:** 95-98% reduction in storage & bandwidth costs

---

## Required Capacitor Plugins

Add these to your `package.json`:

```json
{
  "dependencies": {
    "@capacitor/filesystem": "^6.0.0",
    "@capacitor/preferences": "^6.0.0",
    "@capacitor/local-notifications": "^6.0.0"
  }
}
```

Install:
```bash
npm install @capacitor/filesystem @capacitor/preferences @capacitor/local-notifications
```

---

## OAuth Setup

### Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project and enable Google Calendar API
3. Create OAuth 2.0 credentials
4. Add scopes: `https://www.googleapis.com/auth/calendar.events`

### Microsoft Graph API (Outlook)

1. Go to [Azure Portal](https://portal.azure.com/)
2. Register app in Azure AD
3. Add API permissions: `Calendars.ReadWrite`
4. Create client secret

---

## Best Practices

1. **Always compress images** before caching locally
2. **Clean up old data** regularly (use `cleanupExpiredEventData`)
3. **Handle offline mode** gracefully
4. **Request permissions** before scheduling notifications
5. **Sync calendar changes** when user updates registration
6. **Monitor cache size** and warn users if storage is low

---

## Troubleshooting

### Notifications not working
- Check permissions: `LocalNotifications.requestPermissions()`
- Verify notification is scheduled: `LocalNotifications.getPending()`

### Calendar sync failing
- Verify OAuth tokens are valid
- Check API quota limits
- Ensure proper scopes are granted

### Images not caching
- Check device storage space
- Verify filesystem permissions
- Use `getCacheStats()` to debug

---

## Migration Notes

If you have existing events without the new schema:

```typescript
// Migration script example
async function migrateExistingEvents() {
  const events = await getEventsByChurch(churchId, 1000);

  for (const event of events) {
    // Download and cache images
    if (event.imageURL) {
      await downloadAndCacheEventImage(event.id, event.imageURL);
    }

    // Setup default calendar sync for existing attendees
    const attendees = await getEventAttendees(event.id);
    for (const attendee of attendees) {
      await updateAttendeeCalendarSync(event.id, attendee.userId, {
        isSynced: false,
      });
    }
  }
}
```

---

## API Reference

See individual service files for complete API documentation.

- `eventLocalStorageService.ts` - Local storage operations
- `calendarSyncService.ts` - Calendar provider integrations
- `eventReminderService.ts` - Notification scheduling
- `eventImageCacheService.ts` - Image caching & optimization
- `eventService.ts` - Firebase event operations
