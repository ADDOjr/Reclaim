import { NavLink, useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, Plus, Compass, Sparkles, LocateFixed, LogOut, Menu, X, Shield } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { NotificationBell } from '@/context/NotificationContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, signOut } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    notify('Signed out');
    navigate('/');
  };

  const navItems = [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/report', label: 'Report Item', icon: Plus },
    { to: '/app/browse', label: 'Browse', icon: Compass },
    { to: '/app/matches', label: 'AI Matches', icon: Sparkles },
    { to: '/app/track', label: 'Device Tracker', icon: LocateFixed },
  ];

  const adminItems = [
    { to: '/app/admin', label: 'Admin Dashboard', icon: Shield, end: true },
    { to: '/app/admin/claims', label: 'Claims', icon: Shield },
    { to: '/app/admin/items', label: 'Manage Items', icon: Shield },
  ];

  const renderNavItems = (items: typeof navItems) =>
    items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        onClick={() => setMobileOpen(false)}
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
            isActive
              ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30'
              : 'text-slate-300 hover:bg-white/5 hover:text-white hover:translate-x-1'
          }`
        }
      >
        <item.icon className="w-5 h-5" />
        {item.label}
      </NavLink>
    ));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex-col z-30">
        {/* Gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-accent-500 to-brand-500" />
        <div className="px-6 h-16 flex items-center gap-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Search className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold">Reclaim</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {renderNavItems(navItems)}
          {isAdmin && (
            <>
              <div className="px-4 pt-6 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Admin
              </div>
              {renderNavItems(adminItems)}
            </>
          )}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <div className="px-4 py-2 mb-2 flex items-center justify-between">
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            <NotificationBell />
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-slate-900 to-slate-800 text-white z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
            <Search className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold">Reclaim</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed top-16 left-0 right-0 bg-gradient-to-b from-slate-900 to-slate-800 text-white z-20 py-4 px-4 space-y-1 border-b border-white/10 max-h-[calc(100vh-4rem)] overflow-y-auto animate-fade-in">
          {renderNavItems(navItems)}
          {isAdmin && (
            <>
              <div className="px-4 pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin</div>
              {renderNavItems(adminItems)}
            </>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-10 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
