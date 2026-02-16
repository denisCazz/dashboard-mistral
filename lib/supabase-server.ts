import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const keyToUse = supabaseServiceRoleKey || supabaseAnonKey;

if (!supabaseUrl || !keyToUse) {
  console.warn(
    'Supabase server client non configurato. Imposta NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.'
  );
}

export const hasSupabaseServiceRoleKey = Boolean(supabaseServiceRoleKey);

export const supabaseServer = createClient(supabaseUrl, keyToUse);
