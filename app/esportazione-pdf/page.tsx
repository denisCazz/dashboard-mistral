import ModulePlaceholderPage from '@/components/ModulePlaceholderPage';

export default function EsportazionePdfPage() {
  return (
    <ModulePlaceholderPage
      moduleKey="esportazione_pdf"
      title="Esportazione PDF"
      subtitle="Archivio e produzione documentale"
      description="Schermata grafica per esportazioni massive, code di generazione e storico file prodotti."
      icon="📄"
      highlights={[
        'Coda esportazioni multi-documento',
        'Template PDF brandizzati',
        'Storico download e audit'
      ]}
    />
  );
}
