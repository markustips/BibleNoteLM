import { create } from 'zustand';

export interface Note {
  id: string;
  timestamp: string;
  content: string;
  verseRef?: string;
  type: 'text' | 'verse';
}

interface SermonState {
  // State
  viewState: 'idle' | 'recording' | 'summary';
  timer: number;
  isPaused: boolean;
  transcript: string;
  notes: Note[];

  // Actions
  setViewState: (viewState: 'idle' | 'recording' | 'summary') => void;
  setTimer: (timer: number) => void;
  incrementTimer: () => void;
  togglePause: () => void;
  setIsPaused: (isPaused: boolean) => void;
  setTranscript: (transcript: string) => void;
  appendTranscript: (text: string) => void;
  addNote: (note: Note) => void;
  resetRecording: () => void;
}

const INITIAL_TRANSCRIPT = "...and sometimes we struggle to find meaning in the chaos, but looking back at the history of the church, we see patterns of redemption. ";

const INITIAL_NOTES: Note[] = [
  { id: '1', timestamp: '23:45', content: "Grace isn't just a concept, it's a person. This is a key takeaway.", type: 'text' },
  { id: '2', timestamp: '18:12', content: "Reminder to read this verse with the family tonight.", verseRef: "John 3:16", type: 'verse' },
  { id: '3', timestamp: '05:30', content: "Intro started with a powerful story about forgiveness.", type: 'text' }
];

export const useSermonStore = create<SermonState>((set) => ({
  // Initial State
  viewState: 'idle',
  timer: 0,
  isPaused: false,
  transcript: INITIAL_TRANSCRIPT,
  notes: INITIAL_NOTES,

  // Actions
  setViewState: (viewState) => set({ viewState }),
  
  setTimer: (timer) => set({ timer }),
  
  incrementTimer: () => set((state) => ({ timer: state.timer + 1 })),
  
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  
  setIsPaused: (isPaused) => set({ isPaused }),
  
  setTranscript: (transcript) => set({ transcript }),
  
  appendTranscript: (text) => set((state) => ({ transcript: state.transcript + text })),
  
  addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
  
  resetRecording: () => set({
    viewState: 'idle',
    timer: 0,
    isPaused: false,
    transcript: INITIAL_TRANSCRIPT,
    notes: INITIAL_NOTES // In a real app, this might be empty []
  })
}));