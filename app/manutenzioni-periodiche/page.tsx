import ModulePlaceholderPage from '@/components/ModulePlaceholderPage';

export default function ManutenzioniPeriodichePage() {
  return (
    <ModulePlaceholderPage
      moduleKey="manutenzioni_periodiche"
      title="Manutenzioni Periodiche"
      subtitle="Scadenziario interventi ricorrenti"
      description="Layout dedicato alle manutenzioni cicliche con focus su prossime scadenze, check-list e stato compliance."
      icon="🛠️"
      highlights={[
        'Scadenze per cliente/sito',
        'Check-list digitali tecniche',
        'Storico manutenzioni con esiti'
      ]}
    />
  );
}
