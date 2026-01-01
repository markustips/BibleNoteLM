# Firestore Database Structure for BibleNoteLM

## Overview

The database will be **automatically created** when the Cloud Functions are deployed and users start using the app. However, this document explains the complete structure for reference.

---

## Collections Overview

```
firestore/
├── users/                          # User profiles
├── churches/                       # Church organizations
│   └── {churchId}/
│       └── members/                # Church members subcollection
├── announcements/                  # Church announcements
├── events/                         # Church events
│   └── {eventId}/
│       └── attendees/              # Event attendees subcollection
├── prayers/                        # Prayer requests
│   └── {prayerId}/
│       └── praying_users/          # Users who prayed subcollection
├── subscriptions/                  # User subscriptions (Stripe)
├── audit_logs/                     # Security & compliance logs
├── analytics/                      # System analytics snapshots
│   └── weekly_snapshots/
│       └── snapshots/              # Historical analytics
└── rate_limits/                    # API rate limiting
```

---

## 1. Users Collection (`users/`)

**Created by**: `onUserCreate` Cloud Function (automatic on first sign-in)

**Document ID**: Firebase Auth UID

**Schema**:
```typescript
{
  id: string;                       // Same as document ID
  email: string;                    // From Google Sign-In
  displayName: string;              // From Google profile
  photoURL?: string;                // Google profile picture
  role: 'guest' | 'member' | 'subscriber' | 'pastor' | 'admin' | 'super_admin';
  churchId?: string;                // Reference to church (when joined)
  churchCode?: string;              // Church code for quick reference
  churchName?: string;              // Denormalized for quick access
  subscriptionTier: 'free' | 'basic' | 'premium';
  fcmTokens?: string[];             // Push notification tokens
  lastLoginAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}
```

**Example**:
```json
{
  "id": "abc123xyz",
  "email": "pastor@church.com",
  "displayName": "Pastor John",
  "role": "pastor",
  "churchId": "church001",
  "churchCode": "ABC12345",
  "churchName": "Grace Community Church",
  "subscriptionTier": "free",
  "createdAt": "2025-12-31T10:00:00Z",
  "updatedAt": "2025-12-31T10:00:00Z",
  "isActive": true
}
```

---

## 2. Churches Collection (`churches/`)

**Created by**: `createChurch` Cloud Function (when pastor creates church)

**Document ID**: Auto-generated

**Schema**:
```typescript
{
  id: string;
  name: string;                     // Church name
  code: string;                     // 8-character unique code (e.g., "ABC12345")
  pastorId: string;                 // User ID of lead pastor
  adminIds: string[];               // Array of admin user IDs
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  websiteUrl?: string;
  logoUrl?: string;                 // Uploaded logo
  stats?: {
    memberCount: number;
    activeMembers: number;
    totalAnnouncements: number;
    totalEvents: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}
```

**Subcollection**: `churches/{churchId}/members/`

**Member Document**:
```typescript
{
  userId: string;
  role: 'pastor' | 'admin' | 'member';
  joinedAt: Timestamp;
  invitedBy?: string;               // User ID who invited
  isActive: boolean;
  leftAt?: Timestamp;
}
```

---

## 3. Announcements Collection (`announcements/`)

**Created by**: `createAnnouncement` Cloud Function (pastor/admin only)

**Document ID**: Auto-generated

