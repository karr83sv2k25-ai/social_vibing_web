/**
 * Message Cache Manager
 * 
 * Handles caching of messages and conversations to improve performance
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  CONVERSATIONS: 'cached_conversations',
  MESSAGES: 'cached_messages_',
  USERS: 'cached_users',
  LAST_SYNC: 'last_sync_',
};

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Save conversations to cache
 */
export const cacheConversations = async (conversations) => {
  try {
    await AsyncStorage.setItem(
      CACHE_KEYS.CONVERSATIONS,
      JSON.stringify({
        data: conversations,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error('Error caching conversations:', error);
  }
};

/**
 * Get cached conversations
 */
export const getCachedConversations = async () => {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.CONVERSATIONS);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    
    // Return cached data regardless of age - it will be updated in background
    return data;
  } catch (error) {
    console.error('Error getting cached conversations:', error);
    return null;
  }
};

/**
 * Save messages for a conversation to cache
 */
export const cacheMessages = async (conversationId, messages) => {
  try {
    await AsyncStorage.setItem(
      `${CACHE_KEYS.MESSAGES}${conversationId}`,
      JSON.stringify({
        data: messages,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error('Error caching messages:', error);
  }
};

/**
 * Get cached messages for a conversation
 */
export const getCachedMessages = async (conversationId) => {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_KEYS.MESSAGES}${conversationId}`);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    
    // Return cached data regardless of age
    return data;
  } catch (error) {
    console.error('Error getting cached messages:', error);
    return null;
  }
};

/**
 * Cache user data
 */
export const cacheUsers = async (users) => {
  try {
    await AsyncStorage.setItem(
      CACHE_KEYS.USERS,
      JSON.stringify({
        data: users,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error('Error caching users:', error);
  }
};

/**
 * Get cached users
 */
export const getCachedUsers = async () => {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.USERS);
    if (!cached) return null;

    const { data } = JSON.parse(cached);
    return data;
  } catch (error) {
    console.error('Error getting cached users:', error);
    return null;
  }
};

/**
 * Clear all message cache
 */
export const clearMessageCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const messageKeys = keys.filter(key => 
      key.startsWith(CACHE_KEYS.MESSAGES) || 
      key === CACHE_KEYS.CONVERSATIONS ||
      key === CACHE_KEYS.USERS
    );
    await AsyncStorage.multiRemove(messageKeys);
  } catch (error) {
    console.error('Error clearing message cache:', error);
  }
};
