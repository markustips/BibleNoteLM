# BibleNoteLM Quick Start Guide

Get your BibleNoteLM application up and running in production quickly.

## 🚀 Quick Deployment (30 minutes)

### 1. Firebase Project Setup (5 min)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Navigate to backend directory
cd backend

# Copy and configure .firebaserc
cp .firebaserc.example .firebaserc
# Edit .firebaserc and replace "your-firebase-project-id" with your actual project ID

# Create hosting sites
firebase hosting:sites:create church-biblenotelm
firebase hosting:sites:create app-biblenotelm
```

### 2. Get Firebase Credentials (5 min)

**Get Web App Config:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Project Settings (⚙️)
3. Scroll to "Your apps" → Web app (</> icon)
4. Copy the `firebaseConfig` values

**Get Service Account Key:**
1. Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as `backend/functions/serviceAccountKey.json`

### 3. Configure Environment Variables (5 min)

**Backend:**
```bash
cd backend/functions
cp .env.example .env
# Edit .env with your Firebase project ID and service account email
```

**Dashboard:**
```bash
cd dashboard-admin
cp .env.example .env
# Edit .env with your Firebase config (API key, project ID, etc.)
```

**Mobile App:**
```bash
cd biblenotelm
# Verify .env file has correct Firebase config
```

### 4. Enable Firebase Services (5 min)

In Firebase Console:

1. **Authentication** → Enable Google Sign-In
2. **Firestore Database** → Create database (production mode)
3. **Storage** → Get started

### 5. Deploy Backend (5 min)

```bash
cd backend/functions
npm install
npm run build
cd ..
firebase deploy
```

### 6. Deploy Dashboard (3 min)

```bash
cd dashboard-admin
npm install
npm run build
cd ..
firebase deploy --only hosting:dashboard
```

Access: `https://church-biblenotelm.firebaseapp.com`

### 7. Deploy Mobile App (2 min)

```bash
cd biblenotelm
npm install
npm run build
cd ..
firebase deploy --only hosting:app
```

Access: `https://app-biblenotelm.firebaseapp.com`

---

## ✅ First Login & Setup

### 1. Sign In to Dashboard
1. Go to `https://church-biblenotelm.firebaseapp.com`
2. Click "Sign in with Google"
3. Check Firestore Console → `users/{your-id}` for your user document

### 2. Set Your Role to Pastor

**Option A: Firebase Console (Easy)**
1. Firestore Database → `users` collection
2. Find your user document
3. Edit `role` field → change to `pastor`
4. Save

**Option B: CLI Script**
```bash
cd backend/functions
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.firestore().collection('users').doc('YOUR_USER_ID').update({
  role: 'pastor',
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
}).then(() => console.log('Done')).then(() => process.exit(0));
"
```

### 3. Create Your Church
1. Refresh dashboard (you should now see admin features)
2. Go to Church Settings
3. Create new church with name and details
4. Save the church code displayed

### 4. Test Mobile App
1. Open `https://app-biblenotelm.firebaseapp.com`
2. Sign in with Google
3. Join church using church code from step 3
4. Verify you can see church announcements

---

## 🧪 Quick Test Checklist

- [ ] Dashboard login works
- [ ] User role changed to pastor
- [ ] Church created
- [ ] Create announcement with image
- [ ] Create event
- [ ] Mobile app login works
- [ ] Join church in mobile app
- [ ] View announcements in mobile app
- [ ] Submit prayer request
- [ ] Data appears in Firestore

---

## 📱 Build Android APK (Optional)

```bash
cd biblenotelm

# Sync Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android

# In Android Studio:
# Build → Generate Signed Bundle / APK → APK
# Create keystore (save credentials!)
# Build release APK
```

APK location: `biblenotelm/android/app/build/outputs/apk/release/app-release.apk`

---

## 🐛 Quick Troubleshooting

**Functions won't deploy?**
- Upgrade to Blaze plan in Firebase Console
- Check: `cd backend/functions && npm run build`

**Dashboard 404?**
```bash
firebase hosting:sites:list
firebase deploy --only hosting:dashboard
```

**Authentication fails?**
- Add domain to Firebase Console → Authentication → Settings → Authorized domains

**Firestore permission denied?**
```bash
firebase deploy --only firestore:rules
```

---

## 📚 Full Documentation

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🎯 Production Checklist

- [ ] Firebase project on Blaze plan
- [ ] All environment variables configured
- [ ] Backend functions deployed
- [ ] Firestore rules deployed
- [ ] Storage enabled
- [ ] Dashboard deployed and accessible
- [ ] Mobile app deployed and accessible
- [ ] Google authentication working
- [ ] Test church created
- [ ] At least one announcement created
- [ ] Android APK built and tested (if needed)

---

**You're ready to go!** 🎉

Your BibleNoteLM application is now deployed and ready for testing.
