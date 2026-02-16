import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createTokenPair } from '@/lib/jwt';
import { supabaseServer } from '@/lib/supabase-server';

// POST - Refresh token
export async function POST(request: NextRequest) {
  try {
    // Ottieni refresh token dal cookie
    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token mancante' },
        { status: 401 }
      );
    }

    // Verifica il refresh token
    const payload = await verifyToken(refreshToken);

    if (!payload || payload.type !== 'refresh') {
      return NextResponse.json(
        { error: 'Refresh token non valido' },
        { status: 401 }
      );
    }

    // Verifica che l'utente esista ancora e sia attivo
    // Nota: non filtriamo su org_id perché alcuni utenti legacy possono avere org_id nullo
    // o disallineato rispetto al token, causando falsi "Utente non trovato".
    const { data: utente, error } = await supabaseServer
      .from('utenti')
      .select('id, username, ruolo, org_id, attivo')
      .eq('id', payload.userId)
      .maybeSingle();

    if (error || !utente || !utente.attivo) {
      const response = NextResponse.json(
        { error: 'Utente non trovato o disattivato' },
        { status: 401 }
      );
      response.cookies.delete('access_token');
      response.cookies.delete('refresh_token');
      return response;
    }

    const normalizedOrgId = utente.org_id || payload.org_id || payload.idsocieta || 'base';

    // Crea nuovi token
    const { accessToken, refreshToken: newRefreshToken } = await createTokenPair({
      id: utente.id,
      username: utente.username,
      ruolo: utente.ruolo,
      org_id: normalizedOrgId,
    });

    const response = NextResponse.json({ 
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
    });

    // Aggiorna i cookie
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minuti
      path: '/',
    });

    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 giorni
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error during token refresh:', error);
    return NextResponse.json(
      { error: error.message || 'Errore durante il refresh del token' },
      { status: 500 }
    );
  }
}
