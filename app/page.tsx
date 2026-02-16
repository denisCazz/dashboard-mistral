'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Rapportino, AziendaSettings } from '@/types';
import { storage } from '@/lib/storage';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Suspense, lazy } from 'react';
import RapportiniList from '@/components/RapportiniList';
import AppSidebarLayout from '@/components/AppSidebarLayout';
import InstallPWA from '@/components/InstallPWA';
import { isModuleEnabled } from '@/lib/modules';
import DocumentAlertsWidget from '@/components/DocumentAlertsWidget';

// Dynamic import per componenti pesanti - migliora il bundle splitting
const RapportinoForm = lazy(() => import('@/components/RapportinoForm'));

export default function Home() {
  const router = useRouter();
  const [rapportini, setRapportini] = useState<Rapportino[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [settings, setSettings] = useState<AziendaSettings>({});
  const [darkMode, setDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false); // Previene doppie chiamate in React Strict Mode

  useEffect(() => {
    // Previene doppie chiamate in React Strict Mode
    if (hasLoadedRef.current) return;
    
    // Verifica autenticazione
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    hasLoadedRef.current = true;
    setIsAuthenticated(true);
    loadRapportini();
    const loadedSettings = storage.getSettings();
    setSettings(loadedSettings);
    
    // Carica dark mode
    const isDark = loadedSettings.darkMode || false;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Rimuoviamo router dalle dipendenze - non è necessario

  const loadRapportini = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRapportini();
      setRapportini(data);
    } catch (err: any) {
      setError(err.message || 'Errore nel caricamento dei rapportini');
      console.error('Error loading rapportini:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRapportino = async (rapportino: Rapportino) => {
    try {
      await api.createRapportino(rapportino);
      await loadRapportini();
      setShowForm(false);
    } catch (err: any) {
      alert(err.message || 'Errore nel salvataggio del rapportino');
    }
  };

  const handleDeleteRapportino = async (id: string) => {
    try {
      await api.deleteRapportino(id);
      await loadRapportini();
    } catch (err: any) {
      alert(err.message || 'Errore nell\'eliminazione del rapportino');
    }
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

  const handleExportPDFs = async () => {
    if (rapportini.length === 0) {
      alert('Nessun rapportino da esportare');
      return;
    }
    try {
      // Dynamic import solo quando necessario per ridurre il bundle iniziale
      const { exportAllPDFs } = await import('@/lib/pdfGenerator');
      await exportAllPDFs(rapportini, settings);
    } catch (error: any) {
      console.error('Error exporting PDFs:', error);
      alert('Errore durante l\'esportazione dei PDF');
    }
  };

  const handleLogout = async () => {
    await auth.logout();
    router.push('/login');
  };

  const rapportiniEnabled = isModuleEnabled('rapportini');
  const exportPdfEnabled = isModuleEnabled('esportazione_pdf');

  if (!isAuthenticated) {
    return null; // Mostra nulla mentre verifica l'autenticazione
  }

  const rapportiniMese = rapportini.filter((r) => {
    const data = new Date(r.intervento.data);
    const oggi = new Date();
    return data.getMonth() === oggi.getMonth() && data.getFullYear() === oggi.getFullYear();
  }).length;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-20 left-8 h-72 w-72 rounded-full bg-primary-300/20 blur-3xl dark:bg-primary-700/20" />
      <div className="pointer-events-none absolute top-24 right-4 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-700/20" />

      <AppSidebarLayout
        settings={settings}
        onLogout={handleLogout}
        title="Dashboard Mistral Impianti"
        subtitle="Gestionale operativo per interventi e manutenzioni"
        actions={(
          <>
            {rapportiniEnabled && (
              <button
                onClick={() => setShowForm(true)}
                className="px-3 py-2 sm:px-3.5 sm:py-2.5 bg-gradient-to-r from-primary-500 to-indigo-500 text-white rounded-xl hover:from-primary-600 hover:to-indigo-600 text-xs sm:text-sm font-semibold shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5"
              >
                Nuovo Rapportino
              </button>
            )}
            {rapportiniEnabled && exportPdfEnabled && (
              <button
                onClick={handleExportPDFs}
                className="px-3 py-2 sm:px-3.5 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5"
              >
                Esporta PDF
              </button>
            )}
          </>
        )}
      >
        <div className="mb-8 rounded-2xl border border-white/70 dark:border-gray-700/70 glass-card shadow-xl shadow-slate-900/5 p-6 md:p-7">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-primary-700 dark:text-primary-300 bg-primary-50/80 dark:bg-primary-900/20 border border-primary-200/70 dark:border-primary-800/70 px-3 py-1 rounded-full mb-3">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                Operativo
              </p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
                Dashboard Mistral Impianti
              </h1>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
                Controllo centralizzato per interventi su impianti elettrici, speciali e antincendio.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full sm:w-auto min-w-0 sm:min-w-[220px]">
              <div className="rounded-xl border border-gray-200/70 dark:border-gray-700 bg-white/80 dark:bg-gray-800/70 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Totale rapportini</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{rapportiniEnabled ? rapportini.length : '-'}</p>
              </div>
              <div className="rounded-xl border border-gray-200/70 dark:border-gray-700 bg-white/80 dark:bg-gray-800/70 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Mese corrente</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{rapportiniEnabled ? rapportiniMese : '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {isModuleEnabled('scadenze_compliance') && <DocumentAlertsWidget />}

        {error && (
          <div className="mb-6 bg-red-50/90 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 shadow-lg shadow-red-900/5">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <button
                onClick={loadRapportini}
                className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline text-sm"
              >
                Riprova
              </button>
            </div>
          </div>
        )}

        {rapportiniEnabled && showForm && (
          <Suspense fallback={
            <div className="glass-card rounded-2xl shadow-xl p-12 text-center border border-white/70 dark:border-gray-700/70">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Caricamento form...</p>
            </div>
          }>
            <RapportinoForm
              onSave={handleSaveRapportino}
              onCancel={() => setShowForm(false)}
            />
          </Suspense>
        )}

        {!rapportiniEnabled ? (
          <div className="glass-card rounded-2xl shadow-xl p-8 text-center border border-white/70 dark:border-gray-700/70">
            <p className="text-gray-700 dark:text-gray-300">
              Il modulo rapportini è disattivato. Imposta NEXT_PUBLIC_MODULE_RAPPORTINI_ENABLED=true nel file .env.
            </p>
          </div>
        ) : loading ? (
          <div className="glass-card rounded-2xl shadow-xl p-12 text-center border border-white/70 dark:border-gray-700/70">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Caricamento rapportini...</p>
          </div>
        ) : (
          <RapportiniList
            rapportini={rapportini}
            onDelete={handleDeleteRapportino}
            settings={settings}
          />
        )}

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
                {' è il sistema gestionale dedicato a '}
                <a
                  href="https://www.mistralimpianti.it"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-semibold"
                >
                  Mistral Impianti S.R.L.
                </a>
              </p>
              <p className="text-xs mt-1">
                © {new Date().getFullYear()} Mistral Impianti S.R.L. - Tutti i diritti riservati
              </p>
            </div>

            <button
              onClick={toggleDarkMode}
              className="w-full md:w-auto justify-center md:justify-start flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/60 rounded-xl border border-gray-200/70 dark:border-gray-700 transition-all"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span>Modalità Scura</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Modalità Chiara</span>
                </>
              )}
            </button>
          </div>
        </footer>

      </AppSidebarLayout>
      
      <InstallPWA />
    </div>
  );
}
