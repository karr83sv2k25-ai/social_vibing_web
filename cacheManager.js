import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  USER_PROFILE: 'cache_user_profile_',
  COMMUNITIES: 'cache_communities',
  JOINED_COMMUNITIES: 'cache_joined_communities_',
  COMMUNITY_EVENTS: 'cache_community_events',
  USER_SETTINGS: 'cache_user_settings_',
  POSTS: 'cache_posts',
  LAST_SYNC: 'cache_last_sync_',
};

const CACHE_EXPIRY = {
  USER_PROFILE: 24 * 60 * 60 * 1000, // 24 hours
  COMMUNITIES: 12 * 60 * 60 * 1000, // 12 hours
  COMMUNITY_EVENTS: 6 * 60 * 60 * 1000, // 6 hours
  POSTS: 30 * 60 * 1000, // 30 minutes
  SETTINGS: 7 * 24 * 60 * 60 * 1000, // 7 days
};

class CacheManager {
  /**
   * Save data to cache with timestamp
   */
  async set(key, data, userId = null) {
    try {
      const cacheKey = userId ? `${key}${userId}` : key;
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`✅ Cached: ${cacheKey}`);
      return true;
    } catch (error) {
      console.error(`❌ Cache save error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Get data from cache if not expired
   */
  async get(key, expiryTime, userId = null) {
    try {
      const cacheKey = userId ? `${key}${userId}` : key;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (!cached) {
        console.log(`📦 No cache found: ${cacheKey}`);
        return null;
      }

      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age > expiryTime) {
        console.log(`⏰ Cache expired: ${cacheKey} (${Math.round(age / 1000 / 60)}min old)`);
        await this.remove(key, userId);
        return null;
      }

      console.log(`✅ Cache hit: ${cacheKey} (${Math.round(age / 1000 / 60)}min old)`);
      return data;
    } catch (error) {
      console.error(`❌ Cache read error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove specific cache
   */
  async remove(key, userId = null) {
    try {
      const cacheKey = userId ? `${key}${userId}` : key;
      await AsyncStorage.removeItem(cacheKey);
      console.log(`🗑️  Removed cache: ${cacheKey}`);
      return true;
    } catch (error) {
      console.error(`❌ Cache remove error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all app caches
   */
  async clearAll() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`🗑️  Cleared ${cacheKeys.length} cache entries`);
      return true;
    } catch (error) {
      console.error('❌ Clear all cache error:', error);
      return false;
    }
  }

  /**
   * Get cache age in minutes
   */
  async getCacheAge(key, userId = null) {
    try {
      const cacheKey = userId ? `${key}${userId}` : key;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const { timestamp } = JSON.parse(cached);
      return Math.round((Date.now() - timestamp) / 1000 / 60);
    } catch (error) {
      return null;
    }
  }

  /**
   * Save user profile to cache
   */
  async saveUserProfile(userId, profileData) {
    return this.set(CACHE_KEYS.USER_PROFILE, profileData, userId);
  }

  /**
   * Get cached user profile
   */
  async getUserProfile(userId) {
    return this.get(CACHE_KEYS.USER_PROFILE, CACHE_EXPIRY.USER_PROFILE, userId);
  }

  /**
   * Save communities list to cache
   */
  async saveCommunities(communities) {
    return this.set(CACHE_KEYS.COMMUNITIES, communities);
  }

  /**
   * Get cached communities
   */
  async getCommunities() {
    return this.get(CACHE_KEYS.COMMUNITIES, CACHE_EXPIRY.COMMUNITIES);
  }

  /**
   * Save joined communities to cache
   */
  async saveJoinedCommunities(userId, communities) {
    return this.set(CACHE_KEYS.JOINED_COMMUNITIES, communities, userId);
  }

  /**
   * Get cached joined communities
   */
  async getJoinedCommunities(userId) {
    return this.get(CACHE_KEYS.JOINED_COMMUNITIES, CACHE_EXPIRY.COMMUNITIES, userId);
  }

  /**
   * Save community events to cache
   */
  async saveCommunityEvents(events) {
    return this.set(CACHE_KEYS.COMMUNITY_EVENTS, events);
  }

  /**
   * Get cached community events
   */
  async getCommunityEvents() {
    return this.get(CACHE_KEYS.COMMUNITY_EVENTS, CACHE_EXPIRY.COMMUNITY_EVENTS);
  }

  /**
   * Save user settings to cache
   */
  async saveUserSettings(userId, settings) {
    return this.set(CACHE_KEYS.USER_SETTINGS, settings, userId);
  }

  /**
   * Get cached user settings
   */
  async getUserSettings(userId) {
    return this.get(CACHE_KEYS.USER_SETTINGS, CACHE_EXPIRY.SETTINGS, userId);
  }

  /**
   * Save posts to cache
   */
  async savePosts(posts) {
    return this.set(CACHE_KEYS.POSTS, posts);
  }

  /**
   * Get cached posts
   */
  async getPosts() {
    return this.get(CACHE_KEYS.POSTS, CACHE_EXPIRY.POSTS);
  }

  /**
   * Update last sync timestamp
   */
  async updateLastSync(key, userId = null) {
    const syncKey = userId ? `${CACHE_KEYS.LAST_SYNC}${key}_${userId}` : `${CACHE_KEYS.LAST_SYNC}${key}`;
    await AsyncStorage.setItem(syncKey, Date.now().toString());
  }

  /**
   * Get last sync timestamp
   */
  async getLastSync(key, userId = null) {
    try {
      const syncKey = userId ? `${CACHE_KEYS.LAST_SYNC}${key}_${userId}` : `${CACHE_KEYS.LAST_SYNC}${key}`;
      const timestamp = await AsyncStorage.getItem(syncKey);
      return timestamp ? parseInt(timestamp) : null;
    } catch {
      return null;
    }
  }
}

export default new CacheManager();
export { CACHE_KEYS, CACHE_EXPIRY };
