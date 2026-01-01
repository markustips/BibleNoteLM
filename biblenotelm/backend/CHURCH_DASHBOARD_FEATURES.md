# Church Dashboard Features - Implementation Guide

This document explains the newly implemented church dashboard features for announcements, events, and prayer requests. These features are available to church members and pastors through the mobile app.

## Overview

The church dashboard now includes three main features:
1. **Announcements** - Church-wide announcements that can be created and managed by pastors
2. **Events** - Church events with attendance tracking and registration
3. **Prayer Requests** - Community prayer requests with prayer tracking

## Feature Access Control

### Who Can Access These Features?

- **All features require church membership**: Users must be members of a church to view and interact with church-specific content
- **Announcements & Events Management**: Only pastors and admins can create, update, and delete
- **Prayer Requests**: Any church member can create and manage their own prayers
- **Public Prayers**: Anyone can view prayers marked as "public"

## 1. Announcements

### Features
- Create, update, and delete church announcements
- Priority levels: low, medium, high
- Published/unpublished status
- Optional expiration dates
- Only visible to church members

### Cloud Functions

#### `createAnnouncement`
Create a new announcement (Pastor/Admin only)

**Input:**
```typescript
{
  title: string;              // Required, 3-200 chars
  content: string;            // Required, 10-5000 chars
  priority?: 'low' | 'medium' | 'high';  // Default: 'medium'
  isPublished?: boolean;      // Default: false
  expiresAt?: string;         // ISO date string (optional)
  imageBase64?: string;       // Base64 encoded image (optional, max 5MB)
}
```

**Image Format:**
```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...
```

**Supported Image Formats:** JPEG, PNG, GIF, WebP (max 5MB)

**Output:**
```typescript
{
  success: true;
  data: {
    announcementId: string;
    title: string;
  }
}
```

#### `updateAnnouncement`
Update an existing announcement (Pastor/Admin only)

**Input:**
```typescript
{
  announcementId: string;     // Required
  title?: string;
  content?: string;
  priority?: 'low' | 'medium' | 'high';
  isPublished?: boolean;
  expiresAt?: string;
  imageBase64?: string;       // Update/replace image (optional)
  removeImage?: boolean;      // Set to true to remove image (optional)
}
```

**Note:** To replace an image, provide `imageBase64`. To remove an image, set `removeImage: true`.

#### `deleteAnnouncement`
Delete an announcement (Pastor/Admin only)

**Input:**
```typescript
{
  announcementId: string;
}
```

#### `getChurchAnnouncements`
Get all announcements for the user's church

**Input:**
```typescript
{
  limit?: number;             // Default: 20
  onlyPublished?: boolean;    // Default: true
}
```

**Output:**
```typescript
{
  success: true;
  data: AnnouncementDocument[];
}
```

#### `getAnnouncement`
Get a single announcement by ID

**Input:**
```typescript
{
  announcementId: string;
}
```

---

## 2. Events

### Features
- Create, update, and delete church events
- Event categories: service, bible_study, prayer_meeting, fellowship, outreach, other
- Attendance tracking and registration
- Maximum attendees limit (optional)
- Published/unpublished status
- Only visible to church members

### Cloud Functions

#### `createEvent`
Create a new event (Pastor/Admin only)

**Input:**
```typescript
{
  title: string;              // Required, 3-200 chars
  description: string;        // Required, 10-5000 chars
  location?: string;          // Optional, max 500 chars
  startDate: string;          // Required, ISO date string
  endDate: string;            // Required, ISO date string (must be after startDate)
  category?: 'service' | 'bible_study' | 'prayer_meeting' | 'fellowship' | 'outreach' | 'other';
  maxAttendees?: number;      // Optional, minimum 1
  isPublished?: boolean;      // Default: false
}
```

**Output:**
```typescript
{
  success: true;
  data: {
    eventId: string;
    title: string;
  }
}
```

#### `updateEvent`
Update an existing event (Pastor/Admin only)

**Input:**
```typescript
{
  eventId: string;            // Required
  title?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  maxAttendees?: number;
  isPublished?: boolean;
}
```

#### `deleteEvent`
Delete an event (Pastor/Admin only)

**Input:**
```typescript
{
  eventId: string;
}
```

#### `getChurchEvents`
Get all events for the user's church

**Input:**
```typescript
{
  limit?: number;             // Default: 20
  onlyPublished?: boolean;    // Default: true
  upcoming?: boolean;         // Default: false (filter to show only future events)
}
```

