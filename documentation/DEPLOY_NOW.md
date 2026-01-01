# Deploy BibleNoteLM - Quick Action Steps

**Current Issue**: Need to upgrade to Blaze plan and enable services before deploying.

---

## 🎯 Do These Steps in Order (20 minutes total)

### Step 1: Upgrade to Blaze Plan (5 min)

**URL**: https://console.firebase.google.com/project/biblenotelm-6cf80/usage/details

**Actions**:
1. Click "Modify plan"
2. Select "Blaze (Pay as you go)"
3. Enter credit card info
4. **IMPORTANT**: Set budget alert to $10/month
5. Click "Upgrade"

**Why**: Required for Cloud Functions (our backend)

**Cost**: Free for testing (~$0-5/month for small usage)

📚 Detailed guide: [UPGRADE_TO_BLAZE.md](./UPGRADE_TO_BLAZE.md)

---

### Step 2: Enable Firebase Storage (1 min)

**URL**: https://console.firebase.google.com/project/biblenotelm-6cf80/storage

**Actions**:
1. Click "Get Started"
2. Choose "Production mode"
3. Region: **us-central1**
4. Click "Done"

**Why**: Stores images (announcements, events)

---

### Step 3: Enable Firestore Database (2 min)

**URL**: https://console.firebase.google.com/project/biblenotelm-6cf80/firestore

**Actions**:
1. Click "Create database"
2. Choose "Production mode"
3. Region: **us-central1** (SAME as Storage!)
4. Click "Enable"

**Why**: Stores all app data

---

### Step 4: Enable Authentication (2 min)

**URL**: https://console.firebase.google.com/project/biblenotelm-6cf80/authentication

**Actions**:
1. Click "Get started"
2. Click "Sign-in method" tab
3. Click "Google"
4. Toggle "Enable"
5. Support email: your-email@gmail.com
6. Click "Save"

**Then add authorized domains**:
1. Go to "Settings" tab
2. Add to "Authorized domains":
   - `church-biblenotelm.firebaseapp.com`
   - `app-biblenotelm.firebaseapp.com`

**Why**: Allows Google Sign-In

---

### Step 5: Create Hosting Sites (2 min)

**Open PowerShell/Command Prompt**:

```bash
cd D:\Dev\BibleNoteLm\backend

firebase hosting:sites:create church-biblenotelm
firebase hosting:sites:create app-biblenotelm
```

**Why**: Separate URLs for dashboard and mobile app

---

### Step 6: Deploy! (8 min)

**Run deployment command**:

```bash
cd D:\Dev\BibleNoteLm\backend
firebase deploy
```

**What happens**:
- Uploads Cloud Functions (39 endpoints) - 3 min
- Deploys Firestore rules - 30 sec
- Deploys Storage rules - 30 sec
- Uploads Dashboard - 2 min
- Uploads Mobile App - 2 min

**Total**: ~8 minutes

**Success message**:
```
✔  Deploy complete!

Dashboard: https://church-biblenotelm.firebaseapp.com
Mobile App: https://app-biblenotelm.firebaseapp.com
```

---

## ✅ After Deployment - First Login

### 1. Open Dashboard
```
https://church-biblenotelm.firebaseapp.com
```

### 2. Sign in with Google
Click "Sign in with Google" and use your Google account

### 3. Make Yourself Pastor

**Go to Firestore Console**:
```
https://console.firebase.google.com/project/biblenotelm-6cf80/firestore
```

**Steps**:
1. Click on `users` collection
2. Find your user document (your email)
3. Click to edit
4. Change `role` field from `"guest"` to `"pastor"`
5. Click "Save"

### 4. Refresh Dashboard
Refresh the dashboard page - you should now see:
- Church Settings
- Announcements management
- Events management
- Members list

### 5. Create Your Church
1. Go to "Church Settings"
2. Fill in details:
   - Name: Your Church Name
   - Address: 123 Main St
   - City: Your City
   - etc.
3. Click "Create Church"
4. **Note the church code** displayed (e.g., "ABC123")

### 6. Create First Announcement
1. Go to "Announcements"
2. Click "New Announcement"
3. Title: "Welcome!"
4. Content: "Welcome to our church app!"
5. Priority: High
6. Click "Publish"

### 7. Test Mobile App
```
https://app-biblenotelm.firebaseapp.com
```

1. Sign in with different Google account (or same)
2. Go to "Join Church"
3. Enter church code from step 5
4. Click "Join"
5. You should see the announcement!

---

## 🎉 You're Live!

**Your apps are now running in production:**

- **Dashboard**: https://church-biblenotelm.firebaseapp.com
- **Mobile App**: https://app-biblenotelm.firebaseapp.com
- **Backend**: 39 Cloud Functions deployed
- **Database**: Firestore with security rules
- **Storage**: Enabled for image uploads

---

## 📊 Monitor Usage

**Check your usage anytime**:
```
https://console.firebase.google.com/project/biblenotelm-6cf80/usage/details
```

**Set up budget alerts** (if you haven't):
1. Go to usage page above
2. Click "Budget & alerts"
3. Set budget: $10/month
4. Set alerts at 50%, 75%, 90%
5. Save

---

## 🔧 If Deployment Fails

### "Insufficient permissions"
→ Make sure you're logged in: `firebase login`

### "Hosting sites don't exist"
→ Create them: See Step 5 above

### "Functions deployment timeout"
→ Just wait, it takes 3-5 minutes for functions

### "Build failed"
→ Make sure functions are built:
```bash
cd D:\Dev\BibleNoteLm\backend\functions
npm run build
```

---

## 📚 Helpful Guides

- **Setup Checklist**: [FIREBASE_SETUP_CHECKLIST.md](./FIREBASE_SETUP_CHECKLIST.md)
- **Upgrade Guide**: [UPGRADE_TO_BLAZE.md](./UPGRADE_TO_BLAZE.md)
- **Full Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Quick Start**: [QUICK_START.md](./QUICK_START.md)

---

## 🎯 Quick Checklist

Copy this and check off as you go:

```
Prerequisites:
[ ] Upgrade to Blaze plan
[ ] Set budget alert ($10/month)

Enable Services:
[ ] Enable Firebase Storage
[ ] Enable Firestore Database
[ ] Enable Authentication (Google)
[ ] Create hosting sites

Deploy:
[ ] Run: firebase deploy
[ ] Wait 8 minutes
[ ] Verify success

First Use:
[ ] Sign in to dashboard
[ ] Change role to "pastor" in Firestore
[ ] Create church
[ ] Create announcement
[ ] Test mobile app
[ ] Join church with code
```

---

**Next Action**: Click the link below to start!

👉 https://console.firebase.google.com/project/biblenotelm-6cf80/usage/details

Then follow Steps 1-6 above. You'll be live in 20 minutes! 🚀
