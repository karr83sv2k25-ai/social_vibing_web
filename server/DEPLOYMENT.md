# 🚀 Production Deployment Guide

This guide will help you deploy the Agora Token Server to production.

## 📋 Pre-deployment Checklist

- ✅ Agora App ID configured
- ✅ Agora App Certificate obtained from console
- ✅ Server code tested locally
- ✅ Environment variables prepared
- ✅ Deployment platform chosen

---

## 🎯 Option 1: Firebase Cloud Functions (Recommended)

**Best for:** Apps already using Firebase

### Steps:

1. **Install Firebase CLI**
```bash
npm install -g firebase-tools
```

2. **Login to Firebase**
```bash
firebase login
```

3. **Initialize Functions**
```bash
# In your project root
firebase init functions
```

4. **Setup Dependencies**
```bash
cd functions
npm install agora-token
```

5. **Copy Function Code**
Copy the code from `server/firebaseFunctions.js` to `functions/index.js`

6. **Set Environment Config**
```bash
firebase functions:config:set agora.app_id="16276327f0ba4a6597c6ee64e4e61a32"
firebase functions:config:set agora.app_certificate="912e7657245b4c109e1699f1d9dbb009"
```

7. **Deploy**
```bash
firebase deploy --only functions
```

8. **Get Function URL**
After deployment, you'll get a URL like:
```
https://us-central1-YOUR_PROJECT.cloudfunctions.net/generateAgoraToken
```

9. **Update Client Code**
In `agoraConfig.js`, set:
```javascript
tokenServerUrl: 'https://us-central1-YOUR_PROJECT.cloudfunctions.net/generateAgoraToken'
```

---

## 🎯 Option 2: Heroku

**Best for:** Simple deployment with free tier

### Steps:

1. **Install Heroku CLI**
```bash
npm install -g heroku
```

2. **Login to Heroku**
```bash
heroku login
```

3. **Create Heroku App**
```bash
cd server
heroku create social-vibing-token-server
```

4. **Set Environment Variables**
```bash
heroku config:set AGORA_APP_ID=16276327f0ba4a6597c6ee64e4e61a32
heroku config:set AGORA_APP_CERTIFICATE=912e7657245b4c109e1699f1d9dbb009
heroku config:set NODE_ENV=production
```

5. **Deploy**
```bash
git add .
git commit -m "Deploy Agora token server"
git push heroku main
```

6. **Get Server URL**
```
https://social-vibing-token-server.herokuapp.com
```

7. **Update Client Code**
```javascript
tokenServerUrl: 'https://social-vibing-token-server.herokuapp.com/api/agora/token'
```

---

## 🎯 Option 3: DigitalOcean Droplet

**Best for:** Full control and scalability

### Steps:

1. **Create Droplet**
- Go to DigitalOcean
- Create Ubuntu 22.04 LTS droplet
- Choose at least $6/month plan

2. **SSH into Server**
```bash
ssh root@your-droplet-ip
```

3. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. **Install PM2**
```bash
npm install -g pm2
```

5. **Clone Your Repo**
```bash
cd /var/www
git clone https://github.com/karr83sv2k25-ai/social-vibing-app.git
cd social-vibing-app/server
```

6. **Install Dependencies**
```bash
npm install
```

7. **Create .env File**
```bash
nano .env
```
Add:
```env
AGORA_APP_ID=16276327f0ba4a6597c6ee64e4e61a32
AGORA_APP_CERTIFICATE=912e7657245b4c109e1699f1d9dbb009
PORT=3000
NODE_ENV=production
```

8. **Start with PM2**
```bash
pm2 start agoraTokenServer.js --name agora-token
pm2 startup
pm2 save
```

9. **Install Nginx**
```bash
sudo apt install nginx
```

