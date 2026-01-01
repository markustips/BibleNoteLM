# Backend Cloud Functions Documentation

This document explains all 30+ Cloud Functions that power the BibleNoteLM backend.

---

## 📋 Overview

The backend is built with **Firebase Cloud Functions** (TypeScript) and provides:
- RESTful API endpoints (callable functions)
- Automatic triggers (auth events)
- Scheduled jobs (daily/weekly cleanup)
- Security middleware (rate limiting, validation, auth)
- Database operations (Firestore)
- File storage (Cloud Storage)

**Total Functions**: 30+ endpoints
**Language**: TypeScript
**Runtime**: Node.js 22
**Location**: `backend/functions/src/`

---

## 🔐 1. Authentication Functions

**Location**: `backend/functions/src/auth/triggers.ts`

### `onUserCreate` (Automatic Trigger)
**Trigger**: When a new user signs up with Firebase Auth
**Purpose**: Automatically create user profile in Firestore

**What it does**:
1. Creates user document in `users/{userId}` collection
2. Sets default values:
   - Role: `guest` (can be upgraded to member, pastor, admin)
   - Subscription: `free` tier
   - Preferences: notifications ON, dark mode OFF, NIV Bible
   - Stats: sermon count, prayer count, events attended
3. Records timestamps (created, updated, last login)

**Example User Document**:
```json
{
  "id": "user123",
  "email": "pastor@church.com",
  "displayName": "Pastor John",
  "photoURL": "https://...",
  "role": "guest",
  "subscriptionTier": "free",
  "churchId": null,
  "preferences": {
    "notifications": true,
    "darkMode": false,
    "bibleVersion": "NIV"
  },
  "stats": {
    "sermonsRecorded": 0,
    "prayersSubmitted": 0
  }
}
```

### `onUserDelete` (Automatic Trigger)
**Trigger**: When user account is deleted
**Purpose**: GDPR/CCPA compliance - clean up all user data

**What it does**:
1. Logs deletion to audit trail (compliance)
2. Deletes user document
3. Removes user from church members list
4. Deletes user's prayers, sermons, notes
5. Removes FCM tokens (push notifications)

### `updateLastLogin` (Callable)
**Purpose**: Update user's last login timestamp
**Security**: Requires authentication

### `updateFcmToken` (Callable)
**Purpose**: Register device for push notifications
**Input**: FCM token from mobile device

### `removeFcmToken` (Callable)
**Purpose**: Unregister device from push notifications

---

## ⛪ 2. Church Management Functions

**Location**: `backend/functions/src/church/index.ts`

### `createChurch` (Callable)
**Purpose**: Create a new church organization
**Security**: Requires authentication
**Rate Limit**: 5 requests per 15 minutes

**Input**:
```json
{
  "name": "Grace Community Church",
  "description": "A welcoming church",
  "address": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zipCode": "62701",
  "country": "USA",
  "timezone": "America/Chicago"
}
```

**What it does**:
1. Validates all input fields
2. Generates unique 6-character church code (e.g., "ABC123")
3. Creates church document in Firestore
4. Sets creator as first pastor/admin
5. Updates user's churchId and role to "pastor"

**Output**:
```json
{
  "churchId": "church123",
  "churchCode": "ABC123",
  "success": true
}
```

### `updateChurch` (Callable)
**Purpose**: Update church information
**Security**: Requires pastor or admin role
**Rate Limit**: 10 requests per 15 minutes

### `getChurch` (Callable)
**Purpose**: Get church details by ID
**Security**: Requires church membership

### `getChurchMembers` (Callable)
**Purpose**: Get list of all church members
**Security**: Requires church membership
**Returns**: Array of user profiles (name, email, role, joined date)

### `joinChurch` (Callable)
**Purpose**: Join a church using church code
**Security**: Requires authentication
**Rate Limit**: 3 requests per 15 minutes

**Input**:
```json
{
  "churchCode": "ABC123"
}
```

**What it does**:
1. Validates church code exists
2. Checks if church is active
3. Updates user's churchId
4. Adds user to church members array
5. Changes role from "guest" to "member"

### `leaveChurch` (Callable)
**Purpose**: Leave current church
**Security**: Requires authentication
**What it does**: Removes user from church, sets churchId to null

---

## 📢 3. Announcements Functions

**Location**: `backend/functions/src/announcements/index.ts`

### `createAnnouncement` (Callable)
**Purpose**: Create church announcement
**Security**: Requires pastor or admin role
**Rate Limit**: 10 requests per 15 minutes

