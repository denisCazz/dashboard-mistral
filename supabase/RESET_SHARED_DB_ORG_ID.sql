-- ============================================================
-- RESET UNICO DB CONDIVISO + SCHEMA MULTI-TENANT (org_id)
-- ============================================================
-- ESEGUI QUESTO SCRIPT UNA SOLA VOLTA SUL DATABASE CONDIVISO.
--
-- Poi esegui i seed org-specific:
-- - supabase/RESET_MISTRAL_ORG_ID.sql
-- - supabase/rapportini-base/RESET_BASE_ORG_ID.sql

BEGIN;

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF((current_setting('request.jwt.claims', true)::jsonb ->> 'org_id'), ''),
    NULLIF((current_setting('request.jwt.claims', true)::jsonb ->> 'idsocieta'), ''),
    NULLIF((current_setting('request.headers', true)::jsonb ->> 'x-org-id'), ''),
    NULLIF((current_setting('request.headers', true)::jsonb ->> 'x-user-idsocieta'), ''),
    '__missing_org__'
  )
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF((current_setting('request.jwt.claims', true)::jsonb ->> 'ruolo'), ''),
    NULLIF((current_setting('request.headers', true)::jsonb ->> 'x-user-ruolo'), ''),
    'operatore'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_user_role() = 'admin'
$$;

