import { supabase } from '@/lib/supabase';
import { ok, problem, internalError } from '@/lib/http';
import { ListAuditQuerySchema } from './schema';

type AuditRow = {
  id: string;
  ticket_id: string;
  actor_id: string;
  action: 'created' | 'updated' | 'archived' | 'status_changed';
  changes: Record<string, unknown> | null;
  created_at: string;
};

function toAuditDTO(row: AuditRow) {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    actorId: row.actor_id,
    action: row.action,
    changes: row.changes,
    createdAt: row.created_at,
  };
}

export async function GET(req: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const instance = `/audit/${ticketId}`;

  const { searchParams } = new URL(req.url);
  const parsed = ListAuditQuerySchema.safeParse({
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  });
  if (!parsed.success) {
    return problem(
      'validation-error',
      'Parámetros de paginación inválidos',
      parsed.error.issues.map((i) => i.message).join('; '),
      instance,
    );
  }

  const { page, pageSize } = parsed.data;

  try {
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id')
      .eq('id', ticketId)
      .maybeSingle();
    if (ticketError) return internalError(instance, ticketError);
    if (!ticket) {
      return problem('not-found', 'Ticket no encontrado', 'No existe un ticket con ese id.', instance);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const {
      data: rows,
      error,
      count,
    } = await supabase
      .from('audit_log')
      .select('id, ticket_id, actor_id, action, changes, created_at', { count: 'exact' })
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) return internalError(instance, error);

    const total = count ?? 0;
    return ok({
      items: (rows ?? []).map(toAuditDTO),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    return internalError(instance, err);
  }
}
