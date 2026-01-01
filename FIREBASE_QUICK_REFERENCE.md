# Firebase Quick Reference Guide

Quick commands and tips for working with Firebase in BibleNoteLM.

## Initial Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Select your project
firebase use your-project-id

# Or use the setup script (Windows)
cd backend
scripts\setup-firebase.bat
```

---

## Deployment Commands

### Deploy Everything
```bash
cd backend
firebase deploy
```

### Deploy Only Functions
```bash
firebase deploy --only functions
```

### Deploy Specific Functions
```bash
# Announcements
firebase deploy --only functions:createAnnouncement,functions:updateAnnouncement,functions:deleteAnnouncement,functions:getChurchAnnouncements,functions:getAnnouncement

# Events
firebase deploy --only functions:createEvent,functions:updateEvent,functions:deleteEvent,functions:getChurchEvents,functions:getEvent,functions:registerForEvent,functions:cancelEventRegistration,functions:getEventAttendees

# Prayers
firebase deploy --only functions:createPrayer,functions:updatePrayer,functions:deletePrayer,functions:getPrayers,functions:getPrayer,functions:prayForRequest,functions:getPrayingUsers

# Church Management
firebase deploy --only functions:createChurch,functions:updateChurch,functions:getChurch,functions:joinChurch,functions:leaveChurch,functions:getChurchMembers
```

### Deploy Only Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Deploy Only Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

---

## Monitoring & Debugging

### View Logs
```bash
# All logs
firebase functions:log

# Last 100 lines
firebase functions:log --lines 100

# Specific function
firebase functions:log --only createAnnouncement

# Real-time logs (follow)
firebase functions:log --only createChurch --tail
```

### View Function URLs
```bash
firebase functions:list
```

---

## Testing Locally

### Start Emulators
```bash
cd backend
firebase emulators:start
```

This starts:
- Firestore Emulator: http://localhost:8080
- Functions Emulator: http://localhost:5001
- Emulator UI: http://localhost:4000

### Test Functions Locally
```bash
# Call a function
curl -X POST http://localhost:5001/your-project/us-central1/createChurch \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Church"}'
```

---

## Firebase Console URLs

Replace `YOUR_PROJECT_ID` with your actual project ID:

- **Project Overview**: https://console.firebase.google.com/project/YOUR_PROJECT_ID
- **Authentication**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/authentication
- **Firestore**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore
- **Functions**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/functions
- **Storage**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/storage

---

## Common Mobile App Code

### Flutter - Initialize Firebase

```dart
// lib/main.dart
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(MyApp());
}
```

### Flutter - Call Cloud Functions

```dart
import 'package:cloud_functions/cloud_functions.dart';

// Get church announcements
Future<List<Map<String, dynamic>>> getAnnouncements() async {
  try {
    final functions = FirebaseFunctions.instance;
    final result = await functions.httpsCallable('getChurchAnnouncements').call({
      'limit': 20,
      'onlyPublished': true,
    });

    if (result.data['success']) {
      return List<Map<String, dynamic>>.from(result.data['data']);
    }
  } catch (e) {
    print('Error: $e');
  }
  return [];
}

// Create announcement (Pastor only)
Future<String?> createAnnouncement(String title, String content) async {
  try {
    final functions = FirebaseFunctions.instance;
    final result = await functions.httpsCallable('createAnnouncement').call({
      'title': title,
      'content': content,
      'priority': 'medium',
      'isPublished': true,
    });

    if (result.data['success']) {
      return result.data['data']['announcementId'];
    }
  } catch (e) {
    print('Error: $e');
  }
  return null;
}

// Register for event
Future<bool> registerForEvent(String eventId) async {
  try {
    final functions = FirebaseFunctions.instance;
    final result = await functions.httpsCallable('registerForEvent').call({
      'eventId': eventId,
    });
    return result.data['success'];
  } catch (e) {
    print('Error: $e');
    return false;
  }
}

// Create prayer request
Future<String?> createPrayer(String title, String content) async {
  try {
    final functions = FirebaseFunctions.instance;
    final result = await functions.httpsCallable('createPrayer').call({
      'title': title,
      'content': content,
      'visibility': 'church',
      'category': 'general',
    });

    if (result.data['success']) {
      return result.data['data']['prayerId'];
    }
  } catch (e) {
    print('Error: $e');
  }
  return null;
}

