# Image Upload Guide for Announcements

This guide explains how to use the image upload feature for church announcements.

## Overview

Pastors and admins can now attach images to announcements to make them more engaging and informative. Images are stored in Firebase Cloud Storage and are automatically managed (uploaded, updated, deleted).

## Features

- ✅ Upload images with announcements
- ✅ Support for JPEG, PNG, GIF, and WebP formats
- ✅ Maximum file size: 5MB
- ✅ Automatic image validation
- ✅ Secure storage with church-level permissions
- ✅ Automatic cleanup when announcement is deleted
- ✅ Update or remove images from existing announcements

---

## Backend Implementation

### Type Definition

```typescript
export interface AnnouncementDocument {
  id: string;
  churchId: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  priority: 'low' | 'medium' | 'high';
  isPublished: boolean;
  publishedAt?: Timestamp;
  expiresAt?: Timestamp;
  imageUrl?: string;        // Public URL to the image
  imagePath?: string;       // Storage path for deletion
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Cloud Functions

#### 1. Create Announcement with Image

**Function**: `createAnnouncement`

**Input**:
```typescript
{
  title: string;
  content: string;
  priority?: 'low' | 'medium' | 'high';
  isPublished?: boolean;
  expiresAt?: string;  // ISO date string
  imageBase64?: string;  // Base64 encoded image data
}
```

**Image Format**:
```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...
```

**Example**:
```typescript
const result = await functions.httpsCallable('createAnnouncement').call({
  title: "Church Picnic This Sunday!",
  content: "Join us for a fun family picnic at Central Park...",
  priority: "high",
  isPublished: true,
  imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
});
```

#### 2. Update Announcement Image

**Function**: `updateAnnouncement`

**Replace Image**:
```typescript
{
  announcementId: string;
  imageBase64: string;  // New image (replaces old one)
}
```

**Remove Image**:
```typescript
{
  announcementId: string;
  removeImage: true;  // Deletes the image
}
```

**Example**:
```typescript
// Update the image
await functions.httpsCallable('updateAnnouncement').call({
  announcementId: "abc123",
  imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
});

// Remove the image
await functions.httpsCallable('updateAnnouncement').call({
  announcementId: "abc123",
  removeImage: true
});
```

#### 3. Delete Announcement

**Function**: `deleteAnnouncement`

When an announcement is deleted, the associated image is automatically deleted from storage.

```typescript
await functions.httpsCallable('deleteAnnouncement').call({
  announcementId: "abc123"
});
```

---

## Mobile App Integration

### Flutter Example

#### 1. Convert Image to Base64

```dart
import 'dart:convert';
import 'dart:io';
import 'package:image_picker/image_picker.dart';

Future<String?> pickAndConvertImage() async {
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

  // Get the file extension
  final extension = image.path.split('.').last.toLowerCase();
  String mimeType = 'image/jpeg';
  if (extension == 'png') mimeType = 'image/png';
  if (extension == 'gif') mimeType = 'image/gif';
  if (extension == 'webp') mimeType = 'image/webp';

  return 'data:$mimeType;base64,$base64Image';
}
```

#### 2. Create Announcement with Image

```dart
import 'package:cloud_functions/cloud_functions.dart';

Future<String?> createAnnouncementWithImage({
  required String title,
  required String content,
  String? imageBase64,
  String priority = 'medium',
  bool isPublished = true,
}) async {
  try {
    final functions = FirebaseFunctions.instance;
    final result = await functions.httpsCallable('createAnnouncement').call({
      'title': title,
      'content': content,
      'priority': priority,
      'isPublished': isPublished,
      if (imageBase64 != null) 'imageBase64': imageBase64,
    });

    if (result.data['success']) {
      return result.data['data']['announcementId'];
    }
  } catch (e) {
    print('Error creating announcement: $e');
  }
  return null;
}
```

#### 3. Display Announcement Image

```dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

class AnnouncementCard extends StatelessWidget {
  final Map<String, dynamic> announcement;

