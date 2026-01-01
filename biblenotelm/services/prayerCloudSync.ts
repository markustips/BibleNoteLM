import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  doc,
  updateDoc,
  increment,
  arrayUnion,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';
import { UnifiedDatabaseService, PrayerRequestDB, PrayerHeart } from './unifiedDatabase';

export interface CloudPrayerRequest {
  id: string;
  authorId: string;
  authorName: string;
  churchId?: string;
  content: string;
  category: 'Healing' | 'Guidance' | 'Family' | 'Praise' | 'Other';
  isAnswered: boolean;
  isAnonymous: boolean;
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  prayedCount: number;
  prayedBy: string[]; // Array of user IDs who prayed
}

export class PrayerCloudSyncService {
  private static COLLECTION_NAME = 'communityPrayers';
  private static syncInterval: number | null = null;
  private static listener: Unsubscribe | null = null;

  /**
   * Upload local unsynced prayers to cloud
   */
  static async syncToCloud(): Promise<{ uploaded: number; errors: number }> {
    try {
      const unsyncedPrayers = await UnifiedDatabaseService.getUnsyncedPrayers();

      if (unsyncedPrayers.length === 0) {
        console.log('✅ No prayers to sync');
        return { uploaded: 0, errors: 0 };
      }

      const syncedIds: string[] = [];
      let errors = 0;

      for (const prayer of unsyncedPrayers) {
        try {
          await this.uploadPrayerToCloud(prayer);
          syncedIds.push(prayer.id);
        } catch (error) {
          console.error(`Failed to sync prayer ${prayer.id}:`, error);
          errors++;
        }
      }

      // Mark as synced locally
      if (syncedIds.length > 0) {
        await UnifiedDatabaseService.markPrayersAsSynced(syncedIds);
      }

      console.log(`✅ Synced ${syncedIds.length} prayers to cloud (${errors} errors)`);
      return { uploaded: syncedIds.length, errors };
    } catch (error) {
      console.error('Failed to sync prayers to cloud:', error);
      return { uploaded: 0, errors: 1 };
    }
  }

  /**
   * Upload a single prayer to Firestore
   */
  private static async uploadPrayerToCloud(prayer: PrayerRequestDB): Promise<void> {
    const cloudPrayer: Omit<CloudPrayerRequest, 'id'> = {
      authorId: prayer.authorId,
      authorName: prayer.isAnonymous ? 'Anonymous' : prayer.authorName,
      churchId: prayer.churchId,
      content: prayer.content,
      category: prayer.category,
      isAnswered: prayer.isAnswered,
      isAnonymous: prayer.isAnonymous,
      isPublic: prayer.isPublic,
      createdAt: Timestamp.fromMillis(prayer.createdAt),
      updatedAt: Timestamp.fromMillis(prayer.updatedAt),
      prayedCount: 0,
      prayedBy: [],
    };

    await addDoc(collection(db, this.COLLECTION_NAME), cloudPrayer);
  }

