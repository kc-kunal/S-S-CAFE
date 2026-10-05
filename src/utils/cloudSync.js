import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from './firebase';

// Production Firestore Collections
export const COLLECTIONS = {
  MENU: 'cafe_menu',
  INVENTORY: 'cafe_inventory',
  SALES: 'cafe_sales',
  PROCUREMENT: 'cafe_procurement',
  EXPENSES: 'cafe_expenses',
  WASTAGE: 'cafe_wastage',
  DINING_ORDERS: 'cafe_dining_orders',
  LEGACY: 'cafe_management'
};

// Batch commit helper: Firestore allows max 500 ops per batch. We chunk by 400 safely.
const commitBatches = async (db, operations) => {
  if (!operations || operations.length === 0) return true;
  const CHUNK_SIZE = 400;

  for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
    const chunk = operations.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    chunk.forEach(({ type, ref, data }) => {
      if (type === 'set') {
        batch.set(ref, data, { merge: true });
      } else if (type === 'delete') {
        batch.delete(ref);
      }
    });

    await batch.commit();
  }
  return true;
};

// Generic single document upsert
const upsertSingleDoc = async (collectionName, item) => {
  const db = getFirebaseDb();
  if (!db || !item) return false;
  try {
    const id = item.id || `item_${Date.now()}`;
    const docRef = doc(db, collectionName, String(id));
    await setDoc(docRef, { ...item, id, _lastSynced: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error(`Error upserting doc in ${collectionName}:`, err);
    return false;
  }
};

// Generic single document delete
const deleteSingleDoc = async (collectionName, id) => {
  const db = getFirebaseDb();
  if (!db || !id) return false;
  try {
    const docRef = doc(db, collectionName, String(id));
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error(`Error deleting doc in ${collectionName}:`, err);
    return false;
  }
};

// Sync Collection with Batching (handles O(N) items without 1MB single-document limit)
const syncCollectionItems = async (collectionName, items) => {
  const db = getFirebaseDb();
  if (!db || !Array.isArray(items)) return false;

  try {
    const operations = items.map((item) => {
      const id = item.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      return {
        type: 'set',
        ref: doc(db, collectionName, String(id)),
        data: { ...item, id, _lastSynced: new Date().toISOString() }
      };
    });

    await commitBatches(db, operations);
    return true;
  } catch (err) {
    console.error(`Error syncing collection ${collectionName}:`, err);
    return false;
  }
};

// ==========================================
// 1. Bulk Sync Methods (Contract compatible)
// ==========================================

export const syncCloudMenu = async (items) => {
  return syncCollectionItems(COLLECTIONS.MENU, items);
};

export const syncCloudInventory = async (items) => {
  return syncCollectionItems(COLLECTIONS.INVENTORY, items);
};

export const syncCloudSales = async (items) => {
  return syncCollectionItems(COLLECTIONS.SALES, items);
};

export const syncCloudProcurement = async (items) => {
  return syncCollectionItems(COLLECTIONS.PROCUREMENT, items);
};

export const syncCloudExpenses = async (items) => {
  return syncCollectionItems(COLLECTIONS.EXPENSES, items);
};

export const syncCloudWastage = async (items) => {
  return syncCollectionItems(COLLECTIONS.WASTAGE, items);
};

// ==========================================
// 2. Granular Fast CRUD Sync Methods
// ==========================================

export const syncSingleSale = (sale) => upsertSingleDoc(COLLECTIONS.SALES, sale);
export const deleteSingleSale = (saleId) => deleteSingleDoc(COLLECTIONS.SALES, saleId);

export const syncSingleInventory = (item) => upsertSingleDoc(COLLECTIONS.INVENTORY, item);
export const deleteSingleInventory = (itemId) => deleteSingleDoc(COLLECTIONS.INVENTORY, itemId);

export const syncSingleMenuItem = (item) => upsertSingleDoc(COLLECTIONS.MENU, item);
export const deleteSingleMenuItem = (itemId) => deleteSingleDoc(COLLECTIONS.MENU, itemId);

export const syncSingleProcurement = (proc) => upsertSingleDoc(COLLECTIONS.PROCUREMENT, proc);
export const deleteSingleProcurement = (procId) => deleteSingleDoc(COLLECTIONS.PROCUREMENT, procId);

export const syncSingleExpense = (exp) => upsertSingleDoc(COLLECTIONS.EXPENSES, exp);
export const deleteSingleExpense = (expId) => deleteSingleDoc(COLLECTIONS.EXPENSES, expId);

export const syncSingleWastage = (waste) => upsertSingleDoc(COLLECTIONS.WASTAGE, waste);
export const deleteSingleWastage = (wasteId) => deleteSingleDoc(COLLECTIONS.WASTAGE, wasteId);

export const syncCloudDiningOrders = async (items) => {
  return syncCollectionItems(COLLECTIONS.DINING_ORDERS, items);
};
export const syncSingleDiningOrder = (order) => upsertSingleDoc(COLLECTIONS.DINING_ORDERS, order);
export const deleteSingleDiningOrder = (orderId) => deleteSingleDoc(COLLECTIONS.DINING_ORDERS, orderId);

// ==========================================
// 3. Fetch All Cloud Data (with Auto-Migration)
// ==========================================

export const fetchAllCloudData = async () => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    // 1. Query individual production collections
    const [menuSnap, invSnap, salesSnap, procSnap, expSnap, wasteSnap, diningSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.MENU)),
      getDocs(collection(db, COLLECTIONS.INVENTORY)),
      getDocs(collection(db, COLLECTIONS.SALES)),
      getDocs(collection(db, COLLECTIONS.PROCUREMENT)),
      getDocs(collection(db, COLLECTIONS.EXPENSES)),
      getDocs(collection(db, COLLECTIONS.WASTAGE)),
      getDocs(collection(db, COLLECTIONS.DINING_ORDERS))
    ]);

    const result = {
      menu: menuSnap.docs.map(d => ({ ...d.data(), id: d.id })),
      inventory: invSnap.docs.map(d => ({ ...d.data(), id: d.id })),
      sales: salesSnap.docs.map(d => ({ ...d.data(), id: d.id })),
      procurement: procSnap.docs.map(d => ({ ...d.data(), id: d.id })),
      expenses: expSnap.docs.map(d => ({ ...d.data(), id: d.id })),
      wastage: wasteSnap.docs.map(d => ({ ...d.data(), id: d.id })),
      diningOrders: diningSnap.docs.map(d => ({ ...d.data(), id: d.id }))
    };

    // 2. Backward compatibility: If modern collections are empty, check legacy single document
    const hasModernData = Object.values(result).some(arr => arr && arr.length > 0);

    if (!hasModernData) {
      const [legMenu, legInv, legSales, legProc, legExp, legWaste] = await Promise.all([
        getDoc(doc(db, COLLECTIONS.LEGACY, 'menu')),
        getDoc(doc(db, COLLECTIONS.LEGACY, 'inventory')),
        getDoc(doc(db, COLLECTIONS.LEGACY, 'sales')),
        getDoc(doc(db, COLLECTIONS.LEGACY, 'procurement')),
        getDoc(doc(db, COLLECTIONS.LEGACY, 'expenses')),
        getDoc(doc(db, COLLECTIONS.LEGACY, 'wastage'))
      ]);

      const legacyData = {
        menu: legMenu.exists() ? legMenu.data().items : null,
        inventory: legInv.exists() ? legInv.data().items : null,
        sales: legSales.exists() ? legSales.data().items : null,
        procurement: legProc.exists() ? legProc.data().items : null,
        expenses: legExp.exists() ? legExp.data().items : null,
        wastage: legWaste.exists() ? legWaste.data().items : null
      };

      const hasLegacyData = Object.values(legacyData).some(arr => arr && arr.length > 0);
      if (hasLegacyData) {
        // Auto-migrate legacy data to modern collections in the background
        console.log('🔄 Migrating legacy Firebase single-document data to modern collections...');
        uploadAllLocalToCloud(
          legacyData.menu || [],
          legacyData.inventory || [],
          legacyData.sales || [],
          legacyData.procurement || [],
          legacyData.expenses || [],
          legacyData.wastage || []
        ).catch(err => console.error('Auto-migration error:', err));

        return legacyData;
      }
    }

    return result;
  } catch (err) {
    console.error('Error fetching cloud data:', err);
    return null;
  }
};

