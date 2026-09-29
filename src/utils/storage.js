const MENU_STORAGE_KEY = 'ss_cafe_menu_items_v7';
const SALES_STORAGE_KEY = 'ss_cafe_sales_logs_v7';
const PROCUREMENT_STORAGE_KEY = 'ss_cafe_procurement_logs_v7';
const INVENTORY_STORAGE_KEY = 'ss_cafe_inventory_v7';

// Get today's YYYY-MM-DD string
export const getTodayDateString = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().split('T')[0];
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

export const INITIAL_SALES_LOGS = [
  { id: 'sale-1', itemId: 'burger-1', itemName: 'Aloo Tikki Burger', category: 'Burgers', quantitySold: 3, sellingPrice: 39, costPrice: 18, totalRevenue: 117, totalCost: 54, paymentMethod: 'Cash', date: getTodayDateString(0) },
  { id: 'sale-2', itemId: 'shake-1', itemName: 'Classic Cold Coffee', category: 'Cold Coffee & Shakes', quantitySold: 2, sellingPrice: 59, costPrice: 25, totalRevenue: 118, totalCost: 50, paymentMethod: 'Online', date: getTodayDateString(0) }
];

export const INITIAL_PROCUREMENT_LOGS = [
  { id: 'proc-1', materialName: 'Pizza Base', category: 'Bakery', quantityReceived: 20, unit: 'Piece', ratePerUnit: 15, totalCost: 300, supplier: 'Local Baker', date: getTodayDateString(0) },
  { id: 'proc-2', materialName: 'Whole Milk', category: 'Dairy', quantityReceived: 10, unit: 'Liters', ratePerUnit: 60, totalCost: 600, supplier: 'Amul Dairy', date: getTodayDateString(0) }
];

// Helper functions with automatic migration & fallback
export const getStoredMenu = () => {
  try {
    const data = localStorage.getItem(MENU_STORAGE_KEY);
    if (!data) return INITIAL_MENU_ITEMS;
    const parsed = JSON.parse(data);
    // Ensure every item has a recipe array
    return parsed.map(item => ({
      ...item,
      recipe: item.recipe || []
    }));
  } catch (e) {
    return INITIAL_MENU_ITEMS;
  }
};

export const saveStoredMenu = (items) => {
  localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(items));
};

export const getStoredInventory = () => {
  try {
    const data = localStorage.getItem(INVENTORY_STORAGE_KEY);
    return data ? JSON.parse(data) : INITIAL_INVENTORY_ITEMS;
  } catch (e) {
    return INITIAL_INVENTORY_ITEMS;
  }
};

export const saveStoredInventory = (inventory) => {
  localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
};

export const getStoredSales = () => {
  try {
    const data = localStorage.getItem(SALES_STORAGE_KEY);
    return data ? JSON.parse(data) : INITIAL_SALES_LOGS;
  } catch (e) {
    return INITIAL_SALES_LOGS;
  }
};

export const saveStoredSales = (sales) => {
  localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
};

export const getStoredProcurement = () => {
  try {
    const data = localStorage.getItem(PROCUREMENT_STORAGE_KEY);
    return data ? JSON.parse(data) : INITIAL_PROCUREMENT_LOGS;
  } catch (e) {
    return INITIAL_PROCUREMENT_LOGS;
  }
};

export const saveStoredProcurement = (proc) => {
  localStorage.setItem(PROCUREMENT_STORAGE_KEY, JSON.stringify(proc));
};

// Known Material Aliases for smart typo handling and natural naming
export const KNOWN_MATERIAL_ALIASES = {
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
  'cheese slice': ['cheese slice', 'slice cheese', 'cheddar slice']
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
    return m.includes(q) || q.includes(m);
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

