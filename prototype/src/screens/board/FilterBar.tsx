import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { Modal } from "../../components/Modal";
import { PRIORITY_LABEL, type Project, type User } from "../../data/mock";
import { shortDate, type Filters } from "./filters";
import { ChecklistSection, DateSection, PrioritySection, ProjectSection, toggle } from "./FilterSections";

/** Enfoca el primer control de filtro visible (desktop: "Fecha"; móvil: "Filtros"). */
export function focusFirstFilterTrigger() {
  Array.from(document.querySelectorAll<HTMLElement>("[data-filter-trigger]")).find((el) => el.offsetParent !== null)?.focus();
}

interface Props {
  filters: Filters; onChange: (f: Filters) => void; projectId: string; originId: string; onProject: (id: string) => void;
  projects: Project[]; users: User[]; tags: string[]; matchCount: number; onClear: () => void;
}

export function FilterBar({ filters, onChange, projectId, originId, onProject, projects, users, tags, matchCount, onClear }: Props) {
  const [sheet, setSheet] = useState(false);
  const chipsRef = useRef<HTMLUListElement>(null);
  const sheetTitle = useId();
  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? id;
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  const chips: { key: string; label: string; remove: () => void }[] = [];
  if (filters.from || filters.to) {
    const range = filters.from && filters.to ? `${shortDate(filters.from)} – ${shortDate(filters.to)}`
      : filters.from ? `desde ${shortDate(filters.from)}` : `hasta ${shortDate(filters.to)}`;
    chips.push({ key: "date", label: `Fecha: ${range}`, remove: () => set({ from: "", to: "" }) });
  }
  filters.priorities.forEach((p) => chips.push({ key: `p-${p}`, label: `Prioridad: ${PRIORITY_LABEL[p]}`, remove: () => set({ priorities: toggle(filters.priorities, p) }) }));
  filters.assignees.forEach((a) => chips.push({ key: `a-${a}`, label: `Responsable: ${userName(a)}`, remove: () => set({ assignees: toggle(filters.assignees, a) }) }));
  filters.tags.forEach((t) => chips.push({ key: `t-${t}`, label: `Etiqueta: ${t}`, remove: () => set({ tags: toggle(filters.tags, t) }) }));
  if (projectId !== originId) {
    chips.push({ key: "project", label: `Proyecto: ${projects.find((p) => p.id === projectId)?.name ?? ""}`, remove: () => onProject(originId) });
  }

  const removeChip = (i: number, remove: () => void) => {
    remove();
    requestAnimationFrame(() => {
      const btns = chipsRef.current?.querySelectorAll<HTMLElement>("button[data-chip]");
      const next = btns?.[i] ?? btns?.[i - 1];
      if (next) next.focus(); else focusFirstFilterTrigger();
    });
  };
  const clear = (focus: boolean) => { onClear(); if (focus) requestAnimationFrame(focusFirstFilterTrigger); };

  const sections = (isSheet: boolean) => ({
    date: <DateSection sheet={isSheet} filters={filters} onChange={set} />,
    priority: <PrioritySection sheet={isSheet} filters={filters} onChange={set} />,
    assignee: <ChecklistSection sheet={isSheet} legendText="Responsable" searchLabel="Buscar persona" emptyText="Ninguna persona coincide."
      items={users.map((u) => ({ id: u.id, label: u.name, sub: u.email }))} selected={filters.assignees}
      onToggle={(id) => set({ assignees: toggle(filters.assignees, id) })} />,
    project: <ProjectSection sheet={isSheet} projects={projects} value={projectId} onChange={onProject} />,
    tags: <ChecklistSection sheet={isSheet} legendText="Etiquetas" searchLabel="Buscar etiqueta" emptyText="Ninguna etiqueta coincide."
      items={tags.map((t) => ({ id: t, label: t }))} selected={filters.tags}
      onToggle={(id) => set({ tags: toggle(filters.tags, id) })} />,
  });
  const desk = sections(false);
  const count = (n: number) => (n > 0 ? n : undefined);

  return (
    <div className="sticky top-14 z-30 -mx-4 border-b border-subtle bg-canvas px-4 py-3 md:-mx-6 md:px-6">
      <div role="group" aria-label="Filtros del tablero" className="hidden flex-wrap items-center gap-2 md:flex">
        <Dropdown label="Fecha" count={count(filters.from || filters.to ? 1 : 0)}>{desk.date}</Dropdown>
        <Dropdown label="Prioridad" count={count(filters.priorities.length)}>{desk.priority}</Dropdown>
        <Dropdown label="Responsable" count={count(filters.assignees.length)}>{desk.assignee}</Dropdown>
        <Dropdown label="Proyecto" count={count(projectId !== originId ? 1 : 0)} align="right">{desk.project}</Dropdown>
        <Dropdown label="Etiquetas" count={count(filters.tags.length)} align="right">{desk.tags}</Dropdown>
      </div>
      <div className="md:hidden">
        <Button variant="secondary" fullWidth={false} data-filter-trigger onClick={() => setSheet(true)} aria-haspopup="dialog">
          <Icon name="filter" /> Filtros{chips.length > 0 && <span className="rounded-full bg-action px-2 text-caption text-on-accent">{chips.length}<span className="sr-only"> activos</span></span>}
        </Button>
      </div>

      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ul ref={chipsRef} aria-label="Filtros activos" className="contents">
            {chips.map((c, i) => (
              <li key={c.key} className="inline-flex items-center gap-1 rounded-full border border-subtle bg-surface py-0.5 pl-3 pr-1 text-body-sm">
                {c.label}
                <button type="button" data-chip aria-label={`Quitar filtro ${c.label}`} onClick={() => removeChip(i, c.remove)}
                  className="grid h-6 w-6 place-items-center rounded-full text-fg-2 hover:bg-canvas hover:text-fg"><Icon name="close" size={16} /></button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => clear(true)} className="rounded-sm px-2 py-1 text-body-sm font-medium text-anchor underline underline-offset-2 hover:no-underline">
            Limpiar filtros
          </button>
        </div>
      )}

      {sheet && (
        <Modal sheet titleId={sheetTitle} onClose={() => setSheet(false)}>
          <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
            <h2 id={sheetTitle} className="text-title font-semibold">Filtros</h2>
            <button type="button" aria-label="Cerrar filtros" onClick={() => setSheet(false)}
              className="grid h-9 w-9 place-items-center rounded-sm text-fg-2 hover:bg-canvas"><Icon name="close" /></button>
          </div>
          <div className="flex flex-col gap-5 px-4 py-4">
            {(() => { const m = sections(true); return <>{m.date}{m.priority}{m.assignee}{m.project}{m.tags}</>; })()}
          </div>
          <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-subtle bg-surface px-4 py-3 sm:flex-row sm:justify-end">
            {chips.length > 0 && <Button variant="secondary" fullWidth={false} onClick={() => clear(false)}>Limpiar filtros</Button>}
            <Button fullWidth={false} onClick={() => setSheet(false)}>Ver {matchCount} {matchCount === 1 ? "ticket" : "tickets"}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/** Disclosure: botón con aria-expanded + panel siguiente en el DOM; Esc cierra y devuelve el foco. */
function Dropdown({ label, count, align = "left", children }: { label: string; count?: number; align?: "left" | "right"; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (open && e.key === "Escape") { e.stopPropagation(); setOpen(false); btn.current?.focus(); }
  };

  return (
    <div ref={wrap} className="relative" onKeyDown={onKeyDown}
      onBlur={(e) => { const n = e.relatedTarget as Node | null; if (n && !wrap.current?.contains(n)) setOpen(false); }}>
      <button ref={btn} type="button" data-filter-trigger aria-expanded={open} aria-controls={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-10 items-center gap-1.5 rounded-sm border bg-surface px-3 text-body font-medium ${count ? "border-[var(--color-accent-action)]" : "border-input"}`}>
        {label}
        {count && <span className="rounded-full bg-action px-1.5 text-caption text-on-accent">{count}<span className="sr-only"> seleccionados</span></span>}
        <Icon name="chevronDown" size={16} />
      </button>
      {open && (
        <div id={id} role="group" aria-label={label}
          className={`absolute top-full z-10 mt-1 w-72 rounded-md border border-subtle bg-raised p-3 shadow-[var(--shadow-3)] ${align === "right" ? "right-0" : "left-0"}`}>
          {children}
        </div>
      )}
    </div>
  );
}
