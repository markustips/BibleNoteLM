import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

// ============= TYPE DEFINITIONS =============

export interface UserVerseData {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  note: string;
  highlight: 'yellow' | 'green' | 'blue' | 'purple' | '';
  bookmarked: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TextHighlight {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  color: 'yellow' | 'green' | 'blue' | 'purple';
  createdAt: number;
}

export interface ChapterNote {
  id: string;
  book: string;
  chapter: number;
  note: string;
  createdAt: number;
  updatedAt: number;
}

export interface PrayerRequestDB {
  id: string;
  authorId: string;
  authorName: string;
  churchId?: string;
  content: string;
  category: 'Healing' | 'Guidance' | 'Family' | 'Praise' | 'Other';
  isAnswered: boolean;
  isAnonymous: boolean;
  isPublic: boolean;
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

// ============= UNIFIED DATABASE SERVICE =============

export class UnifiedDatabaseService {
  private static sqlite: SQLiteConnection;
  private static db: SQLiteDBConnection | null = null;
  private static DB_NAME = 'biblenotelm_unified.db';
  private static DB_VERSION = 1;

  /**
   * Initialize SQLite connection and create all tables
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

      // Create all tables
      await this.createTables();

      console.log('✅ Unified database initialized');
    } catch (error) {
      console.error('Failed to initialize unified database:', error);
      throw error;
    }
  }

  /**
   * Create all database tables
   */
  private static async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // ===== BIBLE DATA TABLES =====

    // Verse notes and highlights
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS verse_data (
        id TEXT PRIMARY KEY,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        note TEXT,
        highlight TEXT,
        bookmarked INTEGER DEFAULT 0,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        UNIQUE(book, chapter, verse)
      );
    `);

    // Text-range highlights
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS text_highlights (
        id TEXT PRIMARY KEY,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        startOffset INTEGER NOT NULL,
        endOffset INTEGER NOT NULL,
        selectedText TEXT NOT NULL,
        color TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );
    `);

