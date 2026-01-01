# GitHub Repository Information

## Repository Details

**Repository URL**: https://github.com/markustips/BibleNoteLM

**Owner**: markustips
**Name**: BibleNoteLM
**Visibility**: Public
**Description**: Church Community Platform - Connect church members through announcements, events, and prayer requests

---

## Repository Contents

### Committed Files (184 files, 51,100 lines)

✅ **Source Code**
- `backend/functions/src/` - All TypeScript Cloud Functions source code
- `dashboard-admin/src/` - React dashboard source code
- `biblenotelm/` - React mobile/web app source code

✅ **Configuration Files**
- `backend/firebase.json` - Firebase hosting and functions config
- `backend/firestore.rules` - Firestore security rules
- `backend/firestore.indexes.json` - Database indexes
- `backend/storage.rules` - Cloud Storage security rules
- `package.json` files for all apps

✅ **Documentation**
- `README.md` - Main project overview
- `DEPLOYMENT_STATUS.md` - Current deployment status
- `FIRESTORE_DATABASE_STRUCTURE.md` - Complete database schema
- `FIX_CLOUD_FUNCTIONS_PERMISSIONS.md` - IAM permissions guide
- Multiple setup and deployment guides

✅ **.gitignore**
- Excludes `node_modules/`
- Excludes build artifacts (`dist/`, `lib/`, `*.js.map`)
- Excludes environment files (`.env`)
- Excludes Firebase artifacts
- Excludes service account keys (security)

---

## What's NOT in the Repository (Properly Excluded)

❌ `node_modules/` - Dependencies (excluded via .gitignore)
❌ `backend/functions/lib/` - Build artifacts
❌ `backend/functions/.env` - Environment variables
❌ `dist/` folders - Production builds
❌ Service account keys - Security sensitive
❌ `.firebase/` - Firebase cache
❌ IDE settings - Personal preferences

---

## Commit Information

**First Commit**: e429bc6
**Commit Message**: "Initial commit: BibleNoteLM Church Management Platform"

**Commit Details**:
- 184 files changed
- 51,100 insertions
- Includes complete backend, dashboard, and mobile app
- Includes all documentation and configuration
- Properly excludes dependencies and build artifacts

**Co-Authored-By**: Claude Sonnet 4.5 <noreply@anthropic.com>

---

## Branch Information

**Default Branch**: `master`
**Tracking**: `origin/master`

---

## Clone the Repository

To clone this repository:

```bash
git clone https://github.com/markustips/BibleNoteLM.git
cd BibleNoteLM
```

---

## Repository Structure

```
BibleNoteLM/
├── .gitignore                          # Git ignore rules
├── README.md                           # Main documentation
├── DEPLOYMENT_STATUS.md                # Current deployment info
├── FIRESTORE_DATABASE_STRUCTURE.md    # Database schema
├── FIX_CLOUD_FUNCTIONS_PERMISSIONS.md # IAM fix guide
├── (15+ other documentation files)
│
├── backend/                            # Firebase backend
│   ├── functions/                      # Cloud Functions
│   │   ├── src/                        # TypeScript source
│   │   │   ├── admin/                  # Admin analytics
│   │   │   ├── announcements/          # Announcement functions
│   │   │   ├── auth/                   # Auth triggers
│   │   │   ├── church/                 # Church management
│   │   │   ├── events/                 # Event functions
│   │   │   ├── middleware/             # Security middleware
│   │   │   ├── prayers/                # Prayer functions
│   │   │   ├── subscriptions/          # Stripe subscriptions
│   │   │   ├── types/                  # TypeScript types
│   │   │   ├── utils/                  # Utility functions
│   │   │   └── index.ts                # Main entry point
│   │   ├── package.json                # Dependencies
│   │   └── tsconfig.json               # TypeScript config
│   ├── firebase.json                   # Firebase config
│   ├── firestore.rules                 # Database rules
│   ├── firestore.indexes.json          # Database indexes
│   └── storage.rules                   # Storage rules
│
├── dashboard-admin/                    # Church admin dashboard
│   ├── src/
│   │   ├── components/                 # React components
│   │   ├── stores/                     # Zustand stores
│   │   ├── App.tsx                     # Main app
│   │   └── main.tsx                    # Entry point
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── biblenotelm/                        # Mobile/web app
    ├── components/                     # React components
    ├── firebase/                       # Firebase services
    ├── services/                       # App services
    ├── stores/                         # Zustand stores
    ├── android/                        # Android native
    ├── App.tsx
    ├── index.tsx
    ├── package.json
    ├── capacitor.config.ts
    └── vite.config.ts
```

---

## Live Deployments

The following are already deployed and live:

**Dashboard**: https://church-biblenotelm.web.app
**Mobile App**: https://app-biblenotelm.web.app

**Firebase Project**: biblenotelm-6cf80

---

## Setting Up from Clone

After cloning, follow these steps:

### 1. Install Dependencies

```bash
# Backend functions
cd backend/functions
npm install

# Dashboard
cd ../../dashboard-admin
npm install

# Mobile app
cd ../biblenotelm
npm install
```

### 2. Configure Environment

```bash
# Backend functions
cd backend/functions
cp .env.example .env
# Edit .env with your Firebase config

# Dashboard
cd ../../dashboard-admin
cp .env.example .env
# Edit .env with Firebase config

# Mobile app
cd ../biblenotelm
cp .env.example .env
# Edit .env with Firebase config
```

### 3. Build Projects

```bash
# Backend functions
cd backend/functions
npm run build

# Dashboard
cd ../../dashboard-admin
npm run build

# Mobile app
cd ../biblenotelm
npm run build
```

### 4. Deploy to Firebase

```bash
cd backend

# Deploy Firestore rules and indexes
firebase deploy --only firestore

# Deploy Storage rules
firebase deploy --only storage

# Deploy hosting
firebase deploy --only hosting

# Deploy Cloud Functions (after fixing IAM permissions)
firebase deploy --only functions
```

---

## Next Steps for Contributors

1. **Clone the repository**
2. **Install dependencies** in all three directories
3. **Configure Firebase** with your project credentials
4. **Build the applications**
5. **Deploy to your Firebase project**

See [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md) for detailed deployment instructions.

---

## Contributing

This is a church management platform built with Firebase, React, and TypeScript. Contributions are welcome!

**Technology Stack**:
- Frontend: React 19, TypeScript, Vite, TailwindCSS
- Backend: Firebase Cloud Functions, Node.js 22
- Database: Cloud Firestore
- Storage: Cloud Storage for Firebase
- Auth: Firebase Authentication
- Payments: Stripe
- AI: Google Generative AI (Gemini)

---

## License

This project is open source. See LICENSE file for details.

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/markustips/BibleNoteLM/issues
- Documentation: See the various .md files in this repository

---

**Repository Created**: December 31, 2025
**Last Updated**: December 31, 2025

🚀 Built with Claude Code (https://claude.com/claude-code)
