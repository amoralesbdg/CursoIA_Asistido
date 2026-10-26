import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { KanbanBoard } from '../components/organisms/KanbanBoard'
import { getProject } from '../lib/api'

export function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId!),
    enabled: !!projectId,
  })

  if (isLoading) {
    return <p className="text-body text-fg-2">Cargando proyecto…</p>
  }

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
