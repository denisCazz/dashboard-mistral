-- ============================================================
-- FIX PERMESSI RAPIDO (DB GIA' ESISTENTE)
-- Risolve errori tipo: "permission denied for table utenti"
-- ============================================================

BEGIN;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;

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

DROP POLICY IF EXISTS utenti_insert_policy ON public.utenti;

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

COMMIT;
