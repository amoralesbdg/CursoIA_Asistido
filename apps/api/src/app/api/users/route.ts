import { supabase } from '@/lib/supabase';
import { ok, internalError } from '@/lib/http';

const INSTANCE = '/users';

export async function GET() {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, username, email, role')
    .order('name', { ascending: true });

  if (error) return internalError(INSTANCE, error);

  return ok(data ?? []);
}
