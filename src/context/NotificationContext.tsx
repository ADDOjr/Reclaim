import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { Bell, Check, X, Sparkles, FileCheck, Info } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { AppNotification } from '@/types';

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  setRealtimeEnabled: (enabled: boolean) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    setNotifications((data as AppNotification[]) ?? []);
    setUnreadCount((data as AppNotification[])?.filter((n) => !n.read).length ?? 0);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setRealtimeEnabled(false);
      return;
    }

    const shouldConnect = realtimeEnabled || location.pathname.startsWith('/app');
    if (!shouldConnect) return;

    const schedule = (callback: () => void) => {
      if ('requestIdleCallback' in globalThis) {
        globalThis.requestIdleCallback(callback);
        return;
      }
      globalThis.setTimeout(callback, 0);
    };

    schedule(() => {
      void refresh();
    });

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => void refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [location.pathname, realtimeEnabled, refresh, user]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, refresh, markRead, markAllRead, setRealtimeEnabled }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, setRealtimeEnabled } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/app')) {
      setRealtimeEnabled(true);
      return;
    }

    if (!open) {
      setRealtimeEnabled(false);
    }
  }, [location.pathname, open, setRealtimeEnabled]);

  const handleClick = (n: AppNotification) => {
    markRead(n.id);
    if (n.link) navigate(n.link);
    setOpen(false);
    setRealtimeEnabled(location.pathname.startsWith('/app'));
  };

  const iconFor = (type: string) => {
    if (type === 'match') return <Sparkles className="w-4 h-4 text-brand-500" />;
    if (type === 'claim') return <FileCheck className="w-4 h-4 text-accent-500" />;
    return <Info className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          const nextOpen = !open;
          setOpen(nextOpen);
          setRealtimeEnabled(nextOpen || location.pathname.startsWith('/app'));
        }}
        className="relative p-2 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl bg-white border border-gray-200 shadow-xl z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex gap-3 ${!n.read ? 'bg-brand-50/40' : ''}`}
                  >
                    <div className="flex-shrink-0 mt-0.5">{iconFor(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-2" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
