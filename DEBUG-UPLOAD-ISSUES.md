# Image Upload Debugging Guide

## Issue: "No file uploaded" (400 Error)

This guide helps debug file upload issues when creating communities or uploading images.

## Recent Fixes Applied

### 1. **Platform-Specific File Handling**
- ✅ Web: Fetches blob from URI and creates proper File object
- ✅ Native: Uses standard React Native format {uri, type, name}

### 2. **Compression Fix**
- ✅ **Disabled compression on web** - ImageManipulator creates `file://` URIs on web that browsers can't access
- ✅ Compression still works on iOS/Android

### 3. **Enhanced Logging**
- ✅ Detailed logs at every step
- ✅ FormData contents logged (web only)
- ✅ Server-side PHP logs enhanced

## Debugging Steps

### Step 1: Check Browser Console
When you try to upload, you should see:
```
📤 Starting image upload... {uri: "blob:http://...", folder: "community_profiles"}
Skipping compression on web platform
Preparing file for upload: {uri: "blob:...", filename: "photo.jpg", mimeType: "image/jpeg", platform: "web"}
✅ Fetched blob: {size: 123456, type: "image/jpeg"}
✅ Created File object: {name: "photo.jpg", size: 123456, type: "image/jpeg"}
FormData contents:
  file: {name: "photo.jpg", size: 123456, type: "image/jpeg"}
  type: image
  folder: community_profiles
  api_key: sk_svapp_M...
📤 Uploading image to Hostinger...
📡 Upload response status: 200
✅ Image uploaded to Hostinger: https://...
```

### Step 2: Check What's Wrong

#### Error: "Cannot access file on web"
**Cause**: The URI is a `file://` path, not a blob
**Fix**: Image compression is creating local files
**Solution**: Already fixed - compression disabled on web

#### Error: "No file uploaded" from server
**Causes**:
1. File object is null/empty
2. FormData not properly formatted
3. PHP upload limits exceeded
4. CORS issues

**Check**:
- FormData contents in console - should show file with size > 0
- Network tab - request should have `multipart/form-data` content type
- Server logs at `hostinger-backend/upload_errors.log`

#### Error: "Failed to fetch file: 404" or "Failed to fetch file: 0"
**Cause**: The blob URI has expired or is invalid
**Solution**: Make sure you're using the image immediately after selection

### Step 3: Server-Side Checks

#### Check PHP Error Log
```bash
# SSH into your Hostinger server
ssh your-username@your-server.com

# Check upload errors
tail -f ~/public_html/upload_errors.log
```

#### Check PHP Configuration
The upload.php script logs:
- POST data
- FILES data
- Raw input (first 500 bytes)
- File details

#### Common PHP Issues

**1. Upload Size Limits**
```ini
upload_max_filesize = 50M
post_max_size = 50M
memory_limit = 128M
```

**2. Permissions**
```bash
chmod 755 ~/public_html/uploads/
```

**3. API Key**
Make sure these match:
- `hostingerConfig.js`: `apiKey: 'sk_svapp_M8nK4xP9wL2vT7hY5jQ3bR6fG1mN0cS'`
- `upload.php`: `define('API_KEY', 'sk_svapp_M8nK4xP9wL2vT7hY5jQ3bR6fG1mN0cS');`

## Testing Upload Manually

### Test with curl
```bash
curl -X POST https://socialvibingapp.karr83anime.com/upload.php \
  -H "X-API-Key: sk_svapp_M8nK4xP9wL2vT7hY5jQ3bR6fG1mN0cS" \
  -F "file=@test-image.jpg" \
  -F "type=image" \
  -F "folder=test" \
  -F "api_key=sk_svapp_M8nK4xP9wL2vT7hY5jQ3bR6fG1mN0cS"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "url": "https://socialvibingapp.karr83anime.com/uploads/images/test/abc123_photo.jpg",
    "filename": "abc123_photo.jpg",
    "size": 123456,
    "type": "image/jpeg",
    "folder": "test",
    "uploaded_at": "2026-01-09 12:00:00"
  },
  "timestamp": 1767976409
}
```

## Quick Fixes

### If still getting "No file uploaded":

1. **Clear browser cache and reload**
   ```
   Ctrl + Shift + R (Windows/Linux)
   Cmd + Shift + R (Mac)
   ```

2. **Check if blob is valid**
   - Try selecting a different image
   - Try a smaller image (< 1MB)

3. **Verify fetch is working**
   Open console and try:
   ```javascript
   fetch('blob:http://localhost:8081/your-blob-id')
     .then(r => r.blob())
     .then(b => console.log('Blob size:', b.size))
   ```

4. **Test API endpoint**
   ```javascript
   fetch('https://socialvibingapp.karr83anime.com/upload.php')
     .then(r => r.json())
     .then(d => console.log('API Info:', d))
   ```

## Contact Support

If issue persists:
1. Copy full console output
2. Copy server logs from `upload_errors.log`
3. Note: Browser, OS, image size, image type
4. Include Network tab screenshot showing the request
