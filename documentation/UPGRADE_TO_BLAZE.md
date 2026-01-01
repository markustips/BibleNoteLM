# Upgrade to Firebase Blaze Plan

## 🚨 Why This Is Required

**Error**: Your project must be on the Blaze (pay-as-you-go) plan

**Why**: Cloud Functions require the Blaze plan. The Spark (free) plan doesn't support serverless functions.

**Good News**: You still get generous free tier limits! Small projects usually stay within free limits.

---

## 💰 Cost Breakdown

### Free Tier (Included Every Month on Blaze Plan):

```
Cloud Functions:
  ✅ 2,000,000 invocations/month (FREE)
  ✅ 400,000 GB-seconds compute (FREE)
  ✅ 200,000 CPU-seconds (FREE)

Firestore:
  ✅ 50,000 reads/day (FREE)
  ✅ 20,000 writes/day (FREE)
  ✅ 20,000 deletes/day (FREE)
  ✅ 1 GB storage (FREE)

Cloud Storage:
  ✅ 5 GB storage (FREE)
  ✅ 1 GB downloads/day (FREE)

Firebase Hosting:
  ✅ 10 GB storage (FREE)
  ✅ 360 MB/day transfer (FREE)
```

### Expected Monthly Cost:

```
For 100 users (light usage):
  - Functions: $0 (within free tier)
  - Firestore: $0 (within free tier)
  - Storage: $0 (within free tier)
  - Hosting: $0 (within free tier)
  Total: $0/month

For 1,000 users (moderate usage):
  - Functions: $3-5
  - Firestore: $1-2
  - Storage: $0.50
  - Hosting: $0
  Total: ~$5-7/month

For 10,000 users (heavy usage):
  - Functions: $30-40
  - Firestore: $10-15
  - Storage: $2-3
  - Hosting: $1
  Total: ~$45-60/month
```

**For testing/development**: You'll likely stay within the FREE tier! 🎉

---

## 🚀 How to Upgrade (5 minutes)

### Step 1: Open Billing Page

Click this link:
```
https://console.firebase.google.com/project/biblenotelm-6cf80/usage/details
```

Or manually:
1. Go to Firebase Console
2. Click on your project: **biblenotelm-6cf80**
3. Click ⚙️ (Settings) → **Usage and billing**
4. Click **Details & settings**

### Step 2: Click "Modify Plan"

Look for the button that says **"Modify plan"** or **"Upgrade project"**

### Step 3: Select Blaze Plan

You'll see three options:
- ❌ Spark Plan (Free) - Current plan
- ✅ **Blaze Plan (Pay as you go)** - SELECT THIS
- ❌ Flame Plan (Fixed) - Not available for all regions

Click on **Blaze Plan**

### Step 4: Enter Billing Information

You'll need to provide:
- Credit card number
- Billing address
- Contact email

**Note**: You won't be charged unless you exceed the free tier!

### Step 5: Set a Budget Alert (IMPORTANT!)

**Protect yourself from unexpected charges:**

