import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { signToken } from '@/lib/jwt';
import { ok, problem, internalError } from '@/lib/http';
import { LoginRequestSchema } from './schema';

const INSTANCE = '/auth/login';

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

  const parsed = LoginRequestSchema.safeParse(body);
  if (!parsed.success) {
    return problem(
      'validation-error',
      'Datos de login inválidos',
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      INSTANCE,
    );
  }

  const { username, password } = parsed.data;

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, username, email, role, password_hash')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      return internalError(INSTANCE, error);
    }

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return problem(
        'unauthenticated',
        'Credenciales incorrectas',
        'Usuario o contraseña incorrectos.',
        INSTANCE,
      );
    }

    const token = signToken({ sub: user.id, role: user.role });
    const { password_hash: _passwordHash, ...publicUser } = user;

    return ok({ user: publicUser, token });
  } catch (err) {
    return internalError(INSTANCE, err);
  }
}