  const AnnouncementCard({Key? key, required this.announcement}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image (if exists)
          if (announcement['imageUrl'] != null)
            CachedNetworkImage(
              imageUrl: announcement['imageUrl'],
              height: 200,
              width: double.infinity,
              fit: BoxFit.cover,
              placeholder: (context, url) => const Center(
                child: CircularProgressIndicator(),
              ),
              errorWidget: (context, url, error) => const Icon(Icons.error),
            ),

          // Title and Content
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  announcement['title'],
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(announcement['content']),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

#### 4. Update Announcement Image

```dart
Future<bool> updateAnnouncementImage(
  String announcementId,
  String imageBase64,
) async {
  try {
    final functions = FirebaseFunctions.instance;
    final result = await functions.httpsCallable('updateAnnouncement').call({
      'announcementId': announcementId,
      'imageBase64': imageBase64,
    });
    return result.data['success'];
  } catch (e) {
    print('Error updating image: $e');
    return false;
  }
}

Future<bool> removeAnnouncementImage(String announcementId) async {
  try {
    final functions = FirebaseFunctions.instance;
    final result = await functions.httpsCallable('updateAnnouncement').call({
      'announcementId': announcementId,
      'removeImage': true,
    });
    return result.data['success'];
  } catch (e) {
    print('Error removing image: $e');
    return false;
  }
}
```

#### 5. Complete Example UI

```dart
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

class CreateAnnouncementScreen extends StatefulWidget {
  @override
  _CreateAnnouncementScreenState createState() => _CreateAnnouncementScreenState();
}

class _CreateAnnouncementScreenState extends State<CreateAnnouncementScreen> {
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  String? _imageBase64;
  String _selectedImage = 'No image selected';
  bool _isLoading = false;

  Future<void> _pickImage() async {
    final imageBase64 = await pickAndConvertImage();
    if (imageBase64 != null) {
      setState(() {
        _imageBase64 = imageBase64;
        _selectedImage = 'Image selected';
      });
    }
  }

  Future<void> _createAnnouncement() async {
    if (_titleController.text.isEmpty || _contentController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all fields')),
      );
      return;
    }

    setState(() => _isLoading = true);

    final announcementId = await createAnnouncementWithImage(
      title: _titleController.text,
      content: _contentController.text,
      imageBase64: _imageBase64,
      priority: 'medium',
      isPublished: true,
    );

    setState(() => _isLoading = false);

    if (announcementId != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Announcement created successfully!')),
      );
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to create announcement')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Announcement')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    controller: _titleController,
                    decoration: const InputDecoration(
                      labelText: 'Title',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _contentController,
                    decoration: const InputDecoration(
                      labelText: 'Content',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 5,
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: _pickImage,
                    icon: const Icon(Icons.image),
                    label: Text(_selectedImage),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _createAnnouncement,
                    child: const Text('Create Announcement'),
                  ),
                ],
              ),
            ),
    );
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }
}
```

---

## React Native Example

```javascript
import { launchImageLibrary } from 'react-native-image-picker';
import functions from '@react-native-firebase/functions';

// Pick and convert image to Base64
const pickImage = async () => {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.85,
    includeBase64: true,
  });

  if (result.assets && result.assets[0]) {
    const asset = result.assets[0];
    const mimeType = asset.type || 'image/jpeg';
    return `data:${mimeType};base64,${asset.base64}`;
  }
  return null;
};

// Create announcement with image
const createAnnouncement = async (title, content, imageBase64) => {
  try {
    const result = await functions().httpsCallable('createAnnouncement')({
      title,
      content,
      priority: 'medium',
      isPublished: true,
      imageBase64,
    });

    if (result.data.success) {
      return result.data.data.announcementId;
    }
  } catch (error) {
    console.error('Error creating announcement:', error);
  }
  return null;
};

// Display image in component
import FastImage from 'react-native-fast-image';

const AnnouncementCard = ({ announcement }) => (
  <View style={styles.card}>
    {announcement.imageUrl && (
      <FastImage
        source={{ uri: announcement.imageUrl }}
        style={styles.image}
        resizeMode={FastImage.resizeMode.cover}
      />
    )}
    <View style={styles.content}>
      <Text style={styles.title}>{announcement.title}</Text>
      <Text>{announcement.content}</Text>
    </View>
  </View>
);
```

---

## Storage Structure

Images are stored in Firebase Cloud Storage with the following structure:

```
gs://your-bucket/
└── churches/
    └── {churchId}/
        ├── announcements/
        │   ├── 1234567890_abc123.jpg
        │   ├── 1234567891_def456.png
        │   └── ...
        ├── events/
        │   └── ...
        └── media/
            └── ...
```

---

## Security Rules

Storage security rules ensure:
- ✅ Only church members can view images
- ✅ Only pastors/admins can upload images
- ✅ Only pastors/admins can delete images
- ✅ Maximum file size: 5MB
- ✅ Only image file types allowed (JPEG, PNG, GIF, WebP)

Rules are automatically deployed with:
```bash
firebase deploy --only storage
```

---

## Image Validation

The backend automatically validates:

1. **File Format**: Only `image/jpeg`, `image/png`, `image/gif`, `image/webp`
2. **File Size**: Maximum 5MB
3. **Base64 Format**: Must include proper data URL prefix
4. **Content Type**: Must match the image format

**Validation Errors**:
```
- "Invalid image format. Supported: JPEG, PNG, GIF, WebP"
- "Image too large. Maximum size: 5MB"
- "Failed to upload image"
```

---

## Best Practices

### For Mobile Apps

1. **Compress Images Before Upload**
   - Resize to max 1200x1200 pixels
   - Use quality 85% for JPEG
   - This reduces upload time and storage costs

2. **Show Upload Progress**
   ```dart
   // Show loading indicator while uploading
   setState(() => isUploading = true);
   await createAnnouncementWithImage(...);
   setState(() => isUploading = false);
   ```

3. **Cache Images**
   - Use `cached_network_image` (Flutter)
   - Use `FastImage` (React Native)
   - This improves performance and reduces data usage

4. **Handle Errors Gracefully**
   ```dart
   try {
     await createAnnouncementWithImage(...);
   } catch (e) {
     showErrorDialog('Failed to upload image. Please try again.');
   }
   ```

5. **Offline Support**
   - Store pending uploads locally
   - Retry when connection is restored

### For Admins

1. **Image Guidelines**
   - Use high-quality, relevant images
   - Ensure proper permissions/licensing
   - Optimize file size before upload
   - Use landscape orientation (16:9) for best display

2. **Content Moderation**
   - Review images before publishing
   - Remove inappropriate content immediately
   - Follow community guidelines

---

## Troubleshooting

### "Failed to upload image"
- Check image file size (must be < 5MB)
- Verify image format (JPEG, PNG, GIF, WebP only)
- Ensure stable internet connection
- Check Storage rules are deployed

### Image not displaying
- Verify `imageUrl` exists in announcement data
- Check Firebase Storage permissions
- Ensure image URL is publicly accessible
- Try refreshing/reloading the image

### "Permission denied" error
- Verify user is pastor or admin
- Check user belongs to the church
- Ensure Storage security rules are deployed
- Confirm user is authenticated

---

## Cost Optimization

### Firebase Storage Pricing
- **Storage**: $0.026/GB per month
- **Download**: $0.12/GB
- **Upload**: Free

### Tips to Reduce Costs
1. Compress images before upload (reduces storage and bandwidth)
2. Use appropriate image quality (85% JPEG is usually sufficient)
3. Implement caching in mobile app (reduces downloads)
4. Delete unused images promptly
5. Monitor usage in Firebase Console

### Expected Costs
For a church with 100 members:
- Average: 10 announcements/month with images
- Average image size: 500KB
- Storage: ~5MB/month = $0.13/month
- Bandwidth: ~50MB/month = $0.006/month
- **Total: Less than $1/month**

---

## Deployment

### Deploy Storage Rules

```bash
cd backend
firebase deploy --only storage
```

### Deploy Cloud Functions

```bash
cd backend
firebase deploy --only functions:createAnnouncement,functions:updateAnnouncement,functions:deleteAnnouncement
```

### Deploy Everything

```bash
cd backend
firebase deploy
```

---

## Testing

### Test Image Upload

```bash
# Use Firebase Emulator for local testing
cd backend
firebase emulators:start
```

Test with curl:
```bash
curl -X POST http://localhost:5001/your-project/us-central1/createAnnouncement \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Announcement",
    "content": "Testing image upload",
    "imageBase64": "data:image/jpeg;base64,/9j/4AAQ..."
  }'
```

---

## Support

For issues or questions:
- Check Firebase Console → Storage for uploaded files
- View function logs: `firebase functions:log`
- Review security rules in Storage → Rules tab

---

**Image upload feature is ready! 📸**
