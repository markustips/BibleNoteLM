# BibleNoteLM Backend - Cloud Functions

Complete backend implementation with role-based access control, privacy compliance, and subscription management.

## Architecture

```
Backend Services (Firebase Cloud Functions)
├── Authentication & Authorization (RBAC)
├── Church Management
├── Subscription Management (Stripe)
├── Super Admin Analytics (Privacy-Protected)
├── Audit Logging (Compliance)
└── Scheduled Tasks (Cleanup, Reminders)
```

## 🔐 Security & Privacy

### Role-Based Access Control (RBAC)

| Role | Access | Restrictions |
|------|--------|--------------|
| **Super Admin** | - View all churches (names only)<br>- Manage subscriptions<br>- View system analytics | ❌ CANNOT see church activities<br>❌ CANNOT see member data<br>❌ CANNOT see sermons/prayers |
| **Pastor/Admin** | - Manage their church<br>- View church members<br>- Create events/announcements | ❌ CANNOT see subscription billing<br>❌ CANNOT access other churches |
| **Member** | - View their church content<br>- Participate in events<br>- Submit prayers | ❌ CANNOT manage church<br>❌ CANNOT see subscriptions |

### Privacy Compliance (PIPEDA, CCPA, GDPR)

✅ **Data Minimization** - Super admins only see aggregated data
✅ **Audit Logging** - All data access logged
✅ **Data Retention** - Logs kept for 365 days
✅ **User Deletion** - Complete data cleanup on account deletion
✅ **Consent Tracking** - User permissions tracked

---

## 📁 Project Structure

```
backend/
├── functions/
│   ├── src/
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript types
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts               # RBAC & permissions
│   │   │   ├── validation.ts         # Input validation
│   │   │   └── rateLimit.ts          # Rate limiting
│   │   │
│   │   ├── auth/
│   │   │   └── triggers.ts           # User lifecycle events
│   │   │
│   │   ├── church/
│   │   │   └── index.ts              # Church CRUD operations
│   │   │
│   │   ├── subscriptions/
│   │   │   └── index.ts              # Stripe integration
│   │   │
│   │   ├── admin/
│   │   │   └── analytics.ts          # Super admin analytics
│   │   │
│   │   └── index.ts                  # Main exports
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── firestore.rules                   # Security rules
├── firestore.indexes.json            # Database indexes
└── firebase.json                     # Firebase config
```

---

## 🚀 Setup & Deployment

### Prerequisites

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project
- Stripe account

### Installation

```bash
cd backend/functions
npm install
```

### Configuration

1. **Copy environment variables**
```bash
cp .env.example .env
```

2. **Update `.env` with your credentials**
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG...
```

3. **Set Firebase environment config**
```bash
firebase functions:config:set \
  stripe.secret_key="sk_test_..." \
  stripe.webhook_secret="whsec_..." \
  sendgrid.api_key="SG..."
```

### Local Development

```bash
# Start Firebase emulators
npm run serve

# In another terminal, watch for changes
npm run build:watch
```

Access emulator UI: http://localhost:4000

### Deploy to Production

```bash
# Build functions
npm run build

# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:createChurch

# Deploy security rules
firebase deploy --only firestore:rules
```

---

## 📝 API Reference

### Authentication Functions

#### `onUserCreate` (Trigger)
Automatically creates user document when user signs up.

#### `updateLastLogin` (Callable)
Updates user's last login timestamp.

```typescript
const result = await updateLastLogin();
```

---

### Church Management

#### `createChurch` (Callable)
Create a new church (Pastor/Admin only).

```typescript
const result = await createChurch({
  name: 'Grace Community Church',
  description: 'A vibrant community...',
  address: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA'
  }
});

// Response:
{
  success: true,
  data: {
    churchId: 'abc123',
    churchCode: 'GRACE001',
    name: 'Grace Community Church'
  }
}
```

#### `joinChurch` (Callable)
Join a church using invite code (Member).

```typescript
const result = await joinChurch({
  churchCode: 'GRACE001'
});
```

#### `getChurchMembers` (Callable)
Get church member list (Pastor only).

```typescript
const result = await getChurchMembers({
  churchId: 'abc123',
  page: 1,
  limit: 20
});
```

---

### Subscription Management

#### `createSubscription` (Callable)
Create a new subscription.

```typescript
const result = await createSubscription({
  tier: 'premium',              // 'basic' | 'premium'
  priceId: 'price_xxx',          // Stripe price ID
  paymentMethodId: 'pm_xxx'      // Stripe payment method
});

// Response:
{
  success: true,
  data: {
    subscriptionId: 'sub_xxx',
    clientSecret: 'pi_xxx_secret_xxx',
    status: 'active'
  }
}
```

#### `cancelSubscription` (Callable)
Cancel subscription (at period end).

```typescript
const result = await cancelSubscription({
  subscriptionId: 'sub_xxx',
  cancelReason: 'Not using anymore'
});
```

#### `getSubscriptionStatus` (Callable)
Get current subscription status.

```typescript
const result = await getSubscriptionStatus();

