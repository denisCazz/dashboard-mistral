import { NextRequest } from 'next/server';

const DEFAULT_ORG_ID = (process.env.DEFAULT_ORG_ID || process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || 'mistral')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9_-]/g, '') || 'mistral';

export function normalizeOrgId(value?: string | null): string {
  if (!value) return DEFAULT_ORG_ID;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return DEFAULT_ORG_ID;
  return normalized.replace(/[^a-z0-9_-]/g, '');
}

/**
 * Ottiene l'ID utente dalla richiesta
 * Cerca prima nell'header X-User-Id, poi nel body, poi nei query params
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  // Prova header
  const headerUserId = request.headers.get('x-user-id');
  if (headerUserId) return headerUserId;

  // Prova query param
  const queryUserId = request.nextUrl.searchParams.get('userId');
  if (queryUserId) return queryUserId;

  return null;
}

/**
 * Ottiene l'org_id dalla richiesta
 * Cerca prima nell'header X-Org-Id, poi fallback legacy e query params
 */
export function getOrgIdFromRequest(request: NextRequest): string {
  const headerOrgId = request.headers.get('x-org-id');
  if (headerOrgId) return normalizeOrgId(headerOrgId);

  const legacyHeaderOrgId = request.headers.get('x-user-idsocieta');
  if (legacyHeaderOrgId) return normalizeOrgId(legacyHeaderOrgId);

  const queryOrgId = request.nextUrl.searchParams.get('org_id');
  if (queryOrgId) return normalizeOrgId(queryOrgId);

  const querySocietaId = request.nextUrl.searchParams.get('idsocieta');
  if (querySocietaId) return normalizeOrgId(querySocietaId);

  return DEFAULT_ORG_ID;
}

export const normalizeSocietaId = normalizeOrgId;
export const getSocietaIdFromRequest = getOrgIdFromRequest;

/**
 * Ottiene i dati utente completi dalla richiesta
 * Richiede che l'ID utente sia passato nella richiesta
 */
export async function getUserFromRequest(request: NextRequest): Promise<{ id: string; ruolo: string } | null> {
  const userId = getUserIdFromRequest(request);
  if (!userId) return null;

  // Qui potresti fare una query al DB per ottenere i dati completi
  // Per ora restituiamo solo l'ID e assumiamo che il ruolo sia passato
  const ruolo = request.headers.get('x-user-ruolo') || 'operatore';
  
  return { id: userId, ruolo };
}

