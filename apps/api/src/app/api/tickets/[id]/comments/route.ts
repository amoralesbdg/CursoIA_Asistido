import { supabase } from '@/lib/supabase';
import { ok, problem, internalError } from '@/lib/http';
import { ListCommentsQuerySchema, CreateCommentRequestSchema } from './schema';

type CommentRow = {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

function toCommentDTO(row: CommentRow) {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: ticketId } = await params;
  const instance = `/tickets/${ticketId}/comments`;

  const { searchParams } = new URL(req.url);
  const parsed = ListCommentsQuerySchema.safeParse({
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
      .from('comments')
      .select('id, ticket_id, author_id, body, created_at', { count: 'exact' })
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
      .range(from, to);

    if (error) return internalError(instance, error);

    const total = count ?? 0;
    return ok({
      items: (rows ?? []).map(toCommentDTO),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    return internalError(instance, err);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: ticketId } = await params;
  const instance = `/tickets/${ticketId}/comments`;

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

  const parsed = CreateCommentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return problem(
      'validation-error',
      'Datos de comentario inválidos',
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      instance,
    );
  }

  const { body: commentBody, authorId } = parsed.data;

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

    const { data: author, error: authorError } = await supabase
      .from('users')
      .select('id')
      .eq('id', authorId)
      .maybeSingle();
    if (authorError) return internalError(instance, authorError);
    if (!author) {
      return problem('not-found', 'Usuario no encontrado', 'No existe un usuario con ese authorId.', instance);
    }

    const { data: inserted, error: insertError } = await supabase
      .from('comments')
      .insert({ ticket_id: ticketId, author_id: authorId, body: commentBody })
      .select('id, ticket_id, author_id, body, created_at')
      .single();

    if (insertError) return internalError(instance, insertError);

    return ok(toCommentDTO(inserted), 201);
  } catch (err) {
    return internalError(instance, err);
  }
}
