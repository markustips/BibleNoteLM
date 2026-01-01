/**
 * API.Bible Service
 * Documentation: https://scripture.api.bible/livedocs
 */

const API_KEY = import.meta.env.VITE_API_BIBLE_KEY || '';
const BASE_URL = 'https://api.scripture.api.bible/v1';

// Check if API key is valid (at least 20 characters long)
const HAS_VALID_KEY = API_KEY && API_KEY.length >= 20 && !API_KEY.includes('your_');

// Debug: Log API key loading status
if (HAS_VALID_KEY) {
  console.log('✅ API.Bible: Valid key loaded');
} else {
  console.log('⚠️ API.Bible: No valid key - using bible-api.com fallback only');
}

interface ApiBibleVerse {
  id: string;
  orgId: string;
  bookId: string;
  chapterId: string;
  content: string;
  reference: string;
  verseCount: number;
  copyright: string;
}

interface ApiBibleChapter {
  id: string;
  bibleId: string;
  number: string;
  bookId: string;
  content: string;
  reference: string;
  copyright: string;
}

interface ApiBibleBook {
  id: string;
  bibleId: string;
  abbreviation: string;
  name: string;
  nameLong: string;
}

interface ApiBibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  language: {
    id: string;
    name: string;
  };
}

/**
 * Bible version mappings to API.Bible IDs
 */
export const BIBLE_VERSION_MAP: Record<string, string> = {
  kjv: 'de4e12af7f28f599-02', // King James Version
  niv: '06125adad2d5898a-01', // New International Version 2011
  esv: '9879dbb7cfe39e4d-04', // English Standard Version
  nkjv: '6bab4d6c61b31b80-01', // New King James Version
  nlt: '01b29f36-3e8f-4a91-8164-53788a69f70e', // New Living Translation
  nrsv: '40072c4a5aba4022-01', // New Revised Standard Version
  nasb: '5d0f0701c6a45108-01', // New American Standard Bible
};

/**
 * Book name mappings to API.Bible book IDs (KJV standard)
 */
const BOOK_ID_MAP: Record<string, string> = {
  'Genesis': 'GEN',
  'Exodus': 'EXO',
  'Leviticus': 'LEV',
  'Numbers': 'NUM',
  'Deuteronomy': 'DEU',
  'Joshua': 'JOS',
  'Judges': 'JDG',
  'Ruth': 'RUT',
  '1 Samuel': '1SA',
  '2 Samuel': '2SA',
  '1 Kings': '1KI',
  '2 Kings': '2KI',
  '1 Chronicles': '1CH',
  '2 Chronicles': '2CH',
  'Ezra': 'EZR',
  'Nehemiah': 'NEH',
  'Esther': 'EST',
  'Job': 'JOB',
  'Psalms': 'PSA',
  'Proverbs': 'PRO',
  'Ecclesiastes': 'ECC',
  'Song of Solomon': 'SNG',
  'Isaiah': 'ISA',
  'Jeremiah': 'JER',
  'Lamentations': 'LAM',
  'Ezekiel': 'EZK',
  'Daniel': 'DAN',
  'Hosea': 'HOS',
  'Joel': 'JOL',
  'Amos': 'AMO',
  'Obadiah': 'OBA',
  'Jonah': 'JON',
  'Micah': 'MIC',
  'Nahum': 'NAM',
  'Habakkuk': 'HAB',
  'Zephaniah': 'ZEP',
  'Haggai': 'HAG',
  'Zechariah': 'ZEC',
  'Malachi': 'MAL',
  'Matthew': 'MAT',
  'Mark': 'MRK',
  'Luke': 'LUK',
  'John': 'JHN',
  'Acts': 'ACT',
  'Romans': 'ROM',
  '1 Corinthians': '1CO',
  '2 Corinthians': '2CO',
  'Galatians': 'GAL',
  'Ephesians': 'EPH',
  'Philippians': 'PHP',
  'Colossians': 'COL',
  '1 Thessalonians': '1TH',
  '2 Thessalonians': '2TH',
  '1 Timothy': '1TI',
  '2 Timothy': '2TI',
  'Titus': 'TIT',
  'Philemon': 'PHM',
  'Hebrews': 'HEB',
  'James': 'JAS',
  '1 Peter': '1PE',
  '2 Peter': '2PE',
  '1 John': '1JN',
  '2 John': '2JN',
  '3 John': '3JN',
  'Jude': 'JUD',
  'Revelation': 'REV',
};

/**
 * Fetch headers with API key
 */
