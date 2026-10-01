import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/organisms/Sidebar'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectBoardPage } from './pages/ProjectBoardPage'
import { users } from './mocks'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-dvh bg-canvas text-fg">
        <Sidebar items={[{ id: 'projects', label: 'Proyectos', active: true }]} user={users[0]} />
        <main className="mx-auto w-full max-w-[1280px] px-4 py-8 md:px-6">
          <Routes>
            <Route path="/" element={<ProjectsPage />} />
            <Route path="/projects/:projectId/board" element={<ProjectBoardPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
