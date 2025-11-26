# Hostinger Backend - Media Upload API

This folder contains the PHP backend for uploading media files to your Hostinger server.

## 📁 Files

- `upload.php` - Main upload API endpoint
- `.htaccess` - Server configuration (upload limits, CORS, security)

## 🚀 Quick Setup

### 1. Upload to Hostinger

Upload these files to your Hostinger hosting:

```
public_html/
├── upload.php
├── .htaccess
└── uploads/         ← Create this folder (chmod 755)
```

### 2. Configure upload.php

Open `upload.php` and update:

```php
// Line 20: Your domain
define('BASE_URL', 'https://yourdomain.com/uploads/');

// Line 26: Your API key (keep this secret!)
define('API_KEY', 'your-secret-api-key-12345');
```

### 3. Create Uploads Folder

Via FTP or File Manager:
1. Create `uploads/` folder in `public_html/`
2. Set permissions to `755`
3. The API will auto-create subfolders

### 4. Test the API

Visit: `https://yourdomain.com/upload.php`

Expected response:
```json
{
  "success": true,
  "data": {
    "message": "Hostinger Media Upload API",
    "version": "1.0.0"
  }
}
```

## 🧪 Testing Upload

### cURL Test

```bash
curl -X POST https://yourdomain.com/upload.php \
  -F "file=@test-image.jpg" \
  -F "type=image" \
  -F "folder=test" \
  -F "api_key=your-secret-api-key-12345"
```

### Postman Test

1. Method: `POST`
2. URL: `https://yourdomain.com/upload.php`
3. Body → form-data:
   - `file` → Select file
   - `type` → `image`
   - `folder` → `test`
   - `api_key` → Your API key

## 📊 Folder Structure

After first upload:

```
uploads/
├── images/
│   ├── general/
│   ├── chat_images/
│   ├── community_profiles/
│   ├── community_covers/
│   └── roleplay_characters/
├── videos/
│   └── chat_videos/
└── audio/
    └── voice_messages/
```

## 🔒 Security

### API Key Protection

The API requires an API key to prevent unauthorized uploads.

**Set in upload.php**:
```php
define('API_KEY', 'your-unique-secret-key');
```

**Send from app**:
```javascript
// Header method
headers: {
  'X-API-Key': 'your-unique-secret-key'
}

// Or POST parameter
formData.append('api_key', 'your-unique-secret-key');
```

### File Type Restrictions

Only these file types are allowed:

**Images**: JPEG, PNG, GIF, WebP  
**Videos**: MP4, MOV, AVI, WebM  
**Audio**: MP3, WAV, M4A, AAC

### File Size Limits

- Images: 10MB max
- Videos: 50MB max
- Audio: 20MB max

Adjust in `.htaccess` if needed.

## ⚠️ Common Issues

### 413 Request Entity Too Large

**Solution**: Increase limits in `.htaccess`:
```apache
php_value upload_max_filesize 50M
php_value post_max_size 50M
```

### 403 Forbidden

**Solution**: Check folder permissions:
```bash
chmod 755 uploads/
```

### CORS Error

**Solution**: Verify CORS headers in `upload.php`:
```php
header('Access-Control-Allow-Origin: *');
```

For production, use specific domain:
```php
header('Access-Control-Allow-Origin: https://yourdomain.com');
```

### File Uploads but Returns Broken Link

**Solution**: Verify `BASE_URL` matches your domain:
```php
define('BASE_URL', 'https://yourdomain.com/uploads/');
```

## 📈 Monitoring

### Check Storage Usage

Via SSH:
```bash
du -sh uploads/
```

Via cPanel:
- **File Manager** → Select `uploads/` → Properties

### View Recent Uploads

```bash
ls -lt uploads/images/chat_images/ | head -10
```

## 🗑️ Cleanup (Optional)

Create `cleanup.php` to remove old files:

```php
<?php
// Delete files older than 30 days
$folder = __DIR__ . '/uploads/';
$days = 30;
$cutoff = time() - ($days * 86400);

$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($folder)
);

foreach ($iterator as $file) {
    if ($file->isFile() && $file->getMTime() < $cutoff) {
        unlink($file->getRealPath());
    }
}

echo "Cleanup complete!";
?>
```

Run via cron job monthly.

## 📞 Support

For issues:
1. Check error logs in cPanel
2. Enable error display in `upload.php`:
   ```php
   error_reporting(E_ALL);
   ini_set('display_errors', 1);
   ```
3. Test with cURL to isolate issue

## ✅ Deployment Checklist

- [ ] Upload `upload.php` to Hostinger
- [ ] Upload `.htaccess` to Hostinger
- [ ] Create `uploads/` folder (chmod 755)
- [ ] Update `BASE_URL` in upload.php
- [ ] Set strong `API_KEY` in upload.php
- [ ] Test with browser (GET request)
- [ ] Test with cURL (POST request)
- [ ] Verify uploaded file is accessible
- [ ] Update `hostingerConfig.js` in React Native app
- [ ] Test from app

Done! 🎉
