import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  setDoc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const FIREBASE_LOCAL_CONFIG_KEY = 'ss_cafe_firebase_config_v1';

// Default config from Vite environment variables (for Netlify/Vercel deployment)
const getEnvConfig = () => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (apiKey && projectId && !apiKey.startsWith('AIzaSy_REPLACE')) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
    };
  }
  return null;
};

// Retrieve config from localStorage (set via UI modal)
export const getSavedFirebaseConfig = () => {
  try {
    const saved = localStorage.getItem(FIREBASE_LOCAL_CONFIG_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading saved firebase config:', e);
  }
  return null;
};

// Save config directly from UI modal
export const saveFirebaseConfig = (config) => {
  try {
    localStorage.setItem(FIREBASE_LOCAL_CONFIG_KEY, JSON.stringify(config));
    // Reset cached app, db and auth instances so next call picks up the new config
    app = null;
    db = null;
    auth = null;
  } catch (e) {
    console.error('Error saving firebase config:', e);
  }
};

// Clear saved config
export const clearFirebaseConfig = () => {
  localStorage.removeItem(FIREBASE_LOCAL_CONFIG_KEY);
  app = null;
  db = null;
  auth = null;
};

// Get active configuration (priority: localStorage > environment variables)
export const getActiveFirebaseConfig = () => {
  return getSavedFirebaseConfig() || getEnvConfig();
};

export const isFirebaseConfigured = () => {
  const config = getActiveFirebaseConfig();
  return Boolean(config && config.apiKey && config.projectId);
};

let app = null;
let db = null;
let auth = null;

/**
 * Initialize and get Firebase Auth instance
 */
export const getFirebaseAuth = () => {
  const config = getActiveFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  if (auth) {
    return auth;
  }

  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    return auth;
  } catch (err) {
    console.error('Failed to initialize Firebase Auth:', err);
    return null;
  }
};

/**
 * Initialize and get Firebase Firestore instance with multi-tab offline persistence
 */
export const getFirebaseDb = () => {
  const config = getActiveFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  if (db) {
    return db;
  }

  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }

    // Try initializing with multi-tab offline persistent cache & long polling to prevent QUIC protocol drops
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        }),
        experimentalAutoDetectLongPolling: true
      });
    } catch {
      // If already initialized or persistent cache not supported (e.g. private window), fallback to getFirestore
      db = getFirestore(app);
    }

    return db;
  } catch (err) {
    console.error('Failed to initialize Firebase Firestore:', err);
    return null;
  }
};

/**
 * Health check & diagnostic tool: Tests reading and writing to Firestore
 * Returns: { success: boolean, message: string, code?: string }
 */
export const testFirestoreHealth = async (customConfig = null) => {
  const configToTest = customConfig || getActiveFirebaseConfig();
  if (!configToTest || !configToTest.apiKey || !configToTest.projectId) {
    return {
      success: false,
      message: 'API Key aur Project ID dono zaroori hain!'
    };
  }

  try {
    let testApp;
    const testAppName = `test_app_${Date.now()}`;
    testApp = initializeApp(configToTest, testAppName);
    const testDb = getFirestore(testApp);

    const pingDocRef = doc(testDb, '_cafe_diagnostics', 'health_check');
    const testPayload = {
      ping: 'ok',
      timestamp: new Date().toISOString(),
      client: 'S&S Cafe POS'
    };

    // 1. Write Test
    await setDoc(pingDocRef, testPayload);

    // 2. Read Test
    const snap = await getDoc(pingDocRef);
    if (!snap.exists()) {
      return {
        success: false,
        message: 'Write succeed hui lekin read verify nahi ho paayi.'
      };
    }

    // 3. Clean up Test
    await deleteDoc(pingDocRef);

    return {
      success: true,
      message: '🎉 Connection Successful! Firebase Firestore read/write permissions active hain.'
    };
  } catch (err) {
    console.error('Firestore health check failed:', err);
    const msg = err.message || '';
    if (msg.includes('permission-denied') || err.code === 'permission-denied') {
      return {
        success: false,
        code: 'permission-denied',
        message: '⚠️ Permission Denied: Firestore Security Rules me read/write allow karein (Modal me diye gaye Rules copy karein).'
      };
    }
    if (msg.includes('not-found') || err.code === 'not-found') {
      return {
        success: false,
        code: 'not-found',
        message: '⚠️ Database Not Found: Firebase Console me jaakar "Create Firestore Database" par click karein.'
      };
    }
    if (msg.includes('api-key-not-valid') || err.code === 'auth/api-key-not-valid') {
      return {
        success: false,
        code: 'invalid-api-key',
        message: '⚠️ Invalid API Key: Kripya Firebase Console se sahi API Key copy karein.'
      };
    }
    return {
      success: false,
      code: err.code || 'unknown',
      message: `Connection failed: ${err.message}`
    };
  }
};
