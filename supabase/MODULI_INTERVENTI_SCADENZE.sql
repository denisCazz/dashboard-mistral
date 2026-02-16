-- =====================================================
-- MODULI: INTERVENTI PROGRAMMATI + SCADENZE COMPLIANCE
-- =====================================================
-- Eseguire nello SQL Editor di Supabase

-- 1) TABELLA INTERVENTI PROGRAMMATI
CREATE TABLE IF NOT EXISTS public.interventi_programmati (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL DEFAULT 'mistral',
  titolo text NOT NULL,
  cliente_nome text NOT NULL,
  data_intervento date NOT NULL,
  ora_intervento time NOT NULL,
  tecnico text NOT NULL,
  zona text NOT NULL,
  stato text NOT NULL CHECK (stato IN ('Pianificato', 'Confermato', 'Critico')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interventi_programmati_org_data
  ON public.interventi_programmati(org_id, data_intervento);

CREATE INDEX IF NOT EXISTS idx_interventi_programmati_stato
  ON public.interventi_programmati(org_id, stato);

-- 2) TABELLA SCADENZE COMPLIANCE
CREATE TABLE IF NOT EXISTS public.scadenze_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL DEFAULT 'mistral',
  titolo text NOT NULL,
  cliente_nome text NOT NULL,
  categoria text NOT NULL,
  data_scadenza date NOT NULL,
  priorita text NOT NULL CHECK (priorita IN ('alta', 'media', 'bassa')),
  stato text NOT NULL DEFAULT 'attiva' CHECK (stato IN ('attiva', 'completata', 'annullata')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scadenze_compliance_org_data
  ON public.scadenze_compliance(org_id, data_scadenza);

CREATE INDEX IF NOT EXISTS idx_scadenze_compliance_stato_priorita
  ON public.scadenze_compliance(org_id, stato, priorita);

-- 3) TRIGGER updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_interventi_programmati_updated_at ON public.interventi_programmati;
CREATE TRIGGER trg_interventi_programmati_updated_at
  BEFORE UPDATE ON public.interventi_programmati
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_scadenze_compliance_updated_at ON public.scadenze_compliance;
CREATE TRIGGER trg_scadenze_compliance_updated_at
  BEFORE UPDATE ON public.scadenze_compliance
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4) RLS
ALTER TABLE public.interventi_programmati ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scadenze_compliance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS interventi_programmati_select_policy ON public.interventi_programmati;
DROP POLICY IF EXISTS interventi_programmati_insert_policy ON public.interventi_programmati;
DROP POLICY IF EXISTS interventi_programmati_update_policy ON public.interventi_programmati;
DROP POLICY IF EXISTS interventi_programmati_delete_policy ON public.interventi_programmati;

CREATE POLICY interventi_programmati_select_policy
  ON public.interventi_programmati
  FOR SELECT USING (true);

CREATE POLICY interventi_programmati_insert_policy
  ON public.interventi_programmati
  FOR INSERT WITH CHECK (true);

CREATE POLICY interventi_programmati_update_policy
  ON public.interventi_programmati
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY interventi_programmati_delete_policy
  ON public.interventi_programmati
  FOR DELETE USING (true);

DROP POLICY IF EXISTS scadenze_compliance_select_policy ON public.scadenze_compliance;
DROP POLICY IF EXISTS scadenze_compliance_insert_policy ON public.scadenze_compliance;
DROP POLICY IF EXISTS scadenze_compliance_update_policy ON public.scadenze_compliance;
DROP POLICY IF EXISTS scadenze_compliance_delete_policy ON public.scadenze_compliance;

CREATE POLICY scadenze_compliance_select_policy
  ON public.scadenze_compliance
  FOR SELECT USING (true);

CREATE POLICY scadenze_compliance_insert_policy
  ON public.scadenze_compliance
  FOR INSERT WITH CHECK (true);

CREATE POLICY scadenze_compliance_update_policy
  ON public.scadenze_compliance
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY scadenze_compliance_delete_policy
  ON public.scadenze_compliance
  FOR DELETE USING (true);

-- 5) DATI DEMO (idempotenti)
INSERT INTO public.interventi_programmati
  (org_id, titolo, cliente_nome, data_intervento, ora_intervento, tecnico, zona, stato, note)
VALUES
  ('mistral', 'Verifica centralina antincendio', 'Hotel Riviera', '2026-02-17', '08:30', 'M. Ferri', 'Centro', 'Confermato', 'Controllo trimestrale'),
  ('mistral', 'Taratura sensori fumo', 'Scuola Verdi', '2026-02-17', '11:00', 'A. Neri', 'Nord', 'Pianificato', null),
  ('mistral', 'Collaudo quadro elettrico', 'Officine Delta', '2026-02-18', '09:00', 'M. Ferri', 'Ovest', 'Critico', 'Priorità alta per audit')
ON CONFLICT DO NOTHING;

INSERT INTO public.scadenze_compliance
  (org_id, titolo, cliente_nome, categoria, data_scadenza, priorita, stato, note)
VALUES
  ('mistral', 'Certificato prevenzione incendi', 'Condominio Aurora', 'CPI', '2026-02-18', 'alta', 'attiva', null),
  ('mistral', 'Dichiarazione conformità impianto', 'Officine Delta', 'Conformità', '2026-02-24', 'media', 'attiva', null),
  ('mistral', 'Verifica estintori annuale', 'Scuola Verdi', 'Antincendio', '2026-03-02', 'bassa', 'attiva', null)
ON CONFLICT DO NOTHING;
