'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, isToday, startOfMonth, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import AppSidebarLayout from '@/components/AppSidebarLayout';
import { auth } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { AziendaSettings } from '@/types';
import { isModuleEnabled } from '@/lib/modules';

type StatoIntervento = 'Pianificato' | 'Confermato' | 'Critico';

interface InterventoPianificato {
  id: string;
  data: string;
  ora: string;
  titolo: string;
  cliente: string;
  tecnico: string;
  zona: string;
  stato: StatoIntervento;
}

interface DbIntervento {
  id: string;
  titolo: string;
  cliente_nome: string;
  data_intervento: string;
  ora_intervento: string;
  tecnico: string;
  zona: string;
  stato: StatoIntervento;
}

function getStatusClass(stato: StatoIntervento): string {
  switch (stato) {
    case 'Confermato':
      return 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
    case 'Critico':
      return 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800';
    case 'Pianificato':
    default:
      return 'text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800';
  }
}

export default function InterventiProgrammatiPage() {
  const router = useRouter();
  const hasLoadedRef = useRef(false);
  const [settings, setSettings] = useState<AziendaSettings>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [monthCursor, setMonthCursor] = useState(new Date(2026, 1, 1));
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 1, 17));
  const [interventi, setInterventi] = useState<InterventoPianificato[]>([]);
  const [loadingInterventi, setLoadingInterventi] = useState(true);
  const [errorInterventi, setErrorInterventi] = useState<string | null>(null);

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

  const handleLogout = async () => {
    await auth.logout();
    router.push('/login');
  };

  const isEnabled = isModuleEnabled('interventi_programmati');

  useEffect(() => {
    if (!isAuthenticated || !isEnabled) return;

    const loadInterventi = async () => {
      try {
        setLoadingInterventi(true);
        setErrorInterventi(null);
        const monthParam = format(monthCursor, 'yyyy-MM');
        const response = await fetch(`/api/interventi-programmati?month=${monthParam}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Errore caricamento interventi programmati');
        }

        const data: DbIntervento[] = await response.json();
        const mapped = (Array.isArray(data) ? data : []).map((item) => ({
          id: item.id,
          data: item.data_intervento,
          ora: item.ora_intervento?.slice(0, 5) || '00:00',
          titolo: item.titolo,
          cliente: item.cliente_nome,
          tecnico: item.tecnico,
          zona: item.zona,
          stato: item.stato,
        }));
        setInterventi(mapped);
      } catch (error: any) {
        setErrorInterventi(error.message || 'Errore caricamento interventi');
        setInterventi([]);
      } finally {
        setLoadingInterventi(false);
      }
    };

    loadInterventi();
  }, [isAuthenticated, isEnabled, monthCursor]);

  const calendarDays = useMemo(() => {
    const first = startOfMonth(monthCursor);
    const last = endOfMonth(monthCursor);
    return eachDayOfInterval({ start: first, end: last });
  }, [monthCursor]);

  const interventionsByDay = useMemo(() => {
    return interventi.reduce<Record<string, InterventoPianificato[]>>((acc, intervento) => {
      const key = intervento.data;
      if (!acc[key]) acc[key] = [];
      acc[key].push(intervento);
      return acc;
    }, {});
  }, [interventi]);

  const selectedInterventi = useMemo(() => {
    const key = format(selectedDate, 'yyyy-MM-dd');
    return interventionsByDay[key] || [];
  }, [interventionsByDay, selectedDate]);

  const kpi = useMemo(() => {
    const totale = interventi.length;
    const critici = interventi.filter((i) => i.stato === 'Critico').length;
    const confermati = interventi.filter((i) => i.stato === 'Confermato').length;
    const completion = Math.round((confermati / totale) * 100);
    return { totale, critici, confermati, completion: Number.isFinite(completion) ? completion : 0 };
  }, [interventi]);

  if (!isAuthenticated) return null;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-20 left-8 h-72 w-72 rounded-full bg-primary-300/20 blur-3xl dark:bg-primary-700/20" />
      <div className="pointer-events-none absolute top-24 right-4 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-700/20" />

      <AppSidebarLayout
        settings={settings}
        onLogout={handleLogout}
        title="Interventi Programmati"
        subtitle="Calendario intelligente e ottimizzazione carichi"
      >
        {!isEnabled ? (
          <div className="glass-card rounded-2xl shadow-xl p-8 text-center border border-white/70 dark:border-gray-700/70">
            <p className="text-gray-700 dark:text-gray-300">
              Il modulo è disattivato da .env. Imposta NEXT_PUBLIC_MODULE_INTERVENTI_PROGRAMMATI_ENABLED=true.
            </p>
          </div>
        ) : (
          <>
            <section className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-gray-200/70 dark:border-gray-700 bg-white/80 dark:bg-gray-800/70 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">Interventi mese</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.totale}</p>
              </div>
              <div className="rounded-xl border border-red-200/70 dark:border-red-800 bg-red-50/70 dark:bg-red-900/20 p-4">
                <p className="text-xs text-red-600 dark:text-red-300">Critici</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-200">{kpi.critici}</p>
              </div>
              <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/20 p-4">
                <p className="text-xs text-emerald-600 dark:text-emerald-300">Confermati</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-200">{kpi.confermati}</p>
              </div>
              <div className="rounded-xl border border-primary-200/70 dark:border-primary-800 bg-primary-50/70 dark:bg-primary-900/20 p-4">
                <p className="text-xs text-primary-600 dark:text-primary-300">Saturazione agenda</p>
                <p className="text-2xl font-bold text-primary-700 dark:text-primary-200">{kpi.completion}%</p>
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="xl:col-span-2 glass-card rounded-2xl border border-white/70 dark:border-gray-700/70 shadow-xl shadow-slate-900/5 p-5 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                    Control Calendar • {format(monthCursor, 'MMMM yyyy', { locale: it })}
                  </h2>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => setMonthCursor((prev) => subMonths(prev, 1))}
                      className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/70 text-sm"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setMonthCursor(new Date(2026, 1, 1))}
                      className="px-3 py-2 rounded-lg border border-primary-200 dark:border-primary-700 bg-primary-50/80 dark:bg-primary-900/20 text-sm font-semibold text-primary-700 dark:text-primary-300"
                    >
                      Oggi
                    </button>
                    <button
                      onClick={() => setMonthCursor((prev) => addMonths(prev, 1))}
                      className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/70 text-sm"
                    >
                      →
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[680px]">
                    <div className="grid grid-cols-7 gap-2 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
                        <div key={day} className="px-2 py-1">{day}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {calendarDays.map((day) => {
                        const key = format(day, 'yyyy-MM-dd');
                        const items = interventionsByDay[key] || [];
                        const hasCritical = items.some((i) => i.stato === 'Critico');
                        const active = isSameDay(day, selectedDate);

                        return (
                          <button
                            key={key}
                            onClick={() => setSelectedDate(day)}
                            className={`min-h-[84px] sm:min-h-[96px] rounded-xl border p-2 text-left transition-all ${
                              active
                                ? 'border-primary-400 bg-primary-50/80 dark:bg-primary-900/25 shadow-lg shadow-primary-900/10'
                                : 'border-gray-200/80 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 hover:border-primary-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-sm font-semibold ${isToday(day) ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                {format(day, 'd')}
                              </span>
                              {hasCritical && <span className="h-2 w-2 rounded-full bg-red-500" />}
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">{items.length} interventi</p>
                            <div className="mt-2 flex gap-1">
                              {items.slice(0, 3).map((item) => (
                                <span
                                  key={item.id}
                                  className={`h-1.5 flex-1 rounded-full ${item.stato === 'Critico' ? 'bg-red-400' : item.stato === 'Confermato' ? 'bg-emerald-400' : 'bg-indigo-400'}`}
                                />
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {loadingInterventi && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Caricamento interventi...</p>
                )}
                {errorInterventi && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-4">{errorInterventi}</p>
                )}
              </div>

              <aside className="glass-card rounded-2xl border border-white/70 dark:border-gray-700/70 shadow-xl shadow-slate-900/5 p-5 md:p-6">
                <h3 className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white mb-1">Agenda giornaliera</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {format(selectedDate, 'EEEE d MMMM yyyy', { locale: it })}
                </p>

                {selectedInterventi.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
                    Nessun intervento pianificato.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedInterventi.map((intervento) => (
                      <article key={intervento.id} className="rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-semibold text-gray-900 dark:text-white leading-tight">{intervento.titolo}</p>
                          <span className={`text-[11px] font-semibold px-2 py-1 rounded-full border ${getStatusClass(intervento.stato)}`}>
                            {intervento.stato}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{intervento.cliente}</p>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{intervento.ora} • {intervento.tecnico}</span>
                          <span>{intervento.zona}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                <div className="mt-5 rounded-xl border border-primary-200/70 dark:border-primary-800 bg-primary-50/70 dark:bg-primary-900/20 p-4">
                  <p className="text-xs uppercase tracking-wide font-semibold text-primary-700 dark:text-primary-300 mb-1">Suggerimento AI</p>
                  <p className="text-sm text-primary-800 dark:text-primary-200">
                    Conviene anticipare gli interventi critici in zona Sud alle 09:00 per ridurre i tempi morti del 18%.
                  </p>
                </div>
              </aside>
            </section>
          </>
        )}
      </AppSidebarLayout>
    </div>
  );
}
