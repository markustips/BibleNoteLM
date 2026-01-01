# Dashboard Authentication System

## Overview

The BibleNoteLM dashboard implements a multi-tier authentication system with role-based access control (RBAC) supporting all users:

1. **Church Dashboard** - For all church members (members, subscribers, pastors, admins)
2. **Super Admin Dashboard** - For the platform owner to view all churches and subscribers

### Authentication Methods

- **Email/Password** - Traditional email and password authentication
  - Sign up with email and password
  - Sign in with email and password
  - Password reset functionality
- **Google Sign-In** - OAuth authentication via Google accounts

All users (guests, members, pastors, admins, super admins) can sign in using email/password or Google authentication.

---

## User Roles

### Role Hierarchy

```
super_admin (Platform Owner)
    ↓
admin (Church Administrator)
    ↓
pastor (Church Pastor)
    ↓
subscriber (Paid Church Member)
    ↓
member (Free Church Member)
    ↓
guest (Not Authenticated)
```

### Role Permissions

#### `super_admin`
- Full platform access
- View all churches
- View all subscribers
- View system-wide analytics
- Manage platform settings
- Access to Super Admin Dashboard (`/super-admin`)

#### `admin` (Church Administrator)
- Manage church settings
- Manage church members
- Manage roles within church
- Manage subscriptions
- Create/edit announcements, events, prayers
- Access to Church Dashboard (`/dashboard`)

#### `pastor`
- View church members
- Create/edit announcements, events
- Manage prayer requests
- Access sermon recording features
- Access to Church Dashboard (`/dashboard`)

#### `subscriber`
- All member permissions
- Premium features (AI, sermon recording, note-taking)

#### `member`
- All guest permissions
- View church announcements
- View church events
- View and create prayer requests
- Access church-specific content
- **Requirement:** Must join a church using a church code

#### `guest`
- Access to daily Bible verse
- Access to Bible reading
- Can subscribe for AI features (notes, sermon summary)
- **No access to:** Church announcements, events, prayer requests
- **Default role** for new users upon first sign-in
- **Becomes `member`** when joining a church with a church code

---

## Authentication Flow

### 1. Initial Load

```mermaid
User visits dashboard
    ↓
App.tsx loads
    ↓
useAuth hook checks Firebase Auth
    ↓
If authenticated → Load user data from Firestore
    ↓
If not authenticated → Redirect to /login
```

### 2. Login Process

```typescript
// User clicks "Sign in with Google" or "Sign in with email/password"
signInWithGoogle() or signInWithEmail()
    ↓
Firebase Authentication
    ↓
onAuthStateChanged fires
    ↓
loadUserData() from Firestore
    ↓
If user exists: Load existing user data
If new user: Create user document with role='guest'
    ↓
Update Zustand store with user data
    ↓
Redirect based on role:
    - super_admin → /super-admin
    - guest/member/subscriber/admin/pastor → /dashboard
```

### 3. First-Time User Flow

When a user signs in for the first time:

1. User authenticates with Google OAuth or email/password
2. System checks if user document exists in Firestore
3. If not exists:
   - Create new user document
   - Assign default role: `guest` (no church affiliation)
   - Set subscriptionTier: `free`
   - Record createdAt and lastLogin timestamps
4. Redirect to `/dashboard`
5. User sees limited content (only daily verse and Bible)
6. User can join a church using a church code
7. Upon joining church:
   - Role changes from `guest` to `member`
   - User gains access to church announcements, events, prayer requests

### 4. Guest vs Member Access

#### Guest Users (No Church Affiliation)

**Access:**
- ✅ Daily Bible verse
- ✅ Bible reading
- ✅ Can subscribe for AI features (paid)
- ❌ Church announcements
- ❌ Church events
- ❌ Prayer requests

**Use Case:** New users who haven't joined a church yet, or users exploring the platform

#### Member Users (Joined a Church)

**Access:**
- ✅ All guest permissions
- ✅ Church announcements
- ✅ Church events
- ✅ View prayer requests
- ✅ Create prayer requests
- ✅ Church-specific content

**How to become a member:** Join a church using a church code (provided by church admin/pastor)

#### Subscriber Users (Paid Subscription)

**Access:**
- ✅ All member permissions
- ✅ AI sermon summarization
- ✅ AI-powered note-taking
- ✅ Sermon recording features
- ✅ Advanced AI features

**Pricing:** Guest or Member can upgrade to Subscriber (basic or premium tier)

### 5. Protected Routes

Every protected route uses the `<ProtectedRoute>` component:

