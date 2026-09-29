import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Receipt, 
  Trash2, 
  Edit2, 
  Plus, 
  Search, 
  Filter, 
  Zap, 
  Home, 
  Users, 
  Flame, 
  Wifi, 
  Droplet, 
  Sparkles, 
  Wrench, 
  Package, 
  AlertOctagon, 
  Calendar, 
  ArrowDownRight,
  TrendingDown,
  Clock,
  CheckCircle2,
  FileText
} from 'lucide-react';

export const EXPENSE_CATEGORIES = [
  { id: 'Electricity', label: 'Electricity / Light Bill', icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'Cafe Rent', label: 'Cafe Shop Rent', icon: Home, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'Staff Salary', label: 'Staff Salary & Wages', icon: Users, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'Commercial Gas', label: 'Commercial LPG Gas', icon: Flame, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'Wi-Fi & Internet', label: 'Wi-Fi & Internet', icon: Wifi, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  { id: 'Water & Ice', label: 'Water Jars & Ice', icon: Droplet, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { id: 'Cleaning & Supplies', label: 'Cleaning & Housekeeping', icon: Sparkles, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'Repairs & Maintenance', label: 'Repairs & Maintenance', icon: Wrench, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { id: 'Packaging & Disposable', label: 'Takeaway Packaging', icon: Package, color: 'text-stone-600 bg-stone-100 border-stone-200' },
  { id: 'Miscellaneous', label: 'Other / Misc Expenses', icon: Receipt, color: 'text-amber-800 bg-amber-100/60 border-amber-300' }
];

export const WASTAGE_REASONS = [
  'Spoiled / Rotten (Sadh gaya)',
  'Expired (Date nikal gayi)',
  'Burnt / Overcooked (Jal gaya)',
  'Curdled / Sour (Doodh phat gaya)',
  'Damaged / Dropped (Gira ya tut gaya)',
  'Preparation Loss (Prep loss)',
  'Wrong Order / Preparation',
  'Other'
];

export default function ExpenseTracker({
  expenses = [],
  wastageLogs = [],
  inventoryItems = [],
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onAddWastage,
  onDeleteWastage
}) {
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' or 'wastage'
  
  // Expense Filter State
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'Electricity',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'Online',
    paidTo: '',
    notes: ''
  });

  // Wastage Modal State
  const [isWastageModalOpen, setIsWastageModalOpen] = useState(false);
  const [wastageForm, setWastageForm] = useState({
    ingredientId: inventoryItems[0]?.id || '',
    quantity: '',
    reason: WASTAGE_REASONS[0],
    date: new Date().toISOString().split('T')[0],
    loggedBy: 'Kitchen Chef',
    remarks: ''
  });

  // Selected item for wastage live calculation
  const selectedWastageItem = useMemo(() => {
    return inventoryItems.find(i => i.id === wastageForm.ingredientId) || inventoryItems[0];
  }, [inventoryItems, wastageForm.ingredientId]);

  const estimatedWastageCost = useMemo(() => {
    if (!selectedWastageItem || !wastageForm.quantity) return 0;
    const qty = Number(wastageForm.quantity) || 0;
    const cost = Number(selectedWastageItem.unitCost) || 0;
    return Math.round(qty * cost * 100) / 100;
  }, [selectedWastageItem, wastageForm.quantity]);

  // Derived Financial Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const monthExpenses = useMemo(() => {
    return expenses.filter(e => e.date && e.date.startsWith(currentMonthStr));
  }, [expenses, currentMonthStr]);

  const totalMonthExpenseAmount = useMemo(() => {
    return monthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [monthExpenses]);

  const totalTodayExpenseAmount = useMemo(() => {
    return expenses.filter(e => e.date === todayStr).reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [expenses, todayStr]);

  const totalMonthWastageLoss = useMemo(() => {
    return wastageLogs
      .filter(w => w.date && w.date.startsWith(currentMonthStr))
      .reduce((sum, w) => sum + Number(w.costValue || 0), 0);
  }, [wastageLogs, currentMonthStr]);

  const totalAllWastageLoss = useMemo(() => {
    return wastageLogs.reduce((sum, w) => sum + Number(w.costValue || 0), 0);
  }, [wastageLogs]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = (e.title || '').toLowerCase().includes(expenseSearch.toLowerCase()) ||
                            (e.paidTo || '').toLowerCase().includes(expenseSearch.toLowerCase()) ||
                            (e.notes || '').toLowerCase().includes(expenseSearch.toLowerCase());
      const matchesCat = expenseCategoryFilter === 'ALL' || e.category === expenseCategoryFilter;
      const matchesMonth = !selectedMonth || (e.date && e.date.startsWith(selectedMonth));
      return matchesSearch && matchesCat && matchesMonth;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, expenseSearch, expenseCategoryFilter, selectedMonth]);

  const filteredExpensesTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [filteredExpenses]);

  // Open Expense Modal
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      title: '',
      category: 'Electricity',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      paymentMode: 'Online',
      paidTo: '',
      notes: ''
    });
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (item) => {
    setEditingExpense(item);
    setExpenseForm({
      title: item.title,
      category: item.category,
      amount: item.amount,
      date: item.date,
      paymentMode: item.paymentMode || 'Online',
      paidTo: item.paidTo || '',
      notes: item.notes || ''
    });
    setIsExpenseModalOpen(true);
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    if (!expenseForm.title.trim() || !expenseForm.amount || Number(expenseForm.amount) <= 0) return;

    const payload = {
      id: editingExpense ? editingExpense.id : `exp-${Date.now()}`,
      title: expenseForm.title.trim(),
      category: expenseForm.category,
      amount: Number(expenseForm.amount),
      date: expenseForm.date,
      paymentMode: expenseForm.paymentMode,
      paidTo: expenseForm.paidTo.trim(),
      notes: expenseForm.notes.trim()
    };

    if (editingExpense) {
      onUpdateExpense(payload);
    } else {
      onAddExpense(payload);
    }
    setIsExpenseModalOpen(false);
  };

  // Open Wastage Modal
  const handleOpenAddWastage = () => {
    setWastageForm({
      ingredientId: inventoryItems[0]?.id || '',
      quantity: '',
      reason: WASTAGE_REASONS[0],
      date: new Date().toISOString().split('T')[0],
      loggedBy: 'Kitchen Chef',
      remarks: ''
    });
    setIsWastageModalOpen(true);
  };

  const handleWastageSubmit = (e) => {
    e.preventDefault();
    if (!selectedWastageItem || !wastageForm.quantity || Number(wastageForm.quantity) <= 0) return;

    const qty = Number(wastageForm.quantity);
    const unitCost = Number(selectedWastageItem.unitCost) || 0;
    const lossValue = Math.round(qty * unitCost * 100) / 100;

    const payload = {
      id: `waste-${Date.now()}`,
      date: wastageForm.date,
      ingredientId: selectedWastageItem.id,
      ingredientName: selectedWastageItem.materialName,
      quantity: qty,
      unit: selectedWastageItem.unit,
      reason: wastageForm.reason,
      costValue: lossValue,
      loggedBy: wastageForm.loggedBy.trim() || 'Kitchen Chef',
      remarks: wastageForm.remarks.trim()
    };

    onAddWastage(payload);
    setIsWastageModalOpen(false);
  };

  const getCategoryMeta = (catId) => {
    return EXPENSE_CATEGORIES.find(c => c.id === catId) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
  };

  return (
    <div className="space-y-6">
      
      {/* Top Combined Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Month Overheads */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-stone-400 uppercase">This Month Bills & Rent</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 mt-1">₹{totalMonthExpenseAmount.toLocaleString()}</h3>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Receipt className="w-4 sm:w-5 h-4 sm:h-5" />
          </div>
        </div>

        {/* Today's Overheads */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-stone-400 uppercase">Today's Expenses</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-amber-900 mt-1">₹{totalTodayExpenseAmount.toLocaleString()}</h3>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-4 sm:w-5 h-4 sm:h-5" />
          </div>
        </div>

        {/* Month Wastage Loss */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-stone-400 uppercase">Kharab Maal (Wastage Loss)</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-rose-700 mt-1">₹{totalMonthWastageLoss.toLocaleString()}</h3>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-4 sm:w-5 h-4 sm:h-5" />
          </div>
        </div>

        {/* Total Outflow (Bills + Wastage) */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-stone-400 uppercase">Total Kharcha & Nuksan</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 mt-1">
              ₹{(totalMonthExpenseAmount + totalMonthWastageLoss).toLocaleString()}
            </h3>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
            <TrendingDown className="w-4 sm:w-5 h-4 sm:h-5" />
          </div>
        </div>

      </div>

      {/* Sub-Tab Navigation Switcher */}
      <div className="bg-white p-1.5 sm:p-2 rounded-2xl border border-stone-200 shadow-sm flex gap-2">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'expenses'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>⚡ Cafe Overheads & Bills (Light, Rent, Salary, Gas)</span>
        </button>

        <button
          onClick={() => setActiveTab('wastage')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'wastage'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>🗑️ Raw Material Spoilage / Wastage (Kharab Maal)</span>
        </button>
      </div>

      {/* TAB 1: CAFE BILLS & OVERHEAD EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-stone-200 p-3.5 sm:p-4 shadow-sm space-y-3">
            <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-3 items-stretch lg:items-center justify-between">
              
              {/* Search */}
              <div className="w-full lg:w-72 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  placeholder="Search expense, vendor, notes..."
                  className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* Filters & Add Button */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700"
                  title="Filter by Month"
                />

                <select
                  value={expenseCategoryFilter}
                  onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 flex-1 sm:flex-initial"
                >
                  <option value="ALL">All Categories</option>
                  {EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>

                <button
                  onClick={handleOpenAddExpense}
                  className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Expense / Bill</span>
                </button>
              </div>

            </div>

            {/* Quick Filter Info & Total */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100 text-stone-500">
              <span>Showing {filteredExpenses.length} expense entries</span>
              <span className="font-extrabold text-stone-900">Total in view: ₹{filteredExpensesTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Expenses List */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 shadow-sm">
            <h3 className="text-sm sm:text-base font-bold text-stone-900 mb-4">Bills & Operational Expense Records</h3>

            {filteredExpenses.length === 0 ? (
              <p className="text-xs text-stone-400 py-10 text-center">No expense logs match this month or filter.</p>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-stone-950 text-amber-100 text-xs font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Expense Title</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Paid To / Recipient</th>
                        <th className="py-3 px-4 text-center">Payment Mode</th>
                        <th className="py-3 px-4 text-right">Amount (₹)</th>
                        <th className="py-3 px-4">Notes</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 text-stone-700">
                      {filteredExpenses.map(item => {
                        const catMeta = getCategoryMeta(item.category);
                        const CatIcon = catMeta.icon;

                        return (
                          <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-xs text-stone-500 whitespace-nowrap">{item.date}</td>
                            <td className="py-3.5 px-4 font-bold text-stone-900">{item.title}</td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${catMeta.color}`}>
                                <CatIcon className="w-3 h-3" />
                                <span>{item.category}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-medium text-stone-600">{item.paidTo || '—'}</td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                item.paymentMode === 'Online' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-100 text-stone-700'
                              }`}>
                                {item.paymentMode}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-extrabold text-base text-stone-900">
                              ₹{Number(item.amount).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-stone-500 max-w-xs truncate">{item.notes || '—'}</td>
                            <td className="py-3.5 px-4 text-center space-x-1">
                              <button
                                onClick={() => handleOpenEditExpense(item)}
                                className="p-1.5 text-stone-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg cursor-pointer"
                                title="Edit Expense"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteExpense(item.id)}
                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                title="Delete Expense"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden space-y-3">
                  {filteredExpenses.map(item => {
                    const catMeta = getCategoryMeta(item.category);
                    const CatIcon = catMeta.icon;

                    return (
                      <div key={item.id} className="p-3.5 bg-stone-50/80 border border-stone-200 rounded-2xl space-y-2.5 shadow-2xs">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-bold text-stone-900 text-sm truncate">{item.title}</h4>
                            <span className="text-[10px] text-stone-400 font-semibold">{item.date}</span>
                          </div>
                          <span className="text-base font-extrabold text-stone-900 shrink-0">
                            ₹{Number(item.amount).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-200/60">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${catMeta.color}`}>
                            <CatIcon className="w-3 h-3" />
                            <span>{item.category}</span>
                          </span>

                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              onClick={() => handleOpenEditExpense(item)}
                              className="p-1.5 text-stone-600 hover:text-amber-800 rounded-lg cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteExpense(item.id)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {(item.paidTo || item.notes) && (
                          <div className="text-[11px] text-stone-500 bg-white p-2 rounded-xl border border-stone-200/70">
                            {item.paidTo && <p className="font-semibold text-stone-700">Paid To: {item.paidTo}</p>}
                            {item.notes && <p className="text-stone-500 mt-0.5">{item.notes}</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: RAW MATERIAL WASTAGE & SPOILAGE */}
      {activeTab === 'wastage' && (
        <div className="space-y-4">
          
          {/* Header Action Bar */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
                <span>Raw Material Spoilage / Wastage Log (Kharab Maal)</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Kharab maal log karte hi **current stock se automatically minus ho jayega** aur financial loss report me dikhega.
              </p>
            </div>

            <button
              onClick={handleOpenAddWastage}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Log Kharab Maal / Wastage</span>
            </button>
          </div>

          {/* Wastage Records Table */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm sm:text-base font-bold text-stone-900">Wastage & Spoilage History</h4>
              <span className="text-xs font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                Total Spoilage Loss: ₹{totalAllWastageLoss.toLocaleString()}
              </span>
            </div>

            {wastageLogs.length === 0 ? (
              <p className="text-xs text-stone-400 py-10 text-center">Abhi tak koi kharab maal log nahi hua hai.</p>
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-stone-950 text-amber-100 text-xs font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Raw Material</th>
                        <th className="py-3 px-4 text-center">Wasted Quantity</th>
                        <th className="py-3 px-4">Reason / Wajah</th>
                        <th className="py-3 px-4 text-right">Financial Loss (₹)</th>
                        <th className="py-3 px-4">Logged By</th>
                        <th className="py-3 px-4">Remarks</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 text-stone-700">
                      {wastageLogs.map(item => (
                        <tr key={item.id} className="hover:bg-rose-50/40 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-xs text-stone-500 whitespace-nowrap">{item.date}</td>
                          <td className="py-3.5 px-4 font-bold text-stone-900">{item.ingredientName}</td>
                          <td className="py-3.5 px-4 text-center font-extrabold text-rose-700">
                            {item.quantity} <span className="text-xs font-normal text-stone-500">{item.unit}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              {item.reason}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-base text-rose-700">
                            ₹{Number(item.costValue || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-stone-600">{item.loggedBy || 'Staff'}</td>
                          <td className="py-3.5 px-4 text-xs text-stone-500 max-w-xs truncate">{item.remarks || '—'}</td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => onDeleteWastage(item.id)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-3">
                  {wastageLogs.map(item => (
                    <div key={item.id} className="p-3.5 bg-rose-50/30 border border-rose-200/80 rounded-2xl space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-stone-900 text-sm">{item.ingredientName}</h4>
                          <span className="text-[10px] text-stone-400 font-semibold">{item.date}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-rose-700">₹{Number(item.costValue || 0).toLocaleString()}</span>
                          <p className="text-[11px] font-bold text-stone-600">{item.quantity} {item.unit}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-rose-100">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          {item.reason}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-stone-500">{item.loggedBy}</span>
                          <button
                            onClick={() => onDeleteWastage(item.id)}
                            className="p-1 text-stone-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {item.remarks && (
                        <p className="text-[11px] text-stone-500 bg-white p-2 rounded-xl border border-rose-100">
                          {item.remarks}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

        </div>
      )}

      {/* MODAL 1: ADD / EDIT EXPENSE & BILL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                <span>{editingExpense ? 'Edit Cafe Bill / Expense' : 'Add Cafe Bill / Expense'}</span>
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-3.5">
              
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Expense Title / Description *</label>
                <input
                  type="text"
                  required
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  placeholder="e.g. Electricity Bill April, Shop Rent, Chef Salary, 19kg Gas Cylinder"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Category *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none"
                  >
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="e.g. 4500"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Payment Mode</label>
                  <select
                    value={expenseForm.paymentMode}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none"
                  >
                    <option value="Online">Online / UPI</option>
                    <option value="Cash">Cash (Galla)</option>
                    <option value="NetBanking">Net Banking / Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Paid To / Recipient</label>
                  <input
                    type="text"
                    value={expenseForm.paidTo}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
                    placeholder="e.g. Landlord, Electricity Board, Indane Gas"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Notes / Bill Number</label>
                  <input
                    type="text"
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                    placeholder="e.g. Receipt #4829, AC reading"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-bold text-xs hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {editingExpense ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LOG RAW MATERIAL WASTAGE / SPOILAGE */}
      {isWastageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
                <span>Log Kharab Raw Material (Wastage)</span>
              </h3>
              <button
                onClick={() => setIsWastageModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWastageSubmit} className="space-y-3.5">
              
              {/* Select Raw Material */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Select Raw Material *</label>
                <select
                  value={wastageForm.ingredientId}
                  onChange={(e) => setWastageForm({ ...wastageForm, ingredientId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none"
                >
                  {inventoryItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.materialName} ({item.currentStock} {item.unit} in stock - ₹{item.unitCost || 0}/{item.unit})
                    </option>
                  ))}
                </select>
                {selectedWastageItem && (
                  <p className="text-[11px] text-stone-500 mt-1">
                    Current Available Stock: <strong className="text-stone-900">{selectedWastageItem.currentStock} {selectedWastageItem.unit}</strong> (Est. Cost: ₹{selectedWastageItem.unitCost || 0} per {selectedWastageItem.unit})
                  </p>
                )}
              </div>

              {/* Quantity & Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Kharab Quantity ({selectedWastageItem?.unit || 'Unit'}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="any"
                    value={wastageForm.quantity}
                    onChange={(e) => setWastageForm({ ...wastageForm, quantity: e.target.value })}
                    placeholder={`e.g. 5 ${selectedWastageItem?.unit || ''}`}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Reason / Wajah *</label>
                  <select
                    value={wastageForm.reason}
                    onChange={(e) => setWastageForm({ ...wastageForm, reason: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none"
                  >
                    {WASTAGE_REASONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live Cost Calculation Banner */}
              {estimatedWastageCost > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-900">Estimated Financial Loss:</span>
                  <span className="text-base font-extrabold text-rose-700">₹{estimatedWastageCost.toLocaleString()}</span>
                </div>
              )}

              {/* Date & Logged By */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={wastageForm.date}
                    onChange={(e) => setWastageForm({ ...wastageForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Logged By</label>
                  <input
                    type="text"
                    value={wastageForm.loggedBy}
                    onChange={(e) => setWastageForm({ ...wastageForm, loggedBy: e.target.value })}
                    placeholder="e.g. Kitchen Chef, Barista, Owner"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={wastageForm.remarks}
                  onChange={(e) => setWastageForm({ ...wastageForm, remarks: e.target.value })}
                  placeholder="e.g. Fridge band ho gaya tha, date expire hui"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsWastageModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-bold text-xs hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Deduct Stock & Log Loss
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
