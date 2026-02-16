'use client';

import { useEffect, useMemo, useState } from 'react';

type AlertPriority = 'alta' | 'media' | 'bassa';

interface DocumentAlert {
  id: string;
  titolo: string;
  cliente_nome: string;
  data_scadenza: string;
  giorniRimanenti: number;
  priorita: AlertPriority;
}

function getPriorityClass(priorita: AlertPriority): string {
  switch (priorita) {
    case 'alta':
      return 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800';
    case 'media':
      return 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
    case 'bassa':
    default:
      return 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
  }
}

export default function DocumentAlertsWidget() {
  const [alerts, setAlerts] = useState<DocumentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/scadenze-compliance?onlyActive=true&limit=3', {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Errore nel caricamento allerte');
        }
        const data = await response.json();
        setAlerts(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || 'Errore nel caricamento allerte');
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, []);

  const urgenti = useMemo(() => alerts.filter((a) => a.priorita === 'alta').length, [alerts]);

  return (
    <section className="mb-8 rounded-2xl border border-white/70 dark:border-gray-700/70 glass-card shadow-xl shadow-slate-900/5 p-5 md:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">Allerte documenti</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Widget rapido per scadenze compliance e verifiche tecniche.</p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800">
          {urgenti} urgente{urgenti === 1 ? '' : 'i'}
        </span>
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Caricamento allerte...</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!loading && !error && alerts.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">Nessuna scadenza attiva.</p>
      )}

      {!loading && !error && alerts.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {alerts.map((alert) => (
          <article key={alert.id} className="rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="font-semibold text-gray-900 dark:text-white leading-tight">{alert.titolo}</p>
              <span className={`shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full border ${getPriorityClass(alert.priorita)}`}>
                {alert.priorita}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{alert.cliente_nome}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Scadenza: {alert.data_scadenza}</span>
              <span>{alert.giorniRimanenti} gg</span>
            </div>
          </article>
        ))}
      </div>
      )}
    </section>
  );
}
