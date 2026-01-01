# BibleNoteLM Deployment Guide

This guide walks you through deploying the BibleNoteLM application to Firebase, including the church dashboard, mobile/web app, and backend services.

## Architecture Overview

```
Production Deployment:
├── Dashboard (Firebase Hosting)
│   URL: church-biblenotelm.firebaseapp.com
│   Source: /dashboard-admin
│   Users: Church pastors and admins only
│
├── Mobile/Web App (Firebase Hosting + APK)
│   URL: app-biblenotelm.firebaseapp.com
│   Source: /biblenotelm
│   Users: Church members and public
│
└── Backend (Firebase)
    ├── Cloud Functions (30+ endpoints)
    ├── Cloud Firestore (database)
    ├── Firebase Auth (Google Sign-In)
    └── Cloud Storage (image uploads)
```

---

## Prerequisites

- Node.js 22+ installed
- Firebase CLI installed: `npm install -g firebase-tools`
- Access to your Firebase project
- Firebase project upgraded to Blaze plan (required for Cloud Functions)

---

## Step 1: Firebase Project Setup

### 1.1 Login to Firebase CLI

```bash
firebase login
```

### 1.2 Get Your Firebase Project Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings (⚙️ icon)
4. Scroll down to "Your apps" section
5. Click "Web app" (</> icon)
6. Copy the `firebaseConfig` object values

### 1.3 Create `.firebaserc` File

Copy the example file and update with your project ID:

```bash
cd backend
cp .firebaserc.example .firebaserc
```

Edit `.firebaserc` and replace `your-firebase-project-id` with your actual Firebase project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  },
  "targets": {
    "your-actual-project-id": {
      "hosting": {
        "dashboard": ["church-biblenotelm"],
        "app": ["app-biblenotelm"]
      }
    }
  }
}
```

### 1.4 Create Hosting Sites

Create two separate hosting sites for dashboard and mobile app:

```bash
cd backend
firebase hosting:sites:create church-biblenotelm
firebase hosting:sites:create app-biblenotelm
```

---

## Step 2: Configure Environment Variables

### 2.1 Backend Environment Variables

Create service account key:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file as `backend/functions/serviceAccountKey.json`
4. **Add to `.gitignore`** (already included)

Create `.env` file for backend functions:

```bash
cd backend/functions
cp .env.example .env
```

Edit `backend/functions/.env` with your values:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Optional: Stripe for subscriptions (if needed)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 2.2 Dashboard Environment Variables

```bash
cd dashboard-admin
cp .env.example .env
```

Edit `dashboard-admin/.env` with your Firebase config:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxx
```

### 2.3 Mobile App Environment Variables

The mobile app already has `.env` file. Verify it has all required values:

```bash
cd biblenotelm
cat .env
```

Update if needed with your Firebase credentials.

---

## Step 3: Enable Firebase Services

### 3.1 Enable Authentication

1. Go to Firebase Console → Authentication
2. Click "Get started"
3. Enable "Google" sign-in provider
4. Add authorized domains:
   - `localhost` (for local testing)
   - `your-project.firebaseapp.com`
   - `church-biblenotelm.firebaseapp.com`
   - `app-biblenotelm.firebaseapp.com`

### 3.2 Create Firestore Database

1. Go to Firebase Console → Firestore Database
2. Click "Create database"
3. Choose production mode
4. Select closest location (e.g., `us-central1`)

### 3.3 Enable Cloud Storage

1. Go to Firebase Console → Storage
2. Click "Get started"
3. Use same location as Firestore
4. Security rules will be deployed automatically

---

## Step 4: Deploy Backend Services

### 4.1 Build Cloud Functions

```bash
cd backend/functions
npm install
npm run build
```

Verify build succeeded (check `lib/` directory).

### 4.2 Deploy All Backend Services

```bash
cd backend

# Deploy everything at once
firebase deploy

# Or deploy individually:
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
```

### 4.3 Verify Functions Deployment

```bash
firebase functions:list
```

You should see 30+ functions listed.

---

## Step 5: Deploy Dashboard

### 5.1 Install Dependencies

```bash
cd dashboard-admin
npm install
```