**Input**:
```json
{
  "title": "Sunday Service Cancelled",
  "content": "Due to weather conditions...",
  "priority": "high",
  "isPublished": true,
  "expiresAt": "2024-12-31T23:59:59Z",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

**What it does**:
1. Validates input (title required, max 500 chars content)
2. Checks user is pastor/admin
3. Uploads image to Cloud Storage (if provided)
   - Max 5MB
   - Stores at: `churches/{churchId}/announcements/{id}.jpg`
4. Creates announcement document
5. Returns announcement ID and image URL

**Priority Levels**: `low`, `medium`, `high`, `urgent`

### `updateAnnouncement` (Callable)
**Purpose**: Update existing announcement
**Security**: Requires pastor or admin role
**Can update**: title, content, priority, publish status, expiration

### `deleteAnnouncement` (Callable)
**Purpose**: Delete announcement
**Security**: Requires pastor or admin role
**What it does**: Deletes Firestore doc + Cloud Storage image

### `getChurchAnnouncements` (Callable)
**Purpose**: Get all announcements for a church
**Security**: Requires church membership
**Returns**: Array of announcements, sorted by created date (newest first)

### `getAnnouncement` (Callable)
**Purpose**: Get single announcement by ID
**Security**: Requires church membership

---

## 📅 4. Events Functions

**Location**: `backend/functions/src/events/index.ts`

### `createEvent` (Callable)
**Purpose**: Create church event
**Security**: Requires pastor or admin role
**Rate Limit**: 10 requests per 15 minutes

**Input**:
```json
{
  "title": "Youth Group Meeting",
  "description": "Pizza and games night",
  "location": "Church basement",
  "startTime": "2024-12-31T18:00:00Z",
  "endTime": "2024-12-31T20:00:00Z",
  "maxAttendees": 50,
  "requiresRegistration": true,
  "imageBase64": "data:image/jpeg;base64,..."
}
```

**Event Types**: `service`, `bible_study`, `prayer_meeting`, `youth`, `outreach`, `social`, `other`

### `updateEvent` (Callable)
**Purpose**: Update event details
**Security**: Requires pastor or admin role

### `deleteEvent` (Callable)
**Purpose**: Delete event
**Security**: Requires pastor or admin role

### `getChurchEvents` (Callable)
**Purpose**: Get all church events
**Security**: Requires church membership
**Returns**: Events sorted by start time

### `getEvent` (Callable)
**Purpose**: Get single event by ID
**Security**: Requires church membership

### `registerForEvent` (Callable)
**Purpose**: RSVP to an event
**Security**: Requires church membership

**What it does**:
1. Checks event capacity
2. Checks if user already registered
3. Adds user to attendees array
4. Increments attendee count
5. Updates user stats

### `cancelEventRegistration` (Callable)
**Purpose**: Cancel event RSVP
**Security**: Requires authentication

### `getEventAttendees` (Callable)
**Purpose**: Get list of people registered for event
**Security**: Requires pastor or admin role
**Returns**: Array of attendee names and emails

---

## 🙏 5. Prayer Requests Functions

**Location**: `backend/functions/src/prayers/index.ts`

### `createPrayer` (Callable)
**Purpose**: Submit prayer request
**Security**: Requires church membership
**Rate Limit**: 20 requests per 15 minutes

**Input**:
```json
{
  "title": "Healing for Mom",
  "content": "Please pray for my mother's recovery",
  "isAnonymous": false,
  "category": "health"
}
```

**Categories**: `health`, `family`, `financial`, `spiritual`, `guidance`, `thanksgiving`, `other`

**What it does**:
1. Validates input
2. Creates prayer document
3. Increments user's prayer count
4. Notifies church pastors (if enabled)

### `updatePrayer` (Callable)
**Purpose**: Update own prayer request
**Security**: Must be prayer author or pastor/admin
**Can mark as**: `answered`, `ongoing`, `private`

### `deletePrayer` (Callable)
**Purpose**: Delete prayer request
**Security**: Must be prayer author or pastor/admin

### `getPrayers` (Callable)
**Purpose**: Get all church prayer requests
**Security**: Requires church membership
**Filters**: Can filter by category, status (answered/ongoing)

### `getPrayer` (Callable)
**Purpose**: Get single prayer by ID
**Security**: Requires church membership

### `prayForRequest` (Callable)
**Purpose**: Mark that you prayed for someone
**Input**: `{ "prayerId": "prayer123" }`

**What it does**:
1. Adds your userId to prayer's `prayedBy` array
2. Increments prayer count
3. Notifies prayer author (optional)

### `getPrayingUsers` (Callable)
**Purpose**: Get list of people who prayed
**Security**: Requires church membership

---

## 💰 6. Subscription Functions

**Location**: `backend/functions/src/subscriptions/index.ts`

### `createSubscription` (Callable)
**Purpose**: Subscribe to premium tier
**Security**: Requires authentication
**Integration**: Stripe payment processing

**Input**:
```json
{
  "tier": "basic",
  "paymentMethodId": "pm_1234567890"
}
```

**Tiers**:
- `free`: Limited features
- `basic` ($9.99/month): AI sermon transcription, unlimited notes
- `premium` ($29.99/month): All features + analytics

**What it does**:
1. Creates Stripe subscription
2. Creates subscription document in Firestore
3. Updates user's subscriptionTier
4. Grants access to premium features

### `cancelSubscription` (Callable)
**Purpose**: Cancel subscription
**Security**: Requires authentication
**What it does**: Cancels Stripe subscription, downgrades to free at period end

### `getSubscriptionStatus` (Callable)
**Purpose**: Check current subscription status
**Returns**: Tier, status, renewal date, payment history

### `stripeWebhook` (HTTP Trigger)
**Purpose**: Handle Stripe webhook events
**Events**: payment_succeeded, payment_failed, subscription_cancelled
**Security**: Validates Stripe signature

### `getAllSubscriptions` (Callable)
**Purpose**: Get all subscriptions (admin only)
**Security**: Requires super_admin role
**Returns**: Revenue analytics, subscription counts by tier

---

## 📊 7. Admin & Analytics Functions

**Location**: `backend/functions/src/admin/analytics.ts`

### `getSystemStats` (Callable)
**Purpose**: Get system-wide statistics
**Security**: Requires admin role

**Returns**:
```json
{
  "totalChurches": 150,
  "totalUsers": 5000,
  "activeSubscriptions": 800,
  "totalRevenue": 15000.00,
  "newUsersThisWeek": 45,
  "newChurchesThisMonth": 12
}
```

### `getChurchList` (Callable)
**Purpose**: Get all churches in system
**Security**: Requires super_admin role

### `getRevenueAnalytics` (Callable)
**Purpose**: Revenue breakdown by tier
**Security**: Requires admin role
**Returns**: Monthly recurring revenue, churn rate, growth rate

### `getUserGrowthAnalytics` (Callable)
**Purpose**: User growth over time
**Security**: Requires admin role
**Returns**: Daily/weekly/monthly signup trends

### `getChurchActivities` (Callable)
**Purpose**: Activity metrics for specific church
**Security**: Requires pastor or admin role
**Returns**: Announcements posted, events created, prayers submitted, member engagement

### `getMemberData` (Callable)
**Purpose**: Export member data (CSV)
**Security**: Requires pastor role
**Returns**: Member list with names, emails, join dates

### `getSermonContent` (Callable)
**Purpose**: Get sermon transcriptions
**Security**: Requires pastor role
**Use case**: Export sermons for blog, podcast

---

## ⏰ 8. Scheduled Functions

These run automatically on a schedule.

### `dailyCleanup` (Scheduled: Daily at Midnight)
**Purpose**: Housekeeping and maintenance

**What it does**:
1. **Cleanup rate limits**: Removes old rate limit records (>24 hours)
2. **Archive audit logs**: Deletes logs older than 365 days (compliance)
3. **Expire subscriptions**: Marks expired subscriptions as inactive
4. **Database optimization**: Removes deleted documents, compacts indexes

**Schedule**: Every day at 12:00 AM EST

### `weeklyAnalytics` (Scheduled: Sundays at Midnight)
**Purpose**: Generate weekly analytics snapshot

**What it does**:
1. Counts total churches, users, subscriptions
2. Calculates monthly recurring revenue
3. Tracks subscription tier distribution
4. Saves snapshot to `analytics/weekly_snapshots` collection
5. Generates trends report

**Schedule**: Every Sunday at 12:00 AM EST

### `dailyPaymentReminders` (Scheduled: Daily at 9 AM)
**Purpose**: Send payment reminder notifications

**What it does**:
1. Finds subscriptions expiring in 3 days
2. Sends email reminders via SendGrid
3. Sends push notifications via FCM
4. Logs reminder events

**Schedule**: Every day at 9:00 AM EST

---

## 🛡️ 9. Security Middleware

**Location**: `backend/functions/src/middleware/`

### Authentication (`auth.ts`)

#### `requireAuth(context)`
**Purpose**: Verify user is authenticated
**Throws**: `unauthenticated` error if not logged in

#### `requirePastorOrAdmin(userId)`
**Purpose**: Verify user has pastor or admin role
**Throws**: `permission-denied` if not authorized

#### `requireChurchMember(userId)`
**Purpose**: Verify user belongs to a church
**Throws**: `failed-precondition` if not in church

#### `logDataAccess(userId, action, resource)`
**Purpose**: Audit trail for GDPR compliance
**Logs to**: `audit_logs` collection

### Validation (`validation.ts`)

#### `validate(data, schema)`
**Purpose**: Validate input against schema
**Uses**: JSON schema validation
**Throws**: `invalid-argument` with details

**Example Schemas**:
- `createAnnouncement`: title (required, max 200), content (max 5000)
- `createEvent`: title, startTime, endTime (endTime > startTime)
- `createChurch`: name, address, timezone (valid IANA)

#### `sanitizeObject(obj)`
**Purpose**: Strip HTML tags, prevent XSS attacks
**Returns**: Cleaned object with escaped strings

### Rate Limiting (`rateLimit.ts`)

#### `checkRateLimit(userId, action, limit)`
**Purpose**: Prevent abuse and spam
**Throws**: `resource-exhausted` if limit exceeded

**Rate Limits**:
- Church operations: 5 per 15 minutes
- Announcements: 10 per 15 minutes
- Events: 10 per 15 minutes
- Prayers: 20 per 15 minutes
- Authentication: 10 per hour

---

## 💾 10. Database Structure

### Firestore Collections:

```
users/
  {userId}
    - email, displayName, role, churchId
    - subscriptionTier, stats, preferences

