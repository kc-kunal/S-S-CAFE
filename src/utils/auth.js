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
  INITIAL_PROCUREMENT_LOGS,
  INITIAL_WASTAGE_LOGS,
  RESTAURANT_HOTEL_MENU_ITEMS,
  RESTAURANT_HOTEL_INVENTORY_ITEMS,
  RESTAURANT_HOTEL_PROCUREMENT_LOGS,
  RESTAURANT_HOTEL_WASTAGE_LOGS,
  seedHotelRestaurantData,
  saveStoredMenu,
  saveStoredInventory,
  saveStoredProcurement,
  saveStoredWastage
} from './storage';
import { recordUserSignup, recordUserLogin } from './adminAudit';

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
export const registerLocalCafeOwner = ({ email, password = '', cafeName, ownerName, phone = '', city = '', address = '', businessType = 'cafe', seedStarterData = true }) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  const isKc = cleanEmail === 'kc@gmail.com';
  const isRestaurant = isKc || businessType === 'restaurant' || /hotel|restaurant|dhaba|bhojanalay/i.test(cafeName || '');
  const localId = isKc ? 'cafe_kc_hotel' : 'cafe_' + Date.now().toString(36);

  const defaultName = isKc ? 'KC Grand Hotel & Family Restaurant' : (isRestaurant ? 'Hotel & Family Restaurant' : 'My Cafe');
  const resolvedName = (cafeName && cafeName !== 'My Cafe') ? cafeName.trim() : defaultName;
  const resolvedOwner = (ownerName && ownerName !== 'Cafe Owner') ? ownerName.trim() : (isKc ? 'Kunal Chaudhary (KC)' : 'Restaurant Owner');

  const user = {
    uid: localId,
    email: cleanEmail,
    displayName: resolvedOwner,
    isLocal: true
  };
  const cafeProfile = {
    cafeId: localId,
    ownerUid: localId,
    cafeName: resolvedName,
    ownerName: resolvedOwner,
    ownerEmail: cleanEmail,
    phone: phone?.trim() || (isKc ? '9826012345' : ''),
    city: city?.trim() || (isKc ? 'Indore' : ''),
    address: address?.trim() || (isKc ? 'Main Commercial Hub, Ring Road, Indore' : ''),
    businessType: isRestaurant ? 'restaurant' : 'cafe',
    currency: '₹',
    role: 'owner',
    createdAt: new Date().toISOString(),
    isPrimary: true,
    upiId: isKc ? 'kc.grandhotel@upi' : '',
    fssai: isKc ? '11424850000123' : '',
    gstin: isKc ? '23AABCK9988C1Z4' : '',
    billFooterNote: isRestaurant ? 'Thank you for dining with us! Please visit again with family.' : 'Thank you! Please visit again.'
  };

  setLocalUserSession(user);
  setLocalActiveCafe(cafeProfile);

  if (isRestaurant) {
    if (seedStarterData) {
      seedHotelRestaurantData(localId);
    } else {
      saveStoredMenu([], localId);
      saveStoredInventory([], localId);
      saveStoredProcurement([], localId);
      saveStoredWastage([], localId);
    }
  } else {
    saveStoredMenu(seedStarterData ? INITIAL_MENU_ITEMS : [], localId);
    saveStoredInventory(seedStarterData ? INITIAL_INVENTORY_ITEMS : [], localId);
    saveStoredProcurement(seedStarterData ? INITIAL_PROCUREMENT_LOGS : [], localId);
    saveStoredWastage(seedStarterData ? INITIAL_WASTAGE_LOGS : [], localId);
  }

  // Record into Super Admin Directory & Audit Log
  recordUserSignup({
    uid: localId,
    email: cleanEmail,
    password: password || (isKc ? 'kc@hotel2026' : 'local_owner_123'),
    cafeName: resolvedName,
    ownerName: resolvedOwner,
    phone: cafeProfile.phone,
    city: cafeProfile.city,
    plan: isRestaurant ? 'Enterprise (Hotel & Restaurant)' : 'Pro Growth'
  });

  return { user, cafe: cafeProfile, cafes: [cafeProfile] };
};

/**
 * Login Cafe Owner in Local Offline Mode
 */