  /**
   * Fetch community prayers from cloud
   */
  static async fetchCommunityPrayers(
    limitCount: number = 50,
    churchIdFilter?: string
  ): Promise<CloudPrayerRequest[]> {
    try {
      const constraints = [
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      ];

      if (churchIdFilter) {
        constraints.splice(0, 0, where('churchId', '==', churchIdFilter));
      }

      const q = query(collection(db, this.COLLECTION_NAME), ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt,
        updatedAt: doc.data().updatedAt,
      } as CloudPrayerRequest));
    } catch (error) {
      console.error('Failed to fetch community prayers:', error);
      return [];
    }
  }

  /**
   * Add a heart/prayer to a cloud prayer request
   */
  static async addHeartToCloudPrayer(
    prayerId: string,
    userId: string
  ): Promise<void> {
    try {
      const prayerRef = doc(db, this.COLLECTION_NAME, prayerId);

      await updateDoc(prayerRef, {
        prayedCount: increment(1),
        prayedBy: arrayUnion(userId),
      });

      console.log(`✅ Added heart to cloud prayer ${prayerId}`);
    } catch (error) {
      console.error('Failed to add heart to cloud prayer:', error);
      throw error;
    }
  }

  /**
   * Start real-time listener for community prayers
   */
  static startRealtimeSync(
    onUpdate: (prayers: CloudPrayerRequest[]) => void,
    churchIdFilter?: string
  ): void {
    if (this.listener) {
      console.log('Real-time sync already active');
      return;
    }

    const constraints = [
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(50)
    ];

    if (churchIdFilter) {
      constraints.splice(0, 0, where('churchId', '==', churchIdFilter));
    }

    const q = query(collection(db, this.COLLECTION_NAME), ...constraints);

    this.listener = onSnapshot(q, (snapshot) => {
      const prayers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as CloudPrayerRequest));

      console.log(`📡 Real-time update: ${prayers.length} community prayers`);
      onUpdate(prayers);
    }, (error) => {
      console.error('Real-time sync error:', error);
    });

    console.log('✅ Started real-time prayer sync');
  }

  /**
   * Stop real-time listener
   */
  static stopRealtimeSync(): void {
    if (this.listener) {
      this.listener();
      this.listener = null;
      console.log('✅ Stopped real-time prayer sync');
    }
  }

  /**
   * Start automatic background sync (every 5 minutes)
   */
  static startAutoSync(intervalMinutes: number = 5): void {
    if (this.syncInterval) {
      console.log('Auto-sync already running');
      return;
    }

    // Initial sync
    this.syncToCloud();

    // Set up interval
    this.syncInterval = window.setInterval(() => {
      console.log('🔄 Auto-syncing prayers...');
      this.syncToCloud();
    }, intervalMinutes * 60 * 1000);

    console.log(`✅ Started auto-sync (every ${intervalMinutes} minutes)`);
  }

  /**
   * Stop automatic background sync
   */
  static stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('✅ Stopped auto-sync');
    }
  }

  /**
   * Get prayer statistics
   */
  static async getPrayerStats(userId: string): Promise<{
    totalPrayers: number;
    totalPrayedFor: number;
    answeredPrayers: number;
  }> {
    try {
      const myPrayers = await UnifiedDatabaseService.getMyPrayerRequests(userId);

      return {
        totalPrayers: myPrayers.length,
        totalPrayedFor: myPrayers.reduce((sum, p) => sum + p.prayedCount, 0),
        answeredPrayers: myPrayers.filter(p => p.isAnswered).length,
      };
    } catch (error) {
      console.error('Failed to get prayer stats:', error);
      return { totalPrayers: 0, totalPrayedFor: 0, answeredPrayers: 0 };
    }
  }

  /**
   * Merge cloud prayers with local prayers
   */
  static async mergeCloudAndLocalPrayers(
    userId: string,
    churchId?: string
  ): Promise<PrayerRequestDB[]> {
    try {
      // Get local prayers
      const localPrayers = await UnifiedDatabaseService.getAllPrayerRequests();

      // Get cloud prayers
      const cloudPrayers = await this.fetchCommunityPrayers(50, churchId);

      // Convert cloud prayers to local format
      const convertedCloud: PrayerRequestDB[] = cloudPrayers
        .filter(cp => cp.authorId !== userId) // Exclude own prayers (already in local)
        .map(cp => ({
          id: cp.id,
          authorId: cp.authorId,
          authorName: cp.authorName,
          churchId: cp.churchId,
          content: cp.content,
          category: cp.category,
          isAnswered: cp.isAnswered,
          isAnonymous: cp.isAnonymous,
          isPublic: cp.isPublic,
          createdAt: cp.createdAt.toMillis(),
          updatedAt: cp.updatedAt.toMillis(),
          syncedToCloud: true,
        }));

      // Merge and sort by createdAt
      const merged = [...localPrayers, ...convertedCloud].sort(
        (a, b) => b.createdAt - a.createdAt
      );

      return merged;
    } catch (error) {
      console.error('Failed to merge prayers:', error);
      return await UnifiedDatabaseService.getAllPrayerRequests();
    }
  }
}
