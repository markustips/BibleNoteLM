
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSermonHistoryStore } from '../stores/useSermonHistoryStore';

const SermonDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sermon = useSermonHistoryStore(state => state.getSermon(id || ''));
  const [activeTab, setActiveTab] = useState<'notes' | 'transcript'>('notes');
  
  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Helper to parse "MM:SS" to total seconds
  const parseDuration = (str: string) => {
    if (!str) return 0;
    const parts = str.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  };

  const totalDuration = sermon ? parseDuration(sermon.duration) : 0;

  // Playback Simulation Effect
  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return 0; // Auto-replay or reset to start
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  if (!sermon) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background-light dark:bg-background-dark">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-gray-400 text-3xl">sentiment_dissatisfied</span>
            </div>
            <p className="text-slate-500 mb-6 font-medium">Sermon not found</p>
            <button 
                onClick={() => navigate('/sermons/history')} 
                className="px-6 py-2 bg-primary text-white rounded-full font-bold shadow-sm hover:bg-blue-600 transition-colors"
            >
                Back to Library
            </button>
        </div>
    );
  }

  // Highlight keywords in transcript
  const renderTranscript = (text: string) => {
    if (!text) return <p className="text-slate-400 italic">No transcript available.</p>;

    const keywords = ['God', 'Jesus', 'Christ', 'Lord', 'Spirit', 'Grace', 'Faith', 'Hope', 'Love', 'Bible', 'Scripture'];
    const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
    
    // Split text by keywords to insert spans
    const parts = text.split(regex);
    
    return (
        <p className="text-slate-700 dark:text-slate-300 leading-loose text-lg font-serif">
            {parts.map((part, i) => {
                if (keywords.some(k => k.toLowerCase() === part.toLowerCase())) {
                    return <span key={i} className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-0.5 rounded font-medium">{part}</span>;
                }
                return part;
            })}
        </p>
    );
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#101a22]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-colors">
        <div className="flex items-center gap-3 p-4">
            <button 
                onClick={() => navigate(-1)} 
                className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
                <span className="material-symbols-outlined text-slate-700 dark:text-white">arrow_back</span>
            </button>
            <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold text-slate-900 dark:text-white truncate">{sermon.title}</h1>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        {sermon.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {sermon.duration}
                    </span>
                </div>
            </div>
            <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined">more_vert</span>
            </button>
        </div>

        {/* Playback Controls */}
        <div className="px-4 pb-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 flex items-center gap-4 border border-slate-100 dark:border-slate-700">
                <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-blue-600 transition-colors shrink-0"
                >
                    <span className="material-symbols-outlined filled">
                        {isPlaying ? 'pause' : 'play_arrow'}
                    </span>
                </button>
                <div className="flex-1">
                    <div className="h-1 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden relative">
                        <div 
                            className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-slate-400 font-mono">{formatTime(currentTime)}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{sermon.duration}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-8 border-t border-gray-50 dark:border-gray-800/50">
            <button 
                onClick={() => setActiveTab('notes')}
                className={`py-3 text-sm font-bold border-b-2 transition-all relative ${
                    activeTab === 'notes' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
            >
                Notes <span className="ml-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px]">{sermon.notes.length}</span>
            </button>
            <button 
                onClick={() => setActiveTab('transcript')}
                className={`py-3 text-sm font-bold border-b-2 transition-all ${
                    activeTab === 'transcript' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
            >
                Transcript
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 bg-gray-50/50 dark:bg-[#101a22]">
        {activeTab === 'notes' ? (
            <div className="space-y-0 animate-fadeIn relative pb-8">
                {/* Timeline Line */}
                {sermon.notes.length > 0 && (
                     <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                )}

                {sermon.notes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <span className="material-symbols-outlined text-4xl mb-3 opacity-30">edit_note</span>
                        <p className="text-sm">No notes taken for this sermon.</p>
                    </div>
                ) : (
                    sermon.notes.map((note, index) => (
                        <div key={note.id} className="relative pl-10 pb-6 group">
                             {/* Timeline Dot */}
                             <div className="absolute left-[13px] top-4 w-3.5 h-3.5 rounded-full bg-white dark:bg-[#101a22] border-[3px] border-slate-300 dark:border-slate-600 group-hover:border-primary transition-colors z-10"></div>
                             
                             {/* Content Card */}
                             <div className="bg-white dark:bg-card-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                            {note.timestamp}
                                        </span>
                                        {note.verseRef && (
                                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900/30 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[10px]">menu_book</span>
                                                {note.verseRef}
                                            </span>
                                        )}
                                    </div>
                                    <button className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-200">
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                    </button>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                    {note.content}
                                </p>
                             </div>
                        </div>
                    ))
                )}
            </div>
        ) : (
            <div className="bg-white dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 animate-fadeIn">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50 dark:border-gray-800">
                    <h3 className="font-bold text-slate-900 dark:text-white">Full Text</h3>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-primary transition-colors" title="Copy Text">
                            <span className="material-symbols-outlined text-[18px]">content_copy</span>
                        </button>
                        <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-primary transition-colors" title="Text Settings">
                             <span className="material-symbols-outlined text-[18px]">text_fields</span>
                        </button>
                    </div>
                </div>
                <div className="prose dark:prose-invert max-w-none">
                    {renderTranscript(sermon.transcript)}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default SermonDetail;
