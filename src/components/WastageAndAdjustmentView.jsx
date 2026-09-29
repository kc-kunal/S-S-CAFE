import React, { useState } from 'react';
import { AlertOctagon, Sliders, Plus, Trash2, Calendar, User, FileText } from 'lucide-react';

const WASTAGE_REASONS = [
  'Spoilage',
  'Expired',
  'Burnt',
  'Preparation Loss',
  'Damaged',
  'Wrong Preparation',
  'Other'
];

export default function WastageAndAdjustmentView({
  inventoryMaster,
  wastageLogs,
  adjustments,
  onAddWastage,
  onAddAdjustment
}) {
  const [activeSubTab, setActiveSubTab] = useState('wastage'); // 'wastage' or 'adjustment'

  // Wastage Form State
  const [wIngredientId, setWIngredientId] = useState(inventoryMaster[0]?.id || '');
  const [wQty, setWQty] = useState('');
  const [wReason, setWReason] = useState('Spoilage');
  const [wUser, setWUser] = useState('Kitchen Manager');
  const [wRemarks, setWRemarks] = useState('');

  // Adjustment Form State
  const [aIngredientId, setAIngredientId] = useState(inventoryMaster[0]?.id || '');
  const [aPhysicalStock, setAPhysicalStock] = useState('');
  const [aReason, setAReason] = useState('Physical Audit Count Variance');
  const [aUser, setAUser] = useState('Head Chef');
  const [aRemarks, setARemarks] = useState('');

  const selectedAItem = inventoryMaster.find(i => i.id === aIngredientId) || inventoryMaster[0];
  const systemStock = selectedAItem ? selectedAItem.currentStock : 0;
  const calculatedAdj = selectedAItem && aPhysicalStock !== '' ? (Number(aPhysicalStock) - systemStock) : 0;

  const handleWastageSubmit = (e) => {
    e.preventDefault();
    const item = inventoryMaster.find(i => i.id === wIngredientId);
    if (!item || !wQty || Number(wQty) <= 0) return;

    const entry = {
      id: `wastage-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      ingredientId: item.id,
      ingredientName: item.materialName,
      quantity: Number(wQty),
      unit: item.consumptionUnit || item.unit,
      reason: wReason,
      costValue: Math.round(Number(wQty) * (item.unitCost || 0) * 100) / 100,
      user: wUser.trim() || 'Kitchen Manager',
      remarks: wRemarks.trim()
    };

    onAddWastage(entry);
    setWQty('');
    setWRemarks('');
  };

  const handleAdjustmentSubmit = (e) => {
    e.preventDefault();
    if (!selectedAItem || aPhysicalStock === '' || !aReason.trim()) return;

    const physQty = Number(aPhysicalStock);
    const adjQty = physQty - systemStock;

    const entry = {
      id: `adj-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      ingredientId: selectedAItem.id,
      ingredientName: selectedAItem.materialName,
      previousStock: systemStock,
      adjustment: adjQty,
      newStock: physQty,
      unit: selectedAItem.consumptionUnit || selectedAItem.unit,
      reason: aReason.trim(),
      user: aUser.trim() || 'Audit User',
      remarks: aRemarks.trim()
    };

    onAddAdjustment(entry);
    setAPhysicalStock('');
    setARemarks('');
  };

  return (
    <div className="space-y-6">
      
      {/* Sub-tabs header */}
      <div className="bg-white p-2 rounded-2xl border border-stone-200 shadow-sm flex space-x-2">
        <button
          onClick={() => setActiveSubTab('wastage')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'wastage' ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Wastage Logging</span>
        </button>

        <button
          onClick={() => setActiveSubTab('adjustment')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'adjustment' ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Physical Stock Audit Adjustment</span>
        </button>
      </div>

      {/* WASTAGE LOGGING TAB */}
      {activeSubTab === 'wastage' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-stone-900 mb-4 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-amber-600" />
              Log Kitchen Wastage / Loss
            </h3>

            <form onSubmit={handleWastageSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Ingredient / Raw Material *</label>
                <select
                  value={wIngredientId}
                  onChange={(e) => setWIngredientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                >
                  {inventoryMaster.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.materialName} (Stock: {item.currentStock} {item.consumptionUnit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Wastage Qty *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={wQty}
                  onChange={(e) => setWQty(e.target.value)}
                  placeholder="e.g. 500 (g), 10 (pcs)"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Reason *</label>
                <select
                  value={wReason}
                  onChange={(e) => setWReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                >
                  {WASTAGE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Logged By User</label>
                <input
                  type="text"
                  value={wUser}
                  onChange={(e) => setWUser(e.target.value)}
                  placeholder="Kitchen Manager"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Remarks / Explanation</label>
                <input
                  type="text"
                  value={wRemarks}
                  onChange={(e) => setWRemarks(e.target.value)}
                  placeholder="e.g. Spoilage due to power cut"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  + Record Wastage
                </button>
              </div>
            </form>
          </div>

          {/* Wastage Logs Table */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm overflow-x-auto">
            <h3 className="text-base font-bold text-stone-900 mb-4">Wastage History Log</h3>
            {wastageLogs.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">No wastage logged.</p>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-950 text-amber-100 text-xs font-bold uppercase">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Ingredient Name</th>
                    <th className="py-3 px-4 text-center">Wastage Qty</th>
                    <th className="py-3 px-4 text-center">Reason</th>
                    <th className="py-3 px-4 text-center">User</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-stone-700">
                  {wastageLogs.map(w => (
                    <tr key={w.id} className="hover:bg-amber-50/40">
                      <td className="py-3 px-4 text-xs font-semibold text-stone-500">{w.date}</td>
                      <td className="py-3 px-4 font-bold text-stone-900">{w.ingredientName}</td>
                      <td className="py-3 px-4 text-center font-bold text-rose-700">-{w.quantity} {w.unit}</td>
                      <td className="py-3 px-4 text-center"><span className="px-2.5 py-0.5 rounded bg-rose-50 text-rose-800 text-xs font-bold">{w.reason}</span></td>
                      <td className="py-3 px-4 text-center text-xs">{w.user}</td>
                      <td className="py-3 px-4 text-xs text-stone-500">{w.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT TAB */}
      {activeSubTab === 'adjustment' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-stone-900 mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-600" />
              Physical Audit Stock Adjustment
            </h3>

            <form onSubmit={handleAdjustmentSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Select Ingredient *</label>
                <select
                  value={aIngredientId}
                  onChange={(e) => setAIngredientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                >
                  {inventoryMaster.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.materialName} (System: {item.currentStock} {item.consumptionUnit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Physical Counted Stock *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={aPhysicalStock}
                  onChange={(e) => setAPhysicalStock(e.target.value)}
                  placeholder={`System: ${systemStock}`}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Audit Reason *</label>
                <input
                  type="text"
                  required
                  value={aReason}
                  onChange={(e) => setAReason(e.target.value)}
                  placeholder="Physical Audit Variance"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Audited By User *</label>
                <input
                  type="text"
                  required
                  value={aUser}
                  onChange={(e) => setAUser(e.target.value)}
                  placeholder="Head Chef / Manager"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold"
                />
              </div>

              {selectedAItem && aPhysicalStock !== '' && (
                <div className="lg:col-span-3 text-xs bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-bold text-amber-900 flex justify-between">
                  <span>System Stock: {systemStock} {selectedAItem.consumptionUnit}</span>
                  <span>Physical Stock: {aPhysicalStock} {selectedAItem.consumptionUnit}</span>
                  <span>Calculated Adjustment: <b className={calculatedAdj < 0 ? 'text-rose-600' : 'text-emerald-600'}>{calculatedAdj > 0 ? `+${calculatedAdj}` : calculatedAdj} {selectedAItem.consumptionUnit}</b></span>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  Apply Stock Adjustment
                </button>
              </div>
            </form>
          </div>

          {/* Adjustments History */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm overflow-x-auto">
            <h3 className="text-base font-bold text-stone-900 mb-4">Stock Adjustments History</h3>
            {adjustments.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">No physical audit adjustments recorded.</p>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-950 text-amber-100 text-xs font-bold uppercase">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Ingredient Name</th>
                    <th className="py-3 px-4 text-center">Previous Stock</th>
                    <th className="py-3 px-4 text-center">Adjustment</th>
                    <th className="py-3 px-4 text-center">New Stock</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4 text-center">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-stone-700">
                  {adjustments.map(a => (
                    <tr key={a.id} className="hover:bg-amber-50/40">
                      <td className="py-3 px-4 text-xs font-semibold text-stone-500">{a.date}</td>
                      <td className="py-3 px-4 font-bold text-stone-900">{a.ingredientName}</td>
                      <td className="py-3 px-4 text-center text-xs">{a.previousStock} {a.unit}</td>
                      <td className="py-3 px-4 text-center font-extrabold">
                        <span className={a.adjustment < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {a.adjustment > 0 ? `+${a.adjustment}` : a.adjustment} {a.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-stone-900">{a.newStock} {a.unit}</td>
                      <td className="py-3 px-4 text-xs text-stone-600">{a.reason}</td>
                      <td className="py-3 px-4 text-center text-xs">{a.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
