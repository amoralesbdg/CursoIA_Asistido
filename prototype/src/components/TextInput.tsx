import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  /** Contenido a la derecha dentro del campo (p. ej. toggle de visibilidad). */
  trailing?: ReactNode;
}

/** B.3 — label visible, error en texto (no solo color), aria-describedby. */
export const TextInput = forwardRef<HTMLInputElement, Props>(function TextInput(
  { label, error, hint, trailing, id, className = "", ...rest }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  const errId = `${inputId}-err`;
  const hintId = `${inputId}-hint`;
  const describedBy = [error && errId, hint && hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-body-sm font-medium text-fg">{label}</label>
      <div className="relative">
        <input ref={ref} id={inputId} aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-11 w-full rounded-sm border bg-surface px-3 text-body text-fg placeholder:text-fg-2
            transition-colors duration-[var(--duration-fast)] disabled:cursor-not-allowed disabled:opacity-60
            ${error ? "border-critical-fg" : "border-input"} ${trailing ? "pr-12" : ""} ${className}`}
          {...rest} />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
      {hint && !error && <p id={hintId} className="text-caption text-fg-2">{hint}</p>}
      {error && (
        <p id={errId} className="flex items-center gap-1 text-body-sm text-critical-fg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});
