/**
 * Super Admin Analytics Functions
 * Privacy-compliant system analytics (NO individual church activities)
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  requireAuth,
  requireSuperAdmin,
  enforceSuperAdminPrivacy,
  logDataAccess,
} from '../middleware/auth';
import { SystemAnalytics } from '../types';

// ============================================
// GET SYSTEM STATISTICS
// ============================================

/**
 * Get aggregated system statistics
 * PRIVACY: Only aggregated, anonymized data - NO individual church details
 */
export const getSystemStats = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);

  // ONLY super admin can access
  await requireSuperAdmin(userId);

  // Get aggregated counts
  const [churchesSnapshot, usersSnapshot, activeSubsSnapshot] = await Promise.all([
    admin.firestore().collection('churches').where('isActive', '==', true).get(),
    admin.firestore().collection('users').get(),
    admin
      .firestore()
      .collection('subscriptions')
      .where('status', '==', 'active')
      .get(),
  ]);

  // Calculate subscription breakdown
  const subscriptionsByTier = {
    free: 0,
    basic: 0,
    premium: 0,
  };

  let monthlyRevenue = 0;

  activeSubsSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    const tier = data.tier || 'free';
    subscriptionsByTier[tier as keyof typeof subscriptionsByTier]++;

    // Calculate revenue (example pricing)
    const pricing = { basic: 9.99, premium: 29.99 };
    if (tier in pricing) {
      monthlyRevenue += pricing[tier as 'basic' | 'premium'];
    }
  });

  const stats: SystemAnalytics = {
    totalChurches: churchesSnapshot.size,
    totalUsers: usersSnapshot.size,
    activeSubscriptions: activeSubsSnapshot.size,
    subscriptionsByTier,
    monthlyRevenue,
    timestamp: admin.firestore.Timestamp.now(),
  };

  // Save analytics snapshot
  await admin.firestore().collection('analytics').doc('system_stats').set(
    {
      latest: stats,
      updatedAt: admin.firestore.Timestamp.now(),
    },
    { merge: true }
  );

  // Log the action
  await logDataAccess(userId, 'READ', 'analytics', 'system_stats');

  return {
    success: true,
    data: stats,
  };
});

// ============================================
// GET CHURCH LIST (Aggregated Only)
// ============================================

/**
 * Get list of churches (name and stats only, NO activities)
 */
export const getChurchList = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);

  // ONLY super admin can access
  await requireSuperAdmin(userId);

  const { page = 1, limit = 50 } = data;

  const snapshot = await admin
    .firestore()
    .collection('churches')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  // Return ONLY basic info - NO church activities
  const churches = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      code: data.code,
      createdAt: data.createdAt,
      isActive: data.isActive,
      stats: {
        memberCount: data.stats?.memberCount || 0,
        activeMembers: data.stats?.activeMembers || 0,
      },
      // NO sermons, events, prayers, or member activities
    };
  });

  // Log the action
  await logDataAccess(userId, 'READ', 'churches', undefined, {
    action: 'get_church_list',
    count: churches.length,
  });

  return {
    success: true,
    data: churches,
    pagination: {
      page,
      limit,
      total: snapshot.size,
    },
  };
});

// ============================================
// GET REVENUE ANALYTICS
// ============================================

export const getRevenueAnalytics = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);

  // ONLY super admin can access
  await requireSuperAdmin(userId);

  const { startDate, endDate } = data;

  let query = admin
    .firestore()
    .collection('subscriptions')
    .where('status', 'in', ['active', 'cancelled']);

  if (startDate) {
    query = query.where('createdAt', '>=', admin.firestore.Timestamp.fromDate(new Date(startDate))) as any;
  }

  if (endDate) {
    query = query.where('createdAt', '<=', admin.firestore.Timestamp.fromDate(new Date(endDate))) as any;
  }

  const snapshot = await query.get();

  // Calculate revenue metrics
  const metrics = {
    totalSubscriptions: snapshot.size,
    activeSubscriptions: 0,
    cancelledSubscriptions: 0,
    monthlyRecurringRevenue: 0,
    annualRecurringRevenue: 0,
    byTier: {
      basic: { count: 0, mrr: 0 },
      premium: { count: 0, mrr: 0 },
    },
  };

  const pricing = { basic: 9.99, premium: 29.99 };

  snapshot.docs.forEach((doc) => {
    const data = doc.data();

    if (data.status === 'active') {
      metrics.activeSubscriptions++;
    } else if (data.status === 'cancelled') {
      metrics.cancelledSubscriptions++;
    }

    const tier = data.tier as 'basic' | 'premium';
    if (tier in pricing) {
      const revenue = pricing[tier];

      if (data.status === 'active') {
        metrics.monthlyRecurringRevenue += revenue;
        metrics.byTier[tier].count++;
        metrics.byTier[tier].mrr += revenue;
      }
    }
  });

  metrics.annualRecurringRevenue = metrics.monthlyRecurringRevenue * 12;

  // Log the action
  await logDataAccess(userId, 'READ', 'analytics', 'revenue', {
    startDate,
    endDate,
  });

  return {
    success: true,
    data: metrics,
  };
});

// ============================================
// GET USER GROWTH ANALYTICS
// ============================================

export const getUserGrowthAnalytics = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);

  // ONLY super admin can access
  await requireSuperAdmin(userId);

  // Get all users
  const usersSnapshot = await admin.firestore().collection('users').get();

  // Group by creation month
  const growthByMonth: Record<string, number> = {};

  usersSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate();

    if (createdAt) {
      const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
      growthByMonth[monthKey] = (growthByMonth[monthKey] || 0) + 1;
    }
  });

  // Convert to array and sort
  const growthData = Object.entries(growthByMonth)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Calculate cumulative growth
  let cumulative = 0;
  const cumulativeGrowth = growthData.map((item) => {
    cumulative += item.count;
    return {
      month: item.month,
      newUsers: item.count,
      totalUsers: cumulative,
    };
  });

  // Log the action
  await logDataAccess(userId, 'READ', 'analytics', 'user_growth');

  return {
    success: true,
    data: {
      totalUsers: usersSnapshot.size,
      growthByMonth: cumulativeGrowth,
    },
  };
});

// ============================================
// PRIVACY-PROTECTED FUNCTIONS
// ============================================

/**
 * BLOCKED: Super admin CANNOT access individual church activities
 */
export const getChurchActivities = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const user = await requireSuperAdmin(userId);

  // PRIVACY ENFORCEMENT: Block access to church activities
  enforceSuperAdminPrivacy(user, 'church_activities');

  // This will never be reached due to privacy enforcement
  return {
    success: false,
    error: {
      code: 'privacy-violation',
      message: 'Access denied for privacy compliance',
    },
  };
});

/**
 * BLOCKED: Super admin CANNOT access individual member data
 */
export const getMemberData = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const user = await requireSuperAdmin(userId);

  // PRIVACY ENFORCEMENT: Block access to member data
  enforceSuperAdminPrivacy(user, 'member_data');

  return {
    success: false,
    error: {
      code: 'privacy-violation',
      message: 'Access denied for privacy compliance',
    },
  };
});

/**
 * BLOCKED: Super admin CANNOT access sermon content
 */
export const getSermonContent = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const user = await requireSuperAdmin(userId);

  // PRIVACY ENFORCEMENT: Block access to sermon content
  enforceSuperAdminPrivacy(user, 'sermon_content');

  return {
    success: false,
    error: {
      code: 'privacy-violation',
      message: 'Access denied for privacy compliance',
    },
  };
});
