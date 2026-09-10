import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronRight, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { findMatches, scoreLabel } from '@/lib/matching';
import { createNotification } from '@/lib/notifications';
import type { Item, MatchResult } from '@/types';

interface SourceWithMatches {
  source: Item;
  matches: MatchResult[];
}

export default function MatchesPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<SourceWithMatches[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const schedule = (callback: () => void) => {
      if ('requestIdleCallback' in globalThis) {
        globalThis.requestIdleCallback(callback);
        return;
      }
      globalThis.setTimeout(callback, 0);
    };

    const load = async () => {
      const { data: allItems } = await supabase
        .from('items')
        .select('*')
        .eq('status', 'active');
      const items = (allItems as Item[]) ?? [];

      const myItems = items.filter((i) => i.user_id === user.id);
      const othersItems = items.filter((i) => i.user_id !== user.id);

      const result: SourceWithMatches[] = myItems.map((source) => {
        const candidates = othersItems.filter((c) => c.type !== source.type);
        const matches = findMatches(source, candidates).slice(0, 5);
        return { source, matches };
      });

      for (const group of result) {
        for (const match of group.matches) {
          if (match.score >= 85) {
            const notifKey = `${group.source.id}-${match.item.id}`;
            if (!notifiedRef.current.has(notifKey)) {
              notifiedRef.current.add(notifKey);
              await createNotification(
                user.id,
                'match',
                'Strong match found!',
                `Your ${group.source.type} item "${group.source.title}" has a ${match.score}% match with "${match.item.title}".`,
                `/app/item/${match.item.id}`
              );
            }
          }
        }
      }

      setGroups(result);
      if (result.length > 0) setSelectedSource(result[0].source.id);
      setLoading(false);
    };

    schedule(() => {
      void load();
    });
  }, [user]);

  const current = groups.find((g) => g.source.id === selectedSource);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Matches</h1>
        <p className="text-slate-500 mb-8">Finding potential matches for your items...</p>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse">
              <div className="h-6 shimmer-bg rounded w-1/3 mb-4" />
              <div className="h-20 shimmer-bg rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Matches</h1>
        <p className="text-slate-500 mb-8">Our system compares your items against everything reported by others</p>
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-brand-400" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">No items to match yet</h3>
          <p className="text-slate-500 text-sm mb-4">Report a lost or found item to start getting AI matches</p>
          <Link to="/app/report" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:shadow-lg hover:shadow-brand-500/30 transition-all">
            Report an item
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">AI Matches</h1>
          <p className="text-slate-500">Our system compares your items against everything reported by others</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Your items</h2>
          <div className="space-y-2">
            {groups.map((g) => {
              const topScore = g.matches[0]?.score ?? 0;
              return (
                <button
                  key={g.source.id}
                  onClick={() => setSelectedSource(g.source.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    selectedSource === g.source.id
                      ? 'border-brand-500 bg-brand-50 shadow-md shadow-brand-500/10'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      g.source.type === 'lost' ? 'bg-rose-100 text-rose-700' : 'bg-brand-100 text-brand-700'
                    }`}>
                      {g.source.type === 'lost' ? 'Lost' : 'Found'}
                    </span>
                    {topScore > 0 && (
                      <span className={`text-sm font-bold ${
                        topScore >= 70 ? 'text-brand-600' : topScore >= 50 ? 'text-amber-600' : 'text-slate-400'
                      }`}>
                        {topScore}% top
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-slate-900 text-sm truncate">{g.source.title}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {g.matches.length} potential match{g.matches.length !== 1 ? 'es' : ''}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2">
          {current && current.matches.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-brand-400" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">No matches yet</h3>
              <p className="text-slate-500 text-sm">
                No items reported by others match your {current.source.type === 'lost' ? 'lost' : 'found'} "{current.source.title}". Check back later as new items are reported.
              </p>
            </div>
          ) : current ? (
            <div>
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 mb-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500 rounded-full blur-3xl opacity-20" />
                <div className="relative z-10">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Matching against</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold text-lg">{current.source.title}</p>
                      <p className="text-slate-400 text-sm">
                        {current.source.type === 'lost' ? 'Lost' : 'Found'} · {current.source.category} · {current.source.color}
                        {current.source.brand && ` · ${current.source.brand}`}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      current.source.type === 'lost' ? 'bg-rose-500/20 text-rose-300' : 'bg-brand-500/20 text-brand-300'
                    }`}>
                      {current.source.type === 'lost' ? 'Looking for' : 'Available'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {current.matches.map((match, idx) => {
                  const label = scoreLabel(match.score);
                  return (
                    <Link
                      key={match.item.id}
                      to={`/app/item/${match.item.id}`}
                      className="block rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-lg hover:border-brand-300 hover:-translate-y-0.5 transition-all group animate-fade-in-up"
                      style={{ animationDelay: `${idx * 0.08}s` }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                          {match.item.photo_urls?.[0] ? (
                            <img src={match.item.photo_urls[0]} alt={match.item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className="font-bold text-slate-900 truncate group-hover:text-brand-600 transition-colors">
                              {match.item.title}
                            </h3>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-500 transition-colors flex-shrink-0" />
                          </div>
                          <p className="text-sm text-slate-500 mb-3">
                            {match.item.type === 'lost' ? 'Lost' : 'Found'} · {match.item.category} · {match.item.color}
                            {match.item.brand && ` · ${match.item.brand}`}
                          </p>
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`text-2xl font-bold ${
                              match.score >= 85 ? 'text-brand-600' :
                              match.score >= 70 ? 'text-green-600' :
                              match.score >= 50 ? 'text-amber-600' :
                              match.score >= 30 ? 'text-orange-500' : 'text-red-500'
                            }`}>
                              {match.score}%
                            </div>
                            <div>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${label.badgeClass}`}>
                                {label.label}
                              </span>
                              <p className="text-xs text-slate-400 mt-0.5">Match #{idx + 1}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-7 gap-1.5">
                            {Object.entries(match.breakdown).map(([factor, val]) => (
                              <div key={factor} className="text-center">
                                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-1">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                                    style={{ width: `${val * 100}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-slate-400 capitalize">{factor}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
