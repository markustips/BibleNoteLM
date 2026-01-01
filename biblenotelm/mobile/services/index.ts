/**
 * Local Services Index
 * Export all local storage and management services
 */

// Local Storage Service (device filesystem)
export * from './localStorageService';

// Sermon Manager (combines local + Firebase)
export * from './sermonManager';

// Event Services
export * from './eventLocalStorageService';
export * from './calendarSyncService';
export * from './eventReminderService';
export * from './eventImageCacheService';

// Event Integration (complete workflows)
export * from './eventIntegrationExample';
