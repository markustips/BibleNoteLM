# BibleNoteLM - Church Community Platform

A comprehensive church management and community platform that connects church members through announcements, events, and prayer requests.

## 📱 Features

### For Church Members
- ✅ **Announcements** - Stay updated with church-wide announcements
- ✅ **Events** - Browse and register for church events
- ✅ **Prayer Requests** - Share prayer needs and pray for others
- ✅ **Secure Authentication** - Email/password and Google sign-in
- ✅ **Offline Support** - Access content even without internet
- ✅ **Privacy-Focused** - Your data is secure and private

### For Church Leaders (Pastors/Admins)
- ✅ **Church Management** - Create and manage your church
- ✅ **Announcement Management** - Create and publish announcements
- ✅ **Event Management** - Organize events and track attendance
- ✅ **Member Management** - View and manage church members
- ✅ **Analytics** - Track engagement and growth

### Premium Features (Subscription)
- ✅ **Advanced Analytics** - Detailed insights and reports
- ✅ **Custom Branding** - Personalize your church's presence
- ✅ **Priority Support** - Get help when you need it
- ✅ **Unlimited Storage** - Store more content and media

## 🏗️ Architecture

### Backend (Firebase Cloud Functions)
- **Language**: TypeScript
- **Runtime**: Node.js 20
- **Platform**: Firebase Cloud Functions
- **Database**: Cloud Firestore
- **Authentication**: Firebase Auth
- **Payments**: Stripe

### Mobile App
- **Framework**: Flutter / React Native
- **Platforms**: Android (iOS coming soon)
- **State Management**: Provider / Redux
- **Offline Storage**: SQLite / Hive

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or 20
- Firebase CLI
- Git
- Android Studio (for mobile development)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd BibleNoteLm
   ```

2. **Install dependencies**
   ```bash
   cd backend/functions
   npm install
   ```

3. **Run setup script** (Windows)
   ```bash
   cd backend
   scripts\setup-firebase.bat
   ```

   Or manually:
   ```bash
   firebase login
   firebase use your-project-id
   cd functions
   npm run build
   cd ..
   firebase deploy
   ```

4. **Configure environment variables**
   - Copy `backend/functions/.env.example` to `backend/functions/.env`
   - Add your Stripe keys and other configuration

For detailed instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### Mobile App Setup

1. **Install dependencies**
   ```bash
   # For Flutter
   flutter pub get

   # For React Native
   npm install
   ```

2. **Configure Firebase**
   ```bash
   # For Flutter
   flutterfire configure

   # For React Native
   # Place google-services.json in android/app/
   ```

3. **Run the app**
   ```bash
   # For Flutter
   flutter run

   # For React Native
   npm run android
   ```

## 📚 Documentation

- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Complete guide to deploy to Firebase and Play Store
- **[Church Dashboard Features](./backend/CHURCH_DASHBOARD_FEATURES.md)** - API documentation for all features
- **[Firebase Quick Reference](./FIREBASE_QUICK_REFERENCE.md)** - Quick commands and code snippets
- **[Pre-Launch Checklist](./PRE_LAUNCH_CHECKLIST.md)** - Comprehensive checklist before going live
- **[Backend Setup](./backend/SETUP_INSTRUCTIONS.md)** - Detailed backend setup
- **[Quick Start](./backend/QUICK_START.md)** - Get started in 5 minutes
- **[Status](./backend/STATUS.md)** - Current implementation status

## 🔧 Project Structure

```
BibleNoteLm/
├── backend/
│   ├── functions/
│   │   ├── src/
│   │   │   ├── announcements/    # Announcement Cloud Functions
│   │   │   ├── events/          # Event Cloud Functions
│   │   │   ├── prayers/         # Prayer Cloud Functions
│   │   │   ├── church/          # Church management
│   │   │   ├── auth/            # Authentication triggers
│   │   │   ├── subscriptions/   # Stripe subscriptions
│   │   │   ├── admin/           # Admin analytics
│   │   │   ├── middleware/      # Auth, validation, rate limiting
│   │   │   └── types/           # TypeScript type definitions
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── firebase.json
│   ├── firestore.rules          # Security rules
│   └── firestore.indexes.json   # Database indexes
├── mobile/                       # Mobile app (Flutter/React Native)
├── docs/                         # Additional documentation
└── README.md
```

## 🔐 Security

### Authentication
- Email/password with verification
- Google OAuth
- Password reset flow
- Secure session management

### Authorization
- Role-based access control (Guest, Member, Pastor, Admin, Super Admin)
- Church membership verification
- Firestore security rules enforce permissions
- Rate limiting on all endpoints

### Data Privacy
- End-to-end encryption for sensitive data
- GDPR compliant
- User data deletion on request
- Audit logging for compliance
- Privacy policy and terms of service

## 🎯 Cloud Functions

### Authentication
- `onUserCreate` - Initialize new user profile
- `onUserDelete` - Clean up user data
- `updateLastLogin` - Track login activity
- `updateFcmToken` - Manage push notification tokens

### Church Management
- `createChurch` - Create a new church
- `updateChurch` - Update church details
- `getChurch` - Get church information
- `joinChurch` - Join a church with code
- `leaveChurch` - Leave current church
- `getChurchMembers` - List church members (Pastor only)

### Announcements
- `createAnnouncement` - Create announcement (Pastor/Admin)
- `updateAnnouncement` - Update announcement (Pastor/Admin)
- `deleteAnnouncement` - Delete announcement (Pastor/Admin)
- `getChurchAnnouncements` - Get all announcements
- `getAnnouncement` - Get single announcement

### Events
- `createEvent` - Create event (Pastor/Admin)
- `updateEvent` - Update event (Pastor/Admin)
- `deleteEvent` - Delete event (Pastor/Admin)
- `getChurchEvents` - Get all events
- `getEvent` - Get single event
- `registerForEvent` - Register for event
- `cancelEventRegistration` - Cancel registration
- `getEventAttendees` - View attendees (Pastor/Admin)

### Prayers
- `createPrayer` - Create prayer request
- `updatePrayer` - Update prayer (Creator only)
- `deletePrayer` - Delete prayer (Creator only)
- `getPrayers` - Get prayers by visibility
- `getPrayer` - Get single prayer
- `prayForRequest` - Mark that you prayed
- `getPrayingUsers` - See who has prayed

### Subscriptions
- `createSubscription` - Start subscription
- `cancelSubscription` - Cancel subscription
- `getSubscriptionStatus` - Check subscription
- `stripeWebhook` - Handle Stripe events
- `getAllSubscriptions` - Admin: View all subscriptions

### Admin Analytics
- `getSystemStats` - System-wide statistics
- `getChurchList` - List all churches
- `getRevenueAnalytics` - Revenue reports
- `getUserGrowthAnalytics` - User growth trends

## 💰 Pricing

### Free Tier
- Basic church features
- Up to 50 members
- Standard support

### Basic ($9.99/month)
- Up to 200 members
- Advanced analytics
- Email support
- Custom branding

### Premium ($29.99/month)
- Unlimited members
- Priority support
- Advanced features
- White-label option

## 🧪 Testing

### Local Testing
```bash
# Start Firebase emulators
cd backend
firebase emulators:start

