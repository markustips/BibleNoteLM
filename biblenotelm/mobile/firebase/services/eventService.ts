/**
 * Firebase Event Service
 * Handles all event-related database operations
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../config';
import { EventDocument, EventAttendeeDocument } from '../schema';

const EVENTS_COLLECTION = 'events';

// Create event
export const createEvent = async (data: Partial<EventDocument>): Promise<string> => {
  const eventRef = doc(collection(db, EVENTS_COLLECTION));
  const now = Timestamp.now();
  
  const eventData: EventDocument = {
    id: eventRef.id,
    churchId: data.churchId || '',
    authorId: data.authorId || '',
    title: data.title || '',
    description: data.description || '',
    startDate: data.startDate || now,
    isAllDay: data.isAllDay || false,
    timezone: data.timezone || 'America/New_York',
    requiresRegistration: data.requiresRegistration || false,
    registeredCount: 0,
    category: data.category || 'other',
    status: 'upcoming',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...data
  } as EventDocument;

  await setDoc(eventRef, eventData);
  return eventRef.id;
};

// Get event by ID
export const getEvent = async (eventId: string): Promise<EventDocument | null> => {
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);
  const snapshot = await getDoc(eventRef);
  
  if (snapshot.exists()) {
    return snapshot.data() as EventDocument;
  }
  return null;
};

// Get upcoming events by church
export const getUpcomingEventsByChurch = async (
  churchId: string, 
  limitCount: number = 10
): Promise<EventDocument[]> => {
  const now = Timestamp.now();
  
  const q = query(
    collection(db, EVENTS_COLLECTION),
    where('churchId', '==', churchId),
    where('isActive', '==', true),
    where('startDate', '>=', now),
    orderBy('startDate', 'asc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as EventDocument);
};

// Get all events by church
export const getEventsByChurch = async (
  churchId: string, 
  limitCount: number = 20
): Promise<EventDocument[]> => {
  const q = query(
    collection(db, EVENTS_COLLECTION),
    where('churchId', '==', churchId),
    orderBy('startDate', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as EventDocument);
};

// Get events by category
export const getEventsByCategory = async (
  churchId: string, 
  category: EventDocument['category'],
  limitCount: number = 10
): Promise<EventDocument[]> => {
  const q = query(
    collection(db, EVENTS_COLLECTION),
    where('churchId', '==', churchId),
    where('category', '==', category),
    where('isActive', '==', true),
    orderBy('startDate', 'asc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as EventDocument);
};

// Update event
export const updateEvent = async (eventId: string, data: Partial<EventDocument>): Promise<void> => {
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);
  await updateDoc(eventRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

// Update event status
export const updateEventStatus = async (
  eventId: string, 
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
): Promise<void> => {
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
    status,
    updatedAt: serverTimestamp()
  });
};

// Delete event
export const deleteEvent = async (eventId: string): Promise<void> => {
  await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
};

// Register for event
export const registerForEvent = async (
  eventId: string,
  userId: string,
  userName: string,
  enableCalendarSync: boolean = false
): Promise<void> => {
  const attendeeRef = doc(db, EVENTS_COLLECTION, eventId, 'attendees', userId);

  const attendeeData: EventAttendeeDocument = {
    userId,
    userName,
    status: 'registered',
    registeredAt: Timestamp.now(),
    calendarSync: enableCalendarSync ? {
      isSynced: false,
      lastSyncedAt: undefined,
    } : undefined
  };

  await setDoc(attendeeRef, attendeeData);

  // Increment registered count
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
    registeredCount: increment(1)
  });
};

// Cancel registration
export const cancelEventRegistration = async (eventId: string, userId: string): Promise<void> => {
  const attendeeRef = doc(db, EVENTS_COLLECTION, eventId, 'attendees', userId);
  
  await updateDoc(attendeeRef, {
    status: 'cancelled'
  });
  
  // Decrement registered count
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
    registeredCount: increment(-1)
  });
};

// Mark attendance
export const markEventAttendance = async (
  eventId: string, 
  userId: string, 
  attended: boolean
): Promise<void> => {
  const attendeeRef = doc(db, EVENTS_COLLECTION, eventId, 'attendees', userId);
  
  await updateDoc(attendeeRef, {
    status: attended ? 'attended' : 'no-show',
    attendedAt: attended ? serverTimestamp() : null
  });
};

// Get event attendees
export const getEventAttendees = async (eventId: string): Promise<EventAttendeeDocument[]> => {
  const q = query(
    collection(db, EVENTS_COLLECTION, eventId, 'attendees'),
    orderBy('registeredAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as EventAttendeeDocument);
};

// Check if user is registered
export const isUserRegistered = async (eventId: string, userId: string): Promise<boolean> => {
  const attendeeRef = doc(db, EVENTS_COLLECTION, eventId, 'attendees', userId);
  const snapshot = await getDoc(attendeeRef);
  
  if (snapshot.exists()) {
    const data = snapshot.data() as EventAttendeeDocument;
    return data.status === 'registered' || data.status === 'attended';
  }
  return false;
};

// Get user's registered events
export const getUserRegisteredEvents = async (
  userId: string,
  limitCount: number = 10
): Promise<EventDocument[]> => {
  // Note: This requires a collection group query or denormalization
  // For now, we'll use a simple approach with client-side filtering
  const allEvents = await getDocs(collection(db, EVENTS_COLLECTION));
  const userEvents: EventDocument[] = [];

  for (const eventDoc of allEvents.docs) {
    const attendeeRef = doc(db, EVENTS_COLLECTION, eventDoc.id, 'attendees', userId);
    const attendeeSnapshot = await getDoc(attendeeRef);

    if (attendeeSnapshot.exists()) {
      const data = attendeeSnapshot.data() as EventAttendeeDocument;
      if (data.status === 'registered' || data.status === 'attended') {
        userEvents.push(eventDoc.data() as EventDocument);
      }
    }

    if (userEvents.length >= limitCount) break;
  }

  return userEvents;
};

// ============================================
// CALENDAR SYNC HELPERS
// ============================================

/**
 * Get attendee with calendar sync info
 * @param eventId - Event ID
 * @param userId - User ID
 */
