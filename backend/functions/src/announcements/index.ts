/**
 * Announcements Management Functions
 * Handle church announcements creation, updates, and retrieval
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  requireAuth,
  requirePastorOrAdmin,
  requireChurchMember,
  logDataAccess,
} from '../middleware/auth';
import { validate, schemas, sanitizeObject } from '../middleware/validation';
import { checkRateLimit, rateLimits } from '../middleware/rateLimit';
import { AnnouncementDocument } from '../types';
import {
  uploadImageFromBase64,
  deleteImage,
  validateImage,
  generateImageFilename,
  getImageExtension,
  getContentType,
} from '../utils/storage';

// ============================================
// CREATE ANNOUNCEMENT
// ============================================

export const createAnnouncement = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);

  // Rate limiting
  await checkRateLimit(userId, 'create_announcement', rateLimits.church);

  // Validate input
  const validated = validate(data, schemas.createAnnouncement);
  const sanitized = sanitizeObject(validated);

  // Get user data for church context
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (!userData || !userData.churchId) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'User must be a member of a church to create announcements'
    );
  }

  const churchId = userData.churchId;

  // Require pastor or admin role
  await requirePastorOrAdmin(userId);

  const announcementId = admin.firestore().collection('announcements').doc().id;
  const now = admin.firestore.Timestamp.now();

  // Handle image upload if provided
  let imageUrl: string | undefined;
  let imagePath: string | undefined;

  if (data.imageBase64) {
    // Validate image
    const validation = validateImage(data.imageBase64, 5); // 5MB max
    if (!validation.valid) {
      throw new functions.https.HttpsError('invalid-argument', validation.error || 'Invalid image');
    }

    // Generate filename and upload
    const extension = getImageExtension(data.imageBase64);
    imagePath = generateImageFilename(churchId, 'announcement', extension);
    const contentType = getContentType(data.imageBase64);

    try {
      imageUrl = await uploadImageFromBase64(data.imageBase64, imagePath, contentType);
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw new functions.https.HttpsError('internal', 'Failed to upload image');
    }
  }

  const announcementData: AnnouncementDocument = {
    id: announcementId,
    churchId,
    title: sanitized.title,
    content: sanitized.content,
    authorId: userId,
    authorName: userData.displayName || 'Unknown',
    priority: sanitized.priority || 'medium',
    isPublished: sanitized.isPublished || false,
    publishedAt: sanitized.isPublished ? now : undefined,
    expiresAt: sanitized.expiresAt
      ? admin.firestore.Timestamp.fromDate(new Date(sanitized.expiresAt))
      : undefined,
    imageUrl,
    imagePath,
    createdAt: now,
    updatedAt: now,
  };

  // Create announcement document
  await admin
    .firestore()
    .collection('announcements')
    .doc(announcementId)
    .set(announcementData);

  // Log the action
  await logDataAccess(userId, 'WRITE', 'announcements', announcementId, {
    action: 'create_announcement',
    churchId,
  });

  return {
    success: true,
    data: {
      announcementId,
      title: announcementData.title,
    },
  };
});

// ============================================
// UPDATE ANNOUNCEMENT
// ============================================

export const updateAnnouncement = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { announcementId, ...updateData } = data;

  if (!announcementId) {
    throw new functions.https.HttpsError('invalid-argument', 'announcementId is required');
  }

  // Rate limiting
  await checkRateLimit(userId, 'update_announcement', rateLimits.church);

  // Validate input
  const validated = validate(updateData, schemas.updateAnnouncement);
  const sanitized = sanitizeObject(validated);

  // Get announcement to verify ownership
  const announcementDoc = await admin
    .firestore()
    .collection('announcements')
    .doc(announcementId)
    .get();

  if (!announcementDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Announcement not found');
  }

  const announcement = announcementDoc.data() as AnnouncementDocument;

  // Require pastor or admin
  await requirePastorOrAdmin(userId);

  // Verify user belongs to same church
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (userData?.churchId !== announcement.churchId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Cannot update announcements from another church'
    );
  }

  // Handle image upload/update if provided
  if (data.imageBase64) {
    // Delete old image if exists
    if (announcement.imagePath) {
      await deleteImage(announcement.imagePath);
    }

    // Validate new image
    const validation = validateImage(data.imageBase64, 5);
    if (!validation.valid) {
      throw new functions.https.HttpsError('invalid-argument', validation.error || 'Invalid image');
    }

    // Upload new image
    const extension = getImageExtension(data.imageBase64);
    const imagePath = generateImageFilename(announcement.churchId, 'announcement', extension);
    const contentType = getContentType(data.imageBase64);

    try {
      sanitized.imageUrl = await uploadImageFromBase64(data.imageBase64, imagePath, contentType);
      sanitized.imagePath = imagePath;
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw new functions.https.HttpsError('internal', 'Failed to upload image');
    }
  }

  // Handle image removal if explicitly requested
  if (data.removeImage === true && announcement.imagePath) {
    await deleteImage(announcement.imagePath);
    sanitized.imageUrl = admin.firestore.FieldValue.delete();
    sanitized.imagePath = admin.firestore.FieldValue.delete();
  }

  const updatePayload: any = {
    ...sanitized,
    updatedAt: admin.firestore.Timestamp.now(),
  };

  // If publishing for the first time, set publishedAt
  if (sanitized.isPublished && !announcement.isPublished) {
    updatePayload.publishedAt = admin.firestore.Timestamp.now();
  }

  // Handle expiresAt conversion
  if (sanitized.expiresAt) {
    updatePayload.expiresAt = admin.firestore.Timestamp.fromDate(new Date(sanitized.expiresAt));
  }

  // Update announcement
  await admin.firestore().collection('announcements').doc(announcementId).update(updatePayload);

  // Log the action
  await logDataAccess(userId, 'WRITE', 'announcements', announcementId, {
    action: 'update_announcement',
  });

  return {
    success: true,
    data: { announcementId },
  };
});

// ============================================
// DELETE ANNOUNCEMENT
// ============================================

export const deleteAnnouncement = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { announcementId } = data;

  if (!announcementId) {
    throw new functions.https.HttpsError('invalid-argument', 'announcementId is required');
  }

  // Get announcement to verify ownership
  const announcementDoc = await admin
    .firestore()
    .collection('announcements')
    .doc(announcementId)
    .get();

  if (!announcementDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Announcement not found');
  }

  const announcement = announcementDoc.data() as AnnouncementDocument;

  // Require pastor or admin
  await requirePastorOrAdmin(userId);

  // Verify user belongs to same church
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (userData?.churchId !== announcement.churchId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Cannot delete announcements from another church'
    );
  }

  // Delete associated image if exists
  if (announcement.imagePath) {
    await deleteImage(announcement.imagePath);
  }

  // Delete announcement
  await admin.firestore().collection('announcements').doc(announcementId).delete();

  // Log the action
  await logDataAccess(userId, 'DELETE', 'announcements', announcementId, {
    action: 'delete_announcement',
  });

  return {
    success: true,
    data: { message: 'Announcement deleted successfully' },
  };
});

// ============================================
// GET CHURCH ANNOUNCEMENTS
// ============================================

export const getChurchAnnouncements = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { limit = 20, onlyPublished = true } = data;

  // Get user's church
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (!userData || !userData.churchId) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'User must be a member of a church'
    );
  }

  const churchId = userData.churchId;

  // Require church membership
  await requireChurchMember(userId, churchId);

  // Build query
  let query = admin
    .firestore()
    .collection('announcements')
    .where('churchId', '==', churchId)
    .orderBy('createdAt', 'desc')
    .limit(limit);

  // Filter by published status if requested
  if (onlyPublished) {
    query = admin
      .firestore()
      .collection('announcements')
      .where('churchId', '==', churchId)
      .where('isPublished', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(limit);
  }

  const announcementsSnapshot = await query.get();

  const announcements = announcementsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Filter out expired announcements
  const now = new Date();
  const activeAnnouncements = announcements.filter((announcement: any) => {
    if (!announcement.expiresAt) return true;
    return announcement.expiresAt.toDate() > now;
  });

  // Log the action
  await logDataAccess(userId, 'READ', 'announcements', churchId, {
    action: 'get_church_announcements',
    count: activeAnnouncements.length,
  });

  return {
    success: true,
    data: activeAnnouncements,
  };
});

// ============================================
// GET SINGLE ANNOUNCEMENT
// ============================================

export const getAnnouncement = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { announcementId } = data;

  if (!announcementId) {
    throw new functions.https.HttpsError('invalid-argument', 'announcementId is required');
  }

  const announcementDoc = await admin
    .firestore()
    .collection('announcements')
    .doc(announcementId)
    .get();

  if (!announcementDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Announcement not found');
  }

  const announcement = announcementDoc.data() as AnnouncementDocument;

  // Verify user belongs to same church
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (userData?.churchId !== announcement.churchId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Cannot view announcements from another church'
    );
  }

  // Require church membership
  await requireChurchMember(userId, announcement.churchId);

  // Log the action
  await logDataAccess(userId, 'READ', 'announcements', announcementId);

  return {
    success: true,
    data: announcement,
  };
});