### 5.2 Build Production Bundle

```bash
npm run build
```

This creates optimized files in `dashboard-admin/dist/`.

### 5.3 Test Locally (Optional)

```bash
npm run preview
# Or use Firebase emulator:
firebase serve --only hosting:dashboard
```

### 5.4 Deploy to Firebase Hosting

```bash
cd ..  # Back to root
firebase deploy --only hosting:dashboard
```

### 5.5 Access Dashboard

Your dashboard is now live at:
- `https://church-biblenotelm.firebaseapp.com`

---

## Step 6: Deploy Mobile/Web App

### 6.1 Build Web Version

```bash
cd biblenotelm
npm install
npm run build
```

### 6.2 Deploy to Firebase Hosting

```bash
cd ..  # Back to root
firebase deploy --only hosting:app
```

### 6.3 Access Web App

Your mobile app web version is now live at:
- `https://app-biblenotelm.firebaseapp.com`

---

## Step 7: Build Android APK

### 7.1 Sync Capacitor

```bash
cd biblenotelm
npx cap sync android
```

### 7.2 Open in Android Studio

```bash
npx cap open android
```

### 7.3 Build Release APK

In Android Studio:

1. Go to **Build → Generate Signed Bundle / APK**
2. Choose **APK**
3. Create new keystore or use existing:
   - **Keystore path**: `biblenotelm/android/my-release-key.keystore`
   - **Keystore password**: (create secure password)
   - **Key alias**: `biblenotelm-key`
   - **Key password**: (create secure password)
4. Click **Next → Finish**

### 7.4 Locate APK

Find your signed APK at:
```
biblenotelm/android/app/build/outputs/apk/release/app-release.apk
```

### 7.5 Test APK

Transfer APK to Android device and install (enable "Unknown sources" in settings).

---

## Step 8: Testing & Verification

### 8.1 Test Authentication

1. Open dashboard: `https://church-biblenotelm.firebaseapp.com`
2. Click "Sign in with Google"
3. Verify user document created in Firestore: `users/{userId}`

### 8.2 Set User Role to Pastor

**Option 1: Firebase Console**
1. Go to Firestore Database
2. Find user document: `users/{userId}`
3. Edit `role` field → change to `pastor`
4. Save

**Option 2: Firebase CLI Script**
```bash
cd backend/functions
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.firestore().collection('users').doc('YOUR_USER_ID_HERE').update({
  role: 'pastor',
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
}).then(() => {
  console.log('User role updated to pastor');
  process.exit(0);
});
"
```

### 8.3 Create Test Church

1. Sign in to dashboard as pastor
2. Go to Church Settings
3. Create new church with name and details
4. Note the church code for testing

### 8.4 Test Dashboard Features

- ✅ Create announcement with image
- ✅ Create event
- ✅ View church members
- ✅ View prayer requests
- ✅ Edit/delete announcements

### 8.5 Test Mobile App

1. Open mobile app
2. Sign in with Google
3. Join church using church code
4. Verify announcements appear
5. Submit prayer request
6. Create sermon recording
7. Read Bible passages
8. Take notes

### 8.6 Verify Data in Firestore

Check collections:
- `users/` - User profiles
- `churches/` - Church data
- `announcements/` - Announcements
- `events/` - Events
- `prayers/` - Prayer requests
- `sermons/` - Sermon recordings

---

## Step 9: Custom Domain Setup (Optional)

### 9.1 Add Custom Domains

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Add domains:
   - `church.biblenotelm.com` (dashboard)
   - `app.biblenotelm.com` (mobile/web app)

### 9.2 Update DNS Records

Add A/AAAA records provided by Firebase to your DNS provider:

```
Type: A
Name: church
Value: [Firebase IP addresses shown in console]

Type: A
Name: app
Value: [Firebase IP addresses shown in console]
```

### 9.3 Wait for SSL Certificate

Firebase auto-provisions SSL certificates. Wait 24-48 hours for DNS propagation and certificate issuance.

---

## Troubleshooting

### Functions Deployment Fails

**Error**: "Billing account not configured"
- **Solution**: Upgrade to Blaze plan in Firebase Console

