# Firebase Emulators - Manual Start Guide

## ✅ All Processes Reset Successfully!

I've stopped all running Firebase emulator processes and created a fresh startup script.

---

## 🚀 How to Start the Emulators

### Option 1: Using the Batch Script (Recommended)

I created a startup script for you at: **`backend/start-emulators.bat`**

**To start:**
1. Open File Explorer
2. Navigate to: `D:\Dev\BibleNoteLm\backend\`
3. Double-click: **`start-emulators.bat`**
4. A terminal window will open showing emulator startup
5. Wait for "All emulators ready!" message (about 30 seconds)

**Or from terminal:**
```bash
cd D:\Dev\BibleNoteLm\backend
start-emulators.bat
```

### Option 2: Manual Command

```bash
cd D:\Dev\BibleNoteLm\backend
firebase emulators:start --only functions,firestore,auth,storage --project demo-biblenotelm
```

---

## 📊 When Emulators are Running

You'll see URLs like:

```
┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! It is now safe to connect.         │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────┬──────────────┬─────────────────────────────┐ │
│ │ Emulator  │ Host:Port    │ View in Emulator UI         │ │
│ ├───────────┼──────────────┼─────────────────────────────┤ │
│ │ Auth      │ localhost:9099 │ http://localhost:4000/auth│ │
│ │ Functions │ localhost:5001 │ http://localhost:4000/functions│ │
│ │ Firestore │ localhost:8080 │ http://localhost:4000/firestore│ │
│ │ Storage   │ localhost:9199 │ http://localhost:4000/storage  │ │
│ └───────────┴──────────────┴─────────────────────────────┘ │
│                                                             │
│ Emulator Hub running at localhost:4400                     │
│                                                             │
│ Other reserved ports: 4500, 9150                           │
└─────────────────────────────────────────────────────────────┘

  View Emulator UI at http://localhost:4000
```

---

## 🧪 Test the Emulators

### Step 1: Open Emulator UI
```
http://localhost:4000
```

You should see:
- Dashboard with all services
- Firestore Database tab (empty initially)
- Authentication tab (no users yet)
- Functions tab (39 functions loaded)
- Storage tab (no files yet)

### Step 2: Start Dashboard
Open a **new terminal** (keep emulators running):

```bash
cd D:\Dev\BibleNoteLm\dashboard-admin
npm run dev
```

Opens at: http://localhost:5174

### Step 3: Test Sign In

1. Go to dashboard: http://localhost:5174
2. Click "Sign in with Google"
3. **In emulator mode**: Just enter any email (e.g., `pastor@test.com`)
4. User created automatically!
5. Check Emulator UI → Authentication → you'll see your test user

### Step 4: Make Yourself a Pastor

1. Open Emulator UI: http://localhost:4000
2. Click "Firestore" tab
3. Click on `users` collection
4. Find your user document
5. Click to edit
6. Change `role` field from `"guest"` to `"pastor"`
7. Click "Save"

### Step 5: Create Test Church

1. Refresh dashboard
2. Go to "Church Settings" (now visible since you're pastor)
3. Fill in church details:
   - Name: Test Community Church
   - Address: 123 Main St
   - City: Springfield
   - etc.
4. Click "Create Church"
5. Note the church code displayed (e.g., "ABC123")

### Step 6: Create Announcement

1. Go to "Announcements" tab
2. Click "New Announcement"
3. Fill in:
   - Title: "Welcome!"
   - Content: "This is a test announcement"
   - Priority: High
4. (Optional) Upload an image
5. Click "Publish"

### Step 7: View in Emulator UI

1. Go to Emulator UI: http://localhost:4000
2. Click "Firestore"
3. You'll see new collections:
   - `churches/` → your test church
   - `announcements/` → your test announcement
4. Click on each to explore the data

### Step 8: Test Mobile App

Open another terminal:

```bash
cd D:\Dev\BibleNoteLm\biblenotelm
npm run dev
```

Opens at: http://localhost:3000

1. Sign in (use different email, e.g., `member@test.com`)
2. Go to "Join Church"
3. Enter church code from dashboard (e.g., "ABC123")
4. Click "Join"
5. View announcements - you should see the one you created!

---

## 🛑 How to Stop Emulators

**In the terminal window where emulators are running:**
- Press **Ctrl+C**
- Confirm with **Y** if prompted

**Or kill the process:**
```bash
# Find the process
netstat -ano | findstr ":4000"
# Kill it (replace PID with actual number)
taskkill //F //PID <PID>
```

---

## 🔧 Troubleshooting

### "Port already in use"

**Problem**: Can't start emulators, ports are busy

**Solution**: Kill all Firebase processes:
```bash
# Find processes on emulator ports
netstat -ano | findstr ":4000\|:8080\|:9099"