// Pray for a request
Future<bool> prayForRequest(String prayerId) async {
  try {
    final functions = FirebaseFunctions.instance;
    final result = await functions.httpsCallable('prayForRequest').call({
      'prayerId': prayerId,
    });
    return result.data['success'];
  } catch (e) {
    print('Error: $e');
    return false;
  }
}
```

### Flutter - Use Local Emulator (Development)

```dart
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/foundation.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Use emulator in debug mode
  if (kDebugMode) {
    FirebaseFunctions.instance.useFunctionsEmulator('localhost', 5001);
  }

  runApp(MyApp());
}
```

---

## Environment Variables

### Backend (.env file)

Create `backend/functions/.env`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
STRIPE_PRICE_ID_BASIC=price_your_basic_price_id
STRIPE_PRICE_ID_PREMIUM=price_your_premium_price_id

# App Configuration
APP_NAME=BibleNoteLM
SUPPORT_EMAIL=support@biblenotelm.com
```

### Set Environment Variables (for deployment)

```bash
# Set environment config
firebase functions:config:set stripe.secret_key="sk_live_xxx"
firebase functions:config:set stripe.webhook_secret="whsec_xxx"

# View current config
firebase functions:config:get

# Download config for local development
firebase functions:config:get > .runtimeconfig.json
```

---

## Firestore Security Rules Testing

```bash
# Test security rules locally
firebase emulators:exec --only firestore "npm test"
```

---

## Build Commands

### Backend
```bash
cd backend/functions
npm install          # Install dependencies
npm run build        # Build TypeScript
npm run serve        # Test locally
npm run shell        # Interactive shell
npm run deploy       # Deploy functions
```

### Mobile App (Flutter)
```bash
# Development
flutter run

# Release (APK)
flutter build apk --release --split-per-abi

# Release (App Bundle for Play Store)
flutter build appbundle --release

# Check app size
flutter build apk --analyze-size
```

---

## Troubleshooting

### Functions not deploying
```bash
# 1. Check Node version (should be 18 or 20)
node --version

# 2. Rebuild
cd backend/functions
npm run build

# 3. Check for errors
npm run lint

# 4. Try deploying specific function
firebase deploy --only functions:createChurch
```

### Permission denied errors
```bash
# 1. Re-deploy Firestore rules
firebase deploy --only firestore:rules

# 2. Check user authentication
# User must be logged in with Firebase Auth

# 3. Check user role in Firestore
# User must have correct role (member, pastor, admin)
```

### Mobile app can't connect
```bash
# 1. Verify google-services.json exists
# Location: android/app/google-services.json

# 2. Check package name matches
# android/app/build.gradle → applicationId

# 3. Re-run FlutterFire configure
flutterfire configure

# 4. Clean and rebuild
flutter clean
flutter pub get
flutter run
```

---

## Useful Firebase CLI Commands

```bash
# List projects
firebase projects:list

# Switch project
firebase use project-id

# Add project alias
firebase use --add

# Check current project
firebase use

# Clear project selection
firebase use --clear

# Open Firebase Console
firebase open

# Check Firebase CLI version
firebase --version

# Update Firebase CLI
npm install -g firebase-tools@latest
```

---

## Cost Monitoring

### Check Usage
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **"Usage and billing"** in left sidebar
4. View current usage for:
   - Cloud Functions (invocations, GB-seconds)
   - Firestore (reads, writes, deletes)
   - Authentication (users)
   - Storage (GB stored, downloads)

### Set Budget Alerts
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **"Billing"** → **"Budgets & alerts"**
3. Create budget (e.g., $50/month)
4. Set email alerts at 50%, 90%, 100%

---

## Support & Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **Firebase CLI Reference**: https://firebase.google.com/docs/cli
- **Firebase Functions Guide**: https://firebase.google.com/docs/functions
- **Firestore Security Rules**: https://firebase.google.com/docs/firestore/security/get-started
- **FlutterFire**: https://firebase.flutter.dev/

---

## Quick Testing Checklist

Before deploying to production:

- [ ] All functions build successfully (`npm run build`)
- [ ] Firestore security rules deployed
- [ ] Environment variables configured
- [ ] Tested authentication flow
- [ ] Tested church creation and joining
- [ ] Tested announcements (create, view, update)
- [ ] Tested events (create, register, view attendees)
- [ ] Tested prayers (create, view, pray for)
- [ ] Tested on real device (not just emulator)
- [ ] Checked Firebase Console for errors
- [ ] Set up monitoring and alerts

---

## Emergency Commands

### Rollback Function Deployment
```bash
# List function versions
firebase functions:list

# Rollback is not directly supported
# Best practice: Keep previous version in git
# Redeploy previous version from git

git checkout previous-commit
firebase deploy --only functions:functionName
```

### Disable a Function
```bash
# Delete a specific function
firebase functions:delete functionName

# Note: This removes it entirely
# To temporarily disable, comment out the export in index.ts
```

### Clear Firestore Data (DANGEROUS!)
```bash
# Only do this in development!
# There's no command-line way to clear all data
# Use Firebase Console or write a script
```

---

**Remember**: Always test in development before deploying to production! 🚀
