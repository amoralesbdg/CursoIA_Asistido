import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ok, problem, internalError } from '@/lib/http';
import { attachProjectRelations } from '@/lib/projects';
import { usersExist } from '@/lib/users';
import { ListProjectsQuerySchema, CreateProjectRequestSchema } from './schema';

const INSTANCE = '/projects';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = ListProjectsQuerySchema.safeParse({
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  });

  if (!parsed.success) {
    return problem(
      'validation-error',
      'Parámetros de paginación inválidos',
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      INSTANCE,
    );
  }

  const { page, pageSize } = parsed.data;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const {
      data: rows,
      error,
      count,
    } = await supabase
      .from('projects')
      .select('id, name, description, creator_id, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) return internalError(INSTANCE, error);

    const items = await attachProjectRelations(rows ?? []);
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

  const parsed = CreateProjectRequestSchema.safeParse(body);
  if (!parsed.success) {
    return problem(
      'validation-error',
      'Datos de proyecto inválidos',
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      INSTANCE,
    );
  }

  const { name, description, creatorId } = parsed.data;

  try {
    if (!(await usersExist([creatorId]))) {
      return problem('not-found', 'Usuario no encontrado', 'No existe un usuario con ese creatorId.', INSTANCE);
    }

    const { data: inserted, error } = await supabase
      .from('projects')
      .insert({ name, description: description ?? null, creator_id: creatorId })
      .select('id, name, description, creator_id, created_at')
      .single();

    if (error) return internalError(INSTANCE, error);

    const [project] = await attachProjectRelations([inserted]);
    return ok(project, 201);
  } catch (err) {
    return internalError(INSTANCE, err);
  }
}