1. After upgrading, click **"Set budget"**
2. Set monthly budget: **$10** (or your preferred limit)
3. Set alert threshold: **50%** (you'll get email at $5)
4. Enter notification email
5. Click **"Save"**

This ensures you get notified if costs approach your limit!

### Step 6: Confirm Upgrade

Click **"Upgrade to Blaze"** or **"Continue"**

You'll see a confirmation message that your project is now on Blaze plan.

---

## ✅ After Upgrading

### 1. Verify Blaze Plan is Active

Go to: https://console.firebase.google.com/project/biblenotelm-6cf80/usage/details

You should see:
- Current plan: **Blaze**
- Budget: **$10/month** (or whatever you set)

### 2. Enable Required Services

Now enable these services in Firebase Console:

#### A. Enable Firebase Storage
```
URL: https://console.firebase.google.com/project/biblenotelm-6cf80/storage
Steps:
1. Click "Get Started"
2. Choose "Production mode"
3. Select region: us-central1
4. Click "Done"
```

#### B. Enable Firestore Database (if not already)
```
URL: https://console.firebase.google.com/project/biblenotelm-6cf80/firestore
Steps:
1. Click "Create database"
2. Choose "Production mode"
3. Select region: us-central1 (SAME as Storage!)
4. Click "Enable"
```

#### C. Enable Authentication
```
URL: https://console.firebase.google.com/project/biblenotelm-6cf80/authentication
Steps:
1. Click "Get started"
2. Click "Sign-in method" tab
3. Enable "Google" provider
4. Add support email
5. Click "Save"
```

### 3. Create Hosting Sites

Run these commands:

```bash
cd D:\Dev\BibleNoteLm\backend

firebase hosting:sites:create church-biblenotelm
firebase hosting:sites:create app-biblenotelm
```

### 4. Deploy Everything!

Now you can deploy:

```bash
cd D:\Dev\BibleNoteLm\backend
firebase deploy
```

This will deploy:
- ✅ Cloud Functions (39 endpoints)
- ✅ Firestore Rules & Indexes
- ✅ Storage Rules
- ✅ Hosting (Dashboard + Mobile App)

**Deployment time**: ~5-10 minutes

---

## 📊 Monitor Usage

### View Current Usage

Go to: https://console.firebase.google.com/project/biblenotelm-6cf80/usage/details

You'll see:
- Function invocations
- Firestore reads/writes
- Storage usage
- Hosting bandwidth

### Set Up Notifications

1. Go to billing settings
2. Click "Budget alerts"
3. Add alert at 50%, 75%, 90%, 100%
4. Enter your email
5. Save

You'll get emails when approaching your budget.

---

## 🛡️ Cost Protection Tips

### 1. Set Budget Alerts
**Always set a budget!** This is your safety net.

### 2. Monitor Daily
Check usage dashboard weekly during testing.

### 3. Use Firestore Wisely
- Minimize reads (cache data in frontend)
- Use queries efficiently
- Delete unused data

### 4. Optimize Functions
- Functions are billed by execution time
- Keep functions fast (most are <200ms)
- Our functions are already optimized!

### 5. Test Locally First
- Use emulators for development (FREE!)
- Only deploy to production when ready
- This saves function invocations

---

## 🎯 Quick Checklist

Before deploying, make sure:

- [ ] Upgraded to Blaze plan
- [ ] Set budget alert ($10 recommended)
- [ ] Enabled Firebase Storage
- [ ] Enabled Firestore Database
- [ ] Enabled Authentication (Google)
- [ ] Created hosting sites (church-biblenotelm, app-biblenotelm)
- [ ] Backend functions built (`npm run build`)
- [ ] Dashboard built (`cd dashboard-admin && npm run build`)
- [ ] Mobile app built (`cd biblenotelm && npm run build`)

---

## 🚀 Deploy Command

Once all services are enabled:

```bash
cd D:\Dev\BibleNoteLm\backend
firebase deploy
```

Wait 5-10 minutes for deployment to complete.

You'll see:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/biblenotelm-6cf80/overview
Hosting URL: https://church-biblenotelm.firebaseapp.com
```

---

## 🎉 After Deployment

### Access Your Apps:

**Dashboard (Pastors):**
```
https://church-biblenotelm.firebaseapp.com
```

**Mobile App (Members):**
```
https://app-biblenotelm.firebaseapp.com
```

### Test Everything:

1. Sign in to dashboard with Google
2. Go to Firestore Console
3. Find your user in `users` collection
4. Change `role` to `pastor`
5. Refresh dashboard
6. Create test church
7. Create announcement
8. Test mobile app
9. Join church with code
10. Verify announcement appears

---

## ❓ FAQ

### Q: Will I be charged immediately?
**A**: No. You're only charged for what you use beyond the free tier. For testing, you'll likely stay free!

### Q: What if I exceed my budget?
**A**: You'll get email alerts at 50%, 75%, 90%, 100%. You can then:
- Optimize usage
- Increase budget
- Downgrade features

### Q: Can I downgrade later?
**A**: No. Once on Blaze, you can't go back to Spark. But you can delete the project and start fresh if needed.

### Q: Is there a minimum charge?
**A**: No. If you stay within free tier, you pay $0.

### Q: What happens if I don't set a budget?
**A**: Your card will be charged for actual usage. Budget alerts are optional but HIGHLY recommended!

---

## 🆘 Need Help?

**Firebase Support:**
- Documentation: https://firebase.google.com/docs
- Pricing Calculator: https://firebase.google.com/pricing

**Your Project:**
- Console: https://console.firebase.google.com/project/biblenotelm-6cf80
- Usage: https://console.firebase.google.com/project/biblenotelm-6cf80/usage/details

---

## 📞 Next Steps

1. **Upgrade to Blaze** → https://console.firebase.google.com/project/biblenotelm-6cf80/usage/details
2. **Set budget alert** → $10/month
3. **Enable Storage** → https://console.firebase.google.com/project/biblenotelm-6cf80/storage
4. **Enable Firestore** → https://console.firebase.google.com/project/biblenotelm-6cf80/firestore
5. **Enable Auth** → https://console.firebase.google.com/project/biblenotelm-6cf80/authentication
6. **Create hosting sites** → `firebase hosting:sites:create`
7. **Deploy** → `firebase deploy`

**Total time**: ~20 minutes
**Expected cost for testing**: $0-5/month

---

**You're almost there!** Just upgrade to Blaze, enable the services, and deploy. Your app will be live in 20 minutes! 🚀
