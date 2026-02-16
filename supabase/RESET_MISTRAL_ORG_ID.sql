-- ============================================================
-- SEED ORG MISTRAL (NO DROP)
-- ============================================================
-- Presuppone che sia già stato eseguito:
--   supabase/RESET_SHARED_DB_ORG_ID.sql
--
-- Mistral: settori operativi = antincendio + manutenzione_elettrica

BEGIN;

INSERT INTO public.organizzazioni (id, nome)
VALUES ('mistral', 'Mistral Impianti')
ON CONFLICT (id) DO UPDATE
SET nome = EXCLUDED.nome,
    updated_at = now();

INSERT INTO public.org_settori (org_id, settore_codice)
VALUES
  ('mistral', 'antincendio'),
  ('mistral', 'manutenzione_elettrica')
ON CONFLICT (org_id, settore_codice) DO NOTHING;

INSERT INTO public.utenti (
  org_id, username, password_hash, ruolo, nome, cognome, telefono, email, qualifica, attivo
)
VALUES
('mistral', 'admin', 'admin123', 'admin', 'Admin', 'Mistral', '', 'admin@mistral.local', 'Amministratore', true),
('mistral', 'operatore', 'operatore123', 'operatore', 'Operatore', 'Mistral', '', 'operatore@mistral.local', 'Tecnico', true)
ON CONFLICT (org_id, username) DO NOTHING;

COMMIT;

-- POST:
-- 1) sostituire password plaintext con hash bcrypt
-- 2) nel codice usare org_id = 'mistral'
