import React, { useState, useMemo } from 'react';
import { 
  X, 
  BookOpen, 
  Search, 
  UserCheck, 
  IndianRupee, 
  Phone, 
  Send, 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle2, 
  Receipt, 
  ArrowDownLeft, 
  ArrowUpRight,
  Sparkles,
  MessageCircle,
  FileSpreadsheet
} from 'lucide-react';
import { getTodayDateString } from '../utils/storage';

export default function CustomerKhataModal({
  isOpen,
  onClose,
  khataLedger = [],
  onAddKhataTransaction,
  currentCafe,
  showToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  
  // Payment Collection Modal State
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [collectCustomer, setCollectCustomer] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectPaymentMode, setCollectPaymentMode] = useState('Cash'); // 'Cash' | 'Online'
  const [collectNotes, setCollectNotes] = useState('');

  // Manual New Khata Entry Modal State
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  // 1. Group ledger entries by customer (identifying by phone or normalized name)
  const customerSummaries = useMemo(() => {
    const map = {};

    khataLedger.forEach(entry => {
      const key = (entry.customerPhone && entry.customerPhone.trim()) 
        ? entry.customerPhone.trim() 
        : (entry.customerName || 'Customer').trim().toLowerCase();
      
      if (!map[key]) {
        map[key] = {
          id: key,
          name: entry.customerName || 'Customer',
          phone: entry.customerPhone || '',
          totalDebit: 0,  // purchases on credit
          totalCredit: 0, // payments made
          balance: 0,     // outstanding due
          transactions: [],
          lastActivityDate: entry.date
        };
      }

      const amt = Number(entry.amount) || 0;
      if (entry.type === 'debit') {
        map[key].totalDebit += amt;
      } else if (entry.type === 'credit') {
        map[key].totalCredit += amt;
      }
      map[key].transactions.push(entry);

      // Keep latest name & phone if updated
      if (entry.customerName) map[key].name = entry.customerName;
      if (entry.customerPhone) map[key].phone = entry.customerPhone;
      if (entry.date >= map[key].lastActivityDate) {
        map[key].lastActivityDate = entry.date;
      }
    });

    // Calculate balances and sort transactions
    return Object.values(map).map(c => {
      const balance = c.totalDebit - c.totalCredit;
      const sortedTxs = [...c.transactions].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
      return {
        ...c,
        balance,
        transactions: sortedTxs
      };
    }).sort((a, b) => b.balance - a.balance); // Highest balance first
  }, [khataLedger]);

  // Overall metrics
  const totalOutstanding = useMemo(() => {
    return customerSummaries.reduce((sum, c) => sum + Math.max(0, c.balance), 0);
  }, [customerSummaries]);

  const totalCollected = useMemo(() => {
    return khataLedger
      .filter(k => k.type === 'credit')
      .reduce((sum, k) => sum + (Number(k.amount) || 0), 0);
  }, [khataLedger]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customerSummaries;
    return customerSummaries.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.phone && c.phone.includes(q))
    );
  }, [customerSummaries, searchQuery]);

  // Selected customer for passbook view
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customerSummaries.find(c => c.id === selectedCustomerId) || null;
  }, [customerSummaries, selectedCustomerId]);

  if (!isOpen) return null;

  // Open collection modal
  const handleOpenCollect = (customer) => {
    setCollectCustomer(customer);
    setCollectAmount(String(Math.max(0, customer.balance)));
    setCollectPaymentMode('Cash');
    setCollectNotes('Udhar payment received');
    setIsCollectModalOpen(true);
  };

  // Submit payment reception (Vasooli)
  const handleSubmitCollect = (e) => {
    e.preventDefault();
    if (!collectCustomer) return;
    const amount = Number(collectAmount) || 0;
    if (amount <= 0) {
      if (showToast) showToast('Kripya 0 se zyada amount dalein!');
      return;
    }

    const tx = {
      id: `khata-cr-${Date.now()}`,
      type: 'credit',
      customerName: collectCustomer.name,
      customerPhone: collectCustomer.phone,
      amount: amount,
      orderToken: 'VASOOLI',
      itemsSummary: `Payment via ${collectPaymentMode === 'Cash' ? 'Cash' : 'UPI'}`,
      date: getTodayDateString(0),
      paymentMode: collectPaymentMode,
      createdAt: new Date().toISOString(),
      notes: collectNotes.trim() || 'Payment received',
      isSettled: true
    };

    if (onAddKhataTransaction) {
      onAddKhataTransaction(tx);
    }

    setIsCollectModalOpen(false);
    if (showToast) {
      showToast(`✅ ₹${amount} received from ${collectCustomer.name}!`);
    }
  };

  // Submit manual Khata entry
  const handleSubmitManualEntry = (e) => {
    e.preventDefault();
    const amount = Number(manualAmount) || 0;
    if (!manualName.trim() || amount <= 0) {
      if (showToast) showToast('Customer ka naam aur amount bharna zaroori hai!');
      return;
    }

    const tx = {
      id: `khata-dr-${Date.now()}`,
      type: 'debit',
      customerName: manualName.trim(),
      customerPhone: manualPhone.trim() || undefined,
      amount: amount,
      orderToken: 'KHATA-OLD',
      itemsSummary: manualNotes.trim() || 'Previous offline balance',
      date: getTodayDateString(0),
      createdAt: new Date().toISOString(),
      notes: manualNotes.trim() || undefined,
      isSettled: false
    };

    if (onAddKhataTransaction) {
      onAddKhataTransaction(tx);
    }

    setIsManualEntryOpen(false);
    setManualName('');
    setManualPhone('');
    setManualAmount('');
    setManualNotes('');
    if (showToast) {
      showToast(`✅ ₹${amount} added to ${manualName}'s Khata!`);
    }
  };

  // Send WhatsApp Reminder
  const handleSendReminder = (customer) => {
    const cafeName = currentCafe?.cafeName || 'S&S Cafe';
    const text = `Namaste ${customer.name} ji! 🙏\n\n` +
      `Aapka *${cafeName}* par kul *₹${customer.balance}* ka baki hisab (Khata / Udhar) pending hai.\n\n` +
      `Kripya suvidhanusar cash ya UPI dwara bhugtan karein.\n` +
      `Dhanyawad! ✨`;

    const phone = (customer.phone || '').replace(/[^0-9]/g, '');
    let url = `https://wa.me/`;
    if (phone.length === 10) {
      url += `91${phone}?text=${encodeURIComponent(text)}`;
    } else if (phone.length > 10) {
      url += `${phone}?text=${encodeURIComponent(text)}`;
    } else {
      url += `?text=${encodeURIComponent(text)}`;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden text-white flex flex-col my-auto max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-serif-title text-slate-100">
                  Customer Khata & Udhar Ledger
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Credit Book
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Track customer balances, log payments received, and send WhatsApp reminders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 sm:p-5 border-b border-slate-800 bg-slate-950/40">
          
          {/* Total Baki */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-950/40 to-slate-900 border border-rose-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider">
                Total Outstanding Udhar (Baki)
              </span>
              <div className="font-mono text-xl sm:text-2xl font-black text-rose-300 mt-0.5">
                ₹{totalOutstanding}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>

          {/* Active Customers */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
                Khata Customers
              </span>
              <div className="font-mono text-xl sm:text-2xl font-black text-amber-300 mt-0.5">
                {customerSummaries.length}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Recovered Payments */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                Total Vasooli (Recovered)
              </span>
              <div className="font-mono text-xl sm:text-2xl font-black text-emerald-300 mt-0.5">
                ₹{totalCollected}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 sm:px-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 bg-slate-900">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer by name or phone..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsManualEntryOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Naya Khata Add Karein</span>
            </button>
          </div>
        </div>

        {/* Two-Column / Split Layout: Customer List vs Passbook View */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-[350px]">
          
          {/* Column 1: Customer List (5 cols) */}
          <div className="md:col-span-5 border-r border-slate-800 overflow-y-auto divide-y divide-slate-800/70 p-2 sm:p-3 space-y-1.5 max-h-[50vh] md:max-h-[52vh]">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="text-xs font-semibold">Koi customer nahi mila</p>
              </div>
            ) : (
              filteredCustomers.map(customer => {
                const isSelected = selectedCustomerId === customer.id;
                const hasDue = customer.balance > 0;

                return (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className={`p-3 rounded-2xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-slate-800 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-slate-850/50 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                          {customer.name}
                        </h4>
                        {customer.phone && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{customer.phone}</span>
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-1">
                          Last active: {customer.lastActivityDate}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Baki Rakam
                        </span>
                        <span className={`font-mono text-sm font-black ${
                          hasDue ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          ₹{customer.balance}
                        </span>
                      </div>
                    </div>

                    {/* Quick Action Buttons inside Card */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCollect(customer);
                        }}
                        disabled={customer.balance <= 0}
                        className="flex-1 py-1 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all text-center"
                      >
                        Vasooli (जमा)
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendReminder(customer);
                        }}
                        disabled={customer.balance <= 0}
                        className="py-1 px-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 text-[10px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                        title="WhatsApp Reminder"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>Reminder</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Column 2: Passbook / Transaction Ledger Details (7 cols) */}
          <div className="md:col-span-7 p-4 sm:p-5 overflow-y-auto max-h-[50vh] md:max-h-[52vh] flex flex-col">
            {selectedCustomer ? (
              <div className="space-y-4">
                
                {/* Customer Details Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-850 to-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      <span>{selectedCustomer.name}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                        Passbook
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {selectedCustomer.phone ? `Phone: ${selectedCustomer.phone}` : 'No phone number provided'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenCollect(selectedCustomer)}
                      disabled={selectedCustomer.balance <= 0}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      जमा करें (Receive Payment)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendReminder(selectedCustomer)}
                      disabled={selectedCustomer.balance <= 0}
                      className="p-2 bg-green-600/30 hover:bg-green-600/50 text-green-300 border border-green-500/40 rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      title="Send WhatsApp Reminder"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Ledger Transactions Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Transaction History (Khata Passbook)
                  </h4>

                  <div className="bg-slate-950/70 rounded-2xl border border-slate-800/90 divide-y divide-slate-800/80">
                    {selectedCustomer.transactions.map((tx) => (
                      <div key={tx.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-start gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            tx.type === 'debit' 
                              ? 'bg-rose-500/20 text-rose-400' 
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {tx.type === 'debit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-200">
                                {tx.type === 'debit' ? 'Purchased on Credit (Udhar)' : 'Payment Received (Vasooli)'}
                              </span>
                              {tx.orderToken && (
                                <span className="font-mono text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                  {tx.orderToken}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {tx.itemsSummary || tx.notes || 'Items'}
                            </p>
                            <span className="text-[10px] text-slate-500">
                              {tx.date} {tx.createdAt ? `• ${new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`font-mono text-sm font-black ${
                            tx.type === 'debit' ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {tx.type === 'debit' ? '+' : '-'}₹{tx.amount}
                          </span>
                          <span className="block text-[10px] text-slate-500 uppercase">
                            {tx.type === 'debit' ? 'Udhar Bada' : 'Udhar Kam'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-2">
                <BookOpen className="w-10 h-10 opacity-30" />
                <p className="text-xs font-semibold text-slate-400">
                  Left side se koi customer select karein
                </p>
                <p className="text-[11px] text-slate-500">
                  Uski poori passbook, orders aur payment history yahan dikhegi
                </p>
              </div>
            )}
          </div>

        </div>

        {/* 💵 SUB-MODAL 1: Receive Payment (Udhar Vasooli) */}
        {isCollectModalOpen && collectCustomer && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white">
                  Payment Vasooli (जमा करें)
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 text-xs">
                <span className="text-slate-400">Customer:</span>
                <span className="font-bold text-white ml-1.5">{collectCustomer.name}</span>
                <div className="mt-1">
                  <span className="text-slate-400">Total Baki:</span>
                  <span className="font-mono font-black text-rose-400 ml-1.5">₹{collectCustomer.balance}</span>
                </div>
              </div>

              <form onSubmit={handleSubmitCollect} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Amount Received (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    required
                  />
                  <div className="flex gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setCollectAmount(String(collectCustomer.balance))}
                      className="text-[10px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 px-2 py-0.5 rounded cursor-pointer"
                    >
                      Full Settle (₹{collectCustomer.balance})
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Payment Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCollectPaymentMode('Cash')}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        collectPaymentMode === 'Cash'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      💵 Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollectPaymentMode('Online')}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        collectPaymentMode === 'Online'
                          ? 'bg-sky-600 text-white border-sky-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      📱 UPI / Bank QR
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Remarks / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={collectNotes}
                    onChange={(e) => setCollectNotes(e.target.value)}
                    placeholder="e.g. Paid in cash at counter"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/30 cursor-pointer transition-all"
                >
                  Payment Save Karein (Record Receipt)
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 📝 SUB-MODAL 2: Add Manual Khata Balance */}
        {isManualEntryOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white">
                  Naya Customer Khata / Udhar Add Karein
                </h3>
                <button
                  type="button"
                  onClick={() => setIsManualEntryOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitManualEntry} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Customer Ka Naam *
                  </label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g. Manish Bhai (Shop 3)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Mobile Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="10 digit number"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Initial Udhar Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    placeholder="e.g. 250"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Remarks / Items
                  </label>
                  <input
                    type="text"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="e.g. 2 cold coffee, 1 burger"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                >
                  Khata Save Karein
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
