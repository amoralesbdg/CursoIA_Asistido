import { useState } from "react";
import { AppShell } from "./components/AppShell";
import { ThemeToggle } from "./components/ThemeToggle";
import { INITIAL_COMMENTS, INITIAL_PROJECTS, INITIAL_TICKETS, type Comment, type Project, type Role, type Status, type Ticket, type User } from "./data/mock";
import { AuthScreen } from "./screens/AuthScreen";
import { BoardScreen } from "./screens/board/BoardScreen";
import { ProjectsScreen } from "./screens/projects/ProjectsScreen";
import { useTheme } from "./theme/useTheme";

export default function App() {
  const theme = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>("user");
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [board, setBoard] = useState<string | null>(null);

  const move = (id: string, to: Status) =>
    setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, status: to } : t)));
  const upsert = (t: Ticket) =>
    setTickets((ts) => (ts.some((x) => x.id === t.id) ? ts.map((x) => (x.id === t.id ? t : x)) : [...ts, t]));
  const archive = (id: string, archived: boolean) =>
    setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, archived } : t)));
  const back = () => {
    setBoard(null);
    requestAnimationFrame(() => document.getElementById("projects-title")?.focus());
  };

  if (user) {
    return (
      <AppShell user={user} theme={theme.pref} onTheme={theme.set} onLogout={() => { setUser(null); setBoard(null); }}>
        {/* Se mantiene montada (oculta) para conservar su estado al volver del tablero. */}
        <div hidden={!!board}>
          <ProjectsScreen currentUser={user} role={role} onRoleChange={setRole} onOpenBoard={(p) => setBoard(p.id)}
            projects={projects} setProjects={setProjects} />
        </div>
        {board && (
          <BoardScreen key={board} originId={board} projects={projects} tickets={tickets} currentUser={user} role={role}
            onRoleChange={setRole} onMove={move} onBack={back} onUpsert={upsert} onArchive={archive}
            comments={comments} onComment={(ticketId, body) => setComments((cs) => [...cs, { id: `c${Date.now()}`, ticketId, authorId: user.id, body, createdAt: Date.now() }])} />
        )}
      </AppShell>
    );
  }
  return (
    <div className="min-h-dvh bg-canvas text-fg">
      <header className="flex justify-end p-4"><ThemeToggle value={theme.pref} onChange={theme.set} /></header>
      <main className="grid min-h-[calc(100dvh-72px)] place-items-center pb-12">
        <AuthScreen onAuthenticated={(name) => setUser({ id: "u1", name, email: `${name}@example.com` })} />
      </main>
    </div>
  );
}
