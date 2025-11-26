import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth, connectAuthEmulator } from "firebase/auth";
import { initializeFirestore, getFirestore, CACHE_SIZE_UNLIMITED, persistentLocalCache, enableNetwork, connectFirestoreEmulator } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Support both development (expo go) and production (standalone build)
const extra = Constants.expoConfig?.extra || Constants.manifest?.extra || {};

const firebaseConfig = {
  apiKey: extra.FIREBASE_API_KEY,
  authDomain: extra.FIREBASE_AUTH_DOMAIN,
  projectId: extra.FIREBASE_PROJECT_ID,
  storageBucket: extra.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: extra.FIREBASE_MESSAGING_SENDER_ID,
  appId: extra.FIREBASE_APP_ID,
};

// Validate Firebase config
const requiredFields = ['apiKey', 'projectId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length > 0) {
  console.error('❌ Missing Firebase config fields:', missingFields);
  throw new Error(`Firebase config incomplete. Missing: ${missingFields.join(', ')}`);
}

// Log config for debugging (remove sensitive data in production)
console.log('🔥 Firebase Config Loaded:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
});

// ✅ Initialize app only once (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

console.log('✅ Firebase App initialized');

// ✅ Initialize Auth with AsyncStorage persistence (must be done before getAuth is ever called)
let auth;
if (getApps().length === 1) {
  // First time initialization
  console.log('🔄 Initializing Auth with AsyncStorage...');
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
  console.log('✅ Auth initialized with AsyncStorage persistence');
} else {
  // App already initialized, get existing auth
  auth = getAuth(app);
  console.log('✅ Using existing Auth instance');
}

// ✅ Initialize Firestore with proper settings for React Native/Expo (singleton)
let db;
try {
  db = getFirestore(app);
  console.log('✅ Using existing Firestore instance');
} catch (error) {
  console.log('🔄 Initializing new Firestore instance...');
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    }),
    experimentalForceLongPolling: true, // Required for React Native/Expo
    experimentalAutoDetectLongPolling: false,
  });
  console.log('✅ Firestore initialized with long-polling');
}

// Enable network on init with better error handling
enableNetwork(db)
  .then(() => {
    console.log('✅ Firestore network enabled');
  })
  .catch(err => {
    console.warn('⚠️  Firestore network could not be enabled (error:', err.code, ')');
    console.log('📴 App will work in offline mode with cached data');
  });

// Add a global error handler for auth
auth.onAuthStateChanged(
  (user) => {
    if (user) {
      console.log('👤 User authenticated:', user.uid);
    } else {
      console.log('👤 No user authenticated');
    }
  },
  (error) => {
    console.error('❌ Auth state change error:', error);
  }
);

console.log('✅ Firebase initialization complete');

export { app, auth, db };