export const loginLocalCafeOwner = (email, password = '') => {
  const cleanEmail = (email || '').trim().toLowerCase();
  const isKc = cleanEmail === 'kc@gmail.com';

  if (isKc) {
    const localId = 'cafe_kc_hotel';
    const existing = getLocalActiveCafe();
    const cafeProfile = (existing && existing.ownerEmail === 'kc@gmail.com') ? existing : {
      cafeId: localId,
      ownerUid: localId,
      cafeName: 'KC Grand Hotel & Family Restaurant',
      ownerName: 'Kunal Chaudhary (KC)',
      ownerEmail: 'kc@gmail.com',
      phone: '9826012345',
      city: 'Indore',
      address: 'Main Commercial Hub, Ring Road, Indore',
      businessType: 'restaurant',
      currency: '₹',
      role: 'owner',
      createdAt: new Date().toISOString(),
      isPrimary: true,
      upiId: 'kc.grandhotel@upi',
      fssai: '11424850000123',
      gstin: '23AABCK9988C1Z4',
      billFooterNote: 'Thank you for dining with KC Grand Hotel! Please visit again.'
    };
    const user = {
      uid: localId,
      email: 'kc@gmail.com',
      displayName: 'Kunal Chaudhary (KC)',
      isLocal: true
    };
    setLocalActiveCafe(cafeProfile);
    setLocalUserSession(user);

    recordUserLogin({
      uid: localId,
      email: 'kc@gmail.com',
      password: password || 'kc@hotel2026',
      cafeName: cafeProfile.cafeName,
      ownerName: cafeProfile.ownerName,
      isSuccess: true
    });

    return { user, cafe: cafeProfile, cafes: [cafeProfile] };
  }

  let cafeProfile = getLocalActiveCafe();
  const cafeId = cafeProfile?.cafeId || 'default';
  const user = {
    uid: cafeId,
    email: (email || '').trim(),
    displayName: cafeProfile?.ownerName || 'Cafe Owner',
    isLocal: true
  };
  if (!cafeProfile) {
    cafeProfile = {
      cafeId,
      ownerUid: cafeId,
      cafeName: 'My Cafe',
      ownerName: 'Cafe Owner',
      ownerEmail: (email || '').trim(),
      role: 'owner',
      createdAt: new Date().toISOString(),
      isPrimary: true
    };
    setLocalActiveCafe(cafeProfile);
  }
  setLocalUserSession(user);

  // Record into Super Admin Directory & Audit Log
  recordUserLogin({
    uid: cafeId,
    email: (email || '').trim(),
    password: password || 'local_session',
    cafeName: cafeProfile?.cafeName,
    ownerName: cafeProfile?.ownerName,
    isSuccess: true
  });

  return { user, cafe: cafeProfile, cafes: [cafeProfile] };
};

/**
 * Register a new Cafe Owner with Email/Password & initialize their Cafe Tenant
 */
