# Announcement Image Upload - Implementation Summary

## ✅ What Was Added

I've successfully added image upload functionality to the church announcements feature. Here's what was implemented:

### 1. Backend Changes

#### Type Definitions
- Added `imageUrl` and `imagePath` fields to `AnnouncementDocument` type
- Location: [backend/functions/src/types/index.ts](backend/functions/src/types/index.ts)

#### Storage Helper Module (NEW)
- Created comprehensive storage utility functions
- Location: [backend/functions/src/utils/storage.ts](backend/functions/src/utils/storage.ts)
- Functions:
  - `uploadImageFromBase64()` - Upload images from base64 data
  - `deleteImage()` - Delete images from storage
  - `validateImage()` - Validate image format and size (max 5MB)
  - `generateImageFilename()` - Generate unique filenames
  - `getImageExtension()` - Extract file extension
  - `getContentType()` - Get MIME type

#### Updated Cloud Functions
- **createAnnouncement**: Now accepts `imageBase64` parameter
- **updateAnnouncement**: Supports updating or removing images
- **deleteAnnouncement**: Automatically deletes associated images
- Location: [backend/functions/src/announcements/index.ts](backend/functions/src/announcements/index.ts)

#### Validation Schemas
- Added `imageUrl` and `imagePath` validation
- Location: [backend/functions/src/middleware/validation.ts](backend/functions/src/middleware/validation.ts)

#### Storage Security Rules (NEW)
- Church-level permissions for images
- Only pastors/admins can upload/delete
- All church members can view
- Maximum file size: 5MB
- Supported formats: JPEG, PNG, GIF, WebP
- Location: [backend/storage.rules](backend/storage.rules)

### 2. Documentation

#### Comprehensive Image Upload Guide (NEW)
- Complete guide with mobile app examples
- Flutter code examples
- React Native code examples
- Best practices and troubleshooting
- Location: [backend/IMAGE_UPLOAD_GUIDE.md](backend/IMAGE_UPLOAD_GUIDE.md)

#### Updated API Documentation
- Added image parameters to announcement functions
- Location: [backend/CHURCH_DASHBOARD_FEATURES.md](backend/CHURCH_DASHBOARD_FEATURES.md)

---

## 📱 How to Use from Mobile App

### Create Announcement with Image (Flutter)

```dart
import 'dart:convert';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:cloud_functions/cloud_functions.dart';

// 1. Pick and convert image
Future<String?> pickImage() async {
  final picker = ImagePicker();
  final XFile? image = await picker.pickImage(
    source: ImageSource.gallery,
    maxWidth: 1200,
    maxHeight: 1200,
    imageQuality: 85,
  );

  if (image == null) return null;

  final bytes = await File(image.path).readAsBytes();
  final base64Image = base64Encode(bytes);
  final extension = image.path.split('.').last.toLowerCase();

  String mimeType = 'image/jpeg';
  if (extension == 'png') mimeType = 'image/png';

  return 'data:$mimeType;base64,$base64Image';
}

// 2. Create announcement
Future<void> createAnnouncement() async {
  final imageBase64 = await pickImage();

  final functions = FirebaseFunctions.instance;
  final result = await functions.httpsCallable('createAnnouncement').call({
    'title': 'Church Picnic This Sunday!',
    'content': 'Join us for a fun family picnic...',
    'priority': 'high',
    'isPublished': true,
    'imageBase64': imageBase64,  // Add the image
  });

  if (result.data['success']) {
    print('Announcement created: ${result.data['data']['announcementId']}');
  }
}
```

### Display Announcement with Image (Flutter)

```dart
import 'package:cached_network_image/cached_network_image.dart';

Widget buildAnnouncementCard(Map<String, dynamic> announcement) {
  return Card(
    child: Column(
      children: [
        // Display image if exists
        if (announcement['imageUrl'] != null)
          CachedNetworkImage(
            imageUrl: announcement['imageUrl'],
            height: 200,
            width: double.infinity,
            fit: BoxFit.cover,
            placeholder: (context, url) => CircularProgressIndicator(),
            errorWidget: (context, url, error) => Icon(Icons.error),
          ),

        // Title and content
        Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            children: [
              Text(announcement['title'], style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text(announcement['content']),
            ],
          ),
        ),
      ],
    ),
  );
}
```

