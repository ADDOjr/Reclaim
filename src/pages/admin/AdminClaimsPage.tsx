import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, Package, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { createNotification } from '@/lib/notifications';
import type { Claim, Item } from '@/types';

interface ClaimRow extends Claim {
  item?: Item;
  claimer_email?: string;
}

export default function AdminClaimsPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<Record<string, string>>({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from('claims')
      .select('*, item:items(*), claimer:profiles!claims_claimer_id_fkey(email)')
      .order('created_at', { ascending: false });
    const rows = (data as unknown as Array<Claim & { item?: Item; claimer?: { email: string } }>) ?? [];
    setClaims(rows.map((r) => ({ ...r, claimer_email: r.claimer?.email })));
    setLoading(false);
  }

  const handleAction = async (claimId: string, status: 'approved' | 'rejected') => {
    const note = actionNote[claimId] ?? '';
    const { error } = await supabase
      .from('claims')
      .update({
        status,
        admin_id: user!.id,
        admin_note: note || null,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', claimId);

    if (error) {
      notify(error.message, 'error');
      return;
    }

    const claim = claims.find((c) => c.id === claimId);
    if (claim) {
      await createNotification(
        claim.claimer_id,
        'claim',
        `Claim ${status}`,
        `Your claim for "${claim.item?.title ?? 'an item'}" has been ${status} by an administrator${note ? `: ${note}` : '.'}`,
        claim.item_id ? `/app/item/${claim.item_id}` : undefined
      );
      if (claim.item) {
        await createNotification(
          claim.item.user_id,
          'claim',
          `Claim ${status}`,
          `A claim on your item "${claim.item.title}" has been ${status} by an administrator.`,
          `/app/item/${claim.item.id}`
        );
      }
    }

    notify(`Claim ${status}`);
    setExpanded(null);
    setActionNote((prev) => {
      const next = { ...prev };
      delete next[claimId];
      return next;
    });
    load();
  };

  const filtered = filter === 'all' ? claims : claims.filter((c) => c.status === filter);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-brand-100 text-brand-700',
      rejected: 'bg-rose-100 text-rose-700',
      completed: 'bg-slate-100 text-slate-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Manage Claims</h1>
        <p className="text-slate-500 mt-1">Review and approve or reject ownership claims</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['all', 'pending', 'approved', 'rejected', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${
              filter === f ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30' : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-50 hover:border-brand-300'
            }`}
          >
            {f}
            {f !== 'all' && (
              <span className="ml-2 opacity-60">{claims.filter((c) => c.status === f).length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-900 mb-1">No claims found</h3>
          <p className="text-slate-500 text-sm">No claims match this filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((claim) => (
            <div key={claim.id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === claim.id ? null : claim.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                    {claim.item?.photo_urls?.[0] ? (
                      <img src={claim.item.photo_urls[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{claim.item?.title ?? 'Unknown item'}</p>
                    <p className="text-sm text-slate-500">
                      Claimed by {claim.claimer_email ?? 'Unknown'} · {new Date(claim.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusBadge(claim.status)}`}>
                    {claim.status}
                  </span>
                  {expanded === claim.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
              </button>

              {expanded === claim.id && (
                <div className="border-t border-gray-100 p-5 space-y-4">
                  {/* Verification answers */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" /> Verification answers
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(claim.verification_answers).map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-gray-50 p-3">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{key.replace(/_/g, ' ')}</p>
                          <p className="text-sm text-slate-800">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Proof of ownership */}
                  {claim.proof_url && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Proof of ownership</h4>
                      <a href={claim.proof_url} target="_blank" rel="noopener noreferrer" className="inline-block">
                        <img src={claim.proof_url} alt="Proof" className="w-32 h-32 rounded-xl object-cover border border-gray-200 hover:opacity-80 transition-opacity" />
                      </a>
                    </div>
                  )}

                  {/* Admin note */}
                  {claim.status === 'pending' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Admin note (optional)</label>
                        <textarea
                          value={actionNote[claim.id] ?? ''}
                          onChange={(e) => setActionNote((prev) => ({ ...prev, [claim.id]: e.target.value }))}
                          rows={2}
                          placeholder="Add a note for the claimant..."
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAction(claim.id, 'approved')}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:shadow-lg hover:shadow-brand-500/30 transition-all flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => handleAction(claim.id, 'rejected')}
                          className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </>
                  )}

                  {claim.admin_note && claim.status !== 'pending' && (
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Admin note</p>
                      <p className="text-sm text-slate-800">{claim.admin_note}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
