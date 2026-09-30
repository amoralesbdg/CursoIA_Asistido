import { useId, useState, type FormEvent } from "react";
import { Avatar } from "../../components/Avatar";
import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { Modal } from "../../components/Modal";
import { TextInput } from "../../components/TextInput";
import type { Project, User } from "../../data/mock";

export type FormMode = "create" | "edit" | "view";

interface Props {
  mode: FormMode;
  project?: Project;
  users: User[];
  currentUser: User;
  forceError: boolean;
  onClose: () => void;
  onSave: (data: { name: string; memberIds: string[] }) => void;
}

const TITLES = { create: "Nuevo proyecto", edit: "Editar proyecto", view: "Detalle del proyecto" };

export function ProjectFormModal({ mode, project, users, currentUser, forceError, onClose, onSave }: Props) {
  const titleId = useId();
  const creatorId = project?.creatorId ?? currentUser.id;
  const [name, setName] = useState(project?.name ?? "");
  const [memberIds, setMemberIds] = useState<string[]>(project?.memberIds ?? [currentUser.id]);
  const [nameError, setNameError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [busy, setBusy] = useState(false);
  const readOnly = mode === "view";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const trimmed = name.trim();
    const err = !trimmed ? "Introduce un nombre para el proyecto"
      : trimmed.length > 60 ? "El nombre no puede superar 60 caracteres; acórtalo" : "";
    setNameError(err);
    if (err) { document.getElementById(`${titleId}-name`)?.focus(); return; }
    setSaveError("");
    setBusy(true);
    await new Promise((r) => setTimeout(r, 800)); // mock de red
    setBusy(false);
    if (forceError) { setSaveError("No se pudo guardar el proyecto, intenta de nuevo"); return; }
    onSave({ name: trimmed, memberIds: memberIds.includes(creatorId) ? memberIds : [creatorId, ...memberIds] });
  };

  return (
    <Modal titleId={titleId} onClose={onClose} busy={busy}>
      <form noValidate onSubmit={submit} aria-busy={busy}>
        <div className="flex items-center justify-between gap-2 border-b border-subtle px-6 py-4">
          <h2 id={titleId} className="text-title font-semibold">{TITLES[mode]}</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-sm text-fg-2 hover:bg-canvas hover:text-fg disabled:opacity-60">
            <Icon name="close" />
          </button>
        </div>

        <fieldset disabled={busy} className="flex min-w-0 flex-col gap-5 border-0 px-6 py-5">
          {saveError && (
            <div role="alert" className="flex items-start gap-2 rounded-sm border border-critical-fg px-3 py-2 text-body-sm text-critical-fg">
              <span className="mt-0.5 shrink-0"><Icon name="alert" size={16} /></span>{saveError}
            </div>
          )}
          {readOnly ? (
            <div>
              <p className="text-body-sm font-medium">Nombre</p>
              <p className="text-body">{project?.name}</p>
              <p role="note" className="mt-3 rounded-sm bg-canvas px-3 py-2 text-body-sm text-fg-2">
                Solo el creador del proyecto o un Admin puede editar el nombre y los miembros.
              </p>
            </div>
          ) : (
            <TextInput id={`${titleId}-name`} data-autofocus label="Nombre del proyecto" name="name"
              value={name} onChange={(e) => { setName(e.target.value); setNameError(""); }}
              error={nameError} autoComplete="off" />
          )}
          <MemberPicker users={users} selected={memberIds} creatorId={creatorId}
            readOnly={readOnly} onChange={setMemberIds} />
        </fieldset>

        <div className="flex flex-col-reverse gap-2 border-t border-subtle px-6 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" fullWidth={false} onClick={onClose} disabled={busy}
            {...(readOnly ? { "data-autofocus": true } : {})}>
            {readOnly ? "Cerrar" : "Cancelar"}
          </Button>
          {!readOnly && (
            <Button type="submit" fullWidth={false} loading={busy} loadingLabel="Guardando…">
              {mode === "create" ? "Crear proyecto" : "Guardar cambios"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

interface PickerProps {
  users: User[]; selected: string[]; creatorId: string; readOnly: boolean; onChange: (ids: string[]) => void;
}

/** Multi-select con búsqueda por nombre/email, implementado como lista de checkboxes nativos. */
function MemberPicker({ users, selected, creatorId, readOnly, onChange }: PickerProps) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const base = readOnly ? users.filter((u) => selected.includes(u.id)) : users;
  const list = base.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(term));
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="mb-2 text-body-sm font-medium">
        Miembros <span className="font-normal text-fg-2" aria-live="polite">({selected.length} {selected.length === 1 ? "seleccionado" : "seleccionados"})</span>
      </legend>
      {!readOnly && (
        <div className="mb-2">
          <TextInput label="Buscar por nombre o email" type="search" value={q}
            onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        </div>
      )}
      <ul className="max-h-52 overflow-auto rounded-sm border border-subtle">
        {list.map((u) => {
          const isCreator = u.id === creatorId;
          return (
            <li key={u.id} className="border-b border-subtle last:border-b-0">
              <label className={`flex min-h-11 items-center gap-3 px-3 py-1.5 ${readOnly || isCreator ? "" : "cursor-pointer hover:bg-canvas"}`}>
                {!readOnly && (
                  <input type="checkbox" checked={selected.includes(u.id)} disabled={isCreator}
                    onChange={() => toggle(u.id)} className="h-4 w-4 accent-[var(--color-accent-action)]" />
                )}
                <Avatar user={u} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body">{u.name}{isCreator && <span className="text-fg-2"> · Creador</span>}</span>
                  <span className="block truncate text-caption text-fg-2">{u.email}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {list.length === 0 && <p role="status" className="px-1 py-3 text-body-sm text-fg-2">Ninguna persona coincide con “{q}”.</p>}
    </fieldset>
  );
}