churches/
  {churchId}
    - name, description, address, churchCode
    - pastorId, memberIds[], isActive

announcements/
  {announcementId}
    - churchId, title, content, priority
    - authorId, imageUrl, publishedAt, expiresAt

events/
  {eventId}
    - churchId, title, description, location
    - startTime, endTime, attendees[], maxAttendees

prayers/
  {prayerId}
    - churchId, userId, title, content
    - category, status, isAnonymous, prayedBy[]

subscriptions/
  {subscriptionId}
    - userId, tier, status, stripeSubscriptionId
    - currentPeriodStart, currentPeriodEnd

audit_logs/
  {logId}
    - userId, action, resource, timestamp

analytics/
  weekly_snapshots/
    {snapshotId}
      - totalChurches, totalUsers, revenue
```

---

## 📡 How Frontend Apps Call Functions

### From Dashboard or Mobile App:

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// Create announcement
const createAnnouncement = httpsCallable(functions, 'createAnnouncement');
const result = await createAnnouncement({
  title: 'Sunday Service',
  content: 'Join us at 10am',
  priority: 'high',
  isPublished: true
});

console.log(result.data.announcementId); // "abc123"
```

### Authentication Required:
All functions check if user is signed in via Firebase Auth token automatically.

---

## 🔒 Security Features

