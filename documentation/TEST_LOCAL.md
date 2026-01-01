# Local Testing Guide

Both the dashboard and mobile app have been built successfully! Here's how to test them locally before deploying to Firebase.

---

## ✅ Build Status

- **Dashboard**: ✅ Built successfully (`dashboard-admin/dist/`)
  - Bundle size: 518 KB (gzipped: 137 KB)
  - No errors or warnings

- **Mobile App**: ✅ Built successfully (`biblenotelm/dist/`)
  - Bundle size: 1.27 MB (gzipped: 307 KB)
  - No errors or warnings

- **Backend Functions**: ✅ Compiled (`backend/functions/lib/`)
  - 30+ Cloud Functions ready
  - TypeScript compiled to JavaScript

- **Firebase Config**: ✅ Configured
  - Project ID: `biblenotelm-6cf80`
  - Hosting targets: `church-biblenotelm` (dashboard), `app-biblenotelm` (mobile)

---

## 🧪 Option 1: Test with Vite Preview Server (Recommended for Quick Testing)

### Test Dashboard

```bash
cd dashboard-admin
npm run preview
```

- Opens at: `http://localhost:4173`
- Uses production build from `dist/` folder
- Fast and lightweight

### Test Mobile App

```bash
cd biblenotelm
npm run preview
```

- Opens at: `http://localhost:4173`
- Uses production build from `dist/` folder

**Note**: Only one preview server can run at a time on port 4173. Test one app, stop it (Ctrl+C), then test the other.

---

## 🧪 Option 2: Test with Firebase Emulators (Recommended for Full Testing)

This tests the full Firebase environment including Cloud Functions, Firestore, Auth, and Storage.

### Start Firebase Emulators

```bash
cd backend
firebase emulators:start
```

This starts:
- **Emulator UI**: http://localhost:4000
- **Functions**: http://localhost:5001
- **Firestore**: http://localhost:8080
- **Auth**: http://localhost:9099
- **Storage**: http://localhost:9199
- **Hosting** (both apps): http://localhost:5000

### Access Apps via Emulator

- **Dashboard**: http://localhost:5000 (if configured as default target)
- **Mobile App**: http://localhost:5000

**Important**: Firebase Hosting emulator can only serve one target at a time by default. To test both:

1. First, test with emulator serving dashboard:
   ```bash
   firebase emulators:start --only hosting:dashboard,functions,firestore,auth,storage
   ```

2. Stop emulator (Ctrl+C), then serve mobile app:
   ```bash
   firebase emulators:start --only hosting:app,functions,firestore,auth,storage
   ```

---

## 🧪 Option 3: Test with Development Server (Recommended for Development)

Use this for live editing and hot reload during development.

### Test Dashboard in Dev Mode

```bash
cd dashboard-admin
npm run dev
```

- Opens at: `http://localhost:5174`
- Live reload on file changes
- Source maps for debugging

### Test Mobile App in Dev Mode

```bash
cd biblenotelm
npm run dev
```

- Opens at: `http://localhost:3000`
- Live reload on file changes

**Note**: Dev mode uses `.env` file for Firebase config. Make sure `dashboard-admin/.env` and `biblenotelm/.env` are configured.

---

## ✅ What to Test

### Dashboard (Pastor/Admin Features)

1. **Sign In**
   - [ ] Click "Sign in with Google"
   - [ ] Verify authentication works
   - [ ] Check Firestore for user document created

2. **Church Management**
   - [ ] Go to Church Settings
   - [ ] Create a new church
   - [ ] Note the church code

3. **Announcements**
   - [ ] Create new announcement
   - [ ] Add title, content
   - [ ] Upload image (if Storage is enabled)
   - [ ] Save and verify it appears in list
   - [ ] Edit announcement
   - [ ] Delete announcement

4. **Events**
   - [ ] Create new event
   - [ ] Set date, time, location
   - [ ] Add description
   - [ ] Save and verify in list

5. **Members**
   - [ ] View church members list
   - [ ] Verify your user appears

6. **Prayer Requests**
   - [ ] View submitted prayer requests
   - [ ] Mark prayer as answered

### Mobile App (Member Features)

1. **Sign In**
   - [ ] Sign in with Google
   - [ ] Verify authentication works

