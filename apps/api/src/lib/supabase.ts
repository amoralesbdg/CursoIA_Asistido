import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Faltan las variables de entorno SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY.',
  );
}

// Singleton: nunca instanciar un cliente nuevo dentro de un route handler.
// Usa la service_role key porque corre solo en el servidor y RLS sigue
// deshabilitado en esta fase (ver docs/adr/001-database-selection.md).
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});
