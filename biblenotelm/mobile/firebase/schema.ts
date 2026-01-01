/**
 * Firebase Firestore Database Schema
 * BibleNoteLM - Church Community App
 * 
 * Collections Structure:
 * - users
 * - churches
 * - announcements
 * - events
 * - sermons
 * - prayers
 * - subscriptions
 * - notifications
 */

import { Timestamp } from 'firebase/firestore';

// ============================================
// USER SCHEMA
// Collection: /users/{userId}
// ============================================
export interface UserDocument {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  
  // Role & Permissions
  role: 'guest' | 'member' | 'subscriber' | 'pastor' | 'admin';
  
  // Church Membership
  churchId?: string;
  churchCode?: string;
  churchName?: string;
  churchJoinedAt?: Timestamp;
  
  // Subscription
  subscriptionTier: 'free' | 'basic' | 'premium';
  subscriptionStatus: 'active' | 'cancelled' | 'expired' | 'trial';
  subscriptionStartDate?: Timestamp;
  subscriptionEndDate?: Timestamp;
  stripeCustomerId?: string;
  
  // App Preferences
  preferences: {
    notifications: boolean;
    darkMode: boolean;
    bibleVersion: string;
    fontSize: 'small' | 'medium' | 'large';
    language: string;
  };
  
  // Statistics
  stats: {
    sermonsRecorded: number;
    prayersSubmitted: number;
    eventsAttended: number;
    lastActiveAt: Timestamp;
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
  fcmTokens: string[]; // For push notifications
}

// ============================================
// CHURCH SCHEMA
// Collection: /churches/{churchId}
// ============================================
export interface ChurchDocument {
  id: string;
  name: string;
  code: string; // Unique join code (e.g., "GRACE2024")
  description?: string;
  
  // Contact & Location
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone?: string;
  email?: string;
  website?: string;
  
  // Branding
  logoURL?: string;
  bannerURL?: string;
  primaryColor?: string;
  
  // Leadership
  pastorId: string; // User ID of main pastor
  adminIds: string[]; // User IDs with admin access
  
  // Statistics
  stats: {
    memberCount: number;
    activeMembers: number;
    totalSermons: number;
    totalPrayers: number;
    totalEvents: number;
  };
  
