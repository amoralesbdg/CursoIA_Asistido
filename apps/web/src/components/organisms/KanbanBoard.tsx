import { useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from '../molecules/TaskCard'
import { useTicketsByStatus, useBoardStore } from '../../store/board.store'
import { useUsersById } from '../../store/selectors'
import { STATUSES } from '../../mocks/types'
import type { Status, User } from '../../mocks/types'

interface KanbanBoardProps {
  projectId: string
}

const STATUS_DOT: Record<Status, string> = {
  todo: 'var(--status-todo)',
  'in-progress': 'var(--status-in-progress)',
  review: 'var(--status-review)',
  done: 'var(--status-done)',
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const ticketsByStatus = useTicketsByStatus(projectId)
  const moveTicket = useBoardStore((state) => state.moveTicket)
  const usersById = useUsersById()
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const allTickets = STATUSES.flatMap(({ id }) => ticketsByStatus[id])
  const activeTicket = allTickets.find((t) => t.id === activeTicketId)

  function handleDragStart(event: DragStartEvent) {
    setActiveTicketId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTicketId(null)
    const { active, over } = event
    if (!over) return
    moveTicket(active.id as string, over.id as Status)
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STATUSES.map(({ id, label }) => (
          <KanbanColumn
            key={id}
            status={id}
            label={label}
            dotColor={STATUS_DOT[id]}
            tickets={ticketsByStatus[id]}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTicket ? (
          <TaskCard
            ticket={activeTicket}
            assignees={activeTicket.assigneeIds
              .map((id) => usersById.get(id))
              .filter((u): u is User => !!u)}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
