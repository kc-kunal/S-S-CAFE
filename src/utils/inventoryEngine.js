/**
 * S&S Cafe Enterprise Inventory & Recipe Engine
 * Supports: Unit conversions, sub-recipes, recipe cost calculation,
 * food cost %, idempotent stock deduction on POS sales/edits/refunds,
 * theoretical vs actual variance calculation, purchases, wastage, stock adjustments.
 */

// Standard conversion factors to base consumption units
export const UNIT_CONVERSIONS = {
  // Weight: KG -> Gram
  KG_TO_GRAM: 1000,
  // Volume: LITRE -> ML
  LITRE_TO_ML: 1000,
  // Count: BOX -> PIECE
  BOX_TO_PIECE: 10,
  // Count: PACKET -> PIECE
  PACKET_TO_PIECE: 10,
  // Count: DOZEN -> PIECE
  DOZEN_TO_PIECE: 12
};

/**
 * Convert purchase quantity to consumption unit quantity
 */
export className UnitConverter {
  static toConsumptionQty(qty, purchaseUnit, consumptionUnit, customFactor = 1) {
    const pUnit = (purchaseUnit || '').toUpperCase();
    const cUnit = (consumptionUnit || '').toUpperCase();

    if (pUnit === cUnit) return qty * customFactor;

    if (pUnit === 'KG' && cUnit === 'GRAM') return qty * 1000;
    if (pUnit === 'LITRE' && (cUnit === 'ML' || cUnit === 'MILLILITRE')) return qty * 1000;
    if (pUnit === 'BOX' && cUnit === 'PIECE') return qty * (customFactor || 10);
    if (pUnit === 'PACKET' && cUnit === 'PIECE') return qty * (customFactor || 10);
    if (pUnit === 'DOZEN' && cUnit === 'PIECE') return qty * 12;

    return qty * (customFactor || 1);
  }

  static getUnitCostPerConsumptionUnit(purchaseRate, purchaseUnit, consumptionUnit, customFactor = 1) {
    const pRate = Number(purchaseRate) || 0;
    const factor = this.toConsumptionQty(1, purchaseUnit, consumptionUnit, customFactor);
    return factor > 0 ? pRate / factor : pRate;
  }
}

/**
 * Recursively resolve item recipe including sub-recipes
 * Returns flat list of base inventory ingredient consumption items:
 * [{ ingredientId, name, qtyNeeded, unit, unitCost }]
 */
export function resolveItemRecipe(menuItem, recipesMap, subRecipesMap, inventoryMasterMap) {
  const recipe = recipesMap[menuItem.id] || menuItem.recipe || [];
  const resolvedBaseIngredients = [];

  recipe.forEach(ingredient => {
    if (ingredient.isSubRecipe) {
      // Resolve sub-recipe
      const subRecipe = subRecipesMap[ingredient.subRecipeId] || [];
      const subRecipeBatchSize = ingredient.subRecipeBatchSize || 1;
      const multiplier = ingredient.quantity / subRecipeBatchSize;

      subRecipe.forEach(subItem => {
        const invItem = inventoryMasterMap[subItem.ingredientId];
        const unitCost = invItem ? UnitConverter.getUnitCostPerConsumptionUnit(invItem.purchaseRate, invItem.purchaseUnit, invItem.consumptionUnit, invItem.conversionFactor) : 0;

        resolvedBaseIngredients.push({
          ingredientId: subItem.ingredientId,
          name: invItem ? invItem.materialName : subItem.name,
          quantity: subItem.quantity * multiplier,
          unit: subItem.unit,
          unitCost: unitCost
        });
      });
    } else {
      const invItem = inventoryMasterMap[ingredient.ingredientId];
      const unitCost = invItem ? UnitConverter.getUnitCostPerConsumptionUnit(invItem.purchaseRate, invItem.purchaseUnit, invItem.consumptionUnit, invItem.conversionFactor) : (ingredient.unitCost || 0);

      resolvedBaseIngredients.push({
        ingredientId: ingredient.ingredientId,
        name: invItem ? invItem.materialName : ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        unitCost: unitCost
      });
    }
  });

  return resolvedBaseIngredients;
}

/**
 * Calculate Recipe Cost, Food Cost %, Gross Profit
 */
