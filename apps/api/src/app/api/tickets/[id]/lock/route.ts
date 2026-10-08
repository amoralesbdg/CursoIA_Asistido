import { supabase } from '@/lib/supabase';
import { ok, problem, internalError } from '@/lib/http';
import { CreateLockRequestSchema, DeleteLockQuerySchema } from './schema';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: ticketId } = await params;
  const instance = `/tickets/${ticketId}/lock`;

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

  const parsed = CreateLockRequestSchema.safeParse(body);
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
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id')
      .eq('id', ticketId)
      .maybeSingle();
    if (ticketError) return internalError(instance, ticketError);
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

    const { data: lock, error: upsertError } = await supabase
      .from('ticket_locks')
      .upsert(
        { ticket_id: ticketId, user_id: userId, created_at: new Date().toISOString() },
        { onConflict: 'ticket_id' },
      )
      .select('ticket_id, user_id, created_at')
      .single();

    if (upsertError) return internalError(instance, upsertError);

    return ok({ ticketId: lock.ticket_id, userId: lock.user_id, createdAt: lock.created_at });
  } catch (err) {
    return internalError(instance, err);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: ticketId } = await params;
  const instance = `/tickets/${ticketId}/lock`;

  const { searchParams } = new URL(req.url);
  const parsed = DeleteLockQuerySchema.safeParse({ userId: searchParams.get('userId') ?? undefined });
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
    const { error } = await supabase
      .from('ticket_locks')
      .delete()
      .eq('ticket_id', ticketId)
      .eq('user_id', userId);

    if (error) return internalError(instance, error);

    return ok(null);
  } catch (err) {
    return internalError(instance, err);
  }
}
