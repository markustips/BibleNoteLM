import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, Play, Pause, MoreVertical, ArrowLeft, Sparkles, ArrowUp, Plus, ListFilter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSermonStore, Note } from '../stores/useSermonStore';
import { useSermonHistoryStore, SavedSermon } from '../stores/useSermonHistoryStore';

const MOCK_TRANSCRIPT_START = "...and sometimes we struggle to find meaning in the chaos, but looking back at the history of the church, we see patterns of redemption. ";
const MOCK_TRANSCRIPT_LIVE = `"...and as we look closely at Romans 8:28, we see that all things work together for good to them that love God. This isn't just a promise for the good times, but for every season.`;

const SermonRecorder: React.FC = () => {
  const navigate = useNavigate();
  
  // Store Hook
  const { 
    viewState, setViewState, 
    timer, setTimer, incrementTimer,
    isPaused, setIsPaused, togglePause,
    transcript, setTranscript, appendTranscript,
    notes, addNote,
    resetRecording
  } = useSermonStore();

  const { addSermon } = useSermonHistoryStore();

  // Local UI State (Form Input)
  const [quickNote, setQuickNote] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);

  // --- Effects ---

  // Timer Effect
  useEffect(() => {
    let interval: number;
    if (viewState === 'recording' && !isPaused) {
      interval = window.setInterval(() => {
        incrementTimer();
      }, 1000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [viewState, isPaused, incrementTimer]);

  // Transcript Simulation Effect
  useEffect(() => {
    let interval: number;
    if (viewState === 'recording' && !isPaused) {
      interval = window.setInterval(() => {
        // Access state directly to avoid dependency cycles / re-renders
        const { transcript, appendTranscript } = useSermonStore.getState();
        const fullTarget = MOCK_TRANSCRIPT_START + MOCK_TRANSCRIPT_LIVE;
        
        if (transcript.length < fullTarget.length) {
             const nextChar = fullTarget[transcript.length];
             if (nextChar) appendTranscript(nextChar);
        }
      }, 50); // Type speed
    }
    return () => {
      clearInterval(interval);
    };
  }, [viewState, isPaused]);

  // --- Handlers ---

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      setSavedId(null);
      setViewState('recording');
      setTimer(1455); // Start at 24:15 for demo purposes based on screenshot
    } catch (err) {
      console.error("Microphone error:", err);
    }
  };

  const handleStopRecording = () => {
    // 1. Create Saved Sermon Object
    const newId = Date.now().toString();
    const newSermon: SavedSermon = {
        id: newId,
        title: `Sermon - ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
        date: new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' }),
        duration: formatTime(timer).replace(' : ', ':'),
        transcript: transcript,
        notes: notes
    };

    // 2. Save to History Store
    addSermon(newSermon);
    setSavedId(newId);

    // 3. Update View State
    setViewState('summary');
  };

  const handleAddNote = () => {
    if (!quickNote.trim()) return;
    const newNote: Note = {
      id: Date.now().toString(),
      timestamp: formatTime(timer).replace(' : ', ':'),
      content: quickNote,
      type: 'text'
    };
    addNote(newNote);
    setQuickNote('');
  };

  const handleReset = () => {
      setSavedId(null);
      resetRecording();
  };

  // --- Render Helpers ---

  const renderHighlightedTranscript = () => {
    const parts = transcript.split(/(Romans 8:28)/g);
    return (
      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[15px]">
        {parts.map((part, i) => {
          if (part === 'Romans 8:28') {
            return (
              <span key={i} className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded mx-1 font-medium border border-teal-100">
                {part}
                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            );
          }
          return part;
        })}
        <span className="inline-block w-0.5 h-4 bg-teal-400 ml-0.5 align-middle animate-pulse"></span>
      </p>
    );
  };

  // --- Views ---

  if (viewState === 'summary') {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fadeIn p-4">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-green-500 text-4xl">check</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center">Recording Saved!</h2>
            <p className="text-slate-500 text-center max-w-xs mb-4">
                Your sermon has been saved to the library with {notes.length} notes and transcript.
            </p>
            
            <div className="flex flex-col w-full max-w-xs gap-3">
                <button 
                    onClick={() => savedId && navigate(`/sermons/history/${savedId}`)}
                    className="w-full py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 transition-colors"
                >
                    View Notes & Transcript
                </button>
                <button 
                    onClick={() => navigate('/sermons/history')}
                    className="w-full py-3.5 bg-white dark:bg-card-dark text-slate-700 dark:text-slate-200 font-bold rounded-xl border border-gray-200 dark:border-gray-700"
                >
                    Go to Library
                </button>
                <button 
                    onClick={handleReset}
                    className="w-full py-3 text-sm text-slate-400 font-medium hover:text-slate-600"
                >
                    Start New Recording
                </button>
            </div>
        </div>
    );
  }

  if (viewState === 'idle') {
      return (
        <div className="flex flex-col h-full relative">
            {/* Library Link Header */}
            <div className="absolute top-0 right-0 z-10">
                <button 
                    onClick={() => navigate('/sermons/history')}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-primary transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">history</span>
                    <span>Library</span>
                </button>
            </div>

            <div className="flex flex-col items-center justify-center mt-24 gap-8">
                <div className="relative">
                    <div className="absolute inset-0 bg-teal-400/20 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-xl border border-teal-50 dark:border-slate-700">
                        <Mic className="w-10 h-10 text-teal-500" />
                    </div>
                </div>
                
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Ready to Record?</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-[240px] mx-auto">
                        Capture the sermon with AI-powered transcription and live notes.
                    </p>
                </div>

                <button 
                    onClick={handleStartRecording}
                    className="bg-teal-400 hover:bg-teal-500 text-white font-bold py-4 px-12 rounded-full shadow-lg shadow-teal-200/50 transition-all active:scale-95 text-lg flex items-center gap-2"
                >
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    Start Recording
                </button>
            </div>
        </div>
      )
  }

  // --- Main Recording UI ---
  return (
    <div className="flex flex-col min-h-screen bg-[#F4FCFD] dark:bg-background-dark -mx-4 -mt-6"> 
      
      {/* 1. Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 bg-[#F4FCFD]/95 dark:bg-background-dark/95 backdrop-blur-sm">
        <button onClick={handleReset} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-white" />
        </button>
        <h1 className="text-sm font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Sunday Service</h1>
        <button className="p-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
          <MoreVertical className="w-6 h-6 text-slate-700 dark:text-white" />
        </button>
      </div>

      {/* 2. Recording Status & Controls */}
      <div className="flex flex-col items-center justify-center py-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-full mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-red-500 tracking-wider uppercase">Recording Active</span>
        </div>
        
        <div className="text-[48px] font-bold text-slate-900 dark:text-white font-mono tracking-tight leading-none mb-6">
            {formatTime(timer)}
        </div>

        <div className="flex items-center gap-6 mb-8">
            <button 
                onClick={togglePause}
                className="flex flex-col items-center gap-2 group"
            >
                <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center group-active:scale-95 transition-transform">
                    {isPaused ? <Play className="w-6 h-6 text-slate-700 dark:text-white ml-1" /> : <Pause className="w-6 h-6 text-slate-700 dark:text-white" />}
                </div>
                <span className="text-xs font-medium text-slate-500">{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            <button 
                onClick={handleStopRecording}
                className="flex flex-col items-center gap-2 group"
            >
                <div className="w-16 h-16 rounded-full bg-[#111827] text-white shadow-lg flex items-center justify-center group-active:scale-95 transition-transform">
                    <Square className="w-6 h-6 fill-current" />
                </div>
                <span className="text-xs font-medium text-slate-900 dark:text-slate-300">Stop & Save</span>
            </button>
        </div>
      </div>

      {/* 3. Live Transcript Card */}
      <div className="px-4 mb-8">
        <div className="bg-white dark:bg-card-dark rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <h3 className="font-bold text-slate-800 dark:text-white">Live Transcript</h3>
                </div>
                <span className="px-2 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-[10px] font-bold uppercase rounded">AI Generating</span>
            </div>
            {renderHighlightedTranscript()}
        </div>
      </div>

      {/* 4. Notes Section */}
      <div className="flex-1 bg-[#F4FCFD] dark:bg-background-dark px-4 pb-24">
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">My Notes</h3>
            <span className="text-xs font-medium text-slate-500">{notes.length} notes</span>
        </div>

        {/* Input */}
        <div className="bg-white dark:bg-card-dark rounded-xl p-2 flex items-center shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
            <button className="p-2 text-slate-400">
                <ListFilter className="w-5 h-5" />
            </button>
            <input 
                type="text" 
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                placeholder="Jot down a quick thought..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 placeholder-slate-400 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
            />
            <button 
                onClick={handleAddNote}
                disabled={!quickNote.trim()}
                className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-lg text-teal-50 disabled:opacity-50 disabled:bg-slate-50"
            >
                <ArrowUp className="w-5 h-5" />
            </button>
        </div>

        {/* Timeline */}
        <div className="relative pl-4 space-y-6">
            {/* Vertical Line */}
            <div className="absolute left-4 top-2 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>

            {notes.map((note) => (
                <div key={note.id} className="relative pl-6 animate-fadeIn">
                    {/* Dot */}
                    <div className="absolute left-[13px] top-2 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-[#F4FCFD] dark:ring-background-dark z-10"></div>
                    
                    {/* Timestamp */}
                    <span className="text-xs font-medium text-slate-400 mb-1 block flex items-center gap-2">
                        {note.timestamp}
                        {note.verseRef && <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 rounded text-[10px]">{note.verseRef}</span>}
                    </span>

                    {/* Card */}
                    <div className="bg-white dark:bg-card-dark p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            {note.content}
                        </p>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* FAB */}
      <button className="fixed bottom-24 right-4 w-14 h-14 bg-teal-400 hover:bg-teal-500 text-white rounded-2xl shadow-lg shadow-teal-200/50 flex items-center justify-center transition-transform active:scale-95 z-20">
        <Plus className="w-8 h-8" />
      </button>

    </div>
  );
};

export default SermonRecorder;