// Agora RTC Configuration - Production Mode
// Get your App ID from: https://console.agora.io

export const AGORA_CONFIG = {
  // App ID from Agora Console - Social_Vibing Project
  appId: '16276327f0ba4a6597c6ee64e4e61a32',
  
  // Primary Certificate for token generation (Production Mode)
  primaryCertificate: '912e7657245b4c109e1699f1d9dbb009',
  
  // Secondary Certificate (Backup)
  secondaryCertificate: '79cc87577d7d4e0baf468e37a8ad543f',
  
  // Channel configuration
  channelProfile: 0, // 0 = Communication (for calls)
  
  // Audio profile for high quality voice
  audioProfile: 5, // Music standard (48kHz, full band, stereo)
  audioScenario: 1, // Default scenario
  
  // Token expiration time (24 hours in seconds)
  tokenExpirationTime: 86400,
};

/**
 * Generate unique channel name from communityId and roomId
 */
export function generateChannelName(communityId, roomId) {
  return `${communityId}_${roomId}`;
}

/**
 * Generate Agora RTC Token
 * Note: In production, tokens should be generated on a secure backend server
 * This is a client-side implementation for development purposes
 * 
 * For production, use the Agora Token Server:
 * https://github.com/AgoraIO/Tools/tree/master/DynamicKey/AgoraDynamicKey
 */
export async function generateAgoraToken(channelName, uid = 0, role = 1) {
  try {
    // In production, call your backend token server
    // Example: const response = await fetch('https://your-server.com/api/agora/token', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ channelName, uid, role })
    // });
    // return response.json().token;
    
    // For now, we'll use the agora-token package
    const { RtcTokenBuilder, RtcRole } = require('agora-token');
    
    const appId = AGORA_CONFIG.appId;
    const appCertificate = AGORA_CONFIG.primaryCertificate;
    const expirationTimeInSeconds = AGORA_CONFIG.tokenExpirationTime;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    // Build token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role === 1 ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
      privilegeExpiredTs
    );
    
    return token;
  } catch (error) {
    console.error('Error generating Agora token:', error);
    // Fallback: return null and handle in calling code
    return null;
  }
}

