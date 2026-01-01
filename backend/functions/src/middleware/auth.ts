/**
 * Authentication Middleware
 * Handles user authentication and authorization checks
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { UserRole, UserDocument, AuditLogEntry } from '../types';

// ============================================
// AUTHENTICATION CHECK
// ============================================

/**
 * Verify user is authenticated
 */
export function requireAuth(context: functions.https.CallableContext): string {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to perform this action'
    );
  }

  return context.auth.uid;
}

// ============================================
// ROLE-BASED ACCESS CONTROL (RBAC)
// ============================================

/**
 * Get user document from Firestore
 */
export async function getUserDocument(userId: string): Promise<UserDocument> {
  const userDoc = await admin
    .firestore()
    .collection('users')
    .doc(userId)
    .get();

  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }

  return userDoc.data() as UserDocument;
}

/**
 * Require specific role(s)
 * Logs access attempts for compliance
 */
export async function requireRole(
  userId: string,
  allowedRoles: UserRole[],
  action: string = 'ACCESS'
): Promise<UserDocument> {
  const user = await getUserDocument(userId);

  if (!allowedRoles.includes(user.role)) {
    // LOG UNAUTHORIZED ACCESS ATTEMPT
    await logAccessAttempt(userId, action, 'DENIED', allowedRoles, {
      userRole: user.role,
    });

    throw new functions.https.HttpsError(
      'permission-denied',
      `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`
    );
  }

  // LOG AUTHORIZED ACCESS
  await logAccessAttempt(userId, action, 'SUCCESS', allowedRoles, {
    userRole: user.role,
  });

  return user;
}

/**
 * Check if user is super admin
 */
export async function requireSuperAdmin(userId: string): Promise<UserDocument> {
  return requireRole(userId, ['super_admin'], 'SUPER_ADMIN_ACCESS');
}

/**
 * Check if user is pastor or admin
 */
export async function requirePastorOrAdmin(userId: string): Promise<UserDocument> {
  return requireRole(userId, ['pastor', 'admin', 'super_admin'], 'PASTOR_ADMIN_ACCESS');
}

/**
 * Check if user is member of specific church
 */
export async function requireChurchMember(
  userId: string,
  churchId: string
): Promise<UserDocument> {
  const user = await getUserDocument(userId);

  if (user.churchId !== churchId) {
    // LOG UNAUTHORIZED CHURCH ACCESS
    await logAccessAttempt(userId, 'CHURCH_ACCESS', 'DENIED', [], {
      requestedChurchId: churchId,
      userChurchId: user.churchId,
    });

    throw new functions.https.HttpsError(
      'permission-denied',
      'User is not a member of this church'
    );
  }

  return user;
}

/**
 * Check if user is pastor of specific church
 */
export async function requireChurchPastor(
  userId: string,
  churchId: string
): Promise<UserDocument> {
  const user = await requirePastorOrAdmin(userId);

  if (user.churchId !== churchId && user.role !== 'super_admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User is not a pastor of this church'
    );
  }

  return user;
}

// ============================================
// SUBSCRIPTION CHECKS
// ============================================

/**
 * Verify user has active subscription
 */
export async function requireActiveSubscription(
  userId: string,
  requiredTier?: 'basic' | 'premium'
): Promise<void> {
  const user = await getUserDocument(userId);

  // Check subscription tier
  if (requiredTier && user.subscriptionTier === 'free') {
    throw new functions.https.HttpsError(
      'permission-denied',
      `This feature requires a ${requiredTier} subscription`
    );
  }

  // Get subscription status
  const subscriptionQuery = await admin
    .firestore()
    .collection('subscriptions')
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (subscriptionQuery.empty && user.subscriptionTier !== 'free') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'No active subscription found. Please renew your subscription.'
    );
  }
}

// ============================================
// AUDIT LOGGING
// ============================================

/**
 * Log access attempts for compliance (PIPEDA, CCPA)
 */
async function logAccessAttempt(
  userId: string,
  action: string,
  result: 'SUCCESS' | 'DENIED' | 'ERROR',
  requiredRoles: UserRole[],
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const logEntry: AuditLogEntry = {
      userId,
      action: action as any,
      collection: 'auth',
      result,
      requiredRoles,
      metadata,
      timestamp: admin.firestore.Timestamp.now(),
    };

    await admin.firestore().collection('audit_logs').add(logEntry);
  } catch (error) {
    console.error('Failed to log access attempt:', error);
    // Don't throw - logging failure shouldn't break the request
  }
}

/**
 * Log data access for compliance
 */
export async function logDataAccess(
  userId: string,
  action: 'READ' | 'WRITE' | 'DELETE',
  collection: string,
  documentId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const logEntry: AuditLogEntry = {
      userId,
      action,
      collection,
      documentId,
      result: 'SUCCESS',
      metadata,
      timestamp: admin.firestore.Timestamp.now(),
    };

    await admin.firestore().collection('audit_logs').add(logEntry);
  } catch (error) {
    console.error('Failed to log data access:', error);
  }
}

// ============================================
// PRIVACY ENFORCEMENT
// ============================================

/**
 * Enforce privacy rules for super admin
 * Super admins CANNOT see individual church activities
 */
export function enforceSuperAdminPrivacy(
  user: UserDocument,
  operation: 'church_activities' | 'member_data' | 'sermon_content'
): void {
  if (user.role === 'super_admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      `Super admins cannot access ${operation} for privacy compliance`
    );
  }
}

/**
 * Redact sensitive data from response
 */
export function redactSensitiveData<T extends Record<string, any>>(
  data: T,
  sensitiveFields: string[]
): Partial<T> {
  const redacted: any = { ...data };

  sensitiveFields.forEach((field) => {
    if (field in redacted) {
      redacted[field] = '[REDACTED]';
    }
  });

  return redacted as Partial<T>;
}

/**
 * Anonymize user data for analytics
 */
export function anonymizeUserData(user: UserDocument): Partial<UserDocument> {
  return {
    id: '[ANONYMIZED]',
    role: user.role,
    subscriptionTier: user.subscriptionTier,
    createdAt: user.createdAt,
    // Email, displayName, churchId are removed for privacy
  };
}
