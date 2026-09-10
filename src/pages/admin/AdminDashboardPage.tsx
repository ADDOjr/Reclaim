import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, FileCheck, AlertTriangle, TrendingUp, Users, ArrowRight, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Item, Claim } from '@/types';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalItems: 0,
    lostItems: 0,
    foundItems: 0,
    resolvedItems: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    rejectedClaims: 0,
    totalUsers: 0,
  });
  const [recentClaims, setRecentClaims] = useState<(Claim & { item_title?: string; claimer_email?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [itemsRes, claimsRes, profilesRes] = await Promise.all([
        supabase.from('items').select('type, status'),
        supabase.from('claims').select('*, item:items(title), claimer:profiles!claims_claimer_id_fkey(email)').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

      const items = (itemsRes.data as Pick<Item, 'type' | 'status'>[]) ?? [];
      const claims = (claimsRes.data as unknown as Array<Claim & { item?: { title: string }; claimer?: { email: string } }>) ?? [];

      setStats({
        totalItems: items.length,
        lostItems: items.filter((i) => i.type === 'lost').length,
        foundItems: items.filter((i) => i.type === 'found').length,
        resolvedItems: items.filter((i) => i.status === 'resolved').length,
        pendingClaims: claims.filter((c) => c.status === 'pending').length,
        approvedClaims: claims.filter((c) => c.status === 'approved').length,
        rejectedClaims: claims.filter((c) => c.status === 'rejected').length,
        totalUsers: profilesRes.count ?? 0,
      });

      setRecentClaims(
        claims.map((c) => ({
          ...c,
          item_title: c.item?.title,
          claimer_email: c.claimer?.email,
        }))
      );
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { label: 'Total items', value: stats.totalItems, icon: Package, gradient: 'from-accent-500 to-accent-600' },
    { label: 'Pending claims', value: stats.pendingClaims, icon: Clock, gradient: 'from-amber-500 to-orange-500' },
    { label: 'Resolved items', value: stats.resolvedItems, icon: CheckCircle2, gradient: 'from-brand-500 to-brand-600' },
    { label: 'Total users', value: stats.totalUsers, icon: Users, gradient: 'from-slate-600 to-slate-800' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Monitor reports, claims, and platform analytics</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center mb-3 shadow-md`}>
              <c.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{loading ? '—' : c.value}</p>
            <p className="text-sm text-slate-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="font-bold text-slate-900 mb-4">Items breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Lost items</span>
              <span className="font-bold text-rose-600">{stats.lostItems}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Found items</span>
              <span className="font-bold text-brand-600">{stats.foundItems}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Resolved</span>
              <span className="font-bold text-slate-900">{stats.resolvedItems}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="font-bold text-slate-900 mb-4">Claims breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Pending</span>
              <span className="font-bold text-amber-600">{stats.pendingClaims}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Approved</span>
              <span className="font-bold text-brand-600">{stats.approvedClaims}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Rejected</span>
              <span className="font-bold text-rose-600">{stats.rejectedClaims}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="font-bold text-slate-900 mb-4">Quick actions</h3>
          <div className="space-y-2">
            <Link to="/app/admin/claims" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <span className="text-sm font-medium text-slate-700">Review claims</span>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
            </Link>
            <Link to="/app/admin/items" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <span className="text-sm font-medium text-slate-700">Manage items</span>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent claims */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Recent claims</h2>
          <Link to="/app/admin/claims" className="text-sm text-brand-600 font-medium hover:text-brand-700">View all</Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentClaims.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
            <FileCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No claims yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentClaims.map((claim) => (
              <Link
                key={claim.id}
                to="/app/admin/claims"
                className="block rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{claim.item_title ?? 'Unknown item'}</p>
                    <p className="text-sm text-slate-500">Claimed by {claim.claimer_email ?? 'Unknown user'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    claim.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    claim.status === 'approved' ? 'bg-brand-100 text-brand-700' :
                    claim.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {claim.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
