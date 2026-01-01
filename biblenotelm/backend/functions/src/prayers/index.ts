/**
 * Prayer Requests Management Functions
 * Handle prayer requests creation, updates, and prayer tracking
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  requireAuth,
  requireChurchMember,
  logDataAccess,
} from '../middleware/auth';
import { validate, schemas, sanitizeObject } from '../middleware/validation';
import { checkRateLimit, rateLimits } from '../middleware/rateLimit';
import { PrayerDocument, PrayingUserDocument } from '../types';

// ============================================
// CREATE PRAYER REQUEST
// ============================================

export const createPrayer = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);

  // Rate limiting
  await checkRateLimit(userId, 'create_prayer', rateLimits.church);

  // Validate input
  const validated = validate(data, schemas.createPrayer);
  const sanitized = sanitizeObject(validated);

  // Get user data
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (!userData) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }

  const prayerId = admin.firestore().collection('prayers').doc().id;
  const now = admin.firestore.Timestamp.now();

  const prayerData: PrayerDocument = {
    id: prayerId,
    userId,
    userName: userData.displayName || 'Anonymous',
    churchId: userData.churchId,
    title: sanitized.title,
    content: sanitized.content,
    visibility: sanitized.visibility || 'church',
    category: sanitized.category || 'general',
    isAnswered: false,
    prayerCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  // If visibility is church but user doesn't have a church, default to private
  if (prayerData.visibility === 'church' && !prayerData.churchId) {
    prayerData.visibility = 'private';
  }

  // Create prayer document
  await admin.firestore().collection('prayers').doc(prayerId).set(prayerData);

  // Log the action
  await logDataAccess(userId, 'WRITE', 'prayers', prayerId, {
    action: 'create_prayer',
    visibility: prayerData.visibility,
  });

  return {
    success: true,
    data: {
      prayerId,
      title: prayerData.title,
    },
  };
});

// ============================================
// UPDATE PRAYER REQUEST
// ============================================

export const updatePrayer = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { prayerId, ...updateData } = data;

  if (!prayerId) {
    throw new functions.https.HttpsError('invalid-argument', 'prayerId is required');
  }

  // Rate limiting
  await checkRateLimit(userId, 'update_prayer', rateLimits.church);

  // Validate input
  const validated = validate(updateData, schemas.updatePrayer);
  const sanitized = sanitizeObject(validated);

  // Get prayer to verify ownership
  const prayerDoc = await admin.firestore().collection('prayers').doc(prayerId).get();

  if (!prayerDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Prayer not found');
  }

  const prayer = prayerDoc.data() as PrayerDocument;

  // Only the prayer creator can update it
  if (prayer.userId !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Can only update your own prayers');
  }

  const updatePayload: any = {
    ...sanitized,
    updatedAt: admin.firestore.Timestamp.now(),
  };

  // If marking as answered for the first time, set answeredAt
  if (sanitized.isAnswered && !prayer.isAnswered) {
    updatePayload.answeredAt = admin.firestore.Timestamp.now();
  }

  // Update prayer
  await admin.firestore().collection('prayers').doc(prayerId).update(updatePayload);

  // Log the action
  await logDataAccess(userId, 'WRITE', 'prayers', prayerId, {
    action: 'update_prayer',
  });

  return {
    success: true,
    data: { prayerId },
  };
});

// ============================================
// DELETE PRAYER REQUEST
// ============================================

export const deletePrayer = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { prayerId } = data;

  if (!prayerId) {
    throw new functions.https.HttpsError('invalid-argument', 'prayerId is required');
  }

  // Get prayer to verify ownership
  const prayerDoc = await admin.firestore().collection('prayers').doc(prayerId).get();

  if (!prayerDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Prayer not found');
  }

  const prayer = prayerDoc.data() as PrayerDocument;

  // Only the prayer creator can delete it
  if (prayer.userId !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Can only delete your own prayers');
  }

  // Delete prayer and all praying users
  const batch = admin.firestore().batch();

  // Delete prayer document
  batch.delete(prayerDoc.ref);

  // Delete all praying users
  const prayingUsersSnapshot = await admin
    .firestore()
    .collection('prayers')
    .doc(prayerId)
    .collection('praying')
    .get();

  prayingUsersSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  // Log the action
  await logDataAccess(userId, 'DELETE', 'prayers', prayerId, {
    action: 'delete_prayer',
  });

  return {
    success: true,
    data: { message: 'Prayer deleted successfully' },
  };
});

// ============================================
// GET PRAYERS
// ============================================

export const getPrayers = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { visibility = 'church', limit = 20, onlyActive = true } = data;

  // Get user data
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();

  let query;

  if (visibility === 'public') {
    // Public prayers - anyone can see
    query = admin
      .firestore()
      .collection('prayers')
      .where('visibility', '==', 'public')
      .orderBy('createdAt', 'desc')
      .limit(limit);
  } else if (visibility === 'church') {
    // Church prayers - only members of the church
    if (!userData || !userData.churchId) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'User must be a member of a church to view church prayers'
      );
    }

    const churchId = userData.churchId;
    await requireChurchMember(userId, churchId);

    query = admin
      .firestore()
      .collection('prayers')
      .where('visibility', '==', 'church')
      .where('churchId', '==', churchId)
      .orderBy('createdAt', 'desc')
      .limit(limit);
  } else if (visibility === 'my') {
    // User's own prayers
    query = admin
      .firestore()
      .collection('prayers')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit);
  } else {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid visibility option');
  }

  const prayersSnapshot = await query.get();

  let prayers = prayersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Filter out answered prayers if onlyActive is true
  if (onlyActive) {
    prayers = prayers.filter((prayer: any) => !prayer.isAnswered);
  }

  // Log the action
  await logDataAccess(userId, 'READ', 'prayers', visibility, {
    action: 'get_prayers',
    count: prayers.length,
  });

  return {
    success: true,
    data: prayers,
  };
});

// ============================================
// GET SINGLE PRAYER
// ============================================

export const getPrayer = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { prayerId } = data;

  if (!prayerId) {
    throw new functions.https.HttpsError('invalid-argument', 'prayerId is required');
  }

  const prayerDoc = await admin.firestore().collection('prayers').doc(prayerId).get();

  if (!prayerDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Prayer not found');
  }

  const prayer = prayerDoc.data() as PrayerDocument;

  // Check visibility permissions
  if (prayer.visibility === 'private' && prayer.userId !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Cannot view private prayers');
  }

  if (prayer.visibility === 'church') {
    // Verify user belongs to same church
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.churchId !== prayer.churchId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cannot view prayers from another church'
      );
    }

    if (prayer.churchId) {
      await requireChurchMember(userId, prayer.churchId);
    }
  }

  // Log the action
  await logDataAccess(userId, 'READ', 'prayers', prayerId);

  return {
    success: true,
    data: prayer,
  };
});

// ============================================
// PRAY FOR REQUEST
// ============================================

export const prayForRequest = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { prayerId } = data;

  if (!prayerId) {
    throw new functions.https.HttpsError('invalid-argument', 'prayerId is required');
  }

  // Get prayer
  const prayerDoc = await admin.firestore().collection('prayers').doc(prayerId).get();

  if (!prayerDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Prayer not found');
  }

  const prayer = prayerDoc.data() as PrayerDocument;

  // Check visibility permissions
  if (prayer.visibility === 'private' && prayer.userId !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Cannot pray for private prayers');
  }

  if (prayer.visibility === 'church') {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.churchId !== prayer.churchId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cannot pray for prayers from another church'
      );
    }

    if (prayer.churchId) {
      await requireChurchMember(userId, prayer.churchId);
    }
  }

  // Check if already prayed
  const existingPrayer = await admin
    .firestore()
    .collection('prayers')
    .doc(prayerId)
    .collection('praying')
    .doc(userId)
    .get();

  if (existingPrayer.exists) {
    // Update timestamp
    await admin
      .firestore()
      .collection('prayers')
      .doc(prayerId)
      .collection('praying')
      .doc(userId)
      .update({
        prayedAt: admin.firestore.Timestamp.now(),
      });
  } else {
    // Get user data
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();

    const now = admin.firestore.Timestamp.now();

    const prayingUserData: PrayingUserDocument = {
      userId,
      userName: userData?.displayName || 'Anonymous',
      prayedAt: now,
    };

    // Create praying user document and increment counter
    const batch = admin.firestore().batch();

    batch.set(
      admin.firestore().collection('prayers').doc(prayerId).collection('praying').doc(userId),
      prayingUserData
    );

    batch.update(admin.firestore().collection('prayers').doc(prayerId), {
      prayerCount: admin.firestore.FieldValue.increment(1),
    });

    await batch.commit();
  }

  // Log the action
  await logDataAccess(userId, 'WRITE', 'prayer_praying', prayerId, {
    action: 'pray_for_request',
  });

  return {
    success: true,
    data: { message: 'Prayer recorded successfully' },
  };
});

// ============================================
// GET PRAYING USERS
// ============================================

export const getPrayingUsers = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { prayerId } = data;

  if (!prayerId) {
    throw new functions.https.HttpsError('invalid-argument', 'prayerId is required');
  }

  // Get prayer
  const prayerDoc = await admin.firestore().collection('prayers').doc(prayerId).get();

  if (!prayerDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Prayer not found');
  }

  const prayer = prayerDoc.data() as PrayerDocument;

  // Check visibility permissions
  if (prayer.visibility === 'private' && prayer.userId !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Cannot view private prayer details');
  }

  if (prayer.visibility === 'church') {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.churchId !== prayer.churchId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cannot view prayer details from another church'
      );
    }

    if (prayer.churchId) {
      await requireChurchMember(userId, prayer.churchId);
    }
  }

  // Get praying users
  const prayingUsersSnapshot = await admin
    .firestore()
    .collection('prayers')
    .doc(prayerId)
    .collection('praying')
    .orderBy('prayedAt', 'desc')
    .get();

  const prayingUsers = prayingUsersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Log the action
  await logDataAccess(userId, 'READ', 'prayer_praying', prayerId, {
    action: 'get_praying_users',
    count: prayingUsers.length,
  });

  return {
    success: true,
    data: prayingUsers,
  };
});
