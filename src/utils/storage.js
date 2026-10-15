const MENU_STORAGE_KEY = 'ss_cafe_menu_items_v7';
const SALES_STORAGE_KEY = 'ss_cafe_sales_logs_v7';
const PROCUREMENT_STORAGE_KEY = 'ss_cafe_procurement_logs_v7';
const INVENTORY_STORAGE_KEY = 'ss_cafe_inventory_v7';
const EXPENSES_STORAGE_KEY = 'ss_cafe_expenses_v1';
const WASTAGE_STORAGE_KEY = 'ss_cafe_wastage_v1';
const DINING_ORDERS_STORAGE_KEY = 'ss_cafe_dining_orders_v1';
const AGGREGATOR_SETTLEMENTS_STORAGE_KEY = 'ss_cafe_aggregator_settlements_v1';
const KHATA_STORAGE_KEY = 'ss_cafe_khata_ledger_v1';
const DAY_CLOSING_STORAGE_KEY = 'ss_cafe_day_closing_logs_v1';
const OWNER_PIN_STORAGE_KEY = 'ss_cafe_owner_pin_v1';


// Get today's YYYY-MM-DD string in local user timezone
export const getTodayDateString = (offsetDays = 0) => {
  const d = new Date();
  if (offsetDays) {
    d.setDate(d.getDate() - offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Safely add/subtract days from YYYY-MM-DD string without timezone skew
export const shiftDateStr = (dateStr, offsetDays = 0) => {
  if (!offsetDays) return dateStr || getTodayDateString(0);
  const parts = (dateStr || '').split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return getTodayDateString(offsetDays > 0 ? -offsetDays : Math.abs(offsetDays));
  }
  const dt = new Date(parts[0], parts[1] - 1, parts[2] + offsetDays);
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Accurately count unique orders/tokens instead of raw item rows
export const getUniqueOrderCount = (itemsList = []) => {
  if (!Array.isArray(itemsList) || itemsList.length === 0) return 0;
  const tokenSet = new Set();
  let fallbackCount = 0;

  itemsList.forEach(s => {
    const key = s.platformOrderId || s.token || s.tokenOrBillNo;
    if (key) {
      tokenSet.add(`${s.date || ''}_${key}`);
    } else {
      fallbackCount++;
    }
  });

  return tokenSet.size + fallbackCount;
};

// Unambiguously classify any sale object into 'swiggy' | 'zomato' | 'khata' | 'cash' | 'upi'
export const classifySalePaymentMethod = (s) => {
  if (!s) return 'cash';
  const pm = String(s.paymentMethod || '').trim().toLowerCase();
  const pl = String(s.platform || s.channel || s.orderType || '').trim().toLowerCase();
  const token = String(s.platformOrderId || s.token || s.tokenOrBillNo || '').trim().toLowerCase();

  // 1. Swiggy
  if (pm === 'swiggy' || pl === 'swiggy' || pl.includes('swiggy') || token.startsWith('#swg') || token.startsWith('swg') || token.includes('swiggy')) {
    return 'swiggy';
  }

  // 2. Zomato
  if (pm === 'zomato' || pl === 'zomato' || pl.includes('zomato') || token.startsWith('#zom') || token.startsWith('zom') || token.includes('zomato')) {
    return 'zomato';
  }

  // 3. Khata (Udhar / Credit)
  if (pm === 'khata' || pm === 'udhar' || pl === 'khata' || pl === 'udhar' || pl.includes('khata') || pl.includes('udhar') || (s.customerName && (pm.includes('khata') || pl.includes('khata')))) {
    return 'khata';
  }

  // 4. Cash
  if (pm === 'cash' || pl === 'cash' || pl.includes('(cash)')) {
    return 'cash';
  }

  // 5. UPI / Online (Counter / Dine-In UPI)
  if (pm === 'online' || pm === 'upi' || pm === 'counter upi' || pl === 'online' || pl === 'upi' || pl.includes('upi') || pm.includes('paytm') || pm.includes('gpay') || pm.includes('phonepe')) {
    return 'upi';
  }

  // Fallback
  return 'cash';
};


// Initial Raw Materials Inventory
export const INITIAL_INVENTORY_ITEMS = [
  { id: 'inv-1', materialName: 'Pizza Base', category: 'Bakery', currentStock: 40, unit: 'Piece', reorderLevel: 10, unitCost: 15, lastUpdated: getTodayDateString(0) },
  { id: 'inv-2', materialName: 'Mozzarella Cheese', category: 'Dairy', currentStock: 3000, unit: 'Gram', reorderLevel: 500, unitCost: 0.45, lastUpdated: getTodayDateString(0) },
  { id: 'inv-3', materialName: 'Pizza Sauce', category: 'Groceries', currentStock: 2500, unit: 'Gram', reorderLevel: 400, unitCost: 0.20, lastUpdated: getTodayDateString(0) },
  { id: 'inv-4', materialName: 'Burger Buns', category: 'Bakery', currentStock: 50, unit: 'Piece', reorderLevel: 15, unitCost: 8, lastUpdated: getTodayDateString(0) },
  { id: 'inv-5', materialName: 'Veg Aloo Patty', category: 'Groceries', currentStock: 45, unit: 'Piece', reorderLevel: 15, unitCost: 10, lastUpdated: getTodayDateString(0) },
  { id: 'inv-6', materialName: 'Mayonnaise', category: 'Groceries', currentStock: 1500, unit: 'Gram', reorderLevel: 300, unitCost: 0.18, lastUpdated: getTodayDateString(0) },
  { id: 'inv-7', materialName: 'Whole Milk', category: 'Dairy', currentStock: 15000, unit: 'ml', reorderLevel: 3000, unitCost: 0.06, lastUpdated: getTodayDateString(0) },
  { id: 'inv-8', materialName: 'Coffee Powder', category: 'Beans & Teas', currentStock: 1000, unit: 'Gram', reorderLevel: 150, unitCost: 1.50, lastUpdated: getTodayDateString(0) },
  { id: 'inv-9', materialName: 'Sugar', category: 'Groceries', currentStock: 4000, unit: 'Gram', reorderLevel: 500, unitCost: 0.05, lastUpdated: getTodayDateString(0) },
  { id: 'inv-10', materialName: 'French Fries (Frozen)', category: 'Groceries', currentStock: 5000, unit: 'Gram', reorderLevel: 1000, unitCost: 0.16, lastUpdated: getTodayDateString(0) },
  { id: 'inv-11', materialName: 'Garlic Bread Loaf', category: 'Bakery', currentStock: 25, unit: 'Piece', reorderLevel: 5, unitCost: 15, lastUpdated: getTodayDateString(0) },
  { id: 'inv-12', materialName: 'Sandwich Bread', category: 'Bakery', currentStock: 80, unit: 'Slice', reorderLevel: 20, unitCost: 2, lastUpdated: getTodayDateString(0) },
  { id: 'inv-13', materialName: 'Butter', category: 'Dairy', currentStock: 1500, unit: 'Gram', reorderLevel: 250, unitCost: 0.50, lastUpdated: getTodayDateString(0) },
  { id: 'inv-14', materialName: 'Paneer (Cottage Cheese)', category: 'Dairy', currentStock: 2000, unit: 'Gram', reorderLevel: 400, unitCost: 0.38, lastUpdated: getTodayDateString(0) },
  { id: 'inv-15', materialName: 'Cheese Slice', category: 'Dairy', currentStock: 50, unit: 'Piece', reorderLevel: 10, unitCost: 8, lastUpdated: getTodayDateString(0) }
];

// Official S&S Cafe Menu Catalog with Built-in Recipes
export const INITIAL_MENU_ITEMS = [
  // PIZZA
  {
    id: 'pizza-1',
    name: 'Margarita Pizza',
    category: 'Pizza',
    sellingPrice: 69,
    costPrice: 30,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-1', name: 'Pizza Base', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-2', name: 'Mozzarella Cheese', quantity: 50, unit: 'Gram' },
      { ingredientId: 'inv-3', name: 'Pizza Sauce', quantity: 25, unit: 'Gram' }
    ]
  },
  {
    id: 'pizza-2',
    name: 'Veg Cheese Pizza',
    category: 'Pizza',
    sellingPrice: 79,
    costPrice: 35,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-1', name: 'Pizza Base', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-2', name: 'Mozzarella Cheese', quantity: 60, unit: 'Gram' },
      { ingredientId: 'inv-3', name: 'Pizza Sauce', quantity: 30, unit: 'Gram' }
    ]
  },
  {
    id: 'pizza-3',
    name: 'Schezwan Pizza',
    category: 'Pizza',
    sellingPrice: 89,
    costPrice: 40,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-1', name: 'Pizza Base', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-2', name: 'Mozzarella Cheese', quantity: 60, unit: 'Gram' },
      { ingredientId: 'inv-3', name: 'Pizza Sauce', quantity: 35, unit: 'Gram' }
    ]
  },
  {
    id: 'pizza-4',
    name: 'Cheese Corn Pizza',
    category: 'Pizza',
    sellingPrice: 99,
    costPrice: 45,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-1', name: 'Pizza Base', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-2', name: 'Mozzarella Cheese', quantity: 70, unit: 'Gram' },
      { ingredientId: 'inv-3', name: 'Pizza Sauce', quantity: 30, unit: 'Gram' }
    ]
  },
  {
    id: 'pizza-5',
    name: 'Paneer Makhni Pizza',
    category: 'Pizza',
    sellingPrice: 99,
    costPrice: 45,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-1', name: 'Pizza Base', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-2', name: 'Mozzarella Cheese', quantity: 60, unit: 'Gram' },
      { ingredientId: 'inv-14', name: 'Paneer (Cottage Cheese)', quantity: 40, unit: 'Gram' }
    ]
  },
  {
    id: 'pizza-6',
    name: 'Tandoori Paneer Pizza',
    category: 'Pizza',
    sellingPrice: 99,
    costPrice: 45,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-1', name: 'Pizza Base', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-2', name: 'Mozzarella Cheese', quantity: 60, unit: 'Gram' },
      { ingredientId: 'inv-14', name: 'Paneer (Cottage Cheese)', quantity: 40, unit: 'Gram' }
    ]
  },
  {
    id: 'pizza-7',
    name: 'S&S Special Pizza',
    category: 'Pizza',
    sellingPrice: 149,
    costPrice: 65,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-1', name: 'Pizza Base', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-2', name: 'Mozzarella Cheese', quantity: 90, unit: 'Gram' },
      { ingredientId: 'inv-14', name: 'Paneer (Cottage Cheese)', quantity: 50, unit: 'Gram' }
    ]
  },

  // BURGER (VEG)
  {
    id: 'burger-1',
    name: 'Aloo Tikki Burger',
    category: 'Burgers',
    sellingPrice: 39,
    costPrice: 18,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-4', name: 'Burger Buns', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-5', name: 'Veg Aloo Patty', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-6', name: 'Mayonnaise', quantity: 15, unit: 'Gram' }
    ]
  },
  {
    id: 'burger-2',
    name: 'Classic Veg Burger',
    category: 'Burgers',
    sellingPrice: 39,
    costPrice: 18,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-4', name: 'Burger Buns', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-5', name: 'Veg Aloo Patty', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-6', name: 'Mayonnaise', quantity: 20, unit: 'Gram' }
    ]
  },
  {
    id: 'burger-3',
    name: 'Peri Peri Cheese Burger',
    category: 'Burgers',
    sellingPrice: 49,
    costPrice: 22,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-4', name: 'Burger Buns', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-5', name: 'Veg Aloo Patty', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-15', name: 'Cheese Slice', quantity: 1, unit: 'Piece' }
    ]
  },
  {
    id: 'burger-4',
    name: 'Tandoori Cheese Burger',
    category: 'Burgers',
    sellingPrice: 49,
    costPrice: 22,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-4', name: 'Burger Buns', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-5', name: 'Veg Aloo Patty', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-15', name: 'Cheese Slice', quantity: 1, unit: 'Piece' }
    ]
  },
  {
    id: 'burger-5',
    name: 'Schezwan Cheese Burger',
    category: 'Burgers',
    sellingPrice: 59,
    costPrice: 26,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-4', name: 'Burger Buns', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-5', name: 'Veg Aloo Patty', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-15', name: 'Cheese Slice', quantity: 1, unit: 'Piece' }
    ]
  },
  {
    id: 'burger-6',
    name: 'Crispy Paneer Burger',
    category: 'Burgers',
    sellingPrice: 99,
    costPrice: 45,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-4', name: 'Burger Buns', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-14', name: 'Paneer (Cottage Cheese)', quantity: 60, unit: 'Gram' },
      { ingredientId: 'inv-6', name: 'Mayonnaise', quantity: 20, unit: 'Gram' }
    ]
  },
  {
    id: 'burger-7',
    name: 'S&S Snaker Burger',
    category: 'Burgers',
    sellingPrice: 119,
    costPrice: 55,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-4', name: 'Burger Buns', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-5', name: 'Veg Aloo Patty', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-15', name: 'Cheese Slice', quantity: 1, unit: 'Piece' }
    ]
  },

  // SANDWICH
  {
    id: 'sandwich-1',
    name: 'Creamy Corn Sandwich',
    category: 'Sandwich',
    sellingPrice: 59,
    costPrice: 25,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-12', name: 'Sandwich Bread', quantity: 2, unit: 'Slice' },
      { ingredientId: 'inv-6', name: 'Mayonnaise', quantity: 20, unit: 'Gram' },
      { ingredientId: 'inv-13', name: 'Butter', quantity: 10, unit: 'Gram' }
    ]
  },
  {
    id: 'sandwich-2',
    name: 'Cheese Chutney Sandwich',
    category: 'Sandwich',
    sellingPrice: 69,
    costPrice: 30,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-12', name: 'Sandwich Bread', quantity: 2, unit: 'Slice' },
      { ingredientId: 'inv-15', name: 'Cheese Slice', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-13', name: 'Butter', quantity: 10, unit: 'Gram' }
    ]
  },
  {
    id: 'sandwich-3',
    name: 'Tandoori Paneer Sandwich',
    category: 'Sandwich',
    sellingPrice: 79,
    costPrice: 35,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-12', name: 'Sandwich Bread', quantity: 2, unit: 'Slice' },
      { ingredientId: 'inv-14', name: 'Paneer (Cottage Cheese)', quantity: 40, unit: 'Gram' },
      { ingredientId: 'inv-13', name: 'Butter', quantity: 10, unit: 'Gram' }
    ]
  },
  {
    id: 'sandwich-4',
    name: 'Aloo Tikki Sandwich',
    category: 'Sandwich',
    sellingPrice: 89,
    costPrice: 40,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-12', name: 'Sandwich Bread', quantity: 2, unit: 'Slice' },
      { ingredientId: 'inv-5', name: 'Veg Aloo Patty', quantity: 1, unit: 'Piece' }
    ]
  },
  {
    id: 'sandwich-5',
    name: 'Chargrill Veg Sandwich',
    category: 'Sandwich',
    sellingPrice: 89,
    costPrice: 40,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-12', name: 'Sandwich Bread', quantity: 2, unit: 'Slice' },
      { ingredientId: 'inv-13', name: 'Butter', quantity: 15, unit: 'Gram' }
    ]
  },
  {
    id: 'sandwich-6',
    name: 'Falafel Sandwich',
    category: 'Sandwich',
    sellingPrice: 99,
    costPrice: 45,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-12', name: 'Sandwich Bread', quantity: 2, unit: 'Slice' },
      { ingredientId: 'inv-6', name: 'Mayonnaise', quantity: 25, unit: 'Gram' }
    ]
  },
  {
    id: 'sandwich-7',
    name: 'Club Sandwich',
    category: 'Sandwich',
    sellingPrice: 119,
    costPrice: 55,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-12', name: 'Sandwich Bread', quantity: 3, unit: 'Slice' },
      { ingredientId: 'inv-15', name: 'Cheese Slice', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-14', name: 'Paneer (Cottage Cheese)', quantity: 30, unit: 'Gram' }
    ]
  },

  // FRIES
  {
    id: 'fries-1',
    name: 'Salted Fries',
    category: 'Fries',
    sellingPrice: 59,
    costPrice: 25,
    unit: 'Portion',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-10', name: 'French Fries (Frozen)', quantity: 150, unit: 'Gram' }
    ]
  },
  {
    id: 'fries-2',
    name: 'Peri Peri Fries',
    category: 'Fries',
    sellingPrice: 69,
    costPrice: 30,
    unit: 'Portion',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-10', name: 'French Fries (Frozen)', quantity: 150, unit: 'Gram' }
    ]
  },
  {
    id: 'fries-3',
    name: 'Loaded Fries',
    category: 'Fries',
    sellingPrice: 89,
    costPrice: 40,
    unit: 'Portion',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-10', name: 'French Fries (Frozen)', quantity: 180, unit: 'Gram' },
      { ingredientId: 'inv-2', name: 'Mozzarella Cheese', quantity: 30, unit: 'Gram' }
    ]
  },

  // GARLIC BREAD
  {
    id: 'gb-1',
    name: 'Plain Garlic Bread',
    category: 'Garlic Bread',
    sellingPrice: 59,
    costPrice: 25,
    unit: 'Portion',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-11', name: 'Garlic Bread Loaf', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-13', name: 'Butter', quantity: 20, unit: 'Gram' }
    ]
  },
  {
    id: 'gb-2',
    name: 'Cheese Garlic Bread',
    category: 'Garlic Bread',
    sellingPrice: 69,
    costPrice: 30,
    unit: 'Portion',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-11', name: 'Garlic Bread Loaf', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-2', name: 'Mozzarella Cheese', quantity: 40, unit: 'Gram' }
    ]
  },
  {
    id: 'gb-3',
    name: 'Chilli Cheese Garlic Bread',
    category: 'Garlic Bread',
    sellingPrice: 79,
    costPrice: 35,
    unit: 'Portion',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-11', name: 'Garlic Bread Loaf', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-2', name: 'Mozzarella Cheese', quantity: 40, unit: 'Gram' }
    ]
  },

  // COLD COFFEE & SHAKES
  {
    id: 'shake-1',
    name: 'Classic Cold Coffee',
    category: 'Cold Coffee & Shakes',
    sellingPrice: 59,
    costPrice: 25,
    unit: 'Glass',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-7', name: 'Whole Milk', quantity: 200, unit: 'ml' },
      { ingredientId: 'inv-8', name: 'Coffee Powder', quantity: 10, unit: 'Gram' },
      { ingredientId: 'inv-9', name: 'Sugar', quantity: 20, unit: 'Gram' }
    ]
  },
  {
    id: 'shake-2',
    name: 'Belgian Chocolate Cold Coffee',
    category: 'Cold Coffee & Shakes',
    sellingPrice: 69,
    costPrice: 30,
    unit: 'Glass',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-7', name: 'Whole Milk', quantity: 200, unit: 'ml' },
      { ingredientId: 'inv-8', name: 'Coffee Powder', quantity: 10, unit: 'Gram' },
      { ingredientId: 'inv-9', name: 'Sugar', quantity: 20, unit: 'Gram' }
    ]
  },
  {
    id: 'shake-3',
    name: 'Double Chocolate Shake',
    category: 'Cold Coffee & Shakes',
    sellingPrice: 79,
    costPrice: 35,
    unit: 'Glass',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-7', name: 'Whole Milk', quantity: 250, unit: 'ml' },
      { ingredientId: 'inv-9', name: 'Sugar', quantity: 25, unit: 'Gram' }
    ]
  },
  {
    id: 'shake-4',
    name: 'Oreo Shake',
    category: 'Cold Coffee & Shakes',
    sellingPrice: 89,
    costPrice: 40,
    unit: 'Glass',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-7', name: 'Whole Milk', quantity: 250, unit: 'ml' }
    ]
  },
  {
    id: 'shake-5',
    name: 'Kitkat Shake',
    category: 'Cold Coffee & Shakes',
    sellingPrice: 99,
    costPrice: 45,
    unit: 'Glass',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-7', name: 'Whole Milk', quantity: 250, unit: 'ml' }
    ]
  },
  {
    id: 'shake-6',
    name: 'Brownie Shake',
    category: 'Cold Coffee & Shakes',
    sellingPrice: 99,
    costPrice: 45,
    unit: 'Glass',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-7', name: 'Whole Milk', quantity: 250, unit: 'ml' }
    ]
  },

  // WRAPS
  {
    id: 'wrap-1',
    name: 'Veggie Wrap',
    category: 'Wraps',
    sellingPrice: 59,
    costPrice: 25,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-6', name: 'Mayonnaise', quantity: 20, unit: 'Gram' }
    ]
  },
  {
    id: 'wrap-2',
    name: 'Falafel Wrap',
    category: 'Wraps',
    sellingPrice: 69,
    costPrice: 30,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-6', name: 'Mayonnaise', quantity: 20, unit: 'Gram' }
    ]
  },
  {
    id: 'wrap-3',
    name: 'Sechwan Paneer Wrap',
    category: 'Wraps',
    sellingPrice: 79,
    costPrice: 35,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-14', name: 'Paneer (Cottage Cheese)', quantity: 50, unit: 'Gram' },
      { ingredientId: 'inv-6', name: 'Mayonnaise', quantity: 20, unit: 'Gram' }
    ]
  },

  // MOCKTAILS
  { id: 'mocktail-1', name: 'Banta Masala Soda', category: 'Mocktails', sellingPrice: 39, costPrice: 15, unit: 'Glass', isAvailable: true, recipe: [] },
  { id: 'mocktail-2', name: 'Classic Mint', category: 'Mocktails', sellingPrice: 59, costPrice: 25, unit: 'Glass', isAvailable: true, recipe: [] },
  { id: 'mocktail-3', name: 'Peach Ice Tea', category: 'Mocktails', sellingPrice: 59, costPrice: 25, unit: 'Glass', isAvailable: true, recipe: [] },
  { id: 'mocktail-4', name: 'Water Melon Cooler', category: 'Mocktails', sellingPrice: 59, costPrice: 25, unit: 'Glass', isAvailable: true, recipe: [] },
  { id: 'mocktail-5', name: 'Strawberry Cooler', category: 'Mocktails', sellingPrice: 69, costPrice: 30, unit: 'Glass', isAvailable: true, recipe: [] },
  { id: 'mocktail-6', name: 'Mango Mint', category: 'Mocktails', sellingPrice: 69, costPrice: 30, unit: 'Glass', isAvailable: true, recipe: [] },
  { id: 'mocktail-7', name: 'Blue Lagoon', category: 'Mocktails', sellingPrice: 69, costPrice: 30, unit: 'Glass', isAvailable: true, recipe: [] },

  // MEAL COMBOS
  {
    id: 'combo-1',
    name: 'Combo 1 (Fries + Coke 200ml)',
    category: 'Meal Combos',
    sellingPrice: 49,
    costPrice: 20,
    unit: 'Combo',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-10', name: 'French Fries (Frozen)', quantity: 100, unit: 'Gram' }
    ]
  },
  {
    id: 'combo-2',
    name: 'Combo 2 (Fries + Cold Coffee)',
    category: 'Meal Combos',
    sellingPrice: 89,
    costPrice: 40,
    unit: 'Combo',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-10', name: 'French Fries (Frozen)', quantity: 100, unit: 'Gram' },
      { ingredientId: 'inv-7', name: 'Whole Milk', quantity: 200, unit: 'ml' },
      { ingredientId: 'inv-8', name: 'Coffee Powder', quantity: 10, unit: 'Gram' }
    ]
  },
  {
    id: 'combo-3',
    name: 'Combo 3 (Fries + Banta)',
    category: 'Meal Combos',
    sellingPrice: 69,
    costPrice: 30,
    unit: 'Combo',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-10', name: 'French Fries (Frozen)', quantity: 100, unit: 'Gram' }
    ]
  },

  // ADD ONS
  { id: 'addon-1', name: 'Dips', category: 'Add Ons', sellingPrice: 10, costPrice: 4, unit: 'Serving', isAvailable: true, recipe: [] },
  { id: 'addon-2', name: 'Extra Cheese', category: 'Add Ons', sellingPrice: 20, costPrice: 8, unit: 'Serving', isAvailable: true, recipe: [{ ingredientId: 'inv-2', name: 'Mozzarella Cheese', quantity: 30, unit: 'Gram' }] },
  { id: 'addon-3', name: 'Cheese Slice', category: 'Add Ons', sellingPrice: 20, costPrice: 8, unit: 'Piece', isAvailable: true, recipe: [{ ingredientId: 'inv-15', name: 'Cheese Slice', quantity: 1, unit: 'Piece' }] }
];

