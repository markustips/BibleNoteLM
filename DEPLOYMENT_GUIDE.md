# Firebase & Production Deployment Guide

This guide will walk you through connecting your app to Firebase and deploying both the backend and mobile app to production.

## Table of Contents
1. [Firebase Project Setup](#1-firebase-project-setup)
2. [Backend Deployment](#2-backend-deployment)
3. [Mobile App Configuration](#3-mobile-app-configuration)
4. [Play Store Deployment](#4-play-store-deployment)
5. [Testing & Monitoring](#5-testing--monitoring)

---

## 1. Firebase Project Setup

### Step 1.1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `BibleNoteLM` (or your preferred name)
4. Enable/Disable Google Analytics (recommended: Enable)
5. Select or create Analytics account
6. Click **"Create project"**

### Step 1.2: Upgrade to Blaze Plan (Required for Cloud Functions)

1. In Firebase Console, click on **"Upgrade"** in the left sidebar
2. Select **"Blaze (Pay as you go)"** plan
3. Set up billing information
4. **Important**: Set up budget alerts to avoid unexpected charges
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to "Billing" → "Budgets & alerts"
   - Create a budget (e.g., $50/month) with email alerts

> **Note**: Cloud Functions require the Blaze plan. The free tier is very generous - you likely won't pay anything for development/small usage.

### Step 1.3: Enable Required Services

In Firebase Console, enable these services:

1. **Authentication**
   - Go to "Build" → "Authentication"
   - Click "Get started"
   - Enable sign-in methods:
     - ✅ Email/Password
     - ✅ Google (recommended)
     - ✅ Any other providers you want

2. **Firestore Database**
   - Go to "Build" → "Firestore Database"
   - Click "Create database"
   - Start in **Production mode** (we'll deploy security rules)
   - Choose a location close to your users (e.g., `us-central1` or `asia-southeast1`)

3. **Cloud Functions**
   - Will be set up when we deploy

4. **Cloud Storage** (Optional - for images, documents)
   - Go to "Build" → "Storage"
   - Click "Get started"
   - Start in production mode
   - Use the same location as Firestore

---

## 2. Backend Deployment

### Step 2.1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2.2: Login to Firebase

```bash
firebase login
```

This will open a browser window for authentication.

### Step 2.3: Initialize Firebase in Your Project (If Not Already Done)

```bash
cd d:\Dev\BibleNoteLm\backend

# If firebase.json doesn't exist:
firebase init
```

**Select these options:**
- Firestore: Configure security rules and indexes files
- Functions: Configure and deploy Cloud Functions
- Use an existing project → Select your project
- Use JavaScript or TypeScript? → **TypeScript**
- Do you want to use ESLint? → Yes
- Install dependencies now? → Yes

### Step 2.4: Configure Firebase Project

Edit `backend/.firebaserc`:

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

Replace `your-project-id` with your actual Firebase project ID from the console.

### Step 2.5: Configure Environment Variables

Create `backend/functions/.env` file:

```env
# Stripe Configuration (for subscriptions)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID_BASIC=price_your_basic_price_id
STRIPE_PRICE_ID_PREMIUM=price_your_premium_price_id

# App Configuration
APP_NAME=BibleNoteLM
SUPPORT_EMAIL=support@yourapp.com

# Firebase Admin SDK (auto-configured in Cloud Functions)
# No need to set these manually
```

> **Important**: Never commit `.env` to git! It's already in `.gitignore`.

### Step 2.6: Build the Functions

```bash
cd backend/functions
npm install
npm run build
```

### Step 2.7: Deploy to Firebase

**Deploy Everything (First Time):**

```bash
cd backend
firebase deploy
```

This deploys:
- Firestore security rules
- Firestore indexes
- All Cloud Functions

**Deploy Only Functions (for updates):**

```bash
firebase deploy --only functions
```

**Deploy Specific Functions:**

```bash
# Deploy only announcement functions
firebase deploy --only functions:createAnnouncement,functions:getChurchAnnouncements

# Deploy only event functions
firebase deploy --only functions:createEvent,functions:getChurchEvents

# Deploy only prayer functions
firebase deploy --only functions:createPrayer,functions:getPrayers
```

**Deploy Only Firestore Rules:**

```bash
firebase deploy --only firestore:rules
```

### Step 2.8: Verify Deployment

After deployment, you'll see URLs like:

```
✔  functions[createChurch(us-central1)]
   https://us-central1-your-project.cloudfunctions.net/createChurch
✔  functions[getChurchAnnouncements(us-central1)]
   https://us-central1-your-project.cloudfunctions.net/getChurchAnnouncements
```

Visit the [Firebase Console → Functions](https://console.firebase.google.com/) to see all deployed functions.

---

## 3. Mobile App Configuration

### Step 3.1: Register Your Android App

1. In Firebase Console, click the **Android icon** to add an app
2. Enter your Android package name (e.g., `com.yourcompany.biblenotelm`)
   - Find this in `android/app/build.gradle` → `applicationId`
3. Enter app nickname: "BibleNoteLM Android"
4. Enter SHA-1 certificate (for Google Sign-in):

**Get Debug SHA-1:**
```bash
cd android
./gradlew signingReport
```

**Get Release SHA-1:**
```bash
keytool -list -v -keystore your-release-keystore.jks -alias your-key-alias
```

5. Click "Register app"
6. Download `google-services.json`
7. Place it in `android/app/google-services.json`

### Step 3.2: Configure Android App

**File: `android/app/build.gradle`**

Make sure you have:

```gradle
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services'  // Add this line

android {
    ...
    defaultConfig {
        applicationId "com.yourcompany.biblenotelm"
        minSdkVersion 21  // Minimum for Firebase
        targetSdkVersion 34
        ...
    }
}

dependencies {
    // Firebase dependencies
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-analytics'
    implementation 'com.google.firebase:firebase-auth'
    implementation 'com.google.firebase:firebase-firestore'
    implementation 'com.google.firebase:firebase-functions'
    implementation 'com.google.firebase:firebase-storage'
    implementation 'com.google.firebase:firebase-messaging'
}
```

**File: `android/build.gradle`**

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'  // Add this
    }
}
```

### Step 3.3: Initialize Firebase in Your App

**For Flutter:**

```bash
# Install FlutterFire CLI
dart pub global activate flutterfire_cli

# Configure Firebase for your Flutter app
flutterfire configure
```

This will:
- Generate `firebase_options.dart`
- Configure iOS and Android automatically
- Link your apps to the Firebase project

**Manual Flutter Setup (if needed):**

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

**For React Native:**

```bash
npm install @react-native-firebase/app
npm install @react-native-firebase/auth
npm install @react-native-firebase/firestore
npm install @react-native-firebase/functions
```

### Step 3.4: Configure Firebase Functions URL

**For Flutter:**

```dart
// lib/services/firebase_service.dart
import 'package:cloud_functions/cloud_functions.dart';

class FirebaseService {
  static final functions = FirebaseFunctions.instance;

  // For production
  static void useProductionEmulator() {
    // Don't use emulator in production
  }

  // For development
  static void useLocalEmulator() {
    functions.useFunctionsEmulator('localhost', 5001);
  }
}

// In main.dart for development:
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  // Only for development:
  if (kDebugMode) {
    FirebaseService.useLocalEmulator();
  }

  runApp(MyApp());
}
```

### Step 3.5: Test Firebase Connection

Create a test to verify Firebase is connected:

```dart
// test_firebase.dart
import 'package:cloud_functions/cloud_functions.dart';

Future<void> testConnection() async {
  try {
    final functions = FirebaseFunctions.instance;
    final result = await functions.httpsCallable('getSystemStats').call();
    print('Connected! ${result.data}');
  } catch (e) {
    print('Error: $e');
  }
}
```

---

## 4. Play Store Deployment

### Step 4.1: Prepare for Release

1. **Update app version** in `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        versionCode 1        // Increment for each release
        versionName "1.0.0"  // Semantic version
    }
}
```

2. **Create a keystore** (if you don't have one):

```bash
keytool -genkey -v -keystore biblenotelm-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias biblenotelm
```

Save this keystore securely! You'll need it for all future updates.

3. **Configure signing** in `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file("../../biblenotelm-release.jks")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias "biblenotelm"
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

4. **Set environment variables** before building:

```bash
# Windows
set KEYSTORE_PASSWORD=your_keystore_password
set KEY_PASSWORD=your_key_password

# Linux/Mac
export KEYSTORE_PASSWORD=your_keystore_password
export KEY_PASSWORD=your_key_password
```

### Step 4.2: Build Release APK/AAB

**For Flutter:**

```bash
# Build App Bundle (recommended for Play Store)
flutter build appbundle --release

# Build APK (for testing)
flutter build apk --release --split-per-abi
```

**For React Native:**

```bash
cd android
./gradlew bundleRelease  # For AAB
./gradlew assembleRelease  # For APK
```

Output files:
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

### Step 4.3: Test Release Build

Before uploading to Play Store:

```bash
# Install release APK on device
adb install android/app/build/outputs/apk/release/app-release.apk

# Test thoroughly:
# - Authentication
# - Church features
# - Announcements, Events, Prayers
# - Offline mode
# - Performance
```

### Step 4.4: Create Play Store Listing

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **"Create app"**
3. Fill in app details:
   - **App name**: BibleNoteLM
   - **Default language**: English
   - **App or game**: App
   - **Free or paid**: Free

4. Complete store listing:
   - **Short description** (80 chars)
   - **Full description** (4000 chars)
   - **Screenshots** (at least 2 for phone)
   - **Feature graphic** (1024x500)
   - **App icon** (512x512)
   - **Privacy policy URL**
   - **App category**: Lifestyle
   - **Content rating**: Fill out questionnaire

5. Set up pricing and distribution:
   - Select countries
   - Confirm content guidelines

### Step 4.5: Upload to Play Store

1. Go to **"Production"** → **"Create new release"**
2. Upload your AAB file
3. Add release notes:

```
Version 1.0.0 - Initial Release

Features:
• Church membership and management
• Announcements from church leaders
• Church events with registration
• Prayer requests and prayer tracking
• Subscription plans for premium features
• Offline support

What's in this release:
- Initial public release
- Complete church dashboard functionality
- Secure authentication and data privacy
```

4. Click **"Review release"**
5. Click **"Start rollout to production"**

### Step 4.6: Play Store Review Process

- **Review time**: Usually 1-7 days
- **Status**: Check in Play Console
- **App will be tested** for policy compliance
- **You may receive**: Feedback or requests for changes

---

## 5. Testing & Monitoring

### Step 5.1: Firebase Console Monitoring

Monitor your app in real-time:

1. **Authentication** → See user registrations
2. **Firestore** → View database contents
3. **Functions** → Monitor function executions, errors, logs
4. **Performance** → App performance metrics (if enabled)
5. **Crashlytics** → Crash reports (if enabled)

### Step 5.2: Cloud Functions Logs

```bash
# View recent logs
firebase functions:log

# Follow logs in real-time
firebase functions:log --only createAnnouncement

# View specific function
firebase functions:log --only functions.createChurch
```

### Step 5.3: Set Up Alerts

1. **Cloud Functions Alerts**:
   - Go to [Cloud Console](https://console.cloud.google.com/)
   - Navigate to "Monitoring" → "Alerting"
   - Create alerts for:
     - Function errors
     - High latency
     - High memory usage

2. **Firestore Alerts**:
   - Monitor read/write operations
   - Set budget alerts if costs increase

3. **Authentication Alerts**:
   - Monitor suspicious login attempts
   - Track user growth

### Step 5.4: Testing in Production

**Test all features:**

```
✅ User registration and login
✅ Create/join a church
✅ Announcements (create, view, update, delete)
✅ Events (create, view, register, cancel)
✅ Prayer requests (create, view, pray, mark answered)
✅ Subscription management
✅ Church member management
✅ Offline functionality
✅ Push notifications (if implemented)
```

---

## 6. Environment Management

### Development vs Production

**For Backend Functions:**

```typescript
// functions/src/config.ts
export const config = {
  isDevelopment: process.env.FUNCTIONS_EMULATOR === 'true',
  stripeKey: process.env.STRIPE_SECRET_KEY || '',
  appUrl: process.env.FUNCTIONS_EMULATOR
    ? 'http://localhost:3000'
    : 'https://biblenotelm.com',
};
```

**For Mobile App:**

```dart
// lib/config/environment.dart
class Environment {
  static const bool isDevelopment = bool.fromEnvironment('DEBUG');

  static String get apiUrl {
    return isDevelopment
      ? 'http://localhost:5001/your-project/us-central1'
      : 'https://us-central1-your-project.cloudfunctions.net';
  }
}
```

---

## 7. Security Checklist

Before going live:

- [ ] Firestore security rules deployed
- [ ] Authentication configured properly
- [ ] API keys restricted in Google Cloud Console
- [ ] Stripe webhook secrets configured
- [ ] Environment variables set (not hardcoded)
- [ ] HTTPS enforced everywhere
- [ ] Rate limiting enabled
- [ ] Audit logging enabled
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] GDPR compliance (if targeting EU users)
- [ ] Data backup strategy in place

---

## 8. Cost Optimization

**Firebase Free Tier Limits:**
- Cloud Functions: 2M invocations/month
- Firestore: 50K reads, 20K writes, 20K deletes per day
- Authentication: Unlimited
- Storage: 5GB

**Tips to Stay Within Free Tier:**
- Use Firestore caching in your app
- Optimize queries (use indexes)
- Implement pagination (don't load all data at once)
- Use Cloud Functions sparingly
- Monitor usage in Firebase Console

**If You Exceed Free Tier:**
- Expected costs: $5-20/month for small apps
- Set budget alerts
- Optimize expensive operations

---

## 9. Quick Reference Commands

```bash
# Login to Firebase
firebase login

# Select project
firebase use your-project-id

# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only firestore rules
firebase deploy --only firestore:rules

# View logs
firebase functions:log

# Build release app
flutter build appbundle --release

# Check app size
flutter build apk --analyze-size

# Test on device
flutter run --release
```

---

## 10. Troubleshooting

### "Permission denied" errors
- Check Firestore security rules
- Verify user is authenticated
- Ensure user has correct role

### Functions not deploying
- Check Node.js version (use v18 or v20)
- Run `npm run build` first
- Check for TypeScript errors

### Mobile app can't connect
- Verify `google-services.json` is in correct location
- Check package name matches Firebase
- Ensure Firebase is initialized in `main.dart`

### Stripe webhooks not working
- Verify webhook secret in environment variables
- Check webhook URL in Stripe dashboard
- Test with Stripe CLI: `stripe listen --forward-to localhost:5001/your-project/us-central1/stripeWebhook`

---

## Support

- **Firebase Documentation**: https://firebase.google.com/docs
- **Firebase Support**: https://firebase.google.com/support
- **Play Store Help**: https://support.google.com/googleplay/android-developer
- **Flutter Docs**: https://flutter.dev/docs
- **React Native Firebase**: https://rnfirebase.io/

---

## Next Steps

1. ✅ Set up Firebase project
2. ✅ Deploy backend functions
3. ✅ Configure mobile app
4. ✅ Test in development
5. ✅ Build release version
6. ✅ Upload to Play Store
7. ✅ Monitor and iterate

Good luck with your launch! 🚀
