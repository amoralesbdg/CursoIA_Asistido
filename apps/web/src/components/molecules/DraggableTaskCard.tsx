import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { TaskCard } from './TaskCard'
import type { Ticket, User } from '../../mocks/types'

interface DraggableTaskCardProps {
  ticket: Ticket
  assignees: User[]
}

export function DraggableTaskCard({ ticket, assignees }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0 : 1,
      }}
    >
      <TaskCard ticket={ticket} assignees={assignees} />
    </div>
  )
}