// ==============================================================
// 🍽️ HOTEL & FAMILY RESTAURANT STARTER CATALOG (Dine-in & Tandoor)
// Used for kc@gmail.com, Hotel / Dine-in Family Restaurant Profiles
// ==============================================================

export const RESTAURANT_HOTEL_INVENTORY_ITEMS = [
  { id: 'inv-h1', materialName: 'Fresh Malai Paneer', category: 'Dairy', currentStock: 12000, unit: 'Gram', reorderLevel: 2000, unitCost: 0.38, lastUpdated: getTodayDateString(0) },
  { id: 'inv-h2', materialName: 'Royal Basmati Rice', category: 'Grains & Flours', currentStock: 35000, unit: 'Gram', reorderLevel: 8000, unitCost: 0.11, lastUpdated: getTodayDateString(0) },
  { id: 'inv-h3', materialName: 'Chakki Fresh Atta (Wheat)', category: 'Grains & Flours', currentStock: 40000, unit: 'Gram', reorderLevel: 10000, unitCost: 0.04, lastUpdated: getTodayDateString(0) },
  { id: 'inv-h4', materialName: 'Refined Maida Flour', category: 'Grains & Flours', currentStock: 25000, unit: 'Gram', reorderLevel: 5000, unitCost: 0.04, lastUpdated: getTodayDateString(0) },
  { id: 'inv-h5', materialName: 'Amul Yellow Butter', category: 'Dairy', currentStock: 6000, unit: 'Gram', reorderLevel: 1500, unitCost: 0.54, lastUpdated: getTodayDateString(0) },
  { id: 'inv-h6', materialName: 'Fresh Cooking Cream', category: 'Dairy', currentStock: 5000, unit: 'ml', reorderLevel: 1000, unitCost: 0.22, lastUpdated: getTodayDateString(0) },
  { id: 'inv-h7', materialName: 'Desi Cow Ghee', category: 'Dairy', currentStock: 4000, unit: 'ml', reorderLevel: 800, unitCost: 0.65, lastUpdated: getTodayDateString(0) },
  { id: 'inv-h8', materialName: 'Refined Sunflower Oil', category: 'Oils & Fats', currentStock: 30000, unit: 'ml', reorderLevel: 5000, unitCost: 0.14, lastUpdated: getTodayDateString(0) },
  { id: 'inv-h9', materialName: 'Toor / Arhar Dal', category: 'Grains & Flours', currentStock: 15000, unit: 'Gram', reorderLevel: 3000, unitCost: 0.15, lastUpdated: getTodayDateString(0) },
  { id: 'inv-h10', materialName: 'Black Urad Dal (Makhani)', category: 'Grains & Flours', currentStock: 12000, unit: 'Gram', reorderLevel: 2500, unitCost: 0.14, lastUpdated: getTodayDateString(0) },
  { id: 'inv-h11', materialName: 'Fresh Red Onions', category: 'Vegetables', currentStock: 35000, unit: 'Gram', reorderLevel: 6000, unitCost: 0.035, lastUpdated: getTodayDateString(0) },
  { id: 'inv-h12', materialName: 'Fresh Ripe Tomatoes', category: 'Vegetables', currentStock: 30000, unit: 'Gram', reorderLevel: 5000, unitCost: 0.04, lastUpdated: getTodayDateString(0) },
  { id: 'inv-h13', materialName: 'Ginger Garlic Paste', category: 'Spices & Seasoning', currentStock: 6000, unit: 'Gram', reorderLevel: 1200, unitCost: 0.16, lastUpdated: getTodayDateString(0) },
  { id: 'inv-h14', materialName: 'Whole Cashews (Kaju)', category: 'Spices & Seasoning', currentStock: 4000, unit: 'Gram', reorderLevel: 800, unitCost: 0.85, lastUpdated: getTodayDateString(0) },
  { id: 'inv-h15', materialName: 'Fresh Thick Dahi / Curd', category: 'Dairy', currentStock: 10000, unit: 'Gram', reorderLevel: 2000, unitCost: 0.065, lastUpdated: getTodayDateString(0) },
  { id: 'inv-h16', materialName: 'Whole Garam Masala Blend', category: 'Spices & Seasoning', currentStock: 3000, unit: 'Gram', reorderLevel: 500, unitCost: 0.55, lastUpdated: getTodayDateString(0) },
  { id: 'inv-h17', materialName: 'Kasuri Methi & Herbs', category: 'Spices & Seasoning', currentStock: 1500, unit: 'Gram', reorderLevel: 300, unitCost: 0.35, lastUpdated: getTodayDateString(0) },
  { id: 'inv-h18', materialName: 'Urad Dal Papad (Bikaneri)', category: 'Accompaniments', currentStock: 200, unit: 'Piece', reorderLevel: 40, unitCost: 3.5, lastUpdated: getTodayDateString(0) },
  { id: 'inv-h19', materialName: 'Gulab Jamun (Canned/Fresh)', category: 'Desserts & Sweets', currentStock: 100, unit: 'Piece', reorderLevel: 25, unitCost: 12, lastUpdated: getTodayDateString(0) },
  { id: 'inv-h20', materialName: 'Crispy Boondi (Gram Flour)', category: 'Accompaniments', currentStock: 4000, unit: 'Gram', reorderLevel: 600, unitCost: 0.18, lastUpdated: getTodayDateString(0) },
  { id: 'inv-h21', materialName: 'Assorted Fresh Vegetables (Peas, Carrot, Capsicum)', category: 'Vegetables', currentStock: 20000, unit: 'Gram', reorderLevel: 4000, unitCost: 0.05, lastUpdated: getTodayDateString(0) },
  { id: 'inv-h22', materialName: 'Special Biryani Masala & Saffron', category: 'Spices & Seasoning', currentStock: 1200, unit: 'Gram', reorderLevel: 250, unitCost: 0.90, lastUpdated: getTodayDateString(0) }
];