**Error**: "Build failed"
```bash
cd backend/functions
npm run build  # Check for TypeScript errors
```

### Dashboard Not Loading

**Error**: "Firebase config not found"
- **Solution**: Verify `.env` file exists and has correct values
- Check browser console for errors

**Error**: 404 Not Found
- **Solution**: Verify hosting deployed:
  ```bash
  firebase hosting:sites:list
  firebase deploy --only hosting:dashboard
  ```

### Authentication Issues

**Error**: "Unauthorized domain"
- **Solution**: Add domain to Firebase Console → Authentication → Settings → Authorized domains

### Firestore Permission Denied

**Error**: "Missing or insufficient permissions"
- **Solution**: Deploy Firestore rules:
  ```bash
  firebase deploy --only firestore:rules
  ```
- Verify user has correct role in Firestore

### APK Won't Install

**Error**: "App not installed"
- **Solution**: Enable "Install unknown apps" in Android settings
- Verify APK is signed correctly
- Check minimum SDK version (Android 5.0+)

---

## Deployment Checklist

### Backend:
- [x] Firebase project created and Blaze plan enabled
- [x] `.firebaserc` configured with project ID
- [x] Service account key downloaded
- [x] Environment variables configured (`.env`)
- [x] Functions built: `npm run build`
- [x] All services deployed: `firebase deploy`
- [x] Google Sign-In enabled in Authentication
- [x] Firestore database created
- [x] Cloud Storage enabled

### Dashboard:
- [x] Created `/dashboard-admin` directory
- [x] Firebase config in `.env`
- [x] Dependencies installed: `npm install`
- [x] Production build: `npm run build`
- [x] Deployed: `firebase deploy --only hosting:dashboard`
- [x] Tested at: `https://church-biblenotelm.firebaseapp.com`

### Mobile App:
- [x] Dashboard removed from mobile app codebase
- [x] Firebase config in `.env`
- [x] Dependencies installed: `npm install`
- [x] Web build: `npm run build`
- [x] Deployed: `firebase deploy --only hosting:app`
- [x] Android APK built and signed
- [x] Tested on Android device

### Testing:
- [ ] Google Sign-In working on dashboard
- [ ] Google Sign-In working on mobile app
- [ ] User document created in Firestore
- [ ] User role set to 'pastor'
- [ ] Test church created
- [ ] Create/edit/delete announcements
- [ ] Upload images to announcements
- [ ] Create/manage events
- [ ] Submit prayer requests
- [ ] Verify data in Firestore
- [ ] Test mobile app on Android

---

## Estimated Costs (Firebase Blaze Plan)

### Free Tier (Included Monthly):
- Cloud Functions: 2M invocations
- Firestore: 50K reads, 20K writes, 20K deletes per day
- Storage: 5GB
- Hosting: 10GB transfer
- Authentication: Unlimited

### Expected Cost (100 test users):
- Cloud Functions: $0 (within free tier)
- Firestore: $0-5 (minimal usage)
- Storage: $0.13 (5MB images)
- Hosting: $0 (within free tier)
- **Total: ~$5/month or less**

---

## Next Steps After Deployment

1. **Test All Features** - Follow testing checklist above
2. **Invite Test Users** - Share church code with beta testers
3. **Monitor Performance** - Check Firebase Console logs and usage
4. **Gather Feedback** - Note bugs and feature requests
5. **Prepare for Play Store** - Create store listing, screenshots, privacy policy

---

## Support

For issues or questions:
- Check Firebase Console logs: `firebase functions:log`
- Review Firestore security rules
- Verify environment variables are correct
- Check browser console for client-side errors

---

## Quick Commands Reference

```bash
# Backend deployment
cd backend
npm run build
firebase deploy

# Dashboard deployment
cd dashboard-admin
npm run build
cd ..
firebase deploy --only hosting:dashboard

# Mobile app deployment
cd biblenotelm
npm run build
cd ..
firebase deploy --only hosting:app

# View logs
firebase functions:log

# List deployed functions
firebase functions:list

# Serve locally for testing
firebase emulators:start
```

---

**Deployment Complete!** Your BibleNoteLM application is now live on Firebase with separate dashboard and mobile app deployments.
