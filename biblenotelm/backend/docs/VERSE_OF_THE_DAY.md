# Verse of the Day Feature Documentation

## Overview

The Verse of the Day (VOTD) feature allows pastors to manage daily Bible verses for their church members. It supports both manual selection and auto-generation based on weekly/monthly themes.

---

## Database Schema

### Collection: `daily_verses`

**Document ID:** `{churchId}_{date}` (e.g., `church001_2026-01-01`)

```typescript
{
  id: string;                          // Auto-generated
  churchId: string;                    // Church this verse belongs to
  date: string;                        // ISO date (YYYY-MM-DD)
  verse: {
    reference: string;                 // e.g., "John 3:16"
    text: string;                      // Verse content
    version: string;                   // Bible version (NIV, KJV, ESV)
  };
  theme?: string;                      // Optional theme (e.g., "Faith", "Hope")
  reflection?: string;                 // Pastor's reflection/commentary
  isAuto: boolean;                     // true = auto-generated, false = manual
  generatedBy?: string;                // "pastor" or "system"
  pastorId?: string;                   // User ID who created (if manual)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Collection: `church_themes`

**Document ID:** `{churchId}`

```typescript
{
  churchId: string;
  weeklyTheme?: {
    week: string;                      // ISO week (YYYY-W01)
    theme: string;                     // e.g., "Love and Compassion"
    verses: string[];                  // Suggested verse references
    startDate: string;
    endDate: string;
  };
  monthlyTheme?: {
    month: string;                     // YYYY-MM
    theme: string;                     // e.g., "New Beginnings"
    verses: string[];                  // Suggested verse references
    startDate: string;
    endDate: string;
  };
  autoGenerate: boolean;               // Enable/disable auto-generation
  preferredVersion: string;            // Default Bible version
  updatedAt: Timestamp;
  updatedBy: string;                   // Pastor ID
}
```

---

## Features

### 1. Manual Selection (Pastor Control)

**Use Case:** Pastor wants to select a specific verse for a specific day

**Flow:**
1. Pastor opens Dashboard → "Verse of the Day" section
2. Selects date (today or future)
3. Searches/enters verse reference (e.g., "Psalm 23:1")
4. System fetches verse text from API.Bible
5. Pastor adds optional reflection/commentary
6. Saves to `daily_verses` collection

**Backend Function:** `createDailyVerse()`

---

### 2. Auto-Generation (Theme-Based)

**Use Case:** Pastor sets weekly/monthly themes, system auto-generates daily verses

**Flow:**
1. Pastor sets weekly/monthly theme in Dashboard
2. Scheduled function runs daily at midnight
3. Checks if verse already exists for today
4. If not, generates verse based on current theme
5. Uses AI (Gemini) to select relevant verse from theme
6. Saves to `daily_verses` collection

**Backend Function:** `generateDailyVerse()` (scheduled)

---

### 3. Theme Management

**Weekly Theme:**
- Pastor sets theme for the week (Sunday - Saturday)
- System auto-generates verses aligned with theme
- Example themes: "Faith in Action", "God's Love", "Prayer and Fasting"

**Monthly Theme:**
- Pastor sets theme for the month
- Overrides weekly theme if both are set
- Example themes: "New Year, New Beginnings", "Easter Season", "Gratitude"

---

## Cloud Functions

### 1. `createDailyVerse` (Callable)

**Purpose:** Manually create/update verse of the day
**Security:** Pastor/Admin only
**Rate Limit:** 20 per hour

**Input:**
```json
{
  "churchId": "church001",
  "date": "2026-01-05",
  "reference": "John 3:16",
  "reflection": "God's love is unconditional..."
}
```

**Output:**
```json
{
  "success": true,
  "verseId": "verse123",
  "verse": {
    "reference": "John 3:16",
    "text": "For God so loved the world...",
    "version": "NIV"
  }
}
```

---

### 2. `updateDailyVerse` (Callable)

**Purpose:** Edit existing verse
**Security:** Pastor/Admin only

**Input:**
```json
{
  "verseId": "verse123",
  "reflection": "Updated reflection..."
}
```

---

### 3. `deleteDailyVerse` (Callable)

**Purpose:** Remove a daily verse
**Security:** Pastor/Admin only

---

### 4. `getDailyVerse` (Callable)

**Purpose:** Fetch verse for a specific date
**Security:** Church members only

**Input:**
```json
{
  "churchId": "church001",
  "date": "2026-01-05"
}
```

**Output:**
```json
{
  "verse": {
    "reference": "John 3:16",
    "text": "For God so loved the world...",
    "version": "NIV"
  },
  "theme": "God's Love",
  "reflection": "Pastor's thoughts...",
  "createdAt": "2026-01-05T00:00:00Z"
}
```

---

### 5. `setChurchTheme` (Callable)

**Purpose:** Set weekly or monthly theme
**Security:** Pastor/Admin only

**Input:**
```json
{
  "churchId": "church001",
  "type": "weekly",
  "theme": "Faith in Action",
  "startDate": "2026-01-05",
  "endDate": "2026-01-11",
  "suggestedVerses": ["Hebrews 11:1", "James 2:14-17"]
}
```

---

### 6. `toggleAutoGenerate` (Callable)

**Purpose:** Enable/disable auto-generation
**Security:** Pastor/Admin only

**Input:**
```json
{
  "churchId": "church001",
  "enabled": true
}
```

---

### 7. `generateDailyVerse` (Scheduled - Daily at Midnight)

**Purpose:** Auto-generate verse based on active theme
**Trigger:** Cloud Scheduler (cron: `0 0 * * *`)

**Logic:**
1. Get all churches with `autoGenerate: true`
2. For each church:
   - Check if verse exists for today
   - If not, get active theme (weekly or monthly)
   - Use Gemini AI to select verse from theme
   - Fetch verse text from API.Bible
   - Save to `daily_verses` collection

---

## API.Bible Integration

**Purpose:** Fetch actual verse text from Bible API

**Endpoint:** `https://api.scripture.api.bible/v1/bibles`

