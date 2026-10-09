import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Search,
  UserCheck,
  UserX,
  ExternalLink,
  Download,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  LogOut,
  Store,
  Users,
  Activity,
  CreditCard,
  Sparkles,
  Copy,
  Check,
  Building,
  Calendar,
  Clock,
  ChevronRight,
  Sliders,
  DollarSign
} from 'lucide-react';
import {
  getAdminUsers,
  getAdminLoginHistory,
  updateAdminUser,
  deleteAdminUser,
  verifyMasterAdmin,
  getMasterAdminConfig,
  updateMasterAdminConfig,
  recordUserSignup
} from '../utils/adminAudit';
import { setLocalActiveCafe, setLocalUserSession } from '../utils/auth';

export default function AdminPortal({ onExit, onSwitchCafe }) {
  // Master Admin Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('ss_super_admin_authenticated') === 'true';
  });
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Main Dashboard State
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'logins' | 'plans' | 'settings'
  const [users, setUsers] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Password visibility map (userId -> boolean)
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // New Cafe Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    cafeName: '',
    ownerName: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    plan: 'Pro Growth'
  });

  // Settings state
  const [masterConfig, setMasterConfig] = useState(getMasterAdminConfig());
  const [settingsMsg, setSettingsMsg] = useState(null);

  // Load Admin Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersList, historyList] = await Promise.all([
        getAdminUsers(),
        getAdminLoginHistory()
      ]);
      setUsers(usersList);
      setLoginLogs(historyList);
    } catch (e) {
      console.error('Error loading admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // Handle Master Admin Login
  const handleAdminLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    if (verifyMasterAdmin(adminUsername, adminPassword)) {
      sessionStorage.setItem('ss_super_admin_authenticated', 'true');
      setIsAuthenticated(true);
      loadData();
    } else {
      setAuthError('Galat Admin Username ya Password! Kripya dobara check karein.');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('ss_super_admin_authenticated');
    setIsAuthenticated(false);
    setAdminPassword('');
  };

  // Toggle password visibility
  const togglePasswordReveal = (id) => {
    setRevealedPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy password to clipboard
  const handleCopyPassword = (id, pwd) => {
    navigator.clipboard.writeText(pwd || '');
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle user active status
  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';
    await updateAdminUser(user.uid || user.id, { status: nextStatus });
    setUsers(prev => prev.map(u => (u.uid === user.uid || u.id === user.id) ? { ...u, status: nextStatus } : u));
  };

  // Change user subscription plan
  const handleChangePlan = async (user, newPlan) => {
    await updateAdminUser(user.uid || user.id, { plan: newPlan });
    setUsers(prev => prev.map(u => (u.uid === user.uid || u.id === user.id) ? { ...u, plan: newPlan } : u));
  };

  // Delete user
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Kya aap "${user.cafeName}" (${user.email}) ko Admin directory se delete karna chahte hain?`)) {
      return;
    }
    await deleteAdminUser(user.uid || user.id);
    setUsers(prev => prev.filter(u => u.uid !== user.uid && u.id !== user.id));
  };

  // Impersonate / Login as this cafe
  const handleImpersonateCafe = (user) => {
    const cafeProfile = {
      cafeId: user.uid || user.id,
      ownerUid: user.uid || user.id,
      cafeName: user.cafeName,
      ownerName: user.ownerName,
      ownerEmail: user.email,
      phone: user.phone || '',
      city: user.city || '',
      currency: '₹',
      role: 'owner',
      createdAt: user.registeredAt || new Date().toISOString(),
      isPrimary: true
    };
    const userSession = {
      uid: user.uid || user.id,
      email: user.email,
      displayName: user.ownerName || user.cafeName,
      isAnonymous: false
    };

    setLocalActiveCafe(cafeProfile);
    setLocalUserSession(userSession);

    if (onSwitchCafe) {
      onSwitchCafe(cafeProfile);
    }
    if (onExit) {
      onExit();
    }
  };

  // Add New Cafe Manually
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserForm.cafeName || !newUserForm.email || !newUserForm.password) {
      alert('Kripya Cafe Name, Email aur Password bharein!');
      return;
    }
    const created = await recordUserSignup(newUserForm);
    setUsers(prev => [created, ...prev]);
    setIsAddUserOpen(false);
    setNewUserForm({
      cafeName: '',
      ownerName: '',
      email: '',
      password: '',
      phone: '',
      city: '',
      plan: 'Pro Growth'
    });
  };

  // Save Master Settings
  const handleSaveMasterSettings = (e) => {
    e.preventDefault();
    const updated = updateMasterAdminConfig(masterConfig);
    if (updated) {
      setSettingsMsg({ type: 'success', text: '✅ Master Admin credentials successfully update ho gaye!' });
      setTimeout(() => setSettingsMsg(null), 3500);
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (u.cafeName || '').toLowerCase().includes(q) ||
        (u.ownerName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q) ||
        (u.city || '').toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      const matchesPlan = planFilter === 'all' || u.plan === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [users, searchQuery, statusFilter, planFilter]);

  // Export Users to CSV
  const handleExportCSV = () => {
    if (users.length === 0) return;
    const headers = ['Cafe Name', 'Owner Name', 'Email', 'Password', 'Phone', 'City', 'Plan', 'Status', 'Registered Date', 'Last Login', 'Login Count'];
    const rows = users.map(u => [
      `"${u.cafeName || ''}"`,
      `"${u.ownerName || ''}"`,
      `"${u.email || ''}"`,
      `"${u.password || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.city || ''}"`,
      `"${u.plan || 'Pro Growth'}"`,
      `"${u.status || 'active'}"`,
      `"${u.registeredAt ? new Date(u.registeredAt).toLocaleDateString() : ''}"`,
      `"${u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : ''}"`,
      u.loginCount || 1
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SS_Cafe_Users_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================================================================
  // 1. GATEWAY SCREEN (IF NOT YET AUTHENTICATED AS MASTER ADMIN)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-slate-950 to-stone-900 text-stone-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-stone-900/90 backdrop-blur-xl border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 shadow-lg shadow-amber-500/20 mb-1">
              <ShieldCheck className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-black font-serif-title tracking-tight text-amber-100">
              Super Admin Gateway
            </h1>
            <p className="text-xs text-stone-400">
              S&S Cafe Enterprise Master Control & User Directory
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] font-extrabold uppercase tracking-widest mt-1">
              <Lock className="w-3 h-3" />
              <span>Restricted Access Area</span>
            </div>
          </div>

          {/* Error Banner */}
          {authError && (
            <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-stone-400 uppercase tracking-wider mb-1.5">
                Master Admin Username / Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin@sscafe.com or admin"
                  className="w-full px-4 py-3 bg-stone-950 border border-stone-800 rounded-2xl text-xs sm:text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-stone-400 uppercase tracking-wider mb-1.5">
                Master Password or Security PIN
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Master Admin Password (Default: admin)"
                  className="w-full px-4 py-3 bg-stone-950 border border-stone-800 rounded-2xl text-xs sm:text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>

            {/* Quick Demo Autofill Helper */}
            <div className="p-3 bg-stone-950/70 border border-stone-800/80 rounded-xl text-[11px] text-stone-400 flex items-center justify-between">
              <span>Default Key: <strong>admin</strong> / <strong>admin</strong></span>
              <button
                type="button"
                onClick={() => {
                  setAdminUsername('admin');
                  setAdminPassword('admin');
                }}
                className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
              >
                Autofill
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Admin Portal</span>
            </button>
          </form>

          {/* Exit Link */}
          <div className="mt-6 pt-4 border-t border-stone-800/80 text-center">
            <button
              type="button"
              onClick={onExit}
              className="text-xs text-stone-500 hover:text-stone-300 transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Cafe POS Screen</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. SUPER ADMIN PORTAL DASHBOARD (AUTHENTICATED)
  // =========================================================================
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      
      {/* Top Super Admin Navigation Header */}
      <header className="bg-stone-900 border-b border-stone-800 sticky top-0 z-40 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 shadow-md shadow-amber-500/20">
            <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black font-serif-title text-amber-100">
                S&S Cafe — Super Admin Central
              </h1>
              <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ROOT ADMIN</span>
              </span>
            </div>
            <p className="text-[11px] text-stone-400">Master Directory • Passwords & IDs • Activity Audit Stream</p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl transition-all cursor-pointer border border-stone-700"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Return to regular Cafe POS"
          >
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Go to POS Screen</span>
          </button>

          <button
            type="button"
            onClick={handleAdminLogout}
            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl transition-all cursor-pointer"
            title="Lock & Logout Admin Portal"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">

        {/* TOP STATS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-1 relative overflow-hidden shadow-xs">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Registered Cafes</span>
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-100">{users.length}</div>
            <p className="text-[10px] text-emerald-400 font-bold">100% Active in Database</p>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-1 relative overflow-hidden shadow-xs">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>Login Sessions Tracked</span>
            </span>
            <div className="text-2xl sm:text-3xl font-black text-sky-200">{loginLogs.length}</div>
            <p className="text-[10px] text-stone-400 font-semibold">Audit trail active</p>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-1 relative overflow-hidden shadow-xs">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pro / Enterprise Users</span>
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-300">
              {users.filter(u => u.plan === 'Pro Growth' || u.plan === 'Enterprise').length}
            </div>
            <p className="text-[10px] text-emerald-400 font-bold">Paying Customers</p>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-1 relative overflow-hidden shadow-xs">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-purple-400" />
              <span>Estimated SaaS ARR</span>
            </span>
            <div className="text-2xl sm:text-3xl font-black text-purple-200">
              ₹{(users.filter(u => u.plan === 'Pro Growth').length * 999 + users.filter(u => u.plan === 'Enterprise').length * 2499) * 12}
            </div>
            <p className="text-[10px] text-stone-400 font-semibold">Annual Projected Revenue</p>
          </div>

        </div>

        {/* TABS SELECTOR */}
        <div className="bg-stone-900 border border-stone-800 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'users', label: '👥 Registered Cafes & Passwords', badge: users.length },
            { id: 'logins', label: '📋 Live Login Audit Trail', badge: loginLogs.length },
            { id: 'plans', label: '💳 Subscription Plans', badge: null },
            { id: 'settings', label: '⚙️ Master Admin Security', badge: null }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  activeTab === tab.id ? 'bg-stone-950 text-amber-300' : 'bg-stone-800 text-stone-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ================================================================= */}
        {/* TAB 1: REGISTERED CAFES & USERS DIRECTORY (PASSWORDS & IDS)       */}
        {/* ================================================================= */}
        {activeTab === 'users' && (
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-sm">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by cafe name, owner, email, phone, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs font-semibold text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Filters & Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="px-2.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs font-bold text-stone-300 focus:outline-none"
                >
                  <option value="all">All Plans</option>
                  <option value="Free Starter">Free Starter</option>
                  <option value="Pro Growth">Pro Growth</option>
                  <option value="Enterprise">Enterprise</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs font-bold text-stone-300 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Export to CSV / Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(true)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add Cafe</span>
                </button>
              </div>

            </div>

            {/* Users Directory Table */}
            <div className="overflow-x-auto rounded-2xl border border-stone-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-950 text-stone-400 uppercase font-black text-[10px] tracking-wider border-b border-stone-800">
                  <tr>
                    <th className="px-4 py-3">Cafe & Owner</th>
                    <th className="px-4 py-3">Login Email / Auth ID</th>
                    <th className="px-4 py-3">Captured Password</th>
                    <th className="px-4 py-3">Phone & City</th>
                    <th className="px-4 py-3">Plan / Status</th>
                    <th className="px-4 py-3">Activity</th>
                    <th className="px-4 py-3 text-right">Master Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-medium">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-stone-500 text-xs">
                        Koi bhi registered user ya cafe nahi mila.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isPwdVisible = !!revealedPasswords[user.uid || user.id];
                      return (
                        <tr key={user.uid || user.id} className="hover:bg-stone-800/40 transition-colors">
                          
                          {/* Cafe & Owner */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 text-stone-950 font-black flex items-center justify-center text-xs shrink-0">
                                {(user.cafeName || 'C').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-extrabold text-stone-100">{user.cafeName || 'My Cafe'}</div>
                                <div className="text-[11px] text-stone-400 font-semibold">{user.ownerName || 'Cafe Owner'}</div>
                              </div>
                            </div>
                          </td>

                          {/* Email & UID */}
                          <td className="px-4 py-3 font-mono">
                            <div className="text-amber-300 font-bold text-[11px]">{user.email}</div>
                            <div className="text-[9px] text-stone-500 truncate max-w-[120px]" title={user.uid}>
                              ID: {user.uid ? user.uid.slice(0, 14) : 'local'}...
                            </div>
                          </td>

                          {/* Password */}
                          <td className="px-4 py-3">
                            <div className="inline-flex items-center gap-1.5 bg-stone-950 px-2.5 py-1 rounded-xl border border-stone-800">
                              <KeyRound className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="font-mono font-bold text-xs text-amber-200">
                                {isPwdVisible ? (user.password || 'N/A') : '••••••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordReveal(user.uid || user.id)}
                                className="p-1 hover:text-white text-stone-400 transition-colors cursor-pointer"
                                title={isPwdVisible ? 'Hide Password' : 'Show Password'}
                              >
                                {isPwdVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyPassword(user.uid || user.id, user.password)}
                                className="p-1 hover:text-emerald-400 text-stone-400 transition-colors cursor-pointer"
                                title="Copy Password"
                              >
                                {copiedId === (user.uid || user.id) ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Phone & City */}
                          <td className="px-4 py-3 text-stone-300">
                            <div>{user.phone ? `+91 ${user.phone}` : '—'}</div>
                            <div className="text-[10px] text-stone-500">{user.city || 'India'}</div>
                          </td>

                          {/* Plan / Status */}
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black ${
                                user.plan === 'Enterprise'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : user.plan === 'Pro Growth'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-stone-800 text-stone-400 border border-stone-700'
                              }`}>
                                {user.plan || 'Pro Growth'}
                              </span>
                              <div>
                                <span className={`inline-block px-2 py-0.2 rounded-full text-[9px] font-extrabold ${
                                  user.status === 'suspended'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}>
                                  {user.status === 'suspended' ? 'Suspended' : 'Active'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Activity */}
                          <td className="px-4 py-3 text-stone-400 text-[11px]">
                            <div>Logins: <strong className="text-white">{user.loginCount || 1}</strong></div>
                            <div className="text-[10px] text-stone-500">
                              {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              
                              {/* Impersonate / Login as Cafe */}
                              <button
                                type="button"
                                onClick={() => handleImpersonateCafe(user)}
                                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                                title="Login & open this Cafe's POS dashboard"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Login As Cafe</span>
                              </button>

                              {/* Toggle Status */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(user)}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  user.status === 'suspended'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                                    : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-amber-400'
                                }`}
                                title={user.status === 'suspended' ? 'Activate Account' : 'Suspend Account'}
                              >
                                {user.status === 'suspended' ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition-colors cursor-pointer"
                                title="Delete Cafe from Directory"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: LIVE LOGIN AUDIT TRAIL STREAM                              */}
        {/* ================================================================= */}
        {activeTab === 'logins' && (
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-amber-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-400" />
                  <span>Real-Time Login & Auth Audit Trail</span>
                </h3>
                <p className="text-xs text-stone-400">Chronological history of every login and registration event</p>
              </div>
              <span className="text-xs font-mono font-bold bg-stone-950 px-3 py-1 rounded-xl border border-stone-800 text-stone-300">
                {loginLogs.length} events logged
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-stone-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-950 text-stone-400 uppercase font-black text-[10px] tracking-wider border-b border-stone-800">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">User Email & Cafe</th>
                    <th className="px-4 py-3">Captured Credential</th>
                    <th className="px-4 py-3">Event Type</th>
                    <th className="px-4 py-3">Device / Client</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-medium">
                  {loginLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-800/40 transition-colors">
                      <td className="px-4 py-3 text-stone-400 font-mono text-[11px] whitespace-nowrap">
                        <Clock className="w-3 h-3 inline mr-1 text-stone-500" />
                        {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{log.email}</div>
                        <div className="text-[10px] text-stone-400">{log.cafeName || 'Cafe Account'}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-amber-200">
                        {log.password || '••••••••'}
                      </td>
                      <td className="px-4 py-3 text-stone-300">
                        <span className="bg-stone-950 px-2 py-0.5 rounded-md border border-stone-800 font-semibold text-[10px]">
                          {log.eventType || 'User Login'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-400 text-[11px]">
                        {log.device || 'Web Browser'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          (log.status || '').toLowerCase().includes('success')
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {log.status || 'Success'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: SUBSCRIPTIONS & COMMERCIAL PLANS                           */}
        {/* ================================================================= */}
        {activeTab === 'plans' && (
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-4 sm:p-6 space-y-6 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-amber-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-400" />
                <span>Subscription Plans & Monetization Control</span>
              </h3>
              <p className="text-xs text-stone-400">Manage pricing tiers, multi-outlet licenses, and payment gateways</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Plan 1 */}
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-stone-200">Free Starter</h4>
                  <span className="text-[10px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded font-bold">Trial / Free</span>
                </div>
                <div className="text-2xl font-black text-white">₹0<span className="text-xs text-stone-400 font-normal"> / month</span></div>
                <ul className="text-xs text-stone-400 space-y-1.5 list-disc pl-4">
                  <li>Up to 25 Menu Items</li>
                  <li>Single Outlet POS Counter</li>
                  <li>Local Storage Mode</li>
                </ul>
                <div className="text-[11px] text-amber-400 font-bold">
                  {users.filter(u => u.plan === 'Free Starter').length} Active Cafes
                </div>
              </div>

              {/* Plan 2 */}
              <div className="bg-gradient-to-br from-amber-950/40 to-stone-950 border border-amber-500/40 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-2 right-2 bg-amber-500 text-stone-950 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                  Most Popular
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-amber-200">Pro Growth</h4>
                </div>
                <div className="text-2xl font-black text-amber-100">₹999<span className="text-xs text-stone-400 font-normal"> / month</span></div>
                <ul className="text-xs text-stone-300 space-y-1.5 list-disc pl-4">
                  <li>Unlimited Menu & Recipe BOM</li>
                  <li>Silent WhatsApp E-Bill Gateway</li>
                  <li>Cloud Sync & Multi-Device</li>
                  <li>Dine-In QR Table Ordering</li>
                </ul>
                <div className="text-[11px] text-emerald-400 font-bold">
                  {users.filter(u => u.plan === 'Pro Growth').length} Active Cafes
                </div>
              </div>

              {/* Plan 3 */}
              <div className="bg-stone-950 border border-purple-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-purple-200">Enterprise Franchise</h4>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold">Multi-Outlet</span>
                </div>
                <div className="text-2xl font-black text-white">₹2,499<span className="text-xs text-stone-400 font-normal"> / month</span></div>
                <ul className="text-xs text-stone-400 space-y-1.5 list-disc pl-4">
                  <li>Unlimited Outlets / Branches</li>
                  <li>Aggregator Auto-Reconciliation</li>
                  <li>Telegram Auto Stock Alerts</li>
                  <li>Dedicated Priority Support</li>
                </ul>
                <div className="text-[11px] text-purple-400 font-bold">
                  {users.filter(u => u.plan === 'Enterprise').length} Active Cafes
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: MASTER ADMIN SECURITY & SETTINGS                           */}
        {/* ================================================================= */}
        {activeTab === 'settings' && (
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-4 sm:p-6 space-y-6 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-amber-100 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Super Admin Security & Master Credentials</span>
              </h3>
              <p className="text-xs text-stone-400">Change your master login ID, password, or security PIN for `/admin`</p>
            </div>

            {settingsMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold">
                {settingsMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveMasterSettings} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-extrabold text-stone-400 uppercase tracking-wider mb-1">
                  Master Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={masterConfig.adminEmail}
                  onChange={(e) => setMasterConfig({ ...masterConfig, adminEmail: e.target.value })}
                  className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-400 uppercase tracking-wider mb-1">
                  Master Admin Username
                </label>
                <input
                  type="text"
                  required
                  value={masterConfig.adminUsername}
                  onChange={(e) => setMasterConfig({ ...masterConfig, adminUsername: e.target.value })}
                  className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-400 uppercase tracking-wider mb-1">
                  Master Admin Password
                </label>
                <input
                  type="text"
                  required
                  value={masterConfig.adminPassword}
                  onChange={(e) => setMasterConfig({ ...masterConfig, adminPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs font-bold font-mono text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-400 uppercase tracking-wider mb-1">
                  Master Admin PIN (4-Digit Quick Code)
                </label>
                <input
                  type="text"
                  maxLength="6"
                  required
                  value={masterConfig.adminPin}
                  onChange={(e) => setMasterConfig({ ...masterConfig, adminPin: e.target.value })}
                  className="w-48 px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs font-bold font-mono text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-amber-500/20 cursor-pointer"
              >
                Save Master Credentials
              </button>
            </form>
          </div>
        )}

      </main>

      {/* =================================================================== */}
      {/* ADD NEW CAFE USER MODAL                                             */}
      {/* =================================================================== */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-base font-black text-amber-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <span>Register New Cafe Manually</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="text-stone-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-400 mb-1">Cafe / Brand Name *</label>
                <input
                  type="text"
                  required
                  value={newUserForm.cafeName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, cafeName: e.target.value })}
                  placeholder="e.g. Chai & Samosa Co."
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-400 mb-1">Owner Name *</label>
                <input
                  type="text"
                  required
                  value={newUserForm.ownerName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, ownerName: e.target.value })}
                  placeholder="e.g. Kunal Sharma"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-400 mb-1">Login Email *</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="owner@cafe.com"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-400 mb-1">Password *</label>
                <input
                  type="text"
                  required
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="Create password for owner"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-amber-300 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-400 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-400 mb-1">City</label>
                  <input
                    type="text"
                    value={newUserForm.city}
                    onChange={(e) => setNewUserForm({ ...newUserForm, city: e.target.value })}
                    placeholder="e.g. Indore"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-400 mb-1">Plan</label>
                <select
                  value={newUserForm.plan}
                  onChange={(e) => setNewUserForm({ ...newUserForm, plan: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-bold"
                >
                  <option value="Pro Growth">Pro Growth (₹999/mo)</option>
                  <option value="Enterprise">Enterprise (₹2,499/mo)</option>
                  <option value="Free Starter">Free Starter</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-black cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Create Cafe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
