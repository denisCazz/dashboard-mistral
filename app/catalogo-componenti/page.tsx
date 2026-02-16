import ModulePlaceholderPage from '@/components/ModulePlaceholderPage';

export default function CatalogoComponentiPage() {
  return (
    <ModulePlaceholderPage
      moduleKey="catalogo_componenti"
      title="Catalogo Componenti"
      subtitle="Marche, modelli e materiali"
      description="UI pronta per gestire il catalogo tecnico con ricerca rapida e classificazione componenti."
      icon="📦"
      highlights={[
        'Albero marche → modelli → materiali',
        'Ricerca full-text componenti',
        'Tag tecnici e compatibilità'
      ]}
    />
  );
}
