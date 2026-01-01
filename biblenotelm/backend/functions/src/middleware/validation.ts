/**
 * Input Validation Middleware
 * Validates and sanitizes user input
 */

import * as functions from 'firebase-functions';
import Joi from 'joi';

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const schemas = {
  // Church creation
  createChurch: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).optional(),
    address: Joi.object({
      street: Joi.string().max(200),
      city: Joi.string().max(100),
      state: Joi.string().max(100),
      zipCode: Joi.string().max(20),
      country: Joi.string().max(100),
    }).optional(),
    phone: Joi.string().max(20).optional(),
    email: Joi.string().email().optional(),
  }),

  // Church update
  updateChurch: Joi.object({
    name: Joi.string().min(3).max(100).optional(),
    description: Joi.string().max(500).optional(),
    address: Joi.object({
      street: Joi.string().max(200),
      city: Joi.string().max(100),
      state: Joi.string().max(100),
      zipCode: Joi.string().max(20),
      country: Joi.string().max(100),
    }).optional(),
    phone: Joi.string().max(20).optional(),
    email: Joi.string().email().optional(),
  }),

  // Subscription creation
  createSubscription: Joi.object({
    tier: Joi.string().valid('basic', 'premium').required(),
    priceId: Joi.string().required(),
    paymentMethodId: Joi.string().optional(),
  }),

  // Join church
  joinChurch: Joi.object({
    churchCode: Joi.string().length(8).uppercase().required(),
  }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),

  // Date range
  dateRange: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
  }),

  // Announcement creation
  createAnnouncement: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    content: Joi.string().min(10).max(5000).required(),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    isPublished: Joi.boolean().default(false),
    expiresAt: Joi.date().iso().optional(),
    imageUrl: Joi.string().uri().optional(),
    imagePath: Joi.string().optional(),
  }),

  // Announcement update
  updateAnnouncement: Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    content: Joi.string().min(10).max(5000).optional(),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
    isPublished: Joi.boolean().optional(),
    expiresAt: Joi.date().iso().optional(),
    imageUrl: Joi.string().uri().optional(),
    imagePath: Joi.string().optional(),
  }),

  // Event creation
  createEvent: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().min(10).max(5000).required(),
    location: Joi.string().max(500).optional(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
    category: Joi.string()
      .valid('service', 'bible_study', 'prayer_meeting', 'fellowship', 'outreach', 'other')
      .default('other'),
    maxAttendees: Joi.number().integer().min(1).optional(),
    isPublished: Joi.boolean().default(false),
  }),

  // Event update
  updateEvent: Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    description: Joi.string().min(10).max(5000).optional(),
    location: Joi.string().max(500).optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    category: Joi.string()
      .valid('service', 'bible_study', 'prayer_meeting', 'fellowship', 'outreach', 'other')
      .optional(),
    maxAttendees: Joi.number().integer().min(1).optional(),
    isPublished: Joi.boolean().optional(),
  }),

  // Prayer creation
  createPrayer: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    content: Joi.string().min(10).max(5000).required(),
    visibility: Joi.string().valid('public', 'church', 'private').default('church'),
    category: Joi.string()
      .valid('general', 'healing', 'guidance', 'thanksgiving', 'intercession', 'other')
      .default('general'),
  }),

  // Prayer update
  updatePrayer: Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    content: Joi.string().min(10).max(5000).optional(),
    visibility: Joi.string().valid('public', 'church', 'private').optional(),
    category: Joi.string()
      .valid('general', 'healing', 'guidance', 'thanksgiving', 'intercession', 'other')
      .optional(),
    isAnswered: Joi.boolean().optional(),
    answeredNote: Joi.string().max(1000).optional(),
  }),
};

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate data against schema
 */
export function validate<T>(
  data: any,
  schema: Joi.ObjectSchema<T>
): T {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const messages = error.details.map((detail) => detail.message).join(', ');
    throw new functions.https.HttpsError('invalid-argument', `Validation error: ${messages}`);
  }

  return value as T;
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .substring(0, 10000); // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate church code format
 */
export function isValidChurchCode(code: string): boolean {
  // Format: 8 uppercase alphanumeric characters
  const codeRegex = /^[A-Z0-9]{8}$/;
  return codeRegex.test(code);
}

/**
 * Validate phone number format (flexible, supports international)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// SECURITY CHECKS
// ============================================

/**
 * Check for SQL injection patterns
 */
export function containsSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|\/\*|\*\/|;|'|")/gi,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Check for XSS patterns
 */
export function containsXss(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
