import { AvatarStack } from "../../components/Avatar";
import { Icon } from "../../components/Icon";
import type { Project, User } from "../../data/mock";

interface Props {
  project: Project;
  users: Map<string, User>;
  canEdit: boolean;
  /** Solo Admin: muestra quién creó el proyecto si no es el usuario actual (RoleBadge). */
  creatorBadge?: string;
  onOpen: (p: Project) => void;
  onBoard: (p: Project) => void;
}

export function ProjectCard({ project, users, canEdit, creatorBadge, onOpen, onBoard }: Props) {
  const members = project.memberIds.map((id) => users.get(id)).filter((u): u is User => !!u);
  const n = project.ticketCount;
  const action = canEdit ? "Editar" : "Ver";

  return (
    <article className="flex flex-col gap-4 rounded-md border border-subtle bg-surface p-4 shadow-[var(--shadow-1)] transition-shadow duration-[var(--duration-fast)] hover:shadow-[var(--shadow-2)]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-fg-2"><Icon name="folder" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-title-sm font-semibold">
            <button type="button" onClick={() => onBoard(project)} className="rounded-sm py-0.5 text-left hover:underline">{project.name}</button>
          </h2>
          <p className="text-body-sm text-fg-2">{n} {n === 1 ? "ticket" : "tickets"}</p>
        </div>
      </div>
      {creatorBadge && (
        <p className="inline-flex w-fit items-center gap-1 rounded-full border border-subtle bg-canvas px-2 py-0.5 text-caption text-fg">
          <Icon name="user" size={16} /> Creado por {creatorBadge}
        </p>
      )}
      <div className="mt-auto flex items-center justify-between gap-2">
        <AvatarStack users={members} />
        <button type="button" onClick={() => onOpen(project)}
          aria-label={`${action} proyecto ${project.name}`} title={`${action} proyecto`}
          className="grid h-9 w-9 place-items-center rounded-sm text-fg-2 hover:bg-canvas hover:text-fg">
          <Icon name={canEdit ? "pencil" : "eye"} />
        </button>
      </div>
    </article>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-4 rounded-md border border-subtle bg-surface p-4 shadow-[var(--shadow-1)]">
      <div className="flex gap-3">
        <div className="h-5 w-5 rounded-sm bg-canvas" />
        <div className="flex-1 space-y-2"><div className="h-5 w-3/4 rounded-sm bg-canvas" /><div className="h-4 w-1/4 rounded-sm bg-canvas" /></div>
      </div>
      <div className="flex gap-1"><div className="h-7 w-7 rounded-full bg-canvas" /><div className="h-7 w-7 rounded-full bg-canvas" /><div className="h-7 w-7 rounded-full bg-canvas" /></div>
    </div>
  );
}