// ==========================================
// 4. Real-time Multi-Device Subscription
// ==========================================

export const subscribeToCloudData = (callbacks = {}) => {
  const db = getFirebaseDb();
  if (!db) return () => {};

  const unsubscribers = [];

  try {
    // Menu Listener
    if (callbacks.onMenuUpdate) {
      const unsub = onSnapshot(collection(db, COLLECTIONS.MENU), (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
          callbacks.onMenuUpdate(items);
        }
      }, (err) => console.error('Menu real-time error:', err));
      unsubscribers.push(unsub);
    }

    // Inventory Listener
    if (callbacks.onInventoryUpdate) {
      const unsub = onSnapshot(collection(db, COLLECTIONS.INVENTORY), (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
          callbacks.onInventoryUpdate(items);
        }
      }, (err) => console.error('Inventory real-time error:', err));
      unsubscribers.push(unsub);
    }

    // Sales Listener (sorted descending by timestamp/date)
    if (callbacks.onSalesUpdate) {
      const unsub = onSnapshot(collection(db, COLLECTIONS.SALES), (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
          items.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id || '').localeCompare(a.id || ''));
          callbacks.onSalesUpdate(items);
        }
      }, (err) => console.error('Sales real-time error:', err));
      unsubscribers.push(unsub);
    }

    // Procurement Listener
    if (callbacks.onProcurementUpdate) {
      const unsub = onSnapshot(collection(db, COLLECTIONS.PROCUREMENT), (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
          items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          callbacks.onProcurementUpdate(items);
        }
      }, (err) => console.error('Procurement real-time error:', err));
      unsubscribers.push(unsub);
    }

    // Expenses Listener
    if (callbacks.onExpensesUpdate) {
      const unsub = onSnapshot(collection(db, COLLECTIONS.EXPENSES), (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
          items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          callbacks.onExpensesUpdate(items);
        }
      }, (err) => console.error('Expenses real-time error:', err));
      unsubscribers.push(unsub);
    }

    // Wastage Listener
    if (callbacks.onWastageUpdate) {
      const unsub = onSnapshot(collection(db, COLLECTIONS.WASTAGE), (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
          items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          callbacks.onWastageUpdate(items);
        }
      }, (err) => console.error('Wastage real-time error:', err));
      unsubscribers.push(unsub);
    }

    // Dining Table Orders Real-Time Listener (Instant Kitchen / Counter Alerts)
    if (callbacks.onDiningOrdersUpdate) {
      const unsub = onSnapshot(collection(db, COLLECTIONS.DINING_ORDERS), (snapshot) => {
        const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        callbacks.onDiningOrdersUpdate(items);
      }, (err) => console.error('Dining orders real-time error:', err));
      unsubscribers.push(unsub);
    }
  } catch (e) {
    console.error('Failed to setup real-time cloud subscriptions:', e);
  }

  return () => {
    unsubscribers.forEach(unsub => {
      try {
        unsub();
      } catch {
        // ignore unmount errors
      }
    });
  };
};

