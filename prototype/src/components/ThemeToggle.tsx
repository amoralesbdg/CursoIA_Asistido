import { useRef, type KeyboardEvent, type ReactNode } from "react";
import type { ThemePref } from "../theme/useTheme";

const icon = (d: ReactNode) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

const OPTIONS: { value: ThemePref; label: string; icon: ReactNode }[] = [
  { value: "light", label: "Claro", icon: icon(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>) },
  { value: "system", label: "Sistema", icon: icon(<><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>) },
  { value: "dark", label: "Oscuro", icon: icon(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />) },
];

interface Props { value: ThemePref; onChange: (v: ThemePref) => void }

/** Radiogroup de 3 posiciones con navegación por flechas (roving tabindex). */
export function ThemeToggle({ value, onChange }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const n = OPTIONS.length;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % n;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + n) % n;
    if (next < 0) return;
    e.preventDefault();
    onChange(OPTIONS[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label="Tema de la interfaz"
      className="inline-flex gap-1 rounded-full border border-subtle bg-surface p-1 shadow-[var(--shadow-1)]">
      {OPTIONS.map((o, i) => {
        const checked = o.value === value;
        return (
          <button key={o.value} ref={(el) => { refs.current[i] = el; }} type="button"
            role="radio" aria-checked={checked} aria-label={o.label} title={o.label}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(o.value)} onKeyDown={(e) => onKeyDown(e, i)}
            className={`grid h-7 w-7 place-items-center rounded-full sm:h-8 sm:w-8 transition-colors duration-[var(--duration-fast)] ${
              checked ? "bg-action text-on-accent" : "text-fg-2 hover:bg-canvas hover:text-fg"}`}>
            {o.icon}
          </button>
        );
      })}
    </div>
  );
}
