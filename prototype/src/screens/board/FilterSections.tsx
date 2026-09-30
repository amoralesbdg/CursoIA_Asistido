import { useState } from "react";
import { Icon } from "../../components/Icon";
import { TextInput } from "../../components/TextInput";
import { PRIORITY_LABEL, type Priority, type Project } from "../../data/mock";
import type { Filters } from "./filters";

interface Common { sheet: boolean }
const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
const legend = (sheet: boolean) => (sheet ? "mb-2 text-body font-semibold" : "sr-only");
const row = "flex min-h-10 cursor-pointer items-center gap-3 rounded-sm px-2 hover:bg-canvas";
const box = "h-4 w-4 accent-[var(--color-accent-action)]";

export function DateSection({ filters, onChange, sheet }: Common & { filters: Filters; onChange: (p: Partial<Filters>) => void }) {
  const invalid = !!filters.from && !!filters.to && filters.to < filters.from;
  return (
    <fieldset className="grid min-w-0 gap-3 border-0 p-0">
      <legend className={legend(sheet)}>Fecha límite</legend>
      <TextInput type="date" label="Desde" value={filters.from} onChange={(e) => onChange({ from: e.target.value })} />
      <TextInput type="date" label="Hasta" value={filters.to} onChange={(e) => onChange({ to: e.target.value })}
        error={invalid ? "«Hasta» debe ser igual o posterior a «Desde»; corrige una de las fechas" : undefined} />
    </fieldset>
  );
}

export function PrioritySection({ filters, onChange, sheet }: Common & { filters: Filters; onChange: (p: Partial<Filters>) => void }) {
  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className={legend(sheet)}>Prioridad</legend>
      {(["high", "medium", "low"] as Priority[]).map((p) => (
        <label key={p} className={row}>
          <input type="checkbox" className={box} checked={filters.priorities.includes(p)}
            onChange={() => onChange({ priorities: toggle(filters.priorities, p) })} />
          <span style={{ color: `var(--priority-${p})` }}><Icon name="flag" size={16} /></span>
          <span className="text-body">{PRIORITY_LABEL[p]}</span>
        </label>
      ))}
    </fieldset>
  );
}

interface ListItem { id: string; label: string; sub?: string }

/** Búsqueda + lista de checkboxes nativos (responsables y etiquetas existentes). */
export function ChecklistSection({ legendText, searchLabel, items, selected, onToggle, emptyText, sheet }: Common & {
  legendText: string; searchLabel: string; items: ListItem[]; selected: string[];
  onToggle: (id: string) => void; emptyText: string;
}) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const list = items.filter((i) => `${i.label} ${i.sub ?? ""}`.toLowerCase().includes(term));
  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className={legend(sheet)}>{legendText}</legend>
      <div className="mb-2"><TextInput type="search" label={searchLabel} value={q} autoComplete="off" onChange={(e) => setQ(e.target.value)} /></div>
      <ul className="max-h-48 overflow-auto">
        {list.map((i) => (
          <li key={i.id}>
            <label className={row}>
              <input type="checkbox" className={box} checked={selected.includes(i.id)} onChange={() => onToggle(i.id)} />
              <span className="min-w-0"><span className="block truncate text-body">{i.label}</span>
                {i.sub && <span className="block truncate text-caption text-fg-2">{i.sub}</span>}</span>
            </label>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p role="status" className="px-2 py-2 text-body-sm text-fg-2">{emptyText}</p>}
    </fieldset>
  );
}

export function ProjectSection({ projects, value, onChange, sheet }: Common & { projects: Project[]; value: string; onChange: (id: string) => void }) {
  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className={legend(sheet)}>Proyecto</legend>
      {projects.map((p) => (
        <label key={p.id} className={row}>
          <input type="radio" name="filter-project" className={box} checked={value === p.id} onChange={() => onChange(p.id)} />
          <span className="text-body">{p.name}</span>
        </label>
      ))}
    </fieldset>
  );
}

export { toggle };