### Update or Remove Image

```dart
// Update image
await functions.httpsCallable('updateAnnouncement').call({
  'announcementId': announcementId,
  'imageBase64': newImageBase64,  // New image
});

// Remove image
await functions.httpsCallable('updateAnnouncement').call({
  'announcementId': announcementId,
  'removeImage': true,  // Removes the image
});
```

---

## 🔐 Security

### Storage Security Rules
- Images stored in: `churches/{churchId}/announcements/{filename}`
- Only authenticated church members can view images
- Only pastors/admins can upload/delete images
- Automatic file validation (type, size)

### Validation
- **Supported formats**: JPEG, PNG, GIF, WebP
- **Maximum size**: 5MB
- **Auto-validation**: Backend validates before upload
- **Error handling**: Clear error messages for invalid images

---

## 🚀 Deployment

### 1. Deploy Storage Rules

```bash
cd backend
firebase deploy --only storage
```

### 2. Deploy Updated Functions

```bash
cd backend/functions
npm run build
cd ..
firebase deploy --only functions
```

Or deploy everything:

```bash
cd backend
firebase deploy
```

### 3. Configure Firebase Storage

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Storage** → **Get started**
3. Choose **Production mode**
4. Select same location as Firestore
5. Storage rules will be deployed automatically

---

## 📊 Storage Structure

```
gs://your-bucket/
└── churches/
    └── {churchId}/
        ├── announcements/
        │   ├── 1234567890_abc123.jpg
        │   ├── 1234567891_def456.png
        │   └── 1234567892_xyz789.jpg
        ├── events/
        │   └── (future feature)
        └── media/
            └── (future feature)
```

---

## 💰 Cost Estimation

### Firebase Storage Pricing
- **Storage**: $0.026/GB per month
- **Downloads**: $0.12/GB
- **Uploads**: Free

### Example Church (100 members)
- 10 announcements/month with images
- Average image: 500KB
- Monthly storage: ~5MB
- Monthly downloads: ~50MB
- **Estimated cost: < $1/month**

---

## ✅ Testing Checklist

Before going live, test:

- [ ] Upload JPEG image
- [ ] Upload PNG image
- [ ] Try to upload > 5MB image (should fail)
- [ ] Try to upload non-image file (should fail)
- [ ] Update announcement with new image
- [ ] Remove image from announcement
- [ ] Delete announcement with image (image should be deleted)
- [ ] View announcement images in mobile app
- [ ] Test with slow internet connection
- [ ] Verify only pastors can upload images
- [ ] Verify church members can view images
- [ ] Verify members from other churches cannot view images

---

## 📝 What's Next

### Optional Enhancements (Future)

1. **Image Compression**
   - Add `sharp` library for server-side compression
   - Automatically resize large images
   - Generate thumbnails

2. **Multiple Images**
   - Support image galleries in announcements
   - Allow up to 5 images per announcement

3. **Direct Upload**
   - Upload directly to Storage (bypassing functions)
   - Use signed URLs for better performance

4. **Progress Indicator**
   - Show upload progress in mobile app
   - Better UX for large images

5. **Image Editor**
   - Crop/rotate before upload
   - Add filters or text overlays

---

## 🆘 Troubleshooting

### "Failed to upload image"
**Solution**:
- Verify image is < 5MB
- Check internet connection
- Ensure user is pastor/admin
- Deploy storage rules: `firebase deploy --only storage`

### Image not displaying
**Solution**:
- Check if `imageUrl` exists in announcement data
- Verify Storage rules are deployed
- Try accessing image URL directly in browser
- Check Firebase Console → Storage

### "Permission denied"
**Solution**:
- Verify user is authenticated
- Check user role (must be pastor or admin to upload)
- Ensure user belongs to the church
- Redeploy storage rules

---

## 📚 Additional Resources

- **Complete Guide**: [IMAGE_UPLOAD_GUIDE.md](IMAGE_UPLOAD_GUIDE.md)
- **API Reference**: [CHURCH_DASHBOARD_FEATURES.md](CHURCH_DASHBOARD_FEATURES.md)
- **Storage Rules**: [storage.rules](storage.rules)
- **Storage Helper**: [src/utils/storage.ts](functions/src/utils/storage.ts)

---

**Image upload feature is complete and ready to deploy! 🎉**
