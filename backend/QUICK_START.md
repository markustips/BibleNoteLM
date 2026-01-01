# Quick Start Guide

## ✅ Installation Complete!

Your backend is now installed and compiled successfully.

## 🚀 Next Steps

### 1. Firebase Setup

If you haven't already, initialize Firebase:

```bash
# Login to Firebase
firebase login

# Initialize project (from backend directory)
cd backend
firebase init
```

Select:
- ✅ Functions (already configured)
- ✅ Firestore (already configured)
- Choose your Firebase project

### 2. Environment Configuration

```bash
cd functions
cp .env.example .env
```

Edit `.env` and add your keys:
- Stripe secret key
- Stripe webhook secret
- SendGrid API key (optional)

### 3. Test Locally with Emulators

```bash
# IMPORTANT: Run from functions directory!
cd backend/functions
npm run serve
```

This will start:
- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- Emulator UI: http://localhost:4000

### 4. Deploy to Firebase

```bash
# Deploy everything
firebase deploy

# Or deploy individually
firebase deploy --only functions
firebase deploy --only firestore:rules
```

## 📝 Available Commands

```bash
# Build TypeScript
npm run build

# Watch for changes
npm run build:watch

# Start emulators
npm run serve

# Deploy functions
npm run deploy

# View logs
npm run logs
```

## 🧪 Test a Function

Once emulators are running, test a function:

```javascript
// In your frontend or test script
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// Test creating a church
const createChurch = httpsCallable(functions, 'createChurch');
const result = await createChurch({
  name: 'Test Church',
  description: 'Testing the backend'
});

console.log(result.data);
```

## 🔑 Required Environment Variables

```bash
# Stripe (for subscriptions)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (optional)
SENDGRID_API_KEY=SG...

# URLs
APP_URL=https://app.biblenotelm.com
ADMIN_DASHBOARD_URL=https://admin.biblenotelm.com
CHURCH_DASHBOARD_URL=https://church.biblenotelm.com
```

## 📚 Documentation

- [Complete API Docs](README.md)
- [Architecture Design](../ARCHITECTURE_DESIGN.md)
- [Implementation Summary](../BACKEND_IMPLEMENTATION_SUMMARY.md)

## ⚡ Quick Function Reference

### Authentication
- `onUserCreate` - Auto-creates user document
- `updateLastLogin` - Updates last login timestamp

### Church
- `createChurch` - Create new church (Pastor)
- `joinChurch` - Join church with code (Member)
- `getChurchMembers` - View members (Pastor)

### Subscriptions
- `createSubscription` - Start subscription
- `getSubscriptionStatus` - Check subscription
- `stripeWebhook` - Handle Stripe events

### Admin (Super Admin Only)
- `getSystemStats` - System analytics
- `getRevenueAnalytics` - Revenue metrics
- `getAllSubscriptions` - View all subs

## 🐛 Troubleshooting

### Build errors?
```bash
rm -rf node_modules lib
npm install
npm run build
```

### Emulator not starting?
```bash
# Kill processes on ports
lsof -ti:5001 | xargs kill -9
lsof -ti:8080 | xargs kill -9
lsof -ti:4000 | xargs kill -9

# Restart
npm run serve
```

### Deployment issues?
```bash
# Check Firebase CLI
firebase --version

# Re-login if needed
firebase logout
firebase login
```

## ✅ Success!

Your backend is ready to use. Start the emulators to test locally!

```bash
npm run serve
```
