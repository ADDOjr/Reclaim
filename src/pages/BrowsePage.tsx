import { useEffect, useState } from 'react';
import { Search, Filter, Package, X, MapPin, Compass } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Item, ItemType } from '@/types';
import { CATEGORIES, COLORS } from '@/types';
import ItemCard from '@/components/ItemCard';

export default function BrowsePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ItemType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });
      setItems((data as Item[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const buildings = Array.from(new Set(items.map((i) => i.building).filter(Boolean))) as string[];

  const filtered = items.filter((item) => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (categoryFilter && item.category !== categoryFilter) return false;
    if (colorFilter && item.color !== colorFilter) return false;
    if (brandFilter && (!item.brand || !item.brand.toLowerCase().includes(brandFilter.toLowerCase()))) return false;
    if (dateFilter && item.date_event !== dateFilter) return false;
    if (buildingFilter && item.building !== buildingFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = `${item.title} ${item.description} ${item.brand ?? ''} ${item.location} ${item.building ?? ''} ${item.category} ${item.color}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const activeFilters = (typeFilter !== 'all' ? 1 : 0) + (categoryFilter ? 1 : 0) + (colorFilter ? 1 : 0) + (brandFilter ? 1 : 0) + (dateFilter ? 1 : 0) + (buildingFilter ? 1 : 0);

  const clearFilters = () => {
    setTypeFilter('all');
    setCategoryFilter('');
    setColorFilter('');
    setBrandFilter('');
    setDateFilter('');
    setBuildingFilter('');
    setSearch('');
  };

  const typeOptions: { value: ItemType | 'all'; label: string; color: string }[] = [
    { value: 'all', label: 'All', color: 'bg-slate-100 text-slate-700' },
    { value: 'lost', label: 'Lost', color: 'bg-rose-100 text-rose-700' },
    { value: 'found', label: 'Found', color: 'bg-brand-100 text-brand-700' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Compass className="w-7 h-7 text-brand-600" />
          <h1 className="text-3xl font-bold text-slate-900">Browse items</h1>
        </div>
        <p className="text-slate-500">Search through all reported lost and found items</p>
      </div>

      {/* Quick type chips */}
      <div className="flex gap-2 mb-4">
        {typeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTypeFilter(opt.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              typeFilter === opt.value
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30'
                : 'bg-white border border-gray-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, description, brand, location..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 rounded-xl border font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
            showFilters || activeFilters > 0
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-gray-200 bg-white text-slate-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilters > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-brand-500 text-white text-xs">{activeFilters}</span>
          )}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 mb-6 space-y-4 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Smart search filters</h3>
            {activeFilters > 0 && (
              <button onClick={clearFilters} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Clear all
              </button>
            )}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-brand-500 outline-none"
              >
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Color</label>
              <select
                value={colorFilter}
                onChange={(e) => setColorFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-brand-500 outline-none"
              >
                <option value="">All colors</option>
                {COLORS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Brand</label>
              <input
                type="text"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                placeholder="e.g. HP, Apple, Nike"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Building</label>
              <select
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-brand-500 outline-none"
              >
                <option value="">All buildings</option>
                {buildings.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white overflow-hidden animate-pulse">
              <div className="aspect-[4/3] shimmer-bg" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-gray-100 rounded w-2/3" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-brand-400" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">No items found</h3>
          <p className="text-slate-500 text-sm">
            {activeFilters > 0 || search ? 'Try adjusting your filters or search' : 'No items have been reported yet'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4">{filtered.length} item{filtered.length !== 1 ? 's' : ''} found</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((item, idx) => (
              <div key={item.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(idx * 0.05, 0.4)}s` }}>
                <ItemCard item={item} showStatus />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
