/**
 * Authentication Triggers
 * Handle user lifecycle events
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// ============================================
// ON USER CREATE
// ============================================

/**
 * Automatically create user document when user signs up
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    const userData = {
      id: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL || null,
      phoneNumber: user.phoneNumber || null,

      // Default role is 'guest'
      role: 'guest',

      // Default subscription
      subscriptionTier: 'free',
      subscriptionStatus: 'active',

      // App preferences
      preferences: {
        notifications: true,
        darkMode: false,
        bibleVersion: 'NIV',
        fontSize: 'medium',
        language: 'en',
      },

      // Statistics
      stats: {
        sermonsRecorded: 0,
        prayersSubmitted: 0,
        eventsAttended: 0,
        lastActiveAt: admin.firestore.Timestamp.now(),
      },

      // Metadata
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      lastLoginAt: admin.firestore.Timestamp.now(),
      fcmTokens: [],
    };

    await admin.firestore().collection('users').doc(user.uid).set(userData);

    console.log(`User document created for ${user.uid}`);
  } catch (error) {
    console.error('Error creating user document:', error);
    // Don't throw - user can still sign in even if document creation fails
  }
});

// ============================================
// ON USER DELETE
// ============================================

/**
 * Clean up user data when user account is deleted
 * GDPR/CCPA Compliance
 */
export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  const userId = user.uid;

  try {
    // Log deletion for compliance
    await admin.firestore().collection('audit_logs').add({
      userId,
      action: 'USER_DELETED',
      collection: 'users',
      documentId: userId,
      result: 'SUCCESS',
      timestamp: admin.firestore.Timestamp.now(),
      metadata: {
        email: user.email,
        reason: 'account_deletion',
      },
    });

    // Delete user document
    await admin.firestore().collection('users').doc(userId).delete();

    // Delete user's subscriptions
    const subscriptions = await admin
      .firestore()
      .collection('subscriptions')
      .where('userId', '==', userId)
      .get();

    const batch1 = admin.firestore().batch();
    subscriptions.docs.forEach((doc) => {
      batch1.delete(doc.ref);
    });
    await batch1.commit();

    // Cancel active subscriptions in Stripe
    // (This would require Stripe import - handle in a separate function)

    // Remove from church members
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (userData?.churchId) {
      await admin
        .firestore()
        .collection('churches')
        .doc(userData.churchId)
        .collection('members')
        .doc(userId)
        .delete();

      // Decrement church member count
      await admin
        .firestore()
        .collection('churches')
        .doc(userData.churchId)
        .update({
          'stats.activeMembers': admin.firestore.FieldValue.increment(-1),
        });
    }

    // Note: Personal data (notes, highlights, bookmarks) is stored locally
    // and will be deleted when app is uninstalled

    console.log(`User data cleaned up for ${userId}`);
  } catch (error) {
    console.error('Error deleting user data:', error);
  }
});

// ============================================
// UPDATE LAST LOGIN
// ============================================

/**
 * Update last login timestamp
 */
export const updateLastLogin = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;

  await admin.firestore().collection('users').doc(userId).update({
    lastLoginAt: admin.firestore.Timestamp.now(),
    'stats.lastActiveAt': admin.firestore.Timestamp.now(),
  });

  return { success: true };
});

// ============================================
// UPDATE FCM TOKEN (Push Notifications)
// ============================================

export const updateFcmToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { token } = data;

  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'FCM token is required');
  }

  // Add token to array if not already present
  await admin
    .firestore()
    .collection('users')
    .doc(userId)
    .update({
      fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
    });

  return { success: true };
});

// ============================================
// REMOVE FCM TOKEN
// ============================================

export const removeFcmToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { token } = data;

  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'FCM token is required');
  }

  await admin
    .firestore()
    .collection('users')
    .doc(userId)
    .update({
      fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
    });

  return { success: true };
});
