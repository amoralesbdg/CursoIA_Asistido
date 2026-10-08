import { supabase } from './supabase';

export async function usersExist(userIds: string[]): Promise<boolean> {
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) return true;

  const { data, error } = await supabase.from('users').select('id').in('id', uniqueIds);
  if (error) throw error;

  return (data ?? []).length === uniqueIds.length;
}
