# 🗄️ Guida Completa Setup Supabase

Questa guida ti accompagna passo-passo nella configurazione di Supabase per il progetto Bitora.

## 📋 Passo 1: Crea un Progetto Supabase

1. Vai su [https://supabase.com](https://supabase.com)
2. Clicca su **"Start your project"** o **"Sign in"** se hai già un account
3. Se non hai un account, creane uno (gratuito)
4. Clicca su **"New Project"**
5. Compila il form:
   - **Name**: Scegli un nome (es. "rapportini-bitora")
   - **Database Password**: Scegli una password sicura (⚠️ **SALVALA**, ti servirà)
   - **Region**: Scegli la regione più vicina (es. "West EU (Ireland)")
   - **Pricing Plan**: Seleziona **"Free"** (piano gratuito)
6. Clicca su **"Create new project"**
7. ⏳ Attendi 2-3 minuti mentre Supabase crea il progetto

## 🔑 Passo 2: Ottieni le Credenziali API

1. Una volta creato il progetto, vai su **Settings** (icona ingranaggio in basso a sinistra)
2. Clicca su **"API"** nel menu laterale
3. Troverai due valori importanti:

   **a) Project URL:**
   - Copia il valore in **"Project URL"**
   - Esempio: `https://xxxxxxxxxxxxx.supabase.co`

   **b) API Keys:**
   - Copia la chiave **"anon public"** (non la "service_role"!)
   - Esempio: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 📝 Passo 3: Configura le Variabili d'Ambiente

1. Nella root del progetto, crea un file chiamato `.env.local`
2. Aggiungi queste righe (sostituisci con i tuoi valori):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **⚠️ IMPORTANTE**: Il file `.env.local` è già nel `.gitignore`, quindi non verrà committato nel repository

## 🗃️ Passo 4: Crea le Tabelle del Database

1. Nel dashboard Supabase, vai su **"SQL Editor"** (icona nel menu laterale)
2. Clicca su **"New query"**
3. Apri il file `supabase/schema.sql` dal progetto
4. **Copia tutto il contenuto** del file
5. Incolla nel SQL Editor di Supabase
6. Clicca su **"Run"** (o premi `Ctrl+Enter` / `Cmd+Enter`)
7. ✅ Dovresti vedere un messaggio di successo: "Success. No rows returned"

### Cosa viene creato:

- ✅ Tabella `utenti` (per autenticazione)
- ✅ Tabella `operatori` (dati operatori tecnici)
- ✅ Tabella `clienti` (dati clienti)
- ✅ Tabella `rapportini` (rapportini di intervento)
- ✅ Indici per performance
- ✅ Trigger per aggiornare `updated_at`
- ✅ Row Level Security (RLS) policies
- ✅ Utenti di default (admin e operatore)

## 👥 Passo 5: Verifica gli Utenti Creati

1. Vai su **"Table Editor"** nel menu laterale
2. Seleziona la tabella **"utenti"**
3. Dovresti vedere 2 utenti:
   - **admin** (ruolo: admin)
   - **operatore** (ruolo: operatore)

## 🔐 Passo 6: Credenziali di Default

Gli utenti creati hanno queste credenziali:

**Admin:**
- Username: `admin`
- Password: `admin123`
- Ruolo: `admin`

**Operatore:**
- Username: `operatore`
- Password: `operatore123`
- Ruolo: `operatore`

⚠️ **IMPORTANTE**: Cambia queste password dopo il primo accesso in produzione!

## 🧪 Passo 7: Testa la Connessione

1. Avvia l'applicazione:
   ```bash
   npm run dev
   ```

2. Vai su [http://localhost:3000](http://localhost:3000)

3. Dovresti essere reindirizzato al login

4. Prova ad accedere con:
   - Username: `admin`
   - Password: `admin123`

5. Se funziona, vedrai la homepage! 🎉

## 🔧 Troubleshooting

### Errore: "Supabase URL or Anon Key is missing"

**Soluzione:**
- Verifica che il file `.env.local` esista nella root del progetto
- Verifica che le variabili inizino con `NEXT_PUBLIC_`
- Riavvia il server Next.js dopo aver creato/modificato `.env.local`

### Errore: "Invalid API key"

**Soluzione:**
- Verifica di aver copiato la chiave **"anon public"** e non la "service_role"
- Verifica che non ci siano spazi o caratteri extra nella chiave
- Verifica che l'URL sia corretto

### Errore durante l'esecuzione dello schema SQL

**Soluzione:**
- Verifica di aver copiato tutto il contenuto di `schema.sql`
- Controlla che non ci siano errori di sintassi
- Se alcune tabelle esistono già, eliminale prima o modifica lo script

### Non riesco a vedere le tabelle

**Soluzione:**
- Vai su **"Table Editor"** nel menu laterale
- Se non vedi le tabelle, ricarica la pagina
- Verifica che lo script SQL sia stato eseguito correttamente

## 📊 Verifica Setup Completo

Controlla che tutto sia configurato correttamente:

- [ ] Progetto Supabase creato
- [ ] Variabili d'ambiente configurate in `.env.local`
- [ ] Schema SQL eseguito con successo
- [ ] Tabelle create (utenti, operatori, clienti, rapportini)
- [ ] Utenti di default presenti (admin e operatore)
- [ ] Login funzionante

## 🚀 Prossimi Passi

Una volta completato il setup:

1. ✅ Testa il login con entrambi gli utenti
2. ✅ Crea il primo rapportino
3. ✅ Verifica che i dati vengano salvati in Supabase (Table Editor)
4. ✅ Accedi al pannello admin (solo con utente admin)
5. ⚠️ Cambia le password di default in produzione

## 💡 Suggerimenti

- **Backup**: Supabase fa backup automatici, ma puoi esportare i dati manualmente
- **Monitoraggio**: Usa il dashboard Supabase per monitorare l'uso del database
- **Sicurezza**: In produzione, considera di:
  - Cambiare le password di default
  - Usare hash bcrypt per le password (vedi `supabase/setup_users.sql`)
  - Configurare Row Level Security più restrittive se necessario

## 📞 Supporto

Se hai problemi:
1. Controlla i log nella console del browser (F12)
2. Controlla i log di Supabase (Dashboard > Logs)
3. Verifica la documentazione di Supabase: [https://supabase.com/docs](https://supabase.com/docs)

---

**Buon lavoro! 🎉**

