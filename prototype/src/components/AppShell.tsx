import type { ReactNode } from "react";
import type { User } from "../data/mock";
import type { ThemePref } from "../theme/useTheme";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { ThemeToggle } from "./ThemeToggle";

interface Props {
  user: User; theme: ThemePref; onTheme: (t: ThemePref) => void; onLogout: () => void; children: ReactNode;
}

/** Navegación global autenticada (C.7: ThemeToggle junto al avatar/menú de usuario). */
export function AppShell({ user, theme, onTheme, onLogout, children }: Props) {
  return (
    <div className="min-h-dvh bg-canvas text-fg">
      <a href="#main" className="sr-only rounded-sm bg-surface px-3 py-2 text-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-40 border-b border-subtle bg-surface">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 md:px-6">
          <div className="flex items-center gap-2 sm:gap-6">
            <span className="flex items-center gap-2 text-title-sm font-semibold">
              <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-sm bg-action text-on-accent"><Icon name="check" size={16} /></span>
              <span className="sr-only sm:not-sr-only">Mini Jira</span>
            </span>
            <nav aria-label="Principal">
              <a href="#main" aria-current="page" className="rounded-sm px-2 py-1 text-body font-medium text-fg underline decoration-[var(--color-accent-action)] decoration-2 underline-offset-8">Proyectos</a>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle value={theme} onChange={onTheme} />
            <span className="hidden items-center gap-2 text-body-sm sm:flex">
              <Avatar user={user} /><span className="hidden sm:inline">{user.name}</span>
            </span>
            <Button variant="secondary" fullWidth={false} onClick={onLogout} aria-label="Cerrar sesión" className="!h-9 !px-2 sm:!px-3">
              <Icon name="logout" size={16} /><span className="hidden sm:inline">Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-[1280px] px-4 py-8 outline-none md:px-6">{children}</main>
    </div>
  );
}
