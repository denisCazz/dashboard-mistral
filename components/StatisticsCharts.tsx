'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import { INTERVENTO_CATEGORIE, getCategoriaLabel } from '@/lib/intervento-categorie';

interface ClienteStatistiche {
  cliente: {
    id: string;
    nome: string;
    cognome: string;
  };
  rapportini: Array<{
    id: string;
    dataIntervento: string;
    tipoStufa: string;
    tipoIntervento: string;
  }>;
  statistiche: {
    totale: number;
    categorie: Record<string, number>;
    tipiIntervento: Record<string, number>;
  };
}

interface StatisticsChartsProps {
  data: ClienteStatistiche[];
}

// Palette con colori ad alto contrasto
const CHART_COLORS = {
  antincendio: '#ef4444',
  manutenzione_elettrica: '#3b82f6',
  termoidraulica: '#f59e0b',
  primary: '#3b82f6',   // Blu
  secondary: '#a855f7', // Viola
  accent: '#f59e0b',    // Ambra
  teal: '#14b8a6',      // Teal
  pink: '#ec4899',      // Rosa
  indigo: '#6366f1',    // Indigo
};

// Colori per barre multiple (alto contrasto)
const BAR_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#6366f1'];

export default function StatisticsCharts({ data }: StatisticsChartsProps) {
  // Dati per grafico a torta tipo stufa
  const pieData = useMemo(() => {
    const totals = INTERVENTO_CATEGORIE.reduce((acc, categoria) => {
      acc[categoria] = 0;
      return acc;
    }, {} as Record<string, number>);

    data.forEach((stat) => {
      INTERVENTO_CATEGORIE.forEach((categoria) => {
        totals[categoria] += stat.statistiche.categorie?.[categoria] || 0;
      });
    });

    return INTERVENTO_CATEGORIE.map((categoria) => ({
      name: getCategoriaLabel(categoria),
      value: totals[categoria],
      color: CHART_COLORS[categoria],
    }));
  }, [data]);

  // Dati per grafico tipi intervento
  const interventoData = useMemo(() => {
    const tipiCount: Record<string, number> = {};
    data.forEach((stat) => {
      Object.entries(stat.statistiche.tipiIntervento).forEach(([tipo, count]) => {
        tipiCount[tipo] = (tipiCount[tipo] || 0) + count;
      });
    });
    return Object.entries(tipiCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [data]);

  // Dati per grafico trend mensile (ultimi 12 mesi)
  const trendData = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(now, 11),
      end: now,
    });

    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const categorie = {
        antincendio: 0,
        manutenzione_elettrica: 0,
        termoidraulica: 0,
      };

      data.forEach((stat) => {
        stat.rapportini.forEach((r) => {
          const date = parseISO(r.dataIntervento);
          if (date >= monthStart && date <= monthEnd) {
            const key = r.tipoStufa === 'pellet' || r.tipoStufa === 'legno' ? 'termoidraulica' : r.tipoStufa;
            if (key in categorie) {
              categorie[key as keyof typeof categorie]++;
            }
          }
        });
      });

      return {
        name: format(month, 'MMM yy', { locale: it }),
        ...categorie,
        totale: categorie.antincendio + categorie.manutenzione_elettrica + categorie.termoidraulica,
      };
    });
  }, [data]);

  // Top 5 clienti per numero di rapportini
  const topClienti = useMemo(() => {
    return [...data]
      .sort((a, b) => b.statistiche.totale - a.statistiche.totale)
      .slice(0, 5)
      .map((stat) => ({
        name: `${stat.cliente.nome} ${stat.cliente.cognome}`.substring(0, 15),
        antincendio: stat.statistiche.categorie?.antincendio || 0,
        manutenzione_elettrica: stat.statistiche.categorie?.manutenzione_elettrica || 0,
        termoidraulica: stat.statistiche.categorie?.termoidraulica || 0,
      }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Nessun dato disponibile per i grafici
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Prima riga: Pie chart e Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuzione categorie impianto */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Distribuzione categorie impianto
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Mensile */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Trend Interventi (ultimi 12 mesi)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="antincendio"
                stackId="1"
                stroke={CHART_COLORS.antincendio}
                fill={CHART_COLORS.antincendio}
                fillOpacity={0.7}
                name="Antincendio"
              />
              <Area
                type="monotone"
                dataKey="manutenzione_elettrica"
                stackId="1"
                stroke={CHART_COLORS.manutenzione_elettrica}
                fill={CHART_COLORS.manutenzione_elettrica}
                fillOpacity={0.7}
                name="Manutenzione Elettrica"
              />
              <Area
                type="monotone"
                dataKey="termoidraulica"
                stackId="1"
                stroke={CHART_COLORS.termoidraulica}
                fill={CHART_COLORS.termoidraulica}
                fillOpacity={0.7}
                name="Termoidraulica"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Seconda riga: Tipi Intervento e Top Clienti */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tipi di Intervento */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tipi di Intervento
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={interventoData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Interventi">
                {interventoData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Clienti */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top 5 Clienti
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topClienti}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="antincendio" stackId="a" fill={CHART_COLORS.antincendio} name="Antincendio" radius={[0, 0, 0, 0]} />
              <Bar dataKey="manutenzione_elettrica" stackId="a" fill={CHART_COLORS.manutenzione_elettrica} name="Manutenzione Elettrica" radius={[0, 0, 0, 0]} />
              <Bar dataKey="termoidraulica" stackId="a" fill={CHART_COLORS.termoidraulica} name="Termoidraulica" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
