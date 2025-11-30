// Agora RTC Configuration
// Get your FREE App ID from: https://console.agora.io

export const AGORA_CONFIG = {
  // App ID from Agora Console - Social_Vibing Project
  appId: '16276327f0ba4a6597c6ee64e4e61a32',
  
  // Token for channel "testing"
  token: '007eJxTYBA/LlujJLQ49eF3+aia2XHFbUv94nfw3FKpvdcfEPHkY6cCg6GZkbmZsZF5mkFSokmimamlebJZaqqZSapJqplhorFRXrdmZkMgI8NOmzXMjAwQCOKzM5SkFpdk5qUzMAAAa2wf9g==',
  
  // Channel configuration
  channelProfile: 0, // 0 = Communication (for calls)
  
  // Audio profile for high quality voice
  audioProfile: 5, // Music standard (48kHz, full band, stereo)
  audioScenario: 1, // Default scenario
};

/**
 * Generate channel name from communityId and roomId
 * Using fixed channel name "testing" to match the token
 */
export function generateChannelName(communityId, roomId) {
  // Fixed channel name for testing with token
  return 'testing';
}

