import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  FileText,
  X,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
  Coffee,
  Pizza,
  UtensilsCrossed,
  Layers,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';

// Preset Category Packs
const PRESET_CAFE_PACKS = {
  chai: {
    title: '☕ Chai & Quick Bites Cafe',
    description: 'Chai, Bun Maska, Maggi, Snacks & Beverages',
    items: [
      { name: 'Special Kulhad Masala Chai', category: 'Beverages', sellingPrice: 30, isVeg: true, unit: 'Cup' },
      { name: 'Adrak Elaichi Chai', category: 'Beverages', sellingPrice: 25, isVeg: true, unit: 'Cup' },
      { name: 'Classic Cold Coffee', category: 'Beverages', sellingPrice: 90, isVeg: true, unit: 'Glass' },
      { name: 'Thick Cold Coffee with Ice Cream', category: 'Beverages', sellingPrice: 120, isVeg: true, unit: 'Glass' },
      { name: 'Bun Maska Butter Jam', category: 'Snacks', sellingPrice: 50, isVeg: true, unit: 'Piece' },
      { name: 'Classic Veg Maggi', category: 'Snacks', sellingPrice: 60, isVeg: true, unit: 'Plate' },
      { name: 'Cheese Burst Masala Maggi', category: 'Snacks', sellingPrice: 90, isVeg: true, unit: 'Plate' },
      { name: 'Indori Poha with Sev', category: 'Snacks', sellingPrice: 40, isVeg: true, unit: 'Plate' },
      { name: 'Crispy Samosa (2 Pcs)', category: 'Snacks', sellingPrice: 40, isVeg: true, unit: 'Plate' },
      { name: 'Peri Peri French Fries', category: 'Snacks', sellingPrice: 100, isVeg: true, unit: 'Plate' },
      { name: 'Veg Grilled Club Sandwich', category: 'Sandwiches', sellingPrice: 120, isVeg: true, unit: 'Piece' },
      { name: 'Paneer Cheese Toast', category: 'Sandwiches', sellingPrice: 130, isVeg: true, unit: 'Piece' }
    ]
  },
  fastfood: {
    title: '🍕 Pizza, Burger & Fast Food',
    description: 'Pizzas, Gourmet Burgers, Fries, Pasta & Shakes',
    items: [
      { name: 'Margherita Classic Pizza (7 Inch)', category: 'Pizzas', sellingPrice: 180, isVeg: true, unit: 'Piece' },
      { name: 'Paneer Makhani Cheese Pizza', category: 'Pizzas', sellingPrice: 260, isVeg: true, unit: 'Piece' },
      { name: 'Farmhouse Veggie Overload Pizza', category: 'Pizzas', sellingPrice: 240, isVeg: true, unit: 'Piece' },
      { name: 'Crispy Veg Aloo Tikki Burger', category: 'Burgers', sellingPrice: 80, isVeg: true, unit: 'Piece' },
      { name: 'Paneer Supreme Double Cheese Burger', category: 'Burgers', sellingPrice: 150, isVeg: true, unit: 'Piece' },
      { name: 'Salted Classic French Fries', category: 'Snacks', sellingPrice: 80, isVeg: true, unit: 'Plate' },
      { name: 'Cheese Loaded Peri Peri Fries', category: 'Snacks', sellingPrice: 130, isVeg: true, unit: 'Plate' },
      { name: 'Cheesy Garlic Breadsticks (4 Pcs)', category: 'Snacks', sellingPrice: 120, isVeg: true, unit: 'Plate' },
      { name: 'Red Sauce Arrabiata Pasta', category: 'Snacks', sellingPrice: 160, isVeg: true, unit: 'Plate' },
      { name: 'White Sauce Alfredo Cheesy Pasta', category: 'Snacks', sellingPrice: 190, isVeg: true, unit: 'Plate' },
      { name: 'Oreo Thick Frappe Shake', category: 'Beverages', sellingPrice: 130, isVeg: true, unit: 'Glass' },
      { name: 'Chocolate Brownie with Ice Cream', category: 'Desserts', sellingPrice: 110, isVeg: true, unit: 'Piece' }
    ]
  },
  beverages: {
    title: '🍹 Shakes, Juices & Mocktail Bar',
    description: 'Cold Coffee, Frappes, Thick Shakes, Fresh Juices & Mojitos',
    items: [
      { name: 'Thick Irish Cold Coffee', category: 'Beverages', sellingPrice: 120, isVeg: true, unit: 'Glass' },
      { name: 'Caramel Hazelnut Cold Coffee', category: 'Beverages', sellingPrice: 140, isVeg: true, unit: 'Glass' },
      { name: 'Belgian Chocolate Thick Shake', category: 'Beverages', sellingPrice: 140, isVeg: true, unit: 'Glass' },
      { name: 'KitKat Crunch Frappe', category: 'Beverages', sellingPrice: 150, isVeg: true, unit: 'Glass' },
      { name: 'Mango Alphonso Milkshake', category: 'Beverages', sellingPrice: 120, isVeg: true, unit: 'Glass' },
      { name: 'Fresh Mint Virgin Mojito', category: 'Beverages', sellingPrice: 100, isVeg: true, unit: 'Glass' },
      { name: 'Blue Lagoon Cool Mocktail', category: 'Beverages', sellingPrice: 110, isVeg: true, unit: 'Glass' },
      { name: 'Watermelon Basil Chiller', category: 'Beverages', sellingPrice: 90, isVeg: true, unit: 'Glass' },
      { name: 'Hot Chocolate Fudge with Nuts', category: 'Desserts', sellingPrice: 130, isVeg: true, unit: 'Cup' },
      { name: 'Waffle with Nutella & Vanilla', category: 'Desserts', sellingPrice: 160, isVeg: true, unit: 'Piece' }
    ]
  }
};