**Example Request:**
```typescript
const response = await fetch(
  `https://api.scripture.api.bible/v1/bibles/{bibleId}/verses/{verseId}`,
  {
    headers: {
      'api-key': process.env.BIBLE_API_KEY
    }
  }
);
```

**Bible Versions:**
- NIV: `de4e12af7f28f599-02`
- KJV: `de4e12af7f28f599-01`
- ESV: `f421fe261da7624f-01`

---

## Dashboard UI Components

### 1. Verse of the Day Management Page

**Location:** Dashboard → "Verse of the Day"

**Features:**
- Calendar view showing which days have verses
- "Create Verse" button
- Edit/delete existing verses
- Preview of current verse

**UI:**
```
┌─────────────────────────────────────────┐
│  Verse of the Day Management            │
├─────────────────────────────────────────┤
│                                          │
│  [📅 Calendar View]                     │
│   - Green dots: Verses set              │
│   - Gray: No verse                      │
│                                          │
│  Current Verse (Jan 5, 2026)            │
│  ┌──────────────────────────────────┐   │
│  │ John 3:16 (NIV)                  │   │
│  │ "For God so loved the world..."  │   │
│  │                                  │   │
│  │ Reflection: [Pastor's notes]    │   │
│  │                                  │   │
│  │ [Edit] [Delete]                 │   │
│  └──────────────────────────────────┘   │
│                                          │
│  [+ Create New Verse]                   │
│                                          │
└─────────────────────────────────────────┘
```

---

### 2. Theme Management

**Location:** Dashboard → "Themes"

**Features:**
- Set weekly theme
- Set monthly theme
- Toggle auto-generation
- Preview upcoming verses

**UI:**
```
┌─────────────────────────────────────────┐
│  Church Themes                          │
├─────────────────────────────────────────┤
│                                          │
│  Weekly Theme (Jan 5 - Jan 11)          │
│  ┌──────────────────────────────────┐   │
│  │ Theme: [Faith in Action      ]   │   │
│  │ Suggested Verses:                │   │
│  │  • Hebrews 11:1                  │   │
│  │  • James 2:14-17                 │   │
│  │  • Matthew 17:20                 │   │
│  │                                  │   │
│  │ [Save Weekly Theme]              │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Monthly Theme (January 2026)           │
│  ┌──────────────────────────────────┐   │
│  │ Theme: [New Beginnings       ]   │   │
│  │ Suggested Verses:                │   │
│  │  • 2 Corinthians 5:17            │   │
│  │  • Isaiah 43:19                  │   │
│  │                                  │   │
│  │ [Save Monthly Theme]             │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ☑ Auto-generate verses based on theme  │
│  Bible Version: [NIV ▼]                 │
│                                          │
└─────────────────────────────────────────┘
```

---

### 3. Create/Edit Verse Modal

**UI:**
```
┌─────────────────────────────────────────┐
│  Create Verse of the Day                │
├─────────────────────────────────────────┤
│                                          │
│  Date: [Jan 5, 2026  📅]                │
│                                          │
│  Verse Reference:                        │
│  [John 3:16                         ]   │
│  [🔍 Search Verses]                     │
│                                          │
│  Bible Version: [NIV ▼]                 │
│                                          │
│  Preview:                                │
│  ┌──────────────────────────────────┐   │
│  │ "For God so loved the world     │   │
│  │  that he gave his one and only  │   │
│  │  Son, that whoever believes in  │   │
│  │  him shall not perish but have  │   │
│  │  eternal life."                 │   │
│  │  - John 3:16 (NIV)              │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Reflection (Optional):                  │
│  ┌──────────────────────────────────┐   │
│  │ God's love is unconditional and │   │
│  │ eternal. This verse reminds us  │   │
│  │ of His great sacrifice...       │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Theme (Optional): [God's Love    ]     │
│                                          │
│  [Cancel]  [Save Verse]                 │
│                                          │
└─────────────────────────────────────────┘
```

---

## Mobile App Display

**Location:** Mobile App → Home Screen (Daily Verse Card)

**UI:**
```
┌─────────────────────────────────────────┐
│  📖 Verse of the Day                    │
├─────────────────────────────────────────┤
│  January 5, 2026                        │
│                                          │
│  "For God so loved the world that he    │
│   gave his one and only Son, that       │
│   whoever believes in him shall not     │
│   perish but have eternal life."        │
│                                          │
│  - John 3:16 (NIV)                      │
│                                          │
│  💡 Reflection:                         │
│  God's love is unconditional and        │
│  eternal...                             │
│                                          │
│  🏷️ Theme: God's Love                   │
│                                          │
│  [❤️ Save]  [📤 Share]  [📖 Read More] │
└─────────────────────────────────────────┘
```

---

## Implementation Checklist

### Backend
- [ ] Create `daily_verses` collection schema
- [ ] Create `church_themes` collection schema
- [ ] Add Firestore security rules
- [ ] Implement `createDailyVerse` function
- [ ] Implement `updateDailyVerse` function
- [ ] Implement `deleteDailyVerse` function
- [ ] Implement `getDailyVerse` function
- [ ] Implement `setChurchTheme` function
- [ ] Implement `toggleAutoGenerate` function
- [ ] Implement `generateDailyVerse` scheduled function
- [ ] Integrate API.Bible for verse fetching
- [ ] Integrate Gemini AI for verse selection

### Dashboard
- [ ] Create Verse Management page
- [ ] Create Theme Management page
- [ ] Create verse modal (create/edit)
- [ ] Add calendar view with indicators
- [ ] Add verse search functionality
- [ ] Add theme suggestions

### Mobile App
- [ ] Create Daily Verse service
- [ ] Add Daily Verse card to home screen
- [ ] Add verse sharing functionality
- [ ] Add save to favorites
- [ ] Add notification for new daily verse

---

## Environment Variables

Add to `.env`:

```bash
# API.Bible Configuration
BIBLE_API_KEY=your_api_bible_key_here
BIBLE_VERSION_NIV=de4e12af7f28f599-02
BIBLE_VERSION_KJV=de4e12af7f28f599-01
BIBLE_VERSION_ESV=f421fe261da7624f-01

# Gemini AI (for verse selection)
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## Example Usage

### Pastor Sets Weekly Theme
```typescript
// Dashboard calls backend
const setTheme = httpsCallable(functions, 'setChurchTheme');
await setTheme({
  churchId: 'church001',
  type: 'weekly',
  theme: 'Faith in Action',
  startDate: '2026-01-05',
  endDate: '2026-01-11',
  suggestedVerses: ['Hebrews 11:1', 'James 2:14-17']
});
```

### System Auto-Generates Verse
```typescript
// Runs at midnight daily
export const generateDailyVerse = functions.pubsub
  .schedule('0 0 * * *')
  .onRun(async () => {
    const churches = await getChurchesWithAutoGenerate();

    for (const church of churches) {
      const theme = await getCurrentTheme(church.id);
      const verse = await selectVerseFromTheme(theme);
      await saveDailyVerse(church.id, verse);
    }
  });
```

### Member Views Verse
```typescript
// Mobile app fetches daily verse
const getDailyVerse = httpsCallable(functions, 'getDailyVerse');
const result = await getDailyVerse({
  churchId: userChurchId,
  date: new Date().toISOString().split('T')[0]
});
// Display verse in UI
```

---

## Benefits

✅ **Pastor Control:** Full control over daily verses
✅ **Automation:** Set themes once, verses auto-generate
✅ **Flexibility:** Choose manual or auto per day
✅ **Themes:** Align verses with church teaching calendar
✅ **Engagement:** Members see fresh verse daily
✅ **Sharing:** Members can share verses with others
✅ **Analytics:** Track verse views and engagement

---

## Future Enhancements

- 📱 Push notifications for daily verse
- 📊 Analytics on most viewed verses
- 💾 Verse history and archive
- 🎨 Custom verse images/graphics
- 📧 Email digest with weekly verses
- 🔄 Import verse calendars from other sources
