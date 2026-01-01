/**
 * Rate Limiting Middleware
 * Prevents abuse and DoS attacks
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// ============================================
// RATE LIMIT CONFIGURATION
// ============================================

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

// Different limits for different operations
export const rateLimits = {
  auth: { maxRequests: 10, windowMs: 15 * 60 * 1000 }, // 10 per 15 min
  subscription: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  church: { maxRequests: 20, windowMs: 15 * 60 * 1000 }, // 20 per 15 min
  default: defaultConfig,
};

// ============================================
// RATE LIMITING
// ============================================

/**
 * Check if user has exceeded rate limit
 */
export async function checkRateLimit(
  userId: string,
  operation: string,
  config: RateLimitConfig = defaultConfig
): Promise<void> {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const rateLimitKey = `rateLimit_${userId}_${operation}`;

  try {
    const doc = await admin
      .firestore()
      .collection('rate_limits')
      .doc(rateLimitKey)
      .get();

    if (!doc.exists) {
      // First request - create record
      await admin
        .firestore()
        .collection('rate_limits')
        .doc(rateLimitKey)
        .set({
          userId,
          operation,
          requests: [now],
          createdAt: admin.firestore.Timestamp.now(),
        });
      return;
    }

    const data = doc.data()!;
    const requests: number[] = data.requests || [];

    // Filter out requests outside the time window
    const recentRequests = requests.filter((timestamp) => timestamp > windowStart);

    if (recentRequests.length >= config.maxRequests) {
      // Rate limit exceeded
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Rate limit exceeded for ${operation}. Please try again later.`
      );
    }

    // Add current request
    recentRequests.push(now);

    // Update record
    await admin
      .firestore()
      .collection('rate_limits')
      .doc(rateLimitKey)
      .update({
        requests: recentRequests,
        updatedAt: admin.firestore.Timestamp.now(),
      });
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    console.error('Rate limit check failed:', error);
    // Don't block request if rate limit check fails
  }
}

/**
 * Cleanup old rate limit records (call via scheduled function)
 */
export async function cleanupRateLimits(): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - 24); // Delete records older than 24 hours

  const snapshot = await admin
    .firestore()
    .collection('rate_limits')
    .where('updatedAt', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
    .get();

  const batch = admin.firestore().batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Cleaned up ${snapshot.size} old rate limit records`);
}

// ============================================
// IP-BASED RATE LIMITING
// ============================================

/**
 * Check rate limit by IP address (for non-authenticated endpoints)
 */
export async function checkIpRateLimit(
  ipAddress: string,
  operation: string,
  config: RateLimitConfig = defaultConfig
): Promise<void> {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const rateLimitKey = `ipRateLimit_${ipAddress}_${operation}`;

  try {
    const doc = await admin
      .firestore()
      .collection('rate_limits')
      .doc(rateLimitKey)
      .get();

    if (!doc.exists) {
      await admin
        .firestore()
        .collection('rate_limits')
        .doc(rateLimitKey)
        .set({
          ipAddress,
          operation,
          requests: [now],
          createdAt: admin.firestore.Timestamp.now(),
        });
      return;
    }

    const data = doc.data()!;
    const requests: number[] = data.requests || [];
    const recentRequests = requests.filter((timestamp) => timestamp > windowStart);

    if (recentRequests.length >= config.maxRequests) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Too many requests from this IP address. Please try again later.'
      );
    }

    recentRequests.push(now);

    await admin
      .firestore()
      .collection('rate_limits')
      .doc(rateLimitKey)
      .update({
        requests: recentRequests,
        updatedAt: admin.firestore.Timestamp.now(),
      });
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    console.error('IP rate limit check failed:', error);
  }
}
