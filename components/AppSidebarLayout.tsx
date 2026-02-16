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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.logo || '/logo.png'}
                alt={settings.nomeAzienda || 'Logo'}
                className="h-10 w-10 object-contain rounded"
              />
              <div className="min-w-0">
                <p className="font-semibold truncate">{settings.nomeAzienda || 'Mistral Impianti'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Gestionale interventi</p>
              </div>
            </div>

            <div className="mt-4 relative">
              <input
                type="text"
                placeholder="Cerca voce menu..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full px-3 py-2 pr-9 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            {user && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <p className="text-sm font-medium truncate">{user.nome} {user.cognome}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.ruolo}</p>
              </div>
            )}
            <button
              onClick={onLogout}
              className="w-full px-3 py-2 text-sm rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
            >
              Esci
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-md border border-gray-300 dark:border-gray-600"
                aria-label="Apri menu"
              >
                ☰
              </button>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold truncate">{title}</h1>
                {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>}
              </div>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </header>

        <main className="px-4 sm:px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