# Run mobile app against emulator
flutter run
```

### Unit Tests
```bash
# Backend tests
cd backend/functions
npm test

# Mobile app tests
flutter test
```

## 📈 Monitoring

### Firebase Console
- Authentication: Track user signups and activity
- Firestore: Monitor database usage
- Functions: View function logs and errors
- Performance: Track app performance

### Alerts
- Budget alerts (prevent unexpected costs)
- Error alerts (critical function failures)
- Performance alerts (slow functions)
- Security alerts (suspicious activity)

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## 📄 License

[Your License Here]

## 🆘 Support

- **Email**: support@biblenotelm.com
- **Documentation**: See docs folder
- **Issues**: GitHub Issues
- **Firebase Support**: https://firebase.google.com/support

## 🎉 Acknowledgments

- Built with [Firebase](https://firebase.google.com/)
- Payments by [Stripe](https://stripe.com/)
- UI framework: [Flutter](https://flutter.dev/) / [React Native](https://reactnative.dev/)

## 🗺️ Roadmap

### Version 1.1 (Q2 2024)
- [ ] iOS app release
- [ ] Push notifications
- [ ] In-app messaging
- [ ] Media library

### Version 1.2 (Q3 2024)
- [ ] Video streaming for sermons
- [ ] Group discussions
- [ ] Bible study tools
- [ ] Giving/donations

### Version 2.0 (Q4 2024)
- [ ] Multi-language support
- [ ] Advanced reporting
- [ ] API for third-party integrations
- [ ] Desktop app

## 🔗 Links

- **Firebase Console**: https://console.firebase.google.com/
- **Play Store**: [Coming Soon]
- **App Store**: [Coming Soon]
- **Website**: [Your Website]

---

**Made with ❤️ for church communities worldwide**
