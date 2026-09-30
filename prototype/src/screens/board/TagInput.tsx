import { useId, useRef, useState } from "react";
import { Icon } from "../../components/Icon";

interface Props { tags: string[]; onChange: (t: string[]) => void }

/** Etiquetas de texto libre (RF-11): se añaden con Enter o coma; también al salir del campo. */
export function TagInput({ tags, onChange }: Props) {
  const id = useId();
  const [v, setV] = useState("");
  const [msg, setMsg] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const commit = (raw: string) => {
    let next = tags;
    const added: string[] = [];
    raw.split(",").map((x) => x.trim()).filter(Boolean).forEach((t) => {
      if (!next.some((x) => x.toLowerCase() === t.toLowerCase())) { next = [...next, t]; added.push(t); }
    });
    if (added.length) { onChange(next); setMsg(`Etiqueta añadida: ${added.join(", ")}`); }
    setV("");
  };
  const remove = (t: string, i: number) => {
    onChange(tags.filter((x) => x !== t));
    setMsg(`Etiqueta quitada: ${t}`);
    requestAnimationFrame(() => {
      const b = list.current?.querySelectorAll<HTMLElement>("button");
      (b?.[i] ?? b?.[i - 1] ?? input.current)?.focus();
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-body-sm font-medium">Etiquetas</label>
      {tags.length > 0 && (
        <ul ref={list} aria-label="Etiquetas del ticket" className="flex flex-wrap gap-2">
          {tags.map((t, i) => (
            <li key={t} className="inline-flex items-center gap-1 rounded-sm bg-canvas py-0.5 pl-2 pr-0.5 text-body-sm">
              {t}
              <button type="button" aria-label={`Quitar etiqueta ${t}`} onClick={() => remove(t, i)}
                className="grid h-6 w-6 place-items-center rounded-sm text-fg-2 hover:bg-surface hover:text-fg"><Icon name="close" size={16} /></button>
            </li>
          ))}
        </ul>
      )}
      <input ref={input} id={id} value={v} autoComplete="off" aria-describedby={`${id}-hint`}
        onChange={(e) => (e.target.value.includes(",") ? commit(e.target.value) : setV(e.target.value))}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(v); } }}
        onBlur={() => v.trim() && commit(v)}
        className="h-11 w-full rounded-sm border border-input bg-surface px-3 text-body text-fg placeholder:text-fg-2" />
      <p id={`${id}-hint`} className="text-caption text-fg-2">Escribe y pulsa Enter o coma para añadir.</p>
      <p role="status" className="sr-only">{msg}</p>
    </div>
  );
}
