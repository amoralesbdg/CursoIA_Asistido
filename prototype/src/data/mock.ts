export interface User { id: string; name: string; email: string }
export interface Project {
  id: string; name: string; creatorId: string; memberIds: string[]; ticketCount: number;
}

/** Datos placeholder — no representan personas reales. */
export const PEOPLE: User[] = [
  { id: "u2", name: "Ana Ruiz", email: "ana.ruiz@example.com" },
  { id: "u3", name: "Luis Pérez", email: "luis.perez@example.com" },
  { id: "u4", name: "Marta Gómez", email: "marta.gomez@example.com" },
  { id: "u5", name: "Carlos Díaz", email: "carlos.diaz@example.com" },
  { id: "u6", name: "Sofía León", email: "sofia.leon@example.com" },
  { id: "u7", name: "Diego Mora", email: "diego.mora@example.com" },
];

export const INITIAL_PROJECTS: Project[] = [
  { id: "p1", name: "Rediseño del sitio", creatorId: "u1", memberIds: ["u1", "u2", "u3", "u4", "u5", "u6"], ticketCount: 12 },
  { id: "p2", name: "App móvil", creatorId: "u2", memberIds: ["u1", "u2"], ticketCount: 8 },
  { id: "p3", name: "Migración de datos", creatorId: "u1", memberIds: ["u1", "u3"], ticketCount: 1 },
  { id: "p4", name: "Campaña de lanzamiento", creatorId: "u3", memberIds: ["u3", "u4"], ticketCount: 5 },
  { id: "p5", name: "Soporte interno", creatorId: "u5", memberIds: ["u5", "u6", "u7"], ticketCount: 0 },
];

export type Role = "user" | "admin";
export type Status = "todo" | "in-progress" | "review" | "done";
export type Priority = "high" | "medium" | "low";

export interface Ticket {
  id: string; key: string; projectId: string; title: string; status: Status; priority: Priority;
  assigneeIds: string[]; creatorId: string; tags: string[]; dueDate?: string; // YYYY-MM-DD
  description?: string; archived?: boolean; // archived = soft-delete (RF-06)
}

/** Orden = orden de las columnas; el movimiento válido es solo entre contiguas (RF-13). */
export const STATUSES: { id: Status; label: string }[] = [
  { id: "todo", label: "Por hacer" },
  { id: "in-progress", label: "En progreso" },
  { id: "review", label: "Review" },
  { id: "done", label: "Terminado" },
];
export const PRIORITY_LABEL: Record<Priority, string> = { high: "Alta", medium: "Media", low: "Baja" };

let n = 0;
const t = (projectId: string, title: string, status: Status, priority: Priority, creatorId: string,
  assigneeIds: string[], tags: string[] = [], dueDate?: string): Ticket =>
  ({ id: `t${++n}`, key: `MJ-${n}`, projectId, title, status, priority, creatorId, assigneeIds, tags, dueDate });

