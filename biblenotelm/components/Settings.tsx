
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BIBLE_VERSIONS } from '../types';
import { useBibleSettingsStore } from '../stores/useBibleSettingsStore';
import { useUserStore } from '../stores/useUserStore';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Crown, Users, Bell, Church, CreditCard, Shield } from 'lucide-react';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { downloadedVersions, addDownloadedVersion, removeDownloadedVersion } = useBibleSettingsStore();
  const { role, subscriptionTier, churchName, can } = useUserStore();
  
  // Local state for tracking download progress of specific items
  const [downloadingItems, setDownloadingItems] = useState<Record<string, number>>({});

  const handleDownload = (id: string) => {
    // Start simulation
    setDownloadingItems(prev => ({ ...prev, [id]: 0 }));
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5; // Random increment
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
            addDownloadedVersion(id);
            setDownloadingItems(prev => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });
        }, 500); // Small delay at 100% before switching to "Downloaded" state
      }
      setDownloadingItems(prev => ({ ...prev, [id]: progress }));
    }, 200);
  };

  const handleDelete = (id: string) => {
      if(confirm("Remove this version from offline storage?")) {
          removeDownloadedVersion(id);
      }
  };

  // Calculate total storage used (Mock calculation based on string parsing)
  const totalStorage = downloadedVersions.reduce((acc, id) => {
      const ver = BIBLE_VERSIONS.find(v => v.id === id);
      return acc + (ver ? parseFloat(ver.size.split(' ')[0]) : 0);
  }, 0);

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 p-4 bg-white/95 dark:bg-[#101a22]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <button 
          onClick={() => {
            Haptics.impact({ style: ImpactStyle.Light });
            navigate(-1);
          }} 
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined text-slate-700 dark:text-white">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white flex-1 text-center pr-8">Settings</h1>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Account & Subscription */}
        <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 px-1">Account</h3>
            <div className="bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                {/* Subscription Status */}
                <Link 
                  to="/subscription"
                  onClick={() => Haptics.impact({ style: ImpactStyle.Light })}
                  className="p-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-800"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center text-yellow-600">
                            <Crown className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-slate-700 dark:text-slate-200 font-medium block">Subscription</span>
                            <span className="text-xs text-slate-500 capitalize">{subscriptionTier} Plan</span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                </Link>
                
                {/* Church Membership */}
                <Link
                  to="/join-church"
                  onClick={() => Haptics.impact({ style: ImpactStyle.Light })}
                  className="p-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-800"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary">
                            <Church className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-slate-700 dark:text-slate-200 font-medium block">My Church</span>
                            <span className="text-xs text-slate-500">{churchName || 'Not joined'}</span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                </Link>

                {/* Backup & Data */}
                <Link
                  to="/settings/backup"
                  onClick={() => Haptics.impact({ style: ImpactStyle.Light })}
                  className="p-4 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                            <span className="material-symbols-outlined">backup</span>
                        </div>
                        <div>
                            <span className="text-slate-700 dark:text-slate-200 font-medium block">Backup & Restore</span>
                            <span className="text-xs text-slate-500">Export your notes and highlights</span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                </Link>
            </div>
        </div>
        
        {/* Admin/Pastor Section - Only show if user has permissions */}
        {can('manage_announcements') && (
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 px-1">
              Church Management
            </h3>
            <div className="bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <Link 
                  to="/admin"
                  onClick={() => Haptics.impact({ style: ImpactStyle.Light })}
                  className="p-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-800"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-slate-700 dark:text-slate-200 font-medium block">Dashboard</span>
                            <span className="text-xs text-slate-500">Manage announcements & events</span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                </Link>
                
                {can('view_members') && (
                  <Link 
                    to="/admin"
                    onClick={() => Haptics.impact({ style: ImpactStyle.Light })}
                    className="p-4 flex items-center justify-between"
                  >
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                              <Users className="w-5 h-5" />
                          </div>
                          <div>
                              <span className="text-slate-700 dark:text-slate-200 font-medium block">Members</span>
                              <span className="text-xs text-slate-500">View church members</span>
                          </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                  </Link>
                )}
            </div>
            
            {/* Role Badge */}
            <div className="mt-3 flex items-center gap-2 px-1">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs text-slate-500">You are signed in as <span className="font-bold text-primary capitalize">{role}</span></span>
            </div>
          </div>
        )}
        
        {/* Storage Summary */}
        <div className="bg-white dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
             <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary">
                     <span className="material-symbols-outlined">cloud_download</span>
                 </div>
                 <div>
                     <h3 className="font-bold text-slate-900 dark:text-white">Offline Storage</h3>
                     <p className="text-xs text-slate-500 dark:text-slate-400">Manage your downloaded content</p>
                 </div>
             </div>
             
             <div className="space-y-2">
                 <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                     <span>Used: {totalStorage.toFixed(1)} MB</span>
                     <span>Available: 24 GB</span>
                 </div>
                 <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                     <div 
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((totalStorage / 100) * 100, 100)}%` }} // Mock percentage relative to an arbitrary small cap for visual effect
                     ></div>
                 </div>
             </div>
        </div>

        {/* Bible Versions List */}
        <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 px-1">Bible Versions</h3>
            <div className="bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                {BIBLE_VERSIONS.map((version, index) => {
                    const isDownloaded = downloadedVersions.includes(version.id);
                    const isDownloading = downloadingItems[version.id] !== undefined;
                    const progress = downloadingItems[version.id] || 0;

                    return (
                        <div 
                            key={version.id} 
                            className={`p-4 flex items-center justify-between ${index !== BIBLE_VERSIONS.length - 1 ? 'border-b border-gray-50 dark:border-gray-800' : ''}`}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-slate-900 dark:text-white">{version.short}</h4>
                                    {isDownloaded && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                            OFFLINE
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{version.name} • {version.size}</p>
                            </div>

                            <div className="w-32 flex justify-end">
                                {isDownloading ? (
                                    <div className="w-full flex flex-col items-end gap-1">
                                         <span className="text-[10px] font-bold text-primary">{progress}%</span>
                                         <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                             <div 
                                                className="h-full bg-primary transition-all duration-200"
                                                style={{ width: `${progress}%` }}
                                             ></div>
                                         </div>
                                    </div>
                                ) : isDownloaded ? (
                                    <button 
                                        onClick={() => handleDelete(version.id)}
                                        className="p-2 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
                                    >
                                        <span className="material-symbols-outlined filled group-hover:unfilled">check_circle</span>
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleDownload(version.id)}
                                        className="p-2 rounded-full bg-gray-50 dark:bg-slate-800 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                    >
                                        <span className="material-symbols-outlined">download</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Other Settings (Mock) */}
        <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 px-1">General</h3>
            <div className="bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-800">
                    <span className="text-slate-700 dark:text-slate-200 font-medium">Dark Mode</span>
                    <button className="w-12 h-6 bg-gray-200 dark:bg-primary rounded-full relative transition-colors">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                    </button>
                </div>
                 <div className="p-4 flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-200 font-medium">Notifications</span>
                    <button className="w-12 h-6 bg-primary rounded-full relative transition-colors">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
