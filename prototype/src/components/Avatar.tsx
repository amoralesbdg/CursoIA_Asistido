import type { User } from "../data/mock";

const TINTS = ["#bfdbfe", "#bbf7d0", "#fde68a", "#fbcfe8", "#ddd6fe", "#fed7aa"];

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

/** Decorativo: el nombre siempre se expone en texto junto a él. */
export function Avatar({ user, size = 28 }: { user: User; size?: number }) {
  const tint = TINTS[Number(user.id.replace(/\D/g, "")) % TINTS.length];
  return (
    <span aria-hidden="true" style={{ width: size, height: size, background: tint, fontSize: size * 0.4 }}
      className="grid shrink-0 place-items-center rounded-full font-semibold text-[#101214]">
      {initials(user.name)}
    </span>
  );
}

/** Máx. `max` avatares + contador "+N"; un único nombre accesible para todo el grupo. */
export function AvatarStack({ users, max = 4, label: name = "Miembros" }: { users: User[]; max?: number; label?: string }) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  const label = users.length ? `${name}: ${users.map((u) => u.name).join(", ")}` : `${name}: ninguno`;
  return (
    <div role="img" aria-label={label} className="flex items-center">
      {shown.map((u, i) => (
        <span key={u.id} className={`rounded-full ring-2 ring-[var(--color-bg-surface)] ${i ? "-ml-2" : ""}`}>
          <Avatar user={u} />
        </span>
      ))}
      {extra > 0 && (
        <span aria-hidden="true" className="-ml-2 grid h-7 min-w-7 place-items-center rounded-full bg-canvas px-1.5 text-caption font-semibold text-fg ring-2 ring-[var(--color-bg-surface)]">
          +{extra}
        </span>
      )}
    </div>
  );
}
