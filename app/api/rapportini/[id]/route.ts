import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getOrgIdFromRequest, getUserIdFromRequest } from '@/lib/api-auth';
import { Rapportino } from '@/types';
import { InterventoCategoria } from '@/lib/intervento-categorie';

// Cache configuration per Next.js 16.1
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CATEGORY_NOTE_PREFIX_REGEX = /^\[cat:(antincendio|manutenzione_elettrica|termoidraulica)\]\s*/i;

function parseCategoriaAndNote(tipoStufa: string, note?: string | null): { categoria: InterventoCategoria; note: string } {
  const rawNote = note || '';
  const match = rawNote.match(CATEGORY_NOTE_PREFIX_REGEX);
  if (match?.[1]) {
    const categoria = match[1] as InterventoCategoria;
    const cleanedNote = rawNote.replace(CATEGORY_NOTE_PREFIX_REGEX, '').trim();
    return { categoria, note: cleanedNote };
  }

  if (tipoStufa === 'pellet' || tipoStufa === 'legno') {
    return { categoria: 'termoidraulica', note: rawNote };
  }

  return { categoria: 'termoidraulica', note: rawNote };
}

// GET - Ottieni un singolo rapportino
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getUserIdFromRequest(request);
    const orgId = getOrgIdFromRequest(request);
    const userRole = request.headers.get('x-user-ruolo') || 'operatore';

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utente non fornito. Effettua il login.' },
        { status: 401 }
      );
    }

    // Costruisci la query base
    let query = supabase
      .from('rapportini')
      .select(`
        *,
        utente:utenti(id, nome, cognome, telefono, email, qualifica),
        cliente:clienti(*)
      `)
      .eq('org_id', orgId)
      .eq('id', id);

    // Se è un operatore (non admin), verifica che il rapportino appartenga all'utente
    if (userRole !== 'admin') {
      query = query.eq('utente_id', userId);
    }

    const { data: rapportino, error } = await query.single();

    if (error || !rapportino) {
      return NextResponse.json(
        { error: 'Rapportino non trovato' },
        { status: 404 }
      );
    }

    const { categoria, note } = parseCategoriaAndNote(rapportino.tipo_stufa, rapportino.note);

    // Trasforma i dati dal formato DB al formato dell'app
    const formattedRapportino: Rapportino = {
      id: rapportino.id,
      operatore: {
        nome: rapportino.utente?.nome || '',
        cognome: rapportino.utente?.cognome || '',
        telefono: rapportino.utente?.telefono || '',
        email: rapportino.utente?.email || '',
        qualifica: rapportino.utente?.qualifica || '',
      },
      cliente: {
        nome: rapportino.cliente.nome,
        cognome: rapportino.cliente.cognome,
        ragioneSociale: rapportino.cliente.ragione_sociale || '',
        indirizzo: rapportino.cliente.indirizzo,
        citta: rapportino.cliente.citta,
        cap: rapportino.cliente.cap,
        telefono: rapportino.cliente.telefono,
        email: rapportino.cliente.email || '',
        partitaIva: rapportino.cliente.partita_iva || '',
        codiceFiscale: rapportino.cliente.codice_fiscale || '',
      },
      intervento: {
        data: rapportino.data_intervento,
        ora: rapportino.ora_intervento,
        tipoStufa: categoria,
        marca: rapportino.marca,
        modello: rapportino.modello,
        numeroSerie: rapportino.numero_serie || '',
        tipoIntervento: rapportino.tipo_intervento,
        descrizione: rapportino.descrizione,
        materialiUtilizzati: rapportino.materiali_utilizzati || '',
        note,
        firmaCliente: rapportino.firma_cliente || '',
      },
      dataCreazione: rapportino.data_creazione || rapportino.created_at,
    };

    const response = NextResponse.json(formattedRapportino);
    response.headers.set('Cache-Control', 'no-store, must-revalidate');
    return response;
  } catch (error: any) {
    console.error('Error fetching rapportino:', error);
    return NextResponse.json(
      { error: error.message || 'Errore nel recupero del rapportino' },
      { status: 500 }
    );
  }
}

// DELETE - Elimina un rapportino
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getUserIdFromRequest(request);
    const orgId = getOrgIdFromRequest(request);
    const userRole = request.headers.get('x-user-ruolo') || 'operatore';

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utente non fornito. Effettua il login.' },
        { status: 401 }
      );
    }

    // Se è un operatore (non admin), verifica che il rapportino appartenga all'utente
    if (userRole !== 'admin') {
      const { data: rapportino, error: fetchError } = await supabase
        .from('rapportini')
        .select('utente_id')
        .eq('org_id', orgId)
        .eq('id', id)
        .single();

      if (fetchError || !rapportino) {
        return NextResponse.json(
          { error: 'Rapportino non trovato' },
          { status: 404 }
        );
      }

      if (rapportino.utente_id !== userId) {
        return NextResponse.json(
          { error: 'Non hai i permessi per eliminare questo rapportino' },
          { status: 403 }
        );
      }
    }

    const { error } = await supabase
      .from('rapportini')
      .delete()
      .eq('org_id', orgId)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting rapportino:', error);
    return NextResponse.json(
      { error: error.message || 'Errore nell\'eliminazione del rapportino' },
      { status: 500 }
    );
  }
}

