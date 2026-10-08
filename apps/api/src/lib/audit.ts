import { supabase } from './supabase';

export type AuditAction = 'created' | 'updated' | 'archived' | 'status_changed';

// audit_log es INSERT-only (ver database-schema.yaml): nunca se actualiza ni borra.
export async function recordAuditEntry(params: {
  ticketId: string;
  actorId: string;
  action: AuditAction;
  changes?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.from('audit_log').insert({
    ticket_id: params.ticketId,
    actor_id: params.actorId,
    action: params.action,
    changes: params.changes ?? null,
  });

  if (error) throw error;
}
