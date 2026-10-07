import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from './firebase';
import { INITIAL_MENU_ITEMS, INITIAL_INVENTORY_ITEMS } from './storage';

const ACTIVE_CAFE_STORAGE_KEY = 'ss_active_cafe_profile_v1';
const USER_SESSION_STORAGE_KEY = 'ss_user_session_v1';

// Get locally saved active cafe profile
export const getLocalActiveCafe = () => {
  try {
    const raw = localStorage.getItem(ACTIVE_CAFE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local active cafe:', e);
  }
  return null;
};

// Save locally active cafe profile
export const setLocalActiveCafe = (cafeProfile) => {
  try {
    if (cafeProfile) {
      localStorage.setItem(ACTIVE_CAFE_STORAGE_KEY, JSON.stringify(cafeProfile));
    } else {
      localStorage.removeItem(ACTIVE_CAFE_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Error saving local active cafe:', e);
  }
};

/**
 * Register a new Cafe Owner with Email/Password & initialize their Cafe Tenant
 */
export const registerCafeOwner = async ({ email, password, cafeName, ownerName, phone = '', city = '', address = '' }) => {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Auth initialize nahi ho saka. Firebase configuration check karein.');
  }

  // 1. Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const user = userCredential.user;

  // Set user display name
  try {
    await updateProfile(user, { displayName: ownerName?.trim() || cafeName?.trim() });
  } catch (e) {
    // Non-blocking
  }

  const cafeId = user.uid; // Primary cafe ID matches owner's UID
  const cafeProfile = {
    cafeId,
    ownerUid: user.uid,
    cafeName: (cafeName || 'My Cafe').trim(),
    ownerName: (ownerName || 'Cafe Owner').trim(),
    ownerEmail: user.email,
    phone: phone?.trim() || '',
    city: city?.trim() || '',
    address: address?.trim() || '',
    currency: '₹',
    role: 'owner',
    createdAt: new Date().toISOString(),
    isPrimary: true
  };

  // 2. Save Cafe Profile in Firestore
  const db = getFirebaseDb();
  if (db) {
    try {
      const cafeDocRef = doc(db, 'cafes', cafeId);
      await setDoc(cafeDocRef, cafeProfile);

      // Seed Starter Menu & Inventory for the new cafe in Firestore
      const batch = writeBatch(db);

      // Seed Menu
      INITIAL_MENU_ITEMS.forEach(item => {
        const itemRef = doc(db, 'cafes', cafeId, 'menu', item.id);
        batch.set(itemRef, { ...item, _lastSynced: new Date().toISOString() });
      });

      // Seed Inventory
      INITIAL_INVENTORY_ITEMS.forEach(inv => {
        const invRef = doc(db, 'cafes', cafeId, 'inventory', inv.id);
        batch.set(invRef, { ...inv, _lastSynced: new Date().toISOString() });
      });

      await batch.commit();
    } catch (err) {
      console.warn('Could not seed initial cafe data to Firestore, local mode will be used:', err);
    }
  }

  // 3. Save to Local Storage
  setLocalActiveCafe(cafeProfile);

  return { user, cafe: cafeProfile, cafes: [cafeProfile] };
};

/**
 * Sign In existing Cafe Owner
 */
export const loginCafeOwner = async (email, password) => {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Auth initialize nahi ho saka. Firebase configuration check karein.');
  }

  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const user = userCredential.user;

  // Fetch Cafe Profile from Firestore
  let cafeProfile = null;
  let allUserCafes = [];
  const db = getFirebaseDb();

  if (db) {
    try {
      // 1. Check primary cafe doc
      const cafeDocRef = doc(db, 'cafes', user.uid);
      const snap = await getDoc(cafeDocRef);

      if (snap.exists()) {
        cafeProfile = snap.data();
      }

      // 2. Fetch all cafes owned by this user
      const q = query(collection(db, 'cafes'), where('ownerUid', '==', user.uid));
      const qSnap = await getDocs(q);
      allUserCafes = qSnap.docs.map(d => ({ ...d.data(), cafeId: d.id }));

      if (!cafeProfile && allUserCafes.length > 0) {
        cafeProfile = allUserCafes[0];
      }
    } catch (e) {
      console.warn('Could not fetch cafe profile from cloud, falling back to local:', e);
    }
  }

  // Fallback if no cloud profile existed yet
  if (!cafeProfile) {
    cafeProfile = getLocalActiveCafe() || {
      cafeId: user.uid,
      ownerUid: user.uid,
      cafeName: user.displayName || 'S&S Cafe',
      ownerName: user.displayName || 'Cafe Owner',
      ownerEmail: user.email,
      role: 'owner',
      createdAt: new Date().toISOString(),
      isPrimary: true
    };
  }

  if (allUserCafes.length === 0) {
    allUserCafes = [cafeProfile];
  }

  setLocalActiveCafe(cafeProfile);
  return { user, cafe: cafeProfile, cafes: allUserCafes };
};

/**
 * Logout current user
 */
export const logoutCafeOwner = async () => {
  const auth = getFirebaseAuth();
  if (auth) {
    await signOut(auth);
  }
  setLocalActiveCafe(null);
  localStorage.removeItem(USER_SESSION_STORAGE_KEY);
};

/**
 * Send password reset email
 */
export const sendResetPassword = async (email) => {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Auth initialize nahi ho saka.');
  }
  await sendPasswordResetEmail(auth, email.trim());
};

