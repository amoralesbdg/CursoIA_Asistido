import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { Icon } from "../../components/Icon";
import type { Status } from "../../data/mock";

export interface MoveTarget { id: Status; label: string; dir: "back" | "forward" }

interface Props { buttonId: string; label: string; targets: MoveTarget[]; onSelect: (id: Status) => void }

/** Alternativa por teclado al drag-and-drop (2.1.1): menú "Mover a…" con flechas, Esc y retorno de foco. */
export function MoveMenu({ buttonId, label, targets, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const items = () => Array.from(wrap.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  useEffect(() => { if (open) items()[0]?.focus(); }, [open]);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open) return;
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLElement);
    const go = (k: number) => { e.preventDefault(); list[(k + list.length) % list.length]?.focus(); };
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setOpen(false); btn.current?.focus(); }
    else if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
  };
  const onBlur = (e: FocusEvent) => {
    const next = e.relatedTarget as Node | null;
    if (next && !wrap.current?.contains(next)) setOpen(false);
  };

  return (
    <div ref={wrap} className="relative" onKeyDown={onKeyDown} onBlur={onBlur}>
      <button ref={btn} id={buttonId} type="button" aria-haspopup="menu" aria-expanded={open}
        aria-label={label} title="Mover a…" onClick={() => setOpen((o) => !o)}
        className="grid h-8 w-8 place-items-center rounded-sm text-fg-2 hover:bg-canvas hover:text-fg">
        <Icon name="more" />
      </button>
      {open && (
        <div role="menu" aria-label="Mover a"
          className="absolute right-0 top-full z-20 mt-1 min-w-48 rounded-md border border-subtle bg-raised p-1 shadow-[var(--shadow-3)]">
          {targets.map((t) => (
            <button key={t.id} type="button" role="menuitem" tabIndex={-1}
              onClick={() => { setOpen(false); onSelect(t.id); }}
              className="flex h-10 w-full items-center gap-2 rounded-sm px-3 text-left text-body text-fg hover:bg-canvas focus-visible:bg-canvas">
              <Icon name={t.dir === "back" ? "arrowLeft" : "arrowRight"} size={16} />
              Mover a {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