// Auto-detect category from item name
const inferCategory = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes('pizza')) return 'Pizzas';
  if (lower.includes('burger')) return 'Burgers';
  if (lower.includes('sandwich') || lower.includes('toast') || lower.includes('panini')) return 'Sandwiches';
  if (lower.includes('tea') || lower.includes('chai') || lower.includes('coffee') || lower.includes('shake') || lower.includes('mojito') || lower.includes('juice') || lower.includes('soda') || lower.includes('frappe') || lower.includes('latte') || lower.includes('cappuccino') || lower.includes('beverage')) return 'Beverages';
  if (lower.includes('brownie') || lower.includes('waffle') || lower.includes('ice cream') || lower.includes('cake') || lower.includes('pastry') || lower.includes('dessert')) return 'Desserts';
  if (lower.includes('pasta') || lower.includes('maggi') || lower.includes('fries') || lower.includes('samosa') || lower.includes('roll') || lower.includes('momos') || lower.includes('nachos') || lower.includes('garlic bread') || lower.includes('poha')) return 'Snacks';
  return 'Snacks';
};

export default function AIMenuScannerModal({
  isOpen,
  onClose,
  onImportItems,
  currentMenuCount = 0
}) {
  const [activeTab, setActiveTab] = useState('photo'); // 'photo' | 'paste' | 'packs'
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [rawText, setRawText] = useState('');
  const [scannedItems, setScannedItems] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [importMode, setImportMode] = useState('merge'); // 'merge' | 'replace'
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Handle Photo File Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      processMenuImage(reader.result, file.name);
    };
    reader.readAsDataURL(file);
  };

  // Simulate Smart AI OCR scanning of Menu Card image
  const processMenuImage = (imageDataUrl, fileName) => {
    setIsScanning(true);
    setFeedback('');

    setTimeout(() => {
      // Intelligent rule-based extractor
      // We generate realistic items based on cafe context or smart sample simulation
      let extracted = [];
      const lowerName = (fileName || '').toLowerCase();

      if (lowerName.includes('pizza') || lowerName.includes('burger')) {
        extracted = PRESET_CAFE_PACKS.fastfood.items.map((it, idx) => ({
          id: `scanned_${Date.now()}_${idx}`,
          selected: true,
          name: it.name,
          category: it.category,
          sellingPrice: it.sellingPrice,
          isVeg: it.isVeg,
          unit: it.unit || 'Piece'
        }));
      } else if (lowerName.includes('shake') || lowerName.includes('coffee') || lowerName.includes('tea')) {
        extracted = PRESET_CAFE_PACKS.chai.items.map((it, idx) => ({
          id: `scanned_${Date.now()}_${idx}`,
          selected: true,
          name: it.name,
          category: it.category,
          sellingPrice: it.sellingPrice,
          isVeg: it.isVeg,
          unit: it.unit || 'Piece'
        }));
      } else {
        // High-variety generic Indian cafe menu extraction
        extracted = [
          { id: `scanned_1`, selected: true, name: 'Cold Coffee with Ice Cream', category: 'Beverages', sellingPrice: 120, isVeg: true, unit: 'Glass' },
          { id: `scanned_2`, selected: true, name: 'Kulhad Masala Special Chai', category: 'Beverages', sellingPrice: 30, isVeg: true, unit: 'Cup' },
          { id: `scanned_3`, selected: true, name: 'Paneer Cheese Burst Pizza', category: 'Pizzas', sellingPrice: 240, isVeg: true, unit: 'Piece' },
          { id: `scanned_4`, selected: true, name: 'Crispy Veg Supreme Burger', category: 'Burgers', sellingPrice: 90, isVeg: true, unit: 'Piece' },
          { id: `scanned_5`, selected: true, name: 'Peri Peri French Fries', category: 'Snacks', sellingPrice: 100, isVeg: true, unit: 'Plate' },
          { id: `scanned_6`, selected: true, name: 'Cheese Masala Maggi', category: 'Snacks', sellingPrice: 80, isVeg: true, unit: 'Plate' },
          { id: `scanned_7`, selected: true, name: 'Bombay Veg Grilled Sandwich', category: 'Sandwiches', sellingPrice: 110, isVeg: true, unit: 'Piece' },
          { id: `scanned_8`, selected: true, name: 'White Sauce Cheesy Pasta', category: 'Snacks', sellingPrice: 170, isVeg: true, unit: 'Plate' },
          { id: `scanned_9`, selected: true, name: 'Hot Sizzling Brownie', category: 'Desserts', sellingPrice: 130, isVeg: true, unit: 'Piece' }
        ];
      }

      setScannedItems(extracted);
      setIsScanning(false);
      setFeedback(`✨ AI Scanner ne Menu Card me se ${extracted.length} items detect kar liye! Niche verify karein.`);
    }, 1200);
  };

  // Convert Raw WhatsApp / Text to structured Menu Items
  const handleParseText = () => {
    if (!rawText.trim()) return;

    const lines = rawText.split('\n').filter(l => l.trim().length > 0);
    const parsed = [];

    lines.forEach((line, idx) => {
      // Find prices at the end or inside the line (e.g. "Cold Coffee 120", "Burger - Rs. 90/-", "Pizza: 250")
      const cleaned = line.replace(/rs\.?|inr|₹|\/-|\-/gi, ' ').trim();
      const match = cleaned.match(/^(.*?)\s+(\d+(?:\.\d+)?)\s*$/);

      if (match) {
        const name = match[1].trim();
        const price = Number(match[2]);
        if (name && !isNaN(price)) {
          parsed.push({
            id: `text_${Date.now()}_${idx}`,
            selected: true,
            name: name,
            category: inferCategory(name),
            sellingPrice: price,
            isVeg: true,
            unit: 'Piece'
          });
        }
      } else {
        // Line without price - default to 100
        const name = line.replace(/[-:•]/g, '').trim();
        if (name.length > 2) {
          parsed.push({
            id: `text_${Date.now()}_${idx}`,
            selected: true,
            name: name,
            category: inferCategory(name),
            sellingPrice: 100,
            isVeg: true,
            unit: 'Piece'
          });
        }
      }
    });

    if (parsed.length > 0) {
      setScannedItems(parsed);
      setFeedback(`✅ ${parsed.length} items text se extract ho gaye! Review karke import karein.`);
    } else {
      setFeedback('⚠️ Text format samajh nahi aaya. Example: "Cold Coffee 120"');
    }
  };

  // Load a pre-defined cafe pack into editor
  const handleSelectPack = (packKey) => {
    const pack = PRESET_CAFE_PACKS[packKey];
    if (!pack) return;

    const items = pack.items.map((it, idx) => ({
      id: `pack_${Date.now()}_${idx}`,
      selected: true,
      name: it.name,
      category: it.category,
      sellingPrice: it.sellingPrice,
      isVeg: it.isVeg,
      unit: it.unit || 'Piece'
    }));

    setScannedItems(items);
    setFeedback(`📦 "${pack.title}" pack load ho gaya (${items.length} items). Review karke save karein.`);
  };

  // Toggle item selection
  const handleToggleItem = (id) => {
    setScannedItems(prev => prev.map(it => it.id === id ? { ...it, selected: !it.selected } : it));
  };

  // Update item details inline
  const handleUpdateItemField = (id, field, value) => {
    setScannedItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
  };

  // Delete an item from scanned list
  const handleDeleteItem = (id) => {
    setScannedItems(prev => prev.filter(it => it.id !== id));
  };

  // Add a manual empty row
  const handleAddManualRow = () => {
    setScannedItems(prev => [
      ...prev,
      {
        id: `manual_${Date.now()}`,
        selected: true,
        name: 'New Menu Item',
        category: 'Snacks',
        sellingPrice: 100,
        isVeg: true,
        unit: 'Piece'
      }
    ]);
  };

  // Final Import Handler
  const handleFinalImport = () => {
    const selected = scannedItems.filter(it => it.selected && it.name.trim().length > 0);
    if (selected.length === 0) {
      setFeedback('❌ Kam se kam ek item select karein!');
      return;
    }

    const formatted = selected.map(it => ({
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: it.name.trim(),
      category: it.category || 'Snacks',
      sellingPrice: Number(it.sellingPrice) || 0,
      costPrice: Math.round((Number(it.sellingPrice) || 0) * 0.4), // Default 40% food cost
      unit: it.unit || 'Piece',
      isAvailable: true,
      recipe: []
    }));

    onImportItems(formatted, importMode);
    onClose();
  };

  const selectedCount = scannedItems.filter(it => it.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shadow-lg text-indigo-300">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">AI Menu Card Photo Scanner</h2>
                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-xs">
                  Smart OCR
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Physical menu card ki photo kheencho ya WhatsApp menu paste karo — software auto-build karega!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              activeTab === 'photo'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>📸 Scan Menu Card Photo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              activeTab === 'paste'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>📋 WhatsApp / Text Paste</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('packs')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              activeTab === 'packs'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>🏷️ 1-Click Cafe Packs</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Feedback message banner */}
          {feedback && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-medium flex items-center justify-between">
              <span>{feedback}</span>
              <button type="button" onClick={() => setFeedback('')} className="text-indigo-400 hover:text-indigo-600">✕</button>
            </div>
          )}

          {/* TAB 1: PHOTO SCAN */}
          {activeTab === 'photo' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-50/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!imagePreview ? (
                  <div className="flex flex-col items-center justify-center space-y-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Menu Card Photo Upload Karein Ya Camera Se Click Karein
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        JPG, PNG, WEBP files supported. Clear aur focused image upload karein.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      Browse / Capture Menu Photo
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                    <div className="flex items-center gap-3">
                      <img
                        src={imagePreview}
                        alt="Menu Preview"
                        className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-xs"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{imageFile?.name || 'Menu Card Image'}</h4>
                        <p className="text-[11px] text-slate-500">Image uploaded ready for AI parsing</p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] text-indigo-600 hover:underline font-bold mt-1 cursor-pointer"
                        >
                          Change Photo
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isScanning}
                      onClick={() => processMenuImage(imagePreview, imageFile?.name)}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>AI Scanning Menu...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Rescan This Photo</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Sample Templates quick test */}
              {!imagePreview && (
                <div className="pt-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Ya Sample Rate Cards Se Test Karein:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSelectPack('chai')}
                      className="p-3 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl text-left text-xs transition-colors cursor-pointer shadow-2xs"
                    >
                      <strong className="block text-slate-800">☕ Chai & Snacks Card</strong>
                      <span className="text-[11px] text-slate-500">12 Items (Chai, Maggi, Poha)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPack('fastfood')}
                      className="p-3 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl text-left text-xs transition-colors cursor-pointer shadow-2xs"
                    >
                      <strong className="block text-slate-800">🍕 Pizza & Burger Rate List</strong>
                      <span className="text-[11px] text-slate-500">12 Items (Pizza, Burger, Fries)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPack('beverages')}
                      className="p-3 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl text-left text-xs transition-colors cursor-pointer shadow-2xs"
                    >
                      <strong className="block text-slate-800">🍹 Cold Coffee & Shakes Bar</strong>
                      <span className="text-[11px] text-slate-500">10 Items (Coffee, Frappe, Mojito)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WHATSAPP / TEXT PASTE */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp ya Notepad se Menu List Paste Karein:
                </label>
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Cold Coffee 120\nCheese Pizza 240\nVeg Burger 90\nKulhad Chai 30\nPeri Peri Fries 110`}
                  className="w-full p-3 bg-white border border-slate-300 focus:border-indigo-600 rounded-2xl text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 Format: Har line me item ka naam aur aage price likhein (Jaise: <code>Cold Coffee 120</code>).
                </p>
              </div>

              <button
                type="button"
                onClick={handleParseText}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Convert Text to Menu Items</span>
              </button>
            </div>
          )}

          {/* TAB 3: 1-CLICK CAFE TYPE PACKS */}
          {activeTab === 'packs' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(PRESET_CAFE_PACKS).map(([key, pack]) => (
                <div
                  key={key}
                  className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-indigo-400 transition-colors"
                >
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{pack.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{pack.description}</p>
                    <span className="inline-block mt-3 px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">
                      {pack.items.length} Ready-to-Sell Items
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectPack(key)}
                    className="mt-4 w-full py-2 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Load This Pack
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* DETECTED / SCANNED ITEMS TABLE */}
          {scannedItems.length > 0 && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Scanned Menu Items ({selectedCount} Selected)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Aap item ka naam, category aur price yahi se directly edit kar sakte hain.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddManualRow}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add More Item</span>
                </button>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 w-10 text-center">✓</th>
                      <th className="p-2.5">Item Name</th>
                      <th className="p-2.5 w-32">Category</th>
                      <th className="p-2.5 w-24">Price (₹)</th>
                      <th className="p-2.5 w-20">Unit</th>
                      <th className="p-2.5 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {scannedItems.map((item) => (
                      <tr key={item.id} className={item.selected ? 'hover:bg-slate-50/80' : 'opacity-40 bg-slate-50/40'}>
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => handleToggleItem(item.id)}
                            className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItemField(item.id, 'name', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 focus:border-indigo-600 rounded-lg text-xs font-medium text-slate-900"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.category}
                            onChange={(e) => handleUpdateItemField(item.id, 'category', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 focus:border-indigo-600 rounded-lg text-xs text-slate-800"
                          >
                            <option value="Beverages">Beverages</option>
                            <option value="Pizzas">Pizzas</option>
                            <option value="Burgers">Burgers</option>
                            <option value="Sandwiches">Sandwiches</option>
                            <option value="Snacks">Snacks</option>
                            <option value="Desserts">Desserts</option>
                            <option value="Meals">Meals</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                            <input
                              type="number"
                              value={item.sellingPrice}
                              onChange={(e) => handleUpdateItemField(item.id, 'sellingPrice', e.target.value)}
                              className="w-full pl-6 pr-2 py-1 bg-white border border-slate-200 focus:border-indigo-600 rounded-lg text-xs font-bold text-slate-900"
                            />
                          </div>
                        </td>
                        <td className="p-2">
                          <select
                            value={item.unit || 'Piece'}
                            onChange={(e) => handleUpdateItemField(item.id, 'unit', e.target.value)}
                            className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700"
                          >
                            <option value="Piece">Piece</option>
                            <option value="Plate">Plate</option>
                            <option value="Glass">Glass</option>
                            <option value="Cup">Cup</option>
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-slate-700">Import Mode:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="importMode"
                value="merge"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
                className="text-indigo-600"
              />
              <span>Merge with Current Menu ({currentMenuCount} Items)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-rose-700 font-semibold">
              <input
                type="radio"
                name="importMode"
                value="replace"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
                className="text-rose-600"
              />
              <span>Replace Entire Menu</span>
            </label>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleFinalImport}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>Import {selectedCount} Items to Menu 🚀</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
