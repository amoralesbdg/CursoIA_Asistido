import { supabase } from './supabase';

export type Actor = { id: string; role: 'admin' | 'user' };

// Fase sin JWT: el actor se identifica con un id explícito en el request
// (ver CLAUDE.md / instrucciones de fase), nunca derivado de Authorization.
export async function resolveActor(actorId: string): Promise<Actor | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', actorId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function isOwnerOrAdmin(
  actor: Actor,
  ticket: { creator_id: string },
  assigneeIds: string[],
): boolean {
  if (actor.role === 'admin') return true;
  if (actor.id === ticket.creator_id) return true;
  return assigneeIds.includes(actor.id);
}
