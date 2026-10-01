import { useParams } from 'react-router-dom'
import { KanbanBoard } from '../components/organisms/KanbanBoard'
import { projects } from '../mocks'

export function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const project = projects.find((p) => p.id === projectId)

  if (!project) {
    return <p className="text-body text-fg-2">Proyecto no encontrado.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-headline font-semibold">{project.name}</h1>
      <KanbanBoard projectId={project.id} />
    </div>
  )
}
