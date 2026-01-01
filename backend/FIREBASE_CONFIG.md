# Firebase Project Configuration

This document contains the exact Firebase configuration needed for BibleNoteLM.

## 🔧 Firebase Console Setup

### 1. Create Project
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Project name: `BibleNoteLM` (or your choice)
4. Project ID: Will be auto-generated (e.g., `biblenotelm-abc123`)
5. Enable Google Analytics: **Yes** (recommended)
6. Click "Create project"

### 2. Upgrade to Blaze Plan
- Required for Cloud Functions
- Click "Upgrade" in sidebar
- Select "Blaze (Pay as you go)"
- Add payment method
- Set budget alert: $50/month (recommended)

---

## 🔐 Authentication Configuration

### Enable Sign-In Methods
Navigate to: **Authentication** → **Sign-in method**

Enable these providers:

#### Email/Password
```
Status: Enabled
Email link (passwordless sign-in): Disabled (optional)
Email enumeration protection: Enabled
```

#### Google
```
Status: Enabled
Project support email: your-email@gmail.com
Project public-facing name: BibleNoteLM
```

### Authorized Domains
Add these domains:
```
localhost (already added for development)
your-domain.com (your production domain)
your-project-id.firebaseapp.com (auto-added)
```

---

## 💾 Firestore Database Configuration

### Create Database
Navigate to: **Firestore Database** → **Create database**

```
Mode: Production mode
Location: Choose closest to your users
  - North America: us-central1 (Iowa)
  - Europe: europe-west1 (Belgium)
  - Asia: asia-southeast1 (Singapore)
```

### Deploy Security Rules

From command line:
```bash
cd backend
firebase deploy --only firestore:rules
```

Or manually in Console:
1. Go to **Firestore Database** → **Rules**
2. Copy content from `backend/firestore.rules`
3. Click "Publish"

### Deploy Indexes

From command line:
```bash
cd backend
firebase deploy --only firestore:indexes
```

Required indexes (from `firestore.indexes.json`):
```json
{
  "indexes": [
    {
      "collectionGroup": "announcements",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "churchId", "order": "ASCENDING" },
        { "fieldPath": "isPublished", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "churchId", "order": "ASCENDING" },
        { "fieldPath": "isPublished", "order": "ASCENDING" },
        { "fieldPath": "startDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "prayers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "visibility", "order": "ASCENDING" },
        { "fieldPath": "churchId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## ☁️ Cloud Functions Configuration

### Node.js Runtime
```
Runtime: Node.js 20
Memory: 256 MB (default)
Timeout: 60s (default)
Region: us-central1 (or match your Firestore region)
```

### Environment Variables

Set these using Firebase Functions config:

```bash
# Set Stripe configuration
firebase functions:config:set stripe.secret_key="sk_live_your_key_here"
firebase functions:config:set stripe.webhook_secret="whsec_your_webhook_secret"
firebase functions:config:set stripe.price_id_basic="price_your_basic_id"
firebase functions:config:set stripe.price_id_premium="price_your_premium_id"

# Set app configuration
firebase functions:config:set app.name="BibleNoteLM"
firebase functions:config:set app.support_email="support@biblenotelm.com"

