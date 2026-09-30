import { useRef, useState, type FormEvent } from "react";
import { Button } from "../components/Button";
import { PasswordInput } from "../components/PasswordInput";
import { TextInput } from "../components/TextInput";

type Mode = "login" | "register";
type Field = "username" | "email" | "password";
type Errors = Partial<Record<Field, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mock de backend: solo para el prototipo. demo / demo1234 es válido en login. */
function fakeAuth(mode: Mode, username: string, password: string): Promise<boolean> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(mode === "register" || (username === "demo" && password === "demo1234")), 900));
}

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (username: string) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [values, setValues] = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const refs = { username: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null), password: useRef<HTMLInputElement>(null) };
  const headingRef = useRef<HTMLHeadingElement>(null);

  const isRegister = mode === "register";
  const set = (f: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [f]: e.target.value }));
    if (errors[f]) setErrors((x) => ({ ...x, [f]: undefined }));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!values.username.trim()) e.username = "Introduce tu nombre de usuario";
    if (isRegister) {
      if (!values.email.trim()) e.email = "Introduce tu email, por ejemplo nombre@empresa.com";
      else if (!EMAIL_RE.test(values.email.trim())) e.email = "Introduce un email válido, por ejemplo nombre@empresa.com";
    }
    if (!values.password) e.password = "Introduce tu contraseña";
    else if (isRegister && values.password.length < 8) e.password = "La contraseña debe tener al menos 8 caracteres";
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (busy) return;
    setFormError("");
    const e = validate();
    setErrors(e);
    const first = (["username", "email", "password"] as Field[]).find((f) => e[f]);
    if (first) { refs[first].current?.focus(); return; }

    setBusy(true);
    const ok = await fakeAuth(mode, values.username.trim(), values.password);
    setBusy(false);
    if (ok) return onAuthenticated(values.username.trim());
    setFormError("Usuario o contraseña incorrectos");
    requestAnimationFrame(() => refs.username.current?.focus());
  };

  const toggleMode = () => {
    setMode(isRegister ? "login" : "register");
    setErrors({}); setFormError("");
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  return (
    <div className="mx-auto flex w-full max-w-[400px] flex-col items-stretch gap-6 px-4 sm:px-0">
      <div className="flex items-center justify-center gap-2 text-fg">
        <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-sm bg-action text-on-accent">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 12l3 3 5-6" /></svg>
        </span>
        <span className="text-title-sm font-semibold">Mini Jira</span>
      </div>

      <section aria-labelledby="auth-title"
        className="rounded-lg border border-subtle bg-surface p-6 shadow-[var(--shadow-3)] sm:p-8">
        <h1 id="auth-title" ref={headingRef} tabIndex={-1} className="text-title font-semibold outline-none">
          {isRegister ? "Crear cuenta" : "Iniciar sesión"}
        </h1>
        <p className="mt-1 text-body-sm text-fg-2">
          {isRegister ? "Regístrate con tu email de trabajo." : "Accede con tu usuario y contraseña."}
        </p>

        {formError && (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-sm border border-critical-fg px-3 py-2 text-body-sm text-critical-fg">
            <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.01" /></svg>
            {formError}
          </div>
        )}

        <form noValidate onSubmit={submit} aria-busy={busy} className="mt-5">
          <fieldset disabled={busy} className="flex min-w-0 flex-col gap-4 border-0 p-0">
            <legend className="sr-only">{isRegister ? "Datos de registro" : "Credenciales"}</legend>
            <TextInput ref={refs.username} label="Usuario" name="username" autoComplete="username"
              value={values.username} onChange={set("username")} error={errors.username} />
            {isRegister && (
              <TextInput ref={refs.email} label="Email" name="email" type="email" autoComplete="email"
                inputMode="email" value={values.email} onChange={set("email")} error={errors.email} />
            )}
            <PasswordInput ref={refs.password} label="Contraseña" name="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              hint={isRegister ? "Mínimo 8 caracteres." : undefined}
              value={values.password} onChange={set("password")} error={errors.password} />
            <Button type="submit" loading={busy} loadingLabel={isRegister ? "Creando cuenta…" : "Iniciando sesión…"}
              className="mt-2">
              {isRegister ? "Crear cuenta" : "Iniciar sesión"}
            </Button>
          </fieldset>
        </form>
        <p role="status" className="sr-only">{busy ? "Validando datos…" : ""}</p>

        <p className="mt-5 text-center text-body-sm text-fg-2">
          {isRegister ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
          <button type="button" onClick={toggleMode} disabled={busy}
            className="rounded-sm font-medium text-anchor underline underline-offset-2 hover:no-underline disabled:opacity-60">
            {isRegister ? "Inicia sesión" : "Crea una"}
          </button>
        </p>
      </section>

      {!isRegister && (
        <p className="text-center text-caption text-fg-2">
          Prototipo — usuario <span className="font-mono">demo</span>, contraseña <span className="font-mono">demo1234</span>
        </p>
      )}
    </div>
  );
}
