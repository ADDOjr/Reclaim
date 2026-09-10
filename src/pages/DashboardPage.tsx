import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Package, TrendingUp, Sparkles, AlertCircle, CheckCircle2, Clock, ArrowRight, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Item } from '@/types';
import ItemCard from '@/components/ItemCard';

export default function DashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setItems((data as Item[]) ?? []);
      setLoading(false);
    }
    load();
  }, [user]);

  const lostItems = items.filter((i) => i.type === 'lost');
  const foundItems = items.filter((i) => i.type === 'found');
  const resolvedItems = items.filter((i) => i.status === 'resolved');

  const stats = [
    { label: 'Items reported', value: items.length, icon: Package, gradient: 'from-accent-500 to-accent-600', bg: 'bg-accent-50', text: 'text-accent-600' },
    { label: 'Lost items', value: lostItems.length, icon: AlertCircle, gradient: 'from-rose-500 to-pink-500', bg: 'bg-rose-50', text: 'text-rose-600' },
    { label: 'Found items', value: foundItems.length, icon: Search, gradient: 'from-brand-500 to-brand-600', bg: 'bg-brand-50', text: 'text-brand-600' },
    { label: 'Resolved', value: resolvedItems.length, icon: TrendingUp, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-600' },
  ];

  const recentItems = items.slice(0, 4);
  const resolvedCount = resolvedItems.length;
  const totalCount = items.length;
  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your reported items and track matches</p>
        </div>
        <Link
          to="/app/report"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:shadow-lg hover:shadow-brand-500/30 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Report item
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s, idx) => (
          <div
            key={s.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up"
            style={{ animationDelay: `${idx * 0.08}s` }}
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-3 shadow-md`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* AI matches CTA */}
      <Link
        to="/app/matches"
        className="block rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 mb-10 hover:shadow-xl transition-all group relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-accent-500 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Check AI Matches</h3>
              <p className="text-slate-300 text-sm">See if your lost items match anything found by others</p>
            </div>
          </div>
          <div className="text-white text-2xl group-hover:translate-x-1 transition-transform">
            <ArrowRight className="w-6 h-6" />
          </div>
        </div>
      </Link>

      {/* Resolution progress + Recent activity */}
      {totalCount > 0 && (
        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          {/* Resolution rate */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-slate-900">Resolution rate</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none" stroke="url(#grad)" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - resolutionRate / 100)}`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute text-xl font-bold text-slate-900">{resolutionRate}%</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-600">
                  <span className="font-bold text-slate-900">{resolvedCount}</span> of {totalCount} items resolved
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {totalCount - resolvedCount} still active and matching
                </p>
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent-600" />
                <h3 className="font-bold text-slate-900">Recent activity</h3>
              </div>
              <Link to="/app/browse" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/app/item/${item.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    item.type === 'lost' ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-600'
                  }`}>
                    {item.type === 'lost' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm group-hover:text-brand-600 transition-colors truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.type === 'lost' ? 'Reported lost' : 'Reported found'} · {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  {item.status === 'resolved' && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700">Resolved</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Your items */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Your items</h2>
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white overflow-hidden animate-pulse">
                <div className="aspect-[4/3] shimmer-bg" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-100 rounded w-2/3" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-brand-500" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">No items reported yet</h3>
            <p className="text-slate-500 text-sm mb-4">Report a lost or found item to get started</p>
            <Link
              to="/app/report"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:shadow-lg hover:shadow-brand-500/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Report your first item
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} showStatus />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