# View current config
firebase functions:config:get
```

Or use `.env` file for local development (already configured).

### Deploy Functions

```bash
cd backend
firebase deploy --only functions
```

### Verify Deployment

Check the Functions tab in Firebase Console. You should see:

**Authentication Triggers:**
- onUserCreate
- onUserDelete
- updateLastLogin
- updateFcmToken
- removeFcmToken

**Church Management:**
- createChurch
- updateChurch
- getChurch
- getChurchMembers
- joinChurch
- leaveChurch

**Announcements:**
- createAnnouncement
- updateAnnouncement
- deleteAnnouncement
- getChurchAnnouncements
- getAnnouncement

**Events:**
- createEvent
- updateEvent
- deleteEvent
- getChurchEvents
- getEvent
- registerForEvent
- cancelEventRegistration
- getEventAttendees

**Prayers:**
- createPrayer
- updatePrayer
- deletePrayer
- getPrayers
- getPrayer
- prayForRequest
- getPrayingUsers

**Subscriptions:**
- createSubscription
- cancelSubscription
- getSubscriptionStatus
- stripeWebhook
- getAllSubscriptions

**Admin/Analytics:**
- getSystemStats
- getChurchList
- getRevenueAnalytics
- getUserGrowthAnalytics
- getChurchActivities
- getMemberData
- getSermonContent

**Scheduled:**
- dailyCleanup
- weeklyAnalytics
- dailyPaymentReminders

---

## 📦 Cloud Storage (Optional)

### Create Storage Bucket
Navigate to: **Storage** → **Get started**

```
Mode: Production mode
Location: Same as Firestore (important!)
```

### Storage Rules (if using)
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /churches/{churchId}/{allPaths=**} {
      allow read: if request.auth != null &&
                    request.auth.token.churchId == churchId;
      allow write: if request.auth != null &&
                     request.auth.token.churchId == churchId &&
                     request.auth.token.role in ['pastor', 'admin'];
    }

    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null &&
                           request.auth.uid == userId;
    }
  }
}
```

---

## 📱 Android App Setup

### Register Android App
Navigate to: **Project Overview** → **Add app** → **Android**

```
Android package name: com.yourcompany.biblenotelm
  (Must match android/app/build.gradle → applicationId)

App nickname: BibleNoteLM Android

Debug signing certificate SHA-1:
  Get from: cd android && ./gradlew signingReport
  Example: 1A:2B:3C:4D:... (40 hex digits)

Release signing certificate SHA-1:
  Get from: keytool -list -v -keystore release.jks
  Example: 5E:6F:7G:8H:... (40 hex digits)
```

### Download google-services.json

1. Download the file
2. Place it in: `android/app/google-services.json`
3. Verify it contains:
   ```json
   {
     "project_info": {
       "project_number": "123456789",
       "project_id": "biblenotelm-abc123",
       ...
     },
     "client": [
       {
         "client_info": {
           "mobilesdk_app_id": "1:123456789:android:...",
           "android_client_info": {
             "package_name": "com.yourcompany.biblenotelm"
           }
         }
       }
     ]
   }
   ```

---

## 🔔 Cloud Messaging (Push Notifications)

### Enable Firebase Cloud Messaging
Navigate to: **Cloud Messaging** → **Get started**

### Server Key (Legacy)
```
Status: Enabled (if needed for React Native)
Server key: Available in project settings
```

### Android Configuration
No additional setup needed - included in `google-services.json`

### iOS Configuration (Future)
Will need APNs certificate upload

---

## 📊 Analytics Configuration

### Enable Google Analytics
Should be enabled during project creation

### Data Streams
Navigate to: **Analytics** → **Data streams**

```
Android App: Automatically configured
Web (optional): Add if you have a web app
iOS (future): Add when iOS app is ready
```

### Events to Track
```
- user_signup
- church_created
- church_joined
- announcement_created
- event_created
- prayer_created
- subscription_started
- subscription_cancelled
```

---

## 💳 Stripe Integration

### Stripe Dashboard Setup

1. Create account: https://dashboard.stripe.com/register
2. Activate account (provide business details)
3. Create products:

**Basic Subscription**
```
Name: BibleNoteLM Basic
Description: Advanced features for growing churches
Pricing: $9.99/month (or your price)
Billing period: Monthly
Price ID: price_abc123... (copy this!)
```

**Premium Subscription**
```
Name: BibleNoteLM Premium
Description: Everything you need for a thriving church
Pricing: $29.99/month (or your price)
Billing period: Monthly
Price ID: price_def456... (copy this!)
```

### Configure Webhook

Navigate to: **Developers** → **Webhooks** → **Add endpoint**

