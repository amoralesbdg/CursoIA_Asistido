import { useDroppable } from '@dnd-kit/core'
import { DraggableTaskCard } from '../molecules/DraggableTaskCard'
import { useUsersById } from '../../store/selectors'
import type { Status, Ticket, User } from '../../mocks/types'

interface KanbanColumnProps {
  status: Status
  label: string
  dotColor: string
  tickets: Ticket[]
}

export function KanbanColumn({ status, label, dotColor, tickets }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: status, data: { status } })
  const usersById = useUsersById()

  return (
    <section
      ref={setNodeRef}
      className="flex min-h-48 flex-col gap-3 rounded-lg border-2 border-transparent bg-subtle/40 p-4"
    >
      <header className="flex items-center gap-2">
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: dotColor }} />
        <h3 className="text-body font-semibold">{label}</h3>
        <span className="ml-auto rounded-full border border-subtle bg-surface px-2 py-0.5 text-caption text-fg-2">
          {tickets.length}
        </span>
      </header>

      <div className="flex flex-col gap-3">
        {tickets.length === 0 ? (
          <p className="text-caption text-fg-2">Sin tickets</p>
        ) : (
          tickets.map((ticket) => (
            <DraggableTaskCard
              key={ticket.id}
              ticket={ticket}
              assignees={ticket.assigneeIds
                .map((id) => usersById.get(id))
                .filter((u): u is User => !!u)}
            />
          ))
        )}
      </div>
    </section>
  )
}
