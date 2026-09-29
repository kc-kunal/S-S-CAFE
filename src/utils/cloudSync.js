import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from './firebase';

const CAFE_COLLECTION = 'cafe_management';

// Sync Menu to Cloud
export const syncCloudMenu = async (items) => {
  const db = getFirebaseDb();
  if (!db) return false;
  try {
    const docRef = doc(db, CAFE_COLLECTION, 'menu');
    await setDoc(docRef, { items, lastUpdated: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error('Error syncing menu to cloud:', err);
    return false;
  }
};

// Sync Inventory to Cloud
export const syncCloudInventory = async (inventory) => {
  const db = getFirebaseDb();
  if (!db) return false;
  try {
    const docRef = doc(db, CAFE_COLLECTION, 'inventory');
    await setDoc(docRef, { items: inventory, lastUpdated: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error('Error syncing inventory to cloud:', err);
    return false;
  }
};

// Sync Sales to Cloud
export const syncCloudSales = async (sales) => {
  const db = getFirebaseDb();
  if (!db) return false;
  try {
    const docRef = doc(db, CAFE_COLLECTION, 'sales');
    await setDoc(docRef, { items: sales, lastUpdated: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error('Error syncing sales to cloud:', err);
    return false;
  }
};

// Sync Procurement to Cloud
export const syncCloudProcurement = async (procurement) => {
  const db = getFirebaseDb();
  if (!db) return false;
  try {
    const docRef = doc(db, CAFE_COLLECTION, 'procurement');
    await setDoc(docRef, { items: procurement, lastUpdated: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error('Error syncing procurement to cloud:', err);
    return false;
  }
};

// Sync Expenses to Cloud
export const syncCloudExpenses = async (expenses) => {
  const db = getFirebaseDb();
  if (!db) return false;
  try {
    const docRef = doc(db, CAFE_COLLECTION, 'expenses');
    await setDoc(docRef, { items: expenses, lastUpdated: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error('Error syncing expenses to cloud:', err);
    return false;
  }
};

// Sync Wastage Logs to Cloud
export const syncCloudWastage = async (wastage) => {
  const db = getFirebaseDb();
  if (!db) return false;
  try {
    const docRef = doc(db, CAFE_COLLECTION, 'wastage');
    await setDoc(docRef, { items: wastage, lastUpdated: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error('Error syncing wastage to cloud:', err);
    return false;
  }
};

// Fetch all cloud data once
export const fetchAllCloudData = async () => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const [menuSnap, invSnap, salesSnap, procSnap, expSnap, wasteSnap] = await Promise.all([
      getDoc(doc(db, CAFE_COLLECTION, 'menu')),
      getDoc(doc(db, CAFE_COLLECTION, 'inventory')),
      getDoc(doc(db, CAFE_COLLECTION, 'sales')),
      getDoc(doc(db, CAFE_COLLECTION, 'procurement')),
      getDoc(doc(db, CAFE_COLLECTION, 'expenses')),
      getDoc(doc(db, CAFE_COLLECTION, 'wastage'))
    ]);

    return {
      menu: menuSnap.exists() ? menuSnap.data().items : null,
      inventory: invSnap.exists() ? invSnap.data().items : null,
      sales: salesSnap.exists() ? salesSnap.data().items : null,
      procurement: procSnap.exists() ? procSnap.data().items : null,
      expenses: expSnap.exists() ? expSnap.data().items : null,
      wastage: wasteSnap.exists() ? wasteSnap.data().items : null
    };
  } catch (err) {
    console.error('Error fetching cloud data:', err);
    return null;
  }
};

// Real-time multi-device subscription (Live Sync across Mobile & PC)
export const subscribeToCloudData = (callbacks) => {
  const db = getFirebaseDb();
  if (!db) return () => {};

  const unsubscribers = [];

  try {
    // Menu Listener
    if (callbacks.onMenuUpdate) {
      const unsub = onSnapshot(doc(db, CAFE_COLLECTION, 'menu'), (docSnap) => {
        if (docSnap.exists() && Array.isArray(docSnap.data().items)) {
          callbacks.onMenuUpdate(docSnap.data().items);
        }
      }, (err) => console.error('Menu cloud listener error:', err));
      unsubscribers.push(unsub);
    }

    // Inventory Listener
    if (callbacks.onInventoryUpdate) {
      const unsub = onSnapshot(doc(db, CAFE_COLLECTION, 'inventory'), (docSnap) => {
        if (docSnap.exists() && Array.isArray(docSnap.data().items)) {
          callbacks.onInventoryUpdate(docSnap.data().items);
        }
      }, (err) => console.error('Inventory cloud listener error:', err));
      unsubscribers.push(unsub);
    }

    // Sales Listener
    if (callbacks.onSalesUpdate) {
      const unsub = onSnapshot(doc(db, CAFE_COLLECTION, 'sales'), (docSnap) => {
        if (docSnap.exists() && Array.isArray(docSnap.data().items)) {
          callbacks.onSalesUpdate(docSnap.data().items);
        }
      }, (err) => console.error('Sales cloud listener error:', err));
      unsubscribers.push(unsub);
    }

    // Procurement Listener
    if (callbacks.onProcurementUpdate) {
      const unsub = onSnapshot(doc(db, CAFE_COLLECTION, 'procurement'), (docSnap) => {
        if (docSnap.exists() && Array.isArray(docSnap.data().items)) {
          callbacks.onProcurementUpdate(docSnap.data().items);
        }
      }, (err) => console.error('Procurement cloud listener error:', err));
      unsubscribers.push(unsub);
    }

    // Expenses Listener
    if (callbacks.onExpensesUpdate) {
      const unsub = onSnapshot(doc(db, CAFE_COLLECTION, 'expenses'), (docSnap) => {
        if (docSnap.exists() && Array.isArray(docSnap.data().items)) {
          callbacks.onExpensesUpdate(docSnap.data().items);
        }
      }, (err) => console.error('Expenses cloud listener error:', err));
      unsubscribers.push(unsub);
    }

    // Wastage Listener
    if (callbacks.onWastageUpdate) {
      const unsub = onSnapshot(doc(db, CAFE_COLLECTION, 'wastage'), (docSnap) => {
        if (docSnap.exists() && Array.isArray(docSnap.data().items)) {
          callbacks.onWastageUpdate(docSnap.data().items);
        }
      }, (err) => console.error('Wastage cloud listener error:', err));
      unsubscribers.push(unsub);
    }
  } catch (e) {
    console.error('Failed to setup cloud subscriptions:', e);
  }

  // Return unsubscribe function
  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
};

// 1-Click Upload local data to Firestore
export const uploadAllLocalToCloud = async (menu, inventory, sales, procurement, expenses = [], wastage = []) => {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase Firestore connect nahi hai. Kripya pehle config add karein.');

  const promises = [
    syncCloudMenu(menu),
    syncCloudInventory(inventory),
    syncCloudSales(sales),
    syncCloudProcurement(procurement)
  ];
  if (expenses && expenses.length > 0) promises.push(syncCloudExpenses(expenses));
  if (wastage && wastage.length > 0) promises.push(syncCloudWastage(wastage));

  await Promise.all(promises);

  return true;
};
