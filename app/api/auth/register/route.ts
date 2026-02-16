import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { normalizeOrgId } from '@/lib/api-auth';

// POST - Registrazione nuovo utente (solo operatore)
export async function POST(request: NextRequest) {
  try {
    const { username, password, nome, cognome, telefono, email, qualifica, org_id, idsocieta } = await request.json();
    const tenantInput = org_id ?? idsocieta;
    const orgId = normalizeOrgId(tenantInput);

    // Validazione
    if (!username || !password || !nome || !cognome || !telefono || !qualifica) {
      return NextResponse.json(
        { error: 'Tutti i campi obbligatori devono essere compilati' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La password deve essere di almeno 6 caratteri' },
        { status: 400 }
      );
    }

    // Hash della password
    const passwordHash = await bcrypt.hash(password, 10);

    // Crea nuovo utente (SOLO operatore, non admin)
    const { error: createError } = await supabase
      .from('utenti')
      .insert({
        username,
        password_hash: passwordHash,
        ruolo: 'operatore', // FORZATO a operatore, non può essere admin
        org_id: orgId,
        nome,
        cognome,
        telefono,
        email: email || null,
        qualifica,
        attivo: true,
      });

    if (createError) {
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: 'Username già esistente' },
          { status: 409 }
        );
      }

      if (
        createError.code === '42501' ||
        createError.message?.toLowerCase().includes('row-level security')
      ) {
        return NextResponse.json(
          { error: `Registrazione non consentita per org_id '${orgId}'. Verifica che l'organizzazione esista ed sia attiva.` },
          { status: 403 }
        );
      }

      console.error('Error creating user:', createError);
      throw createError;
    }

    return NextResponse.json({
      success: true,
      message: 'Registrazione completata con successo',
      user: {
        username,
        ruolo: 'operatore',
        org_id: orgId,
      },
    });
  } catch (error: any) {
    console.error('Error during registration:', error);
    return NextResponse.json(
      { error: error.message || 'Errore durante la registrazione' },
      { status: 500 }
    );
  }
}

