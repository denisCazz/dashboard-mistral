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

// PATCH - Aggiorna scadenza compliance
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orgId = getOrgIdFromRequest(request);
    const body = await request.json();

    const titolo = String(body?.titolo || '').trim();
    const clienteNome = String(body?.cliente_nome || body?.clienteNome || '').trim();
    const categoria = String(body?.categoria || '').trim();
    const dataScadenza = String(body?.data_scadenza || body?.dataScadenza || '').trim();
    const priorita = String(body?.priorita || '').trim();
    const stato = String(body?.stato || '').trim();
    const note = String(body?.note || '').trim();

    if (!titolo || !clienteNome || !categoria || !dataScadenza || !isValidPriorita(priorita) || !isValidStato(stato)) {
      return NextResponse.json({ error: 'Dati non validi per aggiornare la scadenza' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('scadenze_compliance')
      .update({
        titolo,
        cliente_nome: clienteNome,
        categoria,
        data_scadenza: dataScadenza,
        priorita,
        stato,
        note: note || null,
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select('id, titolo, cliente_nome, categoria, data_scadenza, priorita, stato, note')
      .single();

    if (error) throw error;

    return NextResponse.json({
      ...data,
      giorniRimanenti: daysRemaining(data.data_scadenza),
    });
  } catch (error: any) {
    console.error('Error updating scadenza compliance:', error);
    return NextResponse.json({ error: error.message || 'Errore nell\'aggiornamento scadenza' }, { status: 500 });
  }
}

// DELETE - Elimina scadenza compliance
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orgId = getOrgIdFromRequest(request);

    const { error } = await supabaseServer
      .from('scadenze_compliance')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting scadenza compliance:', error);
    return NextResponse.json({ error: error.message || 'Errore nell\'eliminazione scadenza' }, { status: 500 });
  }
}