**Output:**
```typescript
{
  success: true;
  data: EventDocument[];
}
```

#### `getEvent`
Get a single event by ID

**Input:**
```typescript
{
  eventId: string;
}
```

#### `registerForEvent`
Register the current user for an event

**Input:**
```typescript
{
  eventId: string;
}
```

**Output:**
```typescript
{
  success: true;
  data: { message: 'Successfully registered for event' }
}
```

#### `cancelEventRegistration`
Cancel the current user's registration for an event

**Input:**
```typescript
{
  eventId: string;
}
```

#### `getEventAttendees`
Get all attendees for an event (Pastor/Admin only)

**Input:**
```typescript
{
  eventId: string;
}
```

**Output:**
```typescript
{
  success: true;
  data: EventAttendeeDocument[];
}
```

---

## 3. Prayer Requests

### Features
- Create, update, and delete prayer requests
- Visibility levels: public, church, private
- Categories: general, healing, guidance, thanksgiving, intercession, other
- Track who has prayed for each request
- Mark prayers as answered with notes
- Prayer count tracking

### Cloud Functions

#### `createPrayer`
Create a new prayer request

**Input:**
```typescript
{
  title: string;              // Required, 3-200 chars
  content: string;            // Required, 10-5000 chars
  visibility?: 'public' | 'church' | 'private';  // Default: 'church'
  category?: 'general' | 'healing' | 'guidance' | 'thanksgiving' | 'intercession' | 'other';
}
```

**Output:**
```typescript
{
  success: true;
  data: {
    prayerId: string;
    title: string;
  }
}
```

**Note:** If visibility is 'church' but user doesn't have a church, it defaults to 'private'

#### `updatePrayer`
Update an existing prayer (creator only)

**Input:**
```typescript
{
  prayerId: string;           // Required
  title?: string;
  content?: string;
  visibility?: 'public' | 'church' | 'private';
  category?: string;
  isAnswered?: boolean;
  answeredNote?: string;      // Max 1000 chars
}
```

#### `deletePrayer`
Delete a prayer (creator only)

**Input:**
```typescript
{
  prayerId: string;
}
```

#### `getPrayers`
Get prayers based on visibility

**Input:**
```typescript
{
  visibility?: 'public' | 'church' | 'my';  // Default: 'church'
  limit?: number;             // Default: 20
  onlyActive?: boolean;       // Default: true (exclude answered prayers)
}
```

**Output:**
```typescript
{
  success: true;
  data: PrayerDocument[];
}
```

**Visibility Options:**
- `'public'`: All public prayers (no church membership required)
- `'church'`: Prayers from user's church (requires church membership)
- `'my'`: User's own prayers (all visibility levels)

#### `getPrayer`
Get a single prayer by ID

**Input:**
```typescript
{
  prayerId: string;
}
```

**Note:** Respects visibility permissions

#### `prayForRequest`
Record that the current user has prayed for a request

**Input:**
```typescript
{
  prayerId: string;
}
```

**Output:**
```typescript
{
  success: true;
  data: { message: 'Prayer recorded successfully' }
}
```

**Note:** If user has already prayed, it updates the timestamp

#### `getPrayingUsers`
Get all users who have prayed for a request

**Input:**
```typescript
{
  prayerId: string;
}
```

**Output:**
```typescript
{
  success: true;
  data: PrayingUserDocument[];
}
```

---

## Security & Permissions

### Firestore Security Rules

The Firestore security rules are already configured to enforce:

1. **Announcements:**
   - Read: Church members can read their church's announcements
   - Write: Only pastors/admins can create/update announcements for their church
   - Delete: Only admins can delete announcements

2. **Events:**
   - Read: Church members can read their church's events
   - Write: Only pastors/admins can create/update/delete events for their church
   - Attendees: Members can register themselves; pastors can manage all attendees

3. **Prayers:**
   - Read: Based on visibility (public/church/private)
   - Write: Users can only manage their own prayers
   - Praying: Users can mark that they've prayed based on visibility permissions

### Rate Limiting

All create/update operations are rate-limited using the existing rate limit middleware to prevent abuse.

---

## Mobile App Integration

### How to Call These Functions from Flutter/React Native

