/**
 * Hostinger Upload Configuration
 * 
 * Upload images, videos, and audio to your Hostinger server
 */

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
};

/**
 * Upload image to Hostinger
 * @param {string} uri - Local file URI from ImagePicker
 * @param {string} folder - Optional folder name (e.g., 'profiles', 'chat_images')
 * @returns {Promise<string>} - URL of uploaded file
 */
export const uploadImageToHostinger = async (uri, folder = 'general') => {
  try {
    // Create form data
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('file', {
      uri,
      type,
      name: filename || 'photo.jpg',
    });
    
    formData.append('type', 'image');
    formData.append('folder', folder);
    formData.append('api_key', hostingerConfig.apiKey);

    // Upload to Hostinger
    const response = await fetch(hostingerConfig.uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
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

    console.log('✅ Image uploaded to Hostinger:', data.data.url);
    return data.data.url;
  } catch (error) {
    console.error('❌ Error uploading image to Hostinger:', error);
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
    const formData = new FormData();
    
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `video/${match[1]}` : 'video/mp4';
    
    formData.append('file', {
      uri,
      type,
      name: filename || 'video.mp4',
    });
    
    formData.append('type', 'video');
    formData.append('folder', folder);
    formData.append('api_key', hostingerConfig.apiKey);

    const response = await fetch(hostingerConfig.uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
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
    const formData = new FormData();
    
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `audio/${match[1]}` : 'audio/m4a';
    
    formData.append('file', {
      uri,
      type,
      name: filename || 'audio.m4a',
    });
    
    formData.append('type', 'audio');
    formData.append('folder', folder);
    formData.append('api_key', hostingerConfig.apiKey);

    const response = await fetch(hostingerConfig.uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
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
