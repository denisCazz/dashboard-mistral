import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getOrgIdFromRequest } from '@/lib/api-auth';

// GET - Ottieni tutte le marche
export async function GET(request: NextRequest) {
  try {
    const orgId = getOrgIdFromRequest(request);
    const { data: marche, error } = await supabaseServer
      .from('marche')
      .select('id, nome')
      .eq('org_id', orgId)
      .order('nome', { ascending: true });

    if (error) throw error;

    return NextResponse.json(marche || []);
  } catch (error: any) {
    console.error('Error fetching marche:', error);
    return NextResponse.json(
      { error: error.message || 'Errore nel recupero delle marche' },
      { status: 500 }
    );
  }
}

// POST - Crea una nuova marca
export async function POST(request: NextRequest) {
  try {
    const orgId = getOrgIdFromRequest(request);
    const body = await request.json();
    const { nome } = body;
    const normalizedNome = String(nome || '').trim();

    if (!normalizedNome) {
      return NextResponse.json(
        { error: 'Il nome della marca è obbligatorio' },
        { status: 400 }
      );
    }

    const { data: marca, error } = await supabaseServer
      .from('marche')
      .insert({ nome: normalizedNome, org_id: orgId })
      .select('id, nome')
      .single();

    if (error) {
      if (error.code === '23505') {
        // Duplicato - cerca quella esistente
        const { data: existing } = await supabaseServer
          .from('marche')
          .select('id, nome')
          .eq('org_id', orgId)
          .ilike('nome', normalizedNome)
          .maybeSingle();
        
        if (existing) {
          return NextResponse.json(existing);
        }

        return NextResponse.json(
          { error: 'Marca già presente nel catalogo' },
          { status: 409 }
        );
      }

      if (error.code === '42501') {
        return NextResponse.json(
          { error: 'Permessi database insufficienti (RLS). Configura SUPABASE_SERVICE_ROLE_KEY sul server o aggiorna le policy RLS.' },
          { status: 500 }
        );
      }

      throw error;
    }

    return NextResponse.json(marca);
  } catch (error: any) {
    console.error('Error creating marca:', error);
    return NextResponse.json(
      { error: error.message || 'Errore nella creazione della marca' },
      { status: 500 }
    );
  }
}