```dart
// Example: Calling from Flutter using Firebase Functions

import 'package:cloud_functions/cloud_functions.dart';

final functions = FirebaseFunctions.instance;

// Get church announcements
Future<List<Announcement>> getAnnouncements() async {
  try {
    final result = await functions.httpsCallable('getChurchAnnouncements').call({
      'limit': 20,
      'onlyPublished': true,
    });

    if (result.data['success']) {
      return (result.data['data'] as List)
          .map((a) => Announcement.fromJson(a))
          .toList();
    }
  } catch (e) {
    print('Error: $e');
  }
  return [];
}

// Register for an event
Future<bool> registerForEvent(String eventId) async {
  try {
    final result = await functions.httpsCallable('registerForEvent').call({
      'eventId': eventId,
    });
    return result.data['success'];
  } catch (e) {
    print('Error: $e');
    return false;
  }
}

// Create a prayer request
Future<String?> createPrayerRequest(String title, String content) async {
  try {
    final result = await functions.httpsCallable('createPrayer').call({
      'title': title,
      'content': content,
      'visibility': 'church',
      'category': 'general',
    });

    if (result.data['success']) {
      return result.data['data']['prayerId'];
    }
  } catch (e) {
    print('Error: $e');
  }
  return null;
}

// Pray for a request
Future<bool> prayForRequest(String prayerId) async {
  try {
    final result = await functions.httpsCallable('prayForRequest').call({
      'prayerId': prayerId,
    });
    return result.data['success'];
  } catch (e) {
    print('Error: $e');
    return false;
  }
}
```

---

## Data Models

### AnnouncementDocument
```typescript
{
  id: string;
  churchId: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  priority: 'low' | 'medium' | 'high';
  isPublished: boolean;
  publishedAt?: Timestamp;
  expiresAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### EventDocument
```typescript
{
  id: string;
  churchId: string;
  title: string;
  description: string;
  location?: string;
  startDate: Timestamp;
  endDate: Timestamp;
  organizer: string;
  organizerId: string;
  category: 'service' | 'bible_study' | 'prayer_meeting' | 'fellowship' | 'outreach' | 'other';
  maxAttendees?: number;
  currentAttendees: number;
  isPublished: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### EventAttendeeDocument
```typescript
{
  userId: string;
  userName: string;
  status: 'registered' | 'attended' | 'cancelled';
  registeredAt: Timestamp;
  updatedAt: Timestamp;
}
```

### PrayerDocument
```typescript
{
  id: string;
  userId: string;
  userName: string;
  churchId?: string;
  title: string;
  content: string;
  visibility: 'public' | 'church' | 'private';
  category: 'general' | 'healing' | 'guidance' | 'thanksgiving' | 'intercession' | 'other';
  isAnswered: boolean;
  answeredAt?: Timestamp;
  answeredNote?: string;
  prayerCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### PrayingUserDocument
```typescript
{
  userId: string;
  userName: string;
  prayedAt: Timestamp;
}
```

---

## Deployment

To deploy these new functions:

```bash
cd backend/functions
npm run build
cd ..
firebase deploy --only functions
```

Or deploy specific function groups:

```bash
firebase deploy --only functions:createAnnouncement,functions:getChurchAnnouncements
firebase deploy --only functions:createEvent,functions:getChurchEvents
firebase deploy --only functions:createPrayer,functions:getPrayers
```

---

## Testing

### Manual Testing with Firebase Emulator

1. Start the emulator:
```bash
cd backend
firebase emulators:start
```

2. Use the Firebase Console or Postman to test the functions

### Example Test Flow

1. **Create a church** (existing functionality)
2. **Join the church** with a test user
3. **Create an announcement** as pastor
4. **Get announcements** as member
5. **Create an event** as pastor
6. **Register for event** as member
7. **Create a prayer request** as member
8. **Pray for the request** as another member

---

## Next Steps for Mobile App

1. **Create UI screens** for:
   - Announcements list and detail views
   - Events list, detail, and registration
   - Prayer requests feed and creation form
   - "I Prayed" button and prayer counter

2. **Implement state management** for:
   - Caching announcements/events/prayers
   - Real-time updates using Firestore listeners
   - Offline support

3. **Add notifications** for:
   - New announcements
   - Upcoming events
   - Prayer request answers

4. **Consider features like**:
   - Push notifications for new content
   - Calendar integration for events
   - Sharing prayers with other members
   - Prayer reminders

---

## Support

For issues or questions, please refer to:
- [Backend Setup Instructions](./SETUP_INSTRUCTIONS.md)
- [Quick Start Guide](./QUICK_START.md)
- [Status Document](./STATUS.md)