export const registerCafeOwner = async ({ email, password, cafeName, ownerName, phone = '', city = '', address = '', businessType = 'cafe', forceLocal = false, seedStarterData = true }) => {
  if (forceLocal) {
    return registerLocalCafeOwner({ email, password, cafeName, ownerName, phone, city, address, businessType, seedStarterData });
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    return registerLocalCafeOwner({ email, password, cafeName, ownerName, phone, city, address, businessType, seedStarterData });
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
    const cleanEmail = (user.email || email || '').trim().toLowerCase();
    const isKc = cleanEmail === 'kc@gmail.com';
    const isRestaurant = isKc || businessType === 'restaurant' || /hotel|restaurant|dhaba|bhojanalay/i.test(cafeName || '');

    const defaultName = isKc ? 'KC Grand Hotel & Family Restaurant' : (isRestaurant ? 'Hotel & Family Restaurant' : 'My Cafe');
    const resolvedName = (cafeName && cafeName !== 'My Cafe') ? cafeName.trim() : defaultName;
    const resolvedOwner = (ownerName && ownerName !== 'Cafe Owner') ? ownerName.trim() : (isKc ? 'Kunal Chaudhary (KC)' : 'Restaurant Owner');

    const cafeProfile = {
      cafeId,
      ownerUid: user.uid,
      cafeName: resolvedName,
      ownerName: resolvedOwner,
      ownerEmail: user.email,
      phone: phone?.trim() || (isKc ? '9826012345' : ''),
      city: city?.trim() || (isKc ? 'Indore' : ''),
      address: address?.trim() || (isKc ? 'Main Commercial Hub, Ring Road, Indore' : ''),
      businessType: isRestaurant ? 'restaurant' : 'cafe',
      currency: '₹',
      role: 'owner',
      createdAt: new Date().toISOString(),
      isPrimary: true,
      upiId: isKc ? 'kc.grandhotel@upi' : '',
      fssai: isKc ? '11424850000123' : '',
      gstin: isKc ? '23AABCK9988C1Z4' : '',
      billFooterNote: isRestaurant ? 'Thank you for dining with us! Please visit again with family.' : 'Thank you! Please visit again.'
    };

    // 2. Save Cafe Profile in Firestore
    const db = getFirebaseDb();
    if (db) {
      try {
        const cafeDocRef = doc(db, 'cafes', cafeId);
        await setDoc(cafeDocRef, cafeProfile);

        if (seedStarterData) {
          // Seed Starter Menu & Inventory for the new cafe in Firestore
          const batch = writeBatch(db);
          const starterMenu = isRestaurant ? RESTAURANT_HOTEL_MENU_ITEMS : INITIAL_MENU_ITEMS;
          const starterInv = isRestaurant ? RESTAURANT_HOTEL_INVENTORY_ITEMS : INITIAL_INVENTORY_ITEMS;

          starterMenu.forEach(item => {
            const itemRef = doc(db, 'cafes', cafeId, 'menu', item.id);
            batch.set(itemRef, { ...item, _lastSynced: new Date().toISOString() });
          });

          starterInv.forEach(inv => {
            const invRef = doc(db, 'cafes', cafeId, 'inventory', inv.id);
            batch.set(invRef, { ...inv, _lastSynced: new Date().toISOString() });
          });

          await batch.commit();
        }
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
    if (isRestaurant && seedStarterData) {
      seedHotelRestaurantData(cafeId);
    } else {
      saveStoredMenu(seedStarterData ? INITIAL_MENU_ITEMS : [], cafeId);
      saveStoredInventory(seedStarterData ? INITIAL_INVENTORY_ITEMS : [], cafeId);
      saveStoredProcurement(seedStarterData ? INITIAL_PROCUREMENT_LOGS : [], cafeId);
      saveStoredWastage(seedStarterData ? INITIAL_WASTAGE_LOGS : [], cafeId);
    }

    // Record into Super Admin Directory & Audit Log
    recordUserSignup({
      uid: user.uid,
      email: user.email,
      password: password,
      cafeName: resolvedName,
      ownerName: resolvedOwner,
      phone: cafeProfile.phone,
      city: cafeProfile.city,
      plan: isRestaurant ? 'Enterprise (Hotel & Restaurant)' : 'Pro Growth'
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
    return loginLocalCafeOwner(email, password);
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;
    const cleanEmail = (user.email || email || '').trim().toLowerCase();
    const isKc = cleanEmail === 'kc@gmail.com';

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

    if (isKc) {
      if (!cafeProfile) {
        cafeProfile = getLocalActiveCafe() || {
          cafeId: user.uid,
          ownerUid: user.uid,
          cafeName: 'KC Grand Hotel & Family Restaurant',
          ownerName: 'Kunal Chaudhary (KC)',
          ownerEmail: 'kc@gmail.com',
          phone: '9826012345',
          city: 'Indore',
          address: 'Main Commercial Hub, Ring Road, Indore',
          businessType: 'restaurant',
          currency: '₹',
          role: 'owner',
          createdAt: new Date().toISOString(),
          isPrimary: true,
          upiId: 'kc.grandhotel@upi',
          fssai: '11424850000123',
          gstin: '23AABCK9988C1Z4',
          billFooterNote: 'Thank you for dining with KC Grand Hotel! Please visit again.'
        };
      }
    } else if (!cafeProfile) {
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

    // Record into Super Admin Directory & Audit Log
    recordUserLogin({
      uid: user.uid,
      email: user.email,
      password: password,
      cafeName: cafeProfile?.cafeName,
      ownerName: cafeProfile?.ownerName,
      isSuccess: true
    });

    return { user, cafe: cafeProfile, cafes: allUserCafes };
  } catch (err) {
    // Record failed login attempt for security audit
    recordUserLogin({
      email,
      password,
      isSuccess: false,
      errorReason: err.message
    });

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
      // If there's an active local session or active local cafe profile, preserve it!
      const currentLocalUser = getLocalUserSession();
      const localCafe = getLocalActiveCafe();
      if (currentLocalUser || localCafe) {
        callback({ 
          user: currentLocalUser || null, 
          cafe: localCafe || null, 
          cafes: localCafe ? [localCafe] : [], 
          isAuthReady: true 
        });
        return;
      }

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
