import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getOrgIdFromRequest } from '@/lib/api-auth';

// GET - Ottieni materiali filtrati per modello
export async function GET(request: NextRequest) {
  try {
    const orgId = getOrgIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const modelloId = searchParams.get('modello_id');

    if (!modelloId) {
      return NextResponse.json(
        { error: 'L\'ID del modello è obbligatorio' },
        { status: 400 }
      );
    }

    const { data: materiali, error } = await supabaseServer
      .from('materiali')
      .select('id, nome, descrizione, modello_id')
      .eq('org_id', orgId)
      .eq('modello_id', modelloId)
      .order('nome', { ascending: true });

    if (error) throw error;

    return NextResponse.json(materiali || []);
  } catch (error: any) {
    console.error('Error fetching materiali:', error);
    return NextResponse.json(
      { error: error.message || 'Errore nel recupero dei materiali' },
      { status: 500 }
    );
  }
}

// POST - Crea un nuovo materiale
export async function POST(request: NextRequest) {
  try {
    const orgId = getOrgIdFromRequest(request);
    const body = await request.json();
    const { nome, descrizione, modello_id } = body;

    if (!nome || !nome.trim()) {
      return NextResponse.json(
        { error: 'Il nome del materiale è obbligatorio' },
        { status: 400 }
      );
    }

    if (!modello_id) {
      return NextResponse.json(
        { error: 'L\'ID del modello è obbligatorio' },
        { status: 400 }
      );
    }

    const { data: modello } = await supabaseServer
      .from('modelli')
      .select('id')
      .eq('org_id', orgId)
      .eq('id', modello_id)
      .maybeSingle();

    if (!modello) {
      return NextResponse.json(
        { error: 'Modello non valido per la società corrente' },
        { status: 400 }
      );
    }

    const { data: materiale, error } = await supabaseServer
      .from('materiali')
      .insert({ 
        nome: nome.trim(), 
        descrizione: descrizione?.trim() || null,
        org_id: orgId,
        modello_id 
      })
      .select('id, nome, descrizione, modello_id')
      .single();

    if (error) {
      if (error.code === '23505') {
        // Duplicato - cerca quello esistente
        const { data: existing } = await supabaseServer
          .from('materiali')
          .select('id, nome, descrizione, modello_id')
          .eq('org_id', orgId)
          .eq('nome', nome.trim())
          .eq('modello_id', modello_id)
          .single();
        
        if (existing) {
          return NextResponse.json(existing);
        }
      }
      throw error;
    }

    return NextResponse.json(materiale);
  } catch (error: any) {
    console.error('Error creating materiale:', error);
    return NextResponse.json(
      { error: error.message || 'Errore nella creazione del materiale' },
      { status: 500 }
    );
  }
}

