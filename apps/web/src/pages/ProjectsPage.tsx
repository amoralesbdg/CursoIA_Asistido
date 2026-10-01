import { ProjectGrid } from '../components/organisms/ProjectGrid'
import { projects, users } from '../mocks'

export function ProjectsPage() {
  const userMap = new Map(users.map((u) => [u.id, u]))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-headline font-semibold">Proyectos</h1>
      <ProjectGrid projects={projects} users={userMap} />
    </div>
  )
}
