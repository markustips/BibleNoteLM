
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BibleSettingsState {
  downloadedVersions: string[];
  addDownloadedVersion: (id: string) => void;
  removeDownloadedVersion: (id: string) => void;
  isVersionDownloaded: (id: string) => boolean;
}

export const useBibleSettingsStore = create<BibleSettingsState>()(
  persist(
    (set, get) => ({
      downloadedVersions: [], // Default empty
      addDownloadedVersion: (id) => 
        set((state) => ({ 
          downloadedVersions: [...new Set([...state.downloadedVersions, id])] 
        })),
      removeDownloadedVersion: (id) => 
        set((state) => ({ 
          downloadedVersions: state.downloadedVersions.filter((v) => v !== id) 
        })),
      isVersionDownloaded: (id) => get().downloadedVersions.includes(id),
    }),
    {
      name: 'bible-settings-storage',
    }
  )
);