function getHeaders(): HeadersInit {
  const headers = {
    'api-key': API_KEY,
    'Accept': 'application/json',
  };

  // Debug: Log headers (mask API key)
  console.log('API Request Headers:', {
    'api-key': API_KEY ? API_KEY.substring(0, 8) + '...' : 'MISSING',
    'Accept': headers.Accept
  });

  return headers;
}

/**
 * Parse HTML content from API.Bible and extract verse text (secure)
 */
function parseVerseContent(html: string): string {
  // Use DOMParser for safe HTML parsing (no XSS risk)
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove verse numbers in <span> tags
  const verseNumbers = doc.querySelectorAll('.v');
  verseNumbers.forEach(el => el.remove());

  // Remove chapter numbers
  const chapterNumbers = doc.querySelectorAll('.chapter');
  chapterNumbers.forEach(el => el.remove());

  // Get clean text
  return doc.body.textContent?.trim().replace(/\s+/g, ' ') || '';
}

/**
 * Fetch a specific chapter from API.Bible
 */
export async function fetchChapter(
  book: string,
  chapter: number,
  version: string = 'kjv'
): Promise<Array<{ verse: number; text: string }>> {
  // Skip API.Bible if no valid key is configured
  if (!HAS_VALID_KEY) {
    throw new Error('No valid API.Bible key configured - skipping API.Bible');
  }

  try {
    const bibleId = BIBLE_VERSION_MAP[version.toLowerCase()] || BIBLE_VERSION_MAP.kjv;
    const bookId = BOOK_ID_MAP[book];

    if (!bookId) {
      throw new Error(`Unknown book: ${book}`);
    }

    // Construct chapter ID (e.g., "ROM.5" for Romans 5)
    const chapterId = `${bookId}.${chapter}`;

    // Fetch chapter with verses
    const response = await fetch(
      `${BASE_URL}/bibles/${bibleId}/chapters/${chapterId}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`,
      { headers: getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`API.Bible error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Parse the content to extract individual verses
    const content = data.data.content;
    const verses: Array<{ verse: number; text: string }> = [];

    // Use DOMParser for safe HTML parsing
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');

    // Find all verse spans
    const verseSpans = doc.querySelectorAll('.verse');

    verseSpans.forEach((verseSpan) => {
      const verseNumEl = verseSpan.querySelector('.v');
      const verseNumber = verseNumEl ? parseInt(verseNumEl.textContent || '0') : 0;

      if (verseNumber > 0) {
        // Remove the verse number element to get clean text
        verseNumEl?.remove();
        const text = verseSpan.textContent?.trim().replace(/\s+/g, ' ') || '';

        if (text) {
          verses.push({
            verse: verseNumber,
            text: text,
          });
        }
      }
    });

    // If no verse spans found, try alternative parsing
    if (verses.length === 0) {
      const lines = content.split(/(?=\[(\d+)\])/); // Split on verse numbers like [1], [2], etc.

      lines.forEach((line) => {
        const match = line.match(/\[(\d+)\](.*)/);
        if (match) {
          const verseNum = parseInt(match[1]);
          const text = parseVerseContent(match[2]);
          if (text) {
            verses.push({ verse: verseNum, text });
          }
        }
      });
    }

    return verses;
  } catch (error) {
    console.error('Error fetching from API.Bible:', error);
    throw error;
  }
}

/**
 * Search for verses
 */
export async function searchVerses(
  query: string,
  version: string = 'kjv',
  limit: number = 10
): Promise<Array<{ reference: string; text: string }>> {
  try {
    const bibleId = BIBLE_VERSION_MAP[version.toLowerCase()] || BIBLE_VERSION_MAP.kjv;

    const response = await fetch(
      `${BASE_URL}/bibles/${bibleId}/search?query=${encodeURIComponent(query)}&limit=${limit}`,
      { headers: getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`API.Bible search error: ${response.status}`);
    }

    const data = await response.json();

    return (data.data.passages || []).map((passage: any) => ({
      reference: passage.reference,
      text: parseVerseContent(passage.content),
    }));
  } catch (error) {
    console.error('Error searching API.Bible:', error);
    throw error;
  }
}

/**
 * Get available Bible versions
 */
export async function getBibleVersions(): Promise<ApiBibleVersion[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/bibles?language=eng`,
      { headers: getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`API.Bible versions error: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching Bible versions:', error);
    throw error;
  }
}

/**
 * Get books for a specific Bible version
 */
export async function getBibleBooks(version: string = 'kjv'): Promise<ApiBibleBook[]> {
  try {
    const bibleId = BIBLE_VERSION_MAP[version.toLowerCase()] || BIBLE_VERSION_MAP.kjv;

    const response = await fetch(
      `${BASE_URL}/bibles/${bibleId}/books`,
      { headers: getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`API.Bible books error: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching Bible books:', error);
    throw error;
  }
}
