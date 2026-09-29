import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const FIREBASE_LOCAL_CONFIG_KEY = 'ss_cafe_firebase_config_v1';

// Default config from Vite environment variables (for Netlify deployment)
const getEnvConfig = () => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (apiKey && projectId) {
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
  } catch (e) {
    console.error('Error saving firebase config:', e);
  }
};

// Clear saved config
export const clearFirebaseConfig = () => {
  localStorage.removeItem(FIREBASE_LOCAL_CONFIG_KEY);
};

// Get active configuration (priority: environment variables > localStorage)
export const getActiveFirebaseConfig = () => {
  return getEnvConfig() || getSavedFirebaseConfig();
};

export const isFirebaseConfigured = () => {
  const config = getActiveFirebaseConfig();
  return Boolean(config && config.apiKey && config.projectId);
};

let app = null;
let db = null;

export const getFirebaseDb = () => {
  const config = getActiveFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    return db;
  } catch (err) {
    console.error('Failed to initialize Firebase Firestore:', err);
    return null;
  }
};
