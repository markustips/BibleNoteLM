# Dashboard Authentication System

## Overview

The BibleNoteLM dashboard implements a multi-tier authentication system with role-based access control (RBAC) supporting all users:

1. **Church Dashboard** - For all church members (members, subscribers, pastors, admins)
2. **Super Admin Dashboard** - For the platform owner to view all churches and subscribers

### Authentication Methods

- **Google Sign-In** - OAuth authentication via Google accounts
- **Microsoft/Outlook Sign-In** - OAuth authentication via Microsoft accounts (Outlook, Office 365, etc.)

All users (members, pastors, admins, super admins) can sign in using either Google or Microsoft authentication.

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
- View church content
- Create prayer requests
- View events
- Access to Church Dashboard (`/dashboard`)
- Basic features (can be upgraded to subscriber)

#### `guest`
- No access to dashboard
- Redirected to login page
- Note: New users are automatically assigned `member` role upon first sign-in

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
// User clicks "Sign in with Google" or "Sign in with Microsoft"
signInWithGoogle() or signInWithMicrosoft()
    ↓
Firebase Authentication (OAuth)
    ↓
onAuthStateChanged fires
    ↓
loadUserData() from Firestore
    ↓
If user exists: Load existing user data
If new user: Create user document with role='member'
    ↓
Update Zustand store with user data
    ↓
Redirect based on role:
    - super_admin → /super-admin
    - admin/pastor/member/subscriber → /dashboard
```

### 3. First-Time User Flow

When a user signs in for the first time:

1. User authenticates with Google or Microsoft
2. System checks if user document exists in Firestore
3. If not exists:
   - Create new user document
   - Assign default role: `member`
   - Set subscriptionTier: `free`
   - Record createdAt and lastLogin timestamps
4. Redirect to `/dashboard`
5. User can then join a church using a church code

### 3. Protected Routes

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
- `signInWithGoogle()` - Sign in with Google OAuth
- `signInWithMicrosoft()` - Sign in with Microsoft/Outlook OAuth
- `signOut()` - Sign out current user
- `loading` - Authentication loading state
- `error` - Authentication error message

**Features:**
- Automatic user creation for first-time sign-ins
- Default role assignment (`member`)
- Last login timestamp tracking
- Seamless integration with Zustand state

**Usage:**
```tsx
import { useAuth } from '../hooks/useAuth';

const MyComponent = () => {
  const { signInWithGoogle, signInWithMicrosoft, signOut, loading, error } = useAuth();

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
  };

  const handleMicrosoftLogin = async () => {
    await signInWithMicrosoft();
  };
};
```

---

### `LoginPage` Component

Located: [src/components/LoginPage.tsx](../src/components/LoginPage.tsx)

**Purpose:** Login screen with Google and Microsoft Sign-In buttons

**Features:**
- Google OAuth integration
- Microsoft/Outlook OAuth integration
- Loading state during sign-in
- Error display
- Responsive design
- Separate loading states for each provider

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
3. Default role for new users is now `member` (automatically created on first sign-in)
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

1. **Email/Password Authentication**
   - Add email sign-in as alternative to Google
   - Implement password reset flow

2. **Multi-Factor Authentication (MFA)**
   - Add phone verification for super admin
   - Implement TOTP for enhanced security

3. **Session Management**
   - Add session timeout
   - Implement "Remember me" functionality
   - Activity logging

4. **User Management UI**
   - Super admin can create/edit users
   - Role assignment interface
   - Bulk user operations

5. **Audit Logging**
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

## Microsoft Authentication Setup

### Firebase Console Configuration

To enable Microsoft/Outlook authentication, you need to configure it in the Firebase Console:

1. **Go to Firebase Console**
   - Navigate to your project
   - Click "Authentication" in the left sidebar
   - Click "Sign-in method" tab

2. **Enable Microsoft Provider**
   - Click "Add new provider"
   - Select "Microsoft"
   - Toggle "Enable"

3. **Azure AD App Registration** (Required)
   - Go to [Azure Portal](https://portal.azure.com)
   - Navigate to "Azure Active Directory" > "App registrations"
   - Click "New registration"
   - Name: "BibleNoteLM Dashboard"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: Get from Firebase Console (format: `https://[project-id].firebaseapp.com/__/auth/handler`)
   - Click "Register"

4. **Configure Azure App**
   - Copy "Application (client) ID"
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Copy the secret value (show only once!)

5. **Update Firebase Console**
   - Paste "Application ID" in Firebase Console
   - Paste "Application secret" in Firebase Console
   - Click "Save"

### Supported Microsoft Account Types

The authentication supports:
- **Personal Microsoft accounts** (Outlook.com, Hotmail.com, Live.com)
- **Work/School accounts** (Office 365, Azure AD)
- **Organizational accounts** (Company email with Microsoft SSO)

### Testing Microsoft Sign-In

1. Click "Sign in with Microsoft" button
2. Select account or enter Microsoft email
3. Authorize BibleNoteLM to access basic profile
4. Redirect back to dashboard

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
