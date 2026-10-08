import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import FinancialDashboard from './components/FinancialDashboard';
import SalesTracker from './components/SalesTracker';
import ProcurementLog from './components/ProcurementLog';
import InventoryTracker from './components/InventoryTracker';
import ItemTable from './components/ItemTable';
import ItemCards from './components/ItemCards';
import ItemModal from './components/ItemModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import CloudConfigModal from './components/CloudConfigModal';
import ExcelExportModal from './components/ExcelExportModal';
import CustomerMenuOrderView from './components/CustomerMenuOrderView';
import DiningManager from './components/DiningManager';
import ExpenseTracker from './components/ExpenseTracker';
import AuthModal from './components/AuthModal';
import CafeProfileModal from './components/CafeProfileModal';
import LandingPage from './components/LandingPage';
import AIMenuScannerModal from './components/AIMenuScannerModal';
import StockAlertSettingsModal from './components/StockAlertSettingsModal';
import {
  subscribeToAuthChanges,
  getLocalActiveCafe,
  logoutCafeOwner
} from './utils/auth';
import { triggerAutomaticStockAlerts, sendTelegramNewOrderAlert } from './utils/whatsappAlert';
import { playOrderChime } from './utils/audioAlert';
import {
  setCurrentCafeId,
  getCurrentCafeId,
  getStoredMenu, saveStoredMenu,
  getStoredSales, saveStoredSales,
  getStoredProcurement, saveStoredProcurement,
  getStoredInventory, saveStoredInventory,
  getStoredExpenses, saveStoredExpenses,
  getStoredWastage, saveStoredWastage,
  getStoredDiningOrders, saveStoredDiningOrders,
  getStoredSettlements, saveStoredSettlements,
  calculateAggregatorLedger,
  checkItemStock,
  convertQuantity,
  findMatchingInventoryItem,
  KNOWN_MATERIAL_ALIASES,
  INITIAL_INVENTORY_ITEMS
} from './utils/storage';
import { isFirebaseConfigured } from './utils/firebase';
import {
  syncCloudMenu,
  syncCloudInventory,
  syncCloudSales,
  syncCloudProcurement,
  syncCloudExpenses,
  syncCloudWastage,
  syncSingleDiningOrder,
  deleteSingleDiningOrder,
  deleteSingleSale,
  deleteSingleProcurement,
  deleteSingleExpense,
  deleteSingleWastage,
  deleteSingleInventory,
  deleteSingleMenuItem,
  fetchAllCloudData,
  subscribeToCloudData
} from './utils/cloudSync';
import AggregatorSettlementModal from './components/AggregatorSettlementModal';
import { PieChart, ShoppingBag, PackageCheck, Coffee, CheckCircle2, Plus, Boxes, Receipt, UtensilsCrossed, Bike, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('sales'); // 'sales', 'inventory', 'dashboard', 'procurement', 'menu'

  const [menuItems, setMenuItems] = useState([]);
  const [salesLogs, setSalesLogs] = useState([]);
  const [procurementLogs, setProcurementLogs] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [wastageLogs, setWastageLogs] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [isAggregatorModalOpen, setIsAggregatorModalOpen] = useState(false);


  // Multi-Tenant Cafe & User Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentCafe, setCurrentCafe] = useState(getLocalActiveCafe() || {
    cafeId: 'default',
    cafeName: 'S&S Cafe',
    ownerName: 'Admin',
    city: 'Indore',
    role: 'owner'
  });
  const [userCafes, setUserCafes] = useState([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'signup'
  const [authModalPlan, setAuthModalPlan] = useState('');
  const [isCafeProfileModalOpen, setIsCafeProfileModalOpen] = useState(false);

  // Cloud Database Sync State
  const [isCloudConnected, setIsCloudConnected] = useState(isFirebaseConfigured());
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);

  // Excel Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // AI Menu Photo & Text Importer Modal State
  const [isAIScannerOpen, setIsAIScannerOpen] = useState(false);

  // Communications & WhatsApp Silent Gateway Modal State
  const [isAlertSettingsOpen, setIsAlertSettingsOpen] = useState(false);

  // Dine-In Customer QR Mode & Dining Orders State
  const getInitialTableParam = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const table = params.get('table');
      if (table) return table;
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, '').replace(/^order\??/, ''));
        return hashParams.get('table');
      }
    } catch (e) {}
    return null;
  };

  const getInitialCafeParam = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const c = params.get('cafe');
      if (c) return c;
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, '').replace(/^order\??/, ''));
        return hashParams.get('cafe');
      }
    } catch (e) {}
    return null;
  };

  const [customerTableNumber, setCustomerTableNumber] = useState(getInitialTableParam());
  const [isCustomerMode, setIsCustomerMode] = useState(Boolean(getInitialTableParam()));
  const [diningOrders, setDiningOrders] = useState([]);

  // Modal State for Menu
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [viewMode, setViewMode] = useState('cards');

  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  // Helper to load and consolidate data for a specific cafe tenant
  const loadCafeData = (cafeId) => {
    const activeId = cafeId || 'default';
    setCurrentCafeId(activeId);
    const rawMenu = getStoredMenu(activeId);
    const rawSales = getStoredSales(activeId);
    const rawProc = getStoredProcurement(activeId);
    let rawInv = getStoredInventory(activeId);

    // Auto-fix/normalize any existing misspelled items in inventory
    let invChanged = false;
    const consolidatedInv = [];

    const getCanonicalName = (name) => {
      const lower = (name || '').toLowerCase().trim();
      for (const [canonical, aliases] of Object.entries(KNOWN_MATERIAL_ALIASES)) {
        if (aliases.some(a => lower === a || lower.includes(a) || a.includes(lower))) {
          const match = INITIAL_INVENTORY_ITEMS.find(p => p.materialName.toLowerCase() === canonical);
          return match ? match.materialName : canonical;
        }
      }
      return name;
    };

    rawInv.forEach(item => {
      const canonicalName = getCanonicalName(item.materialName);
      if (canonicalName !== item.materialName) {
        invChanged = true;
        const standardDef = INITIAL_INVENTORY_ITEMS.find(p => p.materialName.toLowerCase() === canonicalName.toLowerCase());
        const targetUnit = standardDef ? standardDef.unit : item.unit;
        const targetCategory = standardDef ? standardDef.category : item.category;

        let stockToAdd = Number(item.currentStock) || 0;
        if ((item.unit === 'Kg' || item.unit === 'Piece' || stockToAdd <= 20) && targetUnit === 'Gram') {
          stockToAdd = stockToAdd * 1000;
        } else {
          stockToAdd = convertQuantity(stockToAdd, item.unit, targetUnit);
        }

        const existing = consolidatedInv.find(c => c.materialName.toLowerCase() === canonicalName.toLowerCase());
        if (existing) {
          existing.currentStock = Math.round((existing.currentStock + stockToAdd) * 100) / 100;
        } else {
          consolidatedInv.push({
            ...item,
            materialName: canonicalName,
            category: targetCategory,
            unit: targetUnit,
            currentStock: stockToAdd
          });
        }
      } else {
        const existing = consolidatedInv.find(c => c.materialName.toLowerCase() === item.materialName.toLowerCase());
        if (existing) {
          existing.currentStock = Math.round((existing.currentStock + Number(item.currentStock)) * 100) / 100;
          invChanged = true;
        } else {
          consolidatedInv.push(item);
        }
      }
    });

    if (invChanged) {
      saveStoredInventory(consolidatedInv, activeId);
      rawInv = consolidatedInv;
    }

    setMenuItems(rawMenu);
    setSalesLogs(rawSales);
    setProcurementLogs(rawProc);
    setInventoryItems(rawInv);
    setExpenses(getStoredExpenses(activeId));
    setWastageLogs(getStoredWastage(activeId));
    setDiningOrders(getStoredDiningOrders(activeId));
    setSettlements(getStoredSettlements(activeId));
  };

  // 1. Subscribe to Firebase Auth State Changes & Multi-Tenant Profile
  useEffect(() => {
    const unsubAuth = subscribeToAuthChanges(({ user, cafe, cafes }) => {
      setCurrentUser(user);
      if (user && cafe) {
        setIsDemoMode(false);
        setCurrentCafe(cafe);
        setUserCafes(cafes);
        loadCafeData(cafe.cafeId);
      } else if (!user) {
        const urlCafe = getInitialCafeParam();
        if (urlCafe) {
          loadCafeData(urlCafe);
        }
      }
    });

    return () => unsubAuth();
  }, []);

  // 2. Real-time Firebase Sync listener for active Cafe tenant
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setIsCloudConnected(false);
      return;
    }

    setIsCloudConnected(true);
    const activeId = currentCafe?.cafeId || 'default';

    // Initial fetch from cloud for active cafe
    fetchAllCloudData(activeId).then((cloudData) => {
      if (cloudData) {
        if (cloudData.menu && Array.isArray(cloudData.menu) && cloudData.menu.length > 0) {
          setMenuItems(cloudData.menu);
          saveStoredMenu(cloudData.menu, activeId);
        } else {
          const localMenu = getStoredMenu(activeId);
          if (localMenu && localMenu.length > 0) syncCloudMenu(localMenu, activeId);
        }
        if (cloudData.inventory && Array.isArray(cloudData.inventory) && cloudData.inventory.length > 0) {
          setInventoryItems(cloudData.inventory);
          saveStoredInventory(cloudData.inventory, activeId);
        } else {
          const localInv = getStoredInventory(activeId);
          if (localInv && localInv.length > 0) syncCloudInventory(localInv, activeId);
        }
        if (cloudData.sales && Array.isArray(cloudData.sales) && cloudData.sales.length > 0) {
          setSalesLogs(cloudData.sales);
          saveStoredSales(cloudData.sales, activeId);
        }
        if (cloudData.procurement && Array.isArray(cloudData.procurement) && cloudData.procurement.length > 0) {
          setProcurementLogs(cloudData.procurement);
          saveStoredProcurement(cloudData.procurement, activeId);
        }
        if (cloudData.expenses && Array.isArray(cloudData.expenses)) {
          setExpenses(cloudData.expenses);
          saveStoredExpenses(cloudData.expenses, activeId);
        }
        if (cloudData.wastage && Array.isArray(cloudData.wastage)) {
          setWastageLogs(cloudData.wastage);
          saveStoredWastage(cloudData.wastage, activeId);
        }
        if (cloudData.diningOrders && Array.isArray(cloudData.diningOrders)) {
          setDiningOrders(cloudData.diningOrders);
          saveStoredDiningOrders(cloudData.diningOrders, activeId);
        }
      }
    });

    // Realtime subscription across devices for this active cafe
    const unsubscribe = subscribeToCloudData({
      onMenuUpdate: (newMenu) => {
        setMenuItems(newMenu);
        saveStoredMenu(newMenu, activeId);
      },
      onInventoryUpdate: (newInv) => {
        setInventoryItems(newInv);
        saveStoredInventory(newInv, activeId);
      },
      onSalesUpdate: (newSales) => {
        setSalesLogs(newSales);
        saveStoredSales(newSales, activeId);
      },
      onProcurementUpdate: (newProc) => {
        setProcurementLogs(newProc);
        saveStoredProcurement(newProc, activeId);
      },
      onExpensesUpdate: (newExp) => {
        setExpenses(newExp);
        saveStoredExpenses(newExp, activeId);
      },
      onWastageUpdate: (newWaste) => {
        setWastageLogs(newWaste);
        saveStoredWastage(newWaste, activeId);
      },
      onDiningOrdersUpdate: (newOrders) => {
        setDiningOrders(prevOrders => {
          const prevIds = new Set(prevOrders.map(o => o.id));
          const hasNewIncoming = newOrders.some(o => !prevIds.has(o.id) && o.status === 'pending');
          if (hasNewIncoming) {
            playOrderChime();
            const newest = newOrders.find(o => !prevIds.has(o.id));
            showToast(`🔔 Naya Dine-In Order: Table #${newest ? newest.tableNumber : ''} (₹${newest ? newest.totalAmount : ''})`);
          }
          return newOrders;
        });
        saveStoredDiningOrders(newOrders, activeId);
      }
    }, activeId);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isCloudConnected, currentCafe?.cafeId]);

  // Save State (LocalStorage + Cloud Firestore) scoped to active cafe
  const updateMenu = (newItems) => {
    const activeId = currentCafe?.cafeId || 'default';
    setMenuItems(newItems);
    saveStoredMenu(newItems, activeId);
    if (isFirebaseConfigured()) syncCloudMenu(newItems, activeId);
  };

  const handleImportScannedMenuItems = (scannedList, mode) => {
    if (!scannedList || scannedList.length === 0) return;
    let updatedMenu = [];
    if (mode === 'replace') {
      updatedMenu = scannedList;
      showToast(`✨ Successfully imported ${scannedList.length} items to your cafe menu!`);
    } else {
      // Merge mode: preserve existing items, append only items with different names
      const existingNames = new Set(menuItems.map(m => m.name.toLowerCase().trim()));
      const newItems = scannedList.filter(s => !existingNames.has(s.name.toLowerCase().trim()));
      updatedMenu = [...menuItems, ...newItems];
      showToast(`✨ Added ${newItems.length} new items to your menu (${existingNames.size} retained)!`);
    }
    updateMenu(updatedMenu);
  };
  const updateSales = (newSales) => {
    const activeId = currentCafe?.cafeId || 'default';
    setSalesLogs(newSales);
    saveStoredSales(newSales, activeId);
    if (isFirebaseConfigured()) syncCloudSales(newSales, activeId);
  };
  const updateProcurement = (newProc) => {
    const activeId = currentCafe?.cafeId || 'default';
    setProcurementLogs(newProc);
    saveStoredProcurement(newProc, activeId);
    if (isFirebaseConfigured()) syncCloudProcurement(newProc, activeId);
  };
  const updateInventory = (newInv) => {
    const activeId = currentCafe?.cafeId || 'default';
    setInventoryItems(newInv);
    saveStoredInventory(newInv, activeId);
    if (isFirebaseConfigured()) syncCloudInventory(newInv, activeId);
    triggerAutomaticStockAlerts(newInv);
  };
  const updateExpenses = (newExp) => {
    const activeId = currentCafe?.cafeId || 'default';
    setExpenses(newExp);
    saveStoredExpenses(newExp, activeId);
    if (isFirebaseConfigured()) syncCloudExpenses(newExp, activeId);
  };
  const updateWastage = (newWaste) => {
    const activeId = currentCafe?.cafeId || 'default';
    setWastageLogs(newWaste);
    saveStoredWastage(newWaste, activeId);
    if (isFirebaseConfigured()) syncCloudWastage(newWaste, activeId);
  };

  // 💸 Expenses & Overhead Handlers
  const handleAddExpense = (newExp) => {
    const updated = [newExp, ...expenses];
    updateExpenses(updated);
    showToast(`Logged bill/expense: "${newExp.title}" (₹${newExp.amount})`);
  };

  const handleUpdateExpense = (updatedExp) => {
    const updated = expenses.map(e => e.id === updatedExp.id ? updatedExp : e);
    updateExpenses(updated);
    showToast(`Updated expense: "${updatedExp.title}"`);
  };

  const handleDeleteExpense = (id) => {
    const activeId = currentCafe?.cafeId || 'default';
    const updated = expenses.filter(e => e.id !== id);
    updateExpenses(updated);
    if (isFirebaseConfigured()) deleteSingleExpense(id, activeId);
    showToast('Expense entry deleted');
  };

  // 🛵 Aggregator Settlement Handlers (Swiggy / Zomato Weekly Payouts)
  const handleAddSettlement = (newSettlement) => {
    const activeId = currentCafe?.cafeId || 'default';
    const updated = [newSettlement, ...settlements];
    setSettlements(updated);
    saveStoredSettlements(updated, activeId);
    showToast(`✅ ${newSettlement.platform} Weekly Settlement of ₹${newSettlement.grossAmount} recorded!`);
  };

  const handleDeleteSettlement = (id) => {
    const activeId = currentCafe?.cafeId || 'default';
    const updated = settlements.filter(s => s.id !== id);
    setSettlements(updated);
    saveStoredSettlements(updated, activeId);
    showToast('Settlement record deleted');
  };

  const handleClearAllSettlements = () => {
    const activeId = currentCafe?.cafeId || 'default';
    setSettlements([]);
    saveStoredSettlements([], activeId);
    showToast('All settlement history cleared');
  };

  // Auth & Multi-Cafe Handlers
  const handleAuthSuccess = ({ user, cafe, cafes }) => {
    setCurrentUser(user);
    if (cafe) {
      setCurrentCafe(cafe);
      setUserCafes(cafes);
      loadCafeData(cafe.cafeId);
    }
    showToast(`🎉 Swagat hai, ${cafe?.cafeName || 'Cafe Owner'}!`);
  };

  const handleSwitchCafe = (cafe) => {
    setCurrentCafe(cafe);
    loadCafeData(cafe.cafeId);
    showToast(`Switched to "${cafe.cafeName}"`);
  };

  const handleLogout = async () => {
    await logoutCafeOwner();
    setCurrentUser(null);
    setIsDemoMode(false);
    showToast('Logged out successfully');
  };

  // 🗑️ Raw Material Spoilage / Wastage Handlers (Auto Stock Deduction)
  const handleAddWastage = (entry) => {
    // 1. Deduct raw material quantity from current stock in inventory
    const updatedInv = inventoryItems.map(item => {
      if (item.id === entry.ingredientId) {
        const newStock = Math.max(0, Math.round((Number(item.currentStock) - Number(entry.quantity)) * 100) / 100);
        return {
          ...item,
          currentStock: newStock,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return item;
    });
    updateInventory(updatedInv);

    // 2. Add to wastage records
    const updatedWastage = [entry, ...wastageLogs];
    updateWastage(updatedWastage);
    showToast(`⚠️ Kharab Maal Logged: Deducted ${entry.quantity} ${entry.unit} from "${entry.ingredientName}". Loss: ₹${entry.costValue}`);
  };

  const handleDeleteWastage = (id) => {
    const toDelete = wastageLogs.find(w => w.id === id);
    if (toDelete) {
      // Revert raw material stock
      const updatedInv = inventoryItems.map(item => {
        if (item.id === toDelete.ingredientId) {
          const newStock = Math.round((Number(item.currentStock) + Number(toDelete.quantity)) * 100) / 100;
          return {
            ...item,
            currentStock: newStock,
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        }
        return item;
      });
      updateInventory(updatedInv);
    }
    const updatedWastage = wastageLogs.filter(w => w.id !== id);
    updateWastage(updatedWastage);
    if (isFirebaseConfigured()) deleteSingleWastage(id);
    showToast('Wastage record deleted & raw material stock restored');
  };

  // ⚡ Sales Handlers with Automatic Recipe Raw Material Deduction & Strict Stock Guard
  const handleAddSale = (newSale) => {
    // 1. Verify that raw materials exist and are in stock
    const targetMenuItem = menuItems.find(m => m.id === newSale.itemId || m.name === newSale.itemName);
    const qty = Number(newSale.quantitySold) || 1;

    if (targetMenuItem) {
      const stockStatus = checkItemStock(targetMenuItem, inventoryItems);
      if (stockStatus.isOutOfStock) {
        const missingList = stockStatus.missing && stockStatus.missing.length > 0
          ? stockStatus.missing.map(m => m.name).join(', ')
          : 'Raw Material 0 stock';
        showToast(`🚫 Sale Blocked: "${newSale.itemName}" OUT OF STOCK hai! Raw material uplabdh nahi hai (${missingList}).`);
        return false; // Stop! Strict block.
      }

      if (stockStatus.maxPortions < qty) {
        showToast(`⚠️ Stock kam hai! "${newSale.itemName}" ke sirf ${stockStatus.maxPortions} portions ban sakte hain.`);
        return false;
      }
    }

    // 2. Commit Sale
    const updatedSales = [newSale, ...salesLogs];
    updateSales(updatedSales);

    // 3. Deduct raw materials from inventory based on recipe with unit conversion
    if (targetMenuItem && Array.isArray(targetMenuItem.recipe) && targetMenuItem.recipe.length > 0) {
      let deductedInfo = [];
      const updatedInv = inventoryItems.map(invItem => {
        const recipeMatch = targetMenuItem.recipe.find(r => {
          const matched = findMatchingInventoryItem(r.ingredientId, [invItem]) ||
            findMatchingInventoryItem(r.name, [invItem]);
          return Boolean(matched);
        });

        if (recipeMatch) {
          const recipeNeeded = (Number(recipeMatch.quantity) || 0) * qty;
          const deductAmount = convertQuantity(recipeNeeded, recipeMatch.unit, invItem.unit);
          const newStock = Math.max(0, Math.round((Number(invItem.currentStock) - deductAmount) * 100) / 100);
          deductedInfo.push(`${deductAmount} ${invItem.unit} ${invItem.materialName}`);
          return {
            ...invItem,
            currentStock: newStock,
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        }
        return invItem;
      });

      updateInventory(updatedInv);
      if (deductedInfo.length > 0) {
        showToast(`⚡ Sale: ${qty}x ${newSale.itemName} • Raw Material Deducted: ${deductedInfo.join(', ')}`);
        return true;
      }
    } else if (targetMenuItem) {
      // Check direct raw material deduction if matching item exists
      const directIndex = inventoryItems.findIndex(
        i => i.materialName.toLowerCase() === targetMenuItem.name.toLowerCase()
      );
      if (directIndex !== -1) {
        const updatedInv = inventoryItems.map((inv, idx) => {
          if (idx === directIndex) {
            const newStock = Math.max(0, Math.round((Number(inv.currentStock) - qty) * 100) / 100);
            return {
              ...inv,
              currentStock: newStock,
              lastUpdated: new Date().toISOString().split('T')[0]
            };
          }
          return inv;
        });
        updateInventory(updatedInv);
      }
    }

    showToast(`Logged sale: ${qty}x ${newSale.itemName} (₹${newSale.totalRevenue})`);
    return true;
  };

  // ⚡ High-Speed Batch Sales Handler (For multi-item Swiggy/Zomato orders & rush hour punching)
  const handleAddBatchSales = (salesList) => {
    if (!salesList || salesList.length === 0) return true;

    // Check stock for all items
    for (const newSale of salesList) {
      const targetMenuItem = menuItems.find(m => m.id === newSale.itemId || m.name === newSale.itemName);
      if (targetMenuItem) {
        const stockStatus = checkItemStock(targetMenuItem, inventoryItems);
        if (stockStatus.isOutOfStock) {
          showToast(`🚫 Order Blocked: "${newSale.itemName}" OUT OF STOCK hai!`);
          return false;
        }
      }
    }

    let currentSales = [...salesLogs];
    let currentInv = [...inventoryItems];

    salesList.forEach(newSale => {
      currentSales = [newSale, ...currentSales];
      const targetMenuItem = menuItems.find(m => m.id === newSale.itemId || m.name === newSale.itemName);
      const qty = Number(newSale.quantitySold) || 1;

      if (targetMenuItem && Array.isArray(targetMenuItem.recipe) && targetMenuItem.recipe.length > 0) {
        currentInv = currentInv.map(invItem => {
          const recipeMatch = targetMenuItem.recipe.find(r => {
            const matched = findMatchingInventoryItem(r.ingredientId, [invItem]) ||
              findMatchingInventoryItem(r.name, [invItem]);
            return Boolean(matched);
          });

          if (recipeMatch) {
            const recipeNeeded = (Number(recipeMatch.quantity) || 0) * qty;
            const deductAmount = convertQuantity(recipeNeeded, recipeMatch.unit, invItem.unit);
            const newStock = Math.max(0, Math.round((Number(invItem.currentStock) - deductAmount) * 100) / 100);
            return {
              ...invItem,
              currentStock: newStock,
              lastUpdated: new Date().toISOString().split('T')[0]
            };
          }
          return invItem;
        });
      } else if (targetMenuItem) {
        const directIndex = currentInv.findIndex(
          i => i.materialName.toLowerCase() === targetMenuItem.name.toLowerCase()
        );
        if (directIndex !== -1) {
          currentInv = currentInv.map((inv, idx) => {
            if (idx === directIndex) {
              const newStock = Math.max(0, Math.round((Number(inv.currentStock) - qty) * 100) / 100);
              return {
                ...inv,
                currentStock: newStock,
                lastUpdated: new Date().toISOString().split('T')[0]
              };
            }
            return inv;
          });
        }
      }
    });

    updateSales(currentSales);
    updateInventory(currentInv);

    const totalRev = salesList.reduce((s, x) => s + (Number(x.totalRevenue) || 0), 0);
    const orderRef = salesList[0]?.platformOrderId || '';
    const platform = salesList[0]?.paymentMethod || 'Online';
    showToast(`⚡ ${platform} Order ${orderRef ? `${orderRef} ` : ''}Punched! (${salesList.length} items • ₹${totalRev})`);
    return true;
  };


  const handleUpdateSale = (updatedSale) => {
    const oldSale = salesLogs.find(s => s.id === updatedSale.id);
    const diff = oldSale ? (Number(oldSale.quantitySold) - Number(updatedSale.quantitySold)) : 0;

    const updatedSales = salesLogs.map(s => s.id === updatedSale.id ? updatedSale : s);
    updateSales(updatedSales);

    // If sale quantity changed (diff !== 0), adjust recipe ingredients in inventory
    if (diff !== 0) {
      const targetMenuItem = menuItems.find(m => m.id === updatedSale.itemId || m.name === updatedSale.itemName);
      if (targetMenuItem && Array.isArray(targetMenuItem.recipe) && targetMenuItem.recipe.length > 0) {
        const updatedInv = inventoryItems.map(invItem => {
          const recipeMatch = targetMenuItem.recipe.find(r => {
            const matched = findMatchingInventoryItem(r.ingredientId, [invItem]) ||
              findMatchingInventoryItem(r.name, [invItem]);
            return Boolean(matched);
          });
          if (recipeMatch) {
            // If diff > 0 (reduced qty): restore into stock; if diff < 0 (increased qty): deduct additional stock
            const recipeChange = (Number(recipeMatch.quantity) || 0) * diff;
            const changeAmount = convertQuantity(recipeChange, recipeMatch.unit, invItem.unit);
            const newStock = Math.max(0, Math.round((Number(invItem.currentStock) + changeAmount) * 100) / 100);
            return {
              ...invItem,
              currentStock: newStock,
              lastUpdated: new Date().toISOString().split('T')[0]
            };
          }
          return invItem;
        });
        updateInventory(updatedInv);
      }
    }

    showToast(`Updated sale log: ${updatedSale.itemName} (${updatedSale.quantitySold} pcs)`);
  };

  const handleDeleteSale = (id) => {
    const saleToDelete = salesLogs.find(s => s.id === id);
    const updatedSales = salesLogs.filter(s => s.id !== id);
    updateSales(updatedSales);
    if (isFirebaseConfigured()) deleteSingleSale(id);

    // Restore all recipe ingredients for the deleted sale
    if (saleToDelete) {
      const targetMenuItem = menuItems.find(m => m.id === saleToDelete.itemId || m.name === saleToDelete.itemName);
      if (targetMenuItem && Array.isArray(targetMenuItem.recipe) && targetMenuItem.recipe.length > 0) {
        const returnUnits = Number(saleToDelete.quantitySold) || 1;
        const updatedInv = inventoryItems.map(invItem => {
          const recipeMatch = targetMenuItem.recipe.find(r => {
            const matched = findMatchingInventoryItem(r.ingredientId, [invItem]) ||
              findMatchingInventoryItem(r.name, [invItem]);
            return Boolean(matched);
          });
          if (recipeMatch) {
            const returnInRecipe = (Number(recipeMatch.quantity) || 0) * returnUnits;
            const returnAmount = convertQuantity(returnInRecipe, recipeMatch.unit, invItem.unit);
            const newStock = Math.round((Number(invItem.currentStock) + returnAmount) * 100) / 100;
            return {
              ...invItem,
              currentStock: newStock,
              lastUpdated: new Date().toISOString().split('T')[0]
            };
          }
          return invItem;
        });
        updateInventory(updatedInv);
      }
      showToast(`Removed sale log for "${saleToDelete.itemName}" & restored raw material stock`);
    }
  };

  // 🛒 Procurement Handlers (Purchases automatically increase raw material stock with Unit Conversion & Smart Alias Matching)
  const handleAddProcurement = (newProc) => {
    const updated = [newProc, ...procurementLogs];
    updateProcurement(updated);

    const qty = Number(newProc.quantityReceived) || 0;
    // 1. Find matching existing inventory item using smart alias & fuzzy matcher
    const matchedItem = findMatchingInventoryItem(newProc.materialName, inventoryItems);

    let updatedInv;
    if (matchedItem) {
      // Convert purchased qty to the inventory item's unit!
      const convertedQty = convertQuantity(qty, newProc.unit, matchedItem.unit);
      const totalPurchasedCost = Number(newProc.totalCost) || (qty * (Number(newProc.ratePerUnit) || 0));
      // Unit rate must be calculated per INVENTORY UNIT (e.g. per gram or per ml, NOT per kg or per liter)
      const costPerInvUnit = convertedQty > 0 ? (totalPurchasedCost / convertedQty) : (Number(newProc.ratePerUnit) || matchedItem.unitCost);
      const roundedCostPerInvUnit = Math.round(costPerInvUnit * 10000) / 10000;

      updatedInv = inventoryItems.map(inv => {
        if (inv.id === matchedItem.id) {
          const newStock = Math.round((Number(inv.currentStock) + convertedQty) * 100) / 100;
          return {
            ...inv,
            currentStock: newStock,
            unitCost: roundedCostPerInvUnit > 0 ? roundedCostPerInvUnit : inv.unitCost,
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        }
        return inv;
      });

      const conversionNote = (newProc.unit !== matchedItem.unit)
        ? ` (${qty} ${newProc.unit} = ${convertedQty} ${matchedItem.unit})`
        : '';
      showToast(`Logged purchase: Added ${convertedQty} ${matchedItem.unit}${conversionNote} to "${matchedItem.materialName}" stock!`);
    } else {
      // Check if it matches any standard cafe ingredient from aliases
      let standardName = newProc.materialName.trim();
      let standardUnit = newProc.unit || 'Piece';
      let standardCategory = newProc.category || 'Groceries';

      for (const [canonical, aliases] of Object.entries(KNOWN_MATERIAL_ALIASES)) {
        if (aliases.some(a => standardName.toLowerCase() === a || standardName.toLowerCase().includes(a))) {
          const preset = INITIAL_INVENTORY_ITEMS.find(p => p.materialName.toLowerCase() === canonical);
          if (preset) {
            standardName = preset.materialName;
            standardCategory = preset.category;
            standardUnit = preset.unit;
          }
          break;
        }
      }

      const convertedQty = convertQuantity(qty, newProc.unit, standardUnit);
      const totalPurchasedCost = Number(newProc.totalCost) || (qty * (Number(newProc.ratePerUnit) || 0));
      const costPerInvUnit = convertedQty > 0 ? (totalPurchasedCost / convertedQty) : (Number(newProc.ratePerUnit) || 0);
      const roundedCostPerInvUnit = Math.round(costPerInvUnit * 10000) / 10000;

      const newItem = {
        id: `inv-${Date.now()}`,
        materialName: standardName,
        category: standardCategory,
        currentStock: convertedQty,
        unit: standardUnit,
        reorderLevel: 5,
        unitCost: roundedCostPerInvUnit,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      updatedInv = [newItem, ...inventoryItems];
      showToast(`Logged purchase: Added ${convertedQty} ${standardUnit} to "${standardName}" stock!`);
    }

    updateInventory(updatedInv);
  };

  const handleDeleteProcurement = (id) => {
    const toDelete = procurementLogs.find(p => p.id === id);
    if (toDelete) {
      const qty = Number(toDelete.quantityReceived) || 0;
      const matchedItem = findMatchingInventoryItem(toDelete.materialName, inventoryItems);
      if (matchedItem && qty > 0) {
        const convertedQty = convertQuantity(qty, toDelete.unit, matchedItem.unit);
        const updatedInv = inventoryItems.map(inv => {
          if (inv.id === matchedItem.id) {
            const newStock = Math.max(0, Math.round((Number(inv.currentStock) - convertedQty) * 100) / 100);
            return {
              ...inv,
              currentStock: newStock,
              lastUpdated: new Date().toISOString().split('T')[0]
            };
          }
          return inv;
        });
        updateInventory(updatedInv);
      }
    }
    const updated = procurementLogs.filter(p => p.id !== id);
    updateProcurement(updated);
    if (isFirebaseConfigured()) deleteSingleProcurement(id);
    showToast('Procurement log entry deleted & inventory stock adjusted');
  };

  // 📦 Inventory Management Handlers
  const handleSaveInventoryItem = (itemToSave) => {
    const exists = inventoryItems.some(i => i.id === itemToSave.id);
    let updated;
    if (exists) {
      updated = inventoryItems.map(i => i.id === itemToSave.id ? itemToSave : i);
      showToast(`Updated material "${itemToSave.materialName}"`);
    } else {
      updated = [itemToSave, ...inventoryItems];
      showToast(`Added raw material "${itemToSave.materialName}" to inventory`);
    }
    updateInventory(updated);
  };

  const handleDeleteInventoryItem = (id) => {
    const item = inventoryItems.find(i => i.id === id);
    const updated = inventoryItems.filter(i => i.id !== id);
    updateInventory(updated);
    if (isFirebaseConfigured()) deleteSingleInventory(id);
    showToast(`Deleted "${item ? item.materialName : 'Item'}" from inventory`);
  };

  const handleAdjustStock = (id, delta) => {
    const updated = inventoryItems.map(item => {
      if (item.id === id) {
        const newStock = Math.max(0, Math.round((Number(item.currentStock) + delta) * 100) / 100);
        return {
          ...item,
          currentStock: newStock,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return item;
    });
    updateInventory(updated);
    showToast(`Stock balance adjusted (${delta > 0 ? '+' : ''}${delta})`);
  };

  // ☕ Menu Handlers
  const handleSaveMenuItem = (itemToSave) => {
    let newMenu;
    if (editingItem) {
      newMenu = menuItems.map(i => i.id === editingItem.id ? { ...i, ...itemToSave } : i);
      updateMenu(newMenu);
      showToast(`Updated menu item "${itemToSave.name}" & recipe`);
    } else {
      const newItem = { ...itemToSave, id: `item-${Date.now()}` };
      newMenu = [newItem, ...menuItems];
      updateMenu(newMenu);
      showToast(`Added "${itemToSave.name}" with recipe to menu`);
    }

    // Auto-register any new recipe ingredients into inventory with 0 stock if not already present
    if (Array.isArray(itemToSave.recipe) && itemToSave.recipe.length > 0) {
      let invUpdated = false;
      let currentInv = [...inventoryItems];

      itemToSave.recipe.forEach(r => {
        const exists = currentInv.some(
          inv => inv.id === r.ingredientId || (inv.materialName && r.name && inv.materialName.toLowerCase() === r.name.toLowerCase())
        );
        if (!exists && r.name && r.name.trim()) {
          currentInv.push({
            id: r.ingredientId || `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            materialName: r.name.trim(),
            category: 'Groceries',
            currentStock: 0,
            unit: r.unit || 'Piece',
            reorderLevel: 5,
            unitCost: 0,
            lastUpdated: new Date().toISOString().split('T')[0]
          });
          invUpdated = true;
        }
      });

      if (invUpdated) {
        updateInventory(currentInv);
      }
    }

    setIsModalOpen(false);
  };

  const handleDeleteMenuItem = (id) => {
    const item = menuItems.find(i => i.id === id);
    const updated = menuItems.filter(i => i.id !== id);
    updateMenu(updated);
    if (isFirebaseConfigured()) deleteSingleMenuItem(id);
    showToast(`Deleted "${item ? item.name : 'Item'}" from menu`);
    setDeletingItem(null);
  };

  const handleToggleMenuItemStatus = (id) => {
    const updated = menuItems.map(i => {
      if (i.id === id) {
        const next = !i.isAvailable;
        showToast(`"${i.name}" marked as ${next ? 'Available' : 'Disabled'}`);
        return { ...i, isAvailable: next };
      }
      return i;
    });
    updateMenu(updated);
  };

  // 🛎️ Dine-In Order Handlers
  const handleCustomerPlaceOrder = async (newOrder) => {
    const updated = [newOrder, ...diningOrders];
    setDiningOrders(updated);
    saveStoredDiningOrders(updated);

    if (isFirebaseConfigured()) {
      syncSingleDiningOrder(newOrder);
    }

    // Silent instant Telegram Bot Notification to Cafe Owner
    sendTelegramNewOrderAlert(newOrder).catch(err => console.error('Telegram alert error:', err));

    // Play chime
    playOrderChime();
    showToast(`Order Placed for Table #${newOrder.tableNumber}!`);
  };

  const handleUpdateDiningOrderStatus = (orderId, newStatus) => {
    const updated = diningOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    setDiningOrders(updated);
    saveStoredDiningOrders(updated);

    const target = updated.find(o => o.id === orderId);
    if (target && isFirebaseConfigured()) {
      syncSingleDiningOrder(target);
    }

    showToast(`Table #${target ? target.tableNumber : ''} Order: ${newStatus.toUpperCase()}`);
  };

  const handleSettleDiningOrderToSales = (order, paymentMode = 'Cash') => {
    if (!order || !order.items || order.items.length === 0) return;

    // Atomically commit all items to daily sales via handleAddBatchSales to avoid state closure overwrite
    const salesBatch = order.items.map((item, idx) => ({
      id: `sale-dining-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      itemId: item.id,
      itemName: item.name,
      category: item.category || 'General',
      quantitySold: Number(item.quantity) || 1,
      sellingPrice: item.price,
      costPrice: item.costPrice || 0,
      totalRevenue: item.total || (item.price * (item.quantity || 1)),
      totalCost: (item.costPrice || 0) * (item.quantity || 1),
      paymentMethod: paymentMode,
      platformOrderId: `Table #${order.tableNumber}`,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    }));

    handleAddBatchSales(salesBatch);

    handleUpdateDiningOrderStatus(order.id, 'billed');
    showToast(`✅ Table #${order.tableNumber} Order Settled & Punched to Daily Sales!`);
  };

  const handleDeleteDiningOrder = (orderId) => {
    const updated = diningOrders.filter(o => o.id !== orderId);
    setDiningOrders(updated);
    saveStoredDiningOrders(updated);
    if (isFirebaseConfigured()) {
      deleteSingleDiningOrder(orderId);
    }
    showToast('Dining order removed');
  };

  // If customer scanned QR code (?table=X), show Customer Menu View directly!
  if (isCustomerMode) {
    return (
      <CustomerMenuOrderView
        tableNumber={customerTableNumber || '1'}
        menuItems={menuItems}
        inventoryItems={inventoryItems}
        onSubmitOrder={handleCustomerPlaceOrder}
        onSwitchToAdmin={() => {
          setIsCustomerMode(false);
          try {
            window.history.pushState({}, '', window.location.pathname);
          } catch (e) {}
        }}
        cafeName={currentCafe?.cafeName || 'S&S Cafe'}
      />
    );
  }

  // 🚀 If NOT logged in and NOT in demo mode (and not in customer QR mode):
  // Show the Grand SaaS Landing / Home Page!
  if (!currentUser && !isDemoMode) {
    return (
      <>
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-slate-800 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-semibold">{toast}</span>
          </div>
        )}

        <LandingPage
          onOpenLogin={() => {
            setAuthModalTab('login');
            setAuthModalPlan('');
            setIsAuthModalOpen(true);
          }}
          onOpenSignup={(planName = '') => {
            setAuthModalTab('signup');
            setAuthModalPlan(planName || 'Pro Growth');
            setIsAuthModalOpen(true);
          }}
          onLaunchDemo={() => {
            setIsDemoMode(true);
            const demoCafe = {
              cafeId: 'default',
              cafeName: 'CafePulse Demo Cafe',
              ownerName: 'Demo Manager',
              city: 'Indore',
              role: 'demo'
            };
            setCurrentCafe(demoCafe);
            loadCafeData('default');
            showToast('🎉 Interactive Live Demo Started! Explore orders, inventory & reports.');
          }}
        />

        {/* 🔐 Auth Modal can open on top of Landing Page */}
        <AuthModal
          isOpen={isAuthModalOpen}
          initialTab={authModalTab}
          selectedPlan={authModalPlan}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-slate-800 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toast}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onOpenAddModal={() => { setEditingItem(null); setIsModalOpen(true); }}
        totalItems={menuItems.length}
        isCloudConnected={isCloudConnected}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenAlertSettings={() => setIsAlertSettingsOpen(true)}
        currentCafe={currentCafe}
        currentUser={currentUser}
        isDemoMode={isDemoMode}
        onOpenAuthModal={(tab = 'signup') => {
          setAuthModalTab(tab);
          setIsAuthModalOpen(true);
        }}
        onOpenCafeProfileModal={() => setIsCafeProfileModalOpen(true)}
        onExitDemo={() => setIsDemoMode(false)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 sm:pb-8">

        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8 bg-white p-1.5 sm:p-2 rounded-2xl border border-slate-200 shadow-xs overflow-hidden">

          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto w-full no-scrollbar py-0.5 px-0.5">

            {/* Sales Tracker Tab */}
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${activeTab === 'sales'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>⚡ Daily Sales</span>
            </button>

            {/* 🛎️ Dine-In & QR Orders Tab */}
            <button
              onClick={() => setActiveTab('dining')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 relative ${activeTab === 'dining'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>🛎️ Dine-In & QR</span>
              {diningOrders.filter(o => o.status === 'pending').length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              )}
            </button>

            {/* 📦 Raw Material Stock Tab */}
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${activeTab === 'inventory'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <Boxes className="w-4 h-4" />
              <span>📦 Stock</span>
            </button>

            {/* Dashboard Tab */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <PieChart className="w-4 h-4" />
              <span>📊 P&L</span>
            </button>

            {/* Procurement Log Tab */}
            <button
              onClick={() => setActiveTab('procurement')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${activeTab === 'procurement'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <PackageCheck className="w-4 h-4" />
              <span>Purchases</span>
            </button>

            {/* Expenses & Bills Tab */}
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${activeTab === 'expenses'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <Receipt className="w-4 h-4" />
              <span>💸 Bills & Expenses</span>
            </button>

            {/* Menu Catalog Tab */}
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${activeTab === 'menu'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <Coffee className="w-4 h-4" />
              <span>Menu & Recipes</span>
            </button>

          </div>

          {activeTab === 'menu' && (
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsAIScannerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all"
                title="Scan Menu Card Photo or Paste Rate Card"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI Menu Scanner</span>
              </button>
              <button
                onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-xl border border-slate-700 shadow-xs cursor-pointer transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Add Item</span>
              </button>
            </div>
          )}

        </div>

        {/* Tab Views */}
        {activeTab === 'sales' && (
          <SalesTracker
            menuItems={menuItems}
            salesLogs={salesLogs}
            inventoryItems={inventoryItems}
            settlements={settlements}
            currentCafe={currentCafe}
            onAddSale={handleAddSale}
            onAddBatchSales={handleAddBatchSales}
            onUpdateSale={handleUpdateSale}
            onDeleteSale={handleDeleteSale}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onAddSettlement={handleAddSettlement}
            onDeleteSettlement={handleDeleteSettlement}
            onClearAllSettlements={handleClearAllSettlements}
            onAddExpense={handleAddExpense}
            onOpenAlertSettings={() => setIsAlertSettingsOpen(true)}
            showToast={showToast}
          />
        )}

        {/* 🛎️ Dine-In & Table QR Manager Tab View */}
        {activeTab === 'dining' && (
          <DiningManager
            diningOrders={diningOrders}
            currentCafe={currentCafe}
            onUpdateOrderStatus={handleUpdateDiningOrderStatus}
            onSettleOrderToSales={handleSettleDiningOrderToSales}
            onDeleteOrder={handleDeleteDiningOrder}
            onPreviewCustomerView={(tableNum) => {
              setCustomerTableNumber(tableNum);
              setIsCustomerMode(true);
            }}
            onOpenAlertSettings={() => setIsAlertSettingsOpen(true)}
            showToast={showToast}
          />
        )}

        {/* 📦 Raw Material Inventory Tab View */}
        {activeTab === 'inventory' && (
          <InventoryTracker
            inventoryItems={inventoryItems}
            onSaveItem={handleSaveInventoryItem}
            onDeleteItem={handleDeleteInventoryItem}
            onAdjustStock={handleAdjustStock}
          />
        )}

        {activeTab === 'dashboard' && (
          <FinancialDashboard
            salesLogs={salesLogs}
            procurementLogs={procurementLogs}
            menuItems={menuItems}
            inventoryItems={inventoryItems}
            expenses={expenses}
            wastageLogs={wastageLogs}
            settlements={settlements}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onOpenSettlementsModal={() => setIsAggregatorModalOpen(true)}
          />
        )}

        {activeTab === 'procurement' && (
          <ProcurementLog
            procurementLogs={procurementLogs}
            inventoryItems={inventoryItems}
            menuItems={menuItems}
            onAddProcurement={handleAddProcurement}
            onDeleteProcurement={handleDeleteProcurement}
          />
        )}

        {/* 💸 Bills & Wastage Tab View */}
        {activeTab === 'expenses' && (
          <ExpenseTracker
            expenses={expenses}
            wastageLogs={wastageLogs}
            inventoryItems={inventoryItems}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            onAddWastage={handleAddWastage}
            onDeleteWastage={handleDeleteWastage}
          />
        )}

        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
              <div>
                <h3 className="text-base font-bold text-stone-900">{currentCafe?.cafeName || 'S&S Cafe'} Menu & Recipes</h3>
                <p className="text-xs text-stone-500">Manage cafe products, selling prices, categories and raw material recipes.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAIScannerOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all transform hover:-translate-y-0.5"
                  title="Scan Menu Card Photo or Paste WhatsApp Rate Card"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>📸 AI Menu Scanner</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                  className="flex sm:hidden items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Add Item</span>
                </button>
                <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-1 rounded-lg font-bold ${viewMode === 'cards' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
                  >
                    Category Cards
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1 rounded-lg font-bold ${viewMode === 'table' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
                  >
                    Table
                  </button>
                </div>
              </div>
            </div>

            {viewMode === 'cards' ? (
              <ItemCards
                items={menuItems}
                inventoryItems={inventoryItems}
                onEdit={(item) => { setEditingItem(item); setIsModalOpen(true); }}
                onDelete={(item) => setDeletingItem(item)}
                onToggleStatus={handleToggleMenuItemStatus}
                onSaveItem={handleSaveMenuItem}
                onOpenAIScanner={() => setIsAIScannerOpen(true)}
                onOpenAddItem={() => { setEditingItem(null); setIsModalOpen(true); }}
              />
            ) : (
              <ItemTable
                items={menuItems}
                inventoryItems={inventoryItems}
                onEdit={(item) => { setEditingItem(item); setIsModalOpen(true); }}
                onDelete={(item) => setDeletingItem(item)}
                onToggleStatus={handleToggleMenuItemStatus}
                onSaveItem={handleSaveMenuItem}
              />
            )}
          </div>
        )}

      </main>

      {/* Item Form Modal with Recipe Builder */}
      <ItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMenuItem}
        editingItem={editingItem}
        existingCategories={Array.from(new Set(menuItems.map(i => i.category)))}
        inventoryItems={inventoryItems}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteMenuItem}
        item={deletingItem}
      />

      {/* Cloud Configuration Modal */}
      <CloudConfigModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        currentMenu={menuItems}
        currentInventory={inventoryItems}
        currentSales={salesLogs}
        currentProcurement={procurementLogs}
        currentExpenses={expenses}
        currentWastage={wastageLogs}
        onConnected={() => {
          const connected = isFirebaseConfigured();
          setIsCloudConnected(connected);
          showToast(connected ? '🟢 Firebase Cloud Database Connected!' : 'Local Storage Mode');
        }}
        onRestoreData={(restored) => {
          if (restored.menu && Array.isArray(restored.menu)) updateMenu(restored.menu);
          if (restored.inventory && Array.isArray(restored.inventory)) updateInventory(restored.inventory);
          if (restored.sales && Array.isArray(restored.sales)) updateSales(restored.sales);
          if (restored.procurement && Array.isArray(restored.procurement)) updateProcurement(restored.procurement);
          if (restored.expenses && Array.isArray(restored.expenses)) updateExpenses(restored.expenses);
          if (restored.wastage && Array.isArray(restored.wastage)) updateWastage(restored.wastage);
          showToast('✅ Complete Cafe Data Restored from Backup File!');
        }}
      />

      {/* Excel Export Modal (Weekly / Monthly / Custom Data) */}
      <ExcelExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        salesLogs={salesLogs}
        procurementLogs={procurementLogs}
        expenses={expenses}
        wastageLogs={wastageLogs}
        inventoryItems={inventoryItems}
        menuItems={menuItems}
        settlements={settlements}
        onExportSuccess={(msg) => showToast(msg)}
      />

      {/* Swiggy & Zomato Weekly Payout Settlement Modal */}
      <AggregatorSettlementModal
        isOpen={isAggregatorModalOpen}
        onClose={() => setIsAggregatorModalOpen(false)}
        salesLogs={salesLogs}
        settlements={settlements}
        initialPlatform="Swiggy"
        onAddSettlement={handleAddSettlement}
        onDeleteSettlement={handleDeleteSettlement}
        onClearAllSettlements={handleClearAllSettlements}
        onDeleteSale={handleDeleteSale}
        onUpdateSale={handleUpdateSale}
        onAddExpense={handleAddExpense}
      />

      {/* 🔐 Multi-Tenant Cafe Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialTab={authModalTab}
        selectedPlan={authModalPlan}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* 🏬 Multi-Cafe Outlets & Profile Management Modal */}
      <CafeProfileModal
        isOpen={isCafeProfileModalOpen}
        onClose={() => setIsCafeProfileModalOpen(false)}
        currentCafe={currentCafe}
        currentUser={currentUser}
        allCafes={userCafes}
        onSwitchCafe={handleSwitchCafe}
        onLogout={handleLogout}
        onUpdateCafe={(updated) => {
          setCurrentCafe(updated);
          showToast(`Cafe details updated: ${updated.cafeName}`);
        }}
      />

      {/* 📸 AI Menu Scanner Modal (OCR Photo / Bulk Text / Starter Packs) */}
      <AIMenuScannerModal
        isOpen={isAIScannerOpen}
        onClose={() => setIsAIScannerOpen(false)}
        onImportItems={handleImportScannedMenuItems}
        currentMenuCount={menuItems.length}
      />

      {/* 📱 Communications & WhatsApp Silent Gateway Modal */}
      <StockAlertSettingsModal
        isOpen={isAlertSettingsOpen}
        onClose={() => setIsAlertSettingsOpen(false)}
        showToast={showToast}
      />


      {/* Sticky Mobile Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-950/95 backdrop-blur-md border-t border-stone-800/80 py-1.5 px-3 flex items-center justify-around shadow-2xl safe-area-pb">
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'sales' ? 'text-amber-400 font-extrabold scale-105' : 'text-stone-400 hover:text-stone-200'
            }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="text-[10px]">Sales</span>
        </button>

        <button
          onClick={() => setActiveTab('dining')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer relative ${activeTab === 'dining' ? 'text-amber-400 font-extrabold scale-105' : 'text-stone-400 hover:text-stone-200'
            }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span className="text-[9px]">Dine-In</span>
          {diningOrders.filter(o => o.status === 'pending').length > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'inventory' ? 'text-amber-400 font-extrabold scale-105' : 'text-stone-400 hover:text-stone-200'
            }`}
        >
          <Boxes className="w-4 h-4" />
          <span className="text-[10px]">Stock</span>
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'dashboard' ? 'text-amber-400 font-extrabold scale-105' : 'text-stone-400 hover:text-stone-200'
            }`}
        >
          <PieChart className="w-4 h-4" />
          <span className="text-[10px]">P&L</span>
        </button>

        <button
          onClick={() => setActiveTab('procurement')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-xl transition-all cursor-pointer ${activeTab === 'procurement' ? 'text-amber-400 font-extrabold scale-105' : 'text-stone-400 hover:text-stone-200'
            }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span className="text-[9px]">Purchases</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-xl transition-all cursor-pointer ${activeTab === 'expenses' ? 'text-amber-400 font-extrabold scale-105' : 'text-stone-400 hover:text-stone-200'
            }`}
        >
          <Receipt className="w-4 h-4" />
          <span className="text-[9px]">Bills/Exp</span>
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-xl transition-all cursor-pointer ${activeTab === 'menu' ? 'text-amber-400 font-extrabold scale-105' : 'text-stone-400 hover:text-stone-200'
            }`}
        >
          <Coffee className="w-4 h-4" />
          <span className="text-[9px]">Menu</span>
        </button>
      </nav>

      {/* Footer */}
      <footer className="bg-stone-950 text-stone-400 py-6 border-t border-stone-800 text-xs text-center mt-12 mb-14 sm:mb-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-stone-300 font-semibold">
            <img src="/logo.jpg" alt="Logo" className="w-5 h-5 rounded-full" onError={(e) => e.target.style.display = 'none'} />
            <span>S&S Cafe — Daily Sales, Category Menu & P&L Control System</span>
          </div>
          <p className="text-stone-500">© {new Date().getFullYear()} S&S Cafe.</p>
        </div>
      </footer>

    </div>
  );
}