    // Chapter notes
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS chapter_notes (
        id TEXT PRIMARY KEY,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        note TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        UNIQUE(book, chapter)
      );
    `);

    // ===== PRAYER DATA TABLES =====

    // Prayer requests
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

    // Prayer hearts
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

    // ===== INDEXES FOR PERFORMANCE =====

    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_verse_data_location ON verse_data(book, chapter, verse);`);
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_text_highlights_location ON text_highlights(book, chapter, verse);`);
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_chapter_notes_location ON chapter_notes(book, chapter);`);
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_prayer_requests_created ON prayer_requests(createdAt DESC);`);
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_prayer_hearts_request ON prayer_hearts(prayerRequestId);`);
  }

  // ============= BIBLE DATA METHODS =============

  /**
   * Get or create verse data
   */
  static async getVerseData(book: string, chapter: number, verse: number): Promise<UserVerseData> {
    if (!this.db) {
      // Browser fallback
      return this.getVerseDataFromLocalStorage(book, chapter, verse);
    }

    const query = `SELECT * FROM verse_data WHERE book = ? AND chapter = ? AND verse = ?;`;
    const result = await this.db.query(query, [book, chapter, verse]);

    if (result.values && result.values.length > 0) {
      const row = result.values[0];
      return {
        id: row.id,
        book: row.book,
        chapter: row.chapter,
        verse: row.verse,
        note: row.note || '',
        highlight: row.highlight || '',
        bookmarked: Boolean(row.bookmarked),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    }

    // Return empty default
    return {
      id: '',
      book,
      chapter,
      verse,
      note: '',
      highlight: '',
      bookmarked: false,
      createdAt: 0,
      updatedAt: 0,
    };
  }

  /**
   * Get all bookmarked verses
   */
  static async getAllBookmarks(): Promise<UserVerseData[]> {
    if (!this.db) {
      // Browser fallback - filter from localStorage
      try {
        const data = localStorage.getItem('bible_user_data');
        if (!data) {
          return [];
        }
        const allData = JSON.parse(data);
        return Object.values(allData).filter((data: any) => data && data.bookmarked);
      } catch (error) {
        console.error('Failed to load bookmarks from localStorage:', error);
        return [];
      }
    }

    const query = `
      SELECT * FROM verse_data
      WHERE bookmarked = 1
      ORDER BY updatedAt DESC;
    `;

    const result = await this.db.query(query);

    return (result.values || []).map((row: any) => ({
      id: row.id,
      book: row.book,
      chapter: row.chapter,
      verse: row.verse,
      note: row.note,
      highlight: row.highlight,
      bookmarked: Boolean(row.bookmarked),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  /**
   * Get all verse data (notes, highlights, bookmarks)
   */
  static async getAllVerseData(): Promise<UserVerseData[]> {
    if (!this.db) {
      // Browser fallback - get all from localStorage
      try {
        const data = localStorage.getItem('bible_user_data');
        if (!data) {
          return [];
        }
        const allData = JSON.parse(data);
        return Object.values(allData);
      } catch (error) {
        console.error('Failed to load verse data from localStorage:', error);
        return [];
      }
    }

    const query = `
      SELECT * FROM verse_data
      ORDER BY updatedAt DESC;
    `;

    const result = await this.db.query(query);

    return (result.values || []).map((row: any) => ({
      id: row.id,
      book: row.book,
      chapter: row.chapter,
      verse: row.verse,
      note: row.note || '',
      highlight: row.highlight || '',
      bookmarked: Boolean(row.bookmarked),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  /**
   * Save or update verse data
   */
  static async saveVerseData(data: UserVerseData): Promise<void> {
    if (!this.db) {
      this.saveVerseDataToLocalStorage(data);
      return;
    }

    const now = Date.now();
    const id = data.id || `${data.book}-${data.chapter}-${data.verse}`;

    const query = `
      INSERT OR REPLACE INTO verse_data
      (id, book, chapter, verse, note, highlight, bookmarked, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    await this.db.run(query, [
      id,
      data.book,
      data.chapter,
      data.verse,
      data.note || null,
      data.highlight || null,
      data.bookmarked ? 1 : 0,
      data.createdAt || now,
      now,
    ]);
  }

  /**
   * Get all text highlights for a verse
   */
  static async getTextHighlights(book: string, chapter: number, verse: number): Promise<TextHighlight[]> {
    if (!this.db) {
      return this.getTextHighlightsFromLocalStorage(book, chapter, verse);
    }

    const query = `
      SELECT * FROM text_highlights
      WHERE book = ? AND chapter = ? AND verse = ?
      ORDER BY startOffset ASC;
    `;

    const result = await this.db.query(query, [book, chapter, verse]);

    return (result.values || []).map((row: any) => ({
      id: row.id,
      book: row.book,
      chapter: row.chapter,
      verse: row.verse,
      startOffset: row.startOffset,
      endOffset: row.endOffset,
      selectedText: row.selectedText,
      color: row.color,
      createdAt: row.createdAt,
    }));
  }

  /**
   * Add a text highlight
   */
  static async addTextHighlight(highlight: TextHighlight): Promise<void> {
    if (!this.db) {
      this.addTextHighlightToLocalStorage(highlight);
      return;
    }

    const query = `
      INSERT INTO text_highlights
      (id, book, chapter, verse, startOffset, endOffset, selectedText, color, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    await this.db.run(query, [
      highlight.id,
      highlight.book,
      highlight.chapter,
      highlight.verse,
      highlight.startOffset,
      highlight.endOffset,
      highlight.selectedText,
      highlight.color,
      highlight.createdAt,
    ]);
  }

  /**
   * Delete a text highlight
   */
  static async deleteTextHighlight(id: string): Promise<void> {
    if (!this.db) {
      this.deleteTextHighlightFromLocalStorage(id);
      return;
    }

    await this.db.run('DELETE FROM text_highlights WHERE id = ?;', [id]);
  }

  /**
   * Get chapter note
   */
  static async getChapterNote(book: string, chapter: number): Promise<ChapterNote | null> {
    if (!this.db) {
      return this.getChapterNoteFromLocalStorage(book, chapter);
    }

    const query = `SELECT * FROM chapter_notes WHERE book = ? AND chapter = ?;`;
    const result = await this.db.query(query, [book, chapter]);

    if (result.values && result.values.length > 0) {
      const row = result.values[0];
      return {
        id: row.id,
        book: row.book,
        chapter: row.chapter,
        note: row.note,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    }

    return null;
  }

  /**
   * Save or update chapter note
   */
  static async saveChapterNote(note: ChapterNote): Promise<void> {
    if (!this.db) {
      this.saveChapterNoteToLocalStorage(note);
      return;
    }

    const now = Date.now();
    const id = note.id || `${note.book}-${note.chapter}`;

    const query = `
      INSERT OR REPLACE INTO chapter_notes
      (id, book, chapter, note, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?);
    `;

    await this.db.run(query, [
      id,
      note.book,
      note.chapter,
      note.note,
      note.createdAt || now,
      now,
    ]);
  }

  /**
   * Delete chapter note
   */
  static async deleteChapterNote(book: string, chapter: number): Promise<void> {
    if (!this.db) {
      this.deleteChapterNoteFromLocalStorage(book, chapter);
      return;
    }

    await this.db.run('DELETE FROM chapter_notes WHERE book = ? AND chapter = ?;', [book, chapter]);
  }

  // ============= PRAYER DATA METHODS =============
  // (Same as prayerDatabase.ts - reuse those methods)

  /**
   * Add prayer request
   */
  static async addPrayerRequest(prayer: Omit<PrayerRequestDB, 'syncedToCloud'>): Promise<void> {
    if (!this.db) {
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
   * Get all prayer requests
   */
  static async getAllPrayerRequests(): Promise<(PrayerRequestDB & { prayedCount: number })[]> {
    if (!this.db) {
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
   * Add prayer heart
   */
  static async addPrayerHeart(heart: PrayerHeart): Promise<void> {
    if (!this.db) {
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
   * Get hearts for prayer
   */
  static async getHeartsForPrayer(prayerRequestId: string): Promise<PrayerHeart[]> {
    if (!this.db) {
      const hearts = this.getLocalStorageHearts();
      return hearts.filter(h => h.prayerRequestId === prayerRequestId);
    }

    const query = `SELECT * FROM prayer_hearts WHERE prayerRequestId = ? ORDER BY createdAt DESC;`;
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
   * Update prayer request
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

    const query = `UPDATE prayer_requests SET ${fields.join(', ')} WHERE id = ?;`;
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
   * Get unsynced prayers
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

  /**
   * Mark prayers as synced
   */
  static async markPrayersAsSynced(ids: string[]): Promise<void> {
    if (!this.db || ids.length === 0) return;

    const placeholders = ids.map(() => '?').join(',');
    const query = `UPDATE prayer_requests SET syncedToCloud = 1 WHERE id IN (${placeholders});`;
    await this.db.run(query, ids);
  }

  // ============= BROWSER LOCALSTORAGE FALLBACK =============

  private static getVerseDataFromLocalStorage(book: string, chapter: number, verse: number): UserVerseData {
    try {
      const data = localStorage.getItem('bible_user_data');
      const allData = data ? JSON.parse(data) : {};
      const key = `${book}-${chapter}-${verse}`;
      return allData[key] || {
        id: key,
        book,
        chapter,
        verse,
        note: '',
        highlight: '',
        bookmarked: false,
        createdAt: 0,
        updatedAt: 0,
      };
    } catch {
      return {
        id: '',
        book,
        chapter,
        verse,
        note: '',
        highlight: '',
        bookmarked: false,
        createdAt: 0,
        updatedAt: 0,
      };
    }
  }

  private static saveVerseDataToLocalStorage(data: UserVerseData): void {
    try {
      const stored = localStorage.getItem('bible_user_data');
      const allData = stored ? JSON.parse(stored) : {};
      const key = `${data.book}-${data.chapter}-${data.verse}`;
      allData[key] = data;
      localStorage.setItem('bible_user_data', JSON.stringify(allData));
    } catch (error) {
      console.error('Failed to save verse data to localStorage:', error);
    }
  }

  private static getTextHighlightsFromLocalStorage(book: string, chapter: number, verse: number): TextHighlight[] {
    try {
      const data = localStorage.getItem('bible_text_highlights');
      const allHighlights: TextHighlight[] = data ? JSON.parse(data) : [];
      return allHighlights.filter(h => h.book === book && h.chapter === chapter && h.verse === verse);
    } catch {
      return [];
    }
  }

  private static addTextHighlightToLocalStorage(highlight: TextHighlight): void {
    try {
      const data = localStorage.getItem('bible_text_highlights');
      const all: TextHighlight[] = data ? JSON.parse(data) : [];
      all.push(highlight);
      localStorage.setItem('bible_text_highlights', JSON.stringify(all));
    } catch (error) {
      console.error('Failed to save highlight:', error);
    }
  }

  private static deleteTextHighlightFromLocalStorage(id: string): void {
    try {
      const data = localStorage.getItem('bible_text_highlights');
      const all: TextHighlight[] = data ? JSON.parse(data) : [];
      const filtered = all.filter(h => h.id !== id);
      localStorage.setItem('bible_text_highlights', JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete highlight:', error);
    }
  }

  private static getChapterNoteFromLocalStorage(book: string, chapter: number): ChapterNote | null {
    try {
      const data = localStorage.getItem('bible_chapter_notes');
      const allNotes: ChapterNote[] = data ? JSON.parse(data) : [];
      return allNotes.find(n => n.book === book && n.chapter === chapter) || null;
    } catch {
      return null;
    }
  }

  private static saveChapterNoteToLocalStorage(note: ChapterNote): void {
    try {
      const data = localStorage.getItem('bible_chapter_notes');
      const all: ChapterNote[] = data ? JSON.parse(data) : [];
      const index = all.findIndex(n => n.book === note.book && n.chapter === note.chapter);

      if (index !== -1) {
        all[index] = note;
      } else {
        all.push(note);
      }

      localStorage.setItem('bible_chapter_notes', JSON.stringify(all));
    } catch (error) {
      console.error('Failed to save chapter note:', error);
    }
  }

  private static deleteChapterNoteFromLocalStorage(book: string, chapter: number): void {
    try {
      const data = localStorage.getItem('bible_chapter_notes');
      const all: ChapterNote[] = data ? JSON.parse(data) : [];
      const filtered = all.filter(n => !(n.book === book && n.chapter === chapter));
      localStorage.setItem('bible_chapter_notes', JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete chapter note:', error);
    }
  }

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
