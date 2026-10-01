import { ProjectCard } from '../molecules/ProjectCard'
import type { Project, User } from '../../mocks/types'

interface ProjectGridProps {
  projects: Project[]
  users: Map<string, User>
}

export function ProjectGrid({ projects, users }: ProjectGridProps) {
  if (projects.length === 0) {
    return <p className="text-body text-fg-2">No hay proyectos.</p>
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
        const owner = users.get(project.creatorId)
        if (!owner) return null
        return (
          <li key={project.id}>
            <ProjectCard project={project} owner={owner} to={`/projects/${project.id}/board`} />
          </li>
        )
      })}
    </ul>
  )
}
