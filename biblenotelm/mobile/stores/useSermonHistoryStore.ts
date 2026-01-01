import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Note } from './useSermonStore';

export interface SavedSermon {
  id: string;
  title: string;
  date: string;
  duration: string;
  transcript: string;
  notes: Note[];
}

interface SermonHistoryState {
  sermons: SavedSermon[];
  addSermon: (sermon: SavedSermon) => void;
  deleteSermon: (id: string) => void;
  getSermon: (id: string) => SavedSermon | undefined;
}

// Initial mock data for demonstration
const MOCK_HISTORY: SavedSermon[] = [
  {
    id: 'mock-1',
    title: 'Finding Hope in Chaos',
    date: 'Oct 14, 2023',
    duration: '35:20',
    transcript: "Welcome everyone. Today we are talking about finding hope when everything seems chaotic...",
    notes: [
      { id: '1', timestamp: '05:30', content: "Key verse: Jeremiah 29:11", type: 'text' },
      { id: '2', timestamp: '12:45', content: "Chaos is often the precursor to creation.", type: 'text' }
    ]
  },
  {
    id: 'mock-2',
    title: 'The Power of Community',
    date: 'Oct 07, 2023',
    duration: '42:15',
    transcript: "Community isn't just about proximity, it's about shared purpose...",
    notes: [
      { id: '1', timestamp: '10:00', content: "We are designed for connection.", type: 'text' }
    ]
  }
];

export const useSermonHistoryStore = create<SermonHistoryState>()(
  persist(
    (set, get) => ({
      sermons: MOCK_HISTORY,
      addSermon: (sermon) => set((state) => ({ sermons: [sermon, ...state.sermons] })),
      deleteSermon: (id) => set((state) => ({ sermons: state.sermons.filter(s => s.id !== id) })),
      getSermon: (id) => get().sermons.find((s) => s.id === id),
    }),
    {
      name: 'sermon-history-storage',
    }
  )
);