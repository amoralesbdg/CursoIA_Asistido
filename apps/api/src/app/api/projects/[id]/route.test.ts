import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSupabaseMock } from '@/test/supabase-mock';

const supabaseRef = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: supabaseRef }));

const { GET } = await import('./route');

let mock: ReturnType<typeof createSupabaseMock>;

beforeEach(() => {
  mock = createSupabaseMock();
  supabaseRef.from.mockImplementation(mock.supabase.from);
});

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /projects/:id', () => {
  it('Historia 5: devuelve el proyecto cuando existe', async () => {
    // Given un proyecto existente
    const row = {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Portal de clientes',
      description: null,
      creator_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      created_at: '2026-01-01T00:00:00.000Z',
    };
    mock.queue('projects', { data: row, error: null });
    mock.queue('project_members', { data: [], error: null });
    mock.queue('tickets', { data: [], error: null });

    // When se solicita GET /projects/:id con un id existente
    const res = await GET(new Request(`http://localhost/api/projects/${row.id}`), params(row.id));
    const body = await res.json();

    // Then se devuelve el proyecto envuelto en { data, error: null }
    expect(res.status).toBe(200);
    expect(body.error).toBeNull();
    expect(body.data).toMatchObject({ id: row.id, name: row.name });
  });

  // Pendiente: el código actual mapea un id malformado a 404 (not-found), no
  // a 400 (ver app/api/projects/[id]/route.ts:10-13). Decisión de diseño a
  // confirmar con el equipo antes de reactivar (quitar .skip).
  it.skip('Historia 5 (edge case): un id con formato inválido es rechazado con 400 validation-error', async () => {
    // Given un id que no cumple el formato uuid exigido por ProjectIdParamSchema
    const invalidId = 'no-es-un-uuid';

    // When se solicita GET /projects/:id con ese id malformado
    const res = await GET(new Request(`http://localhost/api/projects/${invalidId}`), params(invalidId));
    const body = await res.json();

    // Then, por la convención global de errores del contrato (id malformado = input
    // inválido), se esperaría 400 validation-error.
    expect(body.status).toBe(400);
    expect(res.status).toBe(400);
    expect(mock.supabase.from).not.toHaveBeenCalled();
  });

  // Pendiente: GET /projects/:id no valida Authorization todavía (mismo gap
  // de fase sin JWT que GET /projects), así que no hay chequeo de ownership
  // que probar. Reactivar (quitar .skip) cuando se implemente la validación
  // de JWT y el filtrado por visibilidad.
  it.skip('Historia 5 (edge case crítico): un usuario sin visibilidad sobre el proyecto no debería verlo', async () => {
    // Given un proyecto que existe pero del que el solicitante no es creador ni miembro
    const row = {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Proyecto ajeno',
      description: null,
      creator_id: 'otro-usuario-id',
      created_at: '2026-01-01T00:00:00.000Z',
    };
    mock.queue('projects', { data: row, error: null });
    mock.queue('project_members', { data: [], error: null });
    mock.queue('tickets', { data: [], error: null });

    // When un usuario sin relación con el proyecto solicita GET /projects/:id
    const res = await GET(
      new Request(`http://localhost/api/projects/${row.id}`, {
        headers: { Authorization: 'Bearer token-usuario-sin-acceso' },
      }),
      params(row.id),
    );

    // Then, según el contrato ("404 si no existe o si el usuario no tiene
    // visibilidad", docs/api-contract.md:118), debería devolver 404.
    expect(res.status).toBe(404);
  });
});
