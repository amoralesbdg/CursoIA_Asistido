import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ok, problem, internalError } from '@/lib/http';
import { attachTicketRelations, TicketRow } from '@/lib/tickets';
import { upsertTagIds } from '@/lib/tags';
import { usersExist } from '@/lib/users';
import { generateTicketKey } from '@/lib/ticket-key';
import { recordAuditEntry } from '@/lib/audit';
import { ListTicketsQuerySchema, CreateTicketRequestSchema } from './schema';

const INSTANCE = '/tickets';
const TICKET_COLUMNS =
  'id, key, project_id, title, description, status, priority, creator_id, due_date, archived_at';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = ListTicketsQuerySchema.safeParse({
    projectId: searchParams.get('projectId') ?? undefined,
    priority: searchParams.get('priority') ?? undefined,
    assigneeId: searchParams.get('assigneeId') ?? undefined,
    tag: searchParams.get('tag') ?? undefined,
    dueDateFrom: searchParams.get('dueDateFrom') ?? undefined,
    dueDateTo: searchParams.get('dueDateTo') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  });

  if (!parsed.success) {
    return problem(
      'validation-error',
      'Parámetros de filtro inválidos',
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      INSTANCE,
    );
  }

  const { projectId, priority, assigneeId, tag, dueDateFrom, dueDateTo, page, pageSize } = parsed.data;
  const emptyPage = () => ok({ items: [], page, pageSize, total: 0, totalPages: 1 });

  try {
    let allowedIds: string[] | null = null;

    if (assigneeId) {
      const { data, error } = await supabase
        .from('ticket_assignees')
        .select('ticket_id')
        .eq('user_id', assigneeId);
      if (error) return internalError(INSTANCE, error);

      allowedIds = (data ?? []).map((r) => r.ticket_id);
      if (allowedIds.length === 0) return emptyPage();
    }

    if (tag) {
      const { data: tagRow, error: tagError } = await supabase
        .from('tags')
        .select('id')
        .ilike('name', tag)
        .maybeSingle();
      if (tagError) return internalError(INSTANCE, tagError);
      if (!tagRow) return emptyPage();

      const { data: taggedRows, error: ticketTagsError } = await supabase
        .from('ticket_tags')
        .select('ticket_id')
        .eq('tag_id', tagRow.id);
      if (ticketTagsError) return internalError(INSTANCE, ticketTagsError);

      const taggedIds = (taggedRows ?? []).map((r) => r.ticket_id);
      allowedIds = allowedIds ? allowedIds.filter((id) => taggedIds.includes(id)) : taggedIds;
      if (allowedIds.length === 0) return emptyPage();
    }

    let query = supabase
      .from('tickets')
      .select(TICKET_COLUMNS, { count: 'exact' })
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (projectId) query = query.eq('project_id', projectId);
    if (priority) query = query.eq('priority', priority);
    if (dueDateFrom) query = query.gte('due_date', dueDateFrom);
    if (dueDateTo) query = query.lte('due_date', dueDateTo);
    if (allowedIds) query = query.in('id', allowedIds);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data: rows, error, count } = await query.range(from, to);

    if (error) return internalError(INSTANCE, error);

    const items = await attachTicketRelations(rows ?? []);
    const total = count ?? 0;

    return ok({
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    return internalError(INSTANCE, err);
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return problem(
      'validation-error',
      'JSON inválido',
      'El cuerpo de la petición no es un JSON válido.',
      INSTANCE,
    );
  }

  const parsed = CreateTicketRequestSchema.safeParse(body);
  if (!parsed.success) {
    return problem(
      'validation-error',
      'Datos de ticket inválidos',
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      INSTANCE,
    );
  }

  const { title, description, projectId, priority, assigneeIds, tags, dueDate, creatorId } = parsed.data;

  try {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .maybeSingle();
    if (projectError) return internalError(INSTANCE, projectError);
    if (!project) {
      return problem('not-found', 'Proyecto no encontrado', 'No existe un proyecto con ese id.', INSTANCE);
    }

    if (!(await usersExist([creatorId]))) {
      return problem('not-found', 'Usuario no encontrado', 'No existe un usuario con ese creatorId.', INSTANCE);
    }

    if (assigneeIds && assigneeIds.length > 0 && !(await usersExist(assigneeIds))) {
      return problem(
        'not-found',
        'Usuario no encontrado',
        'Uno o más assigneeIds no corresponden a usuarios existentes.',
        INSTANCE,
      );
    }

    const tagIds = tags && tags.length > 0 ? await upsertTagIds(tags) : [];

    let insertedTicket: TicketRow | null = null;
    for (let attempt = 0; attempt < 3 && !insertedTicket; attempt++) {
      const key = await generateTicketKey(projectId, project.name, attempt);
      const { data: inserted, error: insertError } = await supabase
        .from('tickets')
        .insert({
          key,
          project_id: projectId,
          title,
          description: description ?? null,
          priority,
          creator_id: creatorId,
          due_date: dueDate ?? null,
        })
        .select(TICKET_COLUMNS)
        .single();

      if (insertError) {
        if (insertError.code === '23505' && attempt < 2) continue;
        return internalError(INSTANCE, insertError);
      }
      insertedTicket = inserted;
    }

    if (!insertedTicket) {
      return internalError(INSTANCE, new Error('No se pudo generar un key único para el ticket.'));
    }

    if (assigneeIds && assigneeIds.length > 0) {
      const { error: assigneesError } = await supabase
        .from('ticket_assignees')
        .insert(assigneeIds.map((userId) => ({ ticket_id: insertedTicket!.id, user_id: userId })));
      if (assigneesError) return internalError(INSTANCE, assigneesError);
    }

    if (tagIds.length > 0) {
      const { error: ticketTagsError } = await supabase
        .from('ticket_tags')
        .insert(tagIds.map((tagId) => ({ ticket_id: insertedTicket!.id, tag_id: tagId })));
      if (ticketTagsError) return internalError(INSTANCE, ticketTagsError);
    }

    await recordAuditEntry({ ticketId: insertedTicket.id, actorId: creatorId, action: 'created' });

    const [dto] = await attachTicketRelations([insertedTicket]);
    return ok(dto, 201);
  } catch (err) {
    return internalError(INSTANCE, err);
  }
}