```tsx
<Route
  path="/super-admin"
  element={
    <ProtectedRoute requiredRole="super_admin">
      <SuperAdminDashboard />
    </ProtectedRoute>
  }
/>
```

---

## File Structure

```
dashboard/src/
├── hooks/
│   └── useAuth.ts                  # Authentication hook
├── components/
│   ├── LoginPage.tsx               # Login UI with Google Sign-In
│   ├── ProtectedRoute.tsx          # Route protection wrapper
│   ├── UnauthorizedPage.tsx        # Access denied page
│   ├── SuperAdminDashboard.tsx     # Platform admin view
│   └── WebDashboard.tsx            # Church admin view
├── stores/
│   └── useUserStore.ts             # Zustand user state
├── types.ts                        # Role and permission types
└── App.tsx                         # Routing and Firebase init
```

---

## Components

### `useAuth` Hook

Located: [src/hooks/useAuth.ts](../src/hooks/useAuth.ts)

**Purpose:** Manages Firebase authentication and syncs with Zustand store

**Methods:**
- `signUpWithEmail(email, password, displayName)` - Create account with email/password
- `signInWithEmail(email, password)` - Sign in with email/password
- `signInWithGoogle()` - Sign in with Google OAuth
- `resetPassword(email)` - Send password reset email
- `signOut()` - Sign out current user
- `loading` - Authentication loading state
- `error` - Authentication error message

**Features:**
- Automatic user creation for first-time sign-ins
- Default role assignment (`guest`)
- Last login timestamp tracking
- Password reset functionality
- User-friendly error messages
- Seamless integration with Zustand state

**Usage:**
```tsx
import { useAuth } from '../hooks/useAuth';

const MyComponent = () => {
  const { signInWithGoogle, signInWithEmail, signOut, loading, error } = useAuth();

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
  };

  const handleEmailLogin = async (email: string, password: string) => {
    await signInWithEmail(email, password);
  };
};
```

---

### `LoginPage` Component

Located: [src/components/LoginPage.tsx](../src/components/LoginPage.tsx)

**Purpose:** Login screen with email/password and Google authentication

**Features:**
- Email/password authentication (sign up, sign in, password reset)
- Google OAuth integration
- Toggle between sign-in, sign-up, and password reset modes
- Form validation
- Loading state during authentication
- User-friendly error messages
- Success confirmation for password reset
- Responsive design
- Separate loading states for each auth method

---

### `ProtectedRoute` Component

Located: [src/components/ProtectedRoute.tsx](../src/components/ProtectedRoute.tsx)

**Purpose:** Wrap routes to enforce authentication and role requirements

**Props:**
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;        // Exact role required
  allowedRoles?: UserRole[];      // Array of allowed roles
}
```

**Behavior:**
- If not authenticated → Redirect to `/login`
- If wrong role → Redirect to appropriate dashboard or `/unauthorized`
- If loading → Show loading spinner

**Examples:**
```tsx
// Require exact role
<ProtectedRoute requiredRole="super_admin">
  <SuperAdminDashboard />
</ProtectedRoute>

// Allow multiple roles
<ProtectedRoute allowedRoles={['admin', 'pastor']}>
  <WebDashboard />
</ProtectedRoute>
```

---

### `SuperAdminDashboard` Component

Located: [src/components/SuperAdminDashboard.tsx](../src/components/SuperAdminDashboard.tsx)

**Purpose:** Platform-wide dashboard for super admin

**Features:**
- System statistics (total churches, users, subscribers, revenue)
- All churches table with:
  - Church name and code
  - Member count
  - Subscription tier
  - Active status
  - Creation date
- Uses Cloud Functions:
  - `getSystemStats()` - Platform analytics
- Real-time data from Firestore

---

### `WebDashboard` Component

Located: [src/components/WebDashboard.tsx](../src/components/WebDashboard.tsx)

**Purpose:** Church-specific dashboard for admins and pastors

**Features:**
- Manage church announcements
- Manage events
- View members
- Prayer requests
- Church settings

---

## Routes

### Public Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/login` | `LoginPage` | Google Sign-In |
| `/unauthorized` | `UnauthorizedPage` | Access denied page |

### Protected Routes

| Path | Component | Required Role | Description |
|------|-----------|---------------|-------------|
| `/super-admin` | `SuperAdminDashboard` | `super_admin` | Platform admin dashboard |
| `/dashboard` | `WebDashboard` | `admin`, `pastor` | Church admin dashboard |
| `/` | `RootRedirect` | Any authenticated | Redirects to appropriate dashboard |

---

## User Store (Zustand)

Located: [src/stores/useUserStore.ts](../src/stores/useUserStore.ts)

