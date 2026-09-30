import type { Priority, Ticket } from "../../data/mock";

export interface Filters {
  from: string; to: string; priorities: Priority[]; assignees: string[]; tags: string[];
}
export const EMPTY_FILTERS: Filters = { from: "", to: "", priorities: [], assignees: [], tags: [] };

export const hasFilters = (f: Filters) =>
  !!(f.from || f.to || f.priorities.length || f.assignees.length || f.tags.length);

/**
 * Todo se combina con AND: entre campos y dentro de responsables y etiquetas (el ticket debe tenerlos todos).
 * Excepción: prioridad, que es de valor único por ticket; con AND dos prioridades nunca coincidirían, así que es OR.
 */
export function applyFilters(tickets: Ticket[], f: Filters): Ticket[] {
  return tickets.filter((t) => {
    if ((f.from || f.to) && !t.dueDate) return false;
    if (f.from && t.dueDate! < f.from) return false;
    if (f.to && t.dueDate! > f.to) return false;
    if (f.priorities.length && !f.priorities.includes(t.priority)) return false;
    if (f.assignees.length && !f.assignees.every((a) => t.assigneeIds.includes(a))) return false;
    if (f.tags.length && !f.tags.every((x) => t.tags.includes(x))) return false;
    return true;
  });
}

export const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es", { day: "numeric", month: "short" });
