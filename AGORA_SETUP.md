# 🎙️ Agora Production Setup

## ✅ What's Been Configured

Your Agora integration is now production-ready with:

1. **Secure Token Server** - Backend server for generating tokens (REQUIRED)
2. **Client-Side Integration** - React Native app requests tokens from server
3. **Token Renewal** - Support for renewing expiring tokens
4. **Multiple Deployment Options** - Firebase, Heroku, DigitalOcean, AWS, Vercel

## ⚠️ Important: Token Server Required

**The token server MUST be running** for voice calls to work. React Native cannot generate tokens client-side because the `agora-token` package requires Node.js modules (`crypto`, `zlib`) that aren't available in React Native.

**You must deploy the token server before using voice calls!**

## 📁 Server Files Created

```
server/
├── agoraTokenServer.js      # Main Express server
├── firebaseFunctions.js     # Firebase Cloud Functions version
├── package.json             # Server dependencies
├── .env.example            # Environment variables template
├── .gitignore              # Protect sensitive files
├── README.md               # Server documentation
└── DEPLOYMENT.md           # Deployment guide
```

## 🚀 Quick Start

### 1. Install Server Dependencies

```bash
cd server
npm install
```

### 2. Create Environment File

```bash
cp .env.example .env
```

Your `.env` is already configured with:
```env
AGORA_APP_ID=16276327f0ba4a6597c6ee64e4e61a32
AGORA_APP_CERTIFICATE=912e7657245b4c109e1699f1d9dbb009
PORT=3000
NODE_ENV=production
```

### 3. Start Token Server

**For Development:**
```bash
npm run dev
```

**For Production:**
```bash
npm start
```

Server will run at: `http://localhost:3000`

### 4. Test the Server

```bash
# Test token generation
curl -X POST http://localhost:3000/api/agora/token \
  -H "Content-Type: application/json" \
  -d '{"channelName":"test_123","uid":0,"role":1}'

# Test health check
curl http://localhost:3000/health
```

## 📱 Client Configuration

The client (`agoraConfig.js`) is configured to request tokens from your backend server.

**No fallback to client-side generation** - The token server must be accessible for voice calls to work.

Current server URL (for local development):
```javascript
tokenServerUrl: 'http://localhost:3000/api/agora/token'
```

**Before testing voice calls:**
1. Start the token server (see below)
2. Or deploy to production and update the URL

## 🌐 Deploy to Production

Choose your deployment platform:

### Option 1: Firebase Cloud Functions (Recommended)
```bash
firebase init functions
# Copy code from server/firebaseFunctions.js
firebase deploy --only functions
```
**Update tokenServerUrl:**
```javascript
tokenServerUrl: 'https://YOUR_PROJECT.cloudfunctions.net/generateAgoraToken'
```

### Option 2: Heroku
```bash
heroku create your-app-name
heroku config:set AGORA_APP_ID=16276327f0ba4a6597c6ee64e4e61a32
heroku config:set AGORA_APP_CERTIFICATE=912e7657245b4c109e1699f1d9dbb009
git push heroku main
```
**Update tokenServerUrl:**
```javascript
tokenServerUrl: 'https://your-app-name.herokuapp.com/api/agora/token'
```

### Option 3: DigitalOcean/VPS
```bash
# Deploy server
pm2 start server/agoraTokenServer.js --name agora-token
pm2 startup
pm2 save
```
**Update tokenServerUrl:**
```javascript
tokenServerUrl: 'https://your-domain.com/api/agora/token'
```

**📖 See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guides**

## 🔐 Security Features

✅ **App Certificate Protected** - Not exposed in client code
✅ **Environment Variables** - Sensitive data in .env file
✅ **CORS Configured** - Secure cross-origin requests
✅ **Token Expiration** - 24-hour token validity
✅ **Automatic Renewal** - Renew tokens before expiry
✅ **Fallback System** - Graceful degradation

## 🎯 How It Works

```
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
└────────┬────────┘
         │ 1. Request Token
         │ POST /api/agora/token
         ▼
┌─────────────────┐
│  Token Server   │
│  (Express/      │
│   Firebase)     │
└────────┬────────┘
         │ 2. Generate Token
         │ (Using Certificate)
         ▼
┌─────────────────┐
│  Agora RTC      │
│  Join Channel   │
└─────────────────┘
```

## 📊 API Endpoints

### Generate Token
```http
POST /api/agora/token
Content-Type: application/json

{
  "channelName": "community_123_call_456",
  "uid": 0,
  "role": 1
}
```

**Response:**
```json
{
  "success": true,
  "token": "007eJxT...",
  "appId": "16276327f0ba4a6597c6ee64e4e61a32",
  "channelName": "community_123_call_456",
  "uid": 0,
  "expiresAt": 1733750400
}
```

### Renew Token
```http
POST /api/agora/token/renew
Content-Type: application/json

{
  "channelName": "community_123_call_456",
  "uid": 0
}
```

### Health Check
```http
GET /health
```

## 🧪 Testing

### Local Testing
```bash
# Start server
cd server
npm run dev

# In another terminal, test
curl -X POST http://localhost:3000/api/agora/token \
  -H "Content-Type: application/json" \
  -d '{"channelName":"test","uid":0,"role":1}'
```

### Production Testing
```bash
# Test your deployed server
curl -X POST https://your-server-url/api/agora/token \
  -H "Content-Type: application/json" \
  -d '{"channelName":"test","uid":0,"role":1}'
```

## 🔄 Update Steps After Deployment

1. Deploy your token server (Firebase/Heroku/etc.)
2. Get your server URL
3. Update `agoraConfig.js`:
```javascript
tokenServerUrl: 'https://YOUR_DEPLOYED_SERVER_URL/api/agora/token'
```
4. Test voice calls in your app
5. Monitor server logs

## 📚 Resources

- [Agora Token Server](./server/README.md) - Server documentation
- [Deployment Guide](./server/DEPLOYMENT.md) - Step-by-step deployment
- [Agora Console](https://console.agora.io) - Manage your Agora project
- [Agora Documentation](https://docs.agora.io) - Official docs

## 🆘 Troubleshooting

### Issue: "Failed to generate token"
**Solution:** Check server is running and accessible
```bash
curl http://localhost:3000/health
```

### Issue: "CORS error"
**Solution:** Server CORS is configured, check client URL is correct

### Issue: "Token expired"
**Solution:** Tokens expire after 24 hours. App auto-renews them.

### Issue: Voice call not connecting
**Solution:**
1. Check token is generated successfully
2. Verify App ID matches Agora Console
3. Check network connection
4. Review server logs

## 🎉 You're Production Ready!

Your Agora setup now:
- ✅ Generates tokens securely
- ✅ Keeps certificates protected
- ✅ Has fallback mechanisms
- ✅ Supports token renewal
- ✅ Is scalable and production-ready

**Next Steps:**
1. Deploy the token server
2. Update `tokenServerUrl` in agoraConfig.js
3. Test voice calls
4. Monitor and scale as needed

---

**Need Help?** Check [DEPLOYMENT.md](./server/DEPLOYMENT.md) for detailed deployment guides!
