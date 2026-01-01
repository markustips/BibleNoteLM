import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export interface BackupData {
  version: string;
  exportDate: number;
  userData: Record<string, any>;
  textHighlights: any[];
  chapterNotes: any[];
  settings?: Record<string, any>;
}

export class BackupService {
  private static BACKUP_VERSION = '1.0.0';
  private static BACKUP_FILENAME = 'biblenotelm_backup.json';

  /**
   * Export all user data to JSON
   */
  static async exportData(): Promise<BackupData> {
    const userData = localStorage.getItem('bible_user_data');
    const textHighlights = localStorage.getItem('bible_text_highlights');
    const chapterNotes = localStorage.getItem('bible_chapter_notes');

    const backup: BackupData = {
      version: this.BACKUP_VERSION,
      exportDate: Date.now(),
      userData: userData ? JSON.parse(userData) : {},
      textHighlights: textHighlights ? JSON.parse(textHighlights) : [],
      chapterNotes: chapterNotes ? JSON.parse(chapterNotes) : [],
    };

    return backup;
  }

  /**
   * Import data from backup JSON
   */
  static async importData(backup: BackupData): Promise<void> {
    // Validate backup version
    if (!backup.version || !backup.exportDate) {
      throw new Error('Invalid backup file format');
    }

    // Restore data to localStorage
    if (backup.userData) {
      localStorage.setItem('bible_user_data', JSON.stringify(backup.userData));
    }
    if (backup.textHighlights) {
      localStorage.setItem('bible_text_highlights', JSON.stringify(backup.textHighlights));
    }
    if (backup.chapterNotes) {
      localStorage.setItem('bible_chapter_notes', JSON.stringify(backup.chapterNotes));
    }
  }

  /**
   * Save backup to device storage (Android/iOS)
   */
  static async saveToDevice(): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const backup = await this.exportData();
      const backupJson = JSON.stringify(backup, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `biblenotelm_backup_${timestamp}.json`;

      if (Capacitor.isNativePlatform()) {
        // Save to Documents directory on native platforms
        const result = await Filesystem.writeFile({
          path: filename,
          data: backupJson,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });

        return {
          success: true,
          path: result.uri,
        };
      } else {
        // Browser: trigger download
        const blob = new Blob([backupJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);

        return {
          success: true,
          path: filename,
        };
      }
    } catch (error) {
      console.error('Failed to save backup:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Share backup file (Android/iOS share sheet)
   */
  static async shareBackup(): Promise<{ success: boolean; error?: string }> {
    try {
      const backup = await this.exportData();
      const backupJson = JSON.stringify(backup, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `biblenotelm_backup_${timestamp}.json`;

      if (Capacitor.isNativePlatform()) {
        // Write to cache directory first
        const result = await Filesystem.writeFile({
          path: filename,
          data: backupJson,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        // Share the file
        await Share.share({
          title: 'Bible Note LM Backup',
          text: 'My Bible notes, highlights, and bookmarks',
          url: result.uri,
          dialogTitle: 'Share backup to...',
        });

        return { success: true };
      } else {
        // Browser: fallback to download
        return await this.saveToDevice();
      }
    } catch (error) {
      console.error('Failed to share backup:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Load backup from device storage
   */
  static async loadFromDevice(fileContent: string): Promise<{ success: boolean; error?: string }> {
    try {
      const backup: BackupData = JSON.parse(fileContent);
      await this.importData(backup);

      return { success: true };
    } catch (error) {
      console.error('Failed to load backup:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid backup file',
      };
    }
  }

  /**
   * Get backup statistics
   */
  static async getBackupStats(): Promise<{
    totalVerseData: number;
    totalHighlights: number;
    totalChapterNotes: number;
    lastExportDate?: number;
  }> {
    const backup = await this.exportData();

    return {
      totalVerseData: Object.keys(backup.userData || {}).length,
      totalHighlights: backup.textHighlights?.length || 0,
      totalChapterNotes: backup.chapterNotes?.length || 0,
      lastExportDate: backup.exportDate,
    };
  }

  /**
   * Clear all user data (for testing/reset)
   */
  static async clearAllData(): Promise<void> {
    if (confirm('Are you sure you want to delete ALL your notes, highlights, and bookmarks? This cannot be undone!')) {
      localStorage.removeItem('bible_user_data');
      localStorage.removeItem('bible_text_highlights');
      localStorage.removeItem('bible_chapter_notes');
    }
  }
}
