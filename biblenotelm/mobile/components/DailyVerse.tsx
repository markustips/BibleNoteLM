
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GeminiService } from '../services/geminiService';
import { BibleVerse } from '../types';
import { UnifiedDatabaseService, UserVerseData } from '../services/unifiedDatabase';

const MOCK_VERSE: BibleVerse = {
  reference: "Jeremiah 29:11",
  text: "For I know the plans I have for you,\" declares the Lord, \"plans to prosper you and not to harm you, plans to give you hope and a future.",
  translation: "NIV"
};

// Parse verse reference (e.g., "Jeremiah 29:11" -> {book: "Jeremiah", chapter: 29, verse: 11})
const parseReference = (reference: string): { book: string; chapter: number; verse: number } | null => {
  const match = reference.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) return null;
  return {
    book: match[1],
    chapter: parseInt(match[2]),
    verse: parseInt(match[3])
  };
};

const DailyVerse: React.FC = () => {
  const navigate = useNavigate();
  const [reflection, setReflection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [verseData, setVerseData] = useState<UserVerseData | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Load verse data from database on mount
  useEffect(() => {
    const loadVerseData = async () => {
      const parsed = parseReference(MOCK_VERSE.reference);
      if (!parsed) return;

      try {
        await UnifiedDatabaseService.initialize();
        const data = await UnifiedDatabaseService.getVerseData(parsed.book, parsed.chapter, parsed.verse);
        setVerseData(data);

        // Set initial states based on saved data
        setIsLiked(data.highlight === 'yellow'); // Using highlight as "liked" indicator
        setIsBookmarked(data.bookmarked);
      } catch (error) {
        console.error('Failed to load verse data:', error);
      }
    };

    loadVerseData();
  }, []);

  const handleGenReflection = async () => {
    setLoading(true);
    const result = await GeminiService.generateVerseReflection(MOCK_VERSE.text, MOCK_VERSE.reference);
    setReflection(result);
    setLoading(false);
  };

  // Handle like/heart toggle
  const handleLikeToggle = async () => {
    const parsed = parseReference(MOCK_VERSE.reference);
    if (!parsed) return;

    const newLikedState = !isLiked;
    setIsLiked(newLikedState);

    try {
      const now = Date.now();
      const updatedData: UserVerseData = {
        id: `${parsed.book}-${parsed.chapter}-${parsed.verse}`,
        book: parsed.book,
        chapter: parsed.chapter,
        verse: parsed.verse,
        note: verseData?.note || '',
        highlight: newLikedState ? 'yellow' : '', // Yellow highlight = liked
        bookmarked: verseData?.bookmarked || false,
        createdAt: verseData?.createdAt || now,
        updatedAt: now,
      };

      await UnifiedDatabaseService.saveVerseData(updatedData);
      setVerseData(updatedData);
    } catch (error) {
      console.error('Failed to save like:', error);
      setIsLiked(!newLikedState); // Revert on error
    }
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = async () => {
    const parsed = parseReference(MOCK_VERSE.reference);
    if (!parsed) return;

    const newBookmarkedState = !isBookmarked;
    setIsBookmarked(newBookmarkedState);

    try {
      const now = Date.now();
      const updatedData: UserVerseData = {
        id: `${parsed.book}-${parsed.chapter}-${parsed.verse}`,
        book: parsed.book,
        chapter: parsed.chapter,
        verse: parsed.verse,
        note: verseData?.note || '',
        highlight: verseData?.highlight || '',
        bookmarked: newBookmarkedState,
        createdAt: verseData?.createdAt || now,
        updatedAt: now,
      };

      await UnifiedDatabaseService.saveVerseData(updatedData);
      setVerseData(updatedData);
    } catch (error) {
      console.error('Failed to save bookmark:', error);
      setIsBookmarked(!newBookmarkedState); // Revert on error
    }
  };

  // Handle share to social media
  const handleShare = (platform: string) => {
    const shareText = `"${MOCK_VERSE.text}"\n\n— ${MOCK_VERSE.reference} (${MOCK_VERSE.translation})`;
    const encodedText = encodeURIComponent(shareText);
    const hashtags = encodeURIComponent('Bible,DailyVerse,Faith');

    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&hashtags=${hashtags}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?quote=${encodedText}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?text=${encodedText}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(shareText);
        alert('Verse copied to clipboard!');
        setShowShareModal(false);
        return;
      default:
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      setShowShareModal(false);
    }
  };

  return (
    <section className="p-4 w-full">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-white to-primary/5 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 shadow-sm border border-primary/10 dark:border-slate-700 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider uppercase text-primary bg-primary/10 px-2 py-1 rounded-full">Verse of the Day</span>
          <div className="flex gap-1">
            {/* Heart/Like Button */}
            <button
              onClick={handleLikeToggle}
              className={`p-2 rounded-full transition-all active:scale-95 ${isLiked ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
              title={isLiked ? 'Remove from favorites' : 'Add to favorites'}
            >
              <span className={`material-symbols-outlined text-[20px] ${isLiked ? 'filled' : ''}`}>favorite</span>
            </button>

            {/* Bookmark Button */}
            <button
              onClick={handleBookmarkToggle}
              className={`p-2 rounded-full transition-all active:scale-95 ${isBookmarked ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark this verse'}
            >
              <span className={`material-symbols-outlined text-[20px] ${isBookmarked ? 'filled' : ''}`}>bookmark</span>
            </button>

            {/* Share Button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 rounded-full text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors dark:text-gray-500"
              title="Share verse"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>

            {/* Open in Bible Reader Button */}
            <button
                onClick={() => {
                  const parsed = parseReference(MOCK_VERSE.reference);
                  if (parsed) {
                    navigate(`/bible?book=${parsed.book}&chapter=${parsed.chapter}&verse=${parsed.verse}`);
                  }
                }}
                className="p-2 rounded-full text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors dark:text-gray-500"
                title="Open in Bible Reader"
            >
              <span className="material-symbols-outlined text-[20px]">open_in_full</span>
            </button>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <p className="font-serif text-xl sm:text-2xl italic leading-relaxed text-gray-800 dark:text-gray-100">
             “{MOCK_VERSE.text}”
          </p>
          <p className="text-right font-bold text-sm text-gray-500 dark:text-gray-400 mt-2">— {MOCK_VERSE.reference}</p>
        </div>

        {/* AI Reflection Section */}
        {reflection ? (
          <div className="mt-4 bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-primary/10 animate-fadeIn backdrop-blur-sm">
             <div className="flex items-center gap-2 mb-2 text-primary">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <span className="text-xs font-bold uppercase">Reflection</span>
             </div>
             <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-display">
               {reflection}
             </p>
          </div>
        ) : (
          <button 
            onClick={handleGenReflection}
            disabled={loading}
            className="mt-2 self-start flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 shadow-sm hover:border-primary/50 transition-all active:scale-95 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[18px] text-yellow-500 ${loading ? 'animate-spin' : ''}`}>
              {loading ? 'refresh' : 'auto_awesome'}
            </span>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {loading ? 'Generating...' : 'View Reflection'}
            </span>
          </button>
        )}

        {/* Decorative subtle background element */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Share Verse</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px] text-gray-500">close</span>
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 italic">
              "{MOCK_VERSE.text}"
              <span className="block mt-2 font-semibold text-primary">— {MOCK_VERSE.reference}</span>
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Twitter */}
              <button
                onClick={() => handleShare('twitter')}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 transition-colors border border-[#1DA1F2]/20"
              >
                <div className="w-10 h-10 rounded-full bg-[#1DA1F2] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </div>
                <span className="font-semibold text-[#1DA1F2]">Twitter</span>
              </button>

              {/* Facebook */}
              <button
                onClick={() => handleShare('facebook')}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 transition-colors border border-[#1877F2]/20"
              >
                <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span className="font-semibold text-[#1877F2]">Facebook</span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => handleShare('whatsapp')}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-colors border border-[#25D366]/20"
              >
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </div>
                <span className="font-semibold text-[#25D366]">WhatsApp</span>
              </button>

              {/* Telegram */}
              <button
                onClick={() => handleShare('telegram')}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#0088CC]/10 hover:bg-[#0088CC]/20 transition-colors border border-[#0088CC]/20"
              >
                <div className="w-10 h-10 rounded-full bg-[#0088CC] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </div>
                <span className="font-semibold text-[#0088CC]">Telegram</span>
              </button>

              {/* Copy to Clipboard */}
              <button
                onClick={() => handleShare('copy')}
                className="col-span-2 flex items-center justify-center gap-3 p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600"
              >
                <span className="material-symbols-outlined text-[20px] text-gray-700 dark:text-gray-300">content_copy</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Copy to Clipboard</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default DailyVerse;
