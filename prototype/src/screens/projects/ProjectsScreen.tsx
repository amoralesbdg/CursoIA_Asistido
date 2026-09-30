import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { Toast } from "../../components/Toast";
import { PEOPLE, visibleProjects, type Project, type Role, type User } from "../../data/mock";
import { ProjectCard, ProjectCardSkeleton } from "./ProjectCard";
import { ProjectFormModal, type FormMode } from "./ProjectFormModal";

type View = "loading" | "ready" | "empty" | "error";
interface DialogState { mode: FormMode; project?: Project }

interface Props {
  currentUser: User; role: Role; onRoleChange: (r: Role) => void; onOpenBoard: (p: Project) => void;
  projects: Project[]; setProjects: Dispatch<SetStateAction<Project[]>>;
}

export function ProjectsScreen({ currentUser, role, onRoleChange, onOpenBoard, projects, setProjects }: Props) {
  const [view, setView] = useState<View>("loading");
  const [forceSaveError, setForceSaveError] = useState(false);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number>(undefined);
  const trigger = useRef<HTMLElement | null>(null);
  const h1 = useRef<HTMLHeadingElement>(null);

  const users = useMemo(() => [currentUser, ...PEOPLE], [currentUser]);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const isAdmin = role === "admin";

  const load = useCallback((ms: number) => {
    setView("loading");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setView("ready"), ms);
  }, []);
  useEffect(() => { load(800); return () => window.clearTimeout(timer.current); }, [load]);

  // RF-09: Admin ve todo; usuario normal, solo los que creó o donde es miembro.
  const visible = visibleProjects(projects, currentUser.id, role);
  const canEdit = (p: Project) => isAdmin || p.creatorId === currentUser.id; // RF-09-bis

  const open = (state: DialogState) => { trigger.current = document.activeElement as HTMLElement; setDialog(state); };
  const close = useCallback(() => {
    setDialog(null);
    requestAnimationFrame(() => {
      const t = trigger.current;
      (t && t.isConnected ? t : h1.current)?.focus();
    });
  }, []);

  const save = (data: { name: string; memberIds: string[] }) => {
    if (dialog?.mode === "edit" && dialog.project) {
      const id = dialog.project.id;
      setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, ...data } : p)));
      setToast("Proyecto actualizado");
    } else {
      setProjects((ps) => [{ id: `p${Date.now()}`, creatorId: currentUser.id, ticketCount: 0, ...data }, ...ps]);
      setToast("Proyecto creado");
    }
    close();
  };

  const shown = view === "empty" ? [] : visible;
  const status = view === "loading" ? "Cargando proyectos…"
    : view === "error" ? "" : `${shown.length} ${shown.length === 1 ? "proyecto" : "proyectos"}`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 id="projects-title" ref={h1} tabIndex={-1} className="text-headline font-semibold outline-none">Proyectos</h1>
        <Button fullWidth={false} onClick={() => open({ mode: "create" })}>
          <Icon name="plus" /> Nuevo proyecto
        </Button>
      </div>
      <p role="status" className="sr-only">{status}</p>

      <div className="mt-6" aria-busy={view === "loading"}>
        {view === "loading" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => <ProjectCardSkeleton key={i} />)}
          </div>
        )}

        {view === "error" && (
          <div role="alert" className="mx-auto max-w-md rounded-lg border border-subtle bg-surface p-8 text-center shadow-[var(--shadow-1)]">
            <p className="text-title-sm font-semibold">No se pudieron cargar los proyectos</p>
            <p className="mt-1 text-body text-fg-2">Revisa tu conexión e inténtalo de nuevo.</p>
            <Button fullWidth={false} className="mt-4" onClick={() => load(600)}>Reintentar</Button>
          </div>
        )}

        {(view === "ready" || view === "empty") && shown.length === 0 && (
          <div className="mx-auto flex max-w-md flex-col items-center rounded-lg border border-dashed border-input bg-surface p-10 text-center">
            <span className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-canvas text-fg-2"><Icon name="folder" size={24} /></span>
            <p className="text-title-sm font-semibold">Aún no tienes proyectos</p>
            <p className="mt-1 text-body text-fg-2">Crea el primero para empezar a organizar tus tickets.</p>
            <Button fullWidth={false} className="mt-4" onClick={() => open({ mode: "create" })}>Crear proyecto</Button>
          </div>
        )}

        {(view === "ready" || view === "empty") && shown.length > 0 && (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => (
              <li key={p.id} className="flex [&>*]:w-full">
                <ProjectCard project={p} users={userMap} canEdit={canEdit(p)}
                  creatorBadge={isAdmin && p.creatorId !== currentUser.id ? userMap.get(p.creatorId)?.name : undefined}
                  onBoard={onOpenBoard}
                  onOpen={(proj) => open({ mode: canEdit(proj) ? "edit" : "view", project: proj })} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <section aria-labelledby="demo-h" className="mt-12 rounded-md border border-dashed border-input p-4">
        <h2 id="demo-h" className="text-body-sm font-semibold">Panel de prototipo <span className="font-normal text-fg-2">(no forma parte del producto)</span></h2>
        <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3">
          <label className="flex flex-col gap-1 text-body-sm font-medium">Rol
            <select value={role} onChange={(e) => onRoleChange(e.target.value as Role)}
              className="h-10 rounded-sm border border-input bg-surface px-2 text-body font-normal">
              <option value="user">Usuario normal</option><option value="admin">Admin</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-body-sm font-medium">Estado de la vista
            <select value={view === "loading" ? "loading" : view}
              onChange={(e) => { window.clearTimeout(timer.current); setView(e.target.value as View); }}
              className="h-10 rounded-sm border border-input bg-surface px-2 text-body font-normal">
              <option value="ready">Normal</option><option value="loading">Cargando</option>
              <option value="empty">Vacío</option><option value="error">Error de carga</option>
            </select>
          </label>
          <label className="flex min-h-10 items-center gap-2 text-body-sm font-medium">
            <input type="checkbox" checked={forceSaveError} onChange={(e) => setForceSaveError(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent-action)]" />
            Forzar error al guardar
          </label>
        </div>
      </section>

      {dialog && (
        <ProjectFormModal mode={dialog.mode} project={dialog.project} users={users}
          currentUser={currentUser} forceError={forceSaveError} onClose={close} onSave={save} />
      )}
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