export const RESTAURANT_HOTEL_MENU_ITEMS = [
  // SOUPS & STARTERS
  {
    id: 'rest-1',
    name: 'Cream of Tomato Soup',
    category: 'Soups & Starters',
    sellingPrice: 95,
    costPrice: 28,
    unit: 'Bowl',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h12', name: 'Fresh Ripe Tomatoes', quantity: 200, unit: 'Gram' },
      { ingredientId: 'inv-h6', name: 'Fresh Cooking Cream', quantity: 30, unit: 'ml' },
      { ingredientId: 'inv-h5', name: 'Amul Yellow Butter', quantity: 15, unit: 'Gram' }
    ]
  },
  {
    id: 'rest-2',
    name: 'Paneer Tikka Tandoori (6 Pcs)',
    category: 'Soups & Starters',
    sellingPrice: 220,
    costPrice: 85,
    unit: 'Plate',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h1', name: 'Fresh Malai Paneer', quantity: 180, unit: 'Gram' },
      { ingredientId: 'inv-h15', name: 'Fresh Thick Dahi / Curd', quantity: 50, unit: 'Gram' },
      { ingredientId: 'inv-h13', name: 'Ginger Garlic Paste', quantity: 20, unit: 'Gram' },
      { ingredientId: 'inv-h16', name: 'Whole Garam Masala Blend', quantity: 10, unit: 'Gram' },
      { ingredientId: 'inv-h5', name: 'Amul Yellow Butter', quantity: 15, unit: 'Gram' }
    ]
  },
  {
    id: 'rest-3',
    name: 'Veg Hara Bhara Kabab (6 Pcs)',
    category: 'Soups & Starters',
    sellingPrice: 160,
    costPrice: 45,
    unit: 'Plate',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h21', name: 'Assorted Fresh Vegetables (Peas, Carrot, Capsicum)', quantity: 150, unit: 'Gram' },
      { ingredientId: 'inv-h1', name: 'Fresh Malai Paneer', quantity: 30, unit: 'Gram' },
      { ingredientId: 'inv-h16', name: 'Whole Garam Masala Blend', quantity: 10, unit: 'Gram' },
      { ingredientId: 'inv-h8', name: 'Refined Sunflower Oil', quantity: 30, unit: 'ml' }
    ]
  },
  {
    id: 'rest-4',
    name: 'Crispy Corn Chilli Pepper',
    category: 'Soups & Starters',
    sellingPrice: 150,
    costPrice: 42,
    unit: 'Plate',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h21', name: 'Assorted Fresh Vegetables (Peas, Carrot, Capsicum)', quantity: 100, unit: 'Gram' },
      { ingredientId: 'inv-h4', name: 'Refined Maida Flour', quantity: 30, unit: 'Gram' },
      { ingredientId: 'inv-h8', name: 'Refined Sunflower Oil', quantity: 40, unit: 'ml' },
      { ingredientId: 'inv-h11', name: 'Fresh Red Onions', quantity: 40, unit: 'Gram' }
    ]
  },

  // MAIN COURSE (PANEER & VEG)
  {
    id: 'rest-5',
    name: 'Paneer Butter Masala (Special Handi)',
    category: 'Main Course (Paneer & Veg)',
    sellingPrice: 230,
    costPrice: 88,
    unit: 'Handi',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h1', name: 'Fresh Malai Paneer', quantity: 180, unit: 'Gram' },
      { ingredientId: 'inv-h5', name: 'Amul Yellow Butter', quantity: 30, unit: 'Gram' },
      { ingredientId: 'inv-h6', name: 'Fresh Cooking Cream', quantity: 30, unit: 'ml' },
      { ingredientId: 'inv-h12', name: 'Fresh Ripe Tomatoes', quantity: 150, unit: 'Gram' },
      { ingredientId: 'inv-h11', name: 'Fresh Red Onions', quantity: 80, unit: 'Gram' },
      { ingredientId: 'inv-h13', name: 'Ginger Garlic Paste', quantity: 15, unit: 'Gram' },
      { ingredientId: 'inv-h14', name: 'Whole Cashews (Kaju)', quantity: 15, unit: 'Gram' },
      { ingredientId: 'inv-h17', name: 'Kasuri Methi & Herbs', quantity: 5, unit: 'Gram' }
    ]
  },
  {
    id: 'rest-6',
    name: 'Kadhai Paneer',
    category: 'Main Course (Paneer & Veg)',
    sellingPrice: 220,
    costPrice: 80,
    unit: 'Handi',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h1', name: 'Fresh Malai Paneer', quantity: 180, unit: 'Gram' },
      { ingredientId: 'inv-h21', name: 'Assorted Fresh Vegetables (Peas, Carrot, Capsicum)', quantity: 60, unit: 'Gram' },
      { ingredientId: 'inv-h11', name: 'Fresh Red Onions', quantity: 90, unit: 'Gram' },
      { ingredientId: 'inv-h12', name: 'Fresh Ripe Tomatoes', quantity: 120, unit: 'Gram' },
      { ingredientId: 'inv-h8', name: 'Refined Sunflower Oil', quantity: 25, unit: 'ml' },
      { ingredientId: 'inv-h16', name: 'Whole Garam Masala Blend', quantity: 15, unit: 'Gram' }
    ]
  },
  {
    id: 'rest-7',
    name: 'Shahi Paneer (Royal Kaju Gravy)',
    category: 'Main Course (Paneer & Veg)',
    sellingPrice: 240,
    costPrice: 94,
    unit: 'Handi',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h1', name: 'Fresh Malai Paneer', quantity: 180, unit: 'Gram' },
      { ingredientId: 'inv-h14', name: 'Whole Cashews (Kaju)', quantity: 30, unit: 'Gram' },
      { ingredientId: 'inv-h6', name: 'Fresh Cooking Cream', quantity: 40, unit: 'ml' },
      { ingredientId: 'inv-h5', name: 'Amul Yellow Butter', quantity: 20, unit: 'Gram' },
      { ingredientId: 'inv-h12', name: 'Fresh Ripe Tomatoes', quantity: 100, unit: 'Gram' },
      { ingredientId: 'inv-h16', name: 'Whole Garam Masala Blend', quantity: 10, unit: 'Gram' }
    ]
  },
  {
    id: 'rest-8',
    name: 'Mix Veg Kolhapuri (Spicy Handi)',
    category: 'Main Course (Paneer & Veg)',
    sellingPrice: 180,
    costPrice: 55,
    unit: 'Handi',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h21', name: 'Assorted Fresh Vegetables (Peas, Carrot, Capsicum)', quantity: 200, unit: 'Gram' },
      { ingredientId: 'inv-h11', name: 'Fresh Red Onions', quantity: 80, unit: 'Gram' },
      { ingredientId: 'inv-h12', name: 'Fresh Ripe Tomatoes', quantity: 100, unit: 'Gram' },
      { ingredientId: 'inv-h8', name: 'Refined Sunflower Oil', quantity: 30, unit: 'ml' },
      { ingredientId: 'inv-h16', name: 'Whole Garam Masala Blend', quantity: 15, unit: 'Gram' }
    ]
  },
  {
    id: 'rest-9',
    name: 'Malai Kofta (Melt in Mouth)',
    category: 'Main Course (Paneer & Veg)',
    sellingPrice: 230,
    costPrice: 85,
    unit: 'Handi',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h1', name: 'Fresh Malai Paneer', quantity: 100, unit: 'Gram' },
      { ingredientId: 'inv-h14', name: 'Whole Cashews (Kaju)', quantity: 25, unit: 'Gram' },
      { ingredientId: 'inv-h6', name: 'Fresh Cooking Cream', quantity: 35, unit: 'ml' },
      { ingredientId: 'inv-h4', name: 'Refined Maida Flour', quantity: 30, unit: 'Gram' },
      { ingredientId: 'inv-h12', name: 'Fresh Ripe Tomatoes', quantity: 100, unit: 'Gram' },
      { ingredientId: 'inv-h8', name: 'Refined Sunflower Oil', quantity: 35, unit: 'ml' }
    ]
  },

  // DAL SPECIALTIES
  {
    id: 'rest-10',
    name: 'Dal Tadka (Desi Ghee Fry)',
    category: 'Dal Specialties',
    sellingPrice: 140,
    costPrice: 38,
    unit: 'Bowl',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h9', name: 'Toor / Arhar Dal', quantity: 100, unit: 'Gram' },
      { ingredientId: 'inv-h7', name: 'Desi Cow Ghee', quantity: 20, unit: 'ml' },
      { ingredientId: 'inv-h11', name: 'Fresh Red Onions', quantity: 40, unit: 'Gram' },
      { ingredientId: 'inv-h12', name: 'Fresh Ripe Tomatoes', quantity: 40, unit: 'Gram' },
      { ingredientId: 'inv-h13', name: 'Ginger Garlic Paste', quantity: 10, unit: 'Gram' }
    ]
  },
  {
    id: 'rest-11',
    name: 'Dal Makhani (Slow Handi Dum)',
    category: 'Dal Specialties',
    sellingPrice: 180,
    costPrice: 58,
    unit: 'Handi',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h10', name: 'Black Urad Dal (Makhani)', quantity: 100, unit: 'Gram' },
      { ingredientId: 'inv-h5', name: 'Amul Yellow Butter', quantity: 35, unit: 'Gram' },
      { ingredientId: 'inv-h6', name: 'Fresh Cooking Cream', quantity: 30, unit: 'ml' },
      { ingredientId: 'inv-h12', name: 'Fresh Ripe Tomatoes', quantity: 80, unit: 'Gram' },
      { ingredientId: 'inv-h13', name: 'Ginger Garlic Paste', quantity: 15, unit: 'Gram' }
    ]
  },

  // TANDOORI BREADS
  {
    id: 'rest-12',
    name: 'Tandoori Butter Roti',
    category: 'Tandoori Breads',
    sellingPrice: 20,
    costPrice: 6,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h3', name: 'Chakki Fresh Atta (Wheat)', quantity: 75, unit: 'Gram' },
      { ingredientId: 'inv-h5', name: 'Amul Yellow Butter', quantity: 8, unit: 'Gram' }
    ]
  },
  {
    id: 'rest-13',
    name: 'Plain Naan',
    category: 'Tandoori Breads',
    sellingPrice: 35,
    costPrice: 8,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h4', name: 'Refined Maida Flour', quantity: 100, unit: 'Gram' },
      { ingredientId: 'inv-h15', name: 'Fresh Thick Dahi / Curd', quantity: 20, unit: 'Gram' }
    ]
  },
  {
    id: 'rest-14',
    name: 'Butter Naan (Crisp & Fluffy)',
    category: 'Tandoori Breads',
    sellingPrice: 45,
    costPrice: 14,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h4', name: 'Refined Maida Flour', quantity: 100, unit: 'Gram' },
      { ingredientId: 'inv-h5', name: 'Amul Yellow Butter', quantity: 18, unit: 'Gram' },
      { ingredientId: 'inv-h15', name: 'Fresh Thick Dahi / Curd', quantity: 20, unit: 'Gram' }
    ]
  },
  {
    id: 'rest-15',
    name: 'Garlic Butter Naan',
    category: 'Tandoori Breads',
    sellingPrice: 60,
    costPrice: 18,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h4', name: 'Refined Maida Flour', quantity: 100, unit: 'Gram' },
      { ingredientId: 'inv-h5', name: 'Amul Yellow Butter', quantity: 20, unit: 'Gram' },
      { ingredientId: 'inv-h13', name: 'Ginger Garlic Paste', quantity: 15, unit: 'Gram' }
    ]
  },
  {
    id: 'rest-16',
    name: 'Lachha Paratha (Multi-Layered)',
    category: 'Tandoori Breads',
    sellingPrice: 50,
    costPrice: 15,
    unit: 'Piece',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h3', name: 'Chakki Fresh Atta (Wheat)', quantity: 100, unit: 'Gram' },
      { ingredientId: 'inv-h7', name: 'Desi Cow Ghee', quantity: 15, unit: 'ml' }
    ]
  },

  // RICE & BIRYANI
  {
    id: 'rest-17',
    name: 'Steamed Royal Basmati Rice',
    category: 'Rice & Biryani',
    sellingPrice: 100,
    costPrice: 25,
    unit: 'Plate',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h2', name: 'Royal Basmati Rice', quantity: 160, unit: 'Gram' }
    ]
  },
  {
    id: 'rest-18',
    name: 'Jeera Rice (Desi Ghee)',
    category: 'Rice & Biryani',
    sellingPrice: 130,
    costPrice: 35,
    unit: 'Plate',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h2', name: 'Royal Basmati Rice', quantity: 160, unit: 'Gram' },
      { ingredientId: 'inv-h7', name: 'Desi Cow Ghee', quantity: 15, unit: 'ml' }
    ]
  },
  {
    id: 'rest-19',
    name: 'Hyderabadi Veg Dum Biryani (with Raita)',
    category: 'Rice & Biryani',
    sellingPrice: 220,
    costPrice: 72,
    unit: 'Handi',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h2', name: 'Royal Basmati Rice', quantity: 180, unit: 'Gram' },
      { ingredientId: 'inv-h1', name: 'Fresh Malai Paneer', quantity: 50, unit: 'Gram' },
      { ingredientId: 'inv-h21', name: 'Assorted Fresh Vegetables (Peas, Carrot, Capsicum)', quantity: 80, unit: 'Gram' },
      { ingredientId: 'inv-h7', name: 'Desi Cow Ghee', quantity: 15, unit: 'ml' },
      { ingredientId: 'inv-h15', name: 'Fresh Thick Dahi / Curd', quantity: 60, unit: 'Gram' },
      { ingredientId: 'inv-h22', name: 'Special Biryani Masala & Saffron', quantity: 10, unit: 'Gram' }
    ]
  },

  // THALI & COMBOS
  {
    id: 'rest-20',
    name: 'Maharaja Special Family Thali',
    category: 'Thali & Combos',
    sellingPrice: 280,
    costPrice: 95,
    unit: 'Thali',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h1', name: 'Fresh Malai Paneer', quantity: 80, unit: 'Gram' },
      { ingredientId: 'inv-h9', name: 'Toor / Arhar Dal', quantity: 60, unit: 'Gram' },
      { ingredientId: 'inv-h21', name: 'Assorted Fresh Vegetables (Peas, Carrot, Capsicum)', quantity: 60, unit: 'Gram' },
      { ingredientId: 'inv-h3', name: 'Chakki Fresh Atta (Wheat)', quantity: 150, unit: 'Gram' },
      { ingredientId: 'inv-h2', name: 'Royal Basmati Rice', quantity: 80, unit: 'Gram' },
      { ingredientId: 'inv-h19', name: 'Gulab Jamun (Canned/Fresh)', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-h18', name: 'Urad Dal Papad (Bikaneri)', quantity: 1, unit: 'Piece' }
    ]
  },

  // ACCOMPANIMENTS & DESSERTS
  {
    id: 'rest-21',
    name: 'Boondi Raita',
    category: 'Accompaniments & Desserts',
    sellingPrice: 70,
    costPrice: 22,
    unit: 'Bowl',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h15', name: 'Fresh Thick Dahi / Curd', quantity: 150, unit: 'Gram' },
      { ingredientId: 'inv-h20', name: 'Crispy Boondi (Gram Flour)', quantity: 30, unit: 'Gram' }
    ]
  },
  {
    id: 'rest-22',
    name: 'Masala Roasted Papad (2 Pcs)',
    category: 'Accompaniments & Desserts',
    sellingPrice: 40,
    costPrice: 12,
    unit: 'Plate',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h18', name: 'Urad Dal Papad (Bikaneri)', quantity: 2, unit: 'Piece' },
      { ingredientId: 'inv-h11', name: 'Fresh Red Onions', quantity: 20, unit: 'Gram' },
      { ingredientId: 'inv-h12', name: 'Fresh Ripe Tomatoes', quantity: 20, unit: 'Gram' }
    ]
  },
  {
    id: 'rest-23',
    name: 'Hot Gulab Jamun with Rabdi (2 Pcs)',
    category: 'Accompaniments & Desserts',
    sellingPrice: 70,
    costPrice: 28,
    unit: 'Bowl',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h19', name: 'Gulab Jamun (Canned/Fresh)', quantity: 2, unit: 'Piece' },
      { ingredientId: 'inv-h6', name: 'Fresh Cooking Cream', quantity: 30, unit: 'ml' }
    ]
  },
  {
    id: 'rest-24',
    name: 'Special Amritsari Sweet Lassi (Kulhad)',
    category: 'Accompaniments & Desserts',
    sellingPrice: 60,
    costPrice: 22,
    unit: 'Kulhad',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h15', name: 'Fresh Thick Dahi / Curd', quantity: 200, unit: 'Gram' },
      { ingredientId: 'inv-h6', name: 'Fresh Cooking Cream', quantity: 20, unit: 'ml' }
    ]
  },
  {
    id: 'rest-25',
    name: 'Masala Chhach / Spiced Buttermilk',
    category: 'Accompaniments & Desserts',
    sellingPrice: 35,
    costPrice: 10,
    unit: 'Glass',
    isAvailable: true,
    recipe: [
      { ingredientId: 'inv-h15', name: 'Fresh Thick Dahi / Curd', quantity: 100, unit: 'Gram' },
      { ingredientId: 'inv-h16', name: 'Whole Garam Masala Blend', quantity: 5, unit: 'Gram' }
    ]
  }
];

