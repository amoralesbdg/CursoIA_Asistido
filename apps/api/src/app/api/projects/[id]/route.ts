import { supabase } from '@/lib/supabase';
import { ok, problem, internalError } from '@/lib/http';
import { attachProjectRelations } from '@/lib/projects';
import { ProjectIdParamSchema } from './schema';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const instance = `/projects/${id}`;

  const parsedParams = ProjectIdParamSchema.safeParse({ id });
  if (!parsedParams.success) {
    return problem('not-found', 'Proyecto no encontrado', 'El id de proyecto no es válido.', instance);
  }

  try {
    const { data: row, error } = await supabase
      .from('projects')
      .select('id, name, description, creator_id, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error) return internalError(instance, error);

    if (!row) {
      return problem('not-found', 'Proyecto no encontrado', 'No existe un proyecto con ese id.', instance);
    }

    const [project] = await attachProjectRelations([row]);

    return ok(project);
  } catch (err) {
    return internalError(instance, err);
  }
}
