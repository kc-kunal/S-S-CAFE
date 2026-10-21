import React, { useState, useEffect, useMemo } from 'react';
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
import CafeProfilePage from './components/CafeProfilePage';
import LandingPage from './components/LandingPage';
import AIMenuScannerModal from './components/AIMenuScannerModal';
import StockAlertSettingsModal from './components/StockAlertSettingsModal';
import ThermalBillModal from './components/ThermalBillModal';
import AdminPortal from './components/AdminPortal';
import StaffPinModal from './components/StaffPinModal';
import DayClosingModal from './components/DayClosingModal';
import CustomerKhataModal from './components/CustomerKhataModal';
import {
  subscribeToAuthChanges,
  getLocalActiveCafe,
  setLocalActiveCafe,
  logoutCafeOwner
} from './utils/auth';
import { triggerAutomaticStockAlerts, sendTelegramNewOrderAlert } from './utils/telegramAlert';
import { playOrderChime } from './utils/audioAlert';
import {
  setCurrentCafeId,
  getCurrentCafeId,
  isCleanSlateActive,
  setCleanSlateMarker,
  getStoredMenu, saveStoredMenu,
  getStoredSales, saveStoredSales,
  getStoredProcurement, saveStoredProcurement,
  getStoredInventory, saveStoredInventory,
  getStoredExpenses, saveStoredExpenses,
  getStoredWastage, saveStoredWastage,
  getStoredDiningOrders, saveStoredDiningOrders,
  getStoredSettlements, saveStoredSettlements,
  getStoredKhata, saveStoredKhata,
  getStoredDayClosings, saveStoredDayClosings,
  getStoredOwnerPin, saveStoredOwnerPin,
  calculateAggregatorLedger,
  checkItemStock,
  convertQuantity,
  findMatchingInventoryItem,
  INITIAL_INVENTORY_ITEMS,
  RESTAURANT_HOTEL_INVENTORY_ITEMS,
  RESTAURANT_HOTEL_MENU_ITEMS,
  seedHotelRestaurantData,
  seedCafeData
} from './utils/storage';
import { isFirebaseConfigured } from './utils/firebase';
import {
  syncCloudMenu,
  syncCloudInventory,
  syncCloudSales,
  syncCloudProcurement,
  syncCloudExpenses,
  syncCloudWastage,
  syncSingleMenuItem,
  syncSingleInventory,
  syncSingleDiningOrder,
  deleteSingleDiningOrder,
  deleteSingleSale,
  deleteSingleProcurement,
  deleteSingleExpense,
  deleteSingleWastage,
  deleteSingleInventory,
  deleteSingleMenuItem,
  fetchAllCloudData,
  subscribeToCloudData,
  wipeCloudTenantCollections,
  restoreFriendRealData
} from './utils/cloudSync';
import AggregatorSettlementModal from './components/AggregatorSettlementModal';
import { PieChart, ShoppingBag, PackageCheck, Coffee, CheckCircle2, Plus, Boxes, Receipt, UtensilsCrossed, Bike, Sparkles, Trash2, User } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('sales'); // 'sales', 'inventory', 'dashboard', 'procurement', 'menu'

  // Multi-Tenant Cafe & User Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentCafe, setCurrentCafe] = useState(() => {
    const local = getLocalActiveCafe();
    if (local) {
      const isKc = (local.ownerEmail || '').toLowerCase() === 'kc@gmail.com' || local.cafeId === 'cafe_kc_hotel';
      if (isKc) {
        return {
          ...local,
          cafeName: local.cafeName && !local.cafeName.includes('My Cafe') ? local.cafeName : 'KC Grand Hotel & Family Restaurant',
          ownerName: local.ownerName && !local.ownerName.includes('Cafe Owner') ? local.ownerName : 'Kunal Chaudhary (KC)',
          businessType: 'restaurant'
        };
      }
      return local;
    }
    return {
      cafeId: 'default',
      cafeName: 'S&S Cafe',
      ownerName: 'Admin',
      city: 'Indore',
      role: 'owner',
      businessType: 'cafe'
    };
  });

  const activeIdOnBoot = currentCafe?.cafeId || 'default';

  // Synchronously load stored states on boot to ensure zero data loss on page refresh
  const [menuItems, setMenuItems] = useState(() => getStoredMenu(activeIdOnBoot));
  const [salesLogs, setSalesLogs] = useState(() => getStoredSales(activeIdOnBoot));
  const [procurementLogs, setProcurementLogs] = useState(() => getStoredProcurement(activeIdOnBoot));
  const [inventoryItems, setInventoryItems] = useState(() => getStoredInventory(activeIdOnBoot));
  const [expenses, setExpenses] = useState(() => getStoredExpenses(activeIdOnBoot));
  const [wastageLogs, setWastageLogs] = useState(() => getStoredWastage(activeIdOnBoot));
  const [settlements, setSettlements] = useState([]);
  const [isAggregatorModalOpen, setIsAggregatorModalOpen] = useState(false);

  // Clean slate reactive state & direct clear demo confirmation modal state
  const [isCleanSlate, setIsCleanSlate] = useState(() => Boolean(currentCafe?.isCleanSlate || isCleanSlateActive(activeIdOnBoot)));
  const [isClearDemoModalOpen, setIsClearDemoModalOpen] = useState(false);
  const [clearDemoLoading, setClearDemoLoading] = useState(false);

  // 🔒 Priority 1: Staff PIN Lock State
  const [isStaffMode, setIsStaffMode] = useState(false);
  const [ownerPin, setOwnerPin] = useState(() => getStoredOwnerPin(activeIdOnBoot));
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinModalTargetTab, setPinModalTargetTab] = useState(null);

  // 🌙 Priority 2: Day-End Cash Closing State
  const [dayClosings, setDayClosings] = useState(() => getStoredDayClosings(activeIdOnBoot));
  const [isDayClosingModalOpen, setIsDayClosingModalOpen] = useState(false);

  // 📒 Priority 3: Customer Khata / Udhar Ledger State
  const [khataLedger, setKhataLedger] = useState(() => getStoredKhata(activeIdOnBoot));
  const [isKhataModalOpen, setIsKhataModalOpen] = useState(false);

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

  // Telegram Automated Stock & Order Alerts Modal State
  const [isAlertSettingsOpen, setIsAlertSettingsOpen] = useState(false);

  // 🖨️ Thermal Receipt / Bill & KOT Printer Modal State
  const [isReceiptPrinterOpen, setIsReceiptPrinterOpen] = useState(false);
  const [receiptPrinterOrder, setReceiptPrinterOrder] = useState(null);
  const [receiptPrinterMode, setReceiptPrinterMode] = useState('bill'); // 'bill' | 'kot'

  const handleOpenReceiptPrinter = (orderData, mode = 'bill') => {
    setReceiptPrinterOrder(orderData);
    setReceiptPrinterMode(mode);
    setIsReceiptPrinterOpen(true);
  };

  // 🛡️ Super Admin Hidden Route Detection (/admin, #/admin, ?admin=true)
  const checkIsAdminPath = () => {
    try {
      if (typeof window === 'undefined') return false;
      const path = (window.location.pathname || '').toLowerCase().replace(/\/+$/, '');
      const hash = (window.location.hash || '').toLowerCase().replace(/^#\/?/, '');
      const params = new URLSearchParams(window.location.search);
      return (
        path.endsWith('/admin') ||
        path === '/admin' ||
        hash === 'admin' ||
        hash.startsWith('admin') ||
        params.get('admin') === 'true' ||
        params.has('admin')
      );
    } catch (e) {
      return false;
    }
  };

  const [isAdminMode, setIsAdminMode] = useState(checkIsAdminPath);

  useEffect(() => {
    const handleUrlChange = () => {
      setIsAdminMode(checkIsAdminPath());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

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
    setIsCleanSlate(isCleanSlateActive(activeId));

    const isKcOrRestaurant = 
      activeId.includes('kc') || 
      activeId.includes('hotel') ||
      activeId.includes('restaurant') ||
      (currentCafe?.ownerEmail || '').toLowerCase() === 'kc@gmail.com' || 
      currentCafe?.businessType === 'restaurant';

    const cleanSlate = isCleanSlateActive(activeId);

    let rawMenu = getStoredMenu(activeId);
    let rawSales = getStoredSales(activeId);
    let rawProc = getStoredProcurement(activeId);
    let rawInv = getStoredInventory(activeId);

    // If it's KC Grand Hotel or a restaurant, and the catalog is empty AND clean slate is NOT active, auto-seed the Hotel Catalog!
    if (!cleanSlate && isKcOrRestaurant && (!rawMenu || rawMenu.length === 0)) {
      seedHotelRestaurantData(activeId);
      rawMenu = getStoredMenu(activeId);
      rawSales = getStoredSales(activeId);
      rawProc = getStoredProcurement(activeId);
      rawInv = getStoredInventory(activeId);
    }

    setMenuItems(rawMenu);
    setSalesLogs(rawSales);
    setProcurementLogs(rawProc);
    setInventoryItems(rawInv);
    setExpenses(getStoredExpenses(activeId));
    setWastageLogs(getStoredWastage(activeId));
    setDiningOrders(getStoredDiningOrders(activeId));
    setSettlements(getStoredSettlements(activeId));
    setKhataLedger(getStoredKhata(activeId));
    setDayClosings(getStoredDayClosings(activeId));
    setOwnerPin(getStoredOwnerPin(activeId));
  };

  // 0. Auto-load stored data on boot for active cafe
  useEffect(() => {
    const activeId = currentCafe?.cafeId || 'default';
    loadCafeData(activeId);
  }, []);

  // 1. Subscribe to Firebase Auth State Changes & Multi-Tenant Profile
  useEffect(() => {
    const unsubAuth = subscribeToAuthChanges(({ user, cafe, cafes }) => {
      setCurrentUser(user);
      if (user && cafe) {
        setIsDemoMode(false);
        setCurrentCafe(cafe);
        setUserCafes(cafes);
        loadCafeData(cafe.cafeId);
      } else if (cafe) {
        setCurrentCafe(cafe);
        setUserCafes(cafes || [cafe]);
        loadCafeData(cafe.cafeId);
      } else if (!user) {
        const urlCafe = getInitialCafeParam();
        if (urlCafe) {
          loadCafeData(urlCafe);
        } else {
          loadCafeData(currentCafe?.cafeId || 'default');
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
        const cleanSlate = isCleanSlateActive(activeId);
        const localMenu = getStoredMenu(activeId) || [];
        const localInv = getStoredInventory(activeId) || [];

        // 1. Menu: Safely merge cloud with local so custom items are permanently retained
        let resolvedMenu = [];
        if (cloudData.menu && Array.isArray(cloudData.menu) && cloudData.menu.length > 0) {
          const cloudMap = new Map(cloudData.menu.map(m => [m.id, m]));
          localMenu.forEach(lm => {
            if (!cloudMap.has(lm.id)) {
              cloudMap.set(lm.id, lm);
            }
          });
          resolvedMenu = Array.from(cloudMap.values());
        } else if (localMenu && localMenu.length > 0) {
          resolvedMenu = localMenu;
          syncCloudMenu(localMenu, activeId);
        } else if (!cleanSlate) {
          resolvedMenu = getStoredMenu(activeId) || [];
        } else {
          resolvedMenu = [];
        }
        setMenuItems(resolvedMenu);
        saveStoredMenu(resolvedMenu, activeId);

        // 2. Inventory: Safely merge cloud with local
        let resolvedInv = [];
        if (cloudData.inventory && Array.isArray(cloudData.inventory) && cloudData.inventory.length > 0) {
          const cloudMap = new Map(cloudData.inventory.map(i => [i.id, i]));
          localInv.forEach(li => {
            if (!cloudMap.has(li.id)) {
              cloudMap.set(li.id, li);
            }
          });
          resolvedInv = Array.from(cloudMap.values());
        } else if (localInv && localInv.length > 0) {
          resolvedInv = localInv;
          syncCloudInventory(localInv, activeId);
        } else if (!cleanSlate) {
          resolvedInv = getStoredInventory(activeId) || [];
        } else {
          resolvedInv = [];
        }
        setInventoryItems(resolvedInv);
        saveStoredInventory(resolvedInv, activeId);

        if (cloudData.sales && Array.isArray(cloudData.sales) && cloudData.sales.length > 0) {
          const localSales = getStoredSales(activeId) || [];
          const localMap = new Map(localSales.map(s => [s.id, s]));
          cloudData.sales.forEach(cs => {
            if (!localMap.has(cs.id)) {
              localMap.set(cs.id, cs);
            }
          });
          const mergedSales = Array.from(localMap.values()).sort((a, b) => {
            const timeA = new Date(a.createdAt || `${a.date}T00:00:00`).getTime();
            const timeB = new Date(b.createdAt || `${b.date}T00:00:00`).getTime();
            return timeB - timeA;
          });
          setSalesLogs(mergedSales);
          saveStoredSales(mergedSales, activeId);
        } else {
          const localSales = getStoredSales(activeId);
          if (localSales && localSales.length > 0) {
            syncCloudSales(localSales, activeId);
          }
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
        const cleanSlate = isCleanSlateActive(activeId);
        const localMenu = getStoredMenu(activeId) || [];
        if (cleanSlate && localMenu.length > 0 && (!newMenu || newMenu.length === 0)) {
          return;
        }
        if (newMenu && newMenu.length > 0) {
          const cloudMap = new Map(newMenu.map(m => [m.id, m]));
          localMenu.forEach(lm => {
            if (!cloudMap.has(lm.id)) {
              cloudMap.set(lm.id, lm);
            }
          });
          const merged = Array.from(cloudMap.values());
          setMenuItems(merged);
          saveStoredMenu(merged, activeId);
        } else {
          setMenuItems(newMenu || []);
          saveStoredMenu(newMenu || [], activeId);
        }
      },
      onInventoryUpdate: (newInv) => {
        const cleanSlate = isCleanSlateActive(activeId);
        const localInv = getStoredInventory(activeId) || [];
        if (cleanSlate && localInv.length > 0 && (!newInv || newInv.length === 0)) {
          return;
        }
        if (newInv && newInv.length > 0) {
          const cloudMap = new Map(newInv.map(i => [i.id, i]));
          localInv.forEach(li => {
            if (!cloudMap.has(li.id)) {
              cloudMap.set(li.id, li);
            }
          });
          const merged = Array.from(cloudMap.values());
          setInventoryItems(merged);
          saveStoredInventory(merged, activeId);
        } else {
          setInventoryItems(newInv || []);
          saveStoredInventory(newInv || [], activeId);
        }
      },
      onSalesUpdate: (newSales) => {
        setSalesLogs(prev => {
          const prevMap = new Map((prev || []).map(s => [s.id, s]));
          newSales.forEach(s => prevMap.set(s.id, s));
          const merged = Array.from(prevMap.values()).sort((a, b) => {
            const timeA = new Date(a.createdAt || `${a.date}T00:00:00`).getTime();
            const timeB = new Date(b.createdAt || `${b.date}T00:00:00`).getTime();
            return timeB - timeA;
          });
          saveStoredSales(merged, activeId);
          return merged;
        });
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
            const newest = newOrders.find(o => !prevIds.has(o.id) && o.status === 'pending') || newOrders.find(o => !prevIds.has(o.id));
            playOrderChime({
              tableNumber: newest?.tableNumber || '',
              totalAmount: newest?.totalAmount || ''
            });
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
      setIsCleanSlate(Boolean(cafe.isCleanSlate || isCleanSlateActive(cafe.cafeId)));
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

  // 🧹 1-Click Clean Slate / Reset All Demo Data (for Production Cafe Testing)
  const handleResetToCleanSlate = async (options = {}) => {
    const {
      clearMenu = true,
      clearInventory = true,
      clearPurchases = true,
      clearWastage = true,
      clearSales = false,
      clearExpenses = false
    } = options;

    const activeId = currentCafe?.cafeId || 'default';

    // 1. Mark clean slate active so auto-seeding and demo fallbacks are blocked
    setCleanSlateMarker(activeId, true);
    setIsCleanSlate(true);

    if (clearMenu) {
      saveStoredMenu([], activeId);
      setMenuItems([]);
    }
    if (clearInventory) {
      saveStoredInventory([], activeId);
      setInventoryItems([]);
    }
    if (clearPurchases) {
      saveStoredProcurement([], activeId);
      setProcurementLogs([]);
    }
    if (clearWastage) {
      saveStoredWastage([], activeId);
      setWastageLogs([]);
    }
    if (clearSales) {
      saveStoredSales([], activeId);
      setSalesLogs([]);
    }
    if (clearExpenses) {
      saveStoredExpenses([], activeId);
      setExpenses([]);
    }

    if (currentCafe) {
      const updatedCafe = { ...currentCafe, isCleanSlate: true };
      setCurrentCafe(updatedCafe);
      setLocalActiveCafe(updatedCafe);
    }

    try {
      await wipeCloudTenantCollections(activeId, {
        clearMenu,
        clearInventory,
        clearProcurement: clearPurchases,
        clearPurchases,
        clearWastage,
        clearSales,
        clearExpenses
      });
    } catch (e) {
      console.warn('Could not wipe cloud tenant data:', e);
    }

    showToast('✨ Clean Slate Activated! Saara demo stock aur recipes hat gaye. Ab aap apna original menu aur stock daal sakte hain.');
  };

  // 🍽️ Load Business Catalog Preset (Hotel & Family Restaurant vs Fast Food Cafe)
  const handleLoadCatalogPreset = async (presetType = 'hotel') => {
    const activeId = currentCafe?.cafeId || 'default';
    setCleanSlateMarker(activeId, false);
    setIsCleanSlate(false);
    if (presetType === 'hotel') {
      seedHotelRestaurantData(activeId);
      const menu = getStoredMenu(activeId);
      const inv = getStoredInventory(activeId);
      const proc = getStoredProcurement(activeId);
      const exp = getStoredExpenses(activeId);
      const sales = getStoredSales(activeId);
      const waste = getStoredWastage(activeId);

      setMenuItems(menu);
      setInventoryItems(inv);
      setProcurementLogs(proc);
      setExpenses(exp);
      setSalesLogs(sales);
      setWastageLogs(waste);

      const updatedCafe = {
        ...currentCafe,
        businessType: 'restaurant',
        cafeName: currentCafe?.cafeName?.includes('Cafe')
          ? currentCafe.cafeName.replace(/Cafe/i, 'Hotel & Restaurant')
          : (currentCafe?.cafeName || 'KC Grand Hotel & Family Restaurant')
      };
      setCurrentCafe(updatedCafe);
      setLocalActiveCafe(updatedCafe);

      if (isFirebaseConfigured()) {
        try {
          syncCloudMenu(menu, activeId);
          syncCloudInventory(inv, activeId);
          syncCloudProcurement(proc, activeId);
          syncCloudExpenses(exp, activeId);
        } catch (e) {}
      }

      showToast('🍽️ Hotel & Family Restaurant Catalog Loaded (25+ Dishes, Recipes & Stock)!');
    } else {
      seedCafeData(activeId);
      const menu = getStoredMenu(activeId);
      const inv = getStoredInventory(activeId);
      const proc = getStoredProcurement(activeId);
      const exp = getStoredExpenses(activeId);
      const sales = getStoredSales(activeId);
      const waste = getStoredWastage(activeId);

      setMenuItems(menu);
      setInventoryItems(inv);
      setProcurementLogs(proc);
      setExpenses(exp);
      setSalesLogs(sales);
      setWastageLogs(waste);

      const updatedCafe = {
        ...currentCafe,
        businessType: 'cafe'
      };
      setCurrentCafe(updatedCafe);
      setLocalActiveCafe(updatedCafe);

      if (isFirebaseConfigured()) {
        try {
          syncCloudMenu(menu, activeId);
          syncCloudInventory(inv, activeId);
          syncCloudProcurement(proc, activeId);
          syncCloudExpenses(exp, activeId);
        } catch (e) {}
      }

      showToast('☕ Fast Food Cafe Catalog Loaded (Pizzas, Burgers & Cold Coffee)!');
    }
  };

  // 🗑️ Raw Material Spoilage / Wastage Handlers (Auto Stock Deduction with Unit Conversion)
  const handleAddWastage = (entry) => {
    // 1. Deduct raw material quantity from current stock in inventory with smart unit conversion
    let matchedItemName = entry.ingredientName || '';
    let deductedQty = 0;
    let invUnit = entry.unit || '';

    const updatedInv = inventoryItems.map(item => {
      const isMatch = item.id === entry.ingredientId ||
        (entry.ingredientName && item.materialName.toLowerCase() === entry.ingredientName.toLowerCase());

      if (isMatch) {
        matchedItemName = item.materialName;
        invUnit = item.unit;
        // Convert wastage entry unit to the inventory base unit (e.g. Kg <-> gm, L <-> ml)
        const convertedDeduct = convertQuantity(Number(entry.quantity) || 0, entry.unit, item.unit);
        deductedQty = convertedDeduct;
        const newStock = Math.max(0, Math.round((Number(item.currentStock) - convertedDeduct) * 100) / 100);
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

    const conversionNote = (entry.unit && invUnit && entry.unit.toLowerCase() !== invUnit.toLowerCase())
      ? ` (${deductedQty} ${invUnit} inventory stock)`
      : '';
    showToast(`⚠️ Kharab Maal Logged: Deducted ${entry.quantity} ${entry.unit}${conversionNote} from "${matchedItemName || entry.ingredientName}". Loss: ₹${entry.costValue}`);
  };

  const handleDeleteWastage = (id) => {
    const toDelete = wastageLogs.find(w => w.id === id);
    if (toDelete) {
      // Revert raw material stock with smart unit conversion
      const updatedInv = inventoryItems.map(item => {
        const isMatch = item.id === toDelete.ingredientId ||
          (toDelete.ingredientName && item.materialName.toLowerCase() === toDelete.ingredientName.toLowerCase());

        if (isMatch) {
          const convertedRevert = convertQuantity(Number(toDelete.quantity) || 0, toDelete.unit, item.unit);
          const newStock = Math.round((Number(item.currentStock) + convertedRevert) * 100) / 100;
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
    if (isFirebaseConfigured() && typeof deleteSingleWastage === 'function') deleteSingleWastage(id);
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

    // 🛵 Automatic Delivery Packaging Deduction for Online / Parcel Orders (Swiggy / Zomato / Takeaway):
    let packagingDeducted = [];
    const isOnlineOrDelivery = salesList.some(s => {
      const pm = (s.paymentMethod || '').toLowerCase();
      return pm === 'swiggy' || pm === 'zomato' || Number(s.packagingCharge) > 0;
    });

    if (isOnlineOrDelivery) {
      // 1. Deduct 1x Carry Bag for the whole delivery parcel
      const bagIndex = currentInv.findIndex(i =>
        i.category === 'Packaging' &&
        (i.materialName.toLowerCase().includes('carry bag') ||
         i.materialName.toLowerCase().includes('paper bag') ||
         i.materialName.toLowerCase().includes('parcel bag'))
      );
      if (bagIndex !== -1 && currentInv[bagIndex].currentStock > 0) {
        currentInv[bagIndex] = {
          ...currentInv[bagIndex],
          currentStock: Math.max(0, currentInv[bagIndex].currentStock - 1),
          lastUpdated: new Date().toISOString().split('T')[0]
        };
        packagingDeducted.push(`1x ${currentInv[bagIndex].materialName}`);
      }

      // 2. Deduct item-specific packaging if the item recipe does not already include packaging
      salesList.forEach(sale => {
        const targetItem = menuItems.find(m => m.id === sale.itemId || m.name === sale.itemName);
        const hasPackagingInRecipe = targetItem && Array.isArray(targetItem.recipe) &&
          targetItem.recipe.some(r => {
            const nameLower = (r.name || '').toLowerCase();
            return nameLower.includes('box') || nameLower.includes('cup') || nameLower.includes('wrap');
          });

        if (!hasPackagingInRecipe) {
          const itemLower = (sale.itemName || '').toLowerCase();
          const catLower = ((sale.category || '') + ' ' + (targetItem?.category || '')).toLowerCase();
          const qty = Number(sale.quantitySold) || 1;

          // Pizza -> Pizza Box
          if (catLower.includes('pizza') || itemLower.includes('pizza')) {
            const boxIdx = currentInv.findIndex(i =>
              i.category === 'Packaging' && i.materialName.toLowerCase().includes('pizza')
            );
            if (boxIdx !== -1 && currentInv[boxIdx].currentStock > 0) {
              currentInv[boxIdx] = {
                ...currentInv[boxIdx],
                currentStock: Math.max(0, currentInv[boxIdx].currentStock - qty),
                lastUpdated: new Date().toISOString().split('T')[0]
              };
              packagingDeducted.push(`${qty}x Pizza Box`);
            }
          }
          // Burger -> Burger Box
          else if (catLower.includes('burger') || itemLower.includes('burger')) {
            const boxIdx = currentInv.findIndex(i =>
              i.category === 'Packaging' && i.materialName.toLowerCase().includes('burger')
            );
            if (boxIdx !== -1 && currentInv[boxIdx].currentStock > 0) {
              currentInv[boxIdx] = {
                ...currentInv[boxIdx],
                currentStock: Math.max(0, currentInv[boxIdx].currentStock - qty),
                lastUpdated: new Date().toISOString().split('T')[0]
              };
              packagingDeducted.push(`${qty}x Burger Box`);
            }
          }
          // Cold Coffee / Shakes -> Cup with Lid
          else if (catLower.includes('coffee') || catLower.includes('shake') || itemLower.includes('shake') || itemLower.includes('cold coffee')) {
            const cupIdx = currentInv.findIndex(i =>
              i.category === 'Packaging' && (i.materialName.toLowerCase().includes('cup') || i.materialName.toLowerCase().includes('glass'))
            );
            if (cupIdx !== -1 && currentInv[cupIdx].currentStock > 0) {
              currentInv[cupIdx] = {
                ...currentInv[cupIdx],
                currentStock: Math.max(0, currentInv[cupIdx].currentStock - qty),
                lastUpdated: new Date().toISOString().split('T')[0]
              };
              packagingDeducted.push(`${qty}x Cup`);
            }
          }
        }
      });
    }

    updateSales(currentSales);
    updateInventory(currentInv);

    const totalRev = salesList.reduce((s, x) => s + (Number(x.totalRevenue) || 0), 0);
    const orderRef = salesList[0]?.platformOrderId || '';
    const platform = salesList[0]?.paymentMethod || 'Online';
    const packMsg = packagingDeducted.length > 0 ? ` • Packaging: ${packagingDeducted.join(', ')}` : '';
    showToast(`⚡ ${platform} Order ${orderRef ? `${orderRef} ` : ''}Punched! (${salesList.length} items • ₹${totalRev})${packMsg}`);
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
      // New raw material: Add with user's exact name, category, and unit
      const matName = newProc.materialName.trim();
      const matUnit = newProc.unit || 'Piece';
      const matCategory = newProc.category || 'Groceries';
      const totalPurchasedCost = Number(newProc.totalCost) || (qty * (Number(newProc.ratePerUnit) || 0));
      const costPerInvUnit = qty > 0 ? (totalPurchasedCost / qty) : (Number(newProc.ratePerUnit) || 0);
      const roundedCostPerInvUnit = Math.round(costPerInvUnit * 10000) / 10000;

      const newItem = {
        id: `inv-${Date.now()}`,
        materialName: matName,
        category: matCategory,
        currentStock: qty,
        unit: matUnit,
        reorderLevel: 5,
        unitCost: roundedCostPerInvUnit,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      updatedInv = [newItem, ...inventoryItems];
      showToast(`Logged purchase: Added ${qty} ${matUnit} to "${matName}" stock!`);
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
    const activeId = currentCafe?.cafeId || 'default';
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
    if (isFirebaseConfigured()) {
      syncSingleInventory(itemToSave, activeId);
    }
  };

  const handleDeleteInventoryItem = (id) => {
    const activeId = currentCafe?.cafeId || 'default';
    const item = inventoryItems.find(i => i.id === id);
    const updated = inventoryItems.filter(i => i.id !== id);
    updateInventory(updated);
    if (isFirebaseConfigured()) deleteSingleInventory(id, activeId);
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

  const handleRestoreFriendData = async () => {
    const activeId = currentCafe?.cafeId || 'default';
    const restored = await restoreFriendRealData(activeId);
    if (restored) {
      setInventoryItems(restored.inventory);
      setProcurementLogs(restored.procurement);
      showToast('🎉 Friend ke real Stock items (7 Items) & Purchase data successfully restore ho gaye!');
    }
  };

  // ☕ Menu Handlers
  const handleSaveMenuItem = (itemToSave) => {
    const activeId = currentCafe?.cafeId || 'default';
    const targetId = editingItem ? editingItem.id : (itemToSave.id || `item-${Date.now()}`);
    const cleanItem = {
      ...itemToSave,
      id: targetId,
      name: (itemToSave.name || '').trim(),
      category: itemToSave.category || 'Burgers',
      sellingPrice: Number(itemToSave.sellingPrice) || 0,
      costPrice: Number(itemToSave.costPrice) || 0,
      unit: itemToSave.unit || 'Piece',
      imageUrl: itemToSave.imageUrl || '',
      isAvailable: itemToSave.isAvailable !== false,
      recipe: Array.isArray(itemToSave.recipe) ? itemToSave.recipe : []
    };

    let newMenu;
    if (editingItem) {
      newMenu = menuItems.map(i => i.id === editingItem.id ? cleanItem : i);
      showToast(`Updated menu item "${cleanItem.name}" & recipe`);
    } else {
      newMenu = [cleanItem, ...menuItems];
      showToast(`Added "${cleanItem.name}" with recipe to menu`);
    }

    // 1. Immediately save to local storage & state
    updateMenu(newMenu);

    // 2. Fast granular Firestore upsert of the single menu item doc
    if (isFirebaseConfigured()) {
      syncSingleMenuItem(cleanItem, activeId);
    }

    // Auto-register any new recipe ingredients into inventory with 0 stock if not already present
    if (Array.isArray(cleanItem.recipe) && cleanItem.recipe.length > 0) {
      let invUpdated = false;
      let currentInv = [...inventoryItems];

      cleanItem.recipe.forEach(r => {
        const exists = currentInv.some(
          inv => inv.id === r.ingredientId || (inv.materialName && r.name && inv.materialName.toLowerCase() === r.name.toLowerCase())
        );
        if (!exists && r.name && r.name.trim()) {
          const newInvItem = {
            id: r.ingredientId || `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            materialName: r.name.trim(),
            category: 'Groceries',
            currentStock: 0,
            unit: r.unit || 'Piece',
            reorderLevel: 5,
            unitCost: 0,
            lastUpdated: new Date().toISOString().split('T')[0]
          };
          currentInv.push(newInvItem);
          invUpdated = true;
          if (isFirebaseConfigured()) {
            syncSingleInventory(newInvItem, activeId);
          }
        }
      });

      if (invUpdated) {
        updateInventory(currentInv);
      }
    }

    setIsModalOpen(false);
  };

  const handleDuplicateMenuItem = (sourceItem) => {
    if (!sourceItem) return;
    const activeId = currentCafe?.cafeId || 'default';

    const duplicatedItem = {
      ...sourceItem,
      id: `item-${Date.now()}`,
      name: `${sourceItem.name} (Copy)`,
      recipe: Array.isArray(sourceItem.recipe)
        ? JSON.parse(JSON.stringify(sourceItem.recipe))
        : []
    };

    const newMenu = [duplicatedItem, ...menuItems];
    updateMenu(newMenu);
    if (isFirebaseConfigured()) {
      syncSingleMenuItem(duplicatedItem, activeId);
    }
    showToast(`📋 "${sourceItem.name}" duplicate ho gaya! Ab aap ise customize kar sakte hain.`);

    // Immediately open editor for this duplicated item
    setEditingItem(duplicatedItem);
    setIsModalOpen(true);
  };

  const handleDeleteMenuItem = (id) => {
    const activeId = currentCafe?.cafeId || 'default';
    const item = menuItems.find(i => i.id === id);
    const updated = menuItems.filter(i => i.id !== id);
    updateMenu(updated);
    if (isFirebaseConfigured()) {
      deleteSingleMenuItem(id, activeId);
    }
    showToast(`Deleted "${item ? item.name : 'Item'}" from menu`);
    setDeletingItem(null);
  };

  const handleToggleMenuItemStatus = (id) => {
    const activeId = currentCafe?.cafeId || 'default';
    let targetItem = null;
    const updated = menuItems.map(i => {
      if (i.id === id) {
        const next = !i.isAvailable;
        targetItem = { ...i, isAvailable: next };
        showToast(`"${i.name}" marked as ${next ? 'Available' : 'Disabled'}`);
        return targetItem;
      }
      return i;
    });
    updateMenu(updated);
    if (isFirebaseConfigured() && targetItem) {
      syncSingleMenuItem(targetItem, activeId);
    }
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

    // Play Meesho chime + voice alert ("Dine-in ka order aaya hai, check karein")
    playOrderChime({
      tableNumber: newOrder.tableNumber,
      totalAmount: newOrder.totalAmount
    });
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

  // 🔒 Priority 1: Staff PIN Lock Handlers
  const handleLockToStaffMode = () => {
    setIsStaffMode(true);
    if (activeTab === 'dashboard' || activeTab === 'expenses' || activeTab === 'inventory') {
      setActiveTab('sales');
    }
    showToast('🔒 Staff Mode Active (Owner P&L & Expenses Locked)');
  };

  const handlePromptUnlockStaffMode = () => {
    setPinModalTargetTab(null);
    setIsPinModalOpen(true);
  };

  const handleUnlockPinSuccess = () => {
    setIsPinModalOpen(false);
    setIsStaffMode(false);
    if (pinModalTargetTab) {
      setActiveTab(pinModalTargetTab);
      setPinModalTargetTab(null);
    }
    showToast('👑 Owner Mode Unlocked!');
  };

  const handleUpdateOwnerPin = (newPin) => {
    setOwnerPin(newPin);
    saveStoredOwnerPin(newPin, currentCafe?.cafeId);
    showToast('✅ Naya Owner PIN Save Ho Gaya!');
  };

  // 🌙 Priority 2: Day-End Cash Closing Handlers
  const handleSaveDayClosing = (closingRecord) => {
    const updated = [closingRecord, ...dayClosings];
    setDayClosings(updated);
    saveStoredDayClosings(updated, currentCafe?.cafeId);
    showToast('✅ Day Closing Record Saved Successfully!');
  };

  // 📒 Priority 3: Customer Khata / Udhar Ledger Handlers
  const handleAddKhataTransaction = (tx) => {
    const updated = [tx, ...khataLedger];
    setKhataLedger(updated);
    saveStoredKhata(updated, currentCafe?.cafeId);
  };

  // Outstanding Khata Balance across all customers
  const totalKhataOutstanding = useMemo(() => {
    const customerDues = {};
    khataLedger.forEach(k => {
      const key = (k.customerPhone && k.customerPhone.trim()) || (k.customerName || '').trim().toLowerCase();
      if (!customerDues[key]) customerDues[key] = 0;
      if (k.type === 'debit') customerDues[key] += (Number(k.amount) || 0);
      else if (k.type === 'credit') customerDues[key] -= (Number(k.amount) || 0);
    });
    return Object.values(customerDues).reduce((sum, bal) => sum + Math.max(0, bal), 0);
  }, [khataLedger]);

  // Tab switching guard for Staff Mode
  const handleTabClick = (tab) => {
    if (isStaffMode && (tab === 'dashboard' || tab === 'expenses' || tab === 'inventory' || tab === 'profile')) {
      setPinModalTargetTab(tab);
      setIsPinModalOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  // 🛡️ SUPER ADMIN HIDDEN PORTAL (/admin, #/admin)
  // Completely isolated from regular user UI — only triggers when /admin is entered in URL
  if (isAdminMode) {
    return (
      <AdminPortal
        onExit={() => {
          setIsAdminMode(false);
          try {
            window.history.pushState({}, '', window.location.pathname.replace(/\/admin\/?$/i, '') || '/');
          } catch (e) {}
        }}
        onSwitchCafe={(cafeProfile) => {
          setIsAdminMode(false);
          handleSwitchCafe(cafeProfile);
          try {
            window.history.pushState({}, '', '/');
          } catch (e) {}
        }}
      />
    );
  }

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
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900 font-sans selection:bg-amber-200 selection:text-amber-900 overflow-x-clip">

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-slate-800 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toast}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentCafe={currentCafe}
        currentUser={currentUser}
        isDemoMode={isDemoMode}
        onOpenAuthModal={(tab = 'signup') => {
          setAuthModalTab(tab);
          setIsAuthModalOpen(true);
        }}
        onOpenCafeProfileModal={() => handleTabClick('profile')}
        onOpenProfilePage={() => handleTabClick('profile')}
        onOpenAlertSettings={() => setIsAlertSettingsOpen(true)}
        onExitDemo={() => setIsDemoMode(false)}
        onLogout={handleLogout}
        isStaffMode={isStaffMode}
        onLockToStaffMode={handleLockToStaffMode}
        onPromptUnlockStaffMode={handlePromptUnlockStaffMode}
      />

      {/* Main Container with Left Sidebar & Content (Bounded to max 1920px, centered with responsive gutters) */}
      <div className="flex-1 w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 py-2.5 sm:py-3.5 flex flex-col md:flex-row gap-3 items-start">

        {/* 🧭 LEFT SIDEBAR NAVIGATION */}
        <aside className="w-full md:w-52 lg:w-56 xl:w-60 shrink-0 bg-white rounded-2xl border border-slate-200 p-2 sm:p-2.5 shadow-xs md:sticky md:top-20 lg:top-[5.25rem] md:max-h-[calc(100vh-5.5rem)] md:overflow-y-auto space-y-2 z-20 self-start scrollbar-none">
          
          <div className="hidden md:flex items-center justify-between px-2.5 py-1 text-slate-400 border-b border-slate-100 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Navigation</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">POS Menu</span>
          </div>

          {/* Navigation Items (Vertical on md+, Horizontal scroll on mobile) */}
          <nav className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-visible no-scrollbar p-0.5">
            
            {/* 1. Sale Tab (Renamed from Daily Sales!) */}
            <button
              type="button"
              onClick={() => handleTabClick('sales')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 md:w-full ${
                activeTab === 'sales'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className={`w-4 h-4 ${activeTab === 'sales' ? 'text-white' : 'text-indigo-600'}`} />
                <span>Sale</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                activeTab === 'sales' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 hidden md:inline'
              }`}>
                POS
              </span>
            </button>

            {/* 2. Dine-In & QR Orders Tab */}
            <button
              type="button"
              onClick={() => handleTabClick('dining')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 md:w-full ${
                activeTab === 'dining'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UtensilsCrossed className={`w-4 h-4 ${activeTab === 'dining' ? 'text-white' : 'text-amber-600'}`} />
                <span>Dine-In & Tables</span>
              </div>
              {diningOrders.filter(o => o.status === 'pending').length > 0 ? (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              ) : (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                  activeTab === 'dining' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 hidden md:inline'
                }`}>
                  QR
                </span>
              )}
            </button>

            {/* 3. Raw Material Stock Tab */}
            <button
              type="button"
              onClick={() => handleTabClick('inventory')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 md:w-full ${
                activeTab === 'inventory'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={isStaffMode ? 'Owner PIN Protected' : 'Raw Materials Inventory'}
            >
              <div className="flex items-center gap-2.5">
                <Boxes className={`w-4 h-4 ${activeTab === 'inventory' ? 'text-white' : 'text-emerald-600'}`} />
                <span>Stock</span>
              </div>
              {isStaffMode && <span className="text-[10px]">🔒</span>}
            </button>

            {/* 4. Purchases (Procurement) Tab */}
            <button
              type="button"
              onClick={() => handleTabClick('procurement')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 md:w-full ${
                activeTab === 'procurement'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PackageCheck className={`w-4 h-4 ${activeTab === 'procurement' ? 'text-white' : 'text-blue-600'}`} />
                <span>Purchases</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                activeTab === 'procurement' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 hidden md:inline'
              }`}>
                In
              </span>
            </button>

            {/* 5. Bills & Expenses Tab */}
            <button
              type="button"
              onClick={() => handleTabClick('expenses')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 md:w-full ${
                activeTab === 'expenses'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={isStaffMode ? 'Owner PIN Protected' : 'Cafe Bills & Expenses'}
            >
              <div className="flex items-center gap-2.5">
                <Receipt className={`w-4 h-4 ${activeTab === 'expenses' ? 'text-white' : 'text-rose-600'}`} />
                <span>Bills & Expenses</span>
              </div>
              {isStaffMode && <span className="text-[10px]">🔒</span>}
            </button>

            {/* 6. P&L Dashboard Tab */}
            <button
              type="button"
              onClick={() => handleTabClick('dashboard')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 md:w-full ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={isStaffMode ? 'Owner PIN Protected' : 'Financial P&L Dashboard'}
            >
              <div className="flex items-center gap-2.5">
                <PieChart className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-white' : 'text-violet-600'}`} />
                <span>P&L Dashboard</span>
              </div>
              {isStaffMode && <span className="text-[10px]">🔒</span>}
            </button>

            {/* 7. Menu Catalog & Recipes Tab */}
            <button
              type="button"
              onClick={() => handleTabClick('menu')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 md:w-full ${
                activeTab === 'menu'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Coffee className={`w-4 h-4 ${activeTab === 'menu' ? 'text-white' : 'text-amber-700'}`} />
                <span>Menu & Recipes</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                activeTab === 'menu' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 hidden md:inline'
              }`}>
                {menuItems.length}
              </span>
            </button>

            {/* 8. Cafe Profile Tab */}
            <button
              type="button"
              onClick={() => handleTabClick('profile')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 md:w-full ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={isStaffMode ? 'Owner PIN Protected' : 'Cafe & Business Profile Settings'}
            >
              <div className="flex items-center gap-2.5">
                <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-white' : 'text-indigo-600'}`} />
                <span>Cafe Profile</span>
              </div>
              {isStaffMode ? (
                <span className="text-[10px]">🔒</span>
              ) : (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                  activeTab === 'profile' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700 hidden md:inline'
                }`}>
                  Pro
                </span>
              )}
            </button>

          </nav>

          {/* Sidebar Footer Info / Quick actions for Desktop */}
          <div className="hidden md:block pt-3 border-t border-slate-100 space-y-2">
            <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span>{currentCafe?.businessType === 'restaurant' ? '🍽️ Restaurant' : '☕ Cafe Mode'}</span>
                <span className="text-emerald-600 font-black">● Live</span>
              </div>
              <p className="text-[10px] truncate text-slate-400">{currentCafe?.cafeName}</p>
            </div>

            {activeTab === 'menu' && (
              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAIScannerOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>AI Menu Scanner</span>
                </button>
                <button
                  onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>+ Add Item</span>
                </button>
              </div>
            )}
          </div>

        </aside>

        {/* 💻 MAIN CONTENT VIEW */}
        <main className="flex-1 min-w-0 w-full space-y-3.5">
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
            onOpenReceiptPrinter={handleOpenReceiptPrinter}
            showToast={showToast}
            khataLedger={khataLedger}
            onAddKhataTransaction={handleAddKhataTransaction}
            onOpenKhataModal={() => setIsKhataModalOpen(true)}
            onOpenDayClosingModal={() => setIsDayClosingModalOpen(true)}
            isStaffMode={isStaffMode}
            onPromptUnlockStaffMode={handlePromptUnlockStaffMode}
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
            onOpenReceiptPrinter={handleOpenReceiptPrinter}
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
            onNavigateToProcurement={() => setActiveTab('procurement')}
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
            isStaffMode={isStaffMode}
            onPromptUnlock={handlePromptUnlockStaffMode}
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
                  title="Scan Menu Card Photo or Paste Digital Rate List"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>📸 AI Menu Scanner</span>
                </button>
                {!isCleanSlate && menuItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsClearDemoModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-xs"
                    title="Wipe demo items & start blank slate for your own cafe"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Clear Demo Data</span>
                  </button>
                )}
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
                salesLogs={salesLogs}
                onEdit={(item) => { setEditingItem(item); setIsModalOpen(true); }}
                onDelete={(item) => setDeletingItem(item)}
                onToggleStatus={handleToggleMenuItemStatus}
                onSaveItem={handleSaveMenuItem}
                onDuplicate={handleDuplicateMenuItem}
                onOpenAIScanner={() => setIsAIScannerOpen(true)}
                onOpenAddItem={() => { setEditingItem(null); setIsModalOpen(true); }}
              />
            ) : (
              <ItemTable
                items={menuItems}
                inventoryItems={inventoryItems}
                salesLogs={salesLogs}
                onEdit={(item) => { setEditingItem(item); setIsModalOpen(true); }}
                onDelete={(item) => setDeletingItem(item)}
                onToggleStatus={handleToggleMenuItemStatus}
                onSaveItem={handleSaveMenuItem}
                onDuplicate={handleDuplicateMenuItem}
              />
            )}
          </div>
        )}

        {/* 🏬 Dedicated Cafe & Business Profile Tab View */}
        {activeTab === 'profile' && (
          <CafeProfilePage
            currentCafe={currentCafe}
            currentUser={currentUser}
            allCafes={userCafes}
            menuCount={menuItems.length}
            inventoryCount={inventoryItems.length}
            onSwitchCafe={handleSwitchCafe}
            onLogout={handleLogout}
            onUpdateCafe={(updated) => {
              setCurrentCafe(updated);
              showToast(`Cafe details updated: ${updated.cafeName}`);
            }}
            onBackToPos={() => setActiveTab('sales')}
            onResetToCleanSlate={handleResetToCleanSlate}
            onLoadCatalogPreset={handleLoadCatalogPreset}
            showToast={showToast}
          />
        )}

        </main>
      </div>

      {/* 🧹 Clear Demo Data Confirmation Modal */}
      {isClearDemoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Clear Demo Data (Clean Slate)</h3>
                <p className="text-xs text-stone-500">Remove sample menu dishes and starter stock</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed bg-amber-50 border border-amber-200 p-3 rounded-xl">
              Kya aap sample menu items aur demo raw material stock ko hatana chahte hain? Iske baad aap apna original cafe menu aur recipes add kar sakte hain. Yeh button demo data hatne ke baad hamesha ke liye gayab ho jayega.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                disabled={clearDemoLoading}
                onClick={() => setIsClearDemoModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearDemoLoading}
                onClick={async () => {
                  setClearDemoLoading(true);
                  try {
                    await handleResetToCleanSlate({
                      clearMenu: true,
                      clearInventory: true,
                      clearPurchases: true,
                      clearWastage: true,
                      clearSales: false,
                      clearExpenses: false
                    });
                    setIsCleanSlate(true);
                    setIsClearDemoModalOpen(false);
                    showToast('✨ Demo data successfully cleared! Ab aap apna real menu & recipe add karein.');
                  } catch (err) {
                    showToast('❌ Error clearing demo data: ' + (err?.message || 'Error'));
                  } finally {
                    setClearDemoLoading(false);
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {clearDemoLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{clearDemoLoading ? 'Clearing...' : 'Haan, Demo Data Clear Karein'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Form Modal with Recipe Builder */}
      <ItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMenuItem}
        editingItem={editingItem}
        onDuplicate={handleDuplicateMenuItem}
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
        menuCount={menuItems.length}
        inventoryCount={inventoryItems.length}
        onSwitchCafe={handleSwitchCafe}
        onLogout={handleLogout}
        onResetToCleanSlate={handleResetToCleanSlate}
        onLoadCatalogPreset={handleLoadCatalogPreset}
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

      {/* 🤖 Telegram Automated Stock & Dine-In Order Alerts Modal */}
      <StockAlertSettingsModal
        isOpen={isAlertSettingsOpen}
        onClose={() => setIsAlertSettingsOpen(false)}
        showToast={showToast}
        currentCafe={currentCafe}
      />

      {/* 🖨️ Thermal Bill & Kitchen KOT Receipt Printer Modal */}
      <ThermalBillModal
        isOpen={isReceiptPrinterOpen}
        onClose={() => setIsReceiptPrinterOpen(false)}
        orderData={receiptPrinterOrder}
        cafeProfile={currentCafe}
        initialMode={receiptPrinterMode}
        showToast={showToast}
      />

      {/* 🔒 Priority 1: Staff PIN Lock Modal */}
      <StaffPinModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPinModalTargetTab(null);
        }}
        onSuccessUnlock={handleUnlockPinSuccess}
        currentPin={ownerPin}
        onUpdatePin={handleUpdateOwnerPin}
        title="Owner PIN Lock"
        subtitle="Owner financial P&L, stock adjustments, and cafe expenses are protected in Staff Mode."
      />

      {/* 🌙 Priority 2: Day-End Cash Closing Modal (Z-Report) */}
      <DayClosingModal
        isOpen={isDayClosingModalOpen}
        onClose={() => setIsDayClosingModalOpen(false)}
        salesLogs={salesLogs}
        expenses={expenses}
        procurementLogs={procurementLogs}
        khataLedger={khataLedger}
        closingHistory={dayClosings}
        onSaveDayClosing={handleSaveDayClosing}
        currentCafe={currentCafe}
        showToast={showToast}
      />

      {/* 📒 Priority 3: Customer Khata / Udhar Ledger Modal */}
      <CustomerKhataModal
        isOpen={isKhataModalOpen}
        onClose={() => setIsKhataModalOpen(false)}
        khataLedger={khataLedger}
        onAddKhataTransaction={handleAddKhataTransaction}
        currentCafe={currentCafe}
        showToast={showToast}
      />

      {/* Sticky Mobile Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-950/95 backdrop-blur-md border-t border-stone-800/80 py-1.5 px-3 flex items-center justify-around shadow-2xl safe-area-pb">
        <button
          onClick={() => handleTabClick('sales')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'sales' ? 'text-amber-400 font-extrabold scale-105' : 'text-stone-400 hover:text-stone-200'
            }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="text-[10px]">Sales</span>
        </button>

        <button
          onClick={() => handleTabClick('dining')}
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
          onClick={() => handleTabClick('inventory')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'inventory' ? 'text-amber-400 font-extrabold scale-105' : 'text-stone-400 hover:text-stone-200'
            }`}
        >
          <Boxes className="w-4 h-4" />
          <span className="text-[10px]">Stock{isStaffMode ? '🔒' : ''}</span>
        </button>

        <button
          onClick={() => handleTabClick('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'dashboard' ? 'text-amber-400 font-extrabold scale-105' : 'text-stone-400 hover:text-stone-200'
            }`}
        >
          <PieChart className="w-4 h-4" />
          <span className="text-[10px]">P&L{isStaffMode ? '🔒' : ''}</span>
        </button>

        <button
          onClick={() => handleTabClick('procurement')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-xl transition-all cursor-pointer ${activeTab === 'procurement' ? 'text-amber-400 font-extrabold scale-105' : 'text-stone-400 hover:text-stone-200'
            }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span className="text-[9px]">Purchases</span>
        </button>

        <button
          onClick={() => handleTabClick('expenses')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-xl transition-all cursor-pointer ${activeTab === 'expenses' ? 'text-amber-400 font-extrabold scale-105' : 'text-stone-400 hover:text-stone-200'
            }`}
        >
          <Receipt className="w-4 h-4" />
          <span className="text-[9px]">Bills{isStaffMode ? '🔒' : ''}</span>
        </button>

        <button
          onClick={() => handleTabClick('menu')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-xl transition-all cursor-pointer ${activeTab === 'menu' ? 'text-amber-400 font-extrabold scale-105' : 'text-stone-400 hover:text-stone-200'
            }`}
        >
          <Coffee className="w-4 h-4" />
          <span className="text-[9px]">Menu</span>
        </button>

        <button
          onClick={() => handleTabClick('profile')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-xl transition-all cursor-pointer ${activeTab === 'profile' ? 'text-amber-400 font-extrabold scale-105' : 'text-stone-400 hover:text-stone-200'
            }`}
        >
          <User className="w-4 h-4" />
          <span className="text-[9px]">Profile</span>
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

