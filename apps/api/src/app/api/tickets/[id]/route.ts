import { supabase } from '@/lib/supabase';
import { ok, problem, internalError } from '@/lib/http';
import { attachTicketRelations } from '@/lib/tickets';
import { upsertTagIds } from '@/lib/tags';
import { usersExist } from '@/lib/users';
import { resolveActor, isOwnerOrAdmin } from '@/lib/ownership';
import { recordAuditEntry } from '@/lib/audit';
import { UpdateTicketRequestSchema, DeleteTicketQuerySchema } from './schema';

const TICKET_COLUMNS =
  'id, key, project_id, title, description, status, priority, creator_id, due_date, archived_at';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: ticketId } = await params;
  const instance = `/tickets/${ticketId}`;

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

  const parsed = UpdateTicketRequestSchema.safeParse(body);
  if (!parsed.success) {
    return problem(
      'validation-error',
      'Datos de actualización inválidos',
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      instance,
    );
  }

  const { actorId, title, description, priority, assigneeIds, tags, dueDate } = parsed.data;

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

    const { data: currentAssignees, error: assigneesFetchError } = await supabase
      .from('ticket_assignees')
      .select('user_id')
      .eq('ticket_id', ticketId);
    if (assigneesFetchError) return internalError(instance, assigneesFetchError);

    const actor = await resolveActor(actorId);
    if (!actor) {
      return problem(
        'validation-error',
        'Actor inválido',
        'No existe un usuario con el actorId provisto.',
        instance,
      );
    }

    const currentAssigneeIds = (currentAssignees ?? []).map((a) => a.user_id);
    if (!isOwnerOrAdmin(actor, ticket, currentAssigneeIds)) {
      return problem(
        'forbidden',
        'No autorizado',
        'Solo un admin, el creador o un asignado pueden editar este ticket.',
        instance,
      );
    }

    if (assigneeIds && assigneeIds.length > 0 && !(await usersExist(assigneeIds))) {
      return problem(
        'not-found',
        'Usuario no encontrado',
        'Uno o más assigneeIds no corresponden a usuarios existentes.',
        instance,
      );
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority !== undefined) updates.priority = priority;
    if (dueDate !== undefined) updates.due_date = dueDate;

    const { data: updated, error: updateError } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', ticketId)
      .select(TICKET_COLUMNS)
      .single();

    if (updateError) return internalError(instance, updateError);

    if (assigneeIds !== undefined) {
      const { error: deleteError } = await supabase
        .from('ticket_assignees')
        .delete()
        .eq('ticket_id', ticketId);
      if (deleteError) return internalError(instance, deleteError);

      if (assigneeIds.length > 0) {
        const { error: insertError } = await supabase
          .from('ticket_assignees')
          .insert(assigneeIds.map((userId) => ({ ticket_id: ticketId, user_id: userId })));
        if (insertError) return internalError(instance, insertError);
      }
    }

    if (tags !== undefined) {
      const { error: deleteTagsError } = await supabase
        .from('ticket_tags')
        .delete()
        .eq('ticket_id', ticketId);
      if (deleteTagsError) return internalError(instance, deleteTagsError);

      if (tags.length > 0) {
        const tagIds = await upsertTagIds(tags);
        const { error: insertTagsError } = await supabase
          .from('ticket_tags')
          .insert(tagIds.map((tagId) => ({ ticket_id: ticketId, tag_id: tagId })));
        if (insertTagsError) return internalError(instance, insertTagsError);
      }
    }

    await recordAuditEntry({
      ticketId,
      actorId,
      action: 'updated',
      changes: { title, description, priority, assigneeIds, tags, dueDate },
    });

    const [dto] = await attachTicketRelations([updated]);
    return ok(dto);
  } catch (err) {
    return internalError(instance, err);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: ticketId } = await params;
  const instance = `/tickets/${ticketId}`;

  const { searchParams } = new URL(req.url);
  const parsedQuery = DeleteTicketQuerySchema.safeParse({
    actorId: searchParams.get('actorId') ?? undefined,
  });
  if (!parsedQuery.success) {
    return problem(
      'validation-error',
      'actorId inválido',
      parsedQuery.error.issues.map((i) => i.message).join('; '),
      instance,
    );
  }

  const { actorId } = parsedQuery.data;

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

    const { data: assigneeRows, error: assigneesFetchError } = await supabase
      .from('ticket_assignees')
      .select('user_id')
      .eq('ticket_id', ticketId);
    if (assigneesFetchError) return internalError(instance, assigneesFetchError);

    const actor = await resolveActor(actorId);
    if (!actor) {
      return problem(
        'validation-error',
        'Actor inválido',
        'No existe un usuario con el actorId provisto.',
        instance,
      );
    }

    const assigneeIds = (assigneeRows ?? []).map((a) => a.user_id);
    if (!isOwnerOrAdmin(actor, ticket, assigneeIds)) {
      return problem(
        'forbidden',
        'No autorizado',
        'Solo un admin, el creador o un asignado pueden archivar este ticket.',
        instance,
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('tickets')
      .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', ticketId)
      .select(TICKET_COLUMNS)
      .single();

    if (updateError) return internalError(instance, updateError);

    await recordAuditEntry({ ticketId, actorId, action: 'archived' });

    const [dto] = await attachTicketRelations([updated]);
    return ok(dto);
  } catch (err) {
    return internalError(instance, err);
  }
}
