
import React, { useState, useEffect } from 'react';
import { Plus, Heart, CheckCircle2, User, Globe, Lock, Users } from 'lucide-react';
import { PrayerRequest } from '../types';
import { UnifiedDatabaseService, PrayerRequestDB, PrayerHeart } from '../services/unifiedDatabase';
import { PrayerCloudSyncService } from '../services/prayerCloudSync';
import { useUserStore } from '../stores/useUserStore';

const CATEGORIES = ['Healing', 'Guidance', 'Family', 'Praise', 'Other'];

interface ExtendedPrayerRequest extends PrayerRequestDB {
  prayedCount: number;
  isMine: boolean;
  heartsDetails?: PrayerHeart[];
}

const PrayerJournal: React.FC = () => {
  const { user } = useUserStore();
  const currentUserId = user?.id || 'guest';
  const currentUserName = user?.name || 'Guest';

  const [prayers, setPrayers] = useState<ExtendedPrayerRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'community' | 'personal'>('community');
  const [showAddModal, setShowAddModal] = useState(false);
  const [prayedFor, setPrayedFor] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Form State
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'Healing' | 'Guidance' | 'Family' | 'Praise' | 'Other'>('Other');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  // Initialize database on mount
  useEffect(() => {
    const init = async () => {
      try {
        await UnifiedDatabaseService.initialize();
        await loadPrayers();

        // Start auto-sync for subscribers
        if (user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'basic') {
          PrayerCloudSyncService.startAutoSync(5); // Sync every 5 minutes

          // Start real-time listener
          PrayerCloudSyncService.startRealtimeSync(
            () => loadPrayers(), // Reload on cloud updates
            user?.churchId
          );
        }
      } catch (error) {
        console.error('Failed to initialize prayer journal:', error);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      // Cleanup
      PrayerCloudSyncService.stopAutoSync();
      PrayerCloudSyncService.stopRealtimeSync();
    };
  }, [user]);

  // Load prayers from database
  const loadPrayers = async () => {
    try {
      const allPrayers = await UnifiedDatabaseService.getAllPrayerRequests();

      // Mark which prayers belong to current user
      const enriched: ExtendedPrayerRequest[] = allPrayers.map(p => ({
        ...p,
        isMine: p.authorId === currentUserId,
      }));

      // Load hearts/prayers for each request
      for (const prayer of enriched) {
        const hearts = await UnifiedDatabaseService.getHeartsForPrayer(prayer.id);
        prayer.heartsDetails = hearts;

        // Check if current user has prayed
        if (hearts.some(h => h.userId === currentUserId)) {
          setPrayedFor(prev => new Set(prev).add(prayer.id));
        }
      }

      setPrayers(enriched);
    } catch (error) {
      console.error('Failed to load prayers:', error);
    }
  };

  // Manual sync to cloud
  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const result = await PrayerCloudSyncService.syncToCloud();
      if (result.uploaded > 0) {
        alert(`✅ Synced ${result.uploaded} prayer${result.uploaded > 1 ? 's' : ''} to community`);
        await loadPrayers();
      } else {
        alert('All prayers are up to date!');
      }
    } catch (error) {
      alert('Failed to sync prayers. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  // Filtered Lists
  const displayedPrayers = activeTab === 'community'
    ? prayers
    : prayers.filter(p => p.isMine);

  const handleAddPrayer = async () => {
    if (!newContent.trim()) return;

    try {
      const now = Date.now();
      const newPrayer: PrayerRequestDB = {
        id: `${now}-${Math.random()}`,
        authorId: currentUserId,
        authorName: isAnonymous ? 'Anonymous' : currentUserName,
        churchId: user?.churchId,
        content: newContent,
        category: newCategory,
        isAnswered: false,
        isAnonymous,
        isPublic,
        createdAt: now,
        updatedAt: now,
        syncedToCloud: false,
      };

      await UnifiedDatabaseService.addPrayerRequest(newPrayer);

      // If public, sync to cloud immediately for premium users
      if (isPublic && (user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'basic')) {
        PrayerCloudSyncService.syncToCloud();
      }

      setNewContent('');
      setNewCategory('Other');
      setIsAnonymous(false);
      setIsPublic(true);
      setShowAddModal(false);
      setActiveTab('personal'); // Switch to personal tab

      await loadPrayers();
    } catch (error) {
      console.error('Failed to add prayer:', error);
      alert('Failed to add prayer. Please try again.');
    }
  };

  const handlePrayInteraction = async (prayerId: string) => {
    if (prayedFor.has(prayerId)) return;

    try {
      const heart: PrayerHeart = {
        id: `${Date.now()}-${Math.random()}`,
        prayerRequestId: prayerId,
        userId: currentUserId,
        userName: currentUserName,
        userAvatar: user?.avatar,
        createdAt: Date.now(),
      };

      await UnifiedDatabaseService.addPrayerHeart(heart);

      setPrayedFor(prev => new Set(prev).add(prayerId));
      await loadPrayers();
    } catch (error) {
      console.error('Failed to add prayer heart:', error);
    }
  };

  const toggleAnswered = async (id: string) => {
    try {
      const prayer = prayers.find(p => p.id === id);
      if (!prayer) return;

      await UnifiedDatabaseService.updatePrayerRequest(id, {
        isAnswered: !prayer.isAnswered,
      });

      await loadPrayers();
    } catch (error) {
      console.error('Failed to update prayer:', error);
    }
  };

  const deletePrayer = async (id: string) => {
    if (!confirm('Delete this prayer request?')) return;

    try {
      await UnifiedDatabaseService.deletePrayerRequest(id);
      await loadPrayers();
    } catch (error) {
      console.error('Failed to delete prayer:', error);
    }
  };

  const getCategoryColor = (cat?: string) => {
    switch(cat) {
      case 'Healing': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'Praise': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Guidance': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col relative bg-background-light dark:bg-background-dark">
       
       {/* 1. Enhanced Header with Tabs */}
       <div className="bg-white dark:bg-[#101a22] pt-4 pb-0 px-4 sticky top-0 z-10 shadow-sm">
         <div className="flex justify-between items-center mb-4">
             <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Prayer Journal</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Carry each other’s burdens.</p>
             </div>
             <div className="flex gap-2">
                {/* Sync Button for Premium Users */}
                {(user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'basic') && (
                  <button
                    onClick={handleManualSync}
                    disabled={syncing}
                    className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50"
                    title="Sync to cloud"
                  >
                    <span className={`material-symbols-outlined text-[20px] ${syncing ? 'animate-spin' : ''}`}>
                      {syncing ? 'sync' : 'cloud_upload'}
                    </span>
                  </button>
                )}
                <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                    <Heart className="w-5 h-5 fill-current" />
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-[20px]">hands_home_work</span>
                </div>
             </div>
         </div>

         <div className="flex gap-6 border-b border-gray-100 dark:border-gray-800">
             <button 
                onClick={() => setActiveTab('community')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'community' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
             >
                 Community
             </button>
             <button 
                onClick={() => setActiveTab('personal')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'personal' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
             >
                 My Journal
             </button>
         </div>
       </div>

       {/* 2. Scrollable List */}
       <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-4">
         {loading ? (
             <div className="flex flex-col items-center justify-center py-20">
                 <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                 <p className="text-gray-500 font-medium">Loading prayers...</p>
             </div>
         ) : displayedPrayers.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 opacity-50">
                 <Heart className="w-16 h-16 text-gray-300 mb-4" />
                 <p className="text-gray-500 font-medium">No prayers found in this view.</p>
             </div>
         ) : (
            displayedPrayers.map(prayer => (
            <div 
                key={prayer.id} 
                className={`bg-white dark:bg-card-dark p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none border transition-all ${
                    prayer.isAnswered 
                    ? 'border-green-200 dark:border-green-900/50 bg-green-50/30 dark:bg-green-900/10' 
                    : 'border-slate-100 dark:border-slate-800'
                }`}
            >
                {/* Card Header */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                            prayer.isAnonymous
                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                            : 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white'
                        }`}>
                            {prayer.isAnonymous ? <User className="w-5 h-5" /> : prayer.authorName[0]}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 dark:text-white">{prayer.authorName}</span>
                                {prayer.isAnswered && (
                                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-green-600 bg-green-100 dark:bg-green-900/40 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                                        <CheckCircle2 className="w-3 h-3" /> Answered
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-slate-400">{formatRelativeTime(prayer.createdAt)}</span>
                                <span className="text-[6px] text-slate-300">•</span>
                                <span className={`text-[10px] font-medium px-1.5 rounded ${getCategoryColor(prayer.category)}`}>
                                    {prayer.category || 'General'}
                                </span>
                            </div>
                        </div>
                    </div>
                    {/* Interaction Buttons */}
                    {prayer.isMine ? (
                        <div className="flex gap-2">
                            <button 
                                onClick={() => toggleAnswered(prayer.id)}
                                className={`p-2 rounded-full transition-colors ${
                                    prayer.isAnswered 
                                    ? 'bg-green-500 text-white shadow-md' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-green-600'
                                }`}
                                title="Mark as Answered"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => deletePrayer(prayer.id)}
                                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Delete Request"
                            >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => handlePrayInteraction(prayer.id)}
                            className={`p-2 rounded-full transition-all active:scale-90 ${
                                prayedFor.has(prayer.id)
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                            }`}
                        >
                            <Heart className={`w-5 h-5 ${prayedFor.has(prayer.id) ? 'fill-current' : ''}`} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <p className={`text-sm leading-relaxed mb-4 ${prayer.isAnswered ? 'text-slate-600 dark:text-slate-300' : 'text-slate-700 dark:text-slate-200'}`}>
                    {prayer.content}
                </p>

                {/* Footer Stats - Show who prayed */}
                <div className="flex items-center gap-4 border-t border-slate-50 dark:border-slate-800 pt-3">
                    {prayer.heartsDetails && prayer.heartsDetails.length > 0 ? (
                      <>
                        <div className="flex -space-x-2" title={prayer.heartsDetails.map(h => h.userName).join(', ')}>
                            {prayer.heartsDetails.slice(0, 3).map((heart) => (
                                <div
                                  key={heart.id}
                                  className="w-7 h-7 rounded-full border-2 border-white dark:border-card-dark bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                                  title={heart.userName}
                                >
                                    {heart.userName[0].toUpperCase()}
                                </div>
                            ))}
                            {prayer.heartsDetails.length > 3 && (
                                 <div className="w-7 h-7 rounded-full border-2 border-white dark:border-card-dark bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                                    +{prayer.heartsDetails.length - 3}
                                 </div>
                            )}
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              {prayer.heartsDetails.length} {prayer.heartsDetails.length === 1 ? 'person' : 'people'} prayed
                          </span>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">
                            {prayer.heartsDetails.slice(0, 2).map(h => h.userName).join(', ')}
                            {prayer.heartsDetails.length > 2 && ` and ${prayer.heartsDetails.length - 2} more`}
                          </div>
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">No one has prayed yet. Be the first! 🙏</span>
                    )}
                </div>
            </div>
            ))
         )}
       </div>

       {/* 3. FAB */}
       <button 
         onClick={() => setShowAddModal(true)}
         className="fixed bottom-24 right-4 w-14 h-14 bg-primary hover:bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-300/50 flex items-center justify-center transition-transform active:scale-95 z-20"
       >
         <Plus className="w-8 h-8" />
       </button>

       {/* 4. Add Prayer Modal */}
       {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={() => setShowAddModal(false)}></div>
            <div className="relative w-full max-w-md bg-white dark:bg-[#1e293b] rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slideUp overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">New Prayer Request</h3>
                    <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Category Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setNewCategory(cat)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                        newCategory === cat 
                                        ? 'bg-primary text-white shadow-md scale-105' 
                                        : 'bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Input */}
                    <div className="space-y-3">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Request</label>
                         <textarea 
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            placeholder="Share what's on your heart..."
                            className="w-full h-32 p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white resize-none placeholder-slate-400"
                            autoFocus
                         />
                    </div>

                    {/* Privacy Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl cursor-pointer" onClick={() => setIsAnonymous(!isAnonymous)}>
                         <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAnonymous ? 'bg-slate-200 dark:bg-slate-700 text-slate-600' : 'bg-blue-100 dark:bg-blue-900/30 text-primary'}`}>
                                 {isAnonymous ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                             </div>
                             <div>
                                 <p className="text-sm font-bold text-slate-900 dark:text-white">
                                     {isAnonymous ? 'Post Anonymously' : 'Public Post'}
                                 </p>
                                 <p className="text-xs text-slate-500 dark:text-slate-400">
                                     {isAnonymous ? 'Your name will be hidden' : 'Visible to community'}
                                 </p>
                             </div>
                         </div>
                         <div className={`w-12 h-7 rounded-full transition-colors relative ${isAnonymous ? 'bg-slate-400' : 'bg-primary'}`}>
                             <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${isAnonymous ? 'left-6' : 'left-1'}`}></div>
                         </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-[#1e293b] pb-safe">
                    <button 
                        onClick={handleAddPrayer}
                        disabled={!newContent.trim()}
                        className="w-full py-4 bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-[0.98]"
                    >
                        Share Prayer Request
                    </button>
                </div>
            </div>
        </div>
       )}
    </div>
  );
};

export default PrayerJournal;