// ==========================================
// 5. 1-Click Upload All Local to Cloud
// ==========================================

export const uploadAllLocalToCloud = async (
  menu = [],
  inventory = [],
  sales = [],
  procurement = [],
  expenses = [],
  wastage = []
) => {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firebase Firestore connect nahi hai. Kripya pehle Settings me jakar config save karein.');
  }

  const tasks = [];
  if (menu && menu.length > 0) tasks.push(syncCloudMenu(menu));
  if (inventory && inventory.length > 0) tasks.push(syncCloudInventory(inventory));
  if (sales && sales.length > 0) tasks.push(syncCloudSales(sales));
  if (procurement && procurement.length > 0) tasks.push(syncCloudProcurement(procurement));
  if (expenses && expenses.length > 0) tasks.push(syncCloudExpenses(expenses));
  if (wastage && wastage.length > 0) tasks.push(syncCloudWastage(wastage));

  await Promise.all(tasks);
  return true;
};

// ==========================================
// 6. JSON Backup & Restore Utilities
// ==========================================

export const exportCafeDataToJson = (data) => {
  const payload = {
    exportDate: new Date().toISOString(),
    version: '2.0',
    appName: 'S&S Cafe Enterprise POS',
    data: {
      menu: data.menu || [],
      inventory: data.inventory || [],
      sales: data.sales || [],
      procurement: data.procurement || [],
      expenses: data.expenses || [],
      wastage: data.wastage || []
    }
  };

  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(payload, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `SS_Cafe_Backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  return true;
};
