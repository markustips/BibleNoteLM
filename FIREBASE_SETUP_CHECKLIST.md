# Firebase Console Setup Checklist

Before deploying, you need to enable certain Firebase services in the Firebase Console.

---

## 🚨 Current Issue

**Error**: Firebase Storage not enabled
**Solution**: Enable it in Firebase Console (instructions below)

---

## ✅ Required Firebase Services

### 1. Firebase Storage (REQUIRED - Currently Missing!)

**What it's for**: Stores uploaded images (announcements, events, church logos)

**How to enable**:
1. Go to: https://console.firebase.google.com/project/biblenotelm-6cf80/storage
2. Click **"Get Started"**
3. Choose **"Start in production mode"**
4. Select region: **us-central1** (or closest to you)
5. Click **"Done"**

**Time**: 30 seconds

---

### 2. Cloud Firestore (Database)

**What it's for**: Stores all app data (users, churches, announcements, etc.)

**How to enable**:
1. Go to: https://console.firebase.google.com/project/biblenotelm-6cf80/firestore
2. Click **"Create database"**
3. Choose **"Start in production mode"**
4. Select region: **us-central1** (same as Storage)
5. Click **"Enable"**

**Time**: 1 minute

---

### 3. Authentication (Google Sign-In)

**What it's for**: User login with Google accounts

**How to enable**:
1. Go to: https://console.firebase.google.com/project/biblenotelm-6cf80/authentication
2. Click **"Get started"**
3. Click **"Sign-in method"** tab
4. Click on **"Google"**
5. Toggle **"Enable"**
6. Enter support email (your email)
7. Click **"Save"**

**Add authorized domains**:
1. Go to **"Settings"** tab in Authentication
2. Scroll to **"Authorized domains"**
3. Add these domains:
   - `localhost` (already there)
   - `church-biblenotelm.firebaseapp.com`
   - `app-biblenotelm.firebaseapp.com`

**Time**: 2 minutes

---

### 4. Cloud Functions (Blaze Plan Required)

**What it's for**: Backend API (39 serverless functions)

**How to enable**:
1. Go to: https://console.firebase.google.com/project/biblenotelm-6cf80/settings/billing
2. Click **"Modify plan"**
3. Select **"Blaze (Pay as you go)"**
4. Enter billing info (credit card)
5. **Set budget alert**: $10/month (recommended)

**Expected cost**: $5-10/month for testing, mostly free tier

**Time**: 3 minutes

---

## 🎯 Quick Setup Order

**Do these in order** (takes about 10 minutes total):

```
1. ✅ Upgrade to Blaze Plan (3 min)
   └─> Required for Cloud Functions

2. ✅ Enable Firestore Database (1 min)
   └─> Required for all data storage

3. ✅ Enable Firebase Storage (30 sec)
   └─> Required for image uploads

4. ✅ Enable Authentication (2 min)
   └─> Required for Google Sign-In

5. ✅ Create Hosting Sites (2 min)
   └─> Required for dashboard and mobile app

6. ✅ Deploy! (5 min)
   └─> Run: firebase deploy
```

**Total time**: ~15 minutes

---

## 📝 Step-by-Step: Enable Storage (Fix Current Error)

Since this is blocking your deployment, do this first:

### Step 1: Open Firebase Console
```
https://console.firebase.google.com/project/biblenotelm-6cf80/storage
```

### Step 2: Click "Get Started"
You'll see a modal with storage options.

### Step 3: Choose "Start in production mode"
- Select this option (we'll deploy security rules after)

### Step 4: Select Location
- Choose: **us-central1 (Iowa)** or your preferred region
- **Important**: Use the SAME region as your Firestore database

### Step 5: Click "Done"
Storage will be enabled in a few seconds.

### Step 6: Verify Storage is Ready
You should see the Storage page with:
- Files tab (empty)
- Rules tab
- Usage tab

---

## 🚀 Deploy After Enabling Storage

Once Storage is enabled, run:

```bash
cd D:\Dev\BibleNoteLm\backend
firebase deploy
```

This will deploy:
- ✅ Cloud Functions (39 endpoints)
- ✅ Firestore Rules (security)
- ✅ Firestore Indexes (performance)
- ✅ Storage Rules (security)
- ✅ Hosting (dashboard + mobile app)

---

## 🔧 Alternative: Deploy Without Storage (Temporary)

If you want to deploy right now without enabling Storage:

```bash
cd D:\Dev\BibleNoteLm\backend
firebase deploy --except storage
```

This deploys everything EXCEPT storage. You can enable storage later.

**Note**: Image uploads won't work until you enable Storage.

---

## ✅ Full Checklist

Before running `firebase deploy`, make sure:

### Billing:
- [ ] Upgraded to Blaze plan
- [ ] Set budget alert ($10 recommended)

### Services:
- [ ] Firestore Database created
- [ ] Firebase Storage enabled ⚠️ **Currently missing!**
- [ ] Authentication enabled (Google provider)

### Hosting:
- [ ] Created hosting site: `church-biblenotelm`
- [ ] Created hosting site: `app-biblenotelm`
- [ ] Configured targets in `.firebaserc`

### Configuration:
- [ ] `.firebaserc` has project ID
- [ ] `firebase.json` configured
- [ ] Backend functions built (`npm run build`)
- [ ] Dashboard built (`npm run build`)
- [ ] Mobile app built (`npm run build`)

---

## 🎯 What to Do Right Now

### Option 1: Enable Storage (Recommended)

1. Go to: https://console.firebase.google.com/project/biblenotelm-6cf80/storage
2. Click "Get Started"
3. Choose "Production mode"
4. Select region: us-central1
5. Click "Done"
6. Run: `firebase deploy`

**Time**: 2 minutes

### Option 2: Deploy Without Storage (Quick Test)

```bash
cd D:\Dev\BibleNoteLm\backend
firebase deploy --except storage
```

**Note**: Image uploads will fail until you enable Storage.

---

## 📊 After Deployment

Once deployment succeeds, you'll see:

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/biblenotelm-6cf80/overview
Hosting URL: https://church-biblenotelm.firebaseapp.com
```

### Test URLs:
- Dashboard: https://church-biblenotelm.firebaseapp.com
- Mobile App: https://app-biblenotelm.firebaseapp.com

### Next Steps:
1. Sign in to dashboard
2. Go to Firestore Console
3. Find your user in `users` collection
4. Change `role` to `pastor`
5. Create test church
6. Test all features!

---

## 🆘 Need Help?

### Common Issues:

**"Billing account not configured"**
→ Upgrade to Blaze plan in Firebase Console

**"Insufficient permissions"**
→ Make sure you're logged in: `firebase login`

**"Hosting sites don't exist"**
→ Create them:
```bash
firebase hosting:sites:create church-biblenotelm
firebase hosting:sites:create app-biblenotelm
```

**"Functions deployment failed"**
→ Check Node version: `node --version` (should be 22.x)

---

## 📞 Support

- Firebase Console: https://console.firebase.google.com/project/biblenotelm-6cf80
- Documentation: See DEPLOYMENT.md
- Quick Start: See QUICK_START.md

---

**Next Action**: Enable Firebase Storage, then run `firebase deploy` again! 🚀
