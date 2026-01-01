/**
 * Type definitions for BibleNoteLM Cloud Functions
 */

import { Timestamp } from 'firebase-admin/firestore';

// ============================================
// USER ROLES & PERMISSIONS
// ============================================

export type UserRole = 'guest' | 'member' | 'subscriber' | 'pastor' | 'admin' | 'super_admin';

export interface UserDocument {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  churchId?: string;
  subscriptionTier: 'free' | 'basic' | 'premium';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// CHURCH
// ============================================

export interface ChurchDocument {
  id: string;
  name: string;
  code: string;
  pastorId: string;
  adminIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

// ============================================
// SUBSCRIPTION
// ============================================

export interface SubscriptionDocument {
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

// ============================================
// AUDIT LOG
// ============================================

export interface AuditLogEntry {
  userId: string;
  action: 'READ' | 'WRITE' | 'DELETE' | 'ACCESS_DENIED';
  collection: string;
  documentId?: string;
  result: 'SUCCESS' | 'DENIED' | 'ERROR';
  requiredRoles?: UserRole[];
  metadata?: Record<string, any>;
  timestamp: Timestamp;
  ipAddress?: string;
}

// ============================================
// ANALYTICS (Anonymized)
// ============================================

export interface SystemAnalytics {
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

// ============================================
// CLOUD FUNCTION CONTEXT
// ============================================

export interface AuthContext {
  uid: string;
  email?: string;
  token: {
    email?: string;
    email_verified?: boolean;
  };
}

export interface FunctionContext {
  auth?: AuthContext;
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

// ============================================
// STRIPE TYPES
// ============================================

export interface StripeSubscriptionData {
  priceId: string;
  tier: 'basic' | 'premium';
  paymentMethodId?: string;
}

export interface StripeWebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

// ============================================
// ANNOUNCEMENTS
// ============================================

export interface AnnouncementDocument {
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
  imageUrl?: string;        // URL to uploaded image
  imagePath?: string;       // Storage path for deletion
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// EVENTS
// ============================================

export interface EventDocument {
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

export interface EventAttendeeDocument {
  userId: string;
  userName: string;
  status: 'registered' | 'attended' | 'cancelled';
  registeredAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// PRAYERS
// ============================================

export interface PrayerDocument {
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

export interface PrayingUserDocument {
  userId: string;
  userName: string;
  prayedAt: Timestamp;
}
