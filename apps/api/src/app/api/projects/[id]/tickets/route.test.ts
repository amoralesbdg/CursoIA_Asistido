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

const PROJECT_ID = '11111111-1111-1111-1111-111111111111';

function params() {
  return { params: Promise.resolve({ id: PROJECT_ID }) };
}

function ticketRow(overrides: Partial<Record<string, unknown>>) {
  return {
    id: '22222222-2222-2222-2222-222222222222',
    key: 'PRJ-1',
    project_id: PROJECT_ID,
    title: 'Ticket de prueba',
    description: null,
    status: 'todo',
    priority: 'medium',
    creator_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    due_date: null,
    archived_at: null,
    ...overrides,
  };
}

describe('GET /projects/:id/tickets', () => {
  it('Historia 9: sin filtro de status, agrupa los tickets por columna del Kanban', async () => {
    // Given un proyecto con un ticket en "todo" y otro en "done"
    mock.queue('projects', { data: { id: PROJECT_ID }, error: null });
    mock.queue('tickets', {
      data: [
        ticketRow({ id: 't-todo', status: 'todo' }),
        ticketRow({ id: 't-done', status: 'done' }),
      ],
      error: null,
    });
    mock.queue('ticket_assignees', { data: [], error: null });
    mock.queue('ticket_tags', { data: [], error: null });

    // When se solicita GET /projects/:id/tickets sin query param status
    const res = await GET(new Request(`http://localhost/api/projects/${PROJECT_ID}/tickets`), params());
    const body = await res.json();

    // Then la respuesta agrupa los tickets en las 4 columnas del Kanban
    expect(res.status).toBe(200);
    expect(body.data.todo).toHaveLength(1);
    expect(body.data.todo[0].id).toBe('t-todo');
    expect(body.data.done).toHaveLength(1);
    expect(body.data['in-progress']).toEqual([]);
    expect(body.data.review).toEqual([]);
  });

  it('Historia 9 (edge case): un status fuera del enum es rechazado con 400 validation-error', async () => {
    // Given un query param status con un valor que no pertenece al enum de Status
    // When se solicita GET /projects/:id/tickets?status=finalizado
    const res = await GET(
      new Request(`http://localhost/api/projects/${PROJECT_ID}/tickets?status=finalizado`),
      params(),
    );
    const body = await res.json();

    // Then el sistema rechaza el filtro de estado inválido (400 validation-error)
    expect(res.status).toBe(400);
    expect(body.type).toBe('https://miniJira.dev/errors/validation-error');
    expect(mock.supabase.from).not.toHaveBeenCalled();
  });

  it('Historia 9 (edge case crítico): filtrar por status devuelve un arreglo plano, no agrupado', async () => {
    // Given un proyecto con tickets, y se filtra explícitamente por status=review
    mock.queue('projects', { data: { id: PROJECT_ID }, error: null });
    mock.queue('tickets', { data: [ticketRow({ id: 't-review', status: 'review' })], error: null });
    mock.queue('ticket_assignees', { data: [], error: null });
    mock.queue('ticket_tags', { data: [], error: null });

    // When se solicita GET /projects/:id/tickets?status=review
    const res = await GET(
      new Request(`http://localhost/api/projects/${PROJECT_ID}/tickets?status=review`),
      params(),
    );
    const body = await res.json();

    // Then la respuesta es un arreglo plano filtrado (no el objeto agrupado por columnas)
    expect(res.status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].status).toBe('review');
  });
});
