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
import {
  INITIAL_MENU_ITEMS,
  INITIAL_INVENTORY_ITEMS,
  saveStoredMenu,
  saveStoredInventory
} from './storage';

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

// Get locally saved user session
export const getLocalUserSession = () => {
  try {
    const raw = localStorage.getItem(USER_SESSION_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local user session:', e);
  }
  return null;
};

// Set locally saved user session
export const setLocalUserSession = (user) => {
  try {
    if (user) {
      localStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_SESSION_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Error saving local user session:', e);
  }
};

/**
 * Register Cafe Owner in Local Offline Mode (fallback when Firebase Auth is not configured)
 */
export const registerLocalCafeOwner = ({ email, cafeName, ownerName, phone = '', city = '', address = '' }) => {
  const localId = 'cafe_' + Date.now().toString(36);
  const user = {
    uid: localId,
    email: email.trim(),
    displayName: ownerName?.trim() || cafeName?.trim(),
    isLocal: true
  };
  const cafeProfile = {
    cafeId: localId,
    ownerUid: localId,
    cafeName: (cafeName || 'My Cafe').trim(),
    ownerName: (ownerName || 'Cafe Owner').trim(),
    ownerEmail: email.trim(),
    phone: phone?.trim() || '',
    city: city?.trim() || '',
    address: address?.trim() || '',
    currency: '₹',
    role: 'owner',
    createdAt: new Date().toISOString(),
    isPrimary: true
  };

  setLocalUserSession(user);
  setLocalActiveCafe(cafeProfile);
  saveStoredMenu(INITIAL_MENU_ITEMS, localId);
  saveStoredInventory(INITIAL_INVENTORY_ITEMS, localId);

  return { user, cafe: cafeProfile, cafes: [cafeProfile] };
};

/**
 * Login Cafe Owner in Local Offline Mode
 */
export const loginLocalCafeOwner = (email) => {
  let cafeProfile = getLocalActiveCafe();
  const cafeId = cafeProfile?.cafeId || 'default';
  const user = {
    uid: cafeId,
    email: email.trim(),
    displayName: cafeProfile?.ownerName || 'Cafe Owner',
    isLocal: true
  };
  if (!cafeProfile) {
    cafeProfile = {
      cafeId,
      ownerUid: cafeId,
      cafeName: 'My Cafe',
      ownerName: 'Cafe Owner',
      ownerEmail: email.trim(),
      role: 'owner',
      createdAt: new Date().toISOString(),
      isPrimary: true
    };
    setLocalActiveCafe(cafeProfile);
  }
  setLocalUserSession(user);
  return { user, cafe: cafeProfile, cafes: [cafeProfile] };
};

/**
 * Register a new Cafe Owner with Email/Password & initialize their Cafe Tenant
 */
export const registerCafeOwner = async ({ email, password, cafeName, ownerName, phone = '', city = '', address = '', forceLocal = false }) => {
  if (forceLocal) {
    return registerLocalCafeOwner({ email, cafeName, ownerName, phone, city, address });
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    return registerLocalCafeOwner({ email, cafeName, ownerName, phone, city, address });
  }

  try {
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

        INITIAL_MENU_ITEMS.forEach(item => {
          const itemRef = doc(db, 'cafes', cafeId, 'menu', item.id);
          batch.set(itemRef, { ...item, _lastSynced: new Date().toISOString() });
        });

        INITIAL_INVENTORY_ITEMS.forEach(inv => {
          const invRef = doc(db, 'cafes', cafeId, 'inventory', inv.id);
          batch.set(invRef, { ...inv, _lastSynced: new Date().toISOString() });
        });

        await batch.commit();
      } catch (err) {
        console.warn('Could not seed initial cafe data to Firestore, local storage used:', err);
      }
    }

    // 3. Save to Local Storage
    setLocalActiveCafe(cafeProfile);
    setLocalUserSession({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || ownerName,
      isAnonymous: false
    });

    return { user, cafe: cafeProfile, cafes: [cafeProfile] };
  } catch (err) {
    if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found')) {
      const customErr = new Error('Firebase Console me Email/Password provider enable nahi hai.');
      customErr.code = 'auth/configuration-not-found';
      customErr.originalError = err;
      throw customErr;
    }
    throw err;
  }
};

/**
 * Sign In existing Cafe Owner
 */
export const loginCafeOwner = async (email, password) => {
  const auth = getFirebaseAuth();
  if (!auth) {
    return loginLocalCafeOwner(email);
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    // Fetch Cafe Profile from Firestore
    let cafeProfile = null;
    let allUserCafes = [];
    const db = getFirebaseDb();

    if (db) {
      try {
        const cafeDocRef = doc(db, 'cafes', user.uid);
        const snap = await getDoc(cafeDocRef);

        if (snap.exists()) {
          cafeProfile = snap.data();
        }

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
    setLocalUserSession({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || cafeProfile?.ownerName,
      isAnonymous: false
    });

    return { user, cafe: cafeProfile, cafes: allUserCafes };
  } catch (err) {
    if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found')) {
      const customErr = new Error('Firebase Console me Email/Password provider enable nahi hai.');
      customErr.code = 'auth/configuration-not-found';
      customErr.originalError = err;
      throw customErr;
    }
    throw err;
  }
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
  // 1. Immediately report local session if available
  const initialLocalUser = getLocalUserSession();
  const initialLocalCafe = getLocalActiveCafe();
  if (initialLocalUser && initialLocalCafe) {
    callback({
      user: initialLocalUser,
      cafe: initialLocalCafe,
      cafes: [initialLocalCafe],
      isAuthReady: true
    });
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    if (!initialLocalUser) {
      callback({ user: null, cafe: initialLocalCafe, cafes: initialLocalCafe ? [initialLocalCafe] : [], isAuthReady: true });
    }
    return () => {};
  }

  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // If there's an active local session, preserve it!
      const currentLocalUser = getLocalUserSession();
      if (currentLocalUser) {
        const localCafe = getLocalActiveCafe();
        callback({ user: currentLocalUser, cafe: localCafe, cafes: localCafe ? [localCafe] : [], isAuthReady: true });
        return;
      }

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
