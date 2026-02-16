-- ============================================
-- MIGRAZIONE MULTI-SOCIETA (idsocieta)
-- ============================================
-- Esegui questo script su database esistenti.
-- Introduce la colonna idsocieta per separare i dati per tenant.

-- 1) UTENTI
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'utenti' AND column_name = 'idsocieta'
  ) THEN
    ALTER TABLE utenti ADD COLUMN idsocieta VARCHAR(100) NOT NULL DEFAULT 'default';
    RAISE NOTICE 'Colonna utenti.idsocieta aggiunta';
  END IF;
END $$;

-- Aggiungi vincolo univoco (idsocieta, username)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_utente_societa_username'
  ) THEN
    ALTER TABLE utenti ADD CONSTRAINT unique_utente_societa_username UNIQUE (idsocieta, username);
    RAISE NOTICE 'Constraint unique_utente_societa_username creata';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_utenti_idsocieta ON utenti(idsocieta);

-- 2) CLIENTI
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clienti' AND column_name = 'idsocieta'
  ) THEN
    ALTER TABLE clienti ADD COLUMN idsocieta VARCHAR(100) NOT NULL DEFAULT 'default';
    RAISE NOTICE 'Colonna clienti.idsocieta aggiunta';
  END IF;
END $$;

-- Rimuovi vecchio unique globale e ricrealo tenant-aware
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'clienti'::regclass
      AND conname = 'unique_cliente'
  ) THEN
    ALTER TABLE clienti DROP CONSTRAINT unique_cliente;
    RAISE NOTICE 'Constraint unique_cliente precedente rimossa';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'clienti'::regclass
      AND conname = 'unique_cliente'
  ) THEN
    ALTER TABLE clienti ADD CONSTRAINT unique_cliente UNIQUE (idsocieta, nome, cognome, telefono);
    RAISE NOTICE 'Constraint unique_cliente tenant-aware creata';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clienti_idsocieta ON clienti(idsocieta);

-- 3) RAPPORTINI
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rapportini' AND column_name = 'idsocieta'
  ) THEN
    ALTER TABLE rapportini ADD COLUMN idsocieta VARCHAR(100) NOT NULL DEFAULT 'default';
    RAISE NOTICE 'Colonna rapportini.idsocieta aggiunta';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rapportini_idsocieta ON rapportini(idsocieta);

-- 4) MARCHE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'marche'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'marche' AND column_name = 'idsocieta'
    ) THEN
      ALTER TABLE marche ADD COLUMN idsocieta VARCHAR(100) NOT NULL DEFAULT 'default';
      RAISE NOTICE 'Colonna marche.idsocieta aggiunta';
    END IF;
  END IF;
END $$;

-- Rimuovi unique globale su marche.nome (se presente) e ricrea tenant-aware
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'marche'::regclass
      AND conname = 'marche_nome_key'
  ) THEN
    ALTER TABLE marche DROP CONSTRAINT marche_nome_key;
    RAISE NOTICE 'Constraint marche_nome_key rimossa';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'marche'::regclass
      AND conname = 'marche_idsocieta_nome_key'
  ) THEN
    ALTER TABLE marche ADD CONSTRAINT marche_idsocieta_nome_key UNIQUE (idsocieta, nome);
    RAISE NOTICE 'Constraint marche_idsocieta_nome_key creata';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_marche_idsocieta ON marche(idsocieta);

-- 5) MODELLI
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'modelli'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'modelli' AND column_name = 'idsocieta'
    ) THEN
      ALTER TABLE modelli ADD COLUMN idsocieta VARCHAR(100) NOT NULL DEFAULT 'default';
      RAISE NOTICE 'Colonna modelli.idsocieta aggiunta';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'modelli'::regclass
      AND conname = 'modelli_marca_id_nome_key'
  ) THEN
    ALTER TABLE modelli DROP CONSTRAINT modelli_marca_id_nome_key;
    RAISE NOTICE 'Constraint modelli_marca_id_nome_key rimossa';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'modelli'::regclass
      AND conname = 'modelli_idsocieta_marca_id_nome_key'
  ) THEN
    ALTER TABLE modelli ADD CONSTRAINT modelli_idsocieta_marca_id_nome_key UNIQUE (idsocieta, marca_id, nome);
    RAISE NOTICE 'Constraint modelli_idsocieta_marca_id_nome_key creata';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_modelli_idsocieta ON modelli(idsocieta);

-- 6) MATERIALI
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'materiali'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'materiali' AND column_name = 'idsocieta'
    ) THEN
      ALTER TABLE materiali ADD COLUMN idsocieta VARCHAR(100) NOT NULL DEFAULT 'default';
      RAISE NOTICE 'Colonna materiali.idsocieta aggiunta';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'materiali'::regclass
      AND conname = 'materiali_modello_id_nome_key'
  ) THEN
    ALTER TABLE materiali DROP CONSTRAINT materiali_modello_id_nome_key;
    RAISE NOTICE 'Constraint materiali_modello_id_nome_key rimossa';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'materiali'::regclass
      AND conname = 'materiali_idsocieta_modello_id_nome_key'
  ) THEN
    ALTER TABLE materiali ADD CONSTRAINT materiali_idsocieta_modello_id_nome_key UNIQUE (idsocieta, modello_id, nome);
    RAISE NOTICE 'Constraint materiali_idsocieta_modello_id_nome_key creata';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_materiali_idsocieta ON materiali(idsocieta);

-- Report sintetico
SELECT 'utenti' AS tabella, COUNT(*) AS record_totali FROM utenti
UNION ALL
SELECT 'clienti' AS tabella, COUNT(*) AS record_totali FROM clienti
UNION ALL
SELECT 'rapportini' AS tabella, COUNT(*) AS record_totali FROM rapportini;
