/**
 * Hostinger Upload Configuration
 * 
 * Upload images, videos, and audio to your Hostinger server
 */

import { Platform } from 'react-native';

// Optional import - gracefully handles when package is not available
let ImageManipulator = null;
try {
  ImageManipulator = require('expo-image-manipulator');
} catch (error) {
  console.log('expo-image-manipulator not available, image compression disabled');
}

// ⚠️ IMPORTANT: Update these values with your actual Hostinger details
export const hostingerConfig = {
  // Your domain where upload.php is hosted
  uploadUrl: 'https://socialvibingapp.karr83anime.com/upload.php',

  // API key for security (must match upload.php)
  apiKey: 'sk_svapp_M8nK4xP9wL2vT7hY5jQ3bR6fG1mN0cS',

  // Base URL for uploaded files
  baseUrl: 'https://socialvibingapp.karr83anime.com/uploads/',

  // Max file sizes (must match PHP settings)
  maxImageSize: 10 * 1024 * 1024, // 10MB
  maxVideoSize: 50 * 1024 * 1024, // 50MB
  maxAudioSize: 20 * 1024 * 1024, // 20MB
  maxFileSize: 50 * 1024 * 1024, // 50MB for documents/files
};

/**
 * Convert file URI to proper format for upload
 * @param {string} uri - File URI
 * @param {string} filename - Filename
 * @param {string} mimeType - MIME type
 * @returns {Promise<Object>} - File object for FormData
 */
const prepareFileForUpload = async (uri, filename, mimeType) => {
  try {
    console.log('Preparing file for upload:', { uri, filename, mimeType, platform: Platform.OS });

    // For web platform, fetch the file and create a blob
    if (Platform.OS === 'web') {
      try {
        // Handle both blob: and http: URIs on web
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status}`);
        }
        const blob = await response.blob();
        console.log('✅ Fetched blob:', { size: blob.size, type: blob.type });

        // Create a File object with proper metadata
        const file = new File([blob], filename, { type: mimeType });
        console.log('✅ Created File object:', { name: file.name, size: file.size, type: file.type });
        return file;
      } catch (fetchError) {
        console.error('❌ Failed to fetch/prepare file on web:', fetchError);
        throw new Error(`Cannot access file on web: ${fetchError.message}`);
      }
    }

    // For React Native (iOS/Android), use the standard format
    const fileObject = {
      uri: uri,
      type: mimeType,
      name: filename,
    };
    console.log('✅ Created file object for native:', fileObject);
    return fileObject;
  } catch (error) {
    console.error('❌ Error preparing file for upload:', error);
    throw error;
  }
};

/**
 * Compress and resize image for faster upload
 * @param {string} uri - Image URI
 * @returns {Promise<string>} - Compressed image URI
 */
const compressImage = async (uri) => {
  try {
    // Skip compression on web - it creates file:// URIs that browsers can't access
    if (Platform.OS === 'web') {
      console.log('Skipping compression on web platform');
      return uri;
    }

    // Check if ImageManipulator is available
    if (!ImageManipulator || !ImageManipulator.manipulateAsync) {
      console.log('ImageManipulator not available, using original image');
      return uri;
    }

    // Resize to max 1920x1080 (maintains aspect ratio) and compress
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1920 } }], // Resize width to max 1920px, height auto-scales
      {
        compress: 0.6, // 60% quality - good balance between quality and size
        format: ImageManipulator.SaveFormat?.JPEG || 'jpeg'
      }
    );

    console.log('✅ Image compressed from', uri, 'to', manipResult.uri);
    return manipResult.uri;
  } catch (error) {
    console.log('Image compression failed, using original:', error);
    return uri; // Return original if compression fails
  }
};

/**
 * Upload image to Hostinger
 * @param {string} uri - Local file URI from ImagePicker
 * @param {string} folder - Optional folder name (e.g., 'profiles', 'chat_images')
 * @returns {Promise<string>} - URL of uploaded file
 */
export const uploadImageToHostinger = async (uri, folder = 'general') => {
  try {
    console.log('📤 Starting image upload...', { uri, folder });

    // Compress image before upload for faster transmission
    const compressedUri = await compressImage(uri);

    // Create form data
    const formData = new FormData();

    // Extract filename from URI
    const filename = compressedUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // Prepare file for upload (handles web vs native differences)
    const fileObject = await prepareFileForUpload(compressedUri, filename, type);

    formData.append('file', fileObject);
    formData.append('type', 'image');
    formData.append('folder', folder);
    formData.append('api_key', hostingerConfig.apiKey);

    // Debug: Log FormData contents (for web only, as native doesn't support iteration)
    if (Platform.OS === 'web') {
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}:`, { name: value.name, size: value.size, type: value.type });
        } else {
          console.log(`  ${key}:`, value);
        }
      }
    }

    console.log('📤 Uploading image to Hostinger...', {
      folder,
      filename,
      mimeType: type,
      platform: Platform.OS,
      apiKey: hostingerConfig.apiKey.substring(0, 10) + '...'
    });

    // Upload to Hostinger
    const response = await fetch(hostingerConfig.uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'X-API-Key': hostingerConfig.apiKey,
      },
    });

    console.log('📡 Upload response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload failed:', response.status, errorText);
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('📦 Upload response data:', data);

    if (!data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    console.log('✅ Image uploaded to Hostinger:', data.data.url);
    return data.data.url;
  } catch (error) {
    console.error('❌ Error uploading image to Hostinger:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      uri: uri
    });
    throw error;
  }
};