export const RESTAURANT_HOTEL_PROCUREMENT_LOGS = [
  { id: 'proc-h1', materialName: 'Fresh Malai Paneer', category: 'Dairy', quantityReceived: 15000, unit: 'Gram', ratePerUnit: 0.38, totalCost: 5700, supplier: 'Shri Krishna Dairy Farm', date: getTodayDateString(0) },
  { id: 'proc-h2', materialName: 'Royal Basmati Rice', category: 'Grains & Flours', quantityReceived: 50000, unit: 'Gram', ratePerUnit: 0.105, totalCost: 5250, supplier: 'Anand Grain Traders', date: getTodayDateString(1) },
  { id: 'proc-h3', materialName: 'Chakki Fresh Atta (Wheat)', category: 'Grains & Flours', quantityReceived: 50000, unit: 'Gram', ratePerUnit: 0.038, totalCost: 1900, supplier: 'Local Flour Mill', date: getTodayDateString(1) },
  { id: 'proc-h4', materialName: 'Amul Yellow Butter', category: 'Dairy', quantityReceived: 5000, unit: 'Gram', ratePerUnit: 0.52, totalCost: 2600, supplier: 'Amul Wholesale Depot', date: getTodayDateString(2) },
  { id: 'proc-h5', materialName: 'Fresh Ripe Tomatoes', category: 'Vegetables', quantityReceived: 30000, unit: 'Gram', ratePerUnit: 0.035, totalCost: 1050, supplier: 'Kisan Sabzi Mandi', date: getTodayDateString(0) }
];

