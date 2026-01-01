# Pre-Launch Checklist for BibleNoteLM

Use this checklist to ensure everything is ready before launching to production and the Play Store.

## Phase 1: Firebase Setup ☁️

### Firebase Project Configuration
- [ ] Created Firebase project at [console.firebase.google.com](https://console.firebase.google.com/)
- [ ] Upgraded to Blaze (Pay as you go) plan
- [ ] Set up billing alerts ($50/month recommended)
- [ ] Enabled Authentication service
- [ ] Enabled Firestore Database (Production mode)
- [ ] Enabled Cloud Storage (optional)
- [ ] Chose datacenter region closest to users

### Firebase Authentication
- [ ] Email/Password provider enabled
- [ ] Google Sign-In enabled (recommended)
- [ ] Configured authorized domains
- [ ] Tested user registration
- [ ] Tested user login
- [ ] Tested password reset

### Firestore Database
- [ ] Database created in production mode
- [ ] Security rules deployed (`firebase deploy --only firestore:rules`)
- [ ] Indexes deployed (`firebase deploy --only firestore:indexes`)
- [ ] Tested data read/write with authentication
- [ ] Verified security rules block unauthorized access
- [ ] Set up automatic backups (recommended)

---

## Phase 2: Backend Deployment 🚀

### Environment Setup
- [ ] Created `backend/functions/.env` file
- [ ] Added Stripe API keys (secret key, webhook secret)
- [ ] Added Stripe price IDs (basic, premium)
- [ ] Configured app name and support email
- [ ] **VERIFIED `.env` is in `.gitignore`** (never commit secrets!)

### Build & Test
- [ ] Installed dependencies (`npm install` in `backend/functions`)
- [ ] TypeScript builds successfully (`npm run build`)
- [ ] No TypeScript errors
- [ ] No ESLint errors/warnings
- [ ] Tested locally with Firebase emulator
- [ ] All Cloud Functions work in emulator

### Deployment
- [ ] Logged in to Firebase CLI (`firebase login`)
- [ ] Selected correct project (`firebase use project-id`)
- [ ] Deployed all functions (`firebase deploy`)
- [ ] Verified all functions show in Firebase Console
- [ ] Tested functions in production
- [ ] Checked function logs for errors

### Deployed Functions Verification
- [ ] Authentication triggers work (onUserCreate, onUserDelete)
- [ ] Church functions work (create, join, leave)
- [ ] Announcement functions work (create, update, delete, get)
- [ ] Event functions work (create, register, get attendees)
- [ ] Prayer functions work (create, pray, get)
- [ ] Subscription functions work (create, cancel, webhook)
- [ ] Scheduled functions configured (daily cleanup, weekly analytics)

---

## Phase 3: Stripe Integration 💳

### Stripe Account
- [ ] Created Stripe account
- [ ] Verified business details
- [ ] Activated account
- [ ] Created products (Basic, Premium subscriptions)
- [ ] Created prices (monthly/yearly)
- [ ] Noted price IDs for environment variables

### Stripe Configuration
- [ ] Added Stripe secret key to `.env`
- [ ] Added price IDs to `.env`
- [ ] Configured webhook endpoint in Stripe Dashboard
  - URL: `https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/stripeWebhook`
  - Events: `customer.subscription.*`, `invoice.*`, `payment_intent.*`
- [ ] Added webhook signing secret to `.env`
- [ ] Tested webhook with Stripe CLI or test payment
- [ ] Verified subscription creation works
- [ ] Verified subscription cancellation works

---

## Phase 4: Mobile App Setup 📱

### Firebase App Registration
- [ ] Registered Android app in Firebase Console
- [ ] Used correct package name (matches `android/app/build.gradle`)
- [ ] Downloaded `google-services.json`
- [ ] Placed in `android/app/google-services.json`
- [ ] Added SHA-1 certificate (debug and release)
- [ ] Configured Firebase in app code
- [ ] Ran `flutterfire configure` (if using Flutter)

### App Dependencies
- [ ] Added Firebase dependencies to `build.gradle`
- [ ] Added Google Services plugin
- [ ] Firebase SDK initialized in `main.dart`/`index.js`
- [ ] All dependencies up to date
- [ ] No version conflicts

### Testing
- [ ] App builds successfully in debug mode
- [ ] App connects to Firebase
- [ ] Authentication works (register, login, logout)
- [ ] Can create/join church
- [ ] Can view announcements
- [ ] Can register for events
- [ ] Can create prayer requests
- [ ] Can pray for others
- [ ] Offline mode works
- [ ] App handles errors gracefully

---

## Phase 5: Release Build 📦

### Android Signing
- [ ] Created release keystore (`keytool -genkey`)
- [ ] **Backed up keystore** (store in secure location!)
- [ ] Configured signing in `android/app/build.gradle`
- [ ] Set up environment variables for passwords
- [ ] Never committed keystore or passwords to git

### App Configuration
- [ ] Updated `versionCode` in `build.gradle`
- [ ] Updated `versionName` in `build.gradle`
- [ ] Set correct `applicationId`
- [ ] Configured ProGuard rules (if using minification)
- [ ] Removed debug code and logs
- [ ] Disabled emulator connections in production
- [ ] App name finalized
- [ ] App icon finalized (all sizes)

### Build & Test Release
- [ ] Built release APK (`flutter build apk --release`)
- [ ] Built App Bundle (`flutter build appbundle --release`)
- [ ] Installed release APK on real device
- [ ] Tested all features in release build
- [ ] No crashes or errors
- [ ] Performance is acceptable
- [ ] App size is reasonable
- [ ] Checked for memory leaks

---

## Phase 6: Play Store Preparation 🏪

### Google Play Console
- [ ] Created Google Play Developer account ($25 one-time fee)
- [ ] Account verified
- [ ] Created app in Play Console
- [ ] Filled in app details (name, description)
- [ ] Uploaded app icon (512x512)
- [ ] Created feature graphic (1024x500)
- [ ] Uploaded screenshots (minimum 2)
  - [ ] Phone screenshots
  - [ ] Tablet screenshots (optional)
- [ ] Created short description (max 80 characters)
- [ ] Created full description (max 4000 characters)

### App Store Listing Content
```
Short description example:
Connect with your church community through announcements, events, and prayers

Full description example:
BibleNoteLM brings your church community together in one powerful app.

Features:
• Stay connected with church announcements
• Register for events and track attendance
• Share and pray for prayer requests
• Secure, privacy-focused platform
• Works offline

Perfect for:
• Church members wanting to stay connected
• Church leaders managing their congregation
• Prayer groups sharing requests

Join your church community today!
```

- [ ] Selected app category (Lifestyle)
- [ ] Added contact email
- [ ] Added privacy policy URL (required!)
- [ ] Added terms of service URL (recommended)
- [ ] Completed content rating questionnaire
- [ ] Set target age range
- [ ] Selected countries for distribution

### Privacy & Legal
- [ ] Created privacy policy (required for Play Store)
- [ ] Hosted privacy policy on public URL
- [ ] Created terms of service
- [ ] Ensured GDPR compliance (if targeting EU)
- [ ] Ensured COPPA compliance (if users under 13)
- [ ] Listed all data collected by app
- [ ] Explained how data is used
- [ ] Provided data deletion instructions

---

## Phase 7: Testing & QA ✅

### Functional Testing
- [ ] User registration works
- [ ] User login works
- [ ] Password reset works
- [ ] Create church works (pastor role)
- [ ] Join church works (member role)
- [ ] Leave church works
- [ ] View church details works

### Announcement Testing
- [ ] Create announcement (pastor only)
- [ ] View announcements (all members)
- [ ] Update announcement (pastor only)
- [ ] Delete announcement (pastor only)
- [ ] Expired announcements don't show
- [ ] Unpublished announcements don't show to members

### Event Testing
- [ ] Create event (pastor only)
- [ ] View events (all members)
- [ ] Register for event
- [ ] Cancel registration
- [ ] Event capacity limits work
- [ ] View attendees (pastor only)
- [ ] Update event (pastor only)
- [ ] Delete event (pastor only)

### Prayer Testing
- [ ] Create public prayer
- [ ] Create church prayer
- [ ] Create private prayer
- [ ] View prayers based on visibility
- [ ] Pray for request
- [ ] Prayer counter increments
- [ ] Mark prayer as answered
- [ ] Update prayer (creator only)
- [ ] Delete prayer (creator only)

### Security Testing
- [ ] Non-members can't view church content
- [ ] Members can't modify other churches' content
- [ ] Regular members can't create announcements
- [ ] Regular members can't create events
- [ ] Users can only edit their own prayers
- [ ] Private prayers are truly private
- [ ] Subscription data is secure

### Performance Testing
- [ ] App loads quickly
- [ ] Screens render smoothly
- [ ] No lag when scrolling
- [ ] Images load efficiently
- [ ] Network requests are fast
- [ ] Offline mode works well
- [ ] App doesn't crash under load

### Device Testing
- [ ] Tested on small phone (5" screen)
- [ ] Tested on large phone (6.5" screen)
- [ ] Tested on tablet
- [ ] Tested on different Android versions
  - [ ] Android 11
  - [ ] Android 12
  - [ ] Android 13
  - [ ] Android 14
- [ ] Tested on different manufacturers (Samsung, Google, etc.)

---

## Phase 8: Monitoring & Analytics 📊

### Firebase Setup
- [ ] Enabled Firebase Analytics
- [ ] Enabled Firebase Crashlytics
- [ ] Enabled Firebase Performance Monitoring
- [ ] Set up custom events for tracking
- [ ] Configured audience definitions
- [ ] Set up conversion tracking

### Cloud Monitoring
- [ ] Set up error alerting for Cloud Functions
- [ ] Set up latency alerts
- [ ] Set up quota alerts
- [ ] Configured log retention
- [ ] Set up uptime monitoring (optional)

### Alerts
- [ ] Email alerts for critical errors
- [ ] Budget alerts configured
- [ ] Quota alerts configured
- [ ] Security alerts enabled
- [ ] Tested alert delivery

---

## Phase 9: Documentation 📚

### User Documentation
- [ ] Created user guide/help section
- [ ] Created FAQ page
- [ ] Created video tutorials (optional)
- [ ] Support email set up and monitored
- [ ] Terms of service finalized
- [ ] Privacy policy finalized

### Developer Documentation
- [ ] Code is well-commented
- [ ] README files up to date
- [ ] API documentation complete
- [ ] Architecture documented
- [ ] Deployment process documented
- [ ] Troubleshooting guide created

---

## Phase 10: Pre-Launch Final Checks 🎯

### Security
- [ ] All API keys in environment variables
- [ ] No hardcoded secrets in code
- [ ] Firestore security rules tested
- [ ] Authentication required for all protected routes
- [ ] Rate limiting enabled
- [ ] HTTPS enforced everywhere
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (if applicable)
- [ ] XSS prevention implemented

### Performance
- [ ] App bundle size < 50MB (preferably < 20MB)
- [ ] App startup time < 3 seconds
- [ ] API response times < 1 second
- [ ] Images optimized
- [ ] Lazy loading implemented where needed
- [ ] Database queries optimized
- [ ] Indexes created for frequent queries

### Business
- [ ] Pricing strategy finalized
- [ ] Support process established
- [ ] Marketing materials ready
- [ ] Social media accounts created
- [ ] Launch announcement drafted
- [ ] Press release prepared (optional)

### Legal
- [ ] Privacy policy reviewed by lawyer (recommended)
- [ ] Terms of service reviewed
- [ ] GDPR compliance verified
- [ ] App store compliance verified
- [ ] Data retention policy defined
- [ ] Data deletion process implemented

---

## Phase 11: Launch 🚀

### Play Store Submission
- [ ] Uploaded App Bundle (.aab file)
- [ ] Completed all store listing sections
- [ ] Added release notes for version 1.0.0
- [ ] Set rollout to production (100%)
- [ ] Submitted for review
- [ ] Review completed (usually 1-7 days)
- [ ] App is live on Play Store!

### Post-Launch Monitoring
- [ ] Monitor crash reports (first 24 hours)
- [ ] Monitor user reviews
- [ ] Check Firebase Analytics
- [ ] Monitor Cloud Functions logs
- [ ] Monitor API costs
- [ ] Respond to user feedback
- [ ] Fix critical bugs immediately

### Marketing
- [ ] Announced launch on social media
- [ ] Sent email to mailing list
- [ ] Posted on church websites
- [ ] Requested reviews from beta testers
- [ ] Shared with church communities
- [ ] Press outreach (optional)

---

## Phase 12: Ongoing Maintenance 🔧

### Weekly Tasks
- [ ] Check crash reports
- [ ] Respond to user reviews
- [ ] Monitor Firebase usage and costs
- [ ] Check for critical errors in logs
- [ ] Review performance metrics

### Monthly Tasks
- [ ] Review analytics data
- [ ] Plan feature updates
- [ ] Update dependencies
- [ ] Review and optimize costs
- [ ] Backup important data
- [ ] Security audit

### Quarterly Tasks
- [ ] Major feature releases
- [ ] Performance optimization
- [ ] Code refactoring
- [ ] Infrastructure review
- [ ] Security assessment
- [ ] User survey

---

## Emergency Contacts & Resources

- **Firebase Support**: https://firebase.google.com/support
- **Play Console Help**: https://support.google.com/googleplay/android-developer
- **Stripe Support**: https://support.stripe.com/
- **Your Firebase Project**: https://console.firebase.google.com/project/YOUR_PROJECT_ID
- **Your Play Console**: https://play.google.com/console

---

## Success Criteria

Your app is ready to launch when:
- ✅ All items in this checklist are completed
- ✅ No critical bugs
- ✅ All features work as expected
- ✅ Security is properly configured
- ✅ Legal requirements met
- ✅ Performance is acceptable
- ✅ Monitoring is in place
- ✅ Support system ready

---

**Good luck with your launch! 🎉**

Remember: It's better to delay a few days to fix issues than to launch with major problems. Take your time and test thoroughly!
