# Agora Token Server

Production-level secure token server for Agora RTC.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Setup

Create a `.env` file in the `server` directory:

```env
AGORA_APP_ID=16276327f0ba4a6597c6ee64e4e61a32
AGORA_APP_CERTIFICATE=912e7657245b4c109e1699f1d9dbb009
PORT=3000
NODE_ENV=production
```

### 3. Run the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## 📡 API Endpoints

### Generate Token
```http
POST /api/agora/token
Content-Type: application/json

{
  "channelName": "community_123_room_456",
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
  "channelName": "community_123_room_456",
  "uid": 0,
  "expiresAt": 1733750400
}
```

### Renew Token
```http
POST /api/agora/token/renew
Content-Type: application/json

{
  "channelName": "community_123_room_456",
  "uid": 0
}
```

### Health Check
```http
GET /health
```

## 🔐 Security Best Practices

1. **Never expose App Certificate in client code**
2. **Use environment variables** for sensitive data
3. **Implement authentication** before generating tokens
4. **Add rate limiting** to prevent abuse
5. **Use HTTPS** in production
6. **Validate channel names** to prevent unauthorized access

## 🌐 Deployment Options

### Option 1: Firebase Functions (Recommended for Firebase Apps)

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Initialize Firebase Functions:
```bash
firebase init functions
```

3. Copy `agoraTokenServer.js` logic to `functions/index.js`

4. Deploy:
```bash
firebase deploy --only functions
```

### Option 2: Heroku

1. Create Heroku app:
```bash
heroku create your-agora-token-server
```

2. Set environment variables:
```bash
heroku config:set AGORA_APP_ID=your_app_id
heroku config:set AGORA_APP_CERTIFICATE=your_certificate
```

3. Deploy:
```bash
git push heroku main
```

### Option 3: AWS Lambda

1. Use AWS SAM or Serverless Framework
2. Package the function
3. Deploy to Lambda with API Gateway

### Option 4: DigitalOcean/VPS

1. Set up Node.js server
2. Install PM2 for process management:
```bash
npm install -g pm2
pm2 start server/agoraTokenServer.js --name agora-token-server
pm2 startup
pm2 save
```

3. Configure Nginx as reverse proxy

### Option 5: Vercel/Netlify Functions

Convert to serverless function format and deploy.

## 📱 Client Integration

Update `agoraConfig.js`:

```javascript
export async function generateAgoraToken(channelName, uid = 0, role = 1) {
  try {
    const response = await fetch('https://your-server.com/api/agora/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channelName,
        uid,
        role
      })
    });

    const data = await response.json();
    
    if (data.success) {
      return data.token;
    } else {
      console.error('Token generation failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('Error fetching token:', error);
    return null;
  }
}
```

## 🔧 Advanced Configuration

### Add Authentication

```javascript
const authenticateUser = (req, res, next) => {
  const authToken = req.headers.authorization;
  
  if (!authToken || !isValidToken(authToken)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }
  
  next();
};

app.post('/api/agora/token', authenticateUser, (req, res) => {
  // ... token generation logic
});
```

### Add Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/agora/', limiter);
```

### Add Logging

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 🧪 Testing

```bash
# Test token generation
curl -X POST http://localhost:3000/api/agora/token \
  -H "Content-Type: application/json" \
  -d '{"channelName":"test_channel","uid":0,"role":1}'

# Test health check
curl http://localhost:3000/health
```

## 📊 Monitoring

Monitor your token server:
- Request count
- Error rate
- Response time
- Token generation failures

Use tools like:
- New Relic
- DataDog
- Application Insights
- CloudWatch (AWS)

## 🆘 Troubleshooting

**Problem:** "Failed to generate token"
- Check App ID and Certificate are correct
- Verify environment variables are set
- Check server logs for detailed errors

**Problem:** "Token expired"
- Tokens expire after 24 hours by default
- Implement token renewal on the client side
- Use the `/api/agora/token/renew` endpoint

**Problem:** "Connection failed"
- Verify server is running and accessible
- Check CORS settings
- Ensure firewall allows connections

## 📝 License

MIT License - Feel free to use in your projects!