export function calculateRecipeFinancials(menuItem, recipesMap, subRecipesMap, inventoryMasterMap) {
  const ingredients = resolveItemRecipe(menuItem, recipesMap, subRecipesMap, inventoryMasterMap);
  
  const recipeCost = ingredients.reduce((sum, item) => {
    return sum + (item.quantity * item.unitCost);
  }, 0);

  const sellingPrice = Number(menuItem.sellingPrice) || 0;
  const foodCostPercent = sellingPrice > 0 ? ((recipeCost / sellingPrice) * 100) : 0;
  const grossProfit = sellingPrice - recipeCost;

  return {
    recipeCost: Math.round(recipeCost * 100) / 100,
    sellingPrice,
    foodCostPercent: Math.round(foodCostPercent * 10) / 10,
    grossProfit: Math.round(grossProfit * 100) / 100,
    ingredients
  };
}

/**
 * Process POS Sale Transaction (Automatic Stock Deduction with Idempotency)
 * Safely updates inventoryMaster and logs movement into stockLedger
 */
export function processPosSaleInventoryDeduction({
  transaction,             // { id, items: [{ menuItem, qty }], status: 'COMPLETED' | 'CANCELLED' }
  inventoryMaster,         // Array of inventory items
  recipesMap,              // Map of menuItem.id -> recipe items
  subRecipesMap,           // Map of subRecipeId -> ingredients
  stockLedger,             // Existing stock ledger entries array
  processedTxIds,          // Set/Array of already processed transaction IDs for idempotency
  user = 'POS System',
  isRefund = false
}) {
  // Idempotency check: prevent duplicate deduction
  const txRef = `POS-${transaction.id}${isRefund ? '-REFUND' : ''}`;
  
  if (!isRefund && processedTxIds.includes(txRef)) {
    console.log(`[Idempotency] Transaction ${txRef} already processed for inventory deduction.`);
    return { inventoryMaster, stockLedger, processedTxIds, updated: false };
  }

  const inventoryMap = {};
  inventoryMaster.forEach(item => { inventoryMap[item.id] = { ...item }; });

  const newLedgerEntries = [];
  const timestamp = new Date().toISOString();
  const dateStr = timestamp.split('T')[0];
  const timeStr = timestamp.split('T')[1].slice(0, 8);

  // Calculate total consumption for all items in order
  transaction.items.forEach(orderItem => {
    const menuItem = orderItem.menuItem || orderItem;
    const orderQty = Number(orderItem.qty || orderItem.quantitySold || 1);

    const recipeIngredients = resolveItemRecipe(menuItem, recipesMap, subRecipesMap, inventoryMap);

    recipeIngredients.forEach(ing => {
      const invItem = inventoryMap[ing.ingredientId];
      if (!invItem) return;

      const totalConsumptionQty = ing.quantity * orderQty;
      const unitCost = ing.unitCost;

      if (isRefund) {
        // Reverse inventory consumption (Add back stock)
        invItem.currentStock = Math.round((invItem.currentStock + totalConsumptionQty) * 100) / 100;
        
        newLedgerEntries.push({
          id: `ledger-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          date: dateStr,
          time: timeStr,
          transactionId: txRef,
          ingredientId: invItem.id,
          ingredientName: invItem.materialName,
          transactionType: 'SALE_REFUND',
          stockIn: totalConsumptionQty,
          stockOut: 0,
          wastage: 0,
          adjustment: 0,
          balanceStock: invItem.currentStock,
          rate: unitCost,
          totalValue: Math.round(totalConsumptionQty * unitCost * 100) / 100,
          user: user,
          remarks: `Refund reversal for ${orderQty}x ${menuItem.name}`
        });
      } else {
        // Deduct inventory consumption
        invItem.currentStock = Math.round((invItem.currentStock - totalConsumptionQty) * 100) / 100;

        newLedgerEntries.push({
          id: `ledger-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          date: dateStr,
          time: timeStr,
          transactionId: txRef,
          ingredientId: invItem.id,
          ingredientName: invItem.materialName,
          transactionType: 'POS_SALE',
          stockIn: 0,
          stockOut: totalConsumptionQty,
          wastage: 0,
          adjustment: 0,
          balanceStock: invItem.currentStock,
          rate: unitCost,
          totalValue: Math.round(totalConsumptionQty * unitCost * 100) / 100,
          user: user,
          remarks: `Sold ${orderQty}x ${menuItem.name}`
        });
      }

      // Update Stock Status
      if (invItem.currentStock <= 0) {
        invItem.status = 'OUT OF STOCK';
      } else if (invItem.currentStock <= (invItem.minimumStock || invItem.reorderLevel)) {
        invItem.status = 'LOW STOCK';
      } else {
        invItem.status = 'IN STOCK';
      }
    });
  });

  const updatedInventoryMaster = Object.values(inventoryMap);
  const updatedLedger = [...newLedgerEntries, ...stockLedger];
  const updatedProcessedTxIds = [...processedTxIds, txRef];

  return {
    inventoryMaster: updatedInventoryMaster,
    stockLedger: updatedLedger,
    processedTxIds: updatedProcessedTxIds,
    updated: true
  };
}

