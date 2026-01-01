/**
 * Events Management Functions
 * Handle church events creation, updates, attendance tracking
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
import { EventDocument, EventAttendeeDocument } from '../types';

// ============================================
// CREATE EVENT
// ============================================

export const createEvent = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);

  // Rate limiting
  await checkRateLimit(userId, 'create_event', rateLimits.church);

  // Validate input
  const validated = validate(data, schemas.createEvent);
  const sanitized = sanitizeObject(validated);

  // Get user data for church context
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (!userData || !userData.churchId) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'User must be a member of a church to create events'
    );
  }

  const churchId = userData.churchId;

  // Require pastor or admin role
  await requirePastorOrAdmin(userId);

  const eventId = admin.firestore().collection('events').doc().id;
  const now = admin.firestore.Timestamp.now();

  const eventData: EventDocument = {
    id: eventId,
    churchId,
    title: sanitized.title,
    description: sanitized.description,
    location: sanitized.location,
    startDate: admin.firestore.Timestamp.fromDate(new Date(sanitized.startDate)),
    endDate: admin.firestore.Timestamp.fromDate(new Date(sanitized.endDate)),
    organizer: userData.displayName || 'Unknown',
    organizerId: userId,
    category: sanitized.category || 'other',
    maxAttendees: sanitized.maxAttendees,
    currentAttendees: 0,
    isPublished: sanitized.isPublished || false,
    createdAt: now,
    updatedAt: now,
  };

  // Create event document
  await admin.firestore().collection('events').doc(eventId).set(eventData);

  // Log the action
  await logDataAccess(userId, 'WRITE', 'events', eventId, {
    action: 'create_event',
    churchId,
  });

  return {
    success: true,
    data: {
      eventId,
      title: eventData.title,
    },
  };
});

// ============================================
// UPDATE EVENT
// ============================================

export const updateEvent = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { eventId, ...updateData } = data;

  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'eventId is required');
  }

  // Rate limiting
  await checkRateLimit(userId, 'update_event', rateLimits.church);

  // Validate input
  const validated = validate(updateData, schemas.updateEvent);
  const sanitized = sanitizeObject(validated);

  // Get event to verify ownership
  const eventDoc = await admin.firestore().collection('events').doc(eventId).get();

  if (!eventDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Event not found');
  }

  const event = eventDoc.data() as EventDocument;

  // Require pastor or admin
  await requirePastorOrAdmin(userId);

  // Verify user belongs to same church
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (userData?.churchId !== event.churchId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Cannot update events from another church'
    );
  }

  const updatePayload: any = {
    ...sanitized,
    updatedAt: admin.firestore.Timestamp.now(),
  };

  // Handle date conversions
  if (sanitized.startDate) {
    updatePayload.startDate = admin.firestore.Timestamp.fromDate(new Date(sanitized.startDate));
  }
  if (sanitized.endDate) {
    updatePayload.endDate = admin.firestore.Timestamp.fromDate(new Date(sanitized.endDate));
  }

  // Update event
  await admin.firestore().collection('events').doc(eventId).update(updatePayload);

  // Log the action
  await logDataAccess(userId, 'WRITE', 'events', eventId, {
    action: 'update_event',
  });

  return {
    success: true,
    data: { eventId },
  };
});

// ============================================
// DELETE EVENT
// ============================================

export const deleteEvent = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { eventId } = data;

  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'eventId is required');
  }

  // Get event to verify ownership
  const eventDoc = await admin.firestore().collection('events').doc(eventId).get();

  if (!eventDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Event not found');
  }

  const event = eventDoc.data() as EventDocument;

  // Require pastor or admin
  await requirePastorOrAdmin(userId);

  // Verify user belongs to same church
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (userData?.churchId !== event.churchId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Cannot delete events from another church'
    );
  }

  // Delete event and all attendees
  const batch = admin.firestore().batch();

  // Delete event document
  batch.delete(eventDoc.ref);

  // Delete all attendees
  const attendeesSnapshot = await admin
    .firestore()
    .collection('events')
    .doc(eventId)
    .collection('attendees')
    .get();

  attendeesSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  // Log the action
  await logDataAccess(userId, 'DELETE', 'events', eventId, {
    action: 'delete_event',
  });

  return {
    success: true,
    data: { message: 'Event deleted successfully' },
  };
});

// ============================================
// GET CHURCH EVENTS
// ============================================

export const getChurchEvents = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { limit = 20, onlyPublished = true, upcoming = false } = data;

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
    .collection('events')
    .where('churchId', '==', churchId)
    .orderBy('startDate', 'desc')
    .limit(limit);

  // Filter by published status if requested
  if (onlyPublished) {
    query = admin
      .firestore()
      .collection('events')
      .where('churchId', '==', churchId)
      .where('isPublished', '==', true)
      .orderBy('startDate', 'desc')
      .limit(limit);
  }

  const eventsSnapshot = await query.get();

  let events = eventsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Filter upcoming events if requested
  if (upcoming) {
    const now = new Date();
    events = events.filter((event: any) => event.startDate.toDate() > now);
  }

  // Log the action
  await logDataAccess(userId, 'READ', 'events', churchId, {
    action: 'get_church_events',
    count: events.length,
  });

  return {
    success: true,
    data: events,
  };
});

// ============================================
// GET SINGLE EVENT
// ============================================

export const getEvent = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { eventId } = data;

  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'eventId is required');
  }

  const eventDoc = await admin.firestore().collection('events').doc(eventId).get();

  if (!eventDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Event not found');
  }

  const event = eventDoc.data() as EventDocument;

  // Verify user belongs to same church
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (userData?.churchId !== event.churchId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Cannot view events from another church'
    );
  }

  // Require church membership
  await requireChurchMember(userId, event.churchId);

  // Log the action
  await logDataAccess(userId, 'READ', 'events', eventId);

  return {
    success: true,
    data: event,
  };
});

// ============================================
// REGISTER FOR EVENT
// ============================================

export const registerForEvent = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { eventId } = data;

  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'eventId is required');
  }

  // Get event
  const eventDoc = await admin.firestore().collection('events').doc(eventId).get();

  if (!eventDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Event not found');
  }

  const event = eventDoc.data() as EventDocument;

  // Verify user belongs to same church
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (userData?.churchId !== event.churchId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Cannot register for events from another church'
    );
  }

  // Require church membership
  await requireChurchMember(userId, event.churchId);

  // Check if event is full
  if (event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
    throw new functions.https.HttpsError('resource-exhausted', 'Event is full');
  }

  // Check if already registered
  const existingRegistration = await admin
    .firestore()
    .collection('events')
    .doc(eventId)
    .collection('attendees')
    .doc(userId)
    .get();

  if (existingRegistration.exists) {
    throw new functions.https.HttpsError('already-exists', 'Already registered for this event');
  }

  const now = admin.firestore.Timestamp.now();

  const attendeeData: EventAttendeeDocument = {
    userId,
    userName: userData.displayName || 'Unknown',
    status: 'registered',
    registeredAt: now,
    updatedAt: now,
  };

  // Create attendee document and increment counter
  const batch = admin.firestore().batch();

  batch.set(
    admin.firestore().collection('events').doc(eventId).collection('attendees').doc(userId),
    attendeeData
  );

  batch.update(admin.firestore().collection('events').doc(eventId), {
    currentAttendees: admin.firestore.FieldValue.increment(1),
  });

  await batch.commit();

  // Log the action
  await logDataAccess(userId, 'WRITE', 'event_attendees', eventId, {
    action: 'register_for_event',
  });

  return {
    success: true,
    data: { message: 'Successfully registered for event' },
  };
});

// ============================================
// CANCEL EVENT REGISTRATION
// ============================================

export const cancelEventRegistration = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { eventId } = data;

  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'eventId is required');
  }

  // Check if registered
  const attendeeDoc = await admin
    .firestore()
    .collection('events')
    .doc(eventId)
    .collection('attendees')
    .doc(userId)
    .get();

  if (!attendeeDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Not registered for this event');
  }

  // Delete registration and decrement counter
  const batch = admin.firestore().batch();

  batch.delete(attendeeDoc.ref);

  batch.update(admin.firestore().collection('events').doc(eventId), {
    currentAttendees: admin.firestore.FieldValue.increment(-1),
  });

  await batch.commit();

  // Log the action
  await logDataAccess(userId, 'DELETE', 'event_attendees', eventId, {
    action: 'cancel_event_registration',
  });

  return {
    success: true,
    data: { message: 'Registration cancelled successfully' },
  };
});

// ============================================
// GET EVENT ATTENDEES (Pastor/Admin Only)
// ============================================

export const getEventAttendees = functions.https.onCall(async (data, context) => {
  const userId = requireAuth(context);
  const { eventId } = data;

  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'eventId is required');
  }

  // Get event
  const eventDoc = await admin.firestore().collection('events').doc(eventId).get();

  if (!eventDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Event not found');
  }

  const event = eventDoc.data() as EventDocument;

  // Require pastor or admin
  await requirePastorOrAdmin(userId);

  // Verify user belongs to same church
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (userData?.churchId !== event.churchId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Cannot view attendees from another church'
    );
  }

  // Get attendees
  const attendeesSnapshot = await admin
    .firestore()
    .collection('events')
    .doc(eventId)
    .collection('attendees')
    .orderBy('registeredAt', 'desc')
    .get();

  const attendees = attendeesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Log the action
  await logDataAccess(userId, 'READ', 'event_attendees', eventId, {
    action: 'get_event_attendees',
    count: attendees.length,
  });

  return {
    success: true,
    data: attendees,
  };
});
