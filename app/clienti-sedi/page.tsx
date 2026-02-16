import ModulePlaceholderPage from '@/components/ModulePlaceholderPage';

export default function ClientiSediPage() {
  return (
    <ModulePlaceholderPage
      moduleKey="clienti_sedi"
      title="Clienti & Sedi"
      subtitle="Anagrafiche e localizzazioni operative"
      description="Interfaccia moderna per gestire clienti, sedi operative, contatti e stato contratti."
      icon="🏢"
      highlights={[
        'Anagrafica clienti multi-sede',
        'Contatti tecnici e amministrativi',
        'Timeline attività per sede'
      ]}
    />
  );
}
