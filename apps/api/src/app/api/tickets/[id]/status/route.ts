import { supabase } from '@/lib/supabase';
import { ok, problem, internalError } from '@/lib/http';
import { attachTicketRelations } from '@/lib/tickets';
import { STATUS_ORDER } from '@/lib/schemas';
import { UpdateTicketStatusRequestSchema } from './schema';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: ticketId } = await params;
  const instance = `/tickets/${ticketId}/status`;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return problem(
      'validation-error',
      'JSON inválido',
      'El cuerpo de la petición no es un JSON válido.',
      instance,
    );
  }

  const parsed = UpdateTicketStatusRequestSchema.safeParse(body);
  if (!parsed.success) {
    return problem(
      'validation-error',
      'Status inválido',
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      instance,
    );
  }

  const { status: nextStatus } = parsed.data;

  try {
    const { data: ticket, error: fetchError } = await supabase
      .from('tickets')
      .select(
        'id, key, project_id, title, description, status, priority, creator_id, due_date, archived_at',
      )
      .eq('id', ticketId)
      .maybeSingle();

    if (fetchError) return internalError(instance, fetchError);
    if (!ticket) {
      return problem('not-found', 'Ticket no encontrado', 'No existe un ticket con ese id.', instance);
    }

    const currentIndex = STATUS_ORDER.indexOf(ticket.status);
    const expectedNext = STATUS_ORDER[currentIndex + 1];

    if (expectedNext !== nextStatus) {
      return problem(
        'forbidden-transition',
        'Transición de estado no permitida',
        `No se puede mover el ticket de '${ticket.status}' a '${nextStatus}' directamente.`,
        instance,
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('tickets')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
      .select(
        'id, key, project_id, title, description, status, priority, creator_id, due_date, archived_at',
      )
      .single();

    if (updateError) return internalError(instance, updateError);

    const [dto] = await attachTicketRelations([updated]);

    return ok(dto);
  } catch (err) {
    return internalError(instance, err);
  }
}
