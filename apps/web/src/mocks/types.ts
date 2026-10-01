export type Status = 'todo' | 'in-progress' | 'review' | 'done'
export type Priority = 'high' | 'medium' | 'low'
export type Role = 'admin' | 'user'

export const STATUSES: { id: Status; label: string }[] = [
  { id: 'todo', label: 'Por hacer' },
  { id: 'in-progress', label: 'En progreso' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Terminado' },
]

export const PRIORITY_LABEL: Record<Priority, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

export interface User {
  id: string
  name: string
  email: string
  role?: Role
}

export interface Project {
  id: string
  name: string
  /** NUEVO: no existe en prototype/ ni en frontend-specs.md — añadido para esta vista. */
  description?: string
  creatorId: string
  memberIds: string[]
  ticketCount: number
}
// "Responsable" en ProjectCard = el User resuelto desde `creatorId` (no existe un
// campo de owner propio en el modelo — ver architecture/er_diagram.md).

export interface Ticket {
  id: string
  key: string
  projectId: string
  title: string
  description?: string
  status: Status
  priority: Priority
  assigneeIds: string[]
  creatorId: string
  tags: string[]
  dueDate?: string
  archived?: boolean
}
