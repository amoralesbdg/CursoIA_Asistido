import { useEffect } from "react";
import { Icon } from "./Icon";

/** Región live persistente; el mensaje se autodescarta a los 6 s y se puede cerrar. */
export function Toast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  return (
    <div role="status" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center">
      {message && (
        <div className="pointer-events-auto flex items-center gap-3 rounded-md border border-subtle bg-raised py-2 pl-4 pr-2 text-body text-fg shadow-[var(--shadow-3)]">
          {message}
          <button type="button" aria-label="Cerrar notificación" onClick={onDismiss}
            className="grid h-8 w-8 place-items-center rounded-sm text-fg-2 hover:text-fg">
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
