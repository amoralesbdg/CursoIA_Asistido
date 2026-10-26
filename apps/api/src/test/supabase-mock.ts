import { vi } from 'vitest';

export type SupabaseResponse = { data: unknown; error: unknown; count?: number };

const CHAIN_METHODS = [
  'select',
  'insert',
  'update',
  'delete',
  'eq',
  'in',
  'is',
  'order',
  'range',
] as const;

/**
 * Doble de prueba del query builder encadenable de Supabase.
 *
 * `supabase.from(table)` siempre devuelve el mismo builder encadenable; cada
 * método de la cadena (`select`, `eq`, `in`, `is`, `order`, `range`, ...)
 * devuelve `this`. La resolución ocurre en `.then()` (para `await
 * supabase.from(...).select(...)`) o en `.single()` / `.maybeSingle()`
 * (terminales), consumiendo la siguiente respuesta encolada para esa tabla
 * con `queue(table, response)`. Las respuestas se consumen en FIFO por
 * tabla, en el mismo orden en que el código bajo prueba las encadena.
 */
export function createSupabaseMock() {
  const queues = new Map<string, SupabaseResponse[]>();

  function queue(table: string, response: SupabaseResponse) {
    const existing = queues.get(table) ?? [];
    existing.push(response);
    queues.set(table, existing);
  }

  function resolveFor(table: string): Promise<SupabaseResponse> {
    const pending = queues.get(table);
    if (!pending || pending.length === 0) {
      throw new Error(
        `createSupabaseMock: no hay respuesta encolada para la tabla "${table}". ` +
          `Usa queue("${table}", { data, error }) antes de ejecutar el endpoint.`,
      );
    }
    const response = pending.shift()!;
    return Promise.resolve(response);
  }

  function from(table: string) {
    const builder: Record<string, unknown> = {};

    for (const method of CHAIN_METHODS) {
      builder[method] = vi.fn(() => builder);
    }

    builder.maybeSingle = vi.fn(() => resolveFor(table));
    builder.single = vi.fn(() => resolveFor(table));
    builder.then = (
      onFulfilled?: (value: SupabaseResponse) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => resolveFor(table).then(onFulfilled, onRejected);

    return builder;
  }

  const supabase = { from: vi.fn(from) };

  function reset() {
    queues.clear();
    supabase.from.mockClear();
  }

  return { supabase, queue, reset };
}
