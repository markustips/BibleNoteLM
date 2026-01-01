
import React from 'react';

// RBAC Types
export type UserRole = 'guest' | 'member' | 'subscriber' | 'pastor' | 'admin' | 'super_admin';

export type SubscriptionTier = 'free' | 'basic' | 'premium';

export interface User {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  churchId?: string;
  churchCode?: string;
}

export interface Church {
  id: string;
  name: string;
  code: string;
  logo?: string;
  address?: string;
  adminIds: string[];
  pastorIds: string[];
  memberIds: string[];
  createdAt: string;
}

export interface Announcement {
  id: string;
  churchId: string;
  title: string;
  content: string;
  image?: string;
  category: 'General' | 'Community' | 'Youth' | 'Series' | 'Urgent';
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  duration: string;
  audioUrl?: string;
  transcript?: string;
  summary?: string;
}

export interface BibleVerse {
  reference: string;
  text: string;
  translation: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: 'Service' | 'Community' | 'Youth' | 'Outreach';
}

export interface PrayerRequest {
  id: string;
  author: string;
  authorId?: string;
  churchId?: string;
  content: string;
  date: string;
  prayedCount: number;
  category?: 'Healing' | 'Guidance' | 'Family' | 'Praise' | 'Other';
  isAnswered?: boolean;
  isAnonymous?: boolean;
  isMine?: boolean;
  isPublic?: boolean; // true = visible to all, false = church members only
}

// Permission helpers
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  // Guest: No church affiliation - can only access daily verse and subscribe for AI features
  guest: ['view_daily_verse', 'view_bible'],

  // Member: Has joined a church - can access church content
  member: ['view_daily_verse', 'view_bible', 'view_church_content', 'view_announcements', 'view_events', 'view_prayer_requests', 'create_prayer_request'],

  // Subscriber: Paid member - gets AI features, sermon recording, note-taking
  subscriber: ['view_daily_verse', 'view_bible', 'view_church_content', 'view_announcements', 'view_events', 'view_prayer_requests', 'create_prayer_request', 'record_sermon', 'ai_features', 'ai_sermon_summary', 'take_notes'],

  // Pastor: Church leader - can manage content
  pastor: ['view_daily_verse', 'view_bible', 'view_church_content', 'view_announcements', 'view_events', 'view_prayer_requests', 'create_prayer_request', 'record_sermon', 'ai_features', 'ai_sermon_summary', 'take_notes', 'manage_announcements', 'manage_events', 'manage_prayers', 'view_members'],

  // Admin: Church administrator - full church management
  admin: ['view_daily_verse', 'view_bible', 'view_church_content', 'view_announcements', 'view_events', 'view_prayer_requests', 'create_prayer_request', 'record_sermon', 'ai_features', 'ai_sermon_summary', 'take_notes', 'manage_announcements', 'manage_events', 'manage_prayers', 'view_members', 'manage_church', 'manage_roles', 'manage_subscriptions'],

  // Super Admin: Platform owner - full platform access
  super_admin: ['view_daily_verse', 'view_bible', 'view_church_content', 'view_announcements', 'view_events', 'view_prayer_requests', 'create_prayer_request', 'record_sermon', 'ai_features', 'ai_sermon_summary', 'take_notes', 'manage_announcements', 'manage_events', 'manage_prayers', 'view_members', 'manage_church', 'manage_roles', 'manage_subscriptions', 'view_all_churches', 'view_all_subscribers', 'view_system_analytics', 'manage_platform'],
};

export const hasPermission = (role: UserRole, permission: string): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};

export interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export const BIBLE_VERSIONS = [
  { id: 'kjv', name: 'King James Version', short: 'KJV', size: '4.2 MB' },
  { id: 'web', name: 'World English Bible', short: 'WEB', size: '4.5 MB' },
  { id: 'asv', name: 'American Standard Version', short: 'ASV', size: '4.1 MB' },
  { id: 'bbe', name: 'Bible in Basic English', short: 'BBE', size: '3.8 MB' },
];
