import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackupService } from '../services/backupService';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalVerseData: 0,
    totalHighlights: 0,
    totalChapterNotes: 0,
  });
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const backupStats = await BackupService.getBackupStats();
    setStats(backupStats);
  };

  const handleExportToDevice = async () => {
    setLoading(true);
    const result = await BackupService.saveToDevice();
    setLoading(false);

    if (result.success) {
      alert(`✅ Backup saved successfully!\n\nFile: ${result.path}`);
    } else {
      alert(`❌ Failed to save backup: ${result.error}`);
    }
  };

  const handleShareBackup = async () => {
    setLoading(true);
    const result = await BackupService.shareBackup();
    setLoading(false);

    if (!result.success && result.error) {
      alert(`❌ Failed to share backup: ${result.error}`);
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const result = await BackupService.loadFromDevice(content);

      if (result.success) {
        alert('✅ Backup restored successfully!\n\nPlease refresh the app to see your restored data.');
        window.location.reload();
      } else {
        alert(`❌ Failed to restore backup: ${result.error}`);
      }
      setLoading(false);
    };

    reader.onerror = () => {
      alert('❌ Failed to read file');
      setLoading(false);
    };

    reader.readAsText(file);
  };

  const handleClearData = async () => {
    await BackupService.clearAllData();
    await loadStats();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#101a22]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-[#101a22] border-b border-gray-100 dark:border-gray-800 pt-safe">
        <div className="flex items-center gap-3 px-4 h-16">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Settings & Backup</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-6">

          {/* Stats Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
            <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">assessment</span>
              Your Bible Study Data
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalVerseData}</div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">Verse Notes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalHighlights}</div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">Highlights</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalChapterNotes}</div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">Chapter Notes</div>
              </div>
            </div>
          </div>

          {/* Backup Section */}
          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Backup & Restore</h2>

            <div className="space-y-3">
              {/* Export to Device */}
              <button
                onClick={handleExportToDevice}
                disabled={loading}
                className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400">download</span>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-slate-900 dark:text-white">Export to Device</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Save backup file to your device</p>
                </div>
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
              </button>

              {/* Share Backup */}
              <button
                onClick={handleShareBackup}
                disabled={loading}
                className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">share</span>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-slate-900 dark:text-white">Share Backup</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Send to email, Drive, or other apps</p>
                </div>
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
              </button>

              {/* Import Backup */}
              <label className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">upload</span>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-slate-900 dark:text-white">Import Backup</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Restore from backup file</p>
                </div>
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>
          </div>

          {/* Premium Section (Coming Soon) */}
          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Premium Features</h2>

            <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-800/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-700">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white filled">workspace_premium</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2">Automatic Cloud Sync</h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
                    Never lose your notes! Get automatic backup to Google Drive with version history and multi-device sync.
                  </p>
                  <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors shadow-sm">
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Danger Zone</h2>

            <button
              onClick={handleClearData}
              className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400">delete_forever</span>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-red-600 dark:text-red-400">Clear All Data</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Delete all notes, highlights, and bookmarks</p>
              </div>
            </button>
          </div>

        </div>
      </main>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-900 dark:text-white font-medium">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
