import React, { useState, useMemo } from 'react';
import { History, Search, ArrowDownRight, ArrowUpRight, Filter, Calendar } from 'lucide-react';

export default function StockLedgerView({ stockLedger }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  const filteredLedger = useMemo(() => {
    return stockLedger.filter(entry => {
      const matchesSearch = entry.ingredientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (entry.transactionId && entry.transactionId.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (entry.user && entry.user.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = typeFilter === 'ALL' || entry.transactionType === typeFilter;
      const matchesDate = !dateFilter || entry.date === dateFilter;
      return matchesSearch && matchesType && matchesDate;
    });
  }, [stockLedger, searchQuery, typeFilter, dateFilter]);

  return (
    <div className="space-y-6">
      
      {/* Control Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ingredient, Tx ID, or user..."
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between">
          
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-700"
          />
          {dateFilter && <button onClick={() => setDateFilter('')} className="text-xs text-rose-600 font-bold">Clear</button>}

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700"
          >
            <option value="ALL">All Transaction Types</option>
            <option value="POS_SALE">POS Sale (Auto Deduct)</option>
            <option value="SALE_REFUND">Sale Refund Reversal</option>
            <option value="PURCHASE">Purchase Stock In</option>
            <option value="WASTAGE">Wastage Stock Out</option>
            <option value="ADJUSTMENT">Physical Audit Adjustment</option>
            <option value="OPENING_STOCK">Opening Stock</option>
          </select>

        </div>
      </div>

      {/* Ledger Audit Table */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm overflow-x-auto">
        <h3 className="text-base font-bold text-stone-900 mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-amber-600" />
          Immutable Stock Movement Audit Ledger
        </h3>

        {filteredLedger.length === 0 ? (
          <p className="text-xs text-stone-400 py-8 text-center">No ledger entries match the criteria.</p>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-stone-950 text-amber-100 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Ingredient Name</th>
                <th className="py-3 px-4 text-center">Tx Type</th>
                <th className="py-3 px-4 text-right">Stock In</th>
                <th className="py-3 px-4 text-right">Stock Out</th>
                <th className="py-3 px-4 text-right">Balance Stock</th>
                <th className="py-3 px-4 text-right">Unit Rate</th>
                <th className="py-3 px-4 text-right">Total Value</th>
                <th className="py-3 px-4 text-center">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-700">
              {filteredLedger.map(entry => {
                let badgeStyle = 'bg-stone-100 text-stone-800';
                if (entry.transactionType === 'POS_SALE') badgeStyle = 'bg-rose-100 text-rose-800';
                else if (entry.transactionType === 'PURCHASE') badgeStyle = 'bg-emerald-100 text-emerald-800';
                else if (entry.transactionType === 'SALE_REFUND') badgeStyle = 'bg-blue-100 text-blue-800';
                else if (entry.transactionType === 'WASTAGE') badgeStyle = 'bg-amber-100 text-amber-900';
                else if (entry.transactionType === 'ADJUSTMENT') badgeStyle = 'bg-purple-100 text-purple-800';

                return (
                  <tr key={entry.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3 px-4 text-xs text-stone-500 whitespace-nowrap">
                      <span className="font-bold text-stone-800 block">{entry.date}</span>
                      <span>{entry.time || ''}</span>
                    </td>

                    <td className="py-3 px-4 font-mono text-xs font-bold text-amber-900">
                      {entry.transactionId}
                    </td>

                    <td className="py-3 px-4 font-bold text-stone-900">
                      {entry.ingredientName}
                      {entry.remarks && <span className="block text-[11px] font-normal text-stone-400">{entry.remarks}</span>}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${badgeStyle}`}>
                        {entry.transactionType}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {entry.stockIn > 0 ? `+${entry.stockIn}` : '—'}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-rose-700">
                      {entry.stockOut > 0 ? `-${entry.stockOut}` : entry.wastage > 0 ? `-${entry.wastage}` : '—'}
                    </td>

                    <td className="py-3 px-4 text-right font-extrabold text-stone-900">
                      {entry.balanceStock}
                    </td>

                    <td className="py-3 px-4 text-right text-xs text-stone-500">
                      ₹{entry.rate}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-amber-900">
                      ₹{entry.totalValue}
                    </td>

                    <td className="py-3 px-4 text-center text-xs text-stone-600">
                      {entry.user || 'System'}
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
