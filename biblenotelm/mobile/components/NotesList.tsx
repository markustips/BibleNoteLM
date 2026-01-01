
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, BookOpen, Sparkles, Search, SortAsc, SortDesc, CheckSquare, Square } from 'lucide-react';
import { UnifiedDatabaseService, UserVerseData } from '../services/unifiedDatabase';
import { GeminiService } from '../services/geminiService';
import { useUserStore } from '../stores/useUserStore';

const NotesList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [notes, setNotes] = useState<UserVerseData[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<UserVerseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingNote, setEditingNote] = useState<UserVerseData | null>(null);
  const [editContent, setEditContent] = useState('');
  const [summarizingNoteId, setSummarizingNoteId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string>>({});

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [summarizing, setSummarizing] = useState(false);
  const [batchSummary, setBatchSummary] = useState<string | null>(null);
  const [showSaveSummaryDialog, setShowSaveSummaryDialog] = useState(false);

  // Load notes on mount
  useEffect(() => {
    loadNotes();
  }, []);

  // Filter and sort notes when search or sort changes
  useEffect(() => {
    filterAndSortNotes();
  }, [notes, searchQuery, sortOrder]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      await UnifiedDatabaseService.initialize();
      const allVerseData = await UnifiedDatabaseService.getAllVerseData();

      // Filter only verses with notes
      const notesOnly = allVerseData.filter(v => v.note && v.note.trim() !== '');
      setNotes(notesOnly);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortNotes = () => {
    let result = [...notes];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(note =>
        note.note.toLowerCase().includes(query) ||
        note.book.toLowerCase().includes(query) ||
        `${note.book} ${note.chapter}:${note.verse}`.toLowerCase().includes(query)
      );
    }

    // Sort by date
    result.sort((a, b) => {
      const timeA = a.updatedAt || a.createdAt;
      const timeB = b.updatedAt || b.createdAt;
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    setFilteredNotes(result);
  };

  const handleDeleteNote = async (note: UserVerseData) => {
    if (!confirm('Delete this note?')) return;

    try {
      const updatedNote = { ...note, note: '' };
      await UnifiedDatabaseService.saveVerseData(updatedNote);
      await loadNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note');
    }
  };

  const handleEditNote = (note: UserVerseData) => {
    setEditingNote(note);
    setEditContent(note.note);
  };

  const handleSaveEdit = async () => {
    if (!editingNote) return;

    try {
      const updatedNote = {
        ...editingNote,
        note: editContent,
        updatedAt: Date.now()
      };
      await UnifiedDatabaseService.saveVerseData(updatedNote);
      setEditingNote(null);
      setEditContent('');
      await loadNotes();
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('Failed to save note');
    }
  };

  const handleSummarizeNote = async (note: UserVerseData) => {
    // Check subscription
    if (!user?.subscriptionTier || user.subscriptionTier === 'free') {
      alert('AI summarization is available for Premium and Basic subscribers only. Please upgrade your subscription.');
      return;
    }

    try {
      setSummarizingNoteId(note.id);
      const summary = await GeminiService.summarizeText(note.note);
      setSummaries(prev => ({ ...prev, [note.id]: summary }));
    } catch (error) {
      console.error('Failed to summarize note:', error);
      alert('Failed to generate summary');
    } finally {
      setSummarizingNoteId(null);
    }
  };

  // Toggle select mode
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedNotes(new Set());
  };

  // Toggle note selection
  const toggleNoteSelection = (noteId: string) => {
    const newSelected = new Set(selectedNotes);
    if (newSelected.has(noteId)) {
      newSelected.delete(noteId);
    } else {
      newSelected.add(noteId);
    }
    setSelectedNotes(newSelected);
  };

  // Summarize selected notes
  const handleSummarizeSelected = async () => {
    if (selectedNotes.size === 0) {
      alert('Please select at least one note to summarize');
      return;
    }

    // Check subscription
    if (!user?.subscriptionTier || user.subscriptionTier === 'free') {
      alert('AI summarization is available for Premium and Basic subscribers only. Please upgrade your subscription.');
      return;
    }

    try {
      setSummarizing(true);

      // Get selected notes content
      const selectedNotesData = notes.filter(n => selectedNotes.has(n.id));
      const combinedText = selectedNotesData
        .map(n => `${n.book} ${n.chapter}:${n.verse}\n${n.note}`)
        .join('\n\n---\n\n');

      const summary = await GeminiService.summarizeText(combinedText);
      setBatchSummary(summary);
      setShowSaveSummaryDialog(true);
    } catch (error) {
      console.error('Failed to summarize notes:', error);
      alert('Failed to generate summary');
    } finally {
      setSummarizing(false);
    }
  };

  // Save batch summary as new note
  const handleSaveBatchSummary = async () => {
    if (!batchSummary) return;

    try {
      const now = Date.now();
      const summaryNote: UserVerseData = {
        id: `summary-${now}`,
        book: 'Summary',
        chapter: 0,
        verse: 0,
        note: `AI Summary of ${selectedNotes.size} notes:\n\n${batchSummary}`,
        highlight: 'yellow',
        bookmarked: false,
        createdAt: now,
        updatedAt: now,
      };

      await UnifiedDatabaseService.saveVerseData(summaryNote);

      // Reset state
      setShowSaveSummaryDialog(false);
      setBatchSummary(null);
      setSelectedNotes(new Set());
      setSelectMode(false);

      await loadNotes();
      alert('Summary saved as a new note!');
    } catch (error) {
      console.error('Failed to save summary:', error);
      alert('Failed to save summary');
    }
  };

  // Discard batch summary
  const handleDiscardBatchSummary = () => {
    setShowSaveSummaryDialog(false);
    setBatchSummary(null);
    setSelectedNotes(new Set());
    setSelectMode(false);
  };

  const navigateToVerse = (note: UserVerseData) => {
    navigate(`/bible?book=${note.book}&chapter=${note.chapter}&verse=${note.verse}`);
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="bg-white dark:bg-[#101a22] sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bible Notes</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {selectMode && selectedNotes.size > 0
                  ? `${selectedNotes.size} selected`
                  : `${filteredNotes.length} ${filteredNotes.length === 1 ? 'note' : 'notes'}`
                }
              </p>
            </div>
            <div className="flex gap-2">
              {/* Select Mode Toggle */}
              {(user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'basic') && (
                <button
                  onClick={toggleSelectMode}
                  className={`px-3 py-2 rounded-xl font-medium text-sm transition-colors ${
                    selectMode
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {selectMode ? 'Cancel' : 'Select'}
                </button>
              )}

              <button
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={`Sort ${sortOrder === 'desc' ? 'oldest first' : 'newest first'}`}
              >
                {sortOrder === 'desc' ? (
                  <SortDesc className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <SortAsc className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes or references..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Summarize Selected Button */}
          {selectMode && selectedNotes.size > 0 && (
            <button
              onClick={handleSummarizeSelected}
              disabled={summarizing}
              className="w-full mt-3 py-3 px-4 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Sparkles className={`w-5 h-5 ${summarizing ? 'animate-pulse' : ''}`} />
              {summarizing ? 'Summarizing...' : `Summarize ${selectedNotes.size} ${selectedNotes.size === 1 ? 'Note' : 'Notes'}`}
            </button>
          )}
        </div>
      </div>

      {/* Notes List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Loading notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium text-center">
              {searchQuery ? 'No notes found matching your search' : 'No notes yet. Start adding notes to your Bible verses!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`bg-white dark:bg-card-dark rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all ${
                  selectedNotes.has(note.id)
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Note Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Checkbox in select mode */}
                    {selectMode && (
                      <button
                        onClick={() => toggleNoteSelection(note.id)}
                        className="mt-1 flex-shrink-0"
                      >
                        {selectedNotes.has(note.id) ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    )}

                    <div className="flex-1">
                      <button
                        onClick={() => !selectMode && navigateToVerse(note)}
                        className="text-primary font-bold hover:underline flex items-center gap-2 group"
                        disabled={selectMode}
                      >
                        <BookOpen className="w-4 h-4 group-hover:text-primary-dark" />
                        {note.book} {note.chapter}:{note.verse}
                      </button>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(note.updatedAt || note.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons - Hide in select mode */}
                  {!selectMode && (
                    <div className="flex gap-1">
                      {/* AI Summarize Button */}
                      {(user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'basic') && (
                        <button
                          onClick={() => handleSummarizeNote(note)}
                          disabled={summarizingNoteId === note.id}
                          className="p-2 rounded-full hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 transition-colors disabled:opacity-50"
                          title="AI Summarize"
                        >
                          <Sparkles className={`w-4 h-4 ${summarizingNoteId === note.id ? 'animate-pulse' : ''}`} />
                        </button>
                      )}

                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditNote(note)}
                        className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                        title="Edit note"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteNote(note)}
                        className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Note Content */}
                <p className="text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap mb-3">
                  {note.note}
                </p>

                {/* AI Summary */}
                {summaries[note.id] && (
                  <div className="mt-3 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-xs font-bold uppercase text-yellow-700 dark:text-yellow-400">AI Summary</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {summaries[note.id]}
                    </p>
                  </div>
                )}

                {/* Highlight Badge */}
                {note.highlight && (
                  <div className="mt-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      note.highlight === 'yellow' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      note.highlight === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      note.highlight === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      note.highlight === 'red' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: note.highlight }}></span>
                      Highlighted
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Panel - Slide Up */}
      {editingNote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setEditingNote(null)}>
          <div
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl max-h-[80vh] animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>

            <div className="px-6 pb-6 overflow-y-auto max-h-[calc(80vh-40px)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Note</h3>
                  <p className="text-sm text-primary font-semibold">
                    {editingNote.book} {editingNote.chapter}:{editingNote.verse}
                  </p>
                </div>
                <button
                  onClick={() => setEditingNote(null)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px] text-gray-500">close</span>
                </button>
              </div>

              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Write your note here..."
                className="w-full h-48 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                autoFocus
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingNote(null)}
                  className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Summary Dialog */}
      {showSaveSummaryDialog && batchSummary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleDiscardBatchSummary}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Summary Generated</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Summary of {selectedNotes.size} {selectedNotes.size === 1 ? 'note' : 'notes'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 mb-6">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {batchSummary}
              </p>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Would you like to save this summary as a new note?
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleSaveBatchSummary}
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Save as Note
              </button>
              <button
                onClick={handleDiscardBatchSummary}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesList;
