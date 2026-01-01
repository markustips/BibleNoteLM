# Setup Instructions - Fix for npm run serve

## The Issue

You ran `npm run serve` from the wrong directory. Here's how to fix it:

## ✅ Quick Fix

### Option 1: Use the Correct Directory

```bash
# YOU MUST be in the functions directory!
cd D:\Dev\BibleNoteLm\backend\functions

# Then run
npm run serve
```

**Why?** The `package.json` with the scripts is in `backend/functions/`, not `backend/`.

### Option 2: Use Absolute Path (from anywhere)

```bash
cd D:\Dev\BibleNoteLm\backend\functions && npm run serve
```

## 🚨 Common Mistake

❌ **WRONG** (from `backend` directory):
```bash
PS D:\Dev\BibleNoteLm\backend> npm run serve
npm error ENOENT: no such file or directory, open 'D:\Dev\BibleNoteLm\backend\package.json'
```

✅ **CORRECT** (from `backend/functions` directory):
```bash
PS D:\Dev\BibleNoteLm\backend\functions> npm run serve
> biblenotelm-functions@1.0.0 serve
> npm run build && firebase emulators:start --only functions
```

## 📋 Before Running Emulators

### 1. Firebase Project Setup Required

The emulators need a Firebase project. Run this **once**:

```bash
# From backend directory
cd D:\Dev\BibleNoteLm\backend

# Login to Firebase
firebase login

# Initialize (if not already done)
firebase init

# Select:
# - Functions (already configured)
# - Firestore (already configured)
# - Choose or create a Firebase project
```

### 2. Alternative: Test Without Emulators

If you don't want to set up Firebase yet, you can test the build:

```bash
cd D:\Dev\BibleNoteLm\backend\functions

# Just build (no emulators)
npm run build

# Check output
ls lib/
```

## 🎯 Directory Structure

```
BibleNoteLm/
├── backend/
│   ├── firebase.json          # Firebase config
│   ├── firestore.rules        # Security rules
│   └── functions/             # ← YOUR WORKING DIRECTORY
│       ├── package.json       # ← npm scripts are HERE
│       ├── src/               # TypeScript source
│       ├── lib/               # Compiled JavaScript
│       └── node_modules/      # Dependencies
```

## 🔧 Available Commands (from functions directory)

```bash
# Build TypeScript
npm run build

# Watch for changes
npm run build:watch

# Start emulators (requires Firebase setup)
npm run serve

# Deploy (requires Firebase setup)
npm run deploy

# View logs (requires Firebase setup)
npm run logs

# Run tests
npm test
```

## 💡 Recommended Workflow

### First Time Setup

```bash
# 1. Navigate to functions directory
cd D:\Dev\BibleNoteLm\backend\functions

# 2. Build to verify everything works
npm run build

# 3. Go to backend directory for Firebase init
cd ..

# 4. Login and initialize
firebase login
firebase init

# 5. Go back to functions and start emulators
cd functions
npm run serve
```

### Daily Development

```bash
# Always start from functions directory
cd D:\Dev\BibleNoteLm\backend\functions

# Build and test
npm run build

# Or start emulators
npm run serve
```

## 🆘 Still Having Issues?

### Issue: "firebase: command not found"

**Fix:** Install Firebase CLI globally:
```bash
npm install -g firebase-tools
```

### Issue: "No Firebase project selected"

**Fix:** Initialize Firebase:
```bash
cd D:\Dev\BibleNoteLm\backend
firebase use --add
```

### Issue: Emulators won't start

**Fix:** Check if ports are in use:
```bash
# Kill processes on ports
taskkill /F /IM node.exe

# Or use different ports in firebase.json
```

## ✅ Success Checklist

- [ ] You're in `backend/functions/` directory
- [ ] Dependencies installed (`node_modules` exists)
- [ ] Build succeeds (`npm run build`)
- [ ] Firebase CLI installed (`firebase --version`)
- [ ] Firebase project selected (`firebase use`)
- [ ] Emulators start (`npm run serve`)

## 📞 Quick Reference

| Command | Directory | Purpose |
|---------|-----------|---------|
| `npm install` | `backend/functions` | Install dependencies |
| `npm run build` | `backend/functions` | Compile TypeScript |
| `npm run serve` | `backend/functions` | Start emulators |
| `firebase init` | `backend` | Initialize Firebase |
| `firebase deploy` | `backend` | Deploy to production |

---

**Remember:** Always run npm commands from `backend/functions/`, not from `backend/`!
