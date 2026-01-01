import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

export interface PrayerRequestDB {
  id: string;
  authorId: string;
  authorName: string;
  churchId?: string;
  content: string;
  category: 'Healing' | 'Guidance' | 'Family' | 'Praise' | 'Other';
  isAnswered: boolean;
  isAnonymous: boolean;
  isPublic: boolean; // true = global community, false = church only
  createdAt: number;
  updatedAt: number;
  syncedToCloud: boolean;
}

export interface PrayerHeart {
  id: string;
  prayerRequestId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: number;
}

export class PrayerDatabaseService {
  private static sqlite: SQLiteConnection;
  private static db: SQLiteDBConnection | null = null;
  private static DB_NAME = 'biblenotelm_prayers.db';
  private static DB_VERSION = 1;

  /**
   * Initialize SQLite connection and create tables
   */
  static async initialize(): Promise<void> {
    try {
      if (!Capacitor.isNativePlatform()) {
        console.log('SQLite: Running in browser, using localStorage fallback');
        return;
      }

      this.sqlite = new SQLiteConnection(CapacitorSQLite);

      // Create or open database
      this.db = await this.sqlite.createConnection(
        this.DB_NAME,
        false,
        'no-encryption',
        this.DB_VERSION,
        false
      );

      await this.db.open();

      // Create tables
      await this.createTables();

      console.log('✅ Prayer database initialized');
    } catch (error) {
      console.error('Failed to initialize prayer database:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  private static async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Prayer Requests table
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS prayer_requests (
        id TEXT PRIMARY KEY,
        authorId TEXT NOT NULL,
        authorName TEXT NOT NULL,
        churchId TEXT,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        isAnswered INTEGER DEFAULT 0,
        isAnonymous INTEGER DEFAULT 0,
        isPublic INTEGER DEFAULT 1,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        syncedToCloud INTEGER DEFAULT 0
      );
    `);

    // Prayer Hearts table (tracks who prayed)
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS prayer_hearts (
        id TEXT PRIMARY KEY,
        prayerRequestId TEXT NOT NULL,
        userId TEXT NOT NULL,
        userName TEXT NOT NULL,
        userAvatar TEXT,
        createdAt INTEGER NOT NULL,
        FOREIGN KEY (prayerRequestId) REFERENCES prayer_requests(id) ON DELETE CASCADE,
        UNIQUE(prayerRequestId, userId)
      );
    `);

    // Create indexes for performance
    await this.db.execute(`
      CREATE INDEX IF NOT EXISTS idx_prayer_requests_created
      ON prayer_requests(createdAt DESC);
    `);

    await this.db.execute(`
      CREATE INDEX IF NOT EXISTS idx_prayer_hearts_request
      ON prayer_hearts(prayerRequestId);
    `);
  }

  /**
   * Add a new prayer request
   */
  static async addPrayerRequest(prayer: Omit<PrayerRequestDB, 'syncedToCloud'>): Promise<void> {
    if (!this.db) {
      // Browser fallback - use localStorage
      const prayers = this.getLocalStoragePrayers();
      prayers.push({ ...prayer, syncedToCloud: false });
      localStorage.setItem('prayer_requests', JSON.stringify(prayers));
      return;
    }

    const query = `
      INSERT INTO prayer_requests
      (id, authorId, authorName, churchId, content, category, isAnswered, isAnonymous, isPublic, createdAt, updatedAt, syncedToCloud)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0);
    `;

    await this.db.run(query, [
      prayer.id,
      prayer.authorId,
      prayer.authorName,
      prayer.churchId || null,
      prayer.content,
      prayer.category,
      prayer.isAnswered ? 1 : 0,
      prayer.isAnonymous ? 1 : 0,
      prayer.isPublic ? 1 : 0,
      prayer.createdAt,
      prayer.updatedAt,
    ]);
  }

  /**
   * Get all prayer requests (with heart counts)
   */
  static async getAllPrayerRequests(): Promise<(PrayerRequestDB & { prayedCount: number })[]> {
    if (!this.db) {
      // Browser fallback
      const prayers = this.getLocalStoragePrayers();
      return prayers.map(p => ({ ...p, prayedCount: 0 }));
    }

    const query = `
      SELECT
        pr.*,
        COUNT(ph.id) as prayedCount
      FROM prayer_requests pr
      LEFT JOIN prayer_hearts ph ON pr.id = ph.prayerRequestId
      GROUP BY pr.id
      ORDER BY pr.createdAt DESC;
    `;

    const result = await this.db.query(query);

    return (result.values || []).map((row: any) => ({
      id: row.id,
      authorId: row.authorId,
      authorName: row.authorName,
      churchId: row.churchId,
      content: row.content,
      category: row.category,
      isAnswered: Boolean(row.isAnswered),
      isAnonymous: Boolean(row.isAnonymous),
      isPublic: Boolean(row.isPublic),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      syncedToCloud: Boolean(row.syncedToCloud),
      prayedCount: row.prayedCount || 0,
    }));
  }

  /**
   * Get prayer requests by author
   */
  static async getMyPrayerRequests(authorId: string): Promise<(PrayerRequestDB & { prayedCount: number })[]> {
    if (!this.db) {
      const prayers = this.getLocalStoragePrayers();
      return prayers.filter(p => p.authorId === authorId).map(p => ({ ...p, prayedCount: 0 }));
    }

    const query = `
      SELECT
        pr.*,
        COUNT(ph.id) as prayedCount
      FROM prayer_requests pr
      LEFT JOIN prayer_hearts ph ON pr.id = ph.prayerRequestId
      WHERE pr.authorId = ?
      GROUP BY pr.id
      ORDER BY pr.createdAt DESC;
    `;

    const result = await this.db.query(query, [authorId]);

    return (result.values || []).map((row: any) => ({
      id: row.id,
      authorId: row.authorId,
      authorName: row.authorName,
      churchId: row.churchId,
      content: row.content,
      category: row.category,
      isAnswered: Boolean(row.isAnswered),
      isAnonymous: Boolean(row.isAnonymous),
      isPublic: Boolean(row.isPublic),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      syncedToCloud: Boolean(row.syncedToCloud),
      prayedCount: row.prayedCount || 0,
    }));
  }

  /**
   * Add a heart (prayer) to a request
   */
  static async addHeart(heart: PrayerHeart): Promise<void> {
    if (!this.db) {
      // Browser fallback
      const hearts = this.getLocalStorageHearts();
      hearts.push(heart);
      localStorage.setItem('prayer_hearts', JSON.stringify(hearts));
      return;
    }

    const query = `
      INSERT OR IGNORE INTO prayer_hearts
      (id, prayerRequestId, userId, userName, userAvatar, createdAt)
      VALUES (?, ?, ?, ?, ?, ?);
    `;

    await this.db.run(query, [
      heart.id,
      heart.prayerRequestId,
      heart.userId,
      heart.userName,
      heart.userAvatar || null,
      heart.createdAt,
    ]);
  }

  /**
   * Get all hearts for a prayer request
   */
  static async getHeartsForPrayer(prayerRequestId: string): Promise<PrayerHeart[]> {
    if (!this.db) {
      const hearts = this.getLocalStorageHearts();
      return hearts.filter(h => h.prayerRequestId === prayerRequestId);
    }

    const query = `
      SELECT * FROM prayer_hearts
      WHERE prayerRequestId = ?
      ORDER BY createdAt DESC;
    `;

    const result = await this.db.query(query, [prayerRequestId]);

    return (result.values || []).map((row: any) => ({
      id: row.id,
      prayerRequestId: row.prayerRequestId,
      userId: row.userId,
      userName: row.userName,
      userAvatar: row.userAvatar,
      createdAt: row.createdAt,
    }));
  }

  /**
   * Check if user has prayed for a request
   */
  static async hasUserPrayed(prayerRequestId: string, userId: string): Promise<boolean> {
    if (!this.db) {
      const hearts = this.getLocalStorageHearts();
      return hearts.some(h => h.prayerRequestId === prayerRequestId && h.userId === userId);
    }

    const query = `
      SELECT COUNT(*) as count FROM prayer_hearts
      WHERE prayerRequestId = ? AND userId = ?;
    `;

    const result = await this.db.query(query, [prayerRequestId, userId]);
    return (result.values?.[0]?.count || 0) > 0;
  }

  /**
   * Update prayer request (mark as answered, edit content, etc.)
   */
  static async updatePrayerRequest(
    id: string,
    updates: Partial<Pick<PrayerRequestDB, 'content' | 'isAnswered' | 'category'>>
  ): Promise<void> {
    if (!this.db) {
      const prayers = this.getLocalStoragePrayers();
      const index = prayers.findIndex(p => p.id === id);
      if (index !== -1) {
        prayers[index] = { ...prayers[index], ...updates, updatedAt: Date.now() };
        localStorage.setItem('prayer_requests', JSON.stringify(prayers));
      }
      return;
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.content !== undefined) {
      fields.push('content = ?');
      values.push(updates.content);
    }
    if (updates.isAnswered !== undefined) {
      fields.push('isAnswered = ?');
      values.push(updates.isAnswered ? 1 : 0);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }

    if (fields.length === 0) return;

    fields.push('updatedAt = ?');
    values.push(Date.now());

    values.push(id);

    const query = `
      UPDATE prayer_requests
      SET ${fields.join(', ')}
      WHERE id = ?;
    `;

    await this.db.run(query, values);
  }

  /**
   * Delete prayer request
   */
  static async deletePrayerRequest(id: string): Promise<void> {
    if (!this.db) {
      const prayers = this.getLocalStoragePrayers();
      const filtered = prayers.filter(p => p.id !== id);
      localStorage.setItem('prayer_requests', JSON.stringify(filtered));
      return;
    }

    await this.db.run('DELETE FROM prayer_requests WHERE id = ?;', [id]);
  }

  /**
   * Mark prayers as synced to cloud
   */
  static async markAsSynced(ids: string[]): Promise<void> {
    if (!this.db || ids.length === 0) return;

    const placeholders = ids.map(() => '?').join(',');
    const query = `
      UPDATE prayer_requests
      SET syncedToCloud = 1
      WHERE id IN (${placeholders});
    `;

    await this.db.run(query, ids);
  }

  /**
   * Get unsynced prayers for cloud upload
   */
  static async getUnsyncedPrayers(): Promise<PrayerRequestDB[]> {
    if (!this.db) return [];

    const query = `
      SELECT * FROM prayer_requests
      WHERE syncedToCloud = 0 AND isPublic = 1
      ORDER BY createdAt ASC;
    `;

    const result = await this.db.query(query);

    return (result.values || []).map((row: any) => ({
      id: row.id,
      authorId: row.authorId,
      authorName: row.authorName,
      churchId: row.churchId,
      content: row.content,
      category: row.category,
      isAnswered: Boolean(row.isAnswered),
      isAnonymous: Boolean(row.isAnonymous),
      isPublic: Boolean(row.isPublic),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      syncedToCloud: Boolean(row.syncedToCloud),
    }));
  }

  // ============= Browser LocalStorage Fallback =============

  private static getLocalStoragePrayers(): PrayerRequestDB[] {
    try {
      const data = localStorage.getItem('prayer_requests');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static getLocalStorageHearts(): PrayerHeart[] {
    try {
      const data = localStorage.getItem('prayer_hearts');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Close database connection
   */
  static async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}