**Schema**:
```typescript
{
  id: string;
  churchId: string;                 // Which church this belongs to
  title: string;
  content: string;                  // Markdown/HTML content
  authorId: string;
  authorName: string;
  priority: 'low' | 'medium' | 'high';
  isPublished: boolean;
  publishedAt?: Timestamp;
  expiresAt?: Timestamp;            // Optional expiration
  imageUrl?: string;                // Uploaded image URL
  imagePath?: string;               // Storage path for deletion
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 4. Events Collection (`events/`)

**Created by**: `createEvent` Cloud Function (pastor/admin only)

**Document ID**: Auto-generated

**Schema**:
```typescript
{
  id: string;
  churchId: string;
  title: string;
  description: string;
  location?: string;
  startDate: Timestamp;
  endDate: Timestamp;
  organizer: string;                // Display name
  organizerId: string;              // User ID
  category: 'service' | 'bible_study' | 'prayer_meeting' | 'fellowship' | 'outreach' | 'other';
  maxAttendees?: number;            // Optional capacity limit
  currentAttendees: number;         // Auto-incremented
  isPublished: boolean;
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Subcollection**: `events/{eventId}/attendees/`

**Attendee Document**:
```typescript
{
  userId: string;
  userName: string;
  status: 'registered' | 'attended' | 'cancelled';
  registeredAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 5. Prayers Collection (`prayers/`)

**Created by**: `createPrayer` Cloud Function (any authenticated user)

**Document ID**: Auto-generated

**Schema**:
```typescript
{
  id: string;
  userId: string;
  userName: string;
  churchId?: string;                // Optional - can be personal
  title: string;
  content: string;
  visibility: 'public' | 'church' | 'private';
  category: 'general' | 'healing' | 'guidance' | 'thanksgiving' | 'intercession' | 'other';
  isAnswered: boolean;
  answeredAt?: Timestamp;
  answeredNote?: string;
  prayerCount: number;              // How many people prayed
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Subcollection**: `prayers/{prayerId}/praying_users/`

**Praying User Document**:
```typescript
{
  userId: string;
  userName: string;
  prayedAt: Timestamp;
}
```

---

## 6. Subscriptions Collection (`subscriptions/`)

**Created by**: `createSubscription` Cloud Function (Stripe integration)

**Document ID**: User ID (one subscription per user)

**Schema**:
```typescript
{
  id: string;
  userId: string;
  tier: 'free' | 'basic' | 'premium';
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'trial';
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 7. Audit Logs Collection (`audit_logs/`)

**Created by**: Security middleware (automatic)

**Document ID**: Auto-generated

**Schema**:
```typescript
{
  userId: string;
  action: 'READ' | 'WRITE' | 'DELETE' | 'ACCESS_DENIED';
  collection: string;               // Which collection was accessed
  documentId?: string;
  result: 'SUCCESS' | 'DENIED' | 'ERROR';
  requiredRoles?: string[];
  metadata?: object;                // Additional context
  timestamp: Timestamp;
  ipAddress?: string;
}
```

**Retention**: 365 days (auto-deleted by `dailyCleanup` scheduled function)

---

## 8. Analytics Collection (`analytics/`)

**Created by**: `weeklyAnalytics` scheduled Cloud Function

**Subcollection**: `analytics/weekly_snapshots/snapshots/`

**Schema**:
```typescript
{
  week: string;                     // ISO date (e.g., "2025-12-31")
  totalChurches: number;
  totalUsers: number;
  activeSubscriptions: number;
  subscriptionsByTier: {
    free: number;
    basic: number;
    premium: number;
  };
  monthlyRevenue: number;
  timestamp: Timestamp;
}
```

---

## 9. Rate Limits Collection (`rate_limits/`)

**Created by**: Rate limiting middleware (automatic)

**Document ID**: `{userId}_{action}`

**Schema**:
```typescript
{
  userId: string;
  action: string;                   // e.g., 'create_church', 'join_church'
  count: number;
  windowStart: Timestamp;
  expiresAt: Timestamp;
}
```

**Retention**: Auto-cleaned daily by `dailyCleanup` function

---

## Database Security

All collections are protected by Firestore Security Rules (`firestore.rules`):

✅ Users can only read/write their own user document
✅ Church members can read church data
✅ Only pastors can create/edit announcements and events
✅ Prayer visibility controls who can read them
✅ Audit logs are admin-only
✅ All writes are validated and logged

---

## How the Database Gets Created

### Automatic Creation Flow:

1. **First User Signs In** → `onUserCreate` trigger creates `users/{userId}` document
2. **Pastor Creates Church** → `createChurch` creates `churches/{id}` document
3. **User Joins Church** → `joinChurch` creates `churches/{id}/members/{userId}`
4. **Pastor Creates Announcement** → `createAnnouncement` creates `announcements/{id}`
5. **Scheduled Functions Run** → Create `analytics/`, `rate_limits/`, etc.

**No manual setup required!** The database structure is created on-demand as users interact with the app.

---

## Seeding Test Data (Optional)

If you want to create test data before deploying, you can use this script:

### Option 1: Using Firebase Console

1. Go to: https://console.firebase.google.com/project/biblenotelm-6cf80/firestore
2. Click "Start collection"
3. Create collections manually (users, churches, etc.)

### Option 2: Using Node.js Script

Create a seed script:

```javascript
// backend/functions/scripts/seedData.js
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'biblenotelm-6cf80.appspot.com'
});

const db = admin.firestore();

async function seedData() {
  console.log('Seeding test data...');

  // Create test church
  const churchRef = db.collection('churches').doc();
  await churchRef.set({
    id: churchRef.id,
    name: 'Grace Community Church',
    code: 'GRACE123',
    pastorId: 'test-pastor-id',
    adminIds: ['test-pastor-id'],
    description: 'A test church for development',
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    isActive: true,
    stats: {
      memberCount: 1,
      activeMembers: 1,
      totalAnnouncements: 0,
      totalEvents: 0
    }
  });

  console.log('✅ Created test church:', churchRef.id);

  // Add more seed data as needed...

  console.log('✅ Seed data complete!');
  process.exit(0);
}

seedData().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
```

Run it:
```bash
cd backend/functions
node scripts/seedData.js
```

---

## Database Indexes

Composite indexes are defined in `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "announcements",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "churchId", "order": "ASCENDING" },
        { "fieldPath": "isPublished", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "churchId", "order": "ASCENDING" },
        { "fieldPath": "startDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "prayers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "churchId", "order": "ASCENDING" },
        { "fieldPath": "visibility", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

These are **already deployed** with your Firestore rules.

---

## Next Steps

1. ✅ **Database structure is ready** - Will auto-create on first use
2. ⏳ **Deploy Cloud Functions** - After fixing IAM permissions
3. 🎯 **Test the flow**:
   - Sign in to dashboard
   - Create first church
   - Invite members with church code
   - Create announcements and events

The database will populate automatically as you use the features!

---

**No manual database setup needed** - just deploy Cloud Functions and start using the app! 🚀
