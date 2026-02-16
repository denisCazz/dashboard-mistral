import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getOrgIdFromRequest } from '@/lib/api-auth';

const STATI = ['Pianificato', 'Confermato', 'Critico'] as const;
type StatoIntervento = (typeof STATI)[number];

function isValidStato(value: string): value is StatoIntervento {
  return STATI.includes(value as StatoIntervento);
}

// GET - Elenco interventi programmati
export async function GET(request: NextRequest) {
  try {
    const orgId = getOrgIdFromRequest(request);
    const month = request.nextUrl.searchParams.get('month'); // formato YYYY-MM

    let query = supabaseServer
      .from('interventi_programmati')
      .select('id, titolo, cliente_nome, data_intervento, ora_intervento, tecnico, zona, stato, note')
      .eq('org_id', orgId)
      .order('data_intervento', { ascending: true })
      .order('ora_intervento', { ascending: true });

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const start = `${month}-01`;
      const [year, m] = month.split('-').map(Number);
      const lastDay = new Date(year, m, 0).getDate();
      const end = `${month}-${String(lastDay).padStart(2, '0')}`;
      query = query.gte('data_intervento', start).lte('data_intervento', end);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error fetching interventi programmati:', error);
    return NextResponse.json({ error: error.message || 'Errore nel recupero interventi programmati' }, { status: 500 });
  }
}

// POST - Crea intervento programmato
export async function POST(request: NextRequest) {
  try {
    const orgId = getOrgIdFromRequest(request);
    const body = await request.json();

    const titolo = String(body?.titolo || '').trim();
    const clienteNome = String(body?.cliente_nome || body?.clienteNome || '').trim();
    const dataIntervento = String(body?.data_intervento || body?.dataIntervento || '').trim();
    const oraIntervento = String(body?.ora_intervento || body?.oraIntervento || '').trim();
    const tecnico = String(body?.tecnico || '').trim();
    const zona = String(body?.zona || '').trim();
    const stato = String(body?.stato || 'Pianificato').trim();
    const note = String(body?.note || '').trim();

    if (!titolo || !clienteNome || !dataIntervento || !oraIntervento || !tecnico || !zona || !isValidStato(stato)) {
      return NextResponse.json({ error: 'Dati non validi per creare l\'intervento programmato' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('interventi_programmati')
      .insert({
        org_id: orgId,
        titolo,
        cliente_nome: clienteNome,
        data_intervento: dataIntervento,
        ora_intervento: oraIntervento,
        tecnico,
        zona,
        stato,
        note: note || null,
      })
      .select('id, titolo, cliente_nome, data_intervento, ora_intervento, tecnico, zona, stato, note')
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating intervento programmato:', error);
    return NextResponse.json({ error: error.message || 'Errore nella creazione intervento programmato' }, { status: 500 });
  }
}
