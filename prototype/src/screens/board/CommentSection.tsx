import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Avatar } from "../../components/Avatar";
import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import type { Comment, User } from "../../data/mock";

interface Props {
  comments: Comment[]; users: Map<string, User>; forceError: boolean;
  /** Si existe, el composer se sustituye por este aviso (p. ej. ticket archivado). */
  blockedReason?: string; onPost: (body: string) => void;
}

const rtf = new Intl.RelativeTimeFormat("es", { numeric: "always", style: "short" });
function relative(ts: number) {
  const s = Math.round((ts - Date.now()) / 1000);
  if (Math.abs(s) < 60) return "justo ahora";
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [["minute", 60], ["hour", 3600], ["day", 86400]];
  let unit: Intl.RelativeTimeFormatUnit = "minute", div = 60;
  for (const [u, d] of steps) if (Math.abs(s) >= d) { unit = u; div = d; }
  return rtf.format(Math.trunc(s / div), unit);
}

/**
 * Mejora futura: la lista renderiza todos los comentarios sin paginar (ver PLAN.md › Mejoras futuras).
 * Las menciones son texto plano por decisión de producto.
 */
export function CommentSection({ comments, users, forceError, blockedReason, onPost }: Props) {
  const uid = useId();
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(false);
  const [announce, setAnnounce] = useState("");
  const list = useRef<HTMLOListElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 700); return () => clearTimeout(t); }, []); // mock de carga
  useEffect(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight; }, [comments.length, loading]);

  const grow = () => {
    const el = area.current; if (!el) return;
    el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const post = async () => {
    const text = body.trim();
    if (!text || posting) return;
    setError(false); setPosting(true);
    await new Promise((r) => setTimeout(r, 600)); // mock de red
    setPosting(false);
    if (forceError) { setError(true); return; } // el texto escrito no se pierde
    onPost(text);
    setBody(""); setAnnounce("Comentario publicado");
    requestAnimationFrame(() => { grow(); area.current?.focus(); });
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); post(); }
  };

  return (
    <section aria-labelledby={`${uid}-h`} className="flex flex-col gap-3 border-t border-subtle pt-5">
      <h3 id={`${uid}-h`} className="text-body font-semibold">
        Comentarios{!loading && <span className="font-normal text-fg-2"> ({comments.length})</span>}
      </h3>

      {loading ? (
        <div aria-busy="true" className="flex flex-col gap-4">
          <p className="sr-only" role="status">Cargando comentarios…</p>
          {[0, 1, 2].map((i) => (
            <div key={i} aria-hidden="true" className="flex animate-pulse gap-3">
              <div className="h-7 w-7 shrink-0 rounded-full bg-canvas" />
              <div className="flex-1 space-y-2"><div className="h-3 w-1/3 rounded-sm bg-canvas" /><div className="h-4 w-full rounded-sm bg-canvas" /></div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="rounded-sm bg-canvas px-3 py-4 text-center text-body-sm text-fg-2">Aún no hay comentarios. Sé el primero en comentar.</p>
      ) : (
        <ol ref={list} tabIndex={0} aria-label="Comentarios, del más antiguo al más reciente"
          className="flex max-h-72 flex-col gap-4 overflow-y-auto pr-1">
          {comments.map((c) => {
            const author = users.get(c.authorId);
            return (
              <li key={c.id} className="flex gap-3">
                {author ? <Avatar user={author} /> : <span aria-hidden="true" className="h-7 w-7 shrink-0 rounded-full bg-canvas" />}
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2 text-body-sm">
                    <span className="font-semibold">{author?.name ?? "Usuario desconocido"}</span>
                    <time dateTime={new Date(c.createdAt).toISOString()} title={new Date(c.createdAt).toLocaleString("es")}
                      className="text-caption text-fg-2">{relative(c.createdAt)}</time>
                  </p>
                  <p className="whitespace-pre-wrap break-words text-body">{c.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {blockedReason ? (
        <p role="note" className="rounded-sm bg-canvas px-3 py-2 text-body-sm text-fg-2">{blockedReason}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <label htmlFor={`${uid}-t`} className="text-body-sm font-medium">Añadir un comentario</label>
          <textarea ref={area} id={`${uid}-t`} rows={2} value={body} readOnly={posting} aria-busy={posting}
            aria-describedby={`${uid}-hint${error ? ` ${uid}-err` : ""}`} aria-invalid={error || undefined}
            onChange={(e) => { setBody(e.target.value); setError(false); grow(); }} onKeyDown={onKeyDown}
            placeholder="Escribe tu comentario…"
            className={`w-full resize-none rounded-sm border bg-surface px-3 py-2 text-body text-fg placeholder:text-fg-2 read-only:opacity-60 ${error ? "border-critical-fg" : "border-input"}`} />
          <p id={`${uid}-hint`} className="text-caption text-fg-2">Texto plano. Pulsa Ctrl + Enter para publicar.</p>
          {error && (
            <p id={`${uid}-err`} role="alert" className="flex flex-wrap items-center gap-2 text-body-sm text-critical-fg">
              <span className="flex items-center gap-1"><Icon name="alert" size={16} />No se pudo publicar el comentario</span>
              <Button type="button" variant="secondary" fullWidth={false} className="!h-8 !px-3 !text-body-sm" onClick={post}>Reintentar</Button>
            </p>
          )}
          <div className="flex justify-end">
            <Button type="button" fullWidth={false} onClick={post} disabled={!body.trim()} loading={posting} loadingLabel="Publicando…">Comentar</Button>
          </div>
        </div>
      )}
      <p role="status" className="sr-only">{announce}</p>
    </section>
  );
}
