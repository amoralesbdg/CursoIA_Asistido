import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createSupabaseMock } from '@/test/supabase-mock';

const supabaseRef = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: supabaseRef }));

const { GET } = await import('./route');

let mock: ReturnType<typeof createSupabaseMock>;

beforeEach(() => {
  mock = createSupabaseMock();
  supabaseRef.from.mockImplementation(mock.supabase.from);
});

function listRequest(query: string, authToken?: string) {
  return new NextRequest(`http://localhost/api/projects${query}`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
  });
}

describe('GET /projects', () => {
  it('Historia 5: lista proyectos paginados', async () => {
    // Given dos proyectos existentes en la página 1
    const row = {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Portal de clientes',
      description: null,
      creator_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      created_at: '2026-01-01T00:00:00.000Z',
    };
    mock.queue('projects', { data: [row], error: null, count: 1 });
    mock.queue('project_members', { data: [], error: null });
    mock.queue('tickets', { data: [], error: null });

    // When se solicita GET /projects?page=1&pageSize=20
    const res = await GET(listRequest('?page=1&pageSize=20'));
    const body = await res.json();

    // Then se devuelve el listado paginado envuelto en { data, error: null }
    expect(res.status).toBe(200);
    expect(body.error).toBeNull();
    expect(body.data).toMatchObject({ page: 1, pageSize: 20, total: 1, totalPages: 1 });
    expect(body.data.items).toHaveLength(1);
    expect(body.data.items[0]).toMatchObject({ id: row.id, name: row.name, ticketCount: 0 });
  });

  it('Historia 5 (edge case): pageSize fuera de rango es rechazado con 400 validation-error', async () => {
    // Given un pageSize mayor al máximo permitido (100)
    // When se solicita GET /projects?pageSize=500
    const res = await GET(listRequest('?pageSize=500'));
    const body = await res.json();

    // Then el sistema rechaza los parámetros de paginación inválidos (400 validation-error)
    expect(res.status).toBe(400);
    expect(body.type).toBe('https://miniJira.dev/errors/validation-error');
    expect(mock.supabase.from).not.toHaveBeenCalled();
  });

  // Pendiente: GET /projects no valida Authorization todavía (fase sin JWT,
  // ver lib/jwt.ts:15 y app/api/projects/schema.ts:28-29), así que no hay
  // forma de identificar al "usuario normal" para filtrar por ownership.
  // Reactivar (quitar .skip) cuando se implemente la validación de JWT.
  it.skip('Historia 5 (edge case crítico): usuario normal solo ve sus proyectos, no los de otros', async () => {
    // Given dos proyectos: uno del "usuario normal" que hace la petición y otro ajeno
    const ownProject = {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Proyecto propio',
      description: null,
      creator_id: 'user-normal-id',
      created_at: '2026-01-01T00:00:00.000Z',
    };
    const otherProject = {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Proyecto ajeno',
      description: null,
      creator_id: 'otro-usuario-id',
      created_at: '2026-01-02T00:00:00.000Z',
    };
    mock.queue('projects', { data: [ownProject, otherProject], error: null, count: 2 });
    mock.queue('project_members', { data: [], error: null });
    mock.queue('tickets', { data: [], error: null });

    // When un usuario normal (identificado por su JWT) solicita GET /projects
    const res = await GET(listRequest('', 'token-de-usuario-normal'));
    const body = await res.json();

    // Then, según el contrato (docs/api-contract.md:117, H5), solo debería ver
    // los proyectos que creó o donde es miembro — nunca el proyecto ajeno.
    expect(body.data.items.map((p: { id: string }) => p.id)).not.toContain(otherProject.id);
  });
});