/**
 * Create an additional Cafe Branch / Outlet for the current owner
 */
export const createAdditionalCafeOutlet = async (ownerUid, { cafeName, phone = '', city = '', address = '' }) => {
  const db = getFirebaseDb();
  if (!db || !ownerUid) {
    throw new Error('Cloud Database not ready or user not logged in.');
  }

  const outletId = `cafe_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const outletProfile = {
    cafeId: outletId,
    ownerUid: ownerUid,
    cafeName: cafeName.trim(),
    ownerName: '',
    phone: phone.trim(),
    city: city.trim(),
    address: address.trim(),
    currency: '₹',
    role: 'owner',
    createdAt: new Date().toISOString(),
    isPrimary: false
  };

  const docRef = doc(db, 'cafes', outletId);
  await setDoc(docRef, outletProfile);

  // Seed default starter menu & inventory
  try {
    const batch = writeBatch(db);
    INITIAL_MENU_ITEMS.forEach(item => {
      const itemRef = doc(db, 'cafes', outletId, 'menu', item.id);
      batch.set(itemRef, { ...item, _lastSynced: new Date().toISOString() });
    });
    INITIAL_INVENTORY_ITEMS.forEach(inv => {
      const invRef = doc(db, 'cafes', outletId, 'inventory', inv.id);
      batch.set(invRef, { ...inv, _lastSynced: new Date().toISOString() });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Failed to seed outlet starter items:', err);
  }

  return outletProfile;
};

/**
 * Update Cafe details
 */
export const updateCafeDetails = async (cafeId, updates) => {
  const db = getFirebaseDb();
  if (db && cafeId) {
    const docRef = doc(db, 'cafes', cafeId);
    await setDoc(docRef, updates, { merge: true });
  }
  const current = getLocalActiveCafe();
  if (current && current.cafeId === cafeId) {
    const updated = { ...current, ...updates };
    setLocalActiveCafe(updated);
    return updated;
  }
  return null;
};

/**
 * Subscribe to Auth State Changes
 */
export const subscribeToAuthChanges = (callback) => {
  const auth = getFirebaseAuth();
  if (!auth) {
    // If not configured, check local offline session
    const localCafe = getLocalActiveCafe();
    callback({ user: null, cafe: localCafe, cafes: localCafe ? [localCafe] : [], isAuthReady: true });
    return () => {};
  }

  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      setLocalActiveCafe(null);
      callback({ user: null, cafe: null, cafes: [], isAuthReady: true });
      return;
    }

    let cafeProfile = null;
    let allCafes = [];
    const db = getFirebaseDb();

    if (db) {
      try {
        const snap = await getDoc(doc(db, 'cafes', user.uid));
        if (snap.exists()) {
          cafeProfile = snap.data();
        }

        const q = query(collection(db, 'cafes'), where('ownerUid', '==', user.uid));
        const qSnap = await getDocs(q);
        allCafes = qSnap.docs.map(d => ({ ...d.data(), cafeId: d.id }));

        if (!cafeProfile && allCafes.length > 0) {
          cafeProfile = allCafes[0];
        }
      } catch (e) {
        console.warn('Error fetching cafe data in auth listener:', e);
      }
    }

    if (!cafeProfile) {
      cafeProfile = getLocalActiveCafe() || {
        cafeId: user.uid,
        ownerUid: user.uid,
        cafeName: user.displayName || 'S&S Cafe',
        ownerName: user.displayName || 'Cafe Owner',
        ownerEmail: user.email,
        role: 'owner',
        createdAt: new Date().toISOString(),
        isPrimary: true
      };
    }

    if (allCafes.length === 0) {
      allCafes = [cafeProfile];
    }

    setLocalActiveCafe(cafeProfile);
    callback({ user, cafe: cafeProfile, cafes: allCafes, isAuthReady: true });
  });
};
