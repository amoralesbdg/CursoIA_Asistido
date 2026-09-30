import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  fullWidth?: boolean;
  loading?: boolean;
  loadingLabel?: string;
}

const VARIANTS = {
  primary: "bg-action text-on-accent hover:bg-action-hover",
  secondary: "border border-input bg-surface text-fg hover:bg-canvas",
  danger: "border border-critical-fg bg-surface text-critical-fg hover:bg-canvas",
};

/** `loading` mantiene el foco en el botón y bloquea reenvíos. */
export function Button({
  variant = "primary", fullWidth = true, loading, loadingLabel, children, disabled, className = "", ...rest
}: Props) {
  return (
    <button {...rest} aria-disabled={loading || disabled || undefined} disabled={disabled && !loading}
      onClick={loading ? (e) => e.preventDefault() : rest.onClick}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-sm px-4 text-body font-semibold
        transition-colors duration-[var(--duration-fast)] disabled:cursor-not-allowed disabled:opacity-60
        ${fullWidth ? "w-full" : ""} ${VARIANTS[variant]} ${className}`}>
      {loading && (
        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
          <path d="M12 3a9 9 0 1 0 9 9" />
        </svg>
      )}
      {loading ? loadingLabel ?? children : children}
    </button>
  );
}
