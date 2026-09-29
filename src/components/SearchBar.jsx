import React from 'react';
import { Search, X, LayoutGrid, Table, Filter } from 'lucide-react';

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  statusFilter,
  setStatusFilter,
  viewMode,
  setViewMode
}) {
  return (
    <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm mb-6 space-y-4">
      
      {/* Top Controls: Search Bar & View Switcher */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search Field */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search item name or category..."
            className="w-full pl-10 pr-9 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-stone-800 placeholder-stone-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right side controls: Availability Filter & View Mode */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          
          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-2 text-xs font-medium text-stone-600">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            >
              <option value="ALL">All Status</option>
              <option value="AVAILABLE">Available Only</option>
              <option value="UNAVAILABLE">Disabled Only</option>
            </select>
          </div>

          {/* View Switcher (Table vs Grid) */}
          <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200">
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Table className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Grid View"
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>

        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider mr-1 whitespace-nowrap">
          Categories:
        </span>
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
            selectedCategory === 'ALL'
              ? 'bg-stone-900 text-amber-100 shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-amber-700 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

    </div>
  );
}
