import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createSupabaseMock } from '@/test/supabase-mock';

const supabaseRef = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: supabaseRef }));

const { POST } = await import('./route');

let mock: ReturnType<typeof createSupabaseMock>;

beforeEach(() => {
  mock = createSupabaseMock();
  supabaseRef.from.mockImplementation(mock.supabase.from);
});

function registerRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /auth/register', () => {
  it('Historia 1: registro exitoso con email obligatorio crea la cuenta y devuelve token', async () => {
    // Given un payload válido de registro
    const insertedUser = {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'jdoe',
      username: 'jdoe',
      email: 'jdoe@example.com',
      role: 'user',
    };
    mock.queue('users', { data: insertedUser, error: null });

    // When se envía POST /auth/register
    const res = await POST(
      registerRequest({ username: 'jdoe', password: 'S3curePass!', email: 'jdoe@example.com' }),
    );
    const body = await res.json();

    // Then se crea la cuenta y se devuelve { user, token } envuelto en { data, error: null }
    expect(res.status).toBe(201);
    expect(body.error).toBeNull();
    expect(body.data.user).toEqual(insertedUser);
    expect(typeof body.data.token).toBe('string');
  });

  it('Historia 1 (edge case): registro sin email es rechazado con 400 validation-error', async () => {
    // Given un payload de registro sin el campo email obligatorio
    const payload = { username: 'jdoe', password: 'S3curePass!' };

    // When se envía POST /auth/register
    const res = await POST(registerRequest(payload));
    const body = await res.json();

    // Then el sistema rechaza el registro por falta de email obligatorio (400 validation-error)
    expect(res.status).toBe(400);
    expect(body.type).toBe('https://miniJira.dev/errors/validation-error');
    expect(mock.supabase.from).not.toHaveBeenCalled();
  });

  it('Historia 1 (edge case crítico): registro con username ya existente es rechazado por duplicidad', async () => {
    // Given que el username ya existe (Postgres unique_violation 23505)
    mock.queue('users', { data: null, error: { code: '23505', message: 'duplicate key value' } });

    // When otra persona intenta registrarse con ese mismo username
    const res = await POST(
      registerRequest({ username: 'jdoe', password: 'S3curePass!', email: 'otro@example.com' }),
    );
    const body = await res.json();

    // Then el sistema rechaza el registro por duplicidad (409 duplicate)
    expect(res.status).toBe(409);
    expect(body.type).toBe('https://miniJira.dev/errors/duplicate');
  });
});
