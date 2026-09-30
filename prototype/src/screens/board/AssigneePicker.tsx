import { useRef, useState } from "react";
import { Avatar } from "../../components/Avatar";
import { Icon } from "../../components/Icon";
import { TextInput } from "../../components/TextInput";
import type { User } from "../../data/mock";

interface Props { users: User[]; selected: string[]; onChange: (ids: string[]) => void }

/** Combobox simplificado (RF-10): chips removibles + búsqueda con lista de candidatos. Cualquiera puede asignar a cualquiera. */
export function AssigneePicker({ users, selected, onChange }: Props) {
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const chips = useRef<HTMLUListElement>(null);
  const chosen = selected.map((id) => users.find((u) => u.id === id)).filter((u): u is User => !!u);
  const term = q.trim().toLowerCase();
  const candidates = users.filter((u) => !selected.includes(u.id) && `${u.name} ${u.email}`.toLowerCase().includes(term));

  const add = (id: string) => { onChange([...selected, id]); setQ(""); requestAnimationFrame(() => input.current?.focus()); };
  const remove = (id: string, i: number) => {
    onChange(selected.filter((x) => x !== id));
    requestAnimationFrame(() => {
      const b = chips.current?.querySelectorAll<HTMLElement>("button");
      (b?.[i] ?? b?.[i - 1] ?? input.current)?.focus();
    });
  };

  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="mb-2 text-body-sm font-medium">Responsables</legend>
      {chosen.length === 0 ? <p className="mb-2 text-body-sm text-fg-2">Sin responsables asignados.</p> : (
        <ul ref={chips} aria-label="Responsables seleccionados" className="mb-2 flex flex-wrap gap-2">
          {chosen.map((u, i) => (
            <li key={u.id} className="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-canvas py-0.5 pl-1 pr-1 text-body-sm">
              <Avatar user={u} size={20} />{u.name}
              <button type="button" aria-label={`Quitar a ${u.name}`} onClick={() => remove(u.id, i)}
                className="grid h-6 w-6 place-items-center rounded-full text-fg-2 hover:bg-surface hover:text-fg"><Icon name="close" size={16} /></button>
            </li>
          ))}
        </ul>
      )}
      <TextInput ref={input} type="search" label="Añadir responsable" value={q} autoComplete="off" onChange={(e) => setQ(e.target.value)} />
      <ul className="mt-1 max-h-40 overflow-auto rounded-sm border border-subtle">
        {candidates.map((u) => (
          <li key={u.id} className="border-b border-subtle last:border-b-0">
            <button type="button" onClick={() => add(u.id)} aria-label={`Añadir a ${u.name}`}
              className="flex min-h-11 w-full items-center gap-3 px-3 py-1 text-left hover:bg-canvas">
              <Avatar user={u} />
              <span className="min-w-0"><span className="block truncate text-body">{u.name}</span>
                <span className="block truncate text-caption text-fg-2">{u.email}</span></span>
            </button>
          </li>
        ))}
      </ul>
      {candidates.length === 0 && <p role="status" className="px-1 py-2 text-body-sm text-fg-2">{term ? `Ninguna persona coincide con “${q}”.` : "Todas las personas ya están asignadas."}</p>}
    </fieldset>
  );
}
