import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, Tag, Package, CheckCircle2, Sparkles,
  ChevronRight, Building, FileCheck, Clock, XCircle, Hand
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { findMatches, scoreLabel } from '@/lib/matching';
import type { Item, MatchResult, Claim } from '@/types';

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useToast();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [resolving, setResolving] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('items').select('*').eq('id', id).maybeSingle();
      if (!data) {
        setLoading(false);
        return;
      }
      const currentItem = data as Item;
      setItem(currentItem);

      const { data: others } = await supabase
        .from('items')
        .select('*')
        .neq('user_id', currentItem.user_id)
        .neq('type', currentItem.type)
        .eq('status', 'active');
      const candidates = (others as Item[]) ?? [];
      setMatches(findMatches(currentItem, candidates).slice(0, 3));

      const { data: claimData } = await supabase
        .from('claims')
        .select('*')
        .eq('item_id', currentItem.id)
        .order('created_at', { ascending: false });
      setClaims((claimData as Claim[]) ?? []);

      setLoading(false);
    }
    load();
  }, [id]);

  const isOwner = item?.user_id === user?.id;

  const handleResolve = async () => {
    if (!item) return;
    setResolving(true);
    const { error } = await supabase
      .from('items')
      .update({ status: item.status === 'active' ? 'resolved' : 'active' })
      .eq('id', item.id);
    setResolving(false);
    if (error) {
      notify(error.message, 'error');
    } else {
      setItem({ ...item, status: item.status === 'active' ? 'resolved' : 'active' });
      notify(item.status === 'active' ? 'Item marked as resolved' : 'Item reopened');
    }
  };

  const handleApproveClaim = async (claimId: string) => {
    const { error } = await supabase
      .from('claims')
      .update({ status: 'completed', resolved_at: new Date().toISOString() })
      .eq('id', claimId);
    if (error) {
      notify(error.message, 'error');
    } else {
      setClaims((prev) => prev.map((c) => (c.id === claimId ? { ...c, status: 'completed' } : c)));
      notify('Claim approved — handover confirmed');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-6 w-32 shimmer-bg rounded animate-pulse mb-6" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square shimmer-bg rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 shimmer-bg rounded w-2/3 animate-pulse" />
            <div className="h-4 shimmer-bg rounded w-1/2 animate-pulse" />
            <div className="h-24 shimmer-bg rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50 flex items-center justify-center mx-auto mb-4">
          <Package className="w-10 h-10 text-brand-300" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Item not found</h2>
        <p className="text-slate-500 mb-6">This item may have been removed</p>
        <Link to="/app/browse" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:shadow-lg hover:shadow-brand-500/30 transition-all">
          Browse items
        </Link>
      </div>
    );
  }

  const photos = item.photo_urls ?? [];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square rounded-2xl bg-gray-100 overflow-hidden border border-gray-200 relative group">
            {photos[activePhoto] ? (
              <img src={photos[activePhoto]} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <Package className="w-20 h-20 text-gray-300" />
              </div>
            )}
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 mt-3">
              {photos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    activePhoto === i ? 'border-brand-500 shadow-md shadow-brand-500/20' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              item.type === 'lost' ? 'bg-rose-100 text-rose-700' : 'bg-brand-100 text-brand-700'
            }`}>
              {item.type === 'lost' ? 'Lost' : 'Found'}
            </span>
            {item.status === 'resolved' && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                Resolved
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">{item.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-6">
            <span className="flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-slate-400" />
              {item.category}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: item.color.toLowerCase() }} />
              {item.color}
            </span>
            {item.brand && (
              <span className="font-medium">{item.brand}</span>
            )}
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Location</p>
                <p className="text-slate-900 font-medium">{item.location}</p>
              </div>
            </div>
            {item.building && (
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Building</p>
                  <p className="text-slate-900 font-medium">{item.building}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">
                  {item.type === 'lost' ? 'Date lost' : 'Date found'}
                </p>
                <p className="text-slate-900 font-medium">
                  {new Date(item.date_event).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Description</p>
            <p className="text-slate-700 leading-relaxed">{item.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isOwner && item.status === 'active' && (
              <Link
                to={`/app/item/${item.id}/claim`}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold hover:shadow-lg hover:shadow-accent-500/30 transition-all flex items-center gap-2"
              >
                <Hand className="w-4 h-4" />
                Claim this item
              </Link>
            )}
            {isOwner && (
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:shadow-lg hover:shadow-brand-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {item.status === 'active' ? 'Mark as resolved' : 'Reopen item'}
              </button>
            )}
          </div>
        </div>
      </div>

      {isOwner && claims.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-md">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Claims on this item</h2>
              <p className="text-sm text-slate-500">People who say this item belongs to them</p>
            </div>
          </div>

          <div className="space-y-3">
            {claims.map((claim) => (
              <div key={claim.id} className="rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                        claim.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        claim.status === 'approved' ? 'bg-brand-100 text-brand-700' :
                        claim.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {claim.status === 'pending' && <Clock className="w-3 h-3 inline mr-1" />}
                        {claim.status === 'approved' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                        {claim.status === 'rejected' && <XCircle className="w-3 h-3 inline mr-1" />}
                        {claim.status === 'completed' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                        {claim.status}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(claim.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {Object.entries(claim.verification_answers).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}: </span>
                          <span className="text-slate-800">{value}</span>
                        </div>
                      ))}
                    </div>
                    {claim.proof_url && (
                      <a href={claim.proof_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
                        <img src={claim.proof_url} alt="Proof" className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                      </a>
                    )}
                  </div>
                  {claim.status === 'approved' && (
                    <button
                      onClick={() => handleApproveClaim(claim.id)}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-brand-500/30 transition-all flex-shrink-0"
                    >
                      Confirm handover
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {matches.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Potential matches</h2>
              <p className="text-sm text-slate-500">AI-found items that might be this {item.type === 'lost' ? 'lost' : 'found'} item</p>
            </div>
          </div>

          <div className="space-y-3">
            {matches.map((match) => {
              const mLabel = scoreLabel(match.score);
              return (
                <Link
                  key={match.item.id}
                  to={`/app/item/${match.item.id}`}
                  className="block rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-lg hover:border-brand-300 hover:-translate-y-0.5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                      {match.item.photo_urls?.[0] ? (
                        <img src={match.item.photo_urls[0]} alt={match.item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate group-hover:text-brand-600 transition-colors">
                        {match.item.title}
                      </h3>
                      <p className="text-sm text-slate-500 truncate">
                        {match.item.type === 'lost' ? 'Lost' : 'Found'} · {match.item.category} · {match.item.color}
                        {match.item.brand && ` · ${match.item.brand}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-2xl font-bold ${
                        match.score >= 85 ? 'text-brand-600' :
                        match.score >= 70 ? 'text-green-600' :
                        match.score >= 50 ? 'text-amber-600' : 'text-slate-400'
                      }`}>
                        {match.score}%
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${mLabel.badgeClass}`}>
                        {mLabel.label}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-500 transition-colors flex-shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>

          <Link to="/app/matches" className="mt-4 inline-flex items-center gap-2 text-brand-600 font-medium text-sm hover:text-brand-700">
            See all matches <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