CREATE OR REPLACE FUNCTION public.is_active_org(p_org_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizzazioni
    WHERE id = p_org_id
      AND attiva = true
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_active_org(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE public.organizzazioni (
  id text PRIMARY KEY,
  nome text NOT NULL,
  attiva boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.settori_intervento (
  codice text PRIMARY KEY,
  label text NOT NULL
);

CREATE TABLE public.org_settori (
  org_id text NOT NULL REFERENCES public.organizzazioni(id) ON DELETE CASCADE,
  settore_codice text NOT NULL REFERENCES public.settori_intervento(codice) ON DELETE RESTRICT,
  PRIMARY KEY (org_id, settore_codice)
);

CREATE TABLE public.utenti (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL REFERENCES public.organizzazioni(id) ON DELETE RESTRICT,
  username varchar(255) NOT NULL,
  password_hash varchar(255) NOT NULL,
  ruolo varchar(20) NOT NULL CHECK (ruolo IN ('admin', 'operatore')),
  nome varchar(255) NOT NULL,
  cognome varchar(255) NOT NULL,
  telefono varchar(50),
  email varchar(255),
  qualifica varchar(255),
  attivo boolean NOT NULL DEFAULT true,
  ultimo_accesso timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_utenti_org_username UNIQUE (org_id, username),
  CONSTRAINT uq_utenti_org_email UNIQUE NULLS NOT DISTINCT (org_id, email)
);

CREATE TABLE public.clienti (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL REFERENCES public.organizzazioni(id) ON DELETE RESTRICT,
  nome varchar(255) NOT NULL,
  cognome varchar(255) NOT NULL,
  ragione_sociale varchar(255),
  indirizzo varchar(500) NOT NULL,
  citta varchar(255) NOT NULL,
  cap varchar(10) NOT NULL,
  telefono varchar(50) NOT NULL,
  email varchar(255),
  partita_iva varchar(50),
  codice_fiscale varchar(50),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_clienti_org_identity UNIQUE (org_id, nome, cognome, telefono)
);

CREATE TABLE public.marche (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL REFERENCES public.organizzazioni(id) ON DELETE RESTRICT,
  nome varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_marche_org_nome UNIQUE (org_id, nome)
);

CREATE TABLE public.modelli (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL REFERENCES public.organizzazioni(id) ON DELETE RESTRICT,
  marca_id uuid NOT NULL REFERENCES public.marche(id) ON DELETE CASCADE,
  nome varchar(200) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_modelli_org_marca_nome UNIQUE (org_id, marca_id, nome)
);

CREATE TABLE public.materiali (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL REFERENCES public.organizzazioni(id) ON DELETE RESTRICT,
  modello_id uuid NOT NULL REFERENCES public.modelli(id) ON DELETE CASCADE,
  nome varchar(200) NOT NULL,
  descrizione text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_materiali_org_modello_nome UNIQUE (org_id, modello_id, nome)
);

CREATE TABLE public.rapportini (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL REFERENCES public.organizzazioni(id) ON DELETE RESTRICT,
  utente_id uuid NOT NULL REFERENCES public.utenti(id) ON DELETE RESTRICT,
  cliente_id uuid NOT NULL REFERENCES public.clienti(id) ON DELETE RESTRICT,
  settore_intervento text REFERENCES public.settori_intervento(codice) ON DELETE RESTRICT,
  data_intervento date NOT NULL,
  ora_intervento time NOT NULL,
  tipo_stufa varchar(20) CHECK (tipo_stufa IN ('pellet', 'legno')),
  marca varchar(255) NOT NULL,
  modello varchar(255) NOT NULL,
  numero_serie varchar(255),
  tipo_intervento varchar(255) NOT NULL,
  descrizione text NOT NULL,
  materiali_utilizzati text,
  note text,
  firma_cliente text,
  data_creazione timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

CREATE INDEX idx_org_settori_org_id ON public.org_settori(org_id);
CREATE INDEX idx_utenti_org_id ON public.utenti(org_id);
CREATE INDEX idx_clienti_org_id ON public.clienti(org_id);
CREATE INDEX idx_marche_org_id ON public.marche(org_id);
CREATE INDEX idx_modelli_org_id ON public.modelli(org_id);
CREATE INDEX idx_materiali_org_id ON public.materiali(org_id);
CREATE INDEX idx_rapportini_org_id ON public.rapportini(org_id);
CREATE INDEX idx_rapportini_settore ON public.rapportini(settore_intervento);
CREATE INDEX idx_rapportini_utente_id ON public.rapportini(utente_id);
CREATE INDEX idx_rapportini_cliente_id ON public.rapportini(cliente_id);
CREATE INDEX idx_rapportini_data_intervento ON public.rapportini(data_intervento DESC);
CREATE INDEX idx_clienti_nome_cognome ON public.clienti(nome, cognome);

CREATE TRIGGER trg_organizzazioni_updated_at
BEFORE UPDATE ON public.organizzazioni
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_utenti_updated_at
BEFORE UPDATE ON public.utenti
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_clienti_updated_at
BEFORE UPDATE ON public.clienti
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_marche_updated_at
BEFORE UPDATE ON public.marche
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_modelli_updated_at
BEFORE UPDATE ON public.modelli
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_materiali_updated_at
BEFORE UPDATE ON public.materiali
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_rapportini_updated_at
BEFORE UPDATE ON public.rapportini
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.organizzazioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settori_intervento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_settori ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clienti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marche ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelli ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiali ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapportini ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_select_policy ON public.organizzazioni
FOR SELECT USING (id = public.current_org_id());

CREATE POLICY org_update_policy ON public.organizzazioni
FOR UPDATE USING (id = public.current_org_id() AND public.is_admin())
WITH CHECK (id = public.current_org_id() AND public.is_admin());

CREATE POLICY settori_read_policy ON public.settori_intervento
FOR SELECT USING (true);

CREATE POLICY org_settori_select_policy ON public.org_settori
FOR SELECT USING (org_id = public.current_org_id());

CREATE POLICY org_settori_insert_policy ON public.org_settori
FOR INSERT WITH CHECK (org_id = public.current_org_id() AND public.is_admin());

CREATE POLICY org_settori_delete_policy ON public.org_settori
FOR DELETE USING (org_id = public.current_org_id() AND public.is_admin());

CREATE POLICY utenti_select_policy ON public.utenti
FOR SELECT USING (org_id = public.current_org_id());

CREATE POLICY utenti_insert_policy ON public.utenti
FOR INSERT
WITH CHECK (
  (
    org_id = public.current_org_id()
    AND public.is_admin()
  )
  OR (
    public.current_org_id() = '__missing_org__'
    AND ruolo = 'operatore'
    AND attivo = true
    AND public.is_active_org(org_id)
  )
);

CREATE POLICY utenti_update_policy ON public.utenti
FOR UPDATE
USING (org_id = public.current_org_id() AND (public.is_admin() OR id::text = (current_setting('request.jwt.claims', true)::jsonb ->> 'userId')))
WITH CHECK (org_id = public.current_org_id());

CREATE POLICY utenti_delete_policy ON public.utenti
FOR DELETE USING (org_id = public.current_org_id() AND public.is_admin());

CREATE POLICY clienti_select_policy ON public.clienti
FOR SELECT USING (org_id = public.current_org_id());

CREATE POLICY clienti_insert_policy ON public.clienti
FOR INSERT WITH CHECK (org_id = public.current_org_id());

CREATE POLICY clienti_update_policy ON public.clienti
FOR UPDATE USING (org_id = public.current_org_id())
WITH CHECK (org_id = public.current_org_id());

CREATE POLICY clienti_delete_policy ON public.clienti
FOR DELETE USING (org_id = public.current_org_id() AND public.is_admin());

CREATE POLICY marche_select_policy ON public.marche
FOR SELECT USING (org_id = public.current_org_id());

CREATE POLICY marche_insert_policy ON public.marche
FOR INSERT WITH CHECK (org_id = public.current_org_id());

CREATE POLICY marche_update_policy ON public.marche
FOR UPDATE USING (org_id = public.current_org_id())
WITH CHECK (org_id = public.current_org_id());

CREATE POLICY marche_delete_policy ON public.marche
FOR DELETE USING (org_id = public.current_org_id() AND public.is_admin());

CREATE POLICY modelli_select_policy ON public.modelli
FOR SELECT USING (org_id = public.current_org_id());

CREATE POLICY modelli_insert_policy ON public.modelli
FOR INSERT WITH CHECK (org_id = public.current_org_id());

CREATE POLICY modelli_update_policy ON public.modelli
FOR UPDATE USING (org_id = public.current_org_id())
WITH CHECK (org_id = public.current_org_id());

CREATE POLICY modelli_delete_policy ON public.modelli
FOR DELETE USING (org_id = public.current_org_id() AND public.is_admin());

CREATE POLICY materiali_select_policy ON public.materiali
FOR SELECT USING (org_id = public.current_org_id());

CREATE POLICY materiali_insert_policy ON public.materiali
FOR INSERT WITH CHECK (org_id = public.current_org_id());

CREATE POLICY materiali_update_policy ON public.materiali
FOR UPDATE USING (org_id = public.current_org_id())
WITH CHECK (org_id = public.current_org_id());

CREATE POLICY materiali_delete_policy ON public.materiali
FOR DELETE USING (org_id = public.current_org_id() AND public.is_admin());

CREATE POLICY rapportini_select_policy ON public.rapportini
FOR SELECT
USING (
  org_id = public.current_org_id()
  AND (
    public.is_admin()
    OR utente_id::text = (current_setting('request.jwt.claims', true)::jsonb ->> 'userId')
  )
);

CREATE POLICY rapportini_insert_policy ON public.rapportini
FOR INSERT
WITH CHECK (
  org_id = public.current_org_id()
  AND (
    public.is_admin()
    OR utente_id::text = (current_setting('request.jwt.claims', true)::jsonb ->> 'userId')
  )
);

CREATE POLICY rapportini_update_policy ON public.rapportini
FOR UPDATE
USING (
  org_id = public.current_org_id()
  AND (
    public.is_admin()
    OR utente_id::text = (current_setting('request.jwt.claims', true)::jsonb ->> 'userId')
  )
)
WITH CHECK (org_id = public.current_org_id());

CREATE POLICY rapportini_delete_policy ON public.rapportini
FOR DELETE
USING (
  org_id = public.current_org_id()
  AND (
    public.is_admin()
    OR utente_id::text = (current_setting('request.jwt.claims', true)::jsonb ->> 'userId')
  )
);

INSERT INTO public.settori_intervento (codice, label)
VALUES
  ('termoidraulica', 'Termoidraulica'),
  ('antincendio', 'Antincendio'),
  ('manutenzione_elettrica', 'Manutenzione Elettrica')
ON CONFLICT (codice) DO NOTHING;

COMMIT;