**State:**
```typescript
interface UserState {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  churchId: string | null;
  churchCode: string | null;
  churchName: string | null;
  isAuthenticated: boolean;
}
```

**Actions:**
- `updateUser(updates)` - Update user data
- `setRole(role)` - Change user role
- `joinChurch(code, name, id)` - Join a church
- `leaveChurch()` - Leave current church
- `can(permission)` - Check if user has permission
- `logout()` - Clear user session

**Usage:**
```tsx
import { useUserStore } from '../stores/useUserStore';

const MyComponent = () => {
  const { user, role, can } = useUserStore();

  if (can('manage_church')) {
    // Show church management UI
  }
};
```

---

## Firebase Integration

### Firestore Collections

#### `users/{userId}`

```typescript
{
  uid: string;              // Firebase Auth UID
  name: string;
  email: string;
  photoURL: string;
  role: UserRole;           // 'super_admin' | 'admin' | 'pastor' | etc.
  churchId: string | null;
  churchName: string | null;
  churchCode: string | null;
  subscriptionTier: string; // 'free' | 'basic' | 'premium'
  createdAt: Timestamp;
  lastLogin: Timestamp;
}
```

#### Setting Super Admin Role

To make a user a super admin, update their Firestore document:

```javascript
// In Firebase Console or Cloud Function
db.collection('users').doc(userId).update({
  role: 'super_admin'
});
```

---

## Security Rules

Firestore security rules for user data:

```javascript
match /users/{userId} {
  // Users can read their own data
  allow read: if request.auth != null && request.auth.uid == userId;

  // Only super_admin can read all users
  allow read: if request.auth != null &&
                 get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';

  // Users can update their own data (except role)
  allow update: if request.auth != null &&
                   request.auth.uid == userId &&
                   !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']);

  // Only super_admin can change roles
  allow update: if request.auth != null &&
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
}
```

---

## Environment Variables

Required in [.env](../.env):

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## Testing Authentication

### Test as Super Admin

1. Sign in with Google
2. In Firebase Console, update your user document:
```javascript
{
  role: 'super_admin'
}
```
3. Refresh the dashboard
4. You should see the Super Admin Dashboard at `/super-admin`

### Test as Church Admin

1. Sign in with Google
2. Join a church or have a church assigned
3. Set role to `admin` or `pastor`
4. You should see the Church Dashboard at `/dashboard`

---

## Common Issues

### User stuck on login page

**Cause:** User document doesn't exist in Firestore or role is not set

**Fix:**
1. Check if user document exists in Firestore
2. Ensure `role` field is set correctly
3. Default role for new users is now `guest` (automatically created on first sign-in)
4. Clear browser cache and try again

### Super admin sees church dashboard

**Cause:** Role not properly set in Firestore

**Fix:**
1. Verify Firestore document has `role: 'super_admin'`
2. Sign out and sign in again
3. Check browser console for errors

### Infinite redirect loop

**Cause:** RootRedirect logic error or authentication state mismatch

**Fix:**
1. Clear browser cache and local storage
2. Check if `isAuthenticated` is set correctly in Zustand
3. Verify Firebase Auth is initialized properly

---

## Next Steps

### Implement Additional Features

1. **Multi-Factor Authentication (MFA)**
   - Add phone verification for super admin
   - Implement TOTP for enhanced security

2. **Session Management**
   - Add session timeout
   - Implement "Remember me" functionality
   - Activity logging

3. **User Management UI**
   - Super admin can create/edit users
   - Role assignment interface
   - Bulk user operations

4. **Audit Logging**
   - Log all super admin actions
   - Track role changes
   - Monitor sensitive operations

---

## API Reference

### Cloud Functions for Super Admin

#### `getSystemStats`

**Purpose:** Get platform-wide statistics

**Request:**
```typescript
// No parameters needed
```

**Response:**
```typescript
{
  totalChurches: number;
  activeChurches: number;
  totalUsers: number;
  totalSubscribers: number;
  monthlyRevenue: number;
}
```

**Security:** Only accessible by `super_admin` role

---

## Deployment

### Build for Production

```bash
cd biblenotelm/dashboard
npm run build
```

### Deploy to Firebase Hosting

```bash
firebase deploy --only hosting:dashboard
```

### Environment Variables in Production

Set environment variables in Firebase Hosting:

```bash
firebase functions:config:set dashboard.firebase_api_key="your_key"
```

---

## Support

For issues or questions:
- Check console logs for Firebase errors
- Verify Firestore security rules
- Ensure environment variables are set
- Review user role in Firestore

---

**Last Updated:** 2026-01-01
**Version:** 1.0.0
