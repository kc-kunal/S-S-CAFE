/**
 * Food Image Mapping & Utilities for Dine-In Digital Menu & Cafe POS
 * Provides curated, high-resolution, appetizing food imagery
 * with smart category & keyword matching and graceful offline SVG fallbacks.
 */

// Fallback high-quality food image
export const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80';

// Curated high-res imagery dictionary
export const FOOD_IMAGE_CATALOG = {
  // Pizza
  'margarita': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&q=80',
  'margherita': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&q=80',
  'cheese corn pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80',
  'paneer pizza': 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=400&q=80',
  'veg cheese pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
  'schezwan pizza': 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=400&q=80',
  'pizza': 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=400&q=80',

  // Burgers
  'cheese burger': 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80',
  'paneer burger': 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=400&q=80',
  'veg burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
  'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',

  // Sandwiches
  'grilled sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80',
  'cheese sandwich': 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=400&q=80',
  'club sandwich': 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=400&q=80',
  'sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80',

  // Fries & Finger Foods
  'peri peri fries': 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=400&q=80',
  'french fries': 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=400&q=80',
  'fries': 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=400&q=80',
  'garlic bread': 'https://images.unsplash.com/photo-1619895092538-128341789043?auto=format&fit=crop&w=400&q=80',
  'nachos': 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=400&q=80',

  // Momos
  'steamed momos': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=400&q=80',
  'fried momos': 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=400&q=80',
  'momos': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=400&q=80',

  // Pasta & Noodles
  'white sauce pasta': 'https://images.unsplash.com/photo-1621996346565-e3d5d628178a?auto=format&fit=crop&w=400&q=80',
  'alfredo': 'https://images.unsplash.com/photo-1621996346565-e3d5d628178a?auto=format&fit=crop&w=400&q=80',
  'red sauce pasta': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=400&q=80',
  'pasta': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=400&q=80',
  'maggi': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
  'noodles': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
  'chowmein': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',

  // Coffee & Beverages
  'cold coffee': 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=400&q=80',
  'cappuccino': 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=400&q=80',
  'latte': 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=400&q=80',
  'espresso': 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=400&q=80',
  'hot coffee': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
  'coffee': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
  'hot chocolate': 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=400&q=80',
  'tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
  'chai': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',

  // Shakes & Mocktails
  'chocolate shake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80',
  'oreo shake': 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=400&q=80',
  'strawberry shake': 'https://images.unsplash.com/photo-1553787499-6f9133860278?auto=format&fit=crop&w=400&q=80',
  'shake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80',
  'milkshake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80',
  'mojito': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
  'mocktail': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
  'lemonade': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
  'iced tea': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',

  // Desserts
  'brownie': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80',
  'waffle': 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=400&q=80',
  'ice cream': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=400&q=80',
  'cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',

  // Restaurant & Main Course
  'paneer butter': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80',
  'paneer': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80',
  'dal makhani': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80',
  'dal': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80',
  'biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80',
  'roti': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80',
  'naan': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80',
  'thali': 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=400&q=80',
  'chole bhature': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&q=80',
  'roll': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=400&q=80',
  'wrap': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=400&q=80'
};

/**
 * Intelligently returns an image URL for any menu item
 */
export function getItemImageUrl(item) {
  if (!item) return DEFAULT_FOOD_IMAGE;

  // 1. Check if item has a custom imageUrl / image property
  if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim().length > 5) {
    return item.imageUrl.trim();
  }
  if (item.image && typeof item.image === 'string' && item.image.trim().length > 5) {
    return item.image.trim();
  }

  const name = (item.name || '').toLowerCase().trim();
  const category = (item.category || '').toLowerCase().trim();
  const combined = `${name} ${category}`;

  // 2. Exact or partial match on name / category keywords
  for (const [key, url] of Object.entries(FOOD_IMAGE_CATALOG)) {
    if (name.includes(key)) return url;
  }

  // 3. Category match
  for (const [key, url] of Object.entries(FOOD_IMAGE_CATALOG)) {
    if (category.includes(key)) return url;
  }

  // 4. Combined string match
  for (const [key, url] of Object.entries(FOOD_IMAGE_CATALOG)) {
    if (combined.includes(key)) return url;
  }

  // 5. Default food photography
  return DEFAULT_FOOD_IMAGE;
}

/**
 * Returns whether an item is vegetarian or non-vegetarian
 */
export function isItemVeg(item) {
  if (!item) return true;
  if (item.isVeg !== undefined) return Boolean(item.isVeg);
  const text = `${item.name || ''} ${item.category || ''}`.toLowerCase();
  const nonVegKeywords = ['chicken', 'mutton', 'fish', 'egg', 'prawn', 'meat', 'non veg', 'nonveg'];
  return !nonVegKeywords.some(k => text.includes(k));
}
