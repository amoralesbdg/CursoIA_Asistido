import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { createSupabaseMock } from '@/test/supabase-mock';

const supabaseRef = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: supabaseRef }));

const { POST } = await import('./route');

let mock: ReturnType<typeof createSupabaseMock>;

beforeEach(() => {
  mock = createSupabaseMock();
  supabaseRef.from.mockImplementation(mock.supabase.from);
});

function loginRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /auth/login', () => {
  it('Historia 1: login exitoso devuelve el usuario con su rol y un token', async () => {
    // Given una cuenta registrada con password_hash conocido
    const passwordHash = await bcrypt.hash('S3curePass!', 10);
    mock.queue('users', {
      data: {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'jdoe',
        username: 'jdoe',
        email: 'jdoe@example.com',
        role: 'user',
        password_hash: passwordHash,
      },
      error: null,
    });

    // When inicio sesión con usuario y contraseña correctos
    const res = await POST(loginRequest({ username: 'jdoe', password: 'S3curePass!' }));
    const body = await res.json();

    // Then accedo al sistema con mi rol asignado y nunca se expone password_hash
    expect(res.status).toBe(200);
    expect(body.error).toBeNull();
    expect(body.data.user).toEqual({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'jdoe',
      username: 'jdoe',
      email: 'jdoe@example.com',
      role: 'user',
    });
    expect(body.data.user.password_hash).toBeUndefined();
    expect(typeof body.data.token).toBe('string');
  });

  it('Historia 1 (edge case): login sin password es rechazado con 400 validation-error', async () => {
    // Given un payload de login sin password (viola min(1))
    const payload = { username: 'jdoe', password: '' };

    // When se envía POST /auth/login
    const res = await POST(loginRequest(payload));
    const body = await res.json();

    // Then el sistema rechaza la petición por datos inválidos (400 validation-error)
    expect(res.status).toBe(400);
    expect(body.type).toBe('https://miniJira.dev/errors/validation-error');
    expect(mock.supabase.from).not.toHaveBeenCalled();
  });

  it('Historia 1 (edge case crítico): login con contraseña incorrecta es rechazado', async () => {
    // Given una cuenta registrada cuyo password_hash corresponde a otra contraseña
    const passwordHash = await bcrypt.hash('S3curePass!', 10);
    mock.queue('users', {
      data: {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'jdoe',
        username: 'jdoe',
        email: 'jdoe@example.com',
        role: 'user',
        password_hash: passwordHash,
      },
      error: null,
    });

    // When inicio sesión con una contraseña incorrecta
    const res = await POST(loginRequest({ username: 'jdoe', password: 'contraseña-incorrecta' }));
    const body = await res.json();

    // Then el sistema rechaza el acceso (401 unauthenticated)
    expect(res.status).toBe(401);
    expect(body.type).toBe('https://miniJira.dev/errors/unauthenticated');
  });
});
