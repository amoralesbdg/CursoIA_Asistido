import { useEffect, useRef, type ReactNode } from "react";

interface Props { titleId: string; onClose: () => void; busy?: boolean; sheet?: boolean; panel?: boolean; children: ReactNode }

/**
 * <dialog> nativo: focus trap, Esc y `inert` del fondo incluidos (2.1.2).
 * El foco inicial va al elemento con [data-autofocus]; devolver el foco al
 * disparador es responsabilidad de quien lo monta.
 */
export function Modal({ titleId, onClose, busy, sheet, panel, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) d.showModal();
    d.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, []);

  return (
    <dialog ref={ref} aria-labelledby={titleId} data-panel={panel ? "" : undefined}
      onCancel={(e) => { if (busy) e.preventDefault(); }}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current && !busy) ref.current?.close(); }}
      className={`overflow-auto border border-subtle bg-surface p-0 text-fg shadow-[var(--shadow-4)] backdrop:bg-black/40 ${
        panel ? "m-0 ml-auto h-dvh max-h-none w-full max-w-none rounded-none md:w-[480px] md:rounded-l-lg"
          : sheet ? "mx-0 mb-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-lg"
          : "m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[480px] rounded-lg"}`}>
      {children}
    </dialog>
  );
}
