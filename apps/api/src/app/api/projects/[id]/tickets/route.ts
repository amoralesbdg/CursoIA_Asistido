import { supabase } from '@/lib/supabase';
import { ok, problem, internalError } from '@/lib/http';
import { attachTicketRelations } from '@/lib/tickets';
import { STATUS_ORDER } from '@/lib/schemas';
import { ProjectTicketsQuerySchema } from './schema';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const instance = `/projects/${projectId}/tickets`;

  const { searchParams } = new URL(req.url);
  const parsedQuery = ProjectTicketsQuerySchema.safeParse({
    status: searchParams.get('status') ?? undefined,
  });

  if (!parsedQuery.success) {
    return problem(
      'validation-error',
      'Filtro de estado inválido',
      parsedQuery.error.issues.map((i) => i.message).join('; '),
      instance,
    );
  }

  try {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .maybeSingle();

    if (projectError) return internalError(instance, projectError);
    if (!project) {
      return problem('not-found', 'Proyecto no encontrado', 'No existe un proyecto con ese id.', instance);
    }

    let query = supabase
      .from('tickets')
      .select(
        'id, key, project_id, title, description, status, priority, creator_id, due_date, archived_at',
      )
      .eq('project_id', projectId)
      .is('archived_at', null)
      .order('created_at', { ascending: true });

    const { status } = parsedQuery.data;
    if (status) {
      query = query.eq('status', status);
    }

    const { data: rows, error } = await query;
    if (error) return internalError(instance, error);

    const tickets = await attachTicketRelations(rows ?? []);

    if (status) {
      return ok(tickets);
    }

    const grouped = Object.fromEntries(
      STATUS_ORDER.map((s) => [s, tickets.filter((t) => t.status === s)]),
    );

    return ok(grouped);
  } catch (err) {
    return internalError(instance, err);
  }
}
