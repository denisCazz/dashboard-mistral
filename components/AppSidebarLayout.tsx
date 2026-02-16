'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AziendaSettings } from '@/types';
import { auth } from '@/lib/auth';

interface SidebarItem {
  label: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
}

interface AppSidebarLayoutProps {
  settings: AziendaSettings;
  title: string;
  subtitle?: string;
  onLogout: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', href: '/', icon: '🏠' },
  { label: 'Statistiche', href: '/admin', icon: '📊', adminOnly: true },
  { label: 'Gestione Utenti', href: '/admin/users', icon: '👥', adminOnly: true },
  { label: 'Moduli', href: '/#moduli', icon: '🧩' },
];

export default function AppSidebarLayout({ settings, title, subtitle, onLogout, children, actions }: AppSidebarLayoutProps) {
  const pathname = usePathname();
  const user = auth.getUser();
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const oggi = new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const navItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return SIDEBAR_ITEMS.filter((item) => {
      if (item.adminOnly && user?.ruolo !== 'admin') {
        return false;
      }

      if (!query) return true;
      return item.label.toLowerCase().includes(query);
    });
  }, [search, user?.ruolo]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <div className="relative min-h-screen text-gray-900 dark:text-white">
      <div className="pointer-events-none absolute -top-24 left-0 h-72 w-72 rounded-full bg-primary-300/20 blur-3xl dark:bg-primary-600/20" />
      <div className="pointer-events-none absolute top-10 right-0 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-700/20" />

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 glass-card border-r border-white/60 dark:border-gray-700/70 z-50 transform transition-transform duration-300 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200/70 dark:border-gray-700/70">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.logo || '/logo.jpg'}
                alt={settings.nomeAzienda || 'Logo'}
                className="h-11 w-11 object-contain rounded-xl ring-1 ring-primary-200 dark:ring-primary-800 bg-white/70 dark:bg-gray-900/60"
              />
              <div className="min-w-0">
                <p className="font-bold tracking-tight truncate">{settings.nomeAzienda || 'Mistral Impianti'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Control Center interventi</p>
              </div>
            </div>

            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary-200/70 dark:border-primary-700/60 bg-primary-50/70 dark:bg-primary-900/20 px-3 py-1 text-xs font-medium text-primary-700 dark:text-primary-300">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Sistema operativo
            </div>

            <div className="mt-4 relative">
              <input
                type="text"
                placeholder="Cerca voce menu..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full px-3 py-2.5 pr-9 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-400/60 focus:border-primary-300"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-primary-500 to-indigo-500 text-white shadow-lg shadow-primary-500/25'
                    : 'hover:bg-white/80 dark:hover:bg-gray-800/70 text-gray-700 dark:text-gray-200 hover:translate-x-0.5'
                }`}
              >
                <span className={`text-base transition-transform ${isActive(item.href) ? '' : 'group-hover:scale-110'}`}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-200/70 dark:border-gray-700/70">
            {user && (
              <div className="mb-3 px-3 py-2.5 rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70">
                <p className="text-sm font-semibold truncate">{user.nome} {user.cognome}</p>
                <div className="mt-0.5 flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.ruolo}</p>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">{oggi}</span>
                </div>
              </div>
            )}
            <button
              onClick={onLogout}
              className="w-full px-3 py-2.5 text-sm rounded-xl bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200/80 dark:border-red-800/70 transition-colors"
            >
              Esci
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 glass-card border-b border-white/60 dark:border-gray-700/70">
          <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/80"
                aria-label="Apri menu"
              >
                ☰
              </button>
              <div className="min-w-0">
                <h1 className="text-lg font-bold tracking-tight truncate">{title}</h1>
                {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>}
              </div>
            </div>
            {actions && <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end w-full sm:w-auto">{actions}</div>}
          </div>
        </header>

        <main className="relative px-4 sm:px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