export const getAttendeeWithCalendarSync = async (
  eventId: string,
  userId: string
): Promise<EventAttendeeDocument | null> => {
  const attendeeRef = doc(db, EVENTS_COLLECTION, eventId, 'attendees', userId);
  const snapshot = await getDoc(attendeeRef);

  if (snapshot.exists()) {
    return snapshot.data() as EventAttendeeDocument;
  }
  return null;
};

/**
 * Update calendar sync information for attendee
 * @param eventId - Event ID
 * @param userId - User ID
 * @param calendarSync - Calendar sync data
 */
export const updateAttendeeCalendarSync = async (
  eventId: string,
  userId: string,
  calendarSync: EventAttendeeDocument['calendarSync']
): Promise<void> => {
  const attendeeRef = doc(db, EVENTS_COLLECTION, eventId, 'attendees', userId);

  await updateDoc(attendeeRef, {
    calendarSync,
  });
};

/**
 * Check if event is synced to any calendar
 * @param eventId - Event ID
 * @param userId - User ID
 */
export const isEventSynced = async (
  eventId: string,
  userId: string
): Promise<boolean> => {
  const attendee = await getAttendeeWithCalendarSync(eventId, userId);
  return attendee?.calendarSync?.isSynced ?? false;
};

/**
 * Get all events that need calendar sync update
 * @param userId - User ID
 */
export const getEventsPendingSync = async (userId: string): Promise<EventDocument[]> => {
  const userEvents = await getUserRegisteredEvents(userId, 100);
  const pendingEvents: EventDocument[] = [];

  for (const event of userEvents) {
    const attendee = await getAttendeeWithCalendarSync(event.id, userId);
    if (attendee?.calendarSync && !attendee.calendarSync.isSynced) {
      pendingEvents.push(event);
    }
  }

  return pendingEvents;
};