// Response:
{
  success: true,
  data: {
    hasSubscription: true,
    tier: 'premium',
    status: 'active',
    currentPeriodEnd: Timestamp
  }
}
```

#### `stripeWebhook` (HTTP)
Handle Stripe webhook events.

```bash
# Webhook URL
https://us-central1-your-project.cloudfunctions.net/stripeWebhook
```

---

### Super Admin Analytics

#### `getSystemStats` (Callable)
Get aggregated system statistics (Super Admin only).

```typescript
const result = await getSystemStats();

// Response:
{
  success: true,
  data: {
    totalChurches: 150,
    totalUsers: 3450,
    activeSubscriptions: 87,
    subscriptionsByTier: {
      free: 2500,
      basic: 600,
      premium: 350
    },
    monthlyRevenue: 14500
  }
}
```

#### `getRevenueAnalytics` (Callable)
Get detailed revenue analytics (Super Admin only).

```typescript
const result = await getRevenueAnalytics({
  startDate: '2025-01-01',
  endDate: '2025-12-31'
});
```

#### `getAllSubscriptions` (Callable)
Get all subscriptions (Super Admin only).

```typescript
const result = await getAllSubscriptions({
  page: 1,
  limit: 50,
  status: 'active'    // optional filter
});
```

---

## 🔒 Security Rules

### Firestore Rules Summary

- **Users**: Can only read/update own data
- **Churches**: Can only access own church
- **Subscriptions**: Users can ONLY see their own subscription
- **Analytics**: ONLY super admin can access
- **Audit Logs**: ONLY super admin can read

### Privacy Enforcement

**Super Admins are BLOCKED from:**
- Reading individual church activities
- Viewing member personal data
- Accessing sermon content
- Seeing prayer requests

**Church Admins are BLOCKED from:**
- Viewing subscription billing
- Accessing other churches
- Seeing system analytics

---

## 📊 Scheduled Functions

### Daily Cleanup
**Schedule**: Midnight daily
**Actions**:
- Clean up old rate limit records
- Delete audit logs older than 365 days
- Mark expired subscriptions

### Weekly Analytics
**Schedule**: Sunday midnight
**Actions**:
- Generate system snapshot
- Calculate weekly metrics
- Store historical data

### Payment Reminders
**Schedule**: 9 AM daily
**Actions**:
- Find subscriptions expiring in 3 days
- Send reminder emails/notifications

---

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
# Start emulators
npm run serve

# Run tests against emulators
npm run test:integration
```

### Test with Emulators

```bash
# Access Functions
http://localhost:5001/your-project/us-central1/createChurch

# Access Firestore UI
http://localhost:4000
```

---

## 🚨 Error Handling

### Common Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `unauthenticated` | No auth token | User must be logged in |
| `permission-denied` | Insufficient permissions | Check user role |
| `not-found` | Resource not found | Verify IDs are correct |
| `resource-exhausted` | Rate limit exceeded | Wait before retrying |
| `invalid-argument` | Invalid input | Check validation requirements |

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "permission-denied",
    "message": "Insufficient permissions. Required roles: pastor, admin"
  }
}
```

---

## 📈 Monitoring

### Firebase Console

- Functions: https://console.firebase.google.com/project/YOUR_PROJECT/functions
- Logs: https://console.firebase.google.com/project/YOUR_PROJECT/functions/logs

### Audit Logs

Query audit logs for compliance:

```typescript
// Get access attempts for user
const logs = await admin.firestore()
  .collection('audit_logs')
  .where('userId', '==', userId)
  .orderBy('timestamp', 'desc')
  .limit(100)
  .get();
```

---

## 💰 Cost Optimization

### Functions Pricing

- **Free tier**: 2M invocations/month
- **After**: $0.40 per million invocations

### Estimated Monthly Cost

| Usage | Functions | Firestore | Total |
|-------|-----------|-----------|-------|
| Small (100 users) | $5 | $5 | $10 |
| Medium (1000 users) | $15 | $15 | $30 |
| Large (10000 users) | $50 | $80 | $130 |

### Cost Saving Tips

1. **Use rate limiting** to prevent abuse
2. **Schedule cleanup** functions to remove old data
3. **Cache frequently accessed data**
4. **Batch operations** when possible
5. **Monitor function execution time**

---

## 🔄 Stripe Webhook Setup

1. **Create webhook endpoint in Stripe Dashboard**
```
Endpoint URL: https://us-central1-your-project.cloudfunctions.net/stripeWebhook
Events: customer.subscription.*, invoice.*
```

2. **Get webhook secret**
```
whsec_xxx...
```

3. **Add to environment**
```bash
firebase functions:config:set stripe.webhook_secret="whsec_xxx"
```

---

## 📱 Frontend Integration

### Initialize Firebase

```typescript
import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Call cloud function
const createChurch = httpsCallable(functions, 'createChurch');
const result = await createChurch({ name: 'My Church' });
```

---

## 🛠️ Troubleshooting

### Functions not deploying

```bash
# Clear cache
rm -rf node_modules
npm install

# Rebuild
npm run build
```

### Emulators not starting

```bash
# Kill processes on port
lsof -ti:5001 | xargs kill -9
lsof -ti:8080 | xargs kill -9
```

### Stripe webhooks failing

1. Check webhook secret is correct
2. Verify endpoint URL
3. Check function logs for errors

---

## 📚 Additional Resources

- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Stripe API Docs](https://stripe.com/docs/api)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

## 📝 License

Proprietary - BibleNoteLM © 2025
