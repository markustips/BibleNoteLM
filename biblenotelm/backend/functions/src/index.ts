/**
 * BibleNoteLM Cloud Functions
 * Main entry point for all backend functions
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin with storage bucket
admin.initializeApp({
  storageBucket: 'biblenotelm-6cf80.appspot.com'
});

// ============================================
// EXPORT AUTH FUNCTIONS
// ============================================

export {
  onUserCreate,
  onUserDelete,
  updateLastLogin,
  updateFcmToken,
  removeFcmToken,
} from './auth/triggers';

// ============================================
// EXPORT CHURCH FUNCTIONS
// ============================================

export {
  createChurch,
  updateChurch,
  getChurch,
  getChurchMembers,
  joinChurch,
  leaveChurch,
} from './church';

// ============================================
// EXPORT SUBSCRIPTION FUNCTIONS
// ============================================

export {
  createSubscription,
  cancelSubscription,
  getSubscriptionStatus,
  stripeWebhook,
  getAllSubscriptions,
} from './subscriptions';

// ============================================
// EXPORT ADMIN/ANALYTICS FUNCTIONS
// ============================================

export {
  getSystemStats,
  getChurchList,
  getRevenueAnalytics,
  getUserGrowthAnalytics,
  getChurchActivities,
  getMemberData,
  getSermonContent,
} from './admin/analytics';

// ============================================
// EXPORT ANNOUNCEMENTS FUNCTIONS
// ============================================

export {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getChurchAnnouncements,
  getAnnouncement,
} from './announcements';

// ============================================
// EXPORT EVENTS FUNCTIONS
// ============================================

export {
  createEvent,
  updateEvent,
  deleteEvent,
  getChurchEvents,
  getEvent,
  registerForEvent,
  cancelEventRegistration,
  getEventAttendees,
} from './events';

// ============================================
// EXPORT PRAYERS FUNCTIONS
// ============================================

export {
  createPrayer,
  updatePrayer,
  deletePrayer,
  getPrayers,
  getPrayer,
  prayForRequest,
  getPrayingUsers,
} from './prayers';

// ============================================
// EXPORT DAILY VERSE FUNCTIONS
// ============================================

export {
  saveDailyVerse,
  deleteDailyVerse,
  getDailyVerse,
  getVerseCalendar,
  setChurchTheme,
  toggleAutoGenerate,
  getChurchTheme,
} from './verses';

// ============================================
// SCHEDULED FUNCTIONS
// ============================================

import * as functions from 'firebase-functions';
import { cleanupRateLimits } from './middleware/rateLimit';

/**
 * Clean up old rate limit records daily
 */
export const dailyCleanup = functions.pubsub
  .schedule('0 0 * * *') // Run at midnight every day
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Running daily cleanup...');

    try {
      // Cleanup rate limits
      await cleanupRateLimits();

      // Cleanup old audit logs (keep last 365 days for compliance)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 365);

      const oldLogs = await admin
        .firestore()
        .collection('audit_logs')
        .where('timestamp', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
        .limit(500) // Process in batches
        .get();

      const batch = admin.firestore().batch();
      oldLogs.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      console.log(`Cleaned up ${oldLogs.size} old audit logs`);

      // Check for expired subscriptions
      const now = admin.firestore.Timestamp.now();
      const expiredSubs = await admin
        .firestore()
        .collection('subscriptions')
        .where('currentPeriodEnd', '<', now)
        .where('status', '==', 'active')
        .get();

      const batch2 = admin.firestore().batch();
      expiredSubs.docs.forEach((doc) => {
        batch2.update(doc.ref, {
          status: 'expired',
          updatedAt: now,
        });
      });
      await batch2.commit();

      console.log(`Expired ${expiredSubs.size} subscriptions`);

      return { success: true, cleaned: oldLogs.size, expired: expiredSubs.size };
    } catch (error) {
      console.error('Daily cleanup error:', error);
      throw error;
    }
  });

/**
 * Generate system analytics snapshot weekly
 */
export const weeklyAnalytics = functions.pubsub
  .schedule('0 0 * * 0') // Run at midnight every Sunday
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Generating weekly analytics...');

    try {
      // Get system stats
      const [churchesSnapshot, usersSnapshot, subsSnapshot] = await Promise.all([
        admin.firestore().collection('churches').where('isActive', '==', true).get(),
        admin.firestore().collection('users').get(),
        admin.firestore().collection('subscriptions').where('status', '==', 'active').get(),
      ]);

      // Calculate revenue
      const subscriptionsByTier = { free: 0, basic: 0, premium: 0 };
      let monthlyRevenue = 0;
      const pricing = { basic: 9.99, premium: 29.99 };

      subsSnapshot.docs.forEach((doc) => {
        const tier = doc.data().tier || 'free';
        subscriptionsByTier[tier as keyof typeof subscriptionsByTier]++;

        if (tier in pricing) {
          monthlyRevenue += pricing[tier as 'basic' | 'premium'];
        }
      });

      // Save weekly snapshot
      await admin
        .firestore()
        .collection('analytics')
        .doc('weekly_snapshots')
        .collection('snapshots')
        .add({
          week: new Date().toISOString().split('T')[0],
          totalChurches: churchesSnapshot.size,
          totalUsers: usersSnapshot.size,
          activeSubscriptions: subsSnapshot.size,
          subscriptionsByTier,
          monthlyRevenue,
          timestamp: admin.firestore.Timestamp.now(),
        });

      console.log('Weekly analytics snapshot created');

      return { success: true };
    } catch (error) {
      console.error('Weekly analytics error:', error);
      throw error;
    }
  });

/**
 * Send payment reminder notifications
 */
export const dailyPaymentReminders = functions.pubsub
  .schedule('0 9 * * *') // Run at 9 AM every day
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Checking for payment reminders...');

    try {
      // Find subscriptions expiring in 3 days
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const expiringSoon = await admin
        .firestore()
        .collection('subscriptions')
        .where('status', '==', 'active')
        .where(
          'currentPeriodEnd',
          '<=',
          admin.firestore.Timestamp.fromDate(threeDaysFromNow)
        )
        .get();

      console.log(`Found ${expiringSoon.size} subscriptions expiring soon`);

      // TODO: Send email/push notifications to users
      // This would integrate with SendGrid or Firebase Cloud Messaging

      return { success: true, reminders: expiringSoon.size };
    } catch (error) {
      console.error('Payment reminders error:', error);
      throw error;
    }
  });
