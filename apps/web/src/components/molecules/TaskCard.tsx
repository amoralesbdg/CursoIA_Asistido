import { AvatarStack } from '../atoms/Avatar'
import { Badge } from '../atoms/Badge'
import { PriorityTag } from '../atoms/PriorityTag'
import type { Ticket, User } from '../../mocks/types'

interface TaskCardProps {
  ticket: Ticket
  assignees: User[]
}

const VISIBLE_TAGS = 2

export function TaskCard({ ticket, assignees }: TaskCardProps) {
  const visibleTags = ticket.tags.slice(0, VISIBLE_TAGS)
  const extraTags = ticket.tags.length - visibleTags.length

  return (
    <article className="flex flex-col gap-3 rounded-md border border-subtle bg-surface p-3 shadow-[var(--shadow-1)]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-caption text-fg-2">{ticket.key}</span>
        {ticket.archived && <Badge>Archivado</Badge>}
      </div>

      <p className="text-body-sm font-medium">{ticket.title}</p>

      <div className="flex flex-wrap items-center gap-2">
        <PriorityTag priority={ticket.priority} />
        {visibleTags.map((tag) => (
          <span key={tag} className="rounded-sm bg-canvas px-1.5 py-0.5 text-caption text-fg-2">
            {tag}
          </span>
        ))}
        {extraTags > 0 && <span className="text-caption text-fg-2">+{extraTags}</span>}
      </div>

      <div className="flex items-center justify-between gap-2">
        <AvatarStack users={assignees} label="Responsables" />
        {ticket.dueDate && <span className="text-caption text-fg-2">{ticket.dueDate}</span>}
      </div>
    </article>
  )
}
