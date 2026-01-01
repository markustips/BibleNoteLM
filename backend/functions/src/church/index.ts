/**
 * Church Management Functions
 * Handle church creation, updates, and member management
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  requireAuth,
  requirePastorOrAdmin,
  requireChurchPastor,
  requireChurchMember,
  logDataAccess,
} from '../middleware/auth';
import { validate, schemas, sanitizeObject } from '../middleware/validation';
import { checkRateLimit, rateLimits } from '../middleware/rateLimit';
import { ChurchDocument } from '../types';

// ============================================
// CREATE CHURCH
// ============================================

export const createChurch = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);

  // Rate limiting
  await checkRateLimit(userId, 'create_church', rateLimits.church);

  // Validate input
  const validated = validate(data, schemas.createChurch);
  const sanitized = sanitizeObject(validated);

  // Require pastor or admin role
  await requirePastorOrAdmin(userId);

  // Generate unique church code
  const churchCode = await generateUniqueChurchCode();

  const churchId = admin.firestore().collection('churches').doc().id;

  const churchData: ChurchDocument = {
    id: churchId,
    name: sanitized.name,
    code: churchCode,
    pastorId: userId,
    adminIds: [userId],
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    isActive: true,
    // Additional fields from schema
    ...(sanitized.description && { description: sanitized.description }),
    ...(sanitized.address && { address: sanitized.address }),
    ...(sanitized.phone && { phone: sanitized.phone }),
    ...(sanitized.email && { email: sanitized.email }),
  };

  // Create church document
  await admin.firestore().collection('churches').doc(churchId).set(churchData);

  // Update user to be member of this church
  await admin.firestore().collection('users').doc(userId).update({
    churchId,
    role: 'pastor',
    updatedAt: admin.firestore.Timestamp.now(),
  });

  // Create church member record
  await admin
    .firestore()
    .collection('churches')
    .doc(churchId)
    .collection('members')
    .doc(userId)
    .set({
      userId,
      role: 'pastor',
      joinedAt: admin.firestore.Timestamp.now(),
      isActive: true,
      invitedBy: userId,
    });

  // Log the action
  await logDataAccess(userId, 'WRITE', 'churches', churchId, {
    action: 'create_church',
    churchName: churchData.name,
  });

  return {
    success: true,
    data: {
      churchId,
      churchCode,
      name: churchData.name,
    },
  };
});

// ============================================
// UPDATE CHURCH
// ============================================

export const updateChurch = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { churchId, ...updateData } = data;

  if (!churchId) {
    throw new functions.https.HttpsError('invalid-argument', 'churchId is required');
  }

  // Rate limiting
  await checkRateLimit(userId, 'update_church', rateLimits.church);

  // Validate input
  const validated = validate(updateData, schemas.updateChurch);
  const sanitized = sanitizeObject(validated);

  // Require church pastor
  await requireChurchPastor(userId, churchId);

  // Update church
  await admin
    .firestore()
    .collection('churches')
    .doc(churchId)
    .update({
      ...sanitized,
      updatedAt: admin.firestore.Timestamp.now(),
    });

  // Log the action
  await logDataAccess(userId, 'WRITE', 'churches', churchId, {
    action: 'update_church',
  });

  return {
    success: true,
    data: { churchId },
  };
});

// ============================================
// GET CHURCH DETAILS
// ============================================

export const getChurch = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { churchId } = data;

  if (!churchId) {
    throw new functions.https.HttpsError('invalid-argument', 'churchId is required');
  }

  // Require church membership
  await requireChurchMember(userId, churchId);

  const churchDoc = await admin.firestore().collection('churches').doc(churchId).get();

  if (!churchDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Church not found');
  }

  // Log the action
  await logDataAccess(userId, 'READ', 'churches', churchId);

  return {
    success: true,
    data: churchDoc.data(),
  };
});

// ============================================
// GET CHURCH MEMBERS (Pastor Only)
// ============================================

export const getChurchMembers = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { churchId, page = 1, limit = 20 } = data;

  if (!churchId) {
    throw new functions.https.HttpsError('invalid-argument', 'churchId is required');
  }

  // Require church pastor
  await requireChurchPastor(userId, churchId);

  // Get members from subcollection
  const membersQuery = await admin
    .firestore()
    .collection('churches')
    .doc(churchId)
    .collection('members')
    .where('isActive', '==', true)
    .orderBy('joinedAt', 'desc')
    .limit(limit)
    .get();

  const members = [];

  for (const memberDoc of membersQuery.docs) {
    const memberData = memberDoc.data();

    // Get user details (safe - only basic info)
    const userDoc = await admin.firestore().collection('users').doc(memberData.userId).get();

    if (userDoc.exists) {
      const userData = userDoc.data()!;
      members.push({
        userId: memberData.userId,
        displayName: userData.displayName,
        email: userData.email,
        role: memberData.role,
        joinedAt: memberData.joinedAt,
      });
    }
  }

  // Log the action
  await logDataAccess(userId, 'READ', 'church_members', churchId, {
    memberCount: members.length,
  });

  return {
    success: true,
    data: members,
    pagination: {
      page,
      limit,
      total: membersQuery.size,
    },
  };
});

// ============================================
// JOIN CHURCH (Member)
// ============================================

export const joinChurch = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);

  // Validate input
  const { churchCode } = validate(data, schemas.joinChurch);

  // Rate limiting
  await checkRateLimit(userId, 'join_church', rateLimits.church);

  // Find church by code
  const churchQuery = await admin
    .firestore()
    .collection('churches')
    .where('code', '==', churchCode)
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (churchQuery.empty) {
    throw new functions.https.HttpsError('not-found', 'Invalid church code');
  }

  const churchDoc = churchQuery.docs[0];
  const churchId = churchDoc.id;
  const churchData = churchDoc.data() as ChurchDocument;

  // Check if user is already a member
  const existingMember = await admin
    .firestore()
    .collection('churches')
    .doc(churchId)
    .collection('members')
    .doc(userId)
    .get();

  if (existingMember.exists) {
    throw new functions.https.HttpsError('already-exists', 'Already a member of this church');
  }

  // Add user to church members
  await admin
    .firestore()
    .collection('churches')
    .doc(churchId)
    .collection('members')
    .doc(userId)
    .set({
      userId,
      role: 'member',
      joinedAt: admin.firestore.Timestamp.now(),
      isActive: true,
      invitedBy: null,
    });

  // Update user document
  await admin.firestore().collection('users').doc(userId).update({
    churchId,
    churchCode,
    churchName: churchData.name,
    role: 'member',
    churchJoinedAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  });

  // Increment church member count
  await admin
    .firestore()
    .collection('churches')
    .doc(churchId)
    .update({
      'stats.memberCount': admin.firestore.FieldValue.increment(1),
      'stats.activeMembers': admin.firestore.FieldValue.increment(1),
    });

  // Log the action
  await logDataAccess(userId, 'WRITE', 'church_members', churchId, {
    action: 'join_church',
    churchName: churchData.name,
  });

  return {
    success: true,
    data: {
      churchId,
      churchName: churchData.name,
    },
  };
});

// ============================================
// LEAVE CHURCH
// ============================================

export const leaveChurch = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);

  // Get user's current church
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (!userData || !userData.churchId) {
    throw new functions.https.HttpsError('failed-precondition', 'User is not in a church');
  }

  const churchId = userData.churchId;

  // Check if user is the pastor
  const churchDoc = await admin.firestore().collection('churches').doc(churchId).get();
  const churchData = churchDoc.data() as ChurchDocument;

  if (churchData.pastorId === userId) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Pastor cannot leave church. Transfer ownership first.'
    );
  }

  // Remove from members
  await admin
    .firestore()
    .collection('churches')
    .doc(churchId)
    .collection('members')
    .doc(userId)
    .update({
      isActive: false,
      leftAt: admin.firestore.Timestamp.now(),
    });

  // Update user document
  await admin.firestore().collection('users').doc(userId).update({
    churchId: admin.firestore.FieldValue.delete(),
    churchCode: admin.firestore.FieldValue.delete(),
    churchName: admin.firestore.FieldValue.delete(),
    role: 'guest',
    updatedAt: admin.firestore.Timestamp.now(),
  });

  // Decrement church member count
  await admin
    .firestore()
    .collection('churches')
    .doc(churchId)
    .update({
      'stats.activeMembers': admin.firestore.FieldValue.increment(-1),
    });

  // Log the action
  await logDataAccess(userId, 'WRITE', 'church_members', churchId, {
    action: 'leave_church',
  });

  return {
    success: true,
    data: { message: 'Successfully left church' },
  };
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate unique 8-character church code
 */
async function generateUniqueChurchCode(): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code: string;
  let isUnique = false;

  while (!isUnique) {
    code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code already exists
    const existing = await admin
      .firestore()
      .collection('churches')
      .where('code', '==', code)
      .limit(1)
      .get();

    isUnique = existing.empty;

    if (isUnique) {
      return code!;
    }
  }

  return 'ERROR000'; // Fallback (should never reach here)
}
