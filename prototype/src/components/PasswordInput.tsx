import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { TextInput } from "./TextInput";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string; error?: string; hint?: string;
}

/** C.1 — toggle de visibilidad con aria-pressed y nombre accesible. */
export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <TextInput ref={ref} {...props} type={visible ? "text" : "password"}
      trailing={
        <button type="button" aria-pressed={visible} disabled={props.disabled}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          onClick={() => setVisible((v) => !v)}
          className="grid h-9 w-9 place-items-center rounded-sm text-fg-2 hover:text-fg disabled:opacity-60">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {visible
              ? <><path d="M3 3l18 18" /><path d="M10.6 6.1A10 10 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-3.2 3.8M6.6 6.6A16 16 0 0 0 2.5 12S6 18 12 18a9.6 9.6 0 0 0 4-.9" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>
              : <><path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" /><circle cx="12" cy="12" r="3" /></>}
          </svg>
        </button>
      } />
  );
});
