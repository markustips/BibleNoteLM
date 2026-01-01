
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { GeminiService } from '../services/geminiService';
import { BIBLE_VERSIONS } from '../types';
import { useBibleSettingsStore } from '../stores/useBibleSettingsStore';
import { fetchChapter as fetchApiBibleChapter } from '../services/apiBibleService';
import { UnifiedDatabaseService, UserVerseData as DBUserVerseData, TextHighlight as DBTextHighlight, ChapterNote as DBChapterNote } from '../services/unifiedDatabase';

const BIBLE_BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", 
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", 
  "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", 
  "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", 
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", 
  "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", 
  "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", 
  "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", 
  "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

interface ApiVerse {
  verse: number;
  text: string;
}

type HighlightColor = 'yellow' | 'green' | 'blue' | 'purple';

interface TextHighlight {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  color: HighlightColor;
  createdAt: number;
}

interface UserVerseData {
  highlight?: HighlightColor;
  note?: string;
  bookmarked?: boolean;
}

interface ChapterNote {
  id: string;
  book: string;
  chapter: number;
  note: string;
  createdAt: number;
  updatedAt: number;
}

interface HighlightStorage {
  highlights: TextHighlight[];
  verseData: Record<string, UserVerseData>;
}

// --- Audio Helper Functions (PCM Decoding) ---

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const BibleReader: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { isVersionDownloaded } = useBibleSettingsStore();

  // --- Navigation & Data State ---
  const [currentVersion, setCurrentVersion] = useState<string>('kjv');
  const [currentBook, setCurrentBook] = useState<string>('Romans');
  const [currentChapter, setCurrentChapter] = useState<number>(5);
  const [verses, setVerses] = useState<ApiVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [scrollToVerse, setScrollToVerse] = useState<number | null>(null);

  // --- User Data State (SQLite Database) ---
  const [userData, setUserData] = useState<Record<string, UserVerseData>>({});
  const [textHighlights, setTextHighlights] = useState<TextHighlight[]>([]);

  // Initialize database on mount
  useEffect(() => {
    const initDB = async () => {
      try {
        await UnifiedDatabaseService.initialize();
        console.log('✅ Unified database initialized');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    initDB();
  }, []);

  // --- Chapter Notes State (SQLite Database) ---
  const [chapterNotes, setChapterNotes] = useState<ChapterNote[]>([]);

  // --- Text Selection State ---
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({ x: 0, y: 0 });
  const [pendingHighlight, setPendingHighlight] = useState<{
    verse: number;
    startOffset: number;
    endOffset: number;
    selectedText: string;
  } | null>(null);

  // --- Notes Modal State ---
  const [showChapterNoteModal, setShowChapterNoteModal] = useState(false);
  const [chapterNoteText, setChapterNoteText] = useState('');

  // --- Read URL Parameters (for search navigation) ---
  useEffect(() => {
    const bookParam = searchParams.get('book');
    const chapterParam = searchParams.get('chapter');
    const verseParam = searchParams.get('verse');

    if (bookParam) {
      console.log('Navigating to book from search:', bookParam);
      setCurrentBook(bookParam);
    }
    if (chapterParam) {
      const chapter = parseInt(chapterParam);
      console.log('Navigating to chapter from search:', chapter);
      setCurrentChapter(chapter);
    }
    if (verseParam) {
      const verse = parseInt(verseParam);
      console.log('Navigating to verse from search:', verse);
      setScrollToVerse(verse);
    }

    // Clear URL params after reading
    if (bookParam || chapterParam || verseParam) {
      navigate('/bible', { replace: true });
    }
  }, [location.search, searchParams, navigate]);

  // --- UI State ---
  const [showVersionPicker, setShowVersionPicker] = useState(false);
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [fontSize, setFontSize] = useState(1.125); // rem
  const [lineHeight, setLineHeight] = useState(1.8);
  
  // --- Selection & Action State ---
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  
  // --- Audio / Voice Reader State (Gemini Neural TTS) ---
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSpeakingVerse, setCurrentSpeakingVerse] = useState<number | null>(null);
  const [currentVoice, setCurrentVoice] = useState<'Charon' | 'Kore'>('Charon');
  const [isBuffering, setIsBuffering] = useState(false);
  
  // Refs for Audio Context
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCacheRef = useRef<Record<number, AudioBuffer>>({});
  const isPlayingRef = useRef(false);

  // --- Search State ---
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchChapter = async () => {
      setLoading(true);
      stopAudio();
      audioCacheRef.current = {}; // Clear audio cache on chapter change

      try {
        // Try API.Bible service first
        const verses = await fetchApiBibleChapter(currentBook, currentChapter, currentVersion);
        setVerses(verses);
      } catch (apiError) {
        // Silently fall back to bible-api.com (no key required)
        try {
          const res = await fetch(`https://bible-api.com/${currentBook}+${currentChapter}?translation=${currentVersion}`);
          if (!res.ok) throw new Error("Failed to fetch from fallback API");
          const data = await res.json();

          if (data.verses) {
            const formattedVerses: ApiVerse[] = data.verses.map((v: any) => ({
              verse: v.verse,
              text: v.text.replace(/\n/g, ' ').trim()
            }));
            setVerses(formattedVerses);
          } else {
            setVerses([]);
          }
        } catch (fallbackError) {
          console.error('Failed to fetch Bible verses:', fallbackError);
          setVerses([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchChapter();
  }, [currentBook, currentChapter, currentVersion]);

  // --- Load Bible data from SQLite when chapter changes ---
  useEffect(() => {
    const loadBibleData = async () => {
      try {
        // Load all verse data for current chapter
        const verseDataMap: Record<string, UserVerseData> = {};
        for (const verse of verses) {
          const data = await UnifiedDatabaseService.getVerseData(currentBook, currentChapter, verse.verse);
          const key = `${currentBook}-${currentChapter}-${verse.verse}`;
          verseDataMap[key] = {
            note: data.note,
            highlight: data.highlight as HighlightColor,
            bookmarked: data.bookmarked,
          };
        }
        setUserData(verseDataMap);

        // Load text highlights for current chapter
        const allHighlights: TextHighlight[] = [];
        for (const verse of verses) {
          const highlights = await UnifiedDatabaseService.getTextHighlights(currentBook, currentChapter, verse.verse);
          allHighlights.push(...highlights.map(h => ({
            ...h,
            color: h.color as HighlightColor,
          })));
        }
        setTextHighlights(allHighlights);

        // Load chapter note
        const chapterNote = await UnifiedDatabaseService.getChapterNote(currentBook, currentChapter);
        if (chapterNote) {
          setChapterNotes([chapterNote]);
        } else {
          setChapterNotes([]);
        }
      } catch (error) {
        console.error('Failed to load Bible data from database:', error);
      }
    };

    if (verses.length > 0) {
      loadBibleData();
    }
  }, [verses, currentBook, currentChapter]);

  // --- Scroll to verse after verses load (from search) ---
  useEffect(() => {
    if (scrollToVerse && verses.length > 0) {
      const verseElement = document.getElementById(`verse-${scrollToVerse}`);
      if (verseElement) {
        // Wait a bit for rendering to complete
        setTimeout(() => {
          verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setSelectedVerse(scrollToVerse);
          setScrollToVerse(null);
        }, 300);
      }
    }
  }, [scrollToVerse, verses]);

  // --- Helpers ---
  const getVerseKey = (verseNum: number) => `${currentBook}-${currentChapter}-${verseNum}`;
  const getVerseData = (verseNum: number) => userData[getVerseKey(verseNum)] || {};

  const updateVerseData = async (verseNum: number, updates: Partial<UserVerseData>) => {
      const key = getVerseKey(verseNum);

      // Update local state
      setUserData(prev => ({
          ...prev,
          [key]: { ...prev[key], ...updates }
      }));

      // Save to database
      try {
        const existingData = await UnifiedDatabaseService.getVerseData(currentBook, currentChapter, verseNum);
        const now = Date.now();

        await UnifiedDatabaseService.saveVerseData({
          id: existingData.id || `${currentBook}-${currentChapter}-${verseNum}`,
          book: currentBook,
          chapter: currentChapter,
          verse: verseNum,
          note: updates.note !== undefined ? updates.note : existingData.note,
          highlight: (updates.highlight !== undefined ? updates.highlight : existingData.highlight) as any,
          bookmarked: updates.bookmarked !== undefined ? updates.bookmarked : existingData.bookmarked,
          createdAt: existingData.createdAt || now,
          updatedAt: now,
        });
      } catch (error) {
        console.error('Failed to save verse data to database:', error);
      }
  };

  // --- Chapter Notes Helpers ---
  const getCurrentChapterNote = (): ChapterNote | undefined => {
    return chapterNotes.find(
      note => note.book === currentBook && note.chapter === currentChapter
    );
  };

  const saveChapterNote = async (noteContent: string) => {
    const existingNote = getCurrentChapterNote();

    if (noteContent.trim() === '') {
      // Delete note if empty
      if (existingNote) {
        setChapterNotes(prev => prev.filter(n => n.id !== existingNote.id));
        try {
          await UnifiedDatabaseService.deleteChapterNote(currentBook, currentChapter);
        } catch (error) {
          console.error('Failed to delete chapter note from database:', error);
        }
      }
    } else {
      const now = Date.now();
      if (existingNote) {
        // Update existing note
        const updatedNote = { ...existingNote, note: noteContent, updatedAt: now };
        setChapterNotes(prev => prev.map(n =>
          n.id === existingNote.id ? updatedNote : n
        ));

        try {
          await UnifiedDatabaseService.saveChapterNote(updatedNote);
        } catch (error) {
          console.error('Failed to update chapter note in database:', error);
        }
      } else {
        // Create new note
        const newNote: ChapterNote = {
          id: `${Date.now()}-${Math.random()}`,
          book: currentBook,
          chapter: currentChapter,
          note: noteContent,
          createdAt: now,
          updatedAt: now
        };
        setChapterNotes(prev => [...prev, newNote]);

        try {
          await UnifiedDatabaseService.saveChapterNote(newNote);
        } catch (error) {
          console.error('Failed to create chapter note in database:', error);
        }
      }
    }
  };

  // Load current chapter note when chapter changes
  useEffect(() => {
    const currentNote = getCurrentChapterNote();
    setChapterNoteText(currentNote?.note || '');
  }, [currentBook, currentChapter]);

  // --- Feature Handlers ---
  const handleHighlight = (color: HighlightColor) => {
      if (!selectedVerse) return;
      const current = getVerseData(selectedVerse);
      const newColor = current.highlight === color ? undefined : color;
      updateVerseData(selectedVerse, { highlight: newColor });
  };

  const handleBookmark = () => {
      if (!selectedVerse) return;
      const current = getVerseData(selectedVerse);
      updateVerseData(selectedVerse, { bookmarked: !current.bookmarked });
  };

  const handleNoteOpen = () => {
      if (!selectedVerse) return;
      const current = getVerseData(selectedVerse);
      setNoteText(current.note || '');
      setShowNoteModal(true);
  };

  const handleNoteSave = () => {
      if (selectedVerse) {
          updateVerseData(selectedVerse, { note: noteText });
      }
      setShowNoteModal(false);
  };

  const handleCopy = () => {
      if (!selectedVerse) return;
      const verse = verses.find(v => v.verse === selectedVerse);
      if (verse) {
          navigator.clipboard.writeText(`${currentBook} ${currentChapter}:${verse.verse} - ${verse.text}`);
          setSelectedVerse(null);
      }
  };

  const handlePlayFromSelection = () => {
      if (!selectedVerse) return;
      const idx = verses.findIndex(v => v.verse === selectedVerse);
      if (idx !== -1) {
          setSelectedVerse(null);
          setShowAudioPlayer(true);
          playVerseSequence(idx);
      }
  };

  // --- Advanced Audio Logic (Gemini Neural TTS) ---

  useEffect(() => {
    return () => {
        stopAudio();
        if (audioCtxRef.current) {
            audioCtxRef.current.close();
            audioCtxRef.current = null;
        }
    };
  }, []);

  const initAudioContext = () => {
      if (!audioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioCtxRef.current = new AudioContextClass({ sampleRate: 24000 });
      }
      if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
      }
  };

  const stopAudio = () => {
    if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch(e) {}
        sourceRef.current = null;
    }
    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentSpeakingVerse(null);
    setIsBuffering(false);
  };

  const fetchAudioForVerse = async (index: number): Promise<AudioBuffer | null> => {
      if (index < 0 || index >= verses.length) return null;
      
      // Check cache
      if (audioCacheRef.current[index]) {
          return audioCacheRef.current[index];
      }

      try {
          // Fetch from Gemini
          const base64Data = await GeminiService.generateSpeech(verses[index].text, currentVoice);
          if (!base64Data) return null;

          // Decode
          const bytes = decodeBase64(base64Data);
          if (!audioCtxRef.current) return null;
          
          const buffer = await decodeAudioData(bytes, audioCtxRef.current, 24000, 1);
          audioCacheRef.current[index] = buffer;
          return buffer;
      } catch (e) {
          console.error("Audio fetch error:", e);
          return null;
      }
  };

  const playVerseSequence = async (startIndex: number) => {
    initAudioContext();
    stopAudio(); // Stop any existing playback

    setIsPlaying(true);
    isPlayingRef.current = true;
    
    // Recursive function to play sequence
    const playNext = async (index: number) => {
        if (!isPlayingRef.current) return;
        if (index >= verses.length) {
            stopAudio();
            return;
        }

        setCurrentSpeakingVerse(verses[index].verse);
        
        // Auto-scroll into view
        const element = document.getElementById(`verse-${verses[index].verse}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Check buffer / fetch
        let buffer = audioCacheRef.current[index];
        if (!buffer) {
            setIsBuffering(true);
            buffer = await fetchAudioForVerse(index) as AudioBuffer;
            setIsBuffering(false);
        }

        if (!buffer || !isPlayingRef.current) return;

        // Create Source
        const source = audioCtxRef.current!.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtxRef.current!.destination);
        
        source.onended = () => {
            if (isPlayingRef.current) {
                playNext(index + 1);
            }
        };

        sourceRef.current = source;
        source.start();

        // Prefetch next verse
        if (index + 1 < verses.length && !audioCacheRef.current[index + 1]) {
            fetchAudioForVerse(index + 1);
        }
    };

    playNext(startIndex);
  };

  const toggleAudio = () => {
    initAudioContext();
    if (isPlaying) {
        // Pause logic: AudioContext suspend is easiest for resuming at same spot, 
        // but verse-level granularity stop/start is cleaner for this app's "Read Along" feature.
        // We will pause simply by suspending context to keep position.
        if (audioCtxRef.current?.state === 'running') {
            audioCtxRef.current.suspend();
            setIsPlaying(false);
        } else if (audioCtxRef.current?.state === 'suspended') {
            audioCtxRef.current.resume();
            setIsPlaying(true);
        }
    } else {
        if (audioCtxRef.current?.state === 'suspended') {
             audioCtxRef.current.resume();
             setIsPlaying(true);
        } else {
             // Start fresh
             const startIdx = currentSpeakingVerse 
                ? verses.findIndex(v => v.verse === currentSpeakingVerse) 
                : 0;
             setShowAudioPlayer(true);
             playVerseSequence(startIdx !== -1 ? startIdx : 0);
        }
    }
  };

  const skipAudio = (direction: 'prev' | 'next') => {
    const currentIdx = currentSpeakingVerse 
        ? verses.findIndex(v => v.verse === currentSpeakingVerse) 
        : 0;
    
    let nextIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx >= verses.length) nextIdx = 0;
    
    playVerseSequence(nextIdx);
  };

  const switchNarrator = () => {
      const newVoice = currentVoice === 'Charon' ? 'Kore' : 'Charon';
      setCurrentVoice(newVoice);
      audioCacheRef.current = {}; // Clear cache as voice changed
      
      // If playing, restart current verse with new voice
      if (isPlaying && currentSpeakingVerse) {
          const idx = verses.findIndex(v => v.verse === currentSpeakingVerse);
          playVerseSequence(idx !== -1 ? idx : 0);
      }
  };

  // --- Search Logic ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const regex = /^(\d?\s?[a-zA-Z]+)\s+(\d+)$/;
    const match = searchQuery.match(regex);
    if (match) {
        const bookNameQuery = match[1].trim().toLowerCase();
        const chapterNum = parseInt(match[2], 10);
        const foundBook = BIBLE_BOOKS.find(b => b.toLowerCase().startsWith(bookNameQuery));
        if (foundBook) {
            setCurrentBook(foundBook);
            setCurrentChapter(chapterNum);
            setIsSearchActive(false);
            setSearchQuery('');
        }
    } else {
        const num = parseInt(searchQuery);
        if (!isNaN(num)) {
             setCurrentChapter(num);
             setIsSearchActive(false);
             setSearchQuery('');
        }
    }
  };

  // --- Text Highlighting Logic ---
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setShowColorPicker(false);
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 3) {
      setShowColorPicker(false);
      return;
    }

    // Find which verse was selected
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // Find the parent verse element
    let verseElement = container.parentElement;
    while (verseElement && !verseElement.id?.startsWith('verse-')) {
      verseElement = verseElement.parentElement;
    }

    if (!verseElement) return;

    // Extract verse number from id "verse-5" -> 5
    const verseNumber = parseInt(verseElement.id.replace('verse-', ''));
    if (isNaN(verseNumber)) return;

    // Get the full verse text
    const verseData = verses.find(v => v.verse === verseNumber);
    if (!verseData) return;

    // Calculate character offsets within the verse
    const verseText = verseData.text;
    const startOffset = verseText.indexOf(selectedText);

    if (startOffset === -1) {
      // Selection doesn't match cleanly in verse text
      setShowColorPicker(false);
      return;
    }

    const endOffset = startOffset + selectedText.length;

    // Show color picker near selection
    const rect = range.getBoundingClientRect();
    setColorPickerPosition({
      x: rect.left + (rect.width / 2),
      y: rect.top - 10
    });

    setPendingHighlight({
      verse: verseNumber,
      startOffset,
      endOffset,
      selectedText
    });

    setShowColorPicker(true);
  };

  const createHighlight = async (color: HighlightColor) => {
    if (!pendingHighlight) return;

    const newHighlight: TextHighlight = {
      id: `${Date.now()}-${Math.random()}`,
      book: currentBook,
      chapter: currentChapter,
      verse: pendingHighlight.verse,
      startOffset: pendingHighlight.startOffset,
      endOffset: pendingHighlight.endOffset,
      selectedText: pendingHighlight.selectedText,
      color,
      createdAt: Date.now()
    };

    // Update local state
    setTextHighlights(prev => [...prev, newHighlight]);
    setShowColorPicker(false);
    setPendingHighlight(null);

    // Save to database
    try {
      await UnifiedDatabaseService.addTextHighlight(newHighlight);
    } catch (error) {
      console.error('Failed to save text highlight to database:', error);
    }

    // Clear text selection
    window.getSelection()?.removeAllRanges();
  };

  const deleteHighlight = async (highlightId: string) => {
    // Update local state
    setTextHighlights(prev => prev.filter(h => h.id !== highlightId));

    // Delete from database
    try {
      await UnifiedDatabaseService.deleteTextHighlight(highlightId);
    } catch (error) {
      console.error('Failed to delete text highlight from database:', error);
    }
  };

  // Get highlights for a specific verse
  const getVerseHighlights = (verseNumber: number): TextHighlight[] => {
    return textHighlights.filter(
      h => h.book === currentBook &&
           h.chapter === currentChapter &&
           h.verse === verseNumber
    );
  };

  // Render verse text with inline highlights
  const renderHighlightedText = (verse: ApiVerse): React.ReactNode => {
    const highlights = getVerseHighlights(verse.verse);
    if (highlights.length === 0) {
      return verse.text;
    }

    // Sort highlights by start position
    const sortedHighlights = [...highlights].sort((a, b) => a.startOffset - b.startOffset);

    const parts: React.ReactNode[] = [];
    let currentIndex = 0;

    sortedHighlights.forEach((highlight, idx) => {
      // Add text before highlight
      if (currentIndex < highlight.startOffset) {
        parts.push(
          <span key={`text-${idx}-before`}>
            {verse.text.substring(currentIndex, highlight.startOffset)}
          </span>
        );
      }

      // Add highlighted text
      const highlightClass =
        highlight.color === 'yellow' ? 'bg-yellow-300/60 dark:bg-yellow-600/40' :
        highlight.color === 'green' ? 'bg-green-300/60 dark:bg-green-600/40' :
        highlight.color === 'blue' ? 'bg-blue-300/60 dark:bg-blue-600/40' :
        'bg-purple-300/60 dark:bg-purple-600/40';

      parts.push(
        <mark
          key={`highlight-${highlight.id}`}
          className={`${highlightClass} cursor-pointer rounded-sm px-0.5`}
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Delete this highlight?')) {
              deleteHighlight(highlight.id);
            }
          }}
        >
          {verse.text.substring(highlight.startOffset, highlight.endOffset)}
        </mark>
      );

      currentIndex = highlight.endOffset;
    });

    // Add remaining text after last highlight
    if (currentIndex < verse.text.length) {
      parts.push(
        <span key="text-after">
          {verse.text.substring(currentIndex)}
        </span>
      );
    }

    return <>{parts}</>;
  };

  // Highlight Styles Map
  const highlightStyles = {
      yellow: 'bg-yellow-200/70 dark:bg-yellow-900/40',
      green: 'bg-green-200/70 dark:bg-green-900/40',
      blue: 'bg-blue-200/70 dark:bg-blue-900/40',
      purple: 'bg-purple-200/70 dark:bg-purple-900/40',
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#101a22] font-serif transition-colors relative">
      
      {/* 1. Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#101a22]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-colors pt-safe">
        {!isSearchActive ? (
            <div className="flex items-center justify-between px-4 h-16">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowBookPicker(true)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full flex items-center gap-2 transition-colors relative"
                    >
                        <span className="text-sm font-bold text-slate-900 dark:text-white font-sans">{currentBook} {currentChapter}</span>
                        {getCurrentChapterNote() && (
                            <span className="material-symbols-outlined text-[14px] text-blue-500 filled" title="Chapter has notes">
                                description
                            </span>
                        )}
                    </button>
                    <button 
                         onClick={() => setShowVersionPicker(true)}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full flex items-center gap-1 transition-colors"
                    >
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-sans tracking-wider">
                            {BIBLE_VERSIONS.find(v => v.id === currentVersion)?.short}
                        </span>
                        {isVersionDownloaded(currentVersion) && (
                            <span className="material-symbols-outlined text-[14px] text-green-500 filled">check_circle</span>
                        )}
                    </button>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowChapterNoteModal(true)}
                        className={`p-2 rounded-full transition-colors relative ${getCurrentChapterNote() ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        title="Chapter Notes"
                    >
                        <span className="material-symbols-outlined">note_add</span>
                        {getCurrentChapterNote() && (
                            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500"></span>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setShowAudioPlayer(prev => !prev);
                            if (!showAudioPlayer && !isPlaying) toggleAudio();
                        }}
                        className={`p-2 rounded-full transition-colors ${isPlaying || showAudioPlayer ? 'text-primary bg-primary/10' : 'text-slate-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                        <span className="material-symbols-outlined filled">volume_up</span>
                    </button>
                    <button
                        onClick={() => setShowAppearance(!showAppearance)}
                        className={`p-2 rounded-full transition-colors ${showAppearance ? 'text-primary bg-primary/10' : 'text-slate-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                        <span className="material-symbols-outlined">text_fields</span>
                    </button>
                    <button
                        onClick={() => {
                             setIsSearchActive(true);
                             setTimeout(() => searchInputRef.current?.focus(), 100);
                        }}
                        className="p-2 rounded-full text-slate-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="material-symbols-outlined">search</span>
                    </button>
                    <button
                        onClick={() => setShowBookmarks(!showBookmarks)}
                        className={`p-2 rounded-full transition-colors ${showBookmarks ? 'text-primary bg-primary/10' : 'text-slate-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                        <span className="material-symbols-outlined">bookmarks</span>
                    </button>
                </div>
            </div>
        ) : (
            <form onSubmit={handleSearch} className="flex items-center px-4 h-16 gap-2">
                <span className="material-symbols-outlined text-slate-400">search</span>
                <input 
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 'Romans 8'..."
                    className="flex-1 bg-transparent border-none outline-none ring-0 text-lg font-sans text-slate-900 dark:text-white placeholder-slate-400"
                />
                <button type="button" onClick={() => setIsSearchActive(false)} className="text-sm font-bold text-primary font-sans">Cancel</button>
            </form>
        )}
        {showAppearance && (
            <div className="absolute top-16 right-4 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 animate-fadeIn z-40 font-sans">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase">Text Size</span>
                </div>
                <div className="flex items-center gap-4 bg-gray-100 dark:bg-gray-900 rounded-xl p-2 mb-4">
                    <span className="text-sm font-serif">A</span>
                    <input type="range" min="0.875" max="1.5" step="0.125" value={fontSize} onChange={(e) => setFontSize(parseFloat(e.target.value))} className="flex-1 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary"/>
                    <span className="text-xl font-serif">A</span>
                </div>
            </div>
        )}
        {showBookmarks && <BookmarksPanel onClose={() => setShowBookmarks(false)} onNavigate={(book, chapter, verse) => {
          setCurrentBook(book);
          setCurrentChapter(chapter);
          setScrollToVerse(verse);
          setShowBookmarks(false);
        }} />}
      </header>

      {/* 2. Main Reader */}
      <main
        className="flex-1 overflow-y-auto hide-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
        onClick={() => {
            // Deselect if clicking whitespace
            if (selectedVerse) setSelectedVerse(null);
            setShowColorPicker(false);
        }}
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
      >
        <div className="max-w-3xl mx-auto px-6 py-8 pb-40">
            <h1 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-4">{currentChapter}</h1>

            {/* Chapter Statistics */}
            {(() => {
              const verseNotesCount = verses.filter(v => getVerseData(v.verse).note).length;
              const verseHighlightsCount = verses.filter(v => getVerseHighlights(v.verse).length > 0).length;
              const hasChapterNote = !!getCurrentChapterNote();
              const totalAnnotations = verseNotesCount + verseHighlightsCount + (hasChapterNote ? 1 : 0);

              return totalAnnotations > 0 ? (
                <div className="flex items-center justify-center gap-3 mb-6 font-sans">
                  {hasChapterNote && (
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] filled">description</span>
                      Chapter Note
                    </span>
                  )}
                  {verseNotesCount > 0 && (
                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">description</span>
                      {verseNotesCount} {verseNotesCount === 1 ? 'Note' : 'Notes'}
                    </span>
                  )}
                  {verseHighlightsCount > 0 && (
                    <span className="px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-bold rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] filled">ink_highlighter</span>
                      {verseHighlightsCount} {verseHighlightsCount === 1 ? 'Highlight' : 'Highlights'}
                    </span>
                  )}
                </div>
              ) : null;
            })()}

            {/* Chapter Note Display */}
            {getCurrentChapterNote() && (
              <div
                onClick={() => setShowChapterNoteModal(true)}
                className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-xl cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px] mt-0.5">note</span>
                  <div className="flex-1 font-sans">
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Chapter Notes</h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3 whitespace-pre-wrap">
                      {getCurrentChapterNote()?.note}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-blue-500 text-[18px] opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                </div>
              </div>
            )}

            {loading ? (
                <div className="space-y-4 animate-pulse">
                     {[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>)}
                </div>
            ) : (
                <div
                    className="text-slate-800 dark:text-slate-200"
                    style={{ fontSize: `${fontSize}rem`, lineHeight: lineHeight }}
                >
                    {verses.map((verse) => {
                        const isSpeaking = currentSpeakingVerse === verse.verse;
                        const isSelected = selectedVerse === verse.verse;
                        const uData = getVerseData(verse.verse);
                        const verseHighlights = getVerseHighlights(verse.verse);
                        const hasTextHighlights = verseHighlights.length > 0;

                        return (
                            <span
                                key={verse.verse}
                                id={`verse-${verse.verse}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedVerse(verse.verse === selectedVerse ? null : verse.verse);
                                }}
                                className={`
                                    relative inline transition-all duration-300 cursor-pointer rounded-sm px-0.5 box-decoration-clone
                                    ${isSpeaking ? 'bg-yellow-400/30 dark:bg-yellow-400/20' : ''}
                                    ${isSelected ? 'bg-slate-200 dark:bg-slate-700' : ''}
                                    ${!isSelected && !isSpeaking && uData.highlight ? highlightStyles[uData.highlight] : ''}
                                    ${!isSelected && !isSpeaking ? 'hover:bg-black/5 dark:hover:bg-white/5' : ''}
                                `}
                            >
                                <sup className="text-[0.6em] font-bold text-slate-400 mr-1 select-none font-sans inline-flex items-center gap-1">
                                    <span className="inline-flex items-center gap-0.5">
                                        {verse.verse}
                                        {uData.bookmarked && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title="Bookmarked"></span>
                                        )}
                                    </span>
                                    {uData.note && (
                                        <span
                                            className="material-symbols-outlined text-[10px] text-blue-500 cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                            title="Double-click to view note"
                                            onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedVerse(verse.verse);
                                                setNoteText(uData.note || '');
                                                setShowNoteModal(true);
                                            }}
                                        >
                                            description
                                        </span>
                                    )}
                                    {hasTextHighlights && (
                                        <span className="material-symbols-outlined text-[10px] text-yellow-600 dark:text-yellow-400 filled" title={`${verseHighlights.length} highlight${verseHighlights.length > 1 ? 's' : ''}`}>
                                            ink_highlighter
                                        </span>
                                    )}
                                </sup>
                                <span className={isSpeaking ? 'font-medium' : ''}>
                                  {renderHighlightedText(verse)}{' '}
                                </span>
                            </span>
                        );
                    })}
                </div>
            )}
            <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 font-sans">
                 <button onClick={() => setCurrentChapter(Math.max(1, currentChapter - 1))} disabled={currentChapter <= 1} className="px-4 py-2 text-slate-500 hover:text-primary disabled:opacity-30 transition-colors font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined">arrow_back</span> Prev
                 </button>
                 <button onClick={() => setCurrentChapter(currentChapter + 1)} className="px-4 py-2 text-slate-500 hover:text-primary transition-colors font-medium flex items-center gap-1">
                    Next <span className="material-symbols-outlined">arrow_forward</span>
                 </button>
            </div>
        </div>
      </main>

      {/* 3. Selection Action Sheet (Styled like Audio Player) */}
      {selectedVerse && (
          <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-[#1e293b] rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-gray-100 dark:border-gray-700 animate-slideUp font-sans">
              
              {/* Drag Handle & Header */}
              <div className="w-full flex flex-col items-center pt-3 pb-2" onClick={() => setSelectedVerse(null)}>
                  <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mb-4"></div>
                  <div className="w-full px-6 flex justify-between items-center mb-2">
                       <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                           {currentBook} {currentChapter}:{selectedVerse}
                       </h3>
                       <div className="flex gap-2">
                           <button onClick={(e) => { e.stopPropagation(); setSelectedVerse(null); }} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-slate-500 hover:bg-gray-200 dark:hover:bg-gray-700">
                               <span className="material-symbols-outlined text-[20px]">close</span>
                           </button>
                       </div>
                  </div>
              </div>

              <div className="px-6 pb-safe space-y-6">
                  
                  {/* Highlighter Section */}
                  <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Highlight</label>
                      <div className="flex items-center justify-between gap-2">
                           <button 
                                onClick={() => updateVerseData(selectedVerse, { highlight: undefined })}
                                className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-slate-400 hover:border-gray-400 hover:text-slate-600 transition-colors"
                           >
                               <span className="material-symbols-outlined text-[20px]">format_color_reset</span>
                           </button>
                           
                           {(['yellow', 'green', 'blue', 'purple'] as HighlightColor[]).map(color => (
                               <button
                                   key={color}
                                   onClick={() => handleHighlight(color)}
                                   className={`w-12 h-12 rounded-full border-2 transition-transform active:scale-95 flex items-center justify-center ${
                                       color === 'yellow' ? 'bg-yellow-300 border-yellow-400' :
                                       color === 'green' ? 'bg-green-300 border-green-400' :
                                       color === 'blue' ? 'bg-blue-300 border-blue-400' :
                                       'bg-purple-300 border-purple-400'
                                   } ${getVerseData(selectedVerse).highlight === color ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900 scale-110' : ''}`}
                               >
                                   {getVerseData(selectedVerse).highlight === color && <span className="material-symbols-outlined text-black/50">check</span>}
                               </button>
                           ))}
                      </div>
                  </div>

                  {/* Actions Grid */}
                  <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Actions</label>
                      <div className="grid grid-cols-4 gap-4">
                          <button 
                                onClick={handlePlayFromSelection} 
                                className="flex flex-col items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                                <span className="material-symbols-outlined text-[24px]">play_circle</span>
                                <span className="text-xs font-medium">Listen</span>
                          </button>
                          <button 
                                onClick={handleNoteOpen} 
                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-colors ${
                                    getVerseData(selectedVerse).note 
                                    ? 'bg-primary/10 text-primary' 
                                    : 'bg-gray-50 dark:bg-gray-800 text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                          >
                                <span className={`material-symbols-outlined text-[24px] ${getVerseData(selectedVerse).note ? 'filled' : ''}`}>
                                    {getVerseData(selectedVerse).note ? 'edit_note' : 'note_add'}
                                </span>
                                <span className="text-xs font-medium">Note</span>
                          </button>
                          <button 
                                onClick={handleBookmark} 
                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-colors ${
                                    getVerseData(selectedVerse).bookmarked 
                                    ? 'bg-primary/10 text-primary' 
                                    : 'bg-gray-50 dark:bg-gray-800 text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                          >
                                <span className={`material-symbols-outlined text-[24px] ${getVerseData(selectedVerse).bookmarked ? 'filled' : ''}`}>
                                    {getVerseData(selectedVerse).bookmarked ? 'bookmark_added' : 'bookmark_border'}
                                </span>
                                <span className="text-xs font-medium">Save</span>
                          </button>
                          <button 
                                onClick={handleCopy} 
                                className="flex flex-col items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                                <span className="material-symbols-outlined text-[24px]">content_copy</span>
                                <span className="text-xs font-medium">Copy</span>
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 4. Audio Player (Neural TTS) */}
      {showAudioPlayer && !selectedVerse && (
          <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-[#1e293b] rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-gray-100 dark:border-gray-700 animate-slideUp font-sans">
             <div className="w-full h-1 bg-gray-100 dark:bg-gray-800">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(verses.findIndex(v => v.verse === currentSpeakingVerse) / Math.max(1, verses.length)) * 100}%` }}></div>
             </div>
             <div className="px-6 py-6 pb-safe">
                 <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                           Gemini Neural Voice
                           <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-100 text-blue-700 font-bold uppercase">AI</span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">High-fidelity audio streaming</p>
                    </div>
                    <button onClick={() => setShowAudioPlayer(false)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">expand_more</span></button>
                 </div>

                 <div className="flex flex-col items-center gap-6">
                     <button 
                        onClick={switchNarrator}
                        className="px-4 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                     >
                        <span className="material-symbols-outlined text-[16px] text-primary">record_voice_over</span>
                        Narrator: {currentVoice}
                     </button>

                     <div className="flex items-center gap-8">
                         <button onClick={() => skipAudio('prev')} className="text-slate-800 dark:text-white hover:text-primary active:scale-90"><span className="material-symbols-outlined text-[40px]">skip_previous</span></button>
                         <div className="relative">
                            {isBuffering && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
                                </div>
                            )}
                            <button onClick={toggleAudio} className="w-16 h-16 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all relative z-10">
                                <span className="material-symbols-outlined text-[32px] filled">{isPlaying ? 'pause' : 'play_arrow'}</span>
                            </button>
                         </div>
                         <button onClick={() => skipAudio('next')} className="text-slate-800 dark:text-white hover:text-primary active:scale-90"><span className="material-symbols-outlined text-[40px]">skip_next</span></button>
                     </div>
                 </div>
             </div>
          </div>
      )}

      {/* Verse Note Modal */}
      {showNoteModal && selectedVerse && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn font-sans">
              <div className="bg-white dark:bg-[#1e293b] w-full max-w-sm rounded-2xl shadow-2xl p-5">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Note for {currentBook} {currentChapter}:{selectedVerse}
                      </h3>
                      <button onClick={() => setShowNoteModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Write your thoughts about this verse..."
                    className="w-full h-40 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-primary mb-4 text-slate-900 dark:text-white resize-none"
                    autoFocus
                  />
                  <div className="flex gap-3">
                      <button
                        onClick={() => setShowNoteModal(false)}
                        className="flex-1 py-3 text-slate-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleNoteSave}
                        className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-sm"
                      >
                        Save Note
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Chapter Note Modal */}
      {showChapterNoteModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn font-sans">
              <div className="bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-2xl shadow-2xl p-5">
                  <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          Chapter Notes
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {currentBook} Chapter {currentChapter}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowChapterNoteModal(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>
                  <textarea
                    value={chapterNoteText}
                    onChange={(e) => setChapterNoteText(e.target.value)}
                    placeholder="Write notes about this chapter... Key themes, insights, questions, applications..."
                    className="w-full h-48 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-blue-500 mb-4 text-slate-900 dark:text-white resize-none"
                    autoFocus
                  />
                  <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowChapterNoteModal(false);
                          // Reset to saved note
                          const currentNote = getCurrentChapterNote();
                          setChapterNoteText(currentNote?.note || '');
                        }}
                        className="flex-1 py-3 text-slate-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          saveChapterNote(chapterNoteText);
                          setShowChapterNoteModal(false);
                        }}
                        className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        {chapterNoteText.trim() === '' ? 'Delete Note' : 'Save Note'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Book Picker Modal */}
      {showBookPicker && (
         <div className="absolute inset-0 z-50 flex flex-col font-sans">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBookPicker(false)}></div>
            <div className="absolute bottom-0 left-0 w-full bg-white dark:bg-[#1e293b] rounded-t-[32px] overflow-hidden flex flex-col max-h-[85%] animate-slideUp">
               <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white px-2">Select Book</h3>
                  <button onClick={() => setShowBookPicker(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><span className="material-symbols-outlined text-slate-500">close</span></button>
               </div>
               <div className="overflow-y-auto p-2 pb-safe grid grid-cols-2 gap-2 hide-scrollbar">
                  {BIBLE_BOOKS.map(book => (
                     <button key={book} onClick={() => { setCurrentBook(book); setCurrentChapter(1); setShowBookPicker(false); }} className={`text-left p-3 rounded-xl transition-colors ${currentBook === book ? 'bg-primary/10 dark:bg-primary/20 text-primary font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>{book}</button>
                  ))}
               </div>
            </div>
         </div>
      )}

      {/* Version Picker Modal */}
      {showVersionPicker && (
         <div className="absolute inset-0 z-50 flex flex-col font-sans">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowVersionPicker(false)}></div>
            <div className="absolute bottom-0 left-0 w-full bg-white dark:bg-[#1e293b] rounded-t-[32px] overflow-hidden flex flex-col max-h-[50%] animate-slideUp">
               <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white px-2">Select Version</h3>
                  <button onClick={() => setShowVersionPicker(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><span className="material-symbols-outlined text-slate-500">close</span></button>
               </div>
               <div className="overflow-y-auto p-2 pb-safe space-y-1 hide-scrollbar">
                  {BIBLE_VERSIONS.map(v => (
                     <button key={v.id} onClick={() => { setCurrentVersion(v.id); setShowVersionPicker(false); }} className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${currentVersion === v.id ? 'bg-primary/10 dark:bg-primary/20 text-primary' : 'text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                        <span className="font-bold">{v.name}</span>
                        {isVersionDownloaded(v.id) && <span className="material-symbols-outlined text-green-500 text-[18px] filled">check_circle</span>}
                        {currentVersion === v.id && !isVersionDownloaded(v.id) && <span className="material-symbols-outlined">check</span>}
                     </button>
                  ))}
               </div>
            </div>
         </div>
      )}

      {/* Color Picker for Text Highlights */}
      {showColorPicker && pendingHighlight && (
        <div
          className="fixed z-[70] animate-fadeIn"
          style={{
            left: `${colorPickerPosition.x}px`,
            top: `${colorPickerPosition.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 flex items-center gap-2 mb-2">
            <button
              onClick={() => createHighlight('yellow')}
              className="w-10 h-10 rounded-full bg-yellow-300 hover:bg-yellow-400 transition-colors border-2 border-transparent hover:border-yellow-600 flex items-center justify-center"
              title="Yellow"
            >
              <span className="material-symbols-outlined text-yellow-900 text-[18px] filled">format_ink_highlighter</span>
            </button>
            <button
              onClick={() => createHighlight('green')}
              className="w-10 h-10 rounded-full bg-green-300 hover:bg-green-400 transition-colors border-2 border-transparent hover:border-green-600 flex items-center justify-center"
              title="Green"
            >
              <span className="material-symbols-outlined text-green-900 text-[18px] filled">format_ink_highlighter</span>
            </button>
            <button
              onClick={() => createHighlight('blue')}
              className="w-10 h-10 rounded-full bg-blue-300 hover:bg-blue-400 transition-colors border-2 border-transparent hover:border-blue-600 flex items-center justify-center"
              title="Blue"
            >
              <span className="material-symbols-outlined text-blue-900 text-[18px] filled">format_ink_highlighter</span>
            </button>
            <button
              onClick={() => createHighlight('purple')}
              className="w-10 h-10 rounded-full bg-purple-300 hover:bg-purple-400 transition-colors border-2 border-transparent hover:border-purple-600 flex items-center justify-center"
              title="Purple"
            >
              <span className="material-symbols-outlined text-purple-900 text-[18px] filled">format_ink_highlighter</span>
            </button>
            <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
            <button
              onClick={() => {
                setShowColorPicker(false);
                setPendingHighlight(null);
                window.getSelection()?.removeAllRanges();
              }}
              className="w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
              title="Cancel"
            >
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Bookmarks Panel Component
interface BookmarksPanelProps {
  onClose: () => void;
  onNavigate: (book: string, chapter: number, verse: number) => void;
}

const BookmarksPanel: React.FC<BookmarksPanelProps> = ({ onClose, onNavigate }) => {
  const [bookmarks, setBookmarks] = useState<DBUserVerseData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const allBookmarks = await UnifiedDatabaseService.getAllBookmarks();
        setBookmarks(allBookmarks);
      } catch (error) {
        console.error('Failed to load bookmarks:', error);
      } finally {
        setLoading(false);
      }
    };
    loadBookmarks();
  }, []);

  if (loading) {
    return (
      <div className="absolute top-16 right-4 w-80 max-h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 animate-fadeIn z-40 font-sans">
        <div className="p-6 text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-500 mt-2">Loading bookmarks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-16 right-4 w-80 max-h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 animate-fadeIn z-40 font-sans overflow-hidden flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bookmarks</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {bookmarks.length === 0 ? (
        <div className="p-6 text-center">
          <span className="material-symbols-outlined text-[48px] text-slate-300 dark:text-slate-600">bookmarks</span>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">No bookmarks yet</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Tap the bookmark icon on any verse to save it</p>
        </div>
      ) : (
        <div className="overflow-y-auto flex-1">
          {bookmarks.map((bookmark) => (
            <button
              key={bookmark.id}
              onClick={() => onNavigate(bookmark.book, bookmark.chapter, bookmark.verse)}
              className="w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0 text-left"
            >
              <span className="material-symbols-outlined filled text-primary text-[20px] flex-shrink-0 mt-0.5">bookmark</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {bookmark.book} {bookmark.chapter}:{bookmark.verse}
                </div>
                {bookmark.note && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                    {bookmark.note}
                  </p>
                )}
                {bookmark.highlight && (
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                    bookmark.highlight === 'yellow' ? 'bg-yellow-200 text-yellow-900' :
                    bookmark.highlight === 'green' ? 'bg-green-200 text-green-900' :
                    bookmark.highlight === 'blue' ? 'bg-blue-200 text-blue-900' :
                    bookmark.highlight === 'purple' ? 'bg-purple-200 text-purple-900' :
                    'bg-red-200 text-red-900'
                  }`}>
                    {bookmark.highlight}
                  </span>
                )}
              </div>
              <span className="material-symbols-outlined text-slate-400 text-[18px] flex-shrink-0">chevron_right</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BibleReader;
