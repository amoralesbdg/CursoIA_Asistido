import { supabase } from '@/lib/supabase';
import { ok, problem, internalError } from '@/lib/http';
import { attachProjectRelations } from '@/lib/projects';
import { resolveActor } from '@/lib/ownership';
import { AddMemberRequestSchema } from './schema';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const instance = `/projects/${projectId}/members`;

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

  const parsed = AddMemberRequestSchema.safeParse(body);
  if (!parsed.success) {
    return problem(
      'validation-error',
      'Datos inválidos',
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      instance,
    );
  }

  const { userId, actorId } = parsed.data;

  try {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, description, creator_id, created_at')
      .eq('id', projectId)
      .maybeSingle();
    if (projectError) return internalError(instance, projectError);
    if (!project) {
      return problem('not-found', 'Proyecto no encontrado', 'No existe un proyecto con ese id.', instance);
    }

    const actor = await resolveActor(actorId);
    if (!actor) {
      return problem(
        'validation-error',
        'Actor inválido',
        'No existe un usuario con el actorId provisto.',
        instance,
      );
    }

    if (actor.role !== 'admin' && actor.id !== project.creator_id) {
      return problem(
        'forbidden',
        'No autorizado',
        'Solo el creador del proyecto o un admin pueden agregar miembros.',
        instance,
      );
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
      .from('project_members')
      .select('project_id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle();
    if (existingError) return internalError(instance, existingError);

    if (!existing) {
      const { error: insertError } = await supabase
        .from('project_members')
        .insert({ project_id: projectId, user_id: userId });
      if (insertError) return internalError(instance, insertError);
    }

    const [dto] = await attachProjectRelations([project]);
    return ok(dto);
  } catch (err) {
    return internalError(instance, err);
  }
}
