/**
 * Daily Verse Functions
 * Handles verse of the day management with manual and auto-generation
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { requireAuth, requireRole } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { validateInput } from '../middleware/validation';
import Joi from 'joi';

const db = admin.firestore();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createVerseSchema = Joi.object({
  churchId: Joi.string().required(),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  reference: Joi.string().required(),
  text: Joi.string().required(),
  version: Joi.string().valid('NIV', 'KJV', 'ESV').default('NIV'),
  reflection: Joi.string().max(1000).optional(),
  theme: Joi.string().max(100).optional(),
});

const setThemeSchema = Joi.object({
  churchId: Joi.string().required(),
  type: Joi.string().valid('weekly', 'monthly').required(),
  theme: Joi.string().required(),
  startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  suggestedVerses: Joi.array().items(Joi.string()).optional(),
});

// ============================================
// CREATE/UPDATE DAILY VERSE (MANUAL)
// ============================================

export const saveDailyVerse = functions.https.onCall(async (data, context) => {
  const userId = await requireAuth(context);
  await requireRole(userId, ['pastor', 'admin']);
  await rateLimit(userId, 'save_daily_verse', 20); // 20 per hour
  await validateInput(data, createVerseSchema);

  const { churchId, date, reference, text, version, reflection, theme } = data;

  // Verify user belongs to this church
  const userDoc = await db.collection('users').doc(userId).get();
  const userChurchId = userDoc.data()?.churchId;

  if (userChurchId !== churchId) {
    throw new functions.https.HttpsError('permission-denied', 'You do not belong to this church');
  }

  try {
    // Use date as document ID for easy querying
    const verseDocId = `${churchId}_${date}`;
    const verseRef = db.collection('daily_verses').doc(verseDocId);
    const now = admin.firestore.Timestamp.now();

    const verseData = {
      id: verseDocId,
      churchId,
      date,
      verse: {
        reference,
        text,
        version: version || 'NIV',
      },
      theme: theme || null,
      reflection: reflection || null,
      isAuto: false,
      generatedBy: 'pastor',
      pastorId: userId,
      createdAt: now,
      updatedAt: now,
    };

    await verseRef.set(verseData, { merge: true });

    console.log(`Daily verse saved for ${churchId} on ${date} by ${userId}`);

    return {
      success: true,
      verse: {
        reference,
        text,
        version: version || 'NIV',
      },
    };
  } catch (error) {
    console.error('Error saving daily verse:', error);
    throw new functions.https.HttpsError('internal', 'Failed to save daily verse');
  }
});

// ============================================
// DELETE DAILY VERSE
// ============================================

export const deleteDailyVerse = functions.https.onCall(async (data, context) => {
  const userId = await requireAuth(context);
  await requireRole(userId, ['pastor', 'admin']);

  const { churchId, date } = data;

  // Verify user belongs to this church
  const userDoc = await db.collection('users').doc(userId).get();
  const userChurchId = userDoc.data()?.churchId;

  if (userChurchId !== churchId) {
    throw new functions.https.HttpsError('permission-denied', 'You do not belong to this church');
  }

  try {
    const verseDocId = `${churchId}_${date}`;
    await db.collection('daily_verses').doc(verseDocId).delete();

    console.log(`Daily verse ${verseDocId} deleted by ${userId}`);

    return { success: true };
  } catch (error) {
    console.error('Error deleting daily verse:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete daily verse');
  }
});

// ============================================
// GET DAILY VERSE
// ============================================

export const getDailyVerse = functions.https.onCall(async (data, context) => {
  const userId = await requireAuth(context);

  const { churchId, date } = data;

  // Verify user belongs to this church
  const userDoc = await db.collection('users').doc(userId).get();
  const userChurchId = userDoc.data()?.churchId;

  if (userChurchId !== churchId) {
    throw new functions.https.HttpsError('permission-denied', 'You do not belong to this church');
  }

  try {
    const verseDocId = `${churchId}_${date}`;
    const verseDoc = await db.collection('daily_verses').doc(verseDocId).get();

    if (!verseDoc.exists) {
      return { success: true, verse: null };
    }

    const verseData = verseDoc.data();

    return {
      success: true,
      verse: {
        id: verseData!.id,
        reference: verseData!.verse.reference,
        text: verseData!.verse.text,
        version: verseData!.verse.version,
        theme: verseData!.theme,
        reflection: verseData!.reflection,
        createdAt: verseData!.createdAt,
      },
    };
  } catch (error) {
    console.error('Error getting daily verse:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get daily verse');
  }
});

// ============================================
// GET VERSE CALENDAR (ALL VERSES FOR A MONTH)
// ============================================

export const getVerseCalendar = functions.https.onCall(async (data, context) => {
  const userId = await requireAuth(context);

  const { churchId, year, month } = data;

  // Verify user belongs to this church
  const userDoc = await db.collection('users').doc(userId).get();
  const userChurchId = userDoc.data()?.churchId;

  if (userChurchId !== churchId) {
    throw new functions.https.HttpsError('permission-denied', 'You do not belong to this church');
  }

  try {
    // Get all verses for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const versesSnapshot = await db
      .collection('daily_verses')
      .where('churchId', '==', churchId)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();

    const verses: Record<string, any> = {};

    versesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      verses[data.date] = {
        reference: data.verse.reference,
        theme: data.theme,
        hasReflection: !!data.reflection,
      };
    });

    return {
      success: true,
      verses,
    };
  } catch (error) {
    console.error('Error getting verse calendar:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get verse calendar');
  }
});

// ============================================
// SET CHURCH THEME (WEEKLY/MONTHLY)
// ============================================

export const setChurchTheme = functions.https.onCall(async (data, context) => {
  const userId = await requireAuth(context);
  await requireRole(userId, ['pastor', 'admin']);
  await validateInput(data, setThemeSchema);

  const { churchId, type, theme, startDate, endDate, suggestedVerses } = data;

  // Verify user belongs to this church
  const userDoc = await db.collection('users').doc(userId).get();
  const userChurchId = userDoc.data()?.churchId;

  if (userChurchId !== churchId) {
    throw new functions.https.HttpsError('permission-denied', 'You do not belong to this church');
  }

  try {
    const themeRef = db.collection('church_themes').doc(churchId);
    const now = admin.firestore.Timestamp.now();

    const updateData: any = {
      churchId,
      updatedAt: now,
      updatedBy: userId,
    };

    if (type === 'weekly') {
      updateData.weeklyTheme = {
        theme,
        startDate,
        endDate,
        verses: suggestedVerses || [],
      };
    } else if (type === 'monthly') {
      updateData.monthlyTheme = {
        theme,
        startDate,
        endDate,
        verses: suggestedVerses || [],
      };
    }

    await themeRef.set(updateData, { merge: true });

    console.log(`${type} theme set for ${churchId} by ${userId}`);

    return { success: true };
  } catch (error) {
    console.error('Error setting church theme:', error);
    throw new functions.https.HttpsError('internal', 'Failed to set church theme');
  }
});

// ============================================
// TOGGLE AUTO-GENERATE
// ============================================

export const toggleAutoGenerate = functions.https.onCall(async (data, context) => {
  const userId = await requireAuth(context);
  await requireRole(userId, ['pastor', 'admin']);

  const { churchId, enabled } = data;

  // Verify user belongs to this church
  const userDoc = await db.collection('users').doc(userId).get();
  const userChurchId = userDoc.data()?.churchId;

  if (userChurchId !== churchId) {
    throw new functions.https.HttpsError('permission-denied', 'You do not belong to this church');
  }

  try {
    await db.collection('church_themes').doc(churchId).set(
      {
        churchId,
        autoGenerate: enabled,
        preferredVersion: 'NIV',
        updatedAt: admin.firestore.Timestamp.now(),
        updatedBy: userId,
      },
      { merge: true }
    );

    console.log(`Auto-generate ${enabled ? 'enabled' : 'disabled'} for ${churchId}`);

    return { success: true, enabled };
  } catch (error) {
    console.error('Error toggling auto-generate:', error);
    throw new functions.https.HttpsError('internal', 'Failed to toggle auto-generate');
  }
});

// ============================================
// GET CHURCH THEME
// ============================================

export const getChurchTheme = functions.https.onCall(async (data, context) => {
  const userId = await requireAuth(context);

  const { churchId } = data;

  // Verify user belongs to this church
  const userDoc = await db.collection('users').doc(userId).get();
  const userChurchId = userDoc.data()?.churchId;

  if (userChurchId !== churchId) {
    throw new functions.https.HttpsError('permission-denied', 'You do not belong to this church');
  }

  try {
    const themeDoc = await db.collection('church_themes').doc(churchId).get();

    if (!themeDoc.exists) {
      return {
        success: true,
        theme: null,
        autoGenerate: false,
      };
    }

    const themeData = themeDoc.data();

    return {
      success: true,
      weeklyTheme: themeData?.weeklyTheme || null,
      monthlyTheme: themeData?.monthlyTheme || null,
      autoGenerate: themeData?.autoGenerate || false,
      preferredVersion: themeData?.preferredVersion || 'NIV',
    };
  } catch (error) {
    console.error('Error getting church theme:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get church theme');
  }
});
