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
import { getCurrentCafeId, saveStoredInventory, saveStoredProcurement } from './storage';

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

// Tenant Scoped References
export const getScopedCollectionRef = (db, collectionKey, cafeId = getCurrentCafeId()) => {
  if (cafeId && cafeId !== 'default') {
    const subCol = collectionKey.replace(/^cafe_/, '');
    return collection(db, 'cafes', cafeId, subCol);
  }
  return collection(db, collectionKey);
};

export const getScopedDocRef = (db, collectionKey, id, cafeId = getCurrentCafeId()) => {
  if (cafeId && cafeId !== 'default') {
    const subCol = collectionKey.replace(/^cafe_/, '');
    return doc(db, 'cafes', cafeId, subCol, String(id));
  }
  return doc(db, collectionKey, String(id));
};

// Helper to recursively strip undefined properties so Firestore WriteBatch/setDoc never crashes
export const sanitizeFirestoreData = (data) => {
  if (data === undefined) return null;
  if (data === null) return null;
  if (typeof data !== 'object') return data;
  if (data instanceof Date) return data.toISOString();
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeFirestoreData(item));
  }
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      result[key] = sanitizeFirestoreData(value);
    }
  }
  return result;
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
        const cleanData = sanitizeFirestoreData(data);
        batch.set(ref, cleanData, { merge: true });
      } else if (type === 'delete') {
        batch.delete(ref);
      }
    });

    await batch.commit();
  }
  return true;
};

// Generic single document upsert
const upsertSingleDoc = async (collectionName, item, cafeId = getCurrentCafeId()) => {
  const db = getFirebaseDb();
  if (!db || !item) return false;
  try {
    const id = item.id || `item_${Date.now()}`;
    const docRef = getScopedDocRef(db, collectionName, id, cafeId);
    const cleanData = sanitizeFirestoreData({ ...item, id, _lastSynced: new Date().toISOString() });
    await setDoc(docRef, cleanData, { merge: true });
    return true;
  } catch (err) {
    console.error(`Error upserting doc in ${collectionName}:`, err);
    return false;
  }
};