1. **Authentication**: All functions require valid Firebase Auth token
2. **Authorization**: Role-based access control (RBAC)
   - `guest`: Can view public content
   - `member`: Can submit prayers, RSVP to events
   - `pastor`: Can create announcements, events, manage church
   - `admin`: Can manage users, view analytics
   - `super_admin`: System-wide access
3. **Rate Limiting**: Prevents abuse and spam
4. **Input Validation**: Prevents injection attacks
5. **XSS Protection**: Sanitizes all user input
6. **Audit Logging**: Tracks all data access (GDPR)
7. **Data Encryption**: Firestore encrypts all data at rest

---

## 📈 Performance & Scalability

- **Cold Start**: ~2-3 seconds (first request)
- **Warm Request**: <500ms average
- **Concurrent Limit**: 1000+ simultaneous requests
- **Auto-scaling**: Firebase handles scaling automatically
- **Caching**: Firestore has built-in caching
- **Optimization**: Functions only import needed dependencies

---

## 💰 Cost Estimate

**Firebase Blaze Plan (Pay-as-you-go)**

### Free Tier (Monthly):
- 2M function invocations
- 400K GB-seconds compute time
- 200K CPU-seconds

### Expected Cost (1000 users):
- Function invocations: $0 (within free tier)
- Compute time: ~$5/month
- Firestore reads/writes: ~$2/month
- Storage: ~$0.50/month
- **Total: ~$7.50/month**

---

## 🚀 Deployment

```bash
cd backend/functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

View logs:
```bash
firebase functions:log
```

---

## 🧪 Testing Functions Locally

```bash
cd backend
firebase emulators:start
```

Functions run at: `http://localhost:5001`

Test with Postman or frontend apps pointing to emulator.

---

**Total Functions**: 39 endpoints
**Lines of Code**: ~3,500 lines
**Test Coverage**: Security rules + validation
**Status**: ✅ Production Ready
