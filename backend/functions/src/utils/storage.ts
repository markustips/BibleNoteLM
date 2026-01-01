/**
 * Cloud Storage Helper Functions
 * Handle image uploads and management
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

const bucket = admin.storage().bucket();

// ============================================
// IMAGE UPLOAD HELPERS
// ============================================

/**
 * Generate a unique filename for uploaded images
 */
export function generateImageFilename(
  churchId: string,
  type: 'announcement' | 'event' | 'profile',
  extension: string = 'jpg'
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `churches/${churchId}/${type}s/${timestamp}_${random}.${extension}`;
}

/**
 * Upload image from base64 data
 */
export async function uploadImageFromBase64(
  base64Data: string,
  filePath: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  try {
    // Remove data URL prefix if present
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');

    // Upload to Cloud Storage
    const file = bucket.file(filePath);
    await file.save(buffer, {
      metadata: {
        contentType,
        metadata: {
          firebaseStorageDownloadTokens: generateDownloadToken(),
        },
      },
    });

    // Make file publicly readable
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new functions.https.HttpsError('internal', 'Failed to upload image');
  }
}

/**
 * Upload image from URL (download and re-upload)
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  filePath: string
): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    const file = bucket.file(filePath);
    await file.save(buffer, {
      metadata: {
        contentType,
        metadata: {
          firebaseStorageDownloadTokens: generateDownloadToken(),
        },
      },
    });

    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    return publicUrl;
  } catch (error) {
    console.error('Error uploading image from URL:', error);
    throw new functions.https.HttpsError('internal', 'Failed to upload image from URL');
  }
}

/**
 * Delete image from Cloud Storage
 */
export async function deleteImage(filePath: string): Promise<void> {
  try {
    const file = bucket.file(filePath);
    const [exists] = await file.exists();

    if (exists) {
      await file.delete();
      console.log(`Deleted image: ${filePath}`);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw error - deletion failure shouldn't block the operation
  }
}

/**
 * Get signed URL for private image access (if needed)
 */
export async function getSignedUrl(
  filePath: string,
  expiresInMinutes: number = 60
): Promise<string> {
  try {
    const file = bucket.file(filePath);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate signed URL');
  }
}

/**
 * Validate image file
 */
export function validateImage(
  base64Data: string,
  maxSizeMB: number = 5
): { valid: boolean; error?: string } {
  // Check if it's a valid base64 image
  const imageRegex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
  if (!imageRegex.test(base64Data)) {
    return { valid: false, error: 'Invalid image format. Supported: JPEG, PNG, GIF, WebP' };
  }

  // Check file size
  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const sizeInBytes = (base64Content.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);

  if (sizeInMB > maxSizeMB) {
    return { valid: false, error: `Image too large. Maximum size: ${maxSizeMB}MB` };
  }

  return { valid: true };
}

/**
 * Get image extension from base64 data
 */
export function getImageExtension(base64Data: string): string {
  const match = base64Data.match(/^data:image\/(\w+);base64,/);
  if (match && match[1]) {
    return match[1] === 'jpeg' ? 'jpg' : match[1];
  }
  return 'jpg';
}

/**
 * Get content type from base64 data
 */
export function getContentType(base64Data: string): string {
  const match = base64Data.match(/^data:(image\/\w+);base64,/);
  if (match && match[1]) {
    return match[1];
  }
  return 'image/jpeg';
}

/**
 * Generate a random download token
 */
function generateDownloadToken(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

// ============================================
// IMAGE PROCESSING (Optional - requires sharp)
// ============================================

/**
 * Resize image (requires 'sharp' package)
 * Uncomment if you want to resize images before uploading
 */
/*
import sharp from 'sharp';

export async function resizeImage(
  buffer: Buffer,
  maxWidth: number = 1200,
  maxHeight: number = 1200
): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch (error) {
    console.error('Error resizing image:', error);
    return buffer; // Return original if resize fails
  }
}
*/