// Generic single document delete
const deleteSingleDoc = async (collectionName, id, cafeId = getCurrentCafeId()) => {
  const db = getFirebaseDb();
  if (!db || !id) return false;
  try {
    const docRef = getScopedDocRef(db, collectionName, id, cafeId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error(`Error deleting doc in ${collectionName}:`, err);
    return false;
  }
};

// Sync Collection with Batching (handles O(N) items without 1MB single-document limit)
const syncCollectionItems = async (collectionName, items, cafeId = getCurrentCafeId()) => {
  const db = getFirebaseDb();
  if (!db || !Array.isArray(items)) return false;

  try {
    const colRef = getScopedCollectionRef(db, collectionName, cafeId);
    const existingSnap = await getDocs(colRef);
    const currentItemIds = new Set(items.map(i => String(i.id)));
    const operations = [];

    // 1. Delete documents from Firestore that are no longer present in local array
    existingSnap.docs.forEach((d) => {
      if (!currentItemIds.has(String(d.id))) {
        operations.push({
          type: 'delete',
          ref: d.ref
        });
      }
    });

    // 2. Set / update all active items
    items.forEach((item) => {
      const id = item.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      operations.push({
        type: 'set',
        ref: getScopedDocRef(db, collectionName, id, cafeId),
        data: sanitizeFirestoreData({ ...item, id, _lastSynced: new Date().toISOString() })
      });
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

export const syncCloudMenu = async (items, cafeId = getCurrentCafeId()) => {
  return syncCollectionItems(COLLECTIONS.MENU, items, cafeId);
};

export const syncCloudInventory = async (items, cafeId = getCurrentCafeId()) => {
  return syncCollectionItems(COLLECTIONS.INVENTORY, items, cafeId);
};

export const syncCloudSales = async (items, cafeId = getCurrentCafeId()) => {
  return syncCollectionItems(COLLECTIONS.SALES, items, cafeId);
};

export const syncCloudProcurement = async (items, cafeId = getCurrentCafeId()) => {
  return syncCollectionItems(COLLECTIONS.PROCUREMENT, items, cafeId);
};

export const syncCloudExpenses = async (items, cafeId = getCurrentCafeId()) => {
  return syncCollectionItems(COLLECTIONS.EXPENSES, items, cafeId);
};

export const syncCloudWastage = async (items, cafeId = getCurrentCafeId()) => {
  return syncCollectionItems(COLLECTIONS.WASTAGE, items, cafeId);
};

// ==========================================
// 2. Granular Fast CRUD Sync Methods
// ==========================================

export const syncSingleSale = (sale, cafeId = getCurrentCafeId()) => upsertSingleDoc(COLLECTIONS.SALES, sale, cafeId);
export const deleteSingleSale = (saleId, cafeId = getCurrentCafeId()) => deleteSingleDoc(COLLECTIONS.SALES, saleId, cafeId);

export const syncSingleInventory = (item, cafeId = getCurrentCafeId()) => upsertSingleDoc(COLLECTIONS.INVENTORY, item, cafeId);
export const deleteSingleInventory = (itemId, cafeId = getCurrentCafeId()) => deleteSingleDoc(COLLECTIONS.INVENTORY, itemId, cafeId);

export const syncSingleMenuItem = (item, cafeId = getCurrentCafeId()) => upsertSingleDoc(COLLECTIONS.MENU, item, cafeId);
export const deleteSingleMenuItem = (itemId, cafeId = getCurrentCafeId()) => deleteSingleDoc(COLLECTIONS.MENU, itemId, cafeId);

export const syncSingleProcurement = (proc, cafeId = getCurrentCafeId()) => upsertSingleDoc(COLLECTIONS.PROCUREMENT, proc, cafeId);
export const deleteSingleProcurement = (procId, cafeId = getCurrentCafeId()) => deleteSingleDoc(COLLECTIONS.PROCUREMENT, procId, cafeId);

export const syncSingleExpense = (exp, cafeId = getCurrentCafeId()) => upsertSingleDoc(COLLECTIONS.EXPENSES, exp, cafeId);
export const deleteSingleExpense = (expId, cafeId = getCurrentCafeId()) => deleteSingleDoc(COLLECTIONS.EXPENSES, expId, cafeId);

export const syncSingleWastage = (waste, cafeId = getCurrentCafeId()) => upsertSingleDoc(COLLECTIONS.WASTAGE, waste, cafeId);
export const deleteSingleWastage = (wasteId, cafeId = getCurrentCafeId()) => deleteSingleDoc(COLLECTIONS.WASTAGE, wasteId, cafeId);

export const syncCloudDiningOrders = async (items, cafeId = getCurrentCafeId()) => {
  return syncCollectionItems(COLLECTIONS.DINING_ORDERS, items, cafeId);
};
export const syncSingleDiningOrder = (order, cafeId = getCurrentCafeId()) => upsertSingleDoc(COLLECTIONS.DINING_ORDERS, order, cafeId);
export const deleteSingleDiningOrder = (orderId, cafeId = getCurrentCafeId()) => deleteSingleDoc(COLLECTIONS.DINING_ORDERS, orderId, cafeId);

// ==========================================
// 3. Fetch All Cloud Data (with Auto-Migration)
// ==========================================

export const fetchAllCloudData = async (cafeId = getCurrentCafeId()) => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    // 1. Query individual production collections
    const [menuSnap, invSnap, salesSnap, procSnap, expSnap, wasteSnap, diningSnap] = await Promise.all([
      getDocs(getScopedCollectionRef(db, COLLECTIONS.MENU, cafeId)),
      getDocs(getScopedCollectionRef(db, COLLECTIONS.INVENTORY, cafeId)),
      getDocs(getScopedCollectionRef(db, COLLECTIONS.SALES, cafeId)),
      getDocs(getScopedCollectionRef(db, COLLECTIONS.PROCUREMENT, cafeId)),
      getDocs(getScopedCollectionRef(db, COLLECTIONS.EXPENSES, cafeId)),
      getDocs(getScopedCollectionRef(db, COLLECTIONS.WASTAGE, cafeId)),
      getDocs(getScopedCollectionRef(db, COLLECTIONS.DINING_ORDERS, cafeId))
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

    // Auto-restore Friend's Real Inventory if tenant inventory is empty
    if (!result.inventory || result.inventory.length === 0) {
      try {
        const rootInvSnap = await getDocs(collection(db, COLLECTIONS.INVENTORY));
        if (!rootInvSnap.empty) {
          const rootInv = rootInvSnap.docs.map(d => ({ ...d.data(), id: d.id }));
          result.inventory = rootInv;
          syncCloudInventory(rootInv, cafeId);
        } else {
          result.inventory = [...FRIEND_REAL_INVENTORY_ITEMS];
        }
      } catch (e) {
        console.warn('Fallback to friend real inventory snapshot:', e);
        result.inventory = [...FRIEND_REAL_INVENTORY_ITEMS];
      }
    }

    // Auto-restore Friend's Real Procurement if tenant procurement is empty
    if (!result.procurement || result.procurement.length === 0) {
      try {
        const rootProcSnap = await getDocs(collection(db, COLLECTIONS.PROCUREMENT));
        if (!rootProcSnap.empty) {
          const rootProc = rootProcSnap.docs.map(d => ({ ...d.data(), id: d.id }));
          result.procurement = rootProc;
          syncCloudProcurement(rootProc, cafeId);
        } else {
          result.procurement = [...FRIEND_REAL_PROCUREMENT_LOGS];
        }
      } catch (e) {
        console.warn('Fallback to friend real procurement snapshot:', e);
        result.procurement = [...FRIEND_REAL_PROCUREMENT_LOGS];
      }
    }

    // 2. Backward compatibility: If modern collections are empty and cafeId is default, check legacy single document
    const hasModernData = Object.values(result).some(arr => arr && arr.length > 0);

    if (!hasModernData && cafeId === 'default') {
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
          legacyData.wastage || [],
          cafeId
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

export const subscribeToCloudData = (callbacks = {}, cafeId = getCurrentCafeId()) => {
  const db = getFirebaseDb();
  if (!db) return () => {};

  const unsubscribers = [];

  try {
    // Menu Listener
    if (callbacks.onMenuUpdate) {
      const unsub = onSnapshot(getScopedCollectionRef(db, COLLECTIONS.MENU, cafeId), (snapshot) => {
        const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        callbacks.onMenuUpdate(items);
      }, (err) => console.error('Menu real-time error:', err));
      unsubscribers.push(unsub);
    }

    // Inventory Listener
    if (callbacks.onInventoryUpdate) {
      const unsub = onSnapshot(getScopedCollectionRef(db, COLLECTIONS.INVENTORY, cafeId), (snapshot) => {
        const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        callbacks.onInventoryUpdate(items);
      }, (err) => console.error('Inventory real-time error:', err));
      unsubscribers.push(unsub);
    }

    // Sales Listener (sorted descending by timestamp/date)
    if (callbacks.onSalesUpdate) {
      const unsub = onSnapshot(getScopedCollectionRef(db, COLLECTIONS.SALES, cafeId), (snapshot) => {
        const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        items.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id || '').localeCompare(a.id || ''));
        callbacks.onSalesUpdate(items);
      }, (err) => console.error('Sales real-time error:', err));
      unsubscribers.push(unsub);
    }

    // Procurement Listener
    if (callbacks.onProcurementUpdate) {
      const unsub = onSnapshot(getScopedCollectionRef(db, COLLECTIONS.PROCUREMENT, cafeId), (snapshot) => {
        const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        callbacks.onProcurementUpdate(items);
      }, (err) => console.error('Procurement real-time error:', err));
      unsubscribers.push(unsub);
    }

    // Expenses Listener
    if (callbacks.onExpensesUpdate) {
      const unsub = onSnapshot(getScopedCollectionRef(db, COLLECTIONS.EXPENSES, cafeId), (snapshot) => {
        const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        callbacks.onExpensesUpdate(items);
      }, (err) => console.error('Expenses real-time error:', err));
      unsubscribers.push(unsub);
    }

    // Wastage Listener
    if (callbacks.onWastageUpdate) {
      const unsub = onSnapshot(getScopedCollectionRef(db, COLLECTIONS.WASTAGE, cafeId), (snapshot) => {
        const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        callbacks.onWastageUpdate(items);
      }, (err) => console.error('Wastage real-time error:', err));
      unsubscribers.push(unsub);
    }

    // Dining Table Orders Real-Time Listener (Instant Kitchen / Counter Alerts)
    if (callbacks.onDiningOrdersUpdate) {
      const unsub = onSnapshot(getScopedCollectionRef(db, COLLECTIONS.DINING_ORDERS, cafeId), (snapshot) => {
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
  wastage = [],
  cafeId = getCurrentCafeId()
) => {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firebase Firestore connect nahi hai. Kripya pehle Settings me jakar config save karein.');
  }

  const tasks = [];
  if (menu && menu.length > 0) tasks.push(syncCloudMenu(menu, cafeId));
  if (inventory && inventory.length > 0) tasks.push(syncCloudInventory(inventory, cafeId));
  if (sales && sales.length > 0) tasks.push(syncCloudSales(sales, cafeId));
  if (procurement && procurement.length > 0) tasks.push(syncCloudProcurement(procurement, cafeId));
  if (expenses && expenses.length > 0) tasks.push(syncCloudExpenses(expenses, cafeId));
  if (wastage && wastage.length > 0) tasks.push(syncCloudWastage(wastage, cafeId));

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

// ==========================================
// 7. Wipe Tenant Data for Clean Slate (Production Mode)
// ==========================================
export const wipeCloudTenantCollections = async (cafeId = getCurrentCafeId(), options = {}) => {
  const db = getFirebaseDb();
  if (!db || !cafeId) return false;

  const {
    clearMenu = true,
    clearInventory = true,
    clearProcurement = true,
    clearPurchases = true,
    clearWastage = true,
    clearSales = false,
    clearExpenses = false,
    clearDiningOrders = true
  } = options;

  const shouldClearPurchases = clearProcurement || clearPurchases;

  const targetCollections = [];
  if (clearMenu) targetCollections.push(COLLECTIONS.MENU);
  if (clearInventory) targetCollections.push(COLLECTIONS.INVENTORY);
  if (shouldClearPurchases) targetCollections.push(COLLECTIONS.PROCUREMENT);
  if (clearWastage) targetCollections.push(COLLECTIONS.WASTAGE);
  if (clearSales) targetCollections.push(COLLECTIONS.SALES);
  if (clearExpenses) targetCollections.push(COLLECTIONS.EXPENSES);
  if (clearDiningOrders) targetCollections.push(COLLECTIONS.DINING_ORDERS);

  for (const colKey of targetCollections) {
    try {
      const colRef = getScopedCollectionRef(db, colKey, cafeId);
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (e) {
      console.warn(`Could not clear cloud collection ${colKey}:`, e);
    }
  }

  // If cafeId is default, also wipe legacy single documents so old demo data never revives
  if (cafeId === 'default') {
    try {
      const legacyKeys = [];
      if (clearMenu) legacyKeys.push('menu');
      if (clearInventory) legacyKeys.push('inventory');
      if (shouldClearPurchases) legacyKeys.push('procurement');
      if (clearWastage) legacyKeys.push('wastage');
      if (clearSales) legacyKeys.push('sales');
      if (clearExpenses) legacyKeys.push('expenses');

      for (const k of legacyKeys) {
        try {
          await deleteDoc(doc(db, COLLECTIONS.LEGACY, k));
        } catch (err) {}
      }
    } catch (e) {}
  }

  return true;
};

// ==========================================
// 6. Friend's Real Stock & Purchase Data
// ==========================================

export const FRIEND_REAL_INVENTORY_ITEMS = [
  {
    id: 'custom-1791547995467',
    materialName: 'ketchup',
    category: 'Groceries',
    currentStock: 1,
    unit: 'Gram',
    unitCost: 80,
    reorderLevel: 5,
    lastUpdated: '2026-10-12'
  },
  {
    id: 'custom-1791548026393',
    materialName: 'onion',
    category: 'Groceries',
    currentStock: 1,
    unit: 'Gram',
    unitCost: 62,
    reorderLevel: 5,
    lastUpdated: '2026-10-12'
  },
  {
    id: 'custom-1791548061364',
    materialName: 'chipotale',
    category: 'Dairy & Cheese',
    currentStock: 3.01,
    unit: 'Liters',
    unitCost: 173.25,
    reorderLevel: 5,
    lastUpdated: '2026-10-12'
  },
  {
    id: 'inv-1790662856273',
    materialName: 'Mozzarella Cheese',
    category: 'Dairy & Cheese',
    currentStock: 7.05,
    unit: 'Kg',
    unitCost: 488.25,
    reorderLevel: 5,
    lastUpdated: '2026-10-12'
  },
  {
    id: 'inv-1791544770402',
    materialName: 'Burger Buns',
    category: 'Bakery & Breads',
    currentStock: 8,
    unit: 'Packs',
    unitCost: 7.5,
    reorderLevel: 5,
    lastUpdated: '2026-10-12'
  },
  {
    id: 'inv-1791546930556',
    materialName: 'French Fries (Frozen)',
    category: 'Frozen & Pre-Cooked',
    currentStock: 7500,
    unit: 'Gram',
    unitCost: 0.096,
    reorderLevel: 5,
    lastUpdated: '2026-10-12'
  },
  {
    id: 'inv-1791548337575',
    materialName: 'herb chilli patty',
    category: 'Frozen & Pre-Cooked',
    currentStock: 75,
    unit: 'Units',
    unitCost: 7.8,
    reorderLevel: 5,
    lastUpdated: '2026-10-12'
  }
];

export const FRIEND_REAL_PROCUREMENT_LOGS = [
  {
    id: 'proc-1791546764221',
    materialName: 'Veg Aloo Patty',
    category: 'Groceries',
    quantityReceived: 60,
    unit: 'Piece',
    ratePerUnit: 8.75,
    totalCost: 525,
    supplier: 'tirupati trading company',
    date: '2026-10-12',
    createdAt: '2026-10-12T10:00:00.000Z'
  },
  {
    id: 'proc-1791546930555',
    materialName: 'French Fries (Frozen)',
    category: 'Groceries',
    quantityReceived: 7.5,
    unit: 'Kg',
    ratePerUnit: 96,
    totalCost: 720,
    supplier: 'Tirupati Trading Company',
    date: '2026-10-12',
    createdAt: '2026-10-12T10:05:00.000Z'
  },
  {
    id: 'proc-1791547129266',
    materialName: 'Veg Aloo Patty',
    category: 'Groceries',
    quantityReceived: 75,
    unit: 'Piece',
    ratePerUnit: 7.8,
    totalCost: 585,
    supplier: 'tirupati trading company',
    date: '2026-10-12',
    createdAt: '2026-10-12T10:10:00.000Z'
  },
  {
    id: 'proc-1791547190163',
    materialName: 'Mozzarella Cheese',
    category: 'Dairy & Cheese',
    quantityReceived: 4,
    unit: 'Kg',
    ratePerUnit: 488.25,
    totalCost: 1953,
    supplier: 'tirupati trading company',
    date: '2026-10-12',
    createdAt: '2026-10-12T10:15:00.000Z'
  }
];

export const restoreFriendRealData = async (cafeId = getCurrentCafeId()) => {
  const db = getFirebaseDb();
  let invItems = [...FRIEND_REAL_INVENTORY_ITEMS];
  let procItems = [...FRIEND_REAL_PROCUREMENT_LOGS];

  if (db) {
    try {
      const rootInvSnap = await getDocs(collection(db, COLLECTIONS.INVENTORY));
      if (!rootInvSnap.empty) {
        invItems = rootInvSnap.docs.map(d => ({ ...d.data(), id: d.id }));
      }
      const rootProcSnap = await getDocs(collection(db, COLLECTIONS.PROCUREMENT));
      if (!rootProcSnap.empty) {
        procItems = rootProcSnap.docs.map(d => ({ ...d.data(), id: d.id }));
      }
    } catch (e) {
      console.warn('Could not read root collections, using cached real data snapshot:', e);
    }

    // Save to tenant cloud collections
    await Promise.all([
      syncCloudInventory(invItems, cafeId),
      syncCloudProcurement(procItems, cafeId)
    ]);
  }

  // Save to local storage
  saveStoredInventory(invItems, cafeId);
  saveStoredProcurement(procItems, cafeId);

  return { inventory: invItems, procurement: procItems };
};