export const RESTAURANT_HOTEL_EXPENSES = [
  { id: 'exp-h1', title: 'Hotel Premises & Main Dining Hall Rent', category: 'Hotel Premises Rent', amount: 35000, date: getTodayDateString(5), paymentMode: 'Online', paidTo: 'Property Owner Agrawal Ji', notes: 'Monthly rent for hotel dining & kitchen premises' },
  { id: 'exp-h2', title: 'Commercial 3-Phase Power Bill', category: 'Electricity', amount: 8900, date: getTodayDateString(3), paymentMode: 'Online', paidTo: 'MPPKVVCL Power Board', notes: 'AC hall & kitchen refrigeration bill' },
  { id: 'exp-h3', title: 'Head Chef & Tandoor Master Salary', category: 'Kitchen Staff Salary', amount: 26000, date: getTodayDateString(2), paymentMode: 'Cash', paidTo: 'Chef Rajesh & Team', notes: 'Monthly kitchen staff salary advance' },
  { id: 'exp-h4', title: 'Commercial LPG Cylinders (19kg x 3)', category: 'Commercial Gas', amount: 5550, date: getTodayDateString(1), paymentMode: 'Cash', paidTo: 'Bharat Gas Agency', notes: '3 refilled cylinders for tandoor & bhattis' },
  { id: 'exp-h5', title: 'Table Linen & Uniform Dry Cleaning', category: 'Laundry & Hygiene', amount: 2400, date: getTodayDateString(4), paymentMode: 'Cash', paidTo: 'Deluxe Laundry', notes: 'Dine-in table covers and staff aprons' }
];

export const RESTAURANT_HOTEL_SALES_LOGS = [
  { id: 'sale-h1', itemId: 'rest-20', itemName: 'Maharaja Special Family Thali', category: 'Thali & Combos', quantitySold: 4, sellingPrice: 280, costPrice: 95, totalRevenue: 1120, totalCost: 380, paymentMethod: 'Online', tableNumber: '4', token: 'T-104', date: getTodayDateString(0) },
  { id: 'sale-h2', itemId: 'rest-5', itemName: 'Paneer Butter Masala (Special Handi)', category: 'Main Course (Paneer & Veg)', quantitySold: 2, sellingPrice: 230, costPrice: 88, totalRevenue: 460, totalCost: 176, paymentMethod: 'Cash', tableNumber: '7', token: 'T-107', date: getTodayDateString(0) },
  { id: 'sale-h3', itemId: 'rest-14', itemName: 'Butter Naan (Crisp & Fluffy)', category: 'Tandoori Breads', quantitySold: 6, sellingPrice: 45, costPrice: 14, totalRevenue: 270, totalCost: 84, paymentMethod: 'Cash', tableNumber: '7', token: 'T-107', date: getTodayDateString(0) },
  { id: 'sale-h4', itemId: 'rest-19', itemName: 'Hyderabadi Veg Dum Biryani (with Raita)', category: 'Rice & Biryani', quantitySold: 3, sellingPrice: 220, costPrice: 72, totalRevenue: 660, totalCost: 216, paymentMethod: 'Swiggy', platformOrderId: '#SWG-9021', discountAmount: 30, date: getTodayDateString(0) },
  { id: 'sale-h5', itemId: 'rest-2', itemName: 'Paneer Tikka Tandoori (6 Pcs)', category: 'Soups & Starters', quantitySold: 2, sellingPrice: 220, costPrice: 85, totalRevenue: 440, totalCost: 170, paymentMethod: 'Zomato', platformOrderId: '#ZOM-3829', discountAmount: 20, date: getTodayDateString(0) }
];

export const RESTAURANT_HOTEL_WASTAGE_LOGS = [
  { id: 'waste-h1', date: getTodayDateString(1), ingredientId: 'inv-h12', ingredientName: 'Fresh Ripe Tomatoes', quantity: 2000, unit: 'Gram', reason: 'Crushed in Mandi Transit', costValue: 70, loggedBy: 'Assistant Cook', remarks: 'Over-ripe and damaged transit tomatoes' },
  { id: 'waste-h2', date: getTodayDateString(2), ingredientId: 'inv-h15', ingredientName: 'Fresh Thick Dahi / Curd', quantity: 1000, unit: 'Gram', reason: 'Sour / Fermented', costValue: 65, loggedBy: 'Pantry Chef', remarks: 'Excessively sour curd unsuitable for lassi' }
];

export const INITIAL_SALES_LOGS = [
  { id: 'sale-1', itemId: 'burger-1', itemName: 'Aloo Tikki Burger', category: 'Burgers', quantitySold: 3, sellingPrice: 39, costPrice: 18, totalRevenue: 117, totalCost: 54, paymentMethod: 'Cash', date: getTodayDateString(0) },
  { id: 'sale-2', itemId: 'shake-1', itemName: 'Classic Cold Coffee', category: 'Cold Coffee & Shakes', quantitySold: 2, sellingPrice: 59, costPrice: 25, totalRevenue: 118, totalCost: 50, paymentMethod: 'Online', date: getTodayDateString(0) },
  { id: 'sale-3', itemId: 'pizza-1', itemName: 'Margarita Pizza', category: 'Pizza', quantitySold: 2, sellingPrice: 89, costPrice: 30, totalRevenue: 178, totalCost: 60, paymentMethod: 'Swiggy', platformOrderId: '#SWG-4912', discountAmount: 20, date: getTodayDateString(0) },
  { id: 'sale-4', itemId: 'burger-2', itemName: 'Crispy Veg Supreme Burger', category: 'Burgers', quantitySold: 2, sellingPrice: 69, costPrice: 22, totalRevenue: 138, totalCost: 44, paymentMethod: 'Zomato', platformOrderId: '#ZOM-7821', discountAmount: 15, date: getTodayDateString(0) }
];

export const INITIAL_AGGREGATOR_SETTLEMENTS = [];

export const INITIAL_PROCUREMENT_LOGS = [
  { id: 'proc-1', materialName: 'Pizza Base', category: 'Bakery', quantityReceived: 20, unit: 'Piece', ratePerUnit: 15, totalCost: 300, supplier: 'Local Baker', date: getTodayDateString(0) },
  { id: 'proc-2', materialName: 'Whole Milk', category: 'Dairy', quantityReceived: 10, unit: 'Liters', ratePerUnit: 60, totalCost: 600, supplier: 'Amul Dairy', date: getTodayDateString(0) }
];

// Multi-Tenant Scoped Storage Key Helpers
let currentCafeId = 'default';

export const setCurrentCafeId = (cafeId) => {
  currentCafeId = cafeId || 'default';
};

export const getCurrentCafeId = () => currentCafeId;

export const getScopedKey = (baseKey, cafeId = currentCafeId) => {
  if (!cafeId || cafeId === 'default') return baseKey;
  return `${baseKey}_${cafeId}`;
};

// Seed complete Hotel & Family Restaurant starter pack into scoped storage
export const seedHotelRestaurantData = (cafeId = currentCafeId) => {
  saveStoredMenu(RESTAURANT_HOTEL_MENU_ITEMS, cafeId);
  saveStoredInventory(RESTAURANT_HOTEL_INVENTORY_ITEMS, cafeId);
  saveStoredProcurement(RESTAURANT_HOTEL_PROCUREMENT_LOGS, cafeId);
  saveStoredExpenses(RESTAURANT_HOTEL_EXPENSES, cafeId);
  
  // NEVER overwrite user's actual punched sales when seeding hotel data!
  const existingSales = getStoredSales(cafeId);
  const isDefaultOrEmpty = !existingSales || existingSales.length === 0 || 
    (existingSales.length === 4 && existingSales[0]?.id === 'sale-1');
  if (isDefaultOrEmpty) {
    saveStoredSales(RESTAURANT_HOTEL_SALES_LOGS, cafeId);
  }
  
  saveStoredWastage(RESTAURANT_HOTEL_WASTAGE_LOGS, cafeId);
};

// Seed complete Fast Food Cafe starter pack into scoped storage
export const seedCafeData = (cafeId = currentCafeId) => {
  saveStoredMenu(INITIAL_MENU_ITEMS, cafeId);
  saveStoredInventory(INITIAL_INVENTORY_ITEMS, cafeId);
  saveStoredProcurement(INITIAL_PROCUREMENT_LOGS, cafeId);
  saveStoredExpenses(INITIAL_EXPENSES, cafeId);
  
  // NEVER overwrite user's actual punched sales when seeding cafe data!
  const existingSales = getStoredSales(cafeId);
  const isDefaultOrEmpty = !existingSales || existingSales.length === 0 || 
    (existingSales.length === 5 && existingSales[0]?.id === 'sale-h1');
  if (isDefaultOrEmpty) {
    saveStoredSales(INITIAL_SALES_LOGS, cafeId);
  }
  
  saveStoredWastage(INITIAL_WASTAGE_LOGS, cafeId);
};

// Check if tenant is hotel/restaurant type
export const isTenantHotelOrRestaurant = (cafeId = currentCafeId) => {
  if (!cafeId) return false;
  const str = cafeId.toString().toLowerCase();
  return str.includes('kc') || str.includes('hotel') || str.includes('restaurant');
};