/**
 * Upload video to Hostinger
 * @param {string} uri - Local file URI from ImagePicker
 * @param {string} folder - Optional folder name (e.g., 'chat_videos', 'posts')
 * @returns {Promise<string>} - URL of uploaded file
 */
export const uploadVideoToHostinger = async (uri, folder = 'general') => {
  try {
    console.log('📤 Starting video upload...', { uri, folder });

    const formData = new FormData();

    const filename = uri.split('/').pop() || 'video.mp4';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `video/${match[1]}` : 'video/mp4';

    // Prepare file for upload (handles web vs native differences)
    const fileObject = await prepareFileForUpload(uri, filename, type);

    formData.append('file', fileObject);
    formData.append('type', 'video');
    formData.append('folder', folder);
    formData.append('api_key', hostingerConfig.apiKey);

    console.log('📤 Uploading video to Hostinger...', { folder, filename, mimeType: type });

    const response = await fetch(hostingerConfig.uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'X-API-Key': hostingerConfig.apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed:', errorText);
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    console.log('✅ Video uploaded to Hostinger:', data.data.url);
    return data.data.url;
  } catch (error) {
    console.error('❌ Error uploading video to Hostinger:', error);
    throw error;
  }
};

/**
 * Upload audio to Hostinger
 * @param {string} uri - Local file URI
 * @param {string} folder - Optional folder name (e.g., 'voice_messages')
 * @returns {Promise<string>} - URL of uploaded file
 */
export const uploadAudioToHostinger = async (uri, folder = 'general') => {
  try {
    console.log('📤 Starting audio upload...', { uri, folder });

    const formData = new FormData();

    const filename = uri.split('/').pop() || 'audio.m4a';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `audio/${match[1]}` : 'audio/m4a';

    // Prepare file for upload (handles web vs native differences)
    const fileObject = await prepareFileForUpload(uri, filename, type);

    formData.append('file', fileObject);
    formData.append('type', 'audio');
    formData.append('folder', folder);
    formData.append('api_key', hostingerConfig.apiKey);

    console.log('📤 Uploading audio to Hostinger...', { folder, filename, mimeType: type });

    const response = await fetch(hostingerConfig.uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'X-API-Key': hostingerConfig.apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed:', errorText);
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    console.log('✅ Audio uploaded to Hostinger:', data.data.url);
    return data.data.url;
  } catch (error) {
    console.error('❌ Error uploading audio to Hostinger:', error);
    throw error;
  }
};

/**
 * Check file size before upload
 * @param {string} uri - Local file URI
 * @param {string} type - File type (image/video/audio)
 * @returns {Promise<boolean>} - True if size is acceptable
 */
export const checkFileSize = async (uri, type = 'image') => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const size = blob.size;

    const maxSize = {
      image: hostingerConfig.maxImageSize,
      video: hostingerConfig.maxVideoSize,
      audio: hostingerConfig.maxAudioSize,
    }[type];

    if (size > maxSize) {
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
      const fileSizeMB = (size / 1024 / 1024).toFixed(1);
      throw new Error(`File size (${fileSizeMB}MB) exceeds ${maxSizeMB}MB limit for ${type}`);
    }

    return true;
  } catch (error) {
    console.error('Error checking file size:', error);
    throw error;
  }
};

/**
 * Test connection to Hostinger upload API
 * @returns {Promise<boolean>} - True if API is accessible
 */
export const testHostingerConnection = async () => {
  try {
    const response = await fetch(hostingerConfig.uploadUrl, {
      method: 'GET',
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Hostinger API is accessible:', data.data.message);
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Cannot connect to Hostinger API:', error);
    return false;
  }
};
