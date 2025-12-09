/**
 * Agora Token Server - Production Level
 * 
 * This is a secure backend server for generating Agora RTC tokens.
 * Deploy this to a secure backend (Node.js server, Firebase Functions, etc.)
 * 
 * IMPORTANT: Never expose your App Certificate in client-side code!
 */

const express = require('express');
const { RtcTokenBuilder, RtcRole } = require('agora-token');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Environment variables
const APP_ID = process.env.AGORA_APP_ID || '16276327f0ba4a6597c6ee64e4e61a32';
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '912e7657245b4c109e1699f1d9dbb009';
const TOKEN_EXPIRATION_TIME = 86400; // 24 hours in seconds

/**
 * Generate RTC Token Endpoint
 * POST /api/agora/token
 * 
 * Request Body:
 * {
 *   channelName: string,
 *   uid: number (optional, default: 0),
 *   role: number (optional, 1=publisher, 2=subscriber, default: 1)
 * }
 */
app.post('/api/agora/token', (req, res) => {
  try {
    const { channelName, uid = 0, role = 1 } = req.body;

    // Validation
    if (!channelName) {
      return res.status(400).json({
        success: false,
        error: 'Channel name is required'
      });
    }

    // Generate token
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + TOKEN_EXPIRATION_TIME;

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      role === 1 ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
      privilegeExpiredTs
    );

    console.log(`[Token Server] Token generated for channel: ${channelName}`);

    res.json({
      success: true,
      token: token,
      appId: APP_ID,
      channelName: channelName,
      uid: uid,
      expiresAt: privilegeExpiredTs
    });

  } catch (error) {
    console.error('[Token Server] Error generating token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate token'
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Agora Token Server is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * Renew Token Endpoint
 * POST /api/agora/token/renew
 * 
 * Use this to renew an expiring token
 */
app.post('/api/agora/token/renew', (req, res) => {
  try {
    const { channelName, uid = 0 } = req.body;

    if (!channelName) {
      return res.status(400).json({
        success: false,
        error: 'Channel name is required'
      });
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + TOKEN_EXPIRATION_TIME;

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    console.log(`[Token Server] Token renewed for channel: ${channelName}`);

    res.json({
      success: true,
      token: token,
      expiresAt: privilegeExpiredTs
    });

  } catch (error) {
    console.error('[Token Server] Error renewing token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to renew token'
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     🎙️  Agora Token Server - Production Mode           ║
║                                                          ║
║     Status: Running                                      ║
║     Port: ${PORT}                                           ║
║     Time: ${new Date().toISOString()}       ║
║                                                          ║
║     Endpoints:                                           ║
║     - POST /api/agora/token (Generate Token)            ║
║     - POST /api/agora/token/renew (Renew Token)         ║
║     - GET /health (Health Check)                        ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
