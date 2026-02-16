'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppSidebarLayout from '@/components/AppSidebarLayout';
import { auth } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { AziendaSettings } from '@/types';
import { MODULES, ModuleKey } from '@/lib/modules';

interface ModulePlaceholderPageProps {
  moduleKey: ModuleKey;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  highlights: string[];
}

export default function ModulePlaceholderPage({
  moduleKey,
  title,
  subtitle,
  description,
  icon,
  highlights,
}: ModulePlaceholderPageProps) {
  const router = useRouter();
  const hasLoadedRef = useRef(false);
  const [settings, setSettings] = useState<AziendaSettings>({});
  const [darkMode, setDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;

    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    hasLoadedRef.current = true;
    setIsAuthenticated(true);

    const loadedSettings = storage.getSettings();
    setSettings(loadedSettings);

    const isDark = loadedSettings.darkMode || false;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [router]);

  const handleLogout = async () => {
    await auth.logout();
    router.push('/login');
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    const updatedSettings = { ...settings, darkMode: newDarkMode };
    storage.saveSettings(updatedSettings);
    setSettings(updatedSettings);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const moduleConfig = MODULES.find((module) => module.key === moduleKey);
  const isEnabled = moduleConfig?.enabled ?? true;

  if (!isAuthenticated) return null;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-20 left-8 h-72 w-72 rounded-full bg-primary-300/20 blur-3xl dark:bg-primary-700/20" />
      <div className="pointer-events-none absolute top-24 right-4 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-700/20" />

      <AppSidebarLayout
        settings={settings}
        onLogout={handleLogout}
        title={title}
        subtitle={subtitle}
      >
        <section className="mb-8 rounded-2xl border border-white/70 dark:border-gray-700/70 glass-card shadow-xl shadow-slate-900/5 p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-primary-700 dark:text-primary-300 bg-primary-50/80 dark:bg-primary-900/20 border border-primary-200/70 dark:border-primary-800/70 px-3 py-1 rounded-full mb-3">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                Modulo
              </p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <span>{icon}</span>
                <span>{title}</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl">{description}</p>
            </div>

            <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${isEnabled ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
              {isEnabled ? 'Attivo' : 'Disattivato'}
              <p className="text-xs opacity-80 mt-1">{moduleConfig?.envVar}= {String(isEnabled)}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {highlights.slice(0, 3).map((highlight, index) => (
            <div key={highlight} className="rounded-2xl border border-gray-200/70 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 p-5 shadow-lg shadow-slate-900/5">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Widget {index + 1}</p>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">{highlight}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Layout pronto per integrare dati reali del modulo.</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-gray-200/70 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 p-6 shadow-lg shadow-slate-900/5">
          <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4">Roadmap grafica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {highlights.map((highlight, index) => (
              <div key={`${highlight}-${index}`} className="flex items-start gap-3 rounded-xl border border-gray-200/70 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 p-4">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-bold">{index + 1}</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{highlight}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Componente visuale già impostato e pronto per logica/API.</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-8 md:mt-10 py-5 px-4 sm:px-5 rounded-2xl border border-gray-200/70 dark:border-gray-700/70 backdrop-blur-sm bg-white/50 dark:bg-gray-900/30">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 text-left">
              <p>
                <a
                  href="https://www.mistralimpianti.it"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-semibold"
                >
                  Mistral Impianti - Gestionale Interventi
                </a>
              </p>
              <p className="text-xs mt-1">© {new Date().getFullYear()} Mistral Impianti S.R.L.</p>
            </div>

            <button
              onClick={toggleDarkMode}
              className="w-full md:w-auto justify-center md:justify-start flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/60 rounded-xl border border-gray-200/70 dark:border-gray-700 transition-all"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? 'Modalità Scura' : 'Modalità Chiara'}
            </button>
          </div>
        </footer>
      </AppSidebarLayout>
    </div>
  );
}