// Helper functions with automatic migration & fallback
export const getStoredMenu = (cafeId = currentCafeId) => {
  try {
    const key = getScopedKey(MENU_STORAGE_KEY, cafeId);
    let data = localStorage.getItem(key);
    if (!data && cafeId !== 'default') {
      // Check if fallback to base key exists
      data = localStorage.getItem(MENU_STORAGE_KEY);
    }
    const defaultFallback = isTenantHotelOrRestaurant(cafeId) ? RESTAURANT_HOTEL_MENU_ITEMS : INITIAL_MENU_ITEMS;
    if (!data) return defaultFallback;
    const parsed = JSON.parse(data);
    // Ensure every item has a recipe array
    return parsed.map(item => ({
      ...item,
      recipe: item.recipe || []
    }));
  } catch (e) {
    return isTenantHotelOrRestaurant(cafeId) ? RESTAURANT_HOTEL_MENU_ITEMS : INITIAL_MENU_ITEMS;
  }
};

export const saveStoredMenu = (items, cafeId = currentCafeId) => {
  const key = getScopedKey(MENU_STORAGE_KEY, cafeId);
  localStorage.setItem(key, JSON.stringify(items));
  if (cafeId === 'default') {
    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(items));
  }
};

export const getStoredInventory = (cafeId = currentCafeId) => {
  try {
    const key = getScopedKey(INVENTORY_STORAGE_KEY, cafeId);
    let data = localStorage.getItem(key);
    if (!data && cafeId !== 'default') {
      data = localStorage.getItem(INVENTORY_STORAGE_KEY);
    }
    const defaultFallback = isTenantHotelOrRestaurant(cafeId) ? RESTAURANT_HOTEL_INVENTORY_ITEMS : INITIAL_INVENTORY_ITEMS;
    return data ? JSON.parse(data) : defaultFallback;
  } catch (e) {
    return isTenantHotelOrRestaurant(cafeId) ? RESTAURANT_HOTEL_INVENTORY_ITEMS : INITIAL_INVENTORY_ITEMS;
  }
};

export const saveStoredInventory = (inventory, cafeId = currentCafeId) => {
  const key = getScopedKey(INVENTORY_STORAGE_KEY, cafeId);
  localStorage.setItem(key, JSON.stringify(inventory));
  if (cafeId === 'default') {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
  }
};

export const getStoredSales = (cafeId = currentCafeId) => {
  try {
    const key = getScopedKey(SALES_STORAGE_KEY, cafeId);
    let data = localStorage.getItem(key);
    if (!data && cafeId !== 'default') {
      data = localStorage.getItem(SALES_STORAGE_KEY);
    }
    // Deep fallback: If still no data found, search all localStorage keys starting with SALES_STORAGE_KEY
    if (!data) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(SALES_STORAGE_KEY)) {
            const candidate = localStorage.getItem(k);
            if (candidate && candidate !== '[]' && candidate.length > 2) {
              data = candidate;
              break;
            }
          }
        }
      } catch (err) {}
    }
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
    const defaultFallback = isTenantHotelOrRestaurant(cafeId) ? RESTAURANT_HOTEL_SALES_LOGS : INITIAL_SALES_LOGS;
    return defaultFallback;
  } catch (e) {
    return isTenantHotelOrRestaurant(cafeId) ? RESTAURANT_HOTEL_SALES_LOGS : INITIAL_SALES_LOGS;
  }
};

export const saveStoredSales = (sales, cafeId = currentCafeId) => {
  if (!Array.isArray(sales)) return;
  try {
    const key = getScopedKey(SALES_STORAGE_KEY, cafeId);
    const jsonStr = JSON.stringify(sales);
    localStorage.setItem(key, jsonStr);
    // Always mirror to base SALES_STORAGE_KEY so refresh without active tenant NEVER loses punched orders!
    localStorage.setItem(SALES_STORAGE_KEY, jsonStr);
  } catch (e) {
    console.error('Error saving sales logs to localStorage:', e);
  }
};

export const getStoredProcurement = (cafeId = currentCafeId) => {
  try {
    const key = getScopedKey(PROCUREMENT_STORAGE_KEY, cafeId);
    let data = localStorage.getItem(key);
    if (!data && cafeId !== 'default') {
      data = localStorage.getItem(PROCUREMENT_STORAGE_KEY);
    }
    const defaultFallback = isTenantHotelOrRestaurant(cafeId) ? RESTAURANT_HOTEL_PROCUREMENT_LOGS : INITIAL_PROCUREMENT_LOGS;
    return data ? JSON.parse(data) : defaultFallback;
  } catch (e) {
    return isTenantHotelOrRestaurant(cafeId) ? RESTAURANT_HOTEL_PROCUREMENT_LOGS : INITIAL_PROCUREMENT_LOGS;
  }
};

export const saveStoredProcurement = (proc, cafeId = currentCafeId) => {
  const key = getScopedKey(PROCUREMENT_STORAGE_KEY, cafeId);
  localStorage.setItem(key, JSON.stringify(proc));
  if (cafeId === 'default') {
    localStorage.setItem(PROCUREMENT_STORAGE_KEY, JSON.stringify(proc));
  }
};

// Initial Cafe Operational Expenses Presets
export const INITIAL_EXPENSES = [
  { id: 'exp-1', title: 'Monthly Shop Rent', category: 'Cafe Rent', amount: 15000, date: getTodayDateString(5), paymentMode: 'Online', paidTo: 'Landlord Sharma Ji', notes: 'Monthly rent for cafe shop premises' },
  { id: 'exp-2', title: 'Electricity / Light Bill', category: 'Electricity', amount: 4200, date: getTodayDateString(3), paymentMode: 'Online', paidTo: 'State Electricity Board', notes: 'Monthly power and AC consumption bill' },
  { id: 'exp-3', title: 'Cook & Helper Salary', category: 'Staff Salary', amount: 12000, date: getTodayDateString(2), paymentMode: 'Cash', paidTo: 'Ramesh Chef', notes: 'Monthly staff advance and salary' },
  { id: 'exp-4', title: 'Commercial LPG Cylinder', category: 'Commercial Gas', amount: 1850, date: getTodayDateString(1), paymentMode: 'Cash', paidTo: 'Indane Gas Agency', notes: '19kg commercial cylinder refilled' },
  { id: 'exp-5', title: 'Cafe High-Speed Wi-Fi', category: 'Wi-Fi & Internet', amount: 799, date: getTodayDateString(8), paymentMode: 'Online', paidTo: 'Airtel Broadband', notes: 'Fiber internet connection for POS and guests' }
];

// Initial Raw Material Wastage Presets
export const INITIAL_WASTAGE_LOGS = [
  { id: 'waste-1', date: getTodayDateString(2), ingredientId: 'inv-1', ingredientName: 'Pizza Base', quantity: 3, unit: 'Piece', reason: 'Expired', costValue: 45, loggedBy: 'Head Chef', remarks: 'Packet date expired, dried out' },
  { id: 'waste-2', date: getTodayDateString(1), ingredientId: 'inv-7', ingredientName: 'Whole Milk', quantity: 1000, unit: 'ml', reason: 'Curdled / Sour', costValue: 60, loggedBy: 'Barista', remarks: 'Milk turned sour due to heat' }
];

export const getStoredExpenses = (cafeId = currentCafeId) => {
  try {
    const key = getScopedKey(EXPENSES_STORAGE_KEY, cafeId);
    let data = localStorage.getItem(key);
    if (!data && cafeId !== 'default') {
      data = localStorage.getItem(EXPENSES_STORAGE_KEY);
    }
    const defaultFallback = isTenantHotelOrRestaurant(cafeId) ? RESTAURANT_HOTEL_EXPENSES : INITIAL_EXPENSES;
    return data ? JSON.parse(data) : defaultFallback;
  } catch (e) {
    return isTenantHotelOrRestaurant(cafeId) ? RESTAURANT_HOTEL_EXPENSES : INITIAL_EXPENSES;
  }
};

export const saveStoredExpenses = (expenses, cafeId = currentCafeId) => {
  const key = getScopedKey(EXPENSES_STORAGE_KEY, cafeId);
  localStorage.setItem(key, JSON.stringify(expenses));
  if (cafeId === 'default') {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  }
};

export const getStoredWastage = (cafeId = currentCafeId) => {
  try {
    const key = getScopedKey(WASTAGE_STORAGE_KEY, cafeId);
    let data = localStorage.getItem(key);
    if (!data && cafeId !== 'default') {
      data = localStorage.getItem(WASTAGE_STORAGE_KEY);
    }
    const defaultFallback = isTenantHotelOrRestaurant(cafeId) ? RESTAURANT_HOTEL_WASTAGE_LOGS : INITIAL_WASTAGE_LOGS;
    return data ? JSON.parse(data) : defaultFallback;
  } catch (e) {
    return isTenantHotelOrRestaurant(cafeId) ? RESTAURANT_HOTEL_WASTAGE_LOGS : INITIAL_WASTAGE_LOGS;
  }
};

export const saveStoredWastage = (wastage, cafeId = currentCafeId) => {
  const key = getScopedKey(WASTAGE_STORAGE_KEY, cafeId);
  localStorage.setItem(key, JSON.stringify(wastage));
  if (cafeId === 'default') {
    localStorage.setItem(WASTAGE_STORAGE_KEY, JSON.stringify(wastage));
  }
};

