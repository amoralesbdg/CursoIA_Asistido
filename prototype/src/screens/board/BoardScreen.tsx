import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { Toast } from "../../components/Toast";
import { PEOPLE, STATUSES, visibleProjects, type Comment, type Project, type Role, type Status, type Ticket, type User } from "../../data/mock";
import { FilterBar, focusFirstFilterTrigger } from "./FilterBar";
import { applyFilters, EMPTY_FILTERS, hasFilters, type Filters } from "./filters";
import type { MoveTarget } from "./MoveMenu";
import { NO_PERMISSION, TicketCard, TicketCardSkeleton } from "./TicketCard";
import { TicketPanel } from "./TicketPanel";

interface Props {
  originId: string; projects: Project[]; tickets: Ticket[]; currentUser: User; role: Role;
  onRoleChange: (r: Role) => void; onMove: (id: string, to: Status) => void; onBack: () => void;
  onUpsert: (t: Ticket) => void; onArchive: (id: string, archived: boolean) => void;
  comments: Comment[]; onComment: (ticketId: string, body: string) => void;
}

const idx = (s: Status) => STATUSES.findIndex((x) => x.id === s);
const label = (s: Status) => STATUSES[idx(s)].label;

export function BoardScreen({ originId, projects, tickets, currentUser, role, onRoleChange, onMove, onBack, onUpsert, onArchive, comments, onComment }: Props) {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<Status | null>(null);
  const [panel, setPanel] = useState<{ ticketId?: string } | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [forceSaveError, setForceSaveError] = useState(false);
  const [forceCommentError, setForceCommentError] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const h1 = useRef<HTMLHeadingElement>(null);
  const refocus = useRef<string | null>(null);
  const loadTimer = useRef<number>(undefined);

  const [projectId, setProjectId] = useState(originId);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const userList = useMemo(() => [currentUser, ...PEOPLE], [currentUser]);
  const users = useMemo(() => new Map(userList.map((u) => [u.id, u])), [userList]);
  const project = projects.find((p) => p.id === projectId) ?? projects.find((p) => p.id === originId)!;
  const options = useMemo(() => {
    const v = visibleProjects(projects, currentUser.id, role);
    return v.some((p) => p.id === project.id) ? v : [project, ...v];
  }, [projects, currentUser.id, role, project]);
  const allTags = useMemo(() => {
    const ids = new Set(options.map((p) => p.id));
    return [...new Set(tickets.filter((t) => ids.has(t.projectId)).flatMap((t) => t.tags))].sort((a, b) => a.localeCompare(b, "es"));
  }, [tickets, options]);

  const inProject = tickets.filter((t) => t.projectId === project.id && (showArchived || !t.archived));
  const mine = applyFilters(inProject, filters);
  const filtered = hasFilters(filters);
  const noResults = !loading && filtered && mine.length === 0;
  const clearFilters = () => { setFilters(EMPTY_FILTERS); setProjectId(originId); };
  const dragged = mine.find((t) => t.id === dragId);
  const hasAccess = (t: Ticket) => role === "admin" || t.creatorId === currentUser.id || t.assigneeIds.includes(currentUser.id);
  const lockReason = (t: Ticket) => (t.archived ? "Ticket archivado: restáuralo para moverlo" : hasAccess(t) ? undefined : NO_PERMISSION);
  const isAdjacent = (a: Status, b: Status) => Math.abs(idx(a) - idx(b)) === 1;

  useEffect(() => { h1.current?.focus(); }, []);
  useEffect(() => {
    loadTimer.current = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(loadTimer.current);
  }, []);
  // Al mover por menú la tarjeta cambia de columna y se remonta: devolvemos el foco a su botón.
  useEffect(() => {
    if (refocus.current) { document.getElementById(`move-${refocus.current}`)?.focus(); refocus.current = null; }
  }, [tickets]);

  const tryMove = (id: string, to: Status, viaMenu = false) => {
    const t = mine.find((x) => x.id === id);
    if (!t || t.status === to) return;
    const locked = lockReason(t);
    if (locked) { setToast(locked); return; }
    if (!isAdjacent(t.status, to)) { setToast("No se puede saltar columnas"); return; } // RF-13
    if (viaMenu) refocus.current = id;
    onMove(id, to);
    setAnnounce(`Ticket ${t.key} movido a ${label(to)}`);
  };

  const onDragStart = (t: Ticket) => (e: DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", t.id);
    setDragId(t.id);
  };
  const endDrag = () => { setDragId(null); setOver(null); };

  const openPanel = (ticketId?: string) => { trigger.current = document.activeElement as HTMLElement; setPanel({ ticketId }); };
  const closePanel = () => {
    setPanel(null);
    requestAnimationFrame(() => { const t = trigger.current; (t && t.isConnected ? t : h1.current)?.focus(); });
  };
  const panelTicket = panel?.ticketId ? tickets.find((t) => t.id === panel.ticketId) : undefined;

  return (
    <>
      <button type="button" onClick={onBack}
        className="mb-3 inline-flex h-9 items-center gap-1 rounded-sm pr-2 text-body text-anchor hover:underline">
        <Icon name="arrowLeft" size={16} /> Proyectos
      </button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 ref={h1} tabIndex={-1} className="break-words text-headline font-semibold outline-none">{project.name}</h1>
        <Button fullWidth={false} onClick={() => openPanel()}><Icon name="plus" /> Nuevo ticket</Button>
      </div>
      <p className="mt-1 text-body-sm text-fg-2">
        Arrastra una tarjeta a la columna contigua o usa el menú «Mover a…» de cada ticket.
      </p>
      <label className="mt-2 flex min-h-8 w-fit cursor-pointer items-center gap-2 text-body-sm">
        <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)}
          className="h-4 w-4 accent-[var(--color-accent-action)]" />
        Mostrar tickets archivados
      </label>
      <p role="status" className="sr-only">{loading ? "Cargando tablero…" : announce}</p>
      <p role="status" className="sr-only">
        {!loading && (filtered || projectId !== originId) ? `${project.name}: ${mine.length} de ${inProject.length} tickets coinciden` : ""}
      </p>

      <FilterBar filters={filters} onChange={setFilters} projectId={project.id} originId={originId} onProject={setProjectId}
        projects={options} users={userList} tags={allTags} matchCount={mine.length} onClear={clearFilters} />

      {noResults ? (
        <div className="mx-auto mt-8 max-w-md rounded-lg border border-dashed border-input bg-surface p-10 text-center">
          <p className="text-title-sm font-semibold">Ningún ticket coincide con los filtros</p>
          <p className="mt-1 text-body text-fg-2">Quita algún filtro o límpialos para ver todos los tickets.</p>
          <Button fullWidth={false} className="mt-4" onClick={() => { clearFilters(); requestAnimationFrame(focusFirstFilterTrigger); }}>Limpiar filtros</Button>
        </div>
      ) : (
      <div role="region" aria-label="Tablero Kanban, se desplaza horizontalmente" tabIndex={0}
        /* relative: contiene los .sr-only (position:absolute) para que no escapen del overflow y ensanchen la página */
        aria-busy={loading} className="relative -mx-4 mt-6 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6">
        <div className="grid grid-cols-[repeat(4,minmax(280px,1fr))] gap-4">
          {STATUSES.map((col) => {
            const items = mine.filter((t) => t.status === col.id);
            const valid = !!dragged && !lockReason(dragged) && isAdjacent(dragged.status, col.id);
            const n = items.length;
            return (
              <div key={col.id} role="group" aria-label={`Columna: ${col.label}, ${n} ${n === 1 ? "ticket" : "tickets"}`}
                onDragOver={(e) => { if (!dragged) return; e.preventDefault(); e.dataTransfer.dropEffect = "move"; setOver(col.id); }}
                onDrop={(e) => { e.preventDefault(); if (dragId) tryMove(dragId, col.id); endDrag(); }}
                className={`flex min-h-48 flex-col rounded-lg border-2 bg-subtle/40 p-4 transition-colors duration-[var(--duration-fast)] ${
                  valid && over === col.id ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]"
                  : valid ? "border-[var(--color-accent)]" : "border-transparent"}`}>
                <div className="mb-3 flex items-center gap-2">
                  <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: `var(--status-${col.id})` }} />
                  <h2 className="text-body font-semibold">{col.label}</h2>
                  <span className="ml-auto rounded-full border border-subtle bg-surface px-2 text-caption text-fg-2">
                    <span className="sr-only">Tickets: </span>{loading ? "–" : n}
                  </span>
                </div>
                {loading ? (
                  <div className="flex flex-col gap-3">{Array.from({ length: col.id === "todo" ? 3 : 2 }, (_, i) => <TicketCardSkeleton key={i} />)}</div>
                ) : n === 0 ? (
                  <p className="grid flex-1 place-items-center py-6 text-body-sm text-fg-2">Sin tickets</p>
                ) : (
                  <ul role="list" className="flex flex-col gap-3">
                    {items.map((t) => {
                      const targets: MoveTarget[] = STATUSES.filter((s) => isAdjacent(t.status, s.id))
                        .map((s) => ({ id: s.id, label: s.label, dir: idx(s.id) < idx(t.status) ? "back" : "forward" }));
                      return (
                        <li key={t.id}>
                          <TicketCard ticket={t} users={users} lockReason={lockReason(t)} onOpen={() => openPanel(t.id)} targets={targets}
                            dragging={dragId === t.id} onDragStart={onDragStart(t)} onDragEnd={endDrag}
                            onMove={(to) => tryMove(t.id, to, true)} />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      <section aria-labelledby="demo-h" className="mt-8 rounded-md border border-dashed border-input p-4">
        <h2 id="demo-h" className="text-body-sm font-semibold">Panel de prototipo <span className="font-normal text-fg-2">(no forma parte del producto)</span></h2>
        <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3">
          <label className="flex flex-col gap-1 text-body-sm font-medium">Rol
            <select value={role} onChange={(e) => onRoleChange(e.target.value as Role)}
              className="h-10 rounded-sm border border-input bg-surface px-2 text-body font-normal">
              <option value="user">Usuario normal</option><option value="admin">Admin</option>
            </select>
          </label>
          <Button variant="secondary" fullWidth={false} onClick={() => {
            setLoading(true); window.clearTimeout(loadTimer.current);
            loadTimer.current = window.setTimeout(() => setLoading(false), 1500);
          }}>Simular carga</Button>
          <label className="flex min-h-10 items-center gap-2 text-body-sm font-medium">
            <input type="checkbox" checked={forceSaveError} onChange={(e) => setForceSaveError(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent-action)]" />
            Forzar error al guardar
          </label>
          <label className="flex min-h-10 items-center gap-2 text-body-sm font-medium">
            <input type="checkbox" checked={forceCommentError} onChange={(e) => setForceCommentError(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent-action)]" />
            Forzar error al comentar
          </label>
        </div>
      </section>
      {panel && (panel.ticketId ? !!panelTicket : true) && (
        <TicketPanel ticket={panelTicket} defaultProjectId={project.id} nextKey={`MJ-${tickets.length + 1}`}
          projects={options} users={userList} currentUser={currentUser} role={role} forceError={forceSaveError}
          forceCommentError={forceCommentError} comments={comments.filter((c) => c.ticketId === panel.ticketId)} onComment={onComment}
          onClose={closePanel}
          onSave={(t, isNew) => { onUpsert(t); setToast(isNew ? "Ticket creado" : "Ticket guardado"); closePanel(); }}
          onArchive={(id, archived) => { onArchive(id, archived); setToast(archived ? "Ticket archivado. Actívalo con «Mostrar tickets archivados» para restaurarlo" : "Ticket restaurado"); closePanel(); }}
          onSelfAssign={(id) => { const t = tickets.find((x) => x.id === id); if (t) { onUpsert({ ...t, assigneeIds: [...t.assigneeIds, currentUser.id] }); setToast("Te asignaste el ticket"); } }} />
      )}
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
