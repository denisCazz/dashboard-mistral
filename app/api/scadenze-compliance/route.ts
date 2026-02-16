import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getOrgIdFromRequest } from '@/lib/api-auth';

const PRIORITA = ['alta', 'media', 'bassa'] as const;
const STATI = ['attiva', 'completata', 'annullata'] as const;

type Priorita = (typeof PRIORITA)[number];
type StatoScadenza = (typeof STATI)[number];

function isValidPriorita(value: string): value is Priorita {
  return PRIORITA.includes(value as Priorita);
}

function isValidStato(value: string): value is StatoScadenza {
  return STATI.includes(value as StatoScadenza);
}

function daysRemaining(dateIso: string): number {
  const target = new Date(`${dateIso}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// GET - Elenco scadenze compliance
export async function GET(request: NextRequest) {
  try {
    const orgId = getOrgIdFromRequest(request);
    const onlyActive = request.nextUrl.searchParams.get('onlyActive') === 'true';
    const limit = Number(request.nextUrl.searchParams.get('limit') || '0');

    let query = supabaseServer
      .from('scadenze_compliance')
      .select('id, titolo, cliente_nome, categoria, data_scadenza, priorita, stato, note')
      .eq('org_id', orgId)
      .order('data_scadenza', { ascending: true });

    if (onlyActive) {
      query = query.eq('stato', 'attiva');
    }

    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    const enriched = (data || []).map((item) => ({
      ...item,
      giorniRimanenti: daysRemaining(item.data_scadenza),
    }));

    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error('Error fetching scadenze compliance:', error);
    return NextResponse.json({ error: error.message || 'Errore nel recupero scadenze' }, { status: 500 });
  }
}

// POST - Crea scadenza compliance
export async function POST(request: NextRequest) {
  try {
    const orgId = getOrgIdFromRequest(request);
    const body = await request.json();

    const titolo = String(body?.titolo || '').trim();
    const clienteNome = String(body?.cliente_nome || body?.clienteNome || '').trim();
    const categoria = String(body?.categoria || '').trim();
    const dataScadenza = String(body?.data_scadenza || body?.dataScadenza || '').trim();
    const priorita = String(body?.priorita || 'media').trim();
    const stato = String(body?.stato || 'attiva').trim();
    const note = String(body?.note || '').trim();

    if (!titolo || !clienteNome || !categoria || !dataScadenza || !isValidPriorita(priorita) || !isValidStato(stato)) {
      return NextResponse.json({ error: 'Dati non validi per creare la scadenza' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('scadenze_compliance')
      .insert({
        org_id: orgId,
        titolo,
        cliente_nome: clienteNome,
        categoria,
        data_scadenza: dataScadenza,
        priorita,
        stato,
        note: note || null,
      })
      .select('id, titolo, cliente_nome, categoria, data_scadenza, priorita, stato, note')
      .single();

    if (error) throw error;

    return NextResponse.json({
      ...data,
      giorniRimanenti: daysRemaining(data.data_scadenza),
    });
  } catch (error: any) {
    console.error('Error creating scadenza compliance:', error);
    return NextResponse.json({ error: error.message || 'Errore nella creazione scadenza' }, { status: 500 });
  }
}