2. **Join Church**
   - [ ] Use church code from dashboard
   - [ ] Join the church
   - [ ] Verify churchId updated in Firestore

3. **View Announcements**
   - [ ] See announcements created in dashboard
   - [ ] Verify images load
   - [ ] Click to view details

4. **View Events**
   - [ ] See events from dashboard
   - [ ] View event details
   - [ ] RSVP to event (if implemented)

5. **Prayer Journal**
   - [ ] Submit new prayer request
   - [ ] View your prayers
   - [ ] Mark prayer as answered

6. **Sermon Recorder**
   - [ ] Test audio recording
   - [ ] Verify AI transcription (requires Gemini API key)

7. **Bible Reader**
   - [ ] Search for verse
   - [ ] Read scripture
   - [ ] Take notes on verse

---

## 🔧 Troubleshooting

### "Firebase config not found" Error

**Problem**: App can't find Firebase configuration.

**Solution**:
1. Check `.env` file exists and has correct values
2. For dev mode: Restart dev server
3. For production build: Rebuild the app

```bash
# Dashboard
cd dashboard-admin
npm run build

# Mobile App
cd biblenotelm
npm run build
```

### "Permission Denied" in Firestore

**Problem**: Can't read/write to Firestore.

**Solutions**:
1. **If using emulators**: Firestore rules may be too strict. Check `backend/firestore.rules`
2. **If using production**: Deploy rules: `firebase deploy --only firestore:rules`
3. **Check user role**: Make sure your user document has correct `role` field

### Authentication Issues

**Problem**: Can't sign in with Google.

**Solutions**:
1. **Using emulators**: Firebase Auth emulator doesn't require real Google OAuth
   - Just enter any email when prompted
   - No password needed in emulator mode

2. **Using production Firebase**:
   - Enable Google Sign-In in Firebase Console → Authentication
   - Add `localhost` to authorized domains

### Dashboard Shows "You must be a pastor or admin"

**Problem**: User doesn't have correct role.

**Solution**: Update user role in Firestore:
1. Sign in once to create user document
2. Go to Firestore Console (or emulator UI)
3. Find `users/{your-user-id}`
4. Change `role` field from `guest` to `pastor`
5. Refresh dashboard

### Functions Not Working in Emulator

**Problem**: Cloud Functions return errors.

**Solutions**:
1. Make sure functions are built:
   ```bash
   cd backend/functions
   npm run build
   ```

2. Restart emulators:
   ```bash
   cd backend
   firebase emulators:start
   ```

3. Check function logs in Emulator UI (http://localhost:4000)

---

## 📊 Firebase Emulator UI

When running emulators, access the UI at: **http://localhost:4000**

Features:
- **Authentication**: View test users
- **Firestore**: Browse collections and documents
- **Functions**: View logs and test function calls
- **Storage**: View uploaded files

This is extremely helpful for debugging!

---

## 🚀 Next Steps After Local Testing

Once everything works locally:

1. **Deploy Backend**:
   ```bash
   cd backend
   firebase deploy --only functions,firestore:rules,firestore:indexes,storage
   ```

2. **Deploy Dashboard**:
   ```bash
   firebase deploy --only hosting:dashboard
   ```

3. **Deploy Mobile App**:
   ```bash
   firebase deploy --only hosting:app
   ```

4. **Set Up Production User**:
   - Sign in to production dashboard
   - Update role to `pastor` in Firestore Console
   - Create church in production

5. **Test Production**:
   - Verify dashboard at: `https://church-biblenotelm.firebaseapp.com`
   - Verify mobile app at: `https://app-biblenotelm.firebaseapp.com`

---

## 📝 Testing Checklist Summary

### Dashboard
- [ ] Sign in works
- [ ] Create church
- [ ] Create announcement with image
- [ ] Create event
- [ ] View members
- [ ] View prayer requests

### Mobile App
- [ ] Sign in works
- [ ] Join church with code
- [ ] View announcements
- [ ] View events
- [ ] Submit prayer request
- [ ] Record sermon
- [ ] Read Bible

### Backend
- [ ] Firestore rules allow proper access
- [ ] Cloud Functions respond correctly
- [ ] Storage accepts image uploads
- [ ] Authentication creates user documents

---

**Ready to test!** Start with Option 1 (Vite Preview) for quickest testing, or Option 2 (Firebase Emulators) for full environment testing.
