import ModulePlaceholderPage from '@/components/ModulePlaceholderPage';

export default function EmailNotifichePage() {
  return (
    <ModulePlaceholderPage
      moduleKey="email_notifiche"
      title="Email & Notifiche"
      subtitle="Comunicazioni automatiche clienti"
      description="Interfaccia moderna per configurare template, trigger e monitorare la delivery delle notifiche."
      icon="✉️"
      highlights={[
        'Template email dinamici',
        'Log invii e stato consegna',
        'Regole notifiche automatiche'
      ]}
    />
  );
}
