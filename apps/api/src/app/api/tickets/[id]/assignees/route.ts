import { supabase } from '@/lib/supabase';
import { ok, problem, internalError } from '@/lib/http';
import { attachTicketRelations } from '@/lib/tickets';
import { AddAssigneeRequestSchema } from './schema';

const TICKET_COLUMNS =
  'id, key, project_id, title, description, status, priority, creator_id, due_date, archived_at';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: ticketId } = await params;
  const instance = `/tickets/${ticketId}/assignees`;

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

  const parsed = AddAssigneeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return problem(
      'validation-error',
      'userId inválido',
      parsed.error.issues.map((i) => i.message).join('; '),
      instance,
    );
  }

  const { userId } = parsed.data;

  try {
    const { data: ticket, error: fetchError } = await supabase
      .from('tickets')
      .select(TICKET_COLUMNS)
      .eq('id', ticketId)
      .maybeSingle();

    if (fetchError) return internalError(instance, fetchError);
    if (!ticket) {
      return problem('not-found', 'Ticket no encontrado', 'No existe un ticket con ese id.', instance);
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    if (userError) return internalError(instance, userError);
    if (!user) {
      return problem('not-found', 'Usuario no encontrado', 'No existe un usuario con ese userId.', instance);
    }

    const { data: existing, error: existingError } = await supabase
      .from('ticket_assignees')
      .select('ticket_id')
      .eq('ticket_id', ticketId)
      .eq('user_id', userId)
      .maybeSingle();
    if (existingError) return internalError(instance, existingError);

    if (!existing) {
      const { error: insertError } = await supabase
        .from('ticket_assignees')
        .insert({ ticket_id: ticketId, user_id: userId });
      if (insertError) return internalError(instance, insertError);
    }

    const [dto] = await attachTicketRelations([ticket]);
    return ok(dto);
  } catch (err) {
    return internalError(instance, err);
  }
}
