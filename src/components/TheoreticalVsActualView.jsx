import React, { useMemo } from 'react';
import { BarChart2, AlertCircle, CheckCircle2, TrendingUp, DollarSign } from 'lucide-react';
import { calculateTheoreticalVsActualConsumption } from '../utils/inventoryEngine';

export default function TheoreticalVsActualView({
  salesLogs,
  stockLedger,
  inventoryMaster,
  recipesMap,
  subRecipesMap
}) {
  const varianceReport = useMemo(() => {
    return calculateTheoreticalVsActualConsumption(
      salesLogs,
      stockLedger,
      inventoryMaster,
      recipesMap,
      subRecipesMap
    );
  }, [salesLogs, stockLedger, inventoryMaster, recipesMap, subRecipesMap]);

  const totalVarianceCost = varianceReport.reduce((sum, row) => sum + (row.varianceCost > 0 ? row.varianceCost : 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-amber-600" />
            Theoretical vs Actual Consumption Analysis
          </h3>
          <p className="text-xs text-stone-500">
            Compare calculated recipe theoretical ingredient usage against actual physical stock movements & wastage.
          </p>
        </div>

        <div className="bg-rose-50 border border-rose-200 px-4 py-3 rounded-2xl text-right">
          <span className="text-xs font-bold text-rose-800 uppercase block">Total Unexplained Over-Consumption Cost</span>
          <span className="text-2xl font-extrabold text-rose-700">₹{totalVarianceCost.toLocaleString()}</span>
        </div>
      </div>

      {/* Variance Analysis Table */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm overflow-x-auto">
        <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4">
          Ingredient Consumption Variance Table
        </h4>

        {varianceReport.length === 0 ? (
          <p className="text-xs text-stone-400 py-8 text-center">No sales or stock movement data available for variance comparison.</p>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-stone-950 text-amber-100 text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Ingredient Name</th>
                <th className="py-3.5 px-4 text-center">Theoretical Qty (Sales × Recipe)</th>
                <th className="py-3.5 px-4 text-center">Actual Stock Out (Ledger)</th>
                <th className="py-3.5 px-4 text-center">Variance Qty</th>
                <th className="py-3.5 px-4 text-center">Variance %</th>
                <th className="py-3.5 px-4 text-right">Variance Cost Value</th>
                <th className="py-3.5 px-4 text-center">Status Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-700">
              {varianceReport.map(row => {
                const isOver = row.variance > 0;
                const isExact = row.variance === 0;

                return (
                  <tr key={row.ingredientId} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-stone-900">
                      {row.name}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-stone-700">
                      {row.theoreticalQty} <span className="text-xs font-normal text-stone-500">{row.unit}</span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-stone-900">
                      {row.actualQty} <span className="text-xs font-normal text-stone-500">{row.unit}</span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-extrabold">
                      <span className={isOver ? 'text-rose-700' : isExact ? 'text-stone-700' : 'text-emerald-700'}>
                        {row.variance > 0 ? `+${row.variance}` : row.variance} {row.unit}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs ${
                        isOver ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {row.variancePercent > 0 ? `+${row.variancePercent}%` : `${row.variancePercent}%`}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold text-amber-900">
                      ₹{row.varianceCost}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {isOver ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                          Over-Consumed (Wastage/Loss)
                        </span>
                      ) : isExact ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700">
                          Exact Match
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          Under-Consumed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
