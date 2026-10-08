import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { signToken } from '@/lib/jwt';
import { ok, problem, internalError } from '@/lib/http';
import { RegisterRequestSchema } from './schema';

const INSTANCE = '/auth/register';

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

  const parsed = RegisterRequestSchema.safeParse(body);
  if (!parsed.success) {
    return problem(
      'validation-error',
      'Datos de registro inválidos',
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      INSTANCE,
    );
  }

  const { username, password, email } = parsed.data;

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    // El contrato no incluye `name`; la tabla `users` lo exige NOT NULL,
    // así que se completa con el username (ver database-schema.yaml).
    const { data: inserted, error } = await supabase
      .from('users')
      .insert({ name: username, username, email, password_hash: passwordHash })
      .select('id, name, username, email, role')
      .single();

    if (error) {
      if (error.code === '23505') {
        return problem(
          'duplicate',
          'Username o email ya registrado',
          'Ya existe una cuenta con ese username o email.',
          INSTANCE,
        );
      }
      return internalError(INSTANCE, error);
    }

    const token = signToken({ sub: inserted.id, role: inserted.role });

    return ok({ user: inserted, token }, 201);
  } catch (err) {
    return internalError(INSTANCE, err);
  }
}
