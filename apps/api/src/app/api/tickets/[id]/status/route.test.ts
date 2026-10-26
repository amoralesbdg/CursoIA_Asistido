import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSupabaseMock } from '@/test/supabase-mock';

const supabaseRef = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: supabaseRef }));

const { PATCH } = await import('./route');

let mock: ReturnType<typeof createSupabaseMock>;

beforeEach(() => {
  mock = createSupabaseMock();
  supabaseRef.from.mockImplementation(mock.supabase.from);
});

const TICKET_ID = '22222222-2222-2222-2222-222222222222';

function params() {
  return { params: Promise.resolve({ id: TICKET_ID }) };
}

function statusRequest(body: unknown) {
  return new Request(`http://localhost/api/tickets/${TICKET_ID}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function ticketRow(status: string) {
  return {
    id: TICKET_ID,
    key: 'PRJ-1',
    project_id: '11111111-1111-1111-1111-111111111111',
    title: 'Ticket de prueba',
    description: null,
    status,
    priority: 'medium',
    creator_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    due_date: null,
    archived_at: null,
  };
}

describe('PATCH /tickets/:id/status', () => {
  it('Historia 9: avanza un ticket de "todo" a "in-progress"', async () => {
    // Given un ticket en "todo"
    mock.queue('tickets', { data: ticketRow('todo'), error: null }); // fetch
    mock.queue('tickets', { data: ticketRow('in-progress'), error: null }); // update
    mock.queue('ticket_assignees', { data: [], error: null });
    mock.queue('ticket_tags', { data: [], error: null });

    // When cambio su estado a "in-progress" (el siguiente paso válido)
    const res = await PATCH(statusRequest({ status: 'in-progress' }), params());
    const body = await res.json();

    // Then el ticket queda en "in-progress"
    expect(res.status).toBe(200);
    expect(body.error).toBeNull();
    expect(body.data.status).toBe('in-progress');
  });

  it('Historia 9 (edge case): un status fuera del enum es rechazado con 400 validation-error', async () => {
    // Given un body con un status que no pertenece al enum de Status
    // When se envía PATCH /tickets/:id/status con status: "archived"
    const res = await PATCH(statusRequest({ status: 'archived' }), params());
    const body = await res.json();

    // Then el sistema rechaza el status inválido (400 validation-error)
    expect(res.status).toBe(400);
    expect(body.type).toBe('https://miniJira.dev/errors/validation-error');
    expect(mock.supabase.from).not.toHaveBeenCalled();
  });

  it('Historia 9 (edge case crítico): un salto de columnas hacia adelante es rechazado', async () => {
    // Given un ticket en "todo"
    mock.queue('tickets', { data: ticketRow('todo'), error: null });

    // When intento cambiar su estado directamente a "done" (saltándose in-progress y review)
    const res = await PATCH(statusRequest({ status: 'done' }), params());
    const body = await res.json();

    // Then el sistema rechaza la transición (409 forbidden-transition)
    expect(res.status).toBe(409);
    expect(body.type).toBe('https://miniJira.dev/errors/forbidden-transition');
  });
});