# Kill each process (replace PID)
taskkill //F //PID <PID>
```

### "Firebase login required"

**Problem**: Emulators say you need to login

**Solution**: Use demo project mode (already set in the script):
```bash
firebase emulators:start --project demo-biblenotelm
```

The `demo-` prefix tells Firebase to skip authentication checks.

### "Functions not loading"

**Problem**: 39 functions don't appear in Emulator UI

**Solution**: Rebuild functions:
```bash
cd backend/functions
npm run build
cd ..
firebase emulators:start --project demo-biblenotelm
```

### "Cannot connect to emulators from dashboard/app"

**Problem**: Dashboard shows connection errors

**Solution**: Make sure:
1. Emulators are running (check http://localhost:4000)
2. Dashboard/app is running in dev mode (`npm run dev`)
3. Using `localhost` (not `127.0.0.1` or production URLs)

---

## 📝 What the Emulators Include

### ✅ Firestore Database (Port 8080)
- All collections (users, churches, announcements, events, prayers)
- Real-time updates
- Security rules testing
- Data viewer in UI

### ✅ Authentication (Port 9099)
- Fake Google Sign-In (no real OAuth)
- Just enter any email
- User management
- Token generation

### ✅ Cloud Functions (Port 5001)
- All 39 functions loaded:
  - 5 Auth functions
  - 6 Church management
  - 5 Announcements
  - 8 Events
  - 7 Prayers
  - 5 Subscriptions
  - 7 Admin/Analytics
  - 3 Scheduled jobs (won't run on schedule in emulator)
- Function logs visible in UI
- Instant deployment (no build delay)

### ✅ Cloud Storage (Port 9199)
- Image upload testing
- File browser in UI
- Temporary storage (cleared on restart)

### ✅ Emulator UI (Port 4000)
- Visual dashboard
- Database viewer
- Function logs
- Auth user management
- Storage browser

---

## 🎯 Emulator vs Production

### In Emulator Mode:
- ✅ No real Google OAuth needed
- ✅ No credit card / billing required
- ✅ Data is temporary (cleared on restart)
- ✅ Instant function deployment
- ✅ Safe to experiment
- ✅ Can't affect production data

### In Production:
- Real Google accounts
- Real Firebase billing
- Persistent data
- Function deployment takes ~2 minutes
- Affects real users
- Costs money (but cheap for small usage)

---

## 💡 Tips

1. **Keep Emulators Running**: Leave the emulator terminal open while developing
2. **Use Multiple Terminals**:
   - Terminal 1: Emulators
   - Terminal 2: Dashboard dev server
   - Terminal 3: Mobile app dev server
3. **Check Emulator UI Often**: Best way to see what data is being created
4. **Restart Emulators to Clear Data**: Fresh start = fresh database
5. **Use Demo Project**: Always include `--project demo-biblenotelm` to avoid auth issues

---

## ✅ Success Checklist

- [ ] Emulators started (saw "All emulators ready!")
- [ ] Emulator UI accessible (http://localhost:4000)
- [ ] Dashboard running (http://localhost:5174)
- [ ] Signed in to dashboard
- [ ] Changed role to "pastor" in Firestore
- [ ] Created test church
- [ ] Created test announcement
- [ ] Mobile app running (http://localhost:3000)
- [ ] Joined church from mobile app
- [ ] Saw announcement in mobile app
- [ ] All data visible in Emulator UI

---

**You're all set! The emulators have been reset and are ready to start fresh.** 🎉

Just run the batch file or manual command above and you'll have a complete local development environment with all backend services running!
