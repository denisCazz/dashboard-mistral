# Adattamento codice Mistral a `org_id` + RLS

Questa guida indica **solo le modifiche applicative** da fare dopo la nuova sequenza:

1. `supabase/RESET_SHARED_DB_ORG_ID.sql` (una volta sola)
2. `supabase/RESET_MISTRAL_ORG_ID.sql` (seed tenant mistral)

## 1) Rinominare `idsocieta` in `org_id` nel dominio applicativo

Aggiornare ovunque nel codice:

- campi payload JWT
- header HTTP custom
- query Supabase (`select`, `insert`, `update`, `eq`)
- tipi TypeScript

### File principali da aggiornare

- `lib/jwt.ts`
  - `TokenPayload`: sostituire `idsocieta` con `org_id`.
  - `createTokenPair`: passare `org_id`.

- `middleware.ts`
  - leggere `org_id` dal token.
  - impostare header `x-org-id` (mantenere opzionale `x-user-idsocieta` solo per backward compatibility temporanea).

- `lib/api-auth.ts`
  - rinominare `DEFAULT_SOCIETA_ID` in `DEFAULT_ORG_ID`.
  - sostituire `normalizeSocietaId` con `normalizeOrgId`.
  - sostituire `getSocietaIdFromRequest` con `getOrgIdFromRequest`.
  - lookup header: prima `x-org-id`, fallback a `x-user-idsocieta` solo temporaneo.

- `lib/auth.ts`
  - `User` interface: sostituire `idsocieta?: string` con `org_id?: string`.

## 2) API routes: filtro sempre su `org_id`

Nei route handler attuali (users, rapportini, clienti, materiali, modelli, marche, statistics, auth):

1. sostituire tutte le chiamate helper `getSocietaIdFromRequest` con `getOrgIdFromRequest`;
2. sostituire tutti i filtri `.eq('idsocieta', value)` con `.eq('org_id', value)`;
3. negli insert/update, valorizzare `org_id` e non `idsocieta`.

Cartelle coinvolte:

- `app/api/auth/**`
- `app/api/users/**`
- `app/api/rapportini/**`
- `app/api/clienti/**`
- `app/api/marche/**`
- `app/api/modelli/**`
- `app/api/materiali/**`
- `app/api/admin/**`

## 3) Login/register/refresh

- `app/api/auth/login/route.ts`
  - select da `utenti`: leggere `org_id`.
  - token: includere `org_id`.
  - response user: includere `org_id`.

- `app/api/auth/register/route.ts`
  - input payload: `org_id` (non `idsocieta`).
  - check unicità username/email su `(org_id, username)` / `(org_id, email)`.

- `app/api/auth/refresh/route.ts`
  - validare utente su `org_id` dal token.
  - rigenerare token con `org_id`.

## 4) Tipi e mapping frontend

- `types/index.ts`: aggiungere `org_id` alle entità necessarie.
- Componenti che leggono utente da localStorage/sessione devono usare `user.org_id`.

## 5) RLS realmente efficace (punto critico)

Per sfruttare davvero la RLS del nuovo schema:

1. evitare query dati con chiave `service_role` lato API applicativa per operazioni utente;
2. usare client Supabase con JWT utente (o anon key + Authorization Bearer del tuo JWT mappato in claims);
3. mantenere service role solo per task amministrativi/sistema.

Se lasci `service_role` sulle API normali, la RLS viene bypassata.

## 6) Compatibilità temporanea consigliata

Per deploy graduale:

- mantenere fallback lettura `idsocieta` solo in parsing token/header;
- scrivere sempre e solo `org_id` su DB;
- rimuovere fallback dopo allineamento completo del client.

## 7) Checklist finale

- [ ] Tutte le query usano `org_id`.
- [ ] JWT contiene `org_id`.
- [ ] Header middleware include `x-org-id`.
- [ ] Register/login/refresh allineati.
- [ ] Nessuna route applicativa usa service role per dati tenant.
- [ ] Test smoke su admin e operatore in org `mistral`.