```
Endpoint URL: https://us-central1-YOUR_PROJECT.cloudfunctions.net/stripeWebhook
Description: BibleNoteLM Webhook
Version: Latest API version

Events to listen to:
✓ customer.subscription.created
✓ customer.subscription.updated
✓ customer.subscription.deleted
✓ invoice.payment_succeeded
✓ invoice.payment_failed
✓ payment_intent.succeeded
✓ payment_intent.payment_failed

Signing secret: whsec_abc123... (copy this!)
```

### API Keys

Navigate to: **Developers** → **API keys**

```
Publishable key: pk_live_abc123... (for mobile app)
Secret key: sk_live_def456... (for backend .env)

⚠️ Keep secret key secure! Never commit to git!
```

---

## 🔒 Security Configuration

### Google Cloud Console

Navigate to: https://console.cloud.google.com/

Select your Firebase project

### API Restrictions

Navigate to: **APIs & Services** → **Credentials**

For each API key, add restrictions:

**Android Key:**
```
Application restrictions: Android apps
  Add: com.yourcompany.biblenotelm
  SHA-1: [Your release SHA-1]

API restrictions: Restrict key
  ✓ Cloud Firestore API
  ✓ Firebase Authentication API
  ✓ Cloud Functions API
  ✓ Firebase Cloud Messaging API
```

**Browser Key (if web app):**
```
Application restrictions: HTTP referrers
  Add: your-domain.com/*
  Add: *.firebaseapp.com/*

API restrictions: Restrict key
  ✓ Cloud Firestore API
  ✓ Firebase Authentication API
```

### Service Account

Navigate to: **IAM & Admin** → **Service Accounts**

```
Default service account: Already created
Email: YOUR_PROJECT@appspot.gserviceaccount.com
Roles: Firebase Admin SDK Administrator Service Agent

⚠️ Never download or share service account keys!
```

---

## 📈 Monitoring & Alerts

### Budget Alerts

Navigate to: **Billing** → **Budgets & alerts**

```
Name: BibleNoteLM Monthly Budget
Budget amount: $50.00 (adjust as needed)
Time range: Monthly
Alert thresholds: 50%, 90%, 100%
Email recipients: your-email@gmail.com
```

### Error Reporting

Navigate to: **Cloud Console** → **Error Reporting**

```
Notifications: Enabled
Email: your-email@gmail.com
```

### Uptime Monitoring (Optional)

Use external service like:
- UptimeRobot (free)
- Pingdom
- StatusCake

Monitor URL: https://YOUR_PROJECT.firebaseapp.com/

---

## ✅ Verification Checklist

After completing all configuration:

- [ ] Firebase project created
- [ ] Upgraded to Blaze plan
- [ ] Budget alerts set up
- [ ] Authentication providers enabled
- [ ] Firestore database created
- [ ] Security rules deployed
- [ ] Indexes deployed
- [ ] Cloud Functions deployed (all 40+ functions)
- [ ] Environment variables configured
- [ ] Android app registered
- [ ] google-services.json downloaded and placed
- [ ] SHA-1 certificates added
- [ ] Stripe account created
- [ ] Stripe products created
- [ ] Stripe webhook configured
- [ ] API keys restricted
- [ ] Monitoring enabled
- [ ] All functions tested in production

---

## 🆘 Troubleshooting

### "Permission denied" in Firestore
- Redeploy security rules: `firebase deploy --only firestore:rules`
- Check user is authenticated
- Verify user has correct role

### Functions not deploying
- Check Node.js version: `node --version` (should be 18 or 20)
- Build first: `cd functions && npm run build`
- Check for TypeScript errors

### Can't connect from mobile app
- Verify package name matches exactly
- Check google-services.json is in correct location
- Rebuild app after adding google-services.json

### Stripe webhook not working
- Check webhook URL is correct (include https://)
- Verify webhook secret in environment variables
- Check webhook signing secret matches

---

## 📞 Support Resources

- Firebase Docs: https://firebase.google.com/docs
- Firebase Console: https://console.firebase.google.com/
- Stripe Docs: https://stripe.com/docs
- Stripe Dashboard: https://dashboard.stripe.com/

---

**Configuration complete! Your Firebase project is ready for production.** 🚀
