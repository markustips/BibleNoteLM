# BibleNoteLM - Complete System Architecture

**Last Updated:** 2025-12-31
**Project:** Church Management Platform
**Tech Stack:** Firebase, React 19, TypeScript, Node.js 22

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Application Components](#application-components)
4. [Firebase Services](#firebase-services)
5. [Backend Cloud Functions](#backend-cloud-functions)
6. [Database Structure](#database-structure)
7. [Data Flow](#data-flow)
8. [Security Architecture](#security-architecture)
9. [Deployment Architecture](#deployment-architecture)
10. [Key Integration Points](#key-integration-points)

---

## 1. System Overview

BibleNoteLM is a **serverless church management platform** built on Firebase infrastructure. The system consists of three main applications that share a common Firebase backend.

### Core Principles
- **Serverless Architecture**: All backend logic runs on Firebase Cloud Functions
- **Real-time Data**: Firestore provides real-time synchronization across all apps
- **Role-Based Access**: Granular permissions (guest, member, pastor, admin, super_admin)
- **Privacy-First**: Secure data isolation between churches
- **Auto-Scaling**: Firebase handles all infrastructure scaling

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIREBASE CLOUD PLATFORM                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Firebase    │  │  Cloud       │  │  Cloud       │          │
│  │  Firestore   │  │  Functions   │  │  Storage     │          │
│  │  (Database)  │  │  (30+ APIs)  │  │  (Files)     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│  ┌──────┴──────────────────┴──────────────────┴───────┐          │
│  │         Firebase Authentication (Auth)             │          │
│  └────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   DASHBOARD      │  │   MOBILE/WEB     │  │   BACKEND        │
│   (Admin Panel)  │  │   (Member App)   │  │   (Functions)    │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ React 19 + Vite  │  │ React 19 + Vite  │  │ Node.js 22       │
│ TypeScript       │  │ TypeScript       │  │ TypeScript       │
│ Zustand          │  │ Zustand          │  │ Express          │
│ TailwindCSS      │  │ Capacitor        │  │ Stripe SDK       │
│                  │  │ PWA              │  │ Firebase Admin   │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ FEATURES:        │  │ FEATURES:        │  │ ENDPOINTS:       │
│ • Church Mgmt    │  │ • Bible Reader   │  │ • 30+ Functions  │
│ • Member Mgmt    │  │ • Sermons        │  │ • Auth Triggers  │
│ • Announcements  │  │ • Prayer Journal │  │ • CRUD APIs      │
│ • Events         │  │ • Events         │  │ • Scheduled Jobs │
│ • Analytics      │  │ • Announcements  │  │ • Webhooks       │
│ • Subscriptions  │  │ • Daily Verse    │  │ • Analytics      │
└──────────────────┘  └──────────────────┘  └──────────────────┘
         │                    │                    │
         └────────────────────┴────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  EXTERNAL APIs   │
                    ├──────────────────┤
                    │ • Stripe         │
                    │ • Google Gemini  │
                    │ • API.Bible      │
                    └──────────────────┘
```

---

## 3. Application Components

### 3.1 Dashboard (Church Admin Panel)

**Location:** `biblenotelm/dashboard/`
**URL:** https://church-biblenotelm.web.app
**Purpose:** Church administration and management

**Technology Stack:**
- React 19 with TypeScript
- Vite for build tooling
- Zustand for state management
- TailwindCSS for styling
- Firebase SDK (auth, firestore, functions)

**Key Features:**
```
✅ Church Management
   - Create/update church profile
   - Generate church codes
   - Manage church members

✅ Content Management
   - Create announcements
   - Schedule events
   - Upload images to Cloud Storage

✅ Member Management
   - View all members
   - Assign roles (member, pastor, admin)
   - Remove members

✅ Analytics Dashboard
   - Member growth
   - Event attendance
   - Subscription revenue

✅ Subscription Management
   - View subscription status
   - Upgrade/downgrade plans
   - Payment history
```

**Firebase Integration:**
```typescript
// App.tsx
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
```

**Communication with Backend:**
- ✅ Direct Firestore reads (real-time listeners)
- ✅ Cloud Functions calls via `getFunctions()`
- ✅ Firebase Auth for authentication
- ✅ Cloud Storage for image uploads

---

### 3.2 Mobile/Web App (Member App)

**Location:** `biblenotelm/mobile/`
**URL:** https://app-biblenotelm.web.app
**Purpose:** Member engagement and spiritual growth

**Technology Stack:**
- React 19 with TypeScript
- Vite for build tooling
- Capacitor for mobile native features
- PWA with Service Workers
- IndexedDB for offline storage
- Zustand for state management

**Key Features:**
```
✅ Bible Study
   - Multiple Bible versions (NIV, KJV, ESV)
   - Search functionality
   - Personal notes
   - Daily verse

✅ Sermon Library
   - Listen to sermons
   - Take notes during sermons
   - Download for offline

✅ Prayer Journal
   - Submit prayer requests
   - Pray for others
   - Mark prayers as answered
   - Privacy controls (public/church/private)

✅ Events
   - View upcoming events
   - Register for events
   - Add to calendar
   - Check-in at events

✅ Church Community
   - View announcements
   - Church directory
   - Connect with members
```

**Firebase Integration:**
```typescript
// firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
```

**Service Layer:**
- `announcementService.ts` - Announcement CRUD operations
- `churchService.ts` - Church data management
- `eventService.ts` - Event registration & attendance
- `prayerService.ts` - Prayer requests & responses
- `sermonService.ts` - Sermon playback & notes
- `userService.ts` - User profile management

**Communication with Backend:**
- ✅ Firestore real-time listeners for live updates
- ✅ Cloud Functions for complex operations
- ✅ Direct database writes (validated by Security Rules)
- ✅ Cloud Storage for media files

---

### 3.3 Backend (Cloud Functions)

**Location:** `biblenotelm/backend/functions/`
**Runtime:** Node.js 22
**Purpose:** Server-side business logic and security

**Technology Stack:**
- TypeScript
- Firebase Admin SDK
- Express.js (for HTTP endpoints)
- Stripe SDK (for payments)
- Joi (for validation)

**Total Functions:** 30+ endpoints

**Function Categories:**

#### **Authentication (5 functions)**
```typescript
✅ onUserCreate          // Auto-create user profile on sign-up
✅ onUserDelete          // GDPR cleanup on account deletion
✅ updateLastLogin       // Track user activity
✅ updateFcmToken        // Register for push notifications
✅ removeFcmToken        // Unregister device
```

#### **Church Management (6 functions)**
```typescript
✅ createChurch          // Create new church
✅ updateChurch          // Update church details
✅ getChurch             // Fetch church data
✅ getChurchMembers      // List all members
✅ joinChurch            // Join with church code
✅ leaveChurch           // Leave church
```

#### **Announcements (5 functions)**
```typescript
✅ createAnnouncement    // Create announcement (pastor only)
✅ updateAnnouncement    // Edit announcement
✅ deleteAnnouncement    // Remove announcement
✅ getChurchAnnouncements // Fetch all announcements
✅ getAnnouncement       // Get single announcement
```

#### **Events (8 functions)**
```typescript
✅ createEvent           // Create event (pastor only)
✅ updateEvent           // Edit event details
✅ deleteEvent           // Cancel event
✅ getChurchEvents       // List all events
✅ getEvent              // Get event details
✅ registerForEvent      // User registration
✅ cancelEventRegistration // Cancel registration
✅ getEventAttendees     // View attendees
```

#### **Prayers (7 functions)**
```typescript
✅ createPrayer          // Submit prayer request
✅ updatePrayer          // Edit prayer
✅ deletePrayer          // Remove prayer
✅ getPrayers            // Fetch prayers (filtered by visibility)
✅ getPrayer             // Get single prayer
✅ prayForRequest        // Mark "I prayed"
✅ getPrayingUsers       // Who prayed for this
```

#### **Subscriptions (5 functions)**
```typescript
✅ createSubscription    // Subscribe to paid plan
✅ cancelSubscription    // Cancel subscription
✅ getSubscriptionStatus // Check current plan
✅ stripeWebhook         // Handle Stripe events
✅ getAllSubscriptions   // Admin: view all subscriptions
```

#### **Admin Analytics (7 functions)**
```typescript
✅ getSystemStats        // Platform-wide statistics
✅ getChurchList         // All churches (super admin)
✅ getRevenueAnalytics   // Revenue reports
✅ getUserGrowthAnalytics // User growth trends
✅ getChurchActivities   // Activity logs
✅ getMemberData         // Member statistics
✅ getSermonContent      // Sermon analytics
```

#### **Scheduled Functions (3 functions)**
```typescript
✅ dailyCleanup          // Clean rate limits & audit logs
✅ weeklyAnalytics       // Generate analytics snapshots
✅ dailyPaymentReminders // Notify expiring subscriptions
```

---

## 4. Firebase Services

### 4.1 Firebase Authentication
**Purpose:** User identity and access management

**Features:**
- ✅ Google Sign-In
- ✅ Email/Password authentication
- ✅ JWT tokens for API security
- ✅ Role-based claims (custom tokens)

**User Lifecycle:**
```
1. User signs in → Firebase Auth creates user
2. onUserCreate trigger → Creates user document in Firestore
3. User joins church → Role updated to 'member'
4. Pastor promotes user → Role updated to 'admin'
```

---

### 4.2 Cloud Firestore (Database)
**Purpose:** Real-time NoSQL database

**Collections:**
```
firestore/
├── users/                    # User profiles
├── churches/                 # Church organizations
│   └── {churchId}/members/   # Church members (subcollection)
├── announcements/            # Church announcements
├── events/                   # Church events
│   └── {eventId}/attendees/  # Event registrations (subcollection)
├── prayers/                  # Prayer requests
│   └── {prayerId}/praying/   # Users who prayed (subcollection)
├── sermons/                  # Sermon recordings
│   └── {sermonId}/notes/     # Sermon notes (subcollection)
├── subscriptions/            # Stripe subscriptions
├── notifications/            # User notifications
├── audit_logs/               # Security & compliance logs
├── analytics/                # System analytics
│   └── weekly_snapshots/     # Historical data
└── rate_limits/              # API rate limiting
```

**Security:** All collections protected by Firestore Security Rules

---

### 4.3 Cloud Storage
**Purpose:** File storage (images, audio, documents)

**Buckets:**
```
gs://biblenotelm-6cf80.appspot.com/
├── announcements/      # Announcement images
├── events/             # Event images
├── sermons/            # Sermon audio files
├── churches/           # Church logos
└── users/              # User profile pictures
```

**Security:** Enforced by Storage Rules (in `storage.rules`)

---

### 4.4 Cloud Functions
**Purpose:** Backend API and business logic

**Triggers:**
- HTTP Callable Functions (API endpoints)
- Auth Triggers (onCreate, onDelete)
- Firestore Triggers (onChange events)
- Scheduled Functions (cron jobs)
- Storage Triggers (onFinalize)

---

### 4.5 Firebase Hosting
**Purpose:** Static website hosting

**Sites:**
- `church-biblenotelm.web.app` → Dashboard
- `app-biblenotelm.web.app` → Mobile/Web App

**Configuration:** `firebase.json`

---

## 5. Backend Cloud Functions

### Function Architecture

```
backend/functions/src/
├── index.ts                    # Main entry point (exports all functions)
├── auth/
│   └── triggers.ts            # Authentication triggers
├── church/
│   └── index.ts               # Church management
├── announcements/
│   └── index.ts               # Announcements CRUD
├── events/
│   └── index.ts               # Events management
├── prayers/
│   └── index.ts               # Prayer requests
├── subscriptions/
│   └── index.ts               # Stripe integration
├── admin/
│   └── analytics.ts           # Admin analytics
└── middleware/
    ├── auth.ts                # Authentication middleware
    ├── rateLimit.ts           # Rate limiting
    └── validation.ts          # Input validation
```

### Security Middleware

**Authentication:**
```typescript
export const requireAuth = async (context: CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  return context.auth.uid;
};
```

**Role Validation:**
```typescript
export const requireRole = async (userId: string, allowedRoles: string[]) => {
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userRole = userDoc.data()?.role;

  if (!allowedRoles.includes(userRole)) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }
};
```

**Rate Limiting:**
```typescript
export const rateLimit = async (userId: string, action: string, limit: number) => {
  // Check rate_limits collection
  // Allow `limit` requests per time window
  // Throw error if exceeded
};
```

---

## 6. Database Structure

See [FIRESTORE_DATABASE_STRUCTURE.md](biblenotelm/backend/docs/FIRESTORE_DATABASE_STRUCTURE.md) for complete schema.

### Key Collections:

**users**
```json
{
  "id": "user123",
  "email": "pastor@church.com",
  "displayName": "Pastor John",
  "role": "pastor",
  "churchId": "church001",
  "subscriptionTier": "premium",
  "createdAt": "2025-12-31T10:00:00Z"
}
```

**churches**
```json
{
  "id": "church001",
  "name": "Grace Community Church",
  "code": "GRACE123",
  "pastorId": "user123",
  "stats": {
    "memberCount": 150,
    "totalAnnouncements": 45,
    "totalEvents": 12
  }
}
```

**announcements**
```json
{
  "id": "ann001",
  "churchId": "church001",
  "title": "Youth Service This Sunday",
  "content": "Join us for...",
  "priority": "high",
  "imageUrl": "gs://...",
  "publishedAt": "2025-12-31T10:00:00Z"
}
```

**events**
```json
{
  "id": "event001",
  "churchId": "church001",
  "title": "Bible Study",
  "startDate": "2026-01-05T18:00:00Z",
  "category": "bible_study",
  "maxAttendees": 50,
  "currentAttendees": 23
}
```

**prayers**
```json
{
  "id": "prayer001",
  "userId": "user456",
  "title": "Healing for my mother",
  "content": "Please pray for...",
  "visibility": "church",
  "category": "healing",
  "prayerCount": 15,
  "isAnswered": false
}
```

---

## 7. Data Flow

### Example: Creating an Announcement

```
1. DASHBOARD (Admin clicks "Create Announcement")
   ↓
2. Form validation (client-side)
   ↓
3. Upload image to Cloud Storage (if any)
   ↓
4. Call Cloud Function: createAnnouncement()
   ↓
5. BACKEND validates:
   - User is authenticated
   - User is pastor/admin
   - User belongs to church
   - Input data is valid
   ↓
6. Write to Firestore: announcements/{id}
   ↓
7. Firestore triggers real-time listener in MOBILE APP
   ↓
8. MOBILE APP updates UI automatically
   ↓
9. Push notification sent to all church members
```

### Example: Joining a Church

```
1. MOBILE APP (User enters church code: "GRACE123")
   ↓
2. Call Cloud Function: joinChurch({ code: "GRACE123" })
   ↓
3. BACKEND:
   - Validates church code exists
   - Updates user document: churchId = "church001"
   - Updates church stats: memberCount++
   - Adds to churches/{id}/members/ subcollection
   - Creates audit log entry
   ↓
4. Real-time listener updates user profile in app
   ↓
5. User now sees church announcements, events, prayers
```

---

## 8. Security Architecture

### 8.1 Firestore Security Rules

**File:** `biblenotelm/backend/firestore.rules`

**Key Principles:**
- ✅ All reads/writes require authentication
- ✅ Role-based access control (RBAC)
- ✅ Church membership validation
- ✅ Privacy enforcement (users can only see their church data)
- ✅ Backend-only operations (critical writes)

**Example Rule:**
```javascript
match /announcements/{announcementId} {
  // Members can read announcements for their church
  allow read: if isAuthenticated() &&
                belongsToChurch(resource.data.churchId);

  // Only pastors can create announcements
  allow create: if isAuthenticated() &&
                  isPastor() &&
                  belongsToChurch(request.resource.data.churchId);
}
```

---

### 8.2 Storage Security Rules

**File:** `biblenotelm/backend/storage.rules`

**Protections:**
- ✅ Authenticated uploads only
- ✅ File size limits
- ✅ File type validation (images, audio)
- ✅ Church ownership validation

---

### 8.3 Function Security

**Middleware Stack:**
```typescript
1. Authentication Check (requireAuth)
2. Role Validation (requireRole)
3. Rate Limiting (rateLimit)
4. Input Validation (validateInput)
5. Business Logic
6. Audit Logging
```

---

## 9. Deployment Architecture

### 9.1 Environments

**Production:**
- Firebase Project: `biblenotelm-6cf80`
- Dashboard: https://church-biblenotelm.web.app
- Mobile App: https://app-biblenotelm.web.app
- Functions: us-central1

**Local Development:**
- Firebase Emulators
  - Firestore: `localhost:8080`
  - Auth: `localhost:9099`
  - Functions: `localhost:5001`
  - Storage: `localhost:9199`
  - Hosting: `localhost:5000`
  - Emulator UI: `localhost:4000`

---

### 9.2 CI/CD Pipeline

**Build Process:**
```bash
# Dashboard
cd biblenotelm/dashboard
npm run build
# Output: dist/

# Mobile App
cd biblenotelm/mobile
npm run build
# Output: dist/

# Backend Functions
cd biblenotelm/backend/functions
npm run build
# Output: lib/
```

**Deploy Process:**
```bash
# From backend directory
firebase deploy --only functions    # Deploy Cloud Functions
firebase deploy --only firestore    # Deploy Firestore rules
firebase deploy --only storage      # Deploy Storage rules
firebase deploy --only hosting:dashboard  # Deploy Dashboard
firebase deploy --only hosting:app        # Deploy Mobile App
```

---

## 10. Key Integration Points

### 10.1 Dashboard ↔ Backend

**Communication Method:** Cloud Functions + Firestore

**How it works:**
1. Dashboard calls Cloud Functions for write operations
2. Dashboard uses Firestore listeners for real-time data
3. Firebase Auth provides user identity

**Example:**
```typescript
// Dashboard calling backend function
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const createChurch = httpsCallable(functions, 'createChurch');

const result = await createChurch({
  name: 'Grace Community Church',
  description: 'A welcoming church'
});
```

---

### 10.2 Mobile App ↔ Backend

**Communication Method:** Direct Firestore + Cloud Functions

**How it works:**
1. Mobile app reads directly from Firestore (fast, real-time)
2. Mobile app calls Cloud Functions for complex operations
3. Firestore Security Rules enforce permissions

**Example:**
```typescript
// Mobile app reading announcements
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const q = query(
  collection(db, 'announcements'),
  where('churchId', '==', userChurchId)
);

onSnapshot(q, (snapshot) => {
  const announcements = snapshot.docs.map(doc => doc.data());
  // UI updates automatically
});
```

---

### 10.3 Backend ↔ External APIs

**Stripe Integration:**
```typescript
// subscriptions/index.ts
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const createSubscription = async (userId: string, tier: string) => {
  const customer = await stripe.customers.create({ email: userEmail });
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }]
  });
  // Save to Firestore
};
```

**Google Gemini AI:**
```typescript
// Used in mobile app for sermon insights
import { GoogleGenerativeAI } from '@google/genai';

const genAI = new GoogleGenerativeAI(apiKey);
const response = await genAI.generateContent(prompt);
```

---

## Summary

### ✅ **What's Working:**
1. **Dashboard** connects to Firebase (auth, firestore, functions)
2. **Mobile App** connects to Firebase with service layer
3. **Backend** has 30+ Cloud Functions for all operations
4. **Database** structure is fully defined in Firestore rules
5. **Security** is enforced at database, storage, and function levels

### ⚠️ **What Needs Setup:**
1. `.env` files with Firebase credentials (dashboard & mobile)
2. Firestore indexes in `firestore.indexes.json`
3. Deploy Cloud Functions to production
4. Test complete data flow end-to-end

### 📊 **Data Flow:**
- Dashboard → Cloud Functions → Firestore ← Mobile App
- All apps share same Firestore database
- Real-time sync via Firestore listeners
- Cloud Functions enforce business logic & security

---

**This architecture ensures:**
- ✅ Scalability (Firebase handles all infrastructure)
- ✅ Security (multi-layer protection)
- ✅ Real-time sync (Firestore listeners)
- ✅ Privacy (church data isolation)
- ✅ Maintainability (clean separation of concerns)
