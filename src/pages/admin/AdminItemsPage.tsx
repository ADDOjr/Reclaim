import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search, Trash2, AlertTriangle, CheckCircle2, XCircle, MapPin, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { Item } from '@/types';

export default function AdminItemsPage() {
  const { notify } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from('items').select('*').order('created_at', { ascending: false });
    setItems((data as Item[]) ?? []);
    setLoading(false);
  }

  const filtered = items.filter((item) => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = `${item.title} ${item.description} ${item.brand ?? ''} ${item.location} ${item.building ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const handleDelete = async (itemId: string) => {
    const { error } = await supabase.from('items').delete().eq('id', itemId);
    if (error) {
      notify(error.message, 'error');
    } else {
      notify('Fake report removed');
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    }
    setConfirmDelete(null);
  };

  const handleToggleStatus = async (item: Item) => {
    const newStatus = item.status === 'active' ? 'resolved' : 'active';
    const { error } = await supabase.from('items').update({ status: newStatus }).eq('id', item.id);
    if (error) {
      notify(error.message, 'error');
    } else {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i)));
      notify(`Item marked as ${newStatus}`);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Manage Items</h1>
        <p className="text-slate-500 mt-1">View all reports, remove fake reports, and manage item status</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-brand-500 outline-none"
        >
          <option value="all">All types</option>
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-brand-500 outline-none"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-900 mb-1">No items found</h3>
          <p className="text-slate-500 text-sm">No items match your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                  {item.photo_urls?.[0] ? (
                    <img src={item.photo_urls[0]} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-7 h-7 text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      item.type === 'lost' ? 'bg-rose-100 text-rose-700' : 'bg-brand-100 text-brand-700'
                    }`}>
                      {item.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      item.status === 'active' ? 'bg-accent-100 text-accent-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <Link to={`/app/item/${item.id}`} className="font-semibold text-slate-900 hover:text-brand-600 transition-colors">
                    {item.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>{item.category} · {item.color}{item.brand && ` · ${item.brand}`}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.location}{item.building && ` · ${item.building}`}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(item.date_event).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                    title={item.status === 'active' ? 'Mark resolved' : 'Reopen'}
                  >
                    {item.status === 'active' ? <CheckCircle2 className="w-4 h-4 text-brand-500" /> : <XCircle className="w-4 h-4 text-amber-500" />}
                    <span className="hidden sm:inline">{item.status === 'active' ? 'Resolve' : 'Reopen'}</span>
                  </button>
                  <button
                    onClick={() => setConfirmDelete(item.id)}
                    className="px-3 py-2 rounded-lg border border-rose-200 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              </div>

              {/* Delete confirmation */}
              {confirmDelete === item.id && (
                <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-rose-700">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span>Remove this report? This action cannot be undone.</span>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