/** u1 = usuario logueado. Hay tickets donde no es creador ni asignado (sin permiso de mover). */
export const INITIAL_TICKETS: Ticket[] = [
  t("p1", "Definir arquitectura de la nueva home", "todo", "high", "u1", ["u2"], ["diseño", "home"], "2026-10-15"),
  t("p1", "Auditar accesibilidad de componentes", "todo", "medium", "u4", ["u1", "u4"], ["a11y"], "2026-10-20"),
  t("p1", "Redactar textos de la sección Precios", "todo", "low", "u1", [], ["contenido"]),
  t("p1", "Crear sistema de iconos", "in-progress", "medium", "u3", ["u3"], ["diseño", "iconos", "ui"], "2026-10-08"),
  t("p1", "Migrar formulario de contacto", "in-progress", "high", "u2", ["u1"], ["frontend"], "2026-09-28"),
  t("p1", "Optimizar imágenes del hero", "in-progress", "low", "u5", ["u5", "u6"], ["rendimiento"]),
  t("p1", "Revisión de copy legal", "review", "medium", "u4", ["u4"], ["legal", "contenido"], "2026-10-05"),
  t("p1", "Prueba de usabilidad con 5 usuarios", "review", "high", "u2", ["u2", "u3", "u6", "u1"], ["ux"], "2026-10-12"),
  t("p1", "Configurar analítica", "done", "low", "u6", ["u6"], ["datos"], "2026-09-20"),
  t("p1", "Elegir tipografías", "done", "medium", "u1", ["u1"], ["diseño"], "2026-09-15"),
  t("p1", "Inventario de páginas actuales", "done", "low", "u3", ["u3"]),
  t("p1", "Definir paleta de color", "done", "high", "u2", ["u2", "u1"], ["diseño", "tokens", "marca"], "2026-09-18"),
  t("p2", "Prototipo de navegación inferior", "todo", "medium", "u2", ["u2"], ["ux"], "2026-10-18"),
  t("p2", "Elegir framework móvil", "todo", "high", "u1", ["u1", "u2"], ["arquitectura"]),
  t("p2", "Pantalla de onboarding", "in-progress", "medium", "u2", ["u2"], ["ui"], "2026-10-10"),
  t("p2", "Integrar notificaciones push", "in-progress", "low", "u2", [], ["backend"]),
  t("p2", "Pruebas en dispositivos Android", "review", "high", "u2", ["u2", "u1"], ["qa"], "2026-10-02"),
  t("p2", "Icono y splash screen", "review", "low", "u2", ["u2"], ["diseño"]),
  t("p2", "Definir alcance del MVP móvil", "done", "high", "u1", ["u1"], ["producto"], "2026-09-10"),
  t("p2", "Configurar repositorio", "done", "low", "u2", ["u2"]),
  t("p3", "Mapear tablas de origen", "in-progress", "medium", "u1", ["u1", "u3"], ["datos"], "2026-10-09"),
  t("p4", "Plan de medios", "todo", "high", "u3", ["u3"], ["marketing"], "2026-10-25"),
  t("p4", "Landing de lanzamiento", "in-progress", "medium", "u4", ["u4"], ["web"]),
  t("p4", "Nota de prensa", "review", "low", "u3", ["u3", "u4"], ["contenido"], "2026-10-06"),
  t("p4", "Lista de medios objetivo", "done", "low", "u4", ["u4"]),
  t("p4", "Calendario editorial", "done", "medium", "u3", ["u3"], ["marketing", "planificación"]),
];

/** RF-09: Admin ve todo; usuario normal, solo los que creó o donde es miembro. */
export const visibleProjects = (projects: Project[], userId: string, role: Role) =>
  role === "admin" ? projects : projects.filter((p) => p.creatorId === userId || p.memberIds.includes(userId));

export interface Comment { id: string; ticketId: string; authorId: string; body: string; createdAt: number }
const ago = (min: number) => Date.now() - min * 60_000;
export const INITIAL_COMMENTS: Comment[] = [
  { id: "c1", ticketId: "t1", authorId: "u2", body: "Propongo partir de tres bloques: hero, beneficios y prueba social.", createdAt: ago(26 * 60) },
  { id: "c2", ticketId: "t1", authorId: "u1", body: "Me parece bien. ¿Lo validamos con diseño antes del viernes?", createdAt: ago(3 * 60) },
  { id: "c3", ticketId: "t5", authorId: "u2", body: "El formulario actual no valida el teléfono.\nHabría que revisar también los mensajes de error.", createdAt: ago(50) },
  { id: "c4", ticketId: "t8", authorId: "u3", body: "Ya tenemos a 3 de las 5 personas confirmadas.", createdAt: ago(3 * 24 * 60) },
  { id: "c5", ticketId: "t8", authorId: "u6", body: "Puedo conseguir las dos restantes para el miércoles.", createdAt: ago(2 * 24 * 60) },
  { id: "c6", ticketId: "t8", authorId: "u1", body: "Perfecto, gracias. Preparo el guion de la sesión.", createdAt: ago(1) },
];
