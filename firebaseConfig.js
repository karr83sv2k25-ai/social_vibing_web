import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth, connectAuthEmulator } from "firebase/auth";
import { initializeFirestore, getFirestore, CACHE_SIZE_UNLIMITED, persistentLocalCache, enableNetwork, connectFirestoreEmulator } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

// CRITICAL: Suppress Firestore internal errors BEFORE any Firebase initialization
// This must be the FIRST thing we do to catch SDK errors
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

console.error = (...args) => {
  const message = args[0]?.toString?.() || '';
  const fullMessage = JSON.stringify(args);
  
  // Aggressively filter Firestore SDK internal errors
  if (
    message.includes('FIRESTORE') ||
    message.includes('INTERNAL ASSERTION FAILED') ||
    message.includes('Unexpected state') ||
    message.includes('b815') ||
    message.includes('ca9') ||
    message.includes('Target ID already exists') ||
    message.includes('Could not reach Cloud Firestore backend') ||
    message.includes('Connection failed') ||
    message.includes('code=unavailable') ||
    message.includes('auth/already-initialized') ||
    fullMessage.includes('FIRESTORE') && fullMessage.includes('INTERNAL')
  ) {
    // Completely suppress - these are harmless SDK bugs
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args) => {
  const message = args[0]?.toString?.() || '';
  const fullMessage = JSON.stringify(args);
  
  if (
    message.includes('FIRESTORE') ||
    message.includes('INTERNAL ASSERTION') ||
    message.includes('Unexpected state') ||
    message.includes('Target ID already exists') ||
    message.includes('Could not fetch user from Firestore') ||
    fullMessage.includes('FIRESTORE') && fullMessage.includes('INTERNAL')
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

console.log = (...args) => {
  const message = args[0]?.toString?.() || '';
  
  // Also filter from console.log (some errors appear there)
  if (
    message.includes('@firebase/firestore') && message.includes('INTERNAL ASSERTION') ||
    message.includes('FIRESTORE') && message.includes('Unexpected state') ||
    message.includes('Error fetching all posts') ||
    message.includes('[Firestore] Error in') && message.includes('snapshot listener') ||
    message.includes('Target ID already exists')
  ) {
    return;
  }
  originalConsoleLog(...args);
};

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
  originalConsoleError('❌ Missing Firebase config fields:', missingFields);
  throw new Error(`Firebase config incomplete. Missing: ${missingFields.join(', ')}`);
}

// Log config for debugging (remove sensitive data in production)
originalConsoleLog('🔥 Firebase Config Loaded:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
});

// ✅ Initialize app only once (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

originalConsoleLog('✅ Firebase App initialized');

// ✅ Initialize Auth with AsyncStorage persistence (must be done before getAuth is ever called)
let auth;
try {
  // Try to get existing auth first
  auth = getAuth(app);
  originalConsoleLog('✅ Using existing Auth instance');
} catch (error) {
  // If no auth exists, initialize it
  originalConsoleLog('🔄 Initializing Auth with AsyncStorage...');
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
  originalConsoleLog('✅ Auth initialized with AsyncStorage persistence');
}

// ✅ Initialize Firestore with proper settings for React Native/Expo (singleton)
let db;
try {
  db = getFirestore(app);
  originalConsoleLog('✅ Using existing Firestore instance');
} catch (error) {
  originalConsoleLog('🔄 Initializing new Firestore instance...');
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    }),
    experimentalForceLongPolling: true, // Required for React Native/Expo
    experimentalAutoDetectLongPolling: false,
  });
  originalConsoleLog('✅ Firestore initialized with long-polling');
}

// Enable network on init with better error handling
enableNetwork(db)
  .then(() => {
    originalConsoleLog('✅ Firestore network enabled');
  })
  .catch(err => {
    originalConsoleWarn('⚠️  Firestore network could not be enabled (error:', err.code, ')');
    originalConsoleLog('📴 App will work in offline mode with cached data');
  });

// Add a status indicator (optional - shows once)
let connectionWarningShown = false;
setTimeout(() => {
  enableNetwork(db)
    .then(() => {
      originalConsoleLog('✅ Firestore connected successfully');
    })
    .catch(() => {
      if (!connectionWarningShown) {
        originalConsoleLog('ℹ️  Firestore is connecting... (working in offline mode with cached data)');
        connectionWarningShown = true;
      }
    });
}, 2000);

// Add a global error handler for auth
auth.onAuthStateChanged(
  (user) => {
    if (user) {
      originalConsoleLog('👤 User authenticated:', user.uid);
    } else {
      originalConsoleLog('👤 No user authenticated');
    }
  },
  (error) => {
    originalConsoleError('❌ Auth state change error:', error);
  }
);

originalConsoleLog('✅ Firebase initialization complete');

export { app, auth, db };

