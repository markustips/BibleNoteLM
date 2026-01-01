/**
 * Firebase Services Index
 * Export all Firebase services and types
 */

// Config
export { db, auth, storage, initAnalytics } from './config';

// Auth Service
export * from './authService';

// Database Services
export * from './services/userService';
export * from './services/churchService';
export * from './services/announcementService';
export * from './services/prayerService';
export * from './services/sermonService';
export * from './services/eventService';

// Schema Types
export type {
  UserDocument,
  ChurchDocument,
  ChurchMemberDocument,
  AnnouncementDocument,
  EventDocument,
  EventAttendeeDocument,
  SermonDocument,
  SermonNoteDocument,
  PrayerDocument,
  PrayingUserDocument,
  SubscriptionDocument,
  InvoiceDocument,
  NotificationDocument,
  BibleNoteDocument
} from './schema';
