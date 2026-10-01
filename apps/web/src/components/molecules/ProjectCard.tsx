import { Link } from 'react-router-dom'
import { Avatar } from '../atoms/Avatar'
import { Badge } from '../atoms/Badge'
import type { Project, User } from '../../mocks/types'

interface ProjectCardProps {
  project: Project
  owner: User
  ticketCount?: number
  to?: string
}

export function ProjectCard({ project, owner, ticketCount, to }: ProjectCardProps) {
  const n = ticketCount ?? project.ticketCount
  const content = (
    <article className="flex flex-col gap-4 rounded-md border border-subtle bg-surface p-4 shadow-[var(--shadow-1)]">
      <div>
        <h2 className="text-title-sm font-semibold">{project.name}</h2>
        {project.description && <p className="mt-1 text-body-sm text-fg-2">{project.description}</p>}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-body-sm text-fg-2">
          <Avatar user={owner} />
          <span>{owner.name}</span>
        </div>
        <Badge>{n} {n === 1 ? 'ticket' : 'tickets'}</Badge>
      </div>
    </article>
  )

  if (!to) return content

  return (
    <Link to={to} className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-action)]">
      {content}
    </Link>
  )
}
