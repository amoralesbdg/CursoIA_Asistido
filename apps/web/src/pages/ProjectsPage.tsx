import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ProjectGrid } from '../components/organisms/ProjectGrid'
import { getProjects, getUsers } from '../lib/api'

export function ProjectsPage() {
  const { data: projectsPage, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects(),
  })

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  })

  const userMap = useMemo(() => new Map((users ?? []).map((u) => [u.id, u])), [users])

  if (isLoadingProjects || isLoadingUsers) {
    return <p className="text-body text-fg-2">Cargando proyectos…</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-headline font-semibold">Proyectos</h1>
      <ProjectGrid projects={projectsPage?.items ?? []} users={userMap} />
    </div>
  )
}
