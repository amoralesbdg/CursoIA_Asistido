import { useId, useRef, useState, type FormEvent } from "react";
import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { Modal } from "../../components/Modal";
import { TextInput } from "../../components/TextInput";
import { PRIORITY_LABEL, STATUSES, type Comment, type Priority, type Project, type Role, type Ticket, type User } from "../../data/mock";
import { AssigneePicker } from "./AssigneePicker";
import { CommentSection } from "./CommentSection";
import { TagInput } from "./TagInput";

interface Props {
  ticket?: Ticket; defaultProjectId: string; nextKey: string; projects: Project[]; users: User[];
  currentUser: User; role: Role; forceError: boolean; forceCommentError: boolean;
  comments: Comment[]; onComment: (ticketId: string, body: string) => void;
  onClose: () => void; onSave: (t: Ticket, isNew: boolean) => void;
  onArchive: (id: string, archived: boolean) => void; onSelfAssign: (id: string) => void;
}

export function TicketPanel({ ticket, defaultProjectId, nextKey, projects, users, currentUser, role, forceError, forceCommentError,
  comments, onComment, onClose, onSave, onArchive, onSelfAssign }: Props) {
  const uid = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(ticket?.title ?? "");
  const [description, setDescription] = useState(ticket?.description ?? "");
  const [priority, setPriority] = useState<Priority>(ticket?.priority ?? "medium");
  const [date, setDate] = useState(ticket?.dueDate ?? "");
  const [assignees, setAssignees] = useState<string[]>(ticket?.assigneeIds ?? []);
  const [projectId, setProjectId] = useState(ticket?.projectId ?? defaultProjectId);
  const [tags, setTags] = useState<string[]>(ticket?.tags ?? []);
  const [titleError, setTitleError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [busy, setBusy] = useState(false);

  const isNew = !ticket;
  const archived = !!ticket?.archived;
  // RF-04/RF-05: Admin, creador o asignado. Un ticket nuevo siempre es editable por quien lo crea.
  const access = isNew || role === "admin" || ticket.creatorId === currentUser.id || ticket.assigneeIds.includes(currentUser.id);
  const readOnly = !isNew && (!access || archived);
  const status = STATUSES.find((s) => s.id === (ticket?.status ?? "todo"))!;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || readOnly) return;
    const tt = title.trim();
    const err = !tt ? "Introduce un título para el ticket" : tt.length > 120 ? "El título no puede superar 120 caracteres; acórtalo" : "";
    setTitleError(err);
    if (err) { titleRef.current?.focus(); return; }
    setSaveError(""); setBusy(true);
    await new Promise((r) => setTimeout(r, 700)); // mock de red — last-write-wins, sin aviso de conflicto (RF-14)
    setBusy(false);
    if (forceError) { setSaveError("No se pudo guardar el ticket, intenta de nuevo"); return; }
    const base: Ticket = ticket ?? { id: `t${Date.now()}`, key: nextKey, status: "todo", creatorId: currentUser.id } as Ticket;
    onSave({ ...base, title: tt, description: description.trim(), priority, dueDate: date || undefined, assigneeIds: assignees, projectId, tags }, isNew);
  };

  const selfAssign = () => {
    if (!ticket) return;
    setAssignees((a) => [...a, currentUser.id]);
    onSelfAssign(ticket.id);
    requestAnimationFrame(() => titleRef.current?.focus());
  };

  return (
    <Modal panel titleId={`${uid}-h`} onClose={onClose} busy={busy}>
      <form noValidate onSubmit={submit} aria-busy={busy} className="flex min-h-full flex-col">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-2 border-b border-subtle bg-surface px-6 py-4">
          <div className="min-w-0">
            <h2 id={`${uid}-h`} className="text-title font-semibold">{isNew ? "Nuevo ticket" : "Detalle del ticket"}</h2>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-body-sm">
              <span className="font-mono text-fg-2">{ticket?.key ?? nextKey}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-subtle px-2 py-0.5 text-caption font-medium">
                <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: `var(--status-${status.id})` }} />
                <span className="sr-only">Estado:</span>{status.label}
              </span>
              {archived && <span className="inline-flex items-center gap-1 rounded-full border border-input px-2 py-0.5 text-caption font-medium"><Icon name="archive" size={16} />Archivado</span>}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-sm text-fg-2 hover:bg-canvas hover:text-fg disabled:opacity-60"><Icon name="close" /></button>
        </div>

        <div className="flex flex-1 flex-col gap-5 px-6 py-5">
          {saveError && (
            <div role="alert" className="flex items-start gap-2 rounded-sm border border-critical-fg px-3 py-2 text-body-sm text-critical-fg">
              <span className="mt-0.5 shrink-0"><Icon name="alert" size={16} /></span>{saveError}
            </div>
          )}
          {readOnly && (
            <div role="note" className="rounded-sm bg-canvas px-3 py-2 text-body-sm text-fg-2">
              {archived ? "Este ticket está archivado. Restáuralo para poder editarlo."
                : "Solo el creador, los responsables o un Admin pueden editar este ticket."}
              {!archived && !access && (
                <div className="mt-2"><Button type="button" variant="secondary" fullWidth={false} onClick={selfAssign}>Asignarme este ticket</Button></div>
              )}
            </div>
          )}

          <fieldset disabled={readOnly || busy} className={`flex min-w-0 flex-col gap-5 border-0 p-0 ${archived ? "opacity-75" : ""}`}>
            <TextInput ref={titleRef} data-autofocus label="Título" value={title} autoComplete="off"
              onChange={(e) => { setTitle(e.target.value); setTitleError(""); }} error={titleError} />

            <div className="flex flex-col gap-1">
              <label htmlFor={`${uid}-d`} className="text-body-sm font-medium">Descripción</label>
              <textarea id={`${uid}-d`} rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Añade contexto, criterios de aceptación…"
                className="w-full resize-y rounded-sm border border-input bg-surface px-3 py-2 text-body text-fg placeholder:text-fg-2 disabled:cursor-not-allowed disabled:opacity-60" />
            </div>

            <fieldset className="min-w-0 border-0 p-0" aria-describedby={`${uid}-pd`}>
              <legend className="mb-2 text-body-sm font-medium">Prioridad</legend>
              <div className="grid grid-cols-3 gap-2">
                {(["high", "medium", "low"] as Priority[]).map((p) => (
                  <label key={p} className="group relative flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-input bg-surface text-body has-[:checked]:border-2 has-[:checked]:border-[var(--color-accent-action)] has-[:checked]:font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--color-accent)] has-[:disabled]:cursor-not-allowed">
                    <input type="radio" name={`${uid}-p`} value={p} checked={priority === p} onChange={() => setPriority(p)} className="sr-only" />
                    <span style={{ color: `var(--priority-${p})` }}><Icon name="flag" size={16} /></span>
                    {PRIORITY_LABEL[p]}
                    <span className="hidden text-[var(--color-accent-action)] group-has-[:checked]:inline"><Icon name="check" size={16} /></span>
                  </label>
                ))}
              </div>
              <p id={`${uid}-pd`} className="mt-1 text-caption text-fg-2">Define la urgencia del ticket en el tablero.</p>
            </fieldset>

            <TextInput type="date" label="Fecha límite" value={date} onChange={(e) => setDate(e.target.value)} />
            <AssigneePicker users={users} selected={assignees} onChange={setAssignees} />

            <div className="flex flex-col gap-1">
              <label htmlFor={`${uid}-pr`} className="text-body-sm font-medium">Proyecto</label>
              <select id={`${uid}-pr`} value={projectId} onChange={(e) => setProjectId(e.target.value)}
                className="h-11 w-full rounded-sm border border-input bg-surface px-3 text-body text-fg disabled:cursor-not-allowed disabled:opacity-60">
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <TagInput tags={tags} onChange={setTags} />
          </fieldset>

          {ticket ? (
            <CommentSection comments={comments} users={new Map(users.map((u) => [u.id, u]))} forceError={forceCommentError}
              blockedReason={archived ? "Restaura el ticket para poder comentar." : undefined}
              onPost={(body) => onComment(ticket.id, body)} />
          ) : (
            <section aria-labelledby={`${uid}-c`} className="border-t border-subtle pt-5">
              <h3 id={`${uid}-c`} className="text-body font-semibold">Comentarios</h3>
              <p className="mt-1 text-body-sm text-fg-2">Guarda el ticket para poder comentar.</p>
            </section>
          )}
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-subtle bg-surface px-6 py-4">
          <div>
            {ticket && access && (
              archived
                ? <Button type="button" variant="secondary" fullWidth={false} onClick={() => onArchive(ticket.id, false)}>Restaurar</Button>
                : <Button type="button" variant="danger" fullWidth={false} disabled={busy} onClick={() => onArchive(ticket.id, true)}>Eliminar</Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" fullWidth={false} onClick={onClose} disabled={busy}>{readOnly ? "Cerrar" : "Cancelar"}</Button>
            {!readOnly && <Button type="submit" fullWidth={false} loading={busy} loadingLabel="Guardando…">{isNew ? "Crear ticket" : "Guardar"}</Button>}
          </div>
        </div>
      </form>
    </Modal>
  );
}
