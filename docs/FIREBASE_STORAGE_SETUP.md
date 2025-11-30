# Firebase Storage Configuration

## Storage Rules Setup

To fix the Firebase Storage error, you need to update your Firebase Storage rules in the Firebase Console.

### Steps:

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: `social-vibing-karr`
3. Navigate to: **Storage** > **Rules**
4. Replace the rules with the following:

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Chat images - allow authenticated users to upload their own images
    match /chat-images/{userId}/{imageId} {
      allow read: if true; // Anyone can read (for displaying in chat)
      allow write: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Profile pictures - allow users to manage their own
    match /profile-pictures/{userId}/{imageId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Post images - allow authenticated users to upload
    match /post-images/{userId}/{imageId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Default - deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

5. Click **Publish**

## CORS Configuration (if needed)

If you still get CORS errors after updating rules, you may need to configure CORS for your storage bucket:

1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
2. Authenticate: `gcloud auth login`
3. Create a `cors.json` file with:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type"]
  }
]
```

4. Apply CORS configuration:
```bash
gsutil cors set cors.json gs://social-vibing-karr.firebasestorage.app
```

## Verification

After updating the rules:
1. Try uploading an image in your app
2. Check the Firebase Console > Storage to see if the image appears
3. The error should be resolved

## Storage Structure

Your storage will be organized as:
```
chat-images/
  {userId}/
    {timestamp}_{random}.jpg
profile-pictures/
  {userId}/
    {timestamp}_{random}.jpg
post-images/
  {userId}/
    {timestamp}_{random}.jpg
```
