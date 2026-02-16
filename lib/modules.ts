export type ModuleKey =
  | 'rapportini'
  | 'interventi_programmati'
  | 'manutenzioni_periodiche'
  | 'clienti_sedi'
  | 'scadenze_compliance'
  | 'statistiche'
  | 'gestione_utenti'
  | 'catalogo_componenti'
  | 'esportazione_pdf'
  | 'email_notifiche';

export interface ModuleDefinition {
  key: ModuleKey;
  title: string;
  description: string;
  icon: string;
  href?: string;
  adminOnly?: boolean;
  badgeClass: string;
  envVar: string;
  enabled: boolean;
}

interface RawModuleDefinition extends Omit<ModuleDefinition, 'enabled'> {
  envValue: string | undefined;
}

function parseEnvBoolean(value: string | undefined, fallback = true): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') return false;
  return fallback;
}

const RAW_MODULES: RawModuleDefinition[] = [
  {
    key: 'rapportini',
    title: 'Rapportini Intervento',
    description: 'Creazione, storico e stampa dei rapportini tecnici.',
    icon: '📝',
    badgeClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30',
    envVar: 'NEXT_PUBLIC_MODULE_RAPPORTINI_ENABLED',
    envValue: process.env.NEXT_PUBLIC_MODULE_RAPPORTINI_ENABLED,
    href: '/',
  },
  {
    key: 'interventi_programmati',
    title: 'Interventi Programmati',
    description: 'Pianificazione attività su impianti elettrici, speciali e antincendio.',
    icon: '📅',
    badgeClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30',
    envVar: 'NEXT_PUBLIC_MODULE_INTERVENTI_PROGRAMMATI_ENABLED',
    envValue: process.env.NEXT_PUBLIC_MODULE_INTERVENTI_PROGRAMMATI_ENABLED,
    href: '/interventi-programmati',
  },
  {
    key: 'manutenzioni_periodiche',
    title: 'Manutenzioni Periodiche',
    description: 'Gestione ricorrenze e checklist manutentive per cliente e sito.',
    icon: '🛠️',
    badgeClass: 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30',
    envVar: 'NEXT_PUBLIC_MODULE_MANUTENZIONI_PERIODICHE_ENABLED',
    envValue: process.env.NEXT_PUBLIC_MODULE_MANUTENZIONI_PERIODICHE_ENABLED,
    href: '/manutenzioni-periodiche',
  },
  {
    key: 'clienti_sedi',
    title: 'Clienti & Sedi',
    description: 'Anagrafiche clienti, contatti e localizzazioni operative.',
    icon: '🏢',
    badgeClass: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
    envVar: 'NEXT_PUBLIC_MODULE_CLIENTI_SEDI_ENABLED',
    envValue: process.env.NEXT_PUBLIC_MODULE_CLIENTI_SEDI_ENABLED,
    href: '/clienti-sedi',
  },
  {
    key: 'scadenze_compliance',
    title: 'Scadenze & Compliance',
    description: 'Monitoraggio scadenze documentali e verifiche impiantistiche.',
    icon: '⏱️',
    badgeClass: 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30',
    envVar: 'NEXT_PUBLIC_MODULE_SCADENZE_COMPLIANCE_ENABLED',
    envValue: process.env.NEXT_PUBLIC_MODULE_SCADENZE_COMPLIANCE_ENABLED,
    href: '/scadenze-compliance',
  },
  {
    key: 'statistiche',
    title: 'Statistiche',
    description: 'Analisi KPI, trend interventi e produttività operativa.',
    icon: '📊',
    badgeClass: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/30',
    envVar: 'NEXT_PUBLIC_MODULE_STATISTICHE_ENABLED',
    envValue: process.env.NEXT_PUBLIC_MODULE_STATISTICHE_ENABLED,
    href: '/admin',
    adminOnly: true,
  },
  {
    key: 'gestione_utenti',
    title: 'Gestione Utenti',
    description: 'Ruoli, abilitazioni e gestione password operatori/admin.',
    icon: '👥',
    badgeClass: 'text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/30',
    envVar: 'NEXT_PUBLIC_MODULE_GESTIONE_UTENTI_ENABLED',
    envValue: process.env.NEXT_PUBLIC_MODULE_GESTIONE_UTENTI_ENABLED,
    href: '/admin/users',
    adminOnly: true,
  },
  {
    key: 'catalogo_componenti',
    title: 'Catalogo Marche/Modelli/Materiali',
    description: 'Gestione catalogo tecnico dei componenti per intervento.',
    icon: '📦',
    badgeClass: 'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30',
    envVar: 'NEXT_PUBLIC_MODULE_CATALOGO_COMPONENTI_ENABLED',
    envValue: process.env.NEXT_PUBLIC_MODULE_CATALOGO_COMPONENTI_ENABLED,
    href: '/catalogo-componenti',
  },
  {
    key: 'esportazione_pdf',
    title: 'Esportazione PDF',
    description: 'Esportazione massiva e archivio documentale in PDF.',
    icon: '📄',
    badgeClass: 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/30',
    envVar: 'NEXT_PUBLIC_MODULE_ESPORTAZIONE_PDF_ENABLED',
    envValue: process.env.NEXT_PUBLIC_MODULE_ESPORTAZIONE_PDF_ENABLED,
    href: '/esportazione-pdf',
  },
  {
    key: 'email_notifiche',
    title: 'Email & Notifiche',
    description: 'Invio notifiche e conferme intervento ai clienti.',
    icon: '✉️',
    badgeClass: 'text-lime-700 dark:text-lime-300 bg-lime-100 dark:bg-lime-900/30',
    envVar: 'NEXT_PUBLIC_MODULE_EMAIL_NOTIFICHE_ENABLED',
    envValue: process.env.NEXT_PUBLIC_MODULE_EMAIL_NOTIFICHE_ENABLED,
    href: '/email-notifiche',
  },
];

export const MODULES: ModuleDefinition[] = RAW_MODULES.map((module) => ({
  ...module,
  enabled: parseEnvBoolean(module.envValue, true),
}));

export function isModuleEnabled(moduleKey: ModuleKey): boolean {
  return MODULES.find((module) => module.key === moduleKey)?.enabled ?? true;
}

export function getEnabledModules(): ModuleDefinition[] {
  return MODULES.filter((module) => module.enabled);
}

export function getSidebarModules(userRole?: 'admin' | 'operatore'): ModuleDefinition[] {
  return MODULES.filter((module) => {
    if (!module.enabled) return false;
    if (!module.href) return false;
    if (module.adminOnly && userRole !== 'admin') return false;
    return true;
  });
}