/**
 * Calculate Theoretical vs Actual Consumption & Variance Analysis
 */
export function calculateTheoreticalVsActualConsumption(salesLogs, stockLedger, inventoryMaster, recipesMap, subRecipesMap) {
  const inventoryMap = {};
  inventoryMaster.forEach(i => { inventoryMap[i.id] = i; });

  // 1. Calculate Theoretical Consumption = Σ (Sales Quantity * Recipe Ingredient Quantity)
  const theoreticalMap = {};

  salesLogs.forEach(sale => {
    const menuItem = { id: sale.itemId, name: sale.itemName, sellingPrice: sale.sellingPrice };
    const qtySold = Number(sale.quantitySold) || 0;
    
    const ingredients = resolveItemRecipe(menuItem, recipesMap, subRecipesMap, inventoryMap);

    ingredients.forEach(ing => {
      if (!theoreticalMap[ing.ingredientId]) {
        theoreticalMap[ing.ingredientId] = {
          ingredientId: ing.ingredientId,
          name: ing.name,
          unit: ing.unit,
          theoreticalQty: 0,
          actualOutQty: 0,
          unitCost: ing.unitCost
        };
      }
      theoreticalMap[ing.ingredientId].theoreticalQty += (ing.quantity * qtySold);
    });
  });

  // 2. Calculate Actual Stock Out from Stock Ledger
  stockLedger.forEach(entry => {
    const ingId = entry.ingredientId;
    if (!theoreticalMap[ingId]) {
      const invItem = inventoryMap[ingId];
      if (invItem) {
        theoreticalMap[ingId] = {
          ingredientId: ingId,
          name: invItem.materialName,
          unit: invItem.consumptionUnit || invItem.unit,
          theoreticalQty: 0,
          actualOutQty: 0,
          unitCost: invItem.unitCost || 0
        };
      }
    }

    if (theoreticalMap[ingId]) {
      // Sum up POS Sales + Wastage + Adjustments as Actual Consumption
      if (entry.transactionType === 'POS_SALE' || entry.transactionType === 'WASTAGE') {
        theoreticalMap[ingId].actualOutQty += (entry.stockOut || entry.wastage || 0);
      } else if (entry.transactionType === 'ADJUSTMENT' && entry.adjustment < 0) {
        theoreticalMap[ingId].actualOutQty += Math.abs(entry.adjustment);
      }
    }
  });

  // 3. Calculate Variance & Variance %
  return Object.values(theoreticalMap).map(row => {
    const theoretical = Math.round(row.theoreticalQty * 100) / 100;
    const actual = Math.round(row.actualOutQty * 100) / 100;
    const variance = Math.round((actual - theoretical) * 100) / 100;
    const variancePercent = theoretical > 0 ? Math.round(((variance / theoretical) * 100) * 10) / 10 : 0;
    const varianceCost = Math.round(variance * row.unitCost * 100) / 100;

    return {
      ingredientId: row.ingredientId,
      name: row.name,
      unit: row.unit,
      theoreticalQty: theoretical,
      actualQty: actual,
      variance: variance,
      variancePercent: variancePercent,
      varianceCost: varianceCost,
      status: variance > 0 ? 'OVER_CONSUMPTION' : variance < 0 ? 'UNDER_CONSUMPTION' : 'EXACT'
    };
  });
}
