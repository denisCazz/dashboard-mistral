export const INTERVENTO_CATEGORIE = [
  'antincendio',
  'manutenzione_elettrica',
  'termoidraulica',
] as const;

export type InterventoCategoria = (typeof INTERVENTO_CATEGORIE)[number];

const CATEGORY_LABELS: Record<InterventoCategoria, string> = {
  antincendio: 'Antincendio',
  manutenzione_elettrica: 'Manutenzione Elettrica',
  termoidraulica: 'Termoidraulica',
};

const CATEGORY_ICONS: Record<InterventoCategoria, string> = {
  antincendio: '🧯',
  manutenzione_elettrica: '⚡',
  termoidraulica: '🛠️',
};

export function getCategoriaLabel(categoria: string): string {
  if (categoria in CATEGORY_LABELS) {
    return CATEGORY_LABELS[categoria as InterventoCategoria];
  }

  if (categoria === 'pellet') return 'Termoidraulica';
  if (categoria === 'legno') return 'Termoidraulica';

  return categoria;
}

export function getCategoriaIcon(categoria: string): string {
  if (categoria in CATEGORY_ICONS) {
    return CATEGORY_ICONS[categoria as InterventoCategoria];
  }

  if (categoria === 'pellet' || categoria === 'legno') {
    return CATEGORY_ICONS.termoidraulica;
  }

  return '📌';
}

export function getCategoriaBadgeClass(categoria: string): string {
  switch (categoria) {
    case 'antincendio':
      return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800';
    case 'manutenzione_elettrica':
      return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800';
    case 'termoidraulica':
    case 'pellet':
    case 'legno':
      return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600';
  }
}