export const getStoredDiningOrders = (cafeId = currentCafeId) => {
  try {
    const key = getScopedKey(DINING_ORDERS_STORAGE_KEY, cafeId);
    let data = localStorage.getItem(key);
    if (!data && cafeId !== 'default') {
      data = localStorage.getItem(DINING_ORDERS_STORAGE_KEY);
    }
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveStoredDiningOrders = (orders, cafeId = currentCafeId) => {
  try {
    const key = getScopedKey(DINING_ORDERS_STORAGE_KEY, cafeId);
    localStorage.setItem(key, JSON.stringify(orders));
    if (cafeId === 'default') {
      localStorage.setItem(DINING_ORDERS_STORAGE_KEY, JSON.stringify(orders));
    }
  } catch (e) {
    console.error('Error saving dining orders to localStorage:', e);
  }
};

export const getStoredSettlements = (cafeId = currentCafeId) => {
  try {
    const key = getScopedKey(AGGREGATOR_SETTLEMENTS_STORAGE_KEY, cafeId);
    let data = localStorage.getItem(key);
    if (!data && cafeId !== 'default') {
      data = localStorage.getItem(AGGREGATOR_SETTLEMENTS_STORAGE_KEY);
    }
    if (!data) return INITIAL_AGGREGATOR_SETTLEMENTS;
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return INITIAL_AGGREGATOR_SETTLEMENTS;
    // Auto-remove dummy settlement seeded in earlier version so real sales are never suppressed
    const cleaned = parsed.filter(s => s && s.id !== 'settle-swiggy-1');
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(key, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    return INITIAL_AGGREGATOR_SETTLEMENTS;
  }
};

export const saveStoredSettlements = (settlements, cafeId = currentCafeId) => {
  try {
    const key = getScopedKey(AGGREGATOR_SETTLEMENTS_STORAGE_KEY, cafeId);
    localStorage.setItem(key, JSON.stringify(settlements));
    if (cafeId === 'default') {
      localStorage.setItem(AGGREGATOR_SETTLEMENTS_STORAGE_KEY, JSON.stringify(settlements));
    }
  } catch (e) {
    console.error('Error saving settlements to localStorage:', e);
  }
};

// Initial Khata (Customer Credit Ledger) Presets
export const INITIAL_KHATA_LEDGER = [
  {
    id: 'khata-tx-1',
    type: 'debit',
    customerName: 'Rahul Verma (Hostel)',
    customerPhone: '9826012345',
    amount: 198,
    orderToken: '#C-102',
    itemsSummary: '2x Classic Veg Burger, 1x Cold Coffee',
    date: getTodayDateString(2),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    notes: 'Room 204, regular hostel student',
    isSettled: false
  },
  {
    id: 'khata-tx-2',
    type: 'debit',
    customerName: 'Sharma Ji (Medical Store)',
    customerPhone: '9893098765',
    amount: 340,
    orderToken: '#C-115',
    itemsSummary: '4x Cold Coffee, 2x Cheese Sandwich',
    date: getTodayDateString(1),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    notes: 'Next door medical store neighbor',
    isSettled: false
  },
  {
    id: 'khata-tx-3',
    type: 'credit',
    customerName: 'Sharma Ji (Medical Store)',
    customerPhone: '9893098765',
    amount: 100,
    orderToken: 'VASOOLI',
    itemsSummary: 'Partial Cash Payment',
    date: getTodayDateString(0),
    paymentMode: 'Cash',
    createdAt: new Date().toISOString(),
    notes: 'Sharma ji paid ₹100 cash in morning',
    isSettled: true
  }
];

export const getStoredKhata = (cafeId = currentCafeId) => {
  try {
    const key = getScopedKey(KHATA_STORAGE_KEY, cafeId);
    let data = localStorage.getItem(key);
    if (!data && cafeId !== 'default') {
      data = localStorage.getItem(KHATA_STORAGE_KEY);
    }
    return data ? JSON.parse(data) : INITIAL_KHATA_LEDGER;
  } catch (e) {
    return INITIAL_KHATA_LEDGER;
  }
};

export const saveStoredKhata = (khataList, cafeId = currentCafeId) => {
  try {
    const key = getScopedKey(KHATA_STORAGE_KEY, cafeId);
    localStorage.setItem(key, JSON.stringify(khataList));
    if (cafeId === 'default') {
      localStorage.setItem(KHATA_STORAGE_KEY, JSON.stringify(khataList));
    }
  } catch (e) {
    console.error('Error saving khata ledger:', e);
  }
};

// Initial Day Closings Presets
export const INITIAL_DAY_CLOSINGS = [
  {
    id: 'close-demo-1',
    date: getTodayDateString(1),
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    closedBy: 'Owner',
    openingFloat: 1000,
    cashSales: 3850,
    cashExpenses: 450,
    cashProcurement: 300,
    expectedCash: 4100,
    actualCash: 4100,
    difference: 0,
    status: 'matched',
    totalDaySales: 7420,
    salesBreakdown: {
      cash: 3850,
      upi: 2200,
      swiggy: 780,
      zomato: 590
    },
    orderCount: 28,
    notes: 'Shift completed. Cash matched with drawer.'
  }
];

export const getStoredDayClosings = (cafeId = currentCafeId) => {
  try {
    const key = getScopedKey(DAY_CLOSING_STORAGE_KEY, cafeId);
    let data = localStorage.getItem(key);
    if (!data && cafeId !== 'default') {
      data = localStorage.getItem(DAY_CLOSING_STORAGE_KEY);
    }
    return data ? JSON.parse(data) : INITIAL_DAY_CLOSINGS;
  } catch (e) {
    return INITIAL_DAY_CLOSINGS;
  }
};

export const saveStoredDayClosings = (closings, cafeId = currentCafeId) => {
  try {
    const key = getScopedKey(DAY_CLOSING_STORAGE_KEY, cafeId);
    localStorage.setItem(key, JSON.stringify(closings));
    if (cafeId === 'default') {
      localStorage.setItem(DAY_CLOSING_STORAGE_KEY, JSON.stringify(closings));
    }
  } catch (e) {
    console.error('Error saving day closings:', e);
  }
};

export const getStoredOwnerPin = (cafeId = currentCafeId) => {
  try {
    const key = getScopedKey(OWNER_PIN_STORAGE_KEY, cafeId);
    const pin = localStorage.getItem(key);
    return pin || '1234';
  } catch (e) {
    return '1234';
  }
};

export const saveStoredOwnerPin = (newPin, cafeId = currentCafeId) => {
  try {
    const key = getScopedKey(OWNER_PIN_STORAGE_KEY, cafeId);
    localStorage.setItem(key, newPin);
    if (cafeId === 'default') {
      localStorage.setItem(OWNER_PIN_STORAGE_KEY, newPin);
    }
  } catch (e) {
    console.error('Error saving owner pin:', e);
  }
};


// Calculate real-time aggregator balances (Gross sales, settled amount, pending payout, commission deducted)
export const calculateAggregatorLedger = (salesLogs = [], settlements = []) => {
  const platforms = ['Swiggy', 'Zomato'];
  const summary = {};

  platforms.forEach(plat => {
    const targetPlat = plat.toLowerCase();
    // Total gross sales logged for this platform using robust classifier
    const platSales = salesLogs.filter(s => classifySalePaymentMethod(s) === targetPlat);
    const totalMenuValue = platSales.reduce((sum, s) => sum + ((Number(s.sellingPrice) || 0) * (Number(s.quantitySold) || 1)), 0);
    const totalGross = platSales.reduce((sum, s) => sum + (Number(s.totalRevenue) || 0), 0);
    const totalOrdersCount = getUniqueOrderCount(platSales);
    const totalUnitsSold = platSales.reduce((sum, s) => sum + (Number(s.quantitySold) || 0), 0);
    const totalDiscountGiven = platSales.reduce((sum, s) => {
      const recorded = Number(s.discountAmount) || 0;
      const computed = Math.max(0, ((Number(s.sellingPrice) || 0) * (Number(s.quantitySold) || 1)) - (Number(s.totalRevenue) || 0));
      return sum + (recorded > 0 ? recorded : computed);
    }, 0);

    // Settlements for this platform
    const platSettlements = settlements.filter(set => (set.platform || '').toLowerCase() === targetPlat);
    const totalSettledGross = platSettlements.reduce((sum, set) => sum + (Number(set.grossAmount) || 0), 0);
    const totalBankReceived = platSettlements.reduce((sum, set) => sum + (Number(set.bankAmountReceived) || 0), 0);
    const totalCommissionDeducted = platSettlements.reduce((sum, set) => sum + (Number(set.commissionDeducted) || 0), 0);

    // Pending Unsettled Amount (Gross not yet settled)
    const pendingUnsettled = Math.max(0, totalGross - totalSettledGross);

    summary[plat] = {
      platform: plat,
      totalMenuValue,
      totalGross,
      totalOrdersCount,
      totalUnitsSold,
      totalDiscountGiven,
      totalSettledGross,
      totalBankReceived,
      totalCommissionDeducted,
      pendingUnsettled,
      settlementsCount: platSettlements.length
    };
  });

  const overallPending = summary.Swiggy.pendingUnsettled + summary.Zomato.pendingUnsettled;
  const overallGross = summary.Swiggy.totalGross + summary.Zomato.totalGross;
  const overallBankReceived = summary.Swiggy.totalBankReceived + summary.Zomato.totalBankReceived;
  const overallCommission = summary.Swiggy.totalCommissionDeducted + summary.Zomato.totalCommissionDeducted;

  return {
    ...summary,
    overall: {
      pendingUnsettled: overallPending,
      totalGross: overallGross,
      totalBankReceived: overallBankReceived,
      totalCommission: overallCommission
    }
  };
};


// Known Material Aliases for smart typo handling and natural naming
export const KNOWN_MATERIAL_ALIASES = {
  // Cafe Fast Food
  'mozzarella cheese': ['mozzerella', 'mozerella', 'mozarella', 'mozzarella', 'cheese', 'mozzarella cheese', 'mozarela', 'mozz', 'chiz'],
  'pizza sauce': ['sauce', 'souce', 'pizza sauce', 'pizza souce', 'red sauce', 'tomato sauce', 'pasta sauce', 'sauuce'],
  'pizza base': ['pizza base', 'piza base', 'base', 'pizza crust', 'crust', 'pizaa base'],
  'burger buns': ['burger bun', 'burger buns', 'bun', 'buns', 'burger pao', 'pao', 'burger base', 'ban'],
  'veg aloo patty': ['veg aloo patty', 'aloo patty', 'patty', 'patti', 'aloo patti', 'aloo tikki', 'tikki', 'veg patty', 'pati'],
  'mayonnaise': ['mayonnaise', 'mayo', 'mayonese', 'mayonise', 'white sauce', 'mayonisse'],
  'whole milk': ['milk', 'whole milk', 'doodh', 'amul milk', 'full cream milk'],
  'coffee powder': ['coffee', 'coffee powder', 'nescafe', 'bru'],
  'sugar': ['sugar', 'cheeni', 'chini', 'shakar'],
  'french fries (frozen)': ['french fries', 'fries', 'frozen fries', 'potato fries', 'french fry'],
  'garlic bread loaf': ['garlic bread', 'garlic bread loaf', 'garlic loaf'],
  'sandwich bread': ['sandwich bread', 'bread', 'bread slice', 'white bread', 'brown bread'],
  'butter': ['butter', 'makhan', 'amul butter'],
  'paneer (cottage cheese)': ['paneer', 'panir', 'cottage cheese'],
  'cheese slice': ['cheese slice', 'slice cheese', 'cheddar slice'],

  // Hotel & Family Restaurant Materials
  'fresh malai paneer': ['paneer', 'panir', 'malai paneer', 'fresh paneer', 'cottage cheese', 'paner'],
  'royal basmati rice': ['rice', 'chawal', 'basmati', 'basmati rice', 'biryani rice', 'daawat rice', 'chawal basmati'],
  'chakki fresh atta (wheat)': ['atta', 'aata', 'wheat atta', 'gehu atta', 'flour', 'chakki atta'],
  'refined maida flour': ['maida', 'all purpose flour', 'refined flour', 'meda'],
  'amul yellow butter': ['butter', 'makhan', 'amul butter', 'yellow butter', 'makkan'],
  'fresh cooking cream': ['cream', 'fresh cream', 'cooking cream', 'amul cream', 'malai'],
  'desi cow ghee': ['ghee', 'desi ghee', 'cow ghee', 'pure ghee', 'ghi'],
  'refined sunflower oil': ['oil', 'cooking oil', 'tel', 'sunflower oil', 'refined oil', 'soyabean oil', 'tel oil'],
  'toor / arhar dal': ['toor dal', 'arhar dal', 'dal toor', 'peeli dal', 'tuvar dal', 'arhar', 'toor'],
  'black urad dal (makhani)': ['urad dal', 'makhani dal', 'kaali dal', 'black dal', 'sabut urad', 'urad sabut'],
  'fresh red onions': ['onion', 'pyaz', 'kanda', 'onions', 'red onion', 'pyaaz', 'pyaj'],
  'fresh ripe tomatoes': ['tomato', 'tamatar', 'tomatoes', 'tamatr'],
  'ginger garlic paste': ['adrak lasan', 'ginger garlic', 'adrak lehsun', 'gg paste', 'adrak lasan paste', 'ginger paste', 'garlic paste'],
  'whole cashews (kaju)': ['kaju', 'cashew', 'cashews', 'kaju tukda', 'kaju whole'],
  'fresh thick dahi / curd': ['dahi', 'curd', 'yogurt', 'fresh curd', 'daahi'],
  'whole garam masala blend': ['garam masala', 'masala', 'sabut masala', 'khada masala', 'kitchen king'],
  'kasuri methi & herbs': ['kasuri methi', 'kasoori methi', 'methi', 'dry methi'],
  'urad dal papad (bikaneri)': ['papad', 'papadd', 'roasted papad', 'fry papad', 'bikaneri papad'],
  'gulab jamun (canned/fresh)': ['gulab jamun', 'gulabjamun', 'jamun', 'gulab jamoon'],
  'crispy boondi (gram flour)': ['boondi', 'bundi', 'raita boondi', 'namkeen boondi'],
  'assorted fresh vegetables (peas, carrot, capsicum)': ['vegetables', 'mix veg', 'green peas', 'matar', 'gajar', 'beans', 'capsicum', 'shimla mirch', 'sabzi'],
  'special biryani masala & saffron': ['biryani masala', 'dum masala', 'kesar', 'saffron', 'biriyani masala']
};

// Unit conversion helper (handles Kg <-> Gram, Liters <-> ml)
export const convertQuantity = (qty, fromUnit, toUnit) => {
  const q = Number(qty) || 0;
  if (!fromUnit || !toUnit) return q;
  const from = fromUnit.trim().toLowerCase();
  const to = toUnit.trim().toLowerCase();
  if (from === to) return q;

  // Weight: Kg <-> Gram
  if ((from === 'kg' || from === 'kilogram' || from === 'kgs') && (to === 'gram' || to === 'gm' || to === 'g' || to === 'grams')) {
    return q * 1000;
  }
  if ((from === 'gram' || from === 'gm' || from === 'g' || from === 'grams') && (to === 'kg' || to === 'kilogram' || to === 'kgs')) {
    return q / 1000;
  }

  // Volume: Liter <-> ml
  if ((from === 'liters' || from === 'liter' || from === 'l') && (to === 'ml' || to === 'milliliter' || to === 'milliliters')) {
    return q * 1000;
  }
  if ((from === 'ml' || from === 'milliliter' || from === 'milliliters') && (to === 'liters' || to === 'liter' || to === 'l')) {
    return q / 1000;
  }

  return q;
};

// Levenshtein distance for fuzzy typo matching
export const levenshteinDistance = (a, b) => {
  const s1 = (a || '').toLowerCase().trim();
  const s2 = (b || '').toLowerCase().trim();
  const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  return track[s2.length][s1.length];
};

// Match user typed query to existing inventory or recipe raw materials
export const findMatchingInventoryItem = (query, inventoryList = []) => {
  if (!query || !inventoryList || inventoryList.length === 0) return null;
  const q = query.trim().toLowerCase();

  // 1. Direct ID match
  const byId = inventoryList.find(i => i.id === query);
  if (byId) return byId;

  // 2. Exact name match (case-insensitive)
  const exact = inventoryList.find(i => (i.materialName || '').trim().toLowerCase() === q);
  if (exact) return exact;

  // 3. Substring inclusion match (e.g. "mozzarella" in "Mozzarella Cheese")
  const subMatch = inventoryList.find(i => {
    const m = (i.materialName || '').trim().toLowerCase();
    if (m === q) return true;
    if (m.includes(q)) return true; // Shorter query in longer material name
    if (q.includes(m)) {
      // Allow minor generic affixes like "packet", "fresh", "pack", or plural 's'
      const remainder = q.replace(m, '').trim();
      const genericAffixes = ['packet', 'packets', 'pack', 'packs', 'box', 'boxes', 'fresh', 'raw', 'piece', 'pieces', 's', 'es'];
      return !remainder || genericAffixes.includes(remainder) || remainder.length <= 2;
    }
    return false;
  });
  if (subMatch) return subMatch;

  // 4. Known aliases match (e.g. "mozzerella" -> "mozzarella cheese", "souce" -> "pizza sauce")
  for (const [canonical, aliases] of Object.entries(KNOWN_MATERIAL_ALIASES)) {
    const isQueryAlias = aliases.some(a => q === a || q.includes(a) || a.includes(q));
    if (isQueryAlias) {
      const candidate = inventoryList.find(i => {
        const im = (i.materialName || '').toLowerCase();
        return im === canonical || im.includes(canonical) || canonical.includes(im) || aliases.some(a => im.includes(a));
      });
      if (candidate) return candidate;
    }
  }

  // 5. Fuzzy typo match using Levenshtein distance
  let bestItem = null;
  let minDistance = Infinity;

  for (const inv of inventoryList) {
    const name = (inv.materialName || '').toLowerCase();
    const dist = levenshteinDistance(q, name);
    if (dist <= 2 && dist < minDistance) {
      minDistance = dist;
      bestItem = inv;
    }

    const words = name.split(/\s+/);
    for (const w of words) {
      const wordDist = levenshteinDistance(q, w);
      if (wordDist <= 2 && wordDist < minDistance) {
        minDistance = wordDist;
        bestItem = inv;
      }
    }
  }

  return bestItem;
};

// Real-time stock calculator based on recipe & raw materials inventory (with unit conversion & smart matching)
export const checkItemStock = (item, inventoryItems = []) => {
  if (!item || item.isAvailable === false) {
    return {
      isOutOfStock: true,
      maxPortions: 0,
      reason: 'Disabled',
      missing: []
    };
  }

  // 1. If item has recipe defined
  if (Array.isArray(item.recipe) && item.recipe.length > 0) {
    let minPortions = Infinity;
    const missing = [];

    for (const r of item.recipe) {
      // Find matching inventory item using our smart alias/fuzzy matcher
      const invItem = findMatchingInventoryItem(r.ingredientId, inventoryItems) ||
                      findMatchingInventoryItem(r.name, inventoryItems);

      let available = 0;
      if (invItem) {
        const rawStock = Number(invItem.currentStock) || 0;
        // Convert raw material unit to recipe unit (e.g. Kg to Gram, Liters to ml)
        available = convertQuantity(rawStock, invItem.unit, r.unit);
      }
      const needed = Number(r.quantity) || 1;

      if (available < needed) {
        missing.push({
          name: r.name || (invItem ? invItem.materialName : 'Raw material'),
          available: Math.round(available * 100) / 100,
          needed,
          unit: r.unit || (invItem ? invItem.unit : 'Unit')
        });
      }

      const possible = needed > 0 ? Math.floor(available / needed) : 0;
      if (possible < minPortions) {
        minPortions = possible;
      }
    }

    const maxPortions = minPortions === Infinity ? 0 : Math.max(0, minPortions);
    return {
      isOutOfStock: maxPortions <= 0,
      maxPortions,
      missing,
      hasRecipe: true
    };
  }

  // 2. If item has NO recipe defined:
  // Check if there is an exact/similar inventory item with the same name (e.g. direct stock item)
  const directInv = findMatchingInventoryItem(item.name, inventoryItems);

  if (directInv) {
    const available = Number(directInv.currentStock) || 0;
    const maxPortions = Math.max(0, Math.floor(available));
    return {
      isOutOfStock: maxPortions <= 0,
      maxPortions,
      missing: maxPortions <= 0 ? [{ name: directInv.materialName, available, needed: 1, unit: directInv.unit }] : [],
      hasRecipe: false
    };
  }

  // 3. If neither recipe nor inventory item exists: 0 stock!
  return {
    isOutOfStock: true,
    maxPortions: 0,
    missing: [{ name: 'Recipe ya Raw Material inventory me nahi hai', available: 0, needed: 1, unit: 'Unit' }],
    hasRecipe: false,
    noRecipeWarning: true
  };
};

// Smart auto-recipe detector for standard cafe & restaurant items
export const findSuggestedRecipeForItem = (itemName) => {
  if (!itemName) return [];
  const lower = itemName.toLowerCase().trim();

  // 1. Direct match with INITIAL_MENU_ITEMS
  const matchInitial = INITIAL_MENU_ITEMS.find(
    m => m.name.toLowerCase() === lower || lower.includes(m.name.toLowerCase())
  );
  if (matchInitial && Array.isArray(matchInitial.recipe) && matchInitial.recipe.length > 0) {
    return JSON.parse(JSON.stringify(matchInitial.recipe));
  }

  // 2. Direct match with RESTAURANT_HOTEL_MENU_ITEMS
  const matchHotel = RESTAURANT_HOTEL_MENU_ITEMS.find(
    m => m.name.toLowerCase() === lower || lower.includes(m.name.toLowerCase())
  );
  if (matchHotel && Array.isArray(matchHotel.recipe) && matchHotel.recipe.length > 0) {
    return JSON.parse(JSON.stringify(matchHotel.recipe));
  }

  // 3. Keyword-based matching
  if (lower.includes('pizza')) {
    if (lower.includes('paneer') || lower.includes('makhani') || lower.includes('tikka')) {
      return [
        { ingredientId: 'inv-1', name: 'Pizza Base', quantity: 1, unit: 'Piece' },
        { ingredientId: 'inv-2', name: 'Mozzarella Cheese', quantity: 60, unit: 'Gram' },
        { ingredientId: 'inv-14', name: 'Paneer (Cottage Cheese)', quantity: 40, unit: 'Gram' },
        { ingredientId: 'inv-3', name: 'Pizza Sauce', quantity: 30, unit: 'Gram' }
      ];
    }
    if (lower.includes('corn')) {
      return [
        { ingredientId: 'inv-1', name: 'Pizza Base', quantity: 1, unit: 'Piece' },
        { ingredientId: 'inv-2', name: 'Mozzarella Cheese', quantity: 70, unit: 'Gram' },
        { ingredientId: 'inv-3', name: 'Pizza Sauce', quantity: 30, unit: 'Gram' }
      ];
    }
    return [
      { ingredientId: 'inv-1', name: 'Pizza Base', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-2', name: 'Mozzarella Cheese', quantity: 50, unit: 'Gram' },
      { ingredientId: 'inv-3', name: 'Pizza Sauce', quantity: 25, unit: 'Gram' }
    ];
  }

  if (lower.includes('burger')) {
    if (lower.includes('paneer')) {
      return [
        { ingredientId: 'inv-4', name: 'Burger Buns', quantity: 1, unit: 'Piece' },
        { ingredientId: 'inv-14', name: 'Paneer (Cottage Cheese)', quantity: 50, unit: 'Gram' },
        { ingredientId: 'inv-6', name: 'Mayonnaise', quantity: 20, unit: 'Gram' },
        { ingredientId: 'inv-15', name: 'Cheese Slice', quantity: 1, unit: 'Piece' }
      ];
    }
    return [
      { ingredientId: 'inv-4', name: 'Burger Buns', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-5', name: 'Veg Aloo Patty', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-6', name: 'Mayonnaise', quantity: 20, unit: 'Gram' }
    ];
  }

  if (lower.includes('sandwich') || lower.includes('toast')) {
    return [
      { ingredientId: 'inv-12', name: 'Sandwich Bread', quantity: 2, unit: 'Slice' },
      { ingredientId: 'inv-13', name: 'Butter', quantity: 15, unit: 'Gram' },
      { ingredientId: 'inv-15', name: 'Cheese Slice', quantity: 1, unit: 'Piece' }
    ];
  }

  if (lower.includes('coffee') || lower.includes('frappe')) {
    return [
      { ingredientId: 'inv-7', name: 'Whole Milk', quantity: 200, unit: 'ml' },
      { ingredientId: 'inv-8', name: 'Coffee Powder', quantity: 15, unit: 'Gram' },
      { ingredientId: 'inv-9', name: 'Sugar', quantity: 20, unit: 'Gram' }
    ];
  }

  if (lower.includes('chai') || lower.includes('tea')) {
    return [
      { ingredientId: 'inv-7', name: 'Whole Milk', quantity: 100, unit: 'ml' },
      { ingredientId: 'inv-9', name: 'Sugar', quantity: 15, unit: 'Gram' }
    ];
  }

  if (lower.includes('fries')) {
    return [
      { ingredientId: 'inv-10', name: 'French Fries (Frozen)', quantity: 150, unit: 'Gram' }
    ];
  }

  if (lower.includes('garlic bread')) {
    return [
      { ingredientId: 'inv-11', name: 'Garlic Bread Loaf', quantity: 1, unit: 'Piece' },
      { ingredientId: 'inv-13', name: 'Butter', quantity: 20, unit: 'Gram' },
      { ingredientId: 'inv-2', name: 'Mozzarella Cheese', quantity: 30, unit: 'Gram' }
    ];
  }

  if (lower.includes('maggi')) {
    return [
      { ingredientId: 'inv-13', name: 'Butter', quantity: 15, unit: 'Gram' }
    ];
  }

  return [];
};


