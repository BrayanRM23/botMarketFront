import { createClient } from '@supabase/supabase-js';

// Bucket privado: el acceso lo controla la URL firmada que emite el backend
export const KNOWLEDGE_BUCKET = 'knowledge-files';

// Se crea al primer uso para que una variable faltante no rompa toda la app
let client = null;

export function getSupabase() {
  if (!client) {
    client = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
  }
  return client;
}
