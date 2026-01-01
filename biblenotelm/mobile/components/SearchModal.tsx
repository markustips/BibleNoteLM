import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Bible Books for search
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

// Mock Data for Search
const SEARCH_DATA = [
  { id: '3', type: 'Event', title: "Sunday Worship Service", subtitle: "Main Sanctuary • Sunday 10am", path: "/events/3" },
  { id: '2', type: 'Event', title: "Youth Group Meetup", subtitle: "The Loft • Wed 6pm", path: "/events/2" },
  { id: 'ann-1', type: 'Announcement', title: "Church Picnic", subtitle: "Community Event", path: "/events/ann-1" },
  { id: 's-1', type: 'Sermon', title: "Finding Hope in Chaos", subtitle: "Recorded last Sunday", path: "/sermons" },
  { id: 'p-1', type: 'Prayer', title: "Prayer Journal", subtitle: "View your requests", path: "/prayers" },
];

type SearchResult = {
  id: string;
  type: 'Event' | 'Sermon' | 'Bible' | 'Prayer' | 'Announcement' | 'Book' | 'Verse';
  title: string;
  subtitle: string;
  path: string;
  book?: string;
  chapter?: number;
  verse?: number;
};

interface SearchModalProps {
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchingVerses, setSearchingVerses] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-focus input on open
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Parse verse references like "John 3:16", "Romans 8", "Genesis 1:1-3"
  const parseVerseReference = (text: string): { book: string; chapter?: number; verse?: number } | null => {
    const trimmed = text.trim();

    // Try to match "BookName Chapter:Verse" or "BookName Chapter"
    // Examples: "John 3:16", "Romans 8", "1 John 2:5"
    const match = trimmed.match(/^([\d\s\w]+?)\s+(\d+)(?::(\d+))?$/i);

    if (match) {
      const bookName = match[1].trim();
      const chapter = parseInt(match[2]);
      const verse = match[3] ? parseInt(match[3]) : undefined;

      // Find matching book (case-insensitive, partial match)
      const matchedBook = BIBLE_BOOKS.find(b =>
        b.toLowerCase() === bookName.toLowerCase() ||
        b.toLowerCase().startsWith(bookName.toLowerCase())
      );

      if (matchedBook) {
        return { book: matchedBook, chapter, verse };
      }
    }

    return null;
  };

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    // 1. Search Bible Books
    const matchingBooks = BIBLE_BOOKS.filter(book =>
      book.toLowerCase().includes(lowerQuery)
    );

    matchingBooks.forEach(book => {
      searchResults.push({
        id: `book-${book}`,
        type: 'Book',
        title: book,
        subtitle: 'Bible Book',
        path: '/bible',
        book: book,
        chapter: 1
      });
    });

    // 2. Parse verse references (e.g., "John 3:16", "Romans 8")
    const verseRef = parseVerseReference(query);
    if (verseRef) {
      const { book, chapter, verse } = verseRef;
      searchResults.unshift({
        id: `verse-${book}-${chapter}-${verse || 0}`,
        type: 'Verse',
        title: verse ? `${book} ${chapter}:${verse}` : `${book} ${chapter}`,
        subtitle: verse ? 'Go to verse' : 'Go to chapter',
        path: '/bible',
        book,
        chapter,
        verse
      });
    }

    // 3. Search other content (Events, Sermons, etc.)
    const filtered = SEARCH_DATA.filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.subtitle.toLowerCase().includes(lowerQuery) ||
      item.type.toLowerCase().includes(lowerQuery)
    );

    searchResults.push(...filtered);

    setResults(searchResults);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'Book' || result.type === 'Verse') {
      // Navigate to Bible with book/chapter/verse params
      const params = new URLSearchParams();
      if (result.book) params.set('book', result.book);
      if (result.chapter) params.set('chapter', result.chapter.toString());
      if (result.verse) params.set('verse', result.verse.toString());
      navigate(`/bible?${params.toString()}`);
    } else {
      navigate(result.path);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-[#101a22] animate-fadeIn flex flex-col">
      {/* Search Header */}
      <div className="flex items-center gap-3 pt-safe px-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <button 
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">arrow_back</span>
        </button>
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search events, sermons, verses..."
            className="w-full bg-transparent text-lg font-medium text-slate-900 dark:text-white placeholder-gray-400 outline-none border-none focus:ring-0 p-0"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {query && (
          <button onClick={() => setQuery('')} className="p-1 text-gray-400 hover:text-gray-600">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}
      </div>

      {/* Results Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {query === '' ? (
          // Empty State / Suggestions
          <div className="mt-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Suggested</h3>
            <div className="flex flex-wrap gap-2">
              {['Events', 'Sermons', 'John 3:16', 'Prayers'].map(tag => (
                <button 
                  key={tag} 
                  onClick={() => setQuery(tag)}
                  className="px-4 py-2 rounded-full bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Result List
          <div className="space-y-2">
            {results.length > 0 ? (
              results.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleResultClick(item)}
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[20px]">
                      {item.type === 'Event' ? 'calendar_month' :
                       item.type === 'Sermon' ? 'mic' :
                       item.type === 'Bible' || item.type === 'Book' || item.type === 'Verse' ? 'menu_book' :
                       item.type === 'Prayer' ? 'hands_praying' : 'campaign'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                        {item.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                       <span className="font-bold uppercase text-[10px] mr-1.5 opacity-70">{item.type}</span>
                       {item.subtitle}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">search_off</span>
                <p>No results found for "{query}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchModal;