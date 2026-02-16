'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppSidebarLayout from '@/components/AppSidebarLayout';
import { auth } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { AziendaSettings } from '@/types';
import { isModuleEnabled } from '@/lib/modules';

type Priorita = 'alta' | 'media' | 'bassa';
type StatoScadenza = 'attiva' | 'completata' | 'annullata';

interface ScadenzaItem {
  id: string;
  titolo: string;
  cliente_nome: string;
  categoria: string;
  data_scadenza: string;
  priorita: Priorita;
  stato: StatoScadenza;
  giorniRimanenti: number;
  note?: string | null;
}

interface ScadenzaFormState {
  titolo: string;
  cliente_nome: string;
  categoria: string;
  data_scadenza: string;
  priorita: Priorita;
  stato: StatoScadenza;
  note: string;
}

const INITIAL_FORM: ScadenzaFormState = {
  titolo: '',
  cliente_nome: '',
  categoria: '',
  data_scadenza: '',
  priorita: 'media',
  stato: 'attiva',
  note: '',
};

function getPriorityClass(priorita: Priorita): string {
  switch (priorita) {
    case 'alta':
      return 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800';
    case 'media':
      return 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
    default:
      return 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
  }
}

export default function ScadenzeCompliancePage() {
  const router = useRouter();
  const hasLoadedRef = useRef(false);

  const [settings, setSettings] = useState<AziendaSettings>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [items, setItems] = useState<ScadenzaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'tutte' | StatoScadenza>('tutte');
  const [form, setForm] = useState<ScadenzaFormState>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;

    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    hasLoadedRef.current = true;
    setIsAuthenticated(true);
    setSettings(storage.getSettings());
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    loadScadenze();
  }, [isAuthenticated]);

  const loadScadenze = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/scadenze-compliance', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Errore nel caricamento scadenze compliance');
      }
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Errore nel caricamento scadenze compliance');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.logout();
    router.push('/login');
  };

  const isEnabled = isModuleEnabled('scadenze_compliance');

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
  };

  const handleEdit = (item: ScadenzaItem) => {
    setEditingId(item.id);
    setForm({
      titolo: item.titolo,
      cliente_nome: item.cliente_nome,
      categoria: item.categoria,
      data_scadenza: item.data_scadenza,
      priorita: item.priorita,
      stato: item.stato,
      note: item.note || '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questa scadenza?')) return;
    try {
      const response = await fetch(`/api/scadenze-compliance/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error || 'Errore eliminazione scadenza');
      }
      await loadScadenze();
      if (editingId === id) resetForm();
    } catch (err: any) {
      alert(err.message || 'Errore eliminazione scadenza');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.titolo || !form.cliente_nome || !form.categoria || !form.data_scadenza) {
      alert('Compila tutti i campi obbligatori');
      return;
    }

    try {
      setSaving(true);
      const url = editingId ? `/api/scadenze-compliance/${editingId}` : '/api/scadenze-compliance';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error || 'Errore salvataggio scadenza');
      }

      resetForm();
      await loadScadenze();
    } catch (err: any) {
      alert(err.message || 'Errore salvataggio scadenza');
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (filter === 'tutte') return items;
    return items.filter((item) => item.stato === filter);
  }, [items, filter]);

  const kpi = useMemo(() => {
    const attive = items.filter((item) => item.stato === 'attiva').length;
    const urgenti = items.filter((item) => item.stato === 'attiva' && item.priorita === 'alta').length;
    const scadute = items.filter((item) => item.stato === 'attiva' && item.giorniRimanenti < 0).length;
    return { attive, urgenti, scadute, totale: items.length };
  }, [items]);

  if (!isAuthenticated) return null;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-20 left-8 h-72 w-72 rounded-full bg-primary-300/20 blur-3xl dark:bg-primary-700/20" />
      <div className="pointer-events-none absolute top-24 right-4 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-700/20" />

      <AppSidebarLayout
        settings={settings}
        onLogout={handleLogout}
        title="Scadenze & Compliance"
        subtitle="Monitoraggio documentale e priorità operative"
      >
        {!isEnabled ? (
          <div className="glass-card rounded-2xl shadow-xl p-8 text-center border border-white/70 dark:border-gray-700/70">
            <p className="text-gray-700 dark:text-gray-300">
              Il modulo è disattivato da .env. Imposta NEXT_PUBLIC_MODULE_SCADENZE_COMPLIANCE_ENABLED=true.
            </p>
          </div>
        ) : (
          <>
            <section className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-gray-200/70 dark:border-gray-700 bg-white/80 dark:bg-gray-800/70 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Totale scadenze</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.totale}</p>
              </div>
              <div className="rounded-xl border border-indigo-200/70 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-900/20 p-4">
                <p className="text-xs text-indigo-600 dark:text-indigo-300">Attive</p>
                <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-200">{kpi.attive}</p>
              </div>
              <div className="rounded-xl border border-red-200/70 dark:border-red-800 bg-red-50/70 dark:bg-red-900/20 p-4">
                <p className="text-xs text-red-600 dark:text-red-300">Urgenti</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-200">{kpi.urgenti}</p>
              </div>
              <div className="rounded-xl border border-amber-200/70 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-900/20 p-4">
                <p className="text-xs text-amber-600 dark:text-amber-300">Scadute</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-200">{kpi.scadute}</p>
              </div>
            </section>

            <section className="glass-card rounded-2xl border border-white/70 dark:border-gray-700/70 shadow-xl shadow-slate-900/5 p-5 md:p-6">
              <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-gray-200/70 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 p-4 md:p-5">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editingId ? 'Modifica scadenza' : 'Nuova scadenza'}
                  </h3>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      Annulla modifica
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <input
                    type="text"
                    value={form.titolo}
                    onChange={(e) => setForm((prev) => ({ ...prev, titolo: e.target.value }))}
                    placeholder="Titolo*"
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                  <input
                    type="text"
                    value={form.cliente_nome}
                    onChange={(e) => setForm((prev) => ({ ...prev, cliente_nome: e.target.value }))}
                    placeholder="Cliente*"
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                  <input
                    type="text"
                    value={form.categoria}
                    onChange={(e) => setForm((prev) => ({ ...prev, categoria: e.target.value }))}
                    placeholder="Categoria*"
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                  <input
                    type="date"
                    value={form.data_scadenza}
                    onChange={(e) => setForm((prev) => ({ ...prev, data_scadenza: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <select
                    value={form.priorita}
                    onChange={(e) => setForm((prev) => ({ ...prev, priorita: e.target.value as Priorita }))}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  >
                    <option value="alta">Priorità alta</option>
                    <option value="media">Priorità media</option>
                    <option value="bassa">Priorità bassa</option>
                  </select>
                  <select
                    value={form.stato}
                    onChange={(e) => setForm((prev) => ({ ...prev, stato: e.target.value as StatoScadenza }))}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  >
                    <option value="attiva">Attiva</option>
                    <option value="completata">Completata</option>
                    <option value="annullata">Annullata</option>
                  </select>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
                  >
                    {saving ? 'Salvataggio...' : editingId ? 'Aggiorna scadenza' : 'Aggiungi scadenza'}
                  </button>
                </div>

                <textarea
                  value={form.note}
                  onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="Note (opzionale)"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
              </form>

              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">Registro scadenze</h2>
                <div className="flex gap-2">
                  {(['tutte', 'attiva', 'completata', 'annullata'] as const).map((value) => (
                    <button
                      key={value}
                      onClick={() => setFilter(value)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        filter === value
                          ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {value === 'tutte' ? 'Tutte' : value}
                    </button>
                  ))}
                </div>
              </div>

              {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Caricamento scadenze...</p>}
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              {!loading && !error && filteredItems.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Nessuna scadenza trovata.</p>
              )}

              {!loading && !error && filteredItems.length > 0 && (
                <div className="space-y-3">
                  {filteredItems.map((item) => (
                    <article key={item.id} className="rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{item.titolo}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{item.cliente_nome} • {item.categoria}</p>
                        </div>
                        <span className={`text-[11px] font-semibold px-2 py-1 rounded-full border ${getPriorityClass(item.priorita)}`}>
                          {item.priorita}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-2">
                        <span>Scadenza: {item.data_scadenza}</span>
                        <span>{item.giorniRimanenti} giorni</span>
                        <span className="capitalize">Stato: {item.stato}</span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20"
                        >
                          Modifica
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20"
                        >
                          Elimina
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </AppSidebarLayout>
    </div>
  );
}