  // Settings
  settings: {
    allowGuestPrayers: boolean;
    requireApproval: boolean; // For new members
    publicListing: boolean; // Show in church directory
    enableChat: boolean;
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

// Subcollection: /churches/{churchId}/members/{memberId}
export interface ChurchMemberDocument {
  userId: string;
  role: 'member' | 'leader' | 'pastor' | 'admin';
  joinedAt: Timestamp;
  invitedBy?: string;
  isActive: boolean;
  lastActiveAt: Timestamp;
}

// ============================================
// ANNOUNCEMENT SCHEMA
// Collection: /announcements/{announcementId}
// ============================================
export interface AnnouncementDocument {
  id: string;
  churchId: string;
  authorId: string;
  authorName: string;
  
  title: string;
  content: string;
  imageURL?: string;
  
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category?: 'general' | 'event' | 'prayer' | 'sermon' | 'urgent';
  
  // Scheduling
  publishAt?: Timestamp;
  expiresAt?: Timestamp;
  
  // Targeting
  targetRoles?: ('member' | 'subscriber' | 'pastor' | 'admin')[];
  
  // Engagement
  viewCount: number;
  
  // Status
  isActive: boolean;
  isPinned: boolean;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// EVENT SCHEMA
// Collection: /events/{eventId}
// ============================================
export interface EventDocument {
  id: string;
  churchId: string;
  authorId: string;
  
  title: string;
  description: string;
  imageURL?: string;
  
  // Date & Time
  startDate: Timestamp;
  endDate?: Timestamp;
  isAllDay: boolean;
  timezone: string;
  
  // Recurrence
  recurrence?: {
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Timestamp;
    daysOfWeek?: number[]; // 0-6 for weekly
  };
  
  // Location
  location?: {
    name: string;
    address?: string;
    isOnline: boolean;
    meetingLink?: string;
  };
  
  // Registration
  requiresRegistration: boolean;
  maxAttendees?: number;
  registeredCount: number;
  
  // Category
  category: 'service' | 'study' | 'youth' | 'worship' | 'outreach' | 'social' | 'other';
  
  // Status
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  isActive: boolean;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Subcollection: /events/{eventId}/attendees/{userId}
export interface EventAttendeeDocument {
  userId: string;
  userName: string;
  status: 'registered' | 'attended' | 'cancelled' | 'no-show';
  registeredAt: Timestamp;
  attendedAt?: Timestamp;
  notes?: string;

  // Calendar Sync - allows syncing to user's external calendar
  calendarSync?: {
    googleCalendarEventId?: string;   // Google Calendar event ID
    outlookEventId?: string;          // Outlook/Microsoft Calendar event ID
    appleCalendarId?: string;         // Apple Calendar event ID
    isSynced: boolean;
    lastSyncedAt?: Timestamp;
  };
}

// ============================================
// LOCAL USER DATA SCHEMA
// NOTE: These are stored LOCALLY on device to reduce cloud storage costs
// Images, personal preferences, and cached data stay on device
// ============================================

// Local-only: User's personal event reminders (not synced to cloud)
export interface LocalEventReminder {
  id: string;
  eventId: string;                    // Reference to cloud event
  eventTitle: string;
  eventStartDate: string;             // ISO date string

  // Reminder settings
  reminderMinutesBefore: number;      // e.g., 15, 30, 60, 1440 (1 day)
  isEnabled: boolean;

  // Local notification ID for cancellation
  localNotificationId?: number;

  // Calendar sync status
  addedToDeviceCalendar: boolean;
  deviceCalendarEventId?: string;     // Native calendar event ID

  createdAt: string;
}

// Local-only: User's saved event images (to avoid cloud storage costs)
export interface LocalEventImage {
  id: string;
  eventId: string;
  localFilePath: string;              // Path on device filesystem
  thumbnailPath?: string;             // Compressed thumbnail for lists
  originalUrl?: string;               // Original cloud URL if downloaded
  downloadedAt: string;
}

// Local-only: User's personal calendar preferences
export interface LocalCalendarSettings {
  defaultCalendarAccount?: string;    // User's preferred calendar
  syncToGoogleCalendar: boolean;
  syncToOutlook: boolean;
  syncToAppleCalendar: boolean;
  defaultReminderMinutes: number;     // Default reminder time
  autoSyncNewEvents: boolean;         // Automatically sync when registering
}

// ============================================
// SERMON SCHEMA
// Collection: /sermons/{sermonId}
// NOTE: Audio files are stored LOCALLY on device, not in Firebase
// Only metadata and thumbnails are stored in Firebase
// ============================================
export interface SermonDocument {
  id: string;
  userId: string;
  churchId?: string;
  
  // Content
  title: string;
  speaker?: string;
  description?: string;
  
  // Media - Audio is LOCAL, thumbnail in Firebase Storage
  // audioURL is NOT used - audio stored locally on device
  thumbnailURL?: string;
  duration: number; // in seconds
  
  // Local Storage Reference (for syncing across devices)
  hasLocalAudio: boolean;
  localAudioPath?: string; // Path on device filesystem
  
  // Transcription
  transcript?: string;
  transcriptStatus: 'pending' | 'processing' | 'completed' | 'failed';
  
  // AI Generated Content
  aiSummary?: string;
  aiKeyPoints?: string[];
  aiScriptureReferences?: {
    reference: string;
    text: string;
  }[];
  aiTopics?: string[];
  
  // Bible References
  scriptureReferences?: string[]; // e.g., ["John 3:16", "Romans 8:28"]
  
  // Engagement
  playCount: number;
  likeCount: number;
  shareCount: number;
  
  // Status
  isPublic: boolean;
  isProcessing: boolean;
  
  // Metadata
  recordedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Subcollection: /sermons/{sermonId}/notes/{noteId}
export interface SermonNoteDocument {
  id: string;
  userId: string;
  content: string;
  timestamp?: number; // Position in sermon (seconds)
  highlightColor?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// PRAYER SCHEMA
// Collection: /prayers/{prayerId}
// ============================================
export interface PrayerDocument {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  churchId?: string;
  
  // Content
  title: string;
  content: string;
  category: 'health' | 'family' | 'financial' | 'spiritual' | 'work' | 'relationships' | 'thanksgiving' | 'other';
  
  // Privacy
  isAnonymous: boolean;
  visibility: 'public' | 'church' | 'private';
  
  // Status
  status: 'active' | 'answered' | 'closed';
  answeredAt?: Timestamp;
  answeredNote?: string;
  
  // Engagement
  prayerCount: number; // How many people prayed for this
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt?: Timestamp;
}

// Subcollection: /prayers/{prayerId}/praying/{userId}
export interface PrayingUserDocument {
  userId: string;
  userName: string;
  prayedAt: Timestamp;
  message?: string;
}

// ============================================
// SUBSCRIPTION SCHEMA
// Collection: /subscriptions/{subscriptionId}
// ============================================
export interface SubscriptionDocument {
  id: string;
  userId: string;
  
  // Plan Details
  tier: 'free' | 'basic' | 'premium';
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'trial';
  
  // Billing
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  
  // Stripe Integration
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  stripePriceId?: string;
  stripePaymentMethodId?: string;
  
  // Dates
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  trialStart?: Timestamp;
  trialEnd?: Timestamp;
  cancelledAt?: Timestamp;
  cancelReason?: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Subcollection: /subscriptions/{subscriptionId}/invoices/{invoiceId}
export interface InvoiceDocument {
  id: string;
  stripeInvoiceId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  paidAt?: Timestamp;
  invoiceURL?: string;
  receiptURL?: string;
  createdAt: Timestamp;
}

// ============================================
// NOTIFICATION SCHEMA
// Collection: /notifications/{notificationId}
// ============================================
export interface NotificationDocument {
  id: string;
  userId: string;
  
  type: 'announcement' | 'event' | 'prayer' | 'sermon' | 'subscription' | 'system';
  
  title: string;
  body: string;
  imageURL?: string;
  
  // Action
  actionType?: 'navigate' | 'open_url' | 'none';
  actionData?: {
    route?: string;
    url?: string;
    params?: Record<string, string>;
  };
  
  // Status
  isRead: boolean;
  readAt?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

// ============================================
// BIBLE NOTES, HIGHLIGHTS & BOOKMARKS SCHEMA
// NOTE: These are stored LOCALLY on device only, NOT in Firebase
// Use localStorageService for these features
// ============================================

// Local-only interface (stored via Capacitor Preferences)
export interface LocalBibleNote {
  id: string;
  
  // Reference
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  version: string;
  
  // Content
  note: string;
  
  // Tags
  tags?: string[];
  
  // Metadata
  createdAt: string; // ISO date string
  updatedAt: string;
}

// Local-only interface for verse highlights
export interface LocalHighlight {
  id: string;
  
  // Reference
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  version: string;
  
  // Highlight
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'orange';
  
  // Metadata
  createdAt: string;
}

// Local-only interface for bookmarks
export interface LocalBookmark {
  id: string;
  
  // Reference
  book: string;
  chapter: number;
  verse?: number;
  version: string;
  
  // Optional label
  label?: string;
  
  // Metadata
  createdAt: string;
}

// ============================================
// FIRESTORE SECURITY RULES REFERENCE
// ============================================
export const SECURITY_RULES_REFERENCE = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    function isAdmin() {
      return getUserRole() == 'admin';
    }
    
    function isPastor() {
      return getUserRole() in ['pastor', 'admin'];
    }
    
    function isChurchMember(churchId) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.churchId == churchId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
      
      match /bibleNotes/{noteId} {
        allow read, write: if isOwner(userId);
      }
    }
    
    // Churches collection
    match /churches/{churchId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isPastor();
      allow update: if isChurchMember(churchId) && isPastor();
      allow delete: if isAdmin();
      
      match /members/{memberId} {
        allow read: if isChurchMember(churchId);
        allow write: if isChurchMember(churchId) && isPastor();
      }
    }
    
    // Announcements collection
    match /announcements/{announcementId} {
      allow read: if isAuthenticated() && 
        (resource.data.churchId == null || isChurchMember(resource.data.churchId));
      allow create, update: if isPastor();
      allow delete: if isAdmin();
    }
    
    // Events collection
    match /events/{eventId} {
      allow read: if isAuthenticated();
      allow create, update: if isPastor();
      allow delete: if isAdmin();
      
      match /attendees/{userId} {
        allow read: if isAuthenticated();
        allow write: if isOwner(userId) || isPastor();
      }
    }
    
    // Sermons collection
    match /sermons/{sermonId} {
      allow read: if isAuthenticated() && 
        (resource.data.isPublic == true || isOwner(resource.data.userId));
      allow create: if isAuthenticated();
      allow update, delete: if isOwner(resource.data.userId) || isPastor();
      
      match /notes/{noteId} {
        allow read, write: if isAuthenticated();
      }
    }
    
    // Prayers collection
    match /prayers/{prayerId} {
      allow read: if isAuthenticated() && 
        (resource.data.visibility == 'public' || 
         isOwner(resource.data.userId) || 
         (resource.data.visibility == 'church' && isChurchMember(resource.data.churchId)));
      allow create: if isAuthenticated();
      allow update: if isOwner(resource.data.userId);
      allow delete: if isOwner(resource.data.userId) || isPastor();
      
      match /praying/{userId} {
        allow read: if isAuthenticated();
        allow write: if isOwner(userId);
      }
    }
    
    // Subscriptions collection
    match /subscriptions/{subscriptionId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow create, update: if isAdmin(); // Only backend/admin can manage
      allow delete: if isAdmin();
      
      match /invoices/{invoiceId} {
        allow read: if isOwner(get(/databases/$(database)/documents/subscriptions/$(subscriptionId)).data.userId);
      }
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      allow read, update: if isOwner(resource.data.userId);
      allow create: if isAdmin(); // Only backend can create
      allow delete: if isOwner(resource.data.userId) || isAdmin();
    }
  }
}
`;

// ============================================
// INDEXES REFERENCE
// ============================================
export const INDEXES_REFERENCE = `
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "announcements",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "churchId", "order": "ASCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "churchId", "order": "ASCENDING" },
        { "fieldPath": "startDate", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "sermons",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "sermons",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "churchId", "order": "ASCENDING" },
        { "fieldPath": "isPublic", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "prayers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "churchId", "order": "ASCENDING" },
        { "fieldPath": "visibility", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "isRead", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
`;