10. **Configure Nginx**
```bash
sudo nano /etc/nginx/sites-available/default
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

11. **Restart Nginx**
```bash
sudo systemctl restart nginx
```

12. **Setup SSL (Optional but Recommended)**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

13. **Update Client Code**
```javascript
tokenServerUrl: 'https://your-domain.com/api/agora/token'
```

---

## 🎯 Option 4: AWS Lambda + API Gateway

**Best for:** Serverless with AWS ecosystem

### Steps:

1. **Install AWS CLI and SAM**
```bash
pip install awscli
pip install aws-sam-cli
```

2. **Configure AWS Credentials**
```bash
aws configure
```

3. **Create SAM Template**
Create `template.yaml`:
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  AgoraTokenFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: index.handler
      Runtime: nodejs18.x
      Environment:
        Variables:
          AGORA_APP_ID: 16276327f0ba4a6597c6ee64e4e61a32
          AGORA_APP_CERTIFICATE: 912e7657245b4c109e1699f1d9dbb009
      Events:
        AgoraToken:
          Type: Api
          Properties:
            Path: /api/agora/token
            Method: post
```

4. **Deploy**
```bash
sam build
sam deploy --guided
```

5. **Get API URL**
After deployment, you'll get an API Gateway URL

6. **Update Client Code**
```javascript
tokenServerUrl: 'https://your-api-id.execute-api.region.amazonaws.com/prod/api/agora/token'
```

---

## 🎯 Option 5: Vercel/Netlify Functions

**Best for:** Serverless with simple deployment

### Vercel:

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Create `api/agora-token.js`**
```javascript
const { RtcTokenBuilder, RtcRole } = require('agora-token');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { channelName, uid = 0, role = 1 } = req.body;

  const APP_ID = process.env.AGORA_APP_ID;
  const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
  
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + 86400;

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    role === 1 ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
    privilegeExpiredTs
  );

  res.json({ success: true, token });
};
```

3. **Deploy**
```bash
vercel
```

4. **Set Environment Variables in Vercel Dashboard**

5. **Update Client Code**
```javascript
tokenServerUrl: 'https://your-project.vercel.app/api/agora-token'
```

---

## 🧪 Testing Your Deployment

### Test Token Generation

```bash
curl -X POST https://your-server-url/api/agora/token \
  -H "Content-Type: application/json" \
  -d '{
    "channelName": "test_channel_123",
    "uid": 0,
    "role": 1
  }'
```

Expected Response:
```json
{
  "success": true,
  "token": "007eJxT...",
  "appId": "16276327f0ba4a6597c6ee64e4e61a32",
  "channelName": "test_channel_123",
  "uid": 0,
  "expiresAt": 1733750400
}
```

### Test Health Endpoint

```bash
curl https://your-server-url/health
```

---

## 🔒 Security Checklist

- ✅ App Certificate NOT in client code
- ✅ HTTPS enabled (SSL certificate)
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ Environment variables secured
- ✅ Server logs monitored
- ✅ Authentication added (optional)

---

## 📊 Monitoring

### Firebase Functions
- View logs: `firebase functions:log`
- Dashboard: Firebase Console → Functions

### Heroku
- View logs: `heroku logs --tail`
- Dashboard: Heroku Dashboard → Metrics

### DigitalOcean
- PM2 monitoring: `pm2 monit`
- Nginx logs: `/var/log/nginx/`

### AWS Lambda
- CloudWatch Logs
- AWS Console → Lambda → Monitor

---

## 🆘 Troubleshooting

### Issue: Token generation fails

**Solution:**
1. Check App Certificate is correct
2. Verify environment variables are set
3. Check server logs for errors
4. Test with Postman/curl

### Issue: CORS errors

**Solution:**
Add CORS headers:
```javascript
res.set('Access-Control-Allow-Origin', '*');
res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.set('Access-Control-Allow-Headers', 'Content-Type');
```

### Issue: Token expires too quickly

**Solution:**
Increase `TOKEN_EXPIRATION_TIME` in server code:
```javascript
const TOKEN_EXPIRATION_TIME = 86400 * 7; // 7 days
```

---

## 🎉 Success!

Once deployed, your app will:
- ✅ Generate tokens securely from backend
- ✅ Keep certificates protected
- ✅ Scale automatically
- ✅ Be production-ready

Remember to update `tokenServerUrl` in `agoraConfig.js` with your deployed server URL!
