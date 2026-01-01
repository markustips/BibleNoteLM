# Enable Required Firebase Services

## 🚨 Current Status

You've upgraded to Blaze plan ✅, but deployment failed because some services aren't enabled yet.

---

## ✅ Services You Need to Enable (5 minutes total)

### 1. Firestore Database (2 minutes) - REQUIRED

**URL**: https://console.firebase.google.com/project/biblenotelm-6cf80/firestore

**Steps**:
1. Click **"Create database"**
2. Choose **"Start in production mode"**
3. Select location: **us-central1 (Iowa)** or closest to you
4. Click **"Enable"**
5. Wait ~30 seconds for database to be created

**Why needed**: Stores all your app data (users, churches, announcements, events, prayers)

---

### 2. Firebase Storage (30 seconds) - REQUIRED

**URL**: https://console.firebase.google.com/project/biblenotelm-6cf80/storage

**Steps**:
1. Click **"Get Started"**
2. Choose **"Start in production mode"**
3. Select location: **us-central1** (SAME as Firestore!)
4. Click **"Done"**

**Why needed**: Stores uploaded images (announcements, events, church logos)

---

### 3. Authentication (2 minutes) - REQUIRED

**URL**: https://console.firebase.google.com/project/biblenotelm-6cf80/authentication

**Steps**:
1. Click **"Get started"**
2. Click **"Sign-in method"** tab
3. Click **"Google"** in the providers list
4. Toggle to **"Enable"**
5. Enter your support email (your Gmail)
6. Click **"Save"**

**Then add authorized domains**:
1. Click **"Settings"** tab at the top
2. Scroll to **"Authorized domains"**
3. Click **"Add domain"** and add:
   - `church-biblenotelm.firebaseapp.com`
   - `app-biblenotelm.firebaseapp.com`

**Why needed**: Allows users to sign in with Google accounts

---

## 🎯 After Enabling All Services

Once you've enabled all three services above, come back and run:

```bash
cd D:\Dev\BibleNoteLm\backend
firebase deploy
```

---

## 📋 Quick Checklist

Before deploying, verify:

- [ ] ✅ Upgraded to Blaze plan (DONE)
- [ ] ⏳ Firestore Database created
- [ ] ⏳ Firebase Storage enabled
- [ ] ⏳ Authentication enabled (Google provider)

Once all checked, deployment will succeed!

---

## 🆘 If You See Errors

### "Database not found"
→ Create Firestore database (Step 1 above)

### "Storage not set up"
→ Enable Firebase Storage (Step 2 above)

### "Authentication not configured"
→ Enable Authentication (Step 3 above)

### "Deployment timeout"
→ Wait a minute after enabling services, then try again

---

## ⏭️ Next Steps

1. **Enable all 3 services** (links above) - 5 minutes
2. **Run deployment again**: `firebase deploy`
3. **Wait 5-10 minutes** for deployment to complete
4. **Access your apps**:
   - Dashboard: https://church-biblenotelm.firebaseapp.com
   - Mobile App: https://app-biblenotelm.firebaseapp.com

---

**Start here**: https://console.firebase.google.com/project/biblenotelm-6cf80/firestore

Enable Firestore first, then Storage, then Authentication. Then deploy! 🚀
