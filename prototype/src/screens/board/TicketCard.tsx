import type { DragEvent } from "react";
import { AvatarStack } from "../../components/Avatar";
import { Icon } from "../../components/Icon";
import { PRIORITY_LABEL, type Ticket, type User } from "../../data/mock";
import { MoveMenu, type MoveTarget } from "./MoveMenu";

export const NO_PERMISSION = "No tienes permiso para mover este ticket";
const todayISO = () => new Date().toLocaleDateString("sv");

interface Props {
  ticket: Ticket; users: Map<string, User>; lockReason?: string; onOpen: () => void; targets: MoveTarget[]; dragging: boolean;
  onDragStart: (e: DragEvent) => void; onDragEnd: () => void; onMove: (to: MoveTarget["id"]) => void;
}

export function TicketCard({ ticket, users, lockReason, onOpen, targets, dragging, onDragStart, onDragEnd, onMove }: Props) {
  const canMove = !lockReason;
  const assignees = ticket.assigneeIds.map((id) => users.get(id)).filter((u): u is User => !!u);
  const tags = ticket.tags.slice(0, 2);
  const extraTags = ticket.tags.slice(2);
  const overdue = !!ticket.dueDate && ticket.status !== "done" && ticket.dueDate < todayISO();
  const due = ticket.dueDate ? new Date(`${ticket.dueDate}T00:00:00`) : null;
  const buttonId = `move-${ticket.id}`;

  return (
    <article draggable={canMove} onDragStart={onDragStart} onDragEnd={onDragEnd}
      title={lockReason}
      className={`flex flex-col gap-3 rounded-md border border-subtle bg-surface p-3 shadow-[var(--shadow-1)] transition-shadow duration-[var(--duration-fast)] hover:shadow-[var(--shadow-2)] ${
        canMove ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed"} ${dragging ? "opacity-40" : ticket.archived ? "opacity-75" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-mono text-caption text-fg-2">{ticket.key}
            {ticket.archived && <span className="inline-flex items-center gap-1 rounded-full border border-input px-1.5 font-sans text-fg"><Icon name="archive" size={16} />Archivado</span>}</p>
          <h3 className="break-words text-body font-medium">
            <button type="button" aria-haspopup="dialog" onClick={onOpen} className="rounded-sm py-0.5 text-left hover:underline">{ticket.title}</button>
          </h3>
        </div>
        {canMove ? (
          <MoveMenu buttonId={buttonId} label={`Mover ticket ${ticket.key}: ${ticket.title}`} targets={targets} onSelect={onMove} />
        ) : (
          <button id={buttonId} type="button" aria-disabled="true" title={lockReason}
            aria-label={`Ticket ${ticket.key}: ${lockReason}`}
            className="grid h-8 w-8 cursor-not-allowed place-items-center rounded-sm text-fg-2">
            <Icon name="lock" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full border border-subtle px-2 py-0.5 text-caption font-medium text-fg">
          <span style={{ color: `var(--priority-${ticket.priority})` }}><Icon name="flag" size={16} /></span>
          <span className="sr-only">Prioridad:</span>{PRIORITY_LABEL[ticket.priority]}
        </span>
        {tags.length > 0 && (
          <ul aria-label="Etiquetas" className="contents">
            {tags.map((tag) => (
              <li key={tag} className="rounded-sm bg-canvas px-1.5 py-0.5 text-caption text-fg-2">{tag}</li>
            ))}
            {extraTags.length > 0 && (
              <li className="rounded-sm bg-canvas px-1.5 py-0.5 text-caption text-fg-2">
                <span aria-hidden="true">+{extraTags.length}</span>
                <span className="sr-only">y {extraTags.length} más: {extraTags.join(", ")}</span>
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <AvatarStack users={assignees} max={3} label="Responsables" />
        {due && (
          <time dateTime={ticket.dueDate} className={`inline-flex items-center gap-1 text-caption ${overdue ? "font-medium text-critical-fg" : "text-fg-2"}`}>
            <Icon name={overdue ? "alert" : "calendar"} size={16} />
            <span className="sr-only">Fecha límite:</span>
            {due.toLocaleDateString("es", { day: "numeric", month: "short" })}
            {overdue && <span> · Vencido</span>}
          </time>
        )}
      </div>
    </article>
  );
}

export function TicketCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-3 rounded-md border border-subtle bg-surface p-3 shadow-[var(--shadow-1)]">
      <div className="h-3 w-12 rounded-sm bg-canvas" /><div className="h-5 w-4/5 rounded-sm bg-canvas" />
      <div className="h-5 w-16 rounded-full bg-canvas" />
      <div className="flex gap-1"><div className="h-7 w-7 rounded-full bg-canvas" /><div className="h-7 w-7 rounded-full bg-canvas" /></div>
    </div>
  );
}
