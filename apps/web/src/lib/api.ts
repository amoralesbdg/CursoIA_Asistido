import type { Priority, Project, Status, Ticket, User } from '../mocks/types'

const API_BASE_URL = import.meta.env.VITE_API_URL

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ApiProblem {
  type: string
  title: string
  status: number
  detail: string
  instance: string
}

export class ApiError extends Error {
  problem: ApiProblem

  constructor(problem: ApiProblem) {
    super(problem.detail || problem.title)
    this.name = 'ApiError'
    this.problem = problem
  }
}

const AUTH_TOKEN_KEY = 'minijira.authToken'

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthToken(token: string | null): void {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token)
  else localStorage.removeItem(AUTH_TOKEN_KEY)
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | undefined> | object
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query } = options

  const url = new URL(`${API_BASE_URL}${path}`)
  if (query) {
    for (const [key, value] of Object.entries(query as Record<string, string | number | undefined>)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getAuthToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const problem = (await res.json().catch(() => null)) as ApiProblem | null
    throw new ApiError(
      problem ?? {
        type: 'https://miniJira.dev/errors/internal-error',
        title: 'Error inesperado',
        status: res.status,
        detail: res.statusText,
        instance: path,
      },
    )
  }

  const envelope = (await res.json()) as { data: T; error: null }
  return envelope.data
}

// --- Auth (P0) ---

export function register(payload: { username: string; password: string; email: string }) {
  return request<{ user: User; token: string }>('/auth/register', { method: 'POST', body: payload })
}

export function login(payload: { username: string; password: string }) {
  return request<{ user: User; token: string }>('/auth/login', { method: 'POST', body: payload })
}

// --- Projects (P0) ---

export function getProjects(params?: { page?: number; pageSize?: number }) {
  return request<Paginated<Project>>('/projects', { query: params })
}

export function getProject(projectId: string) {
  return request<Project>(`/projects/${projectId}`)
}

// --- Users (P1) ---

export function getUsers() {
  return request<User[]>('/users')
}

// --- Tickets (P0) ---

export function getProjectTickets(projectId: string): Promise<Record<Status, Ticket[]>>
export function getProjectTickets(projectId: string, status: Status): Promise<Ticket[]>
export function getProjectTickets(projectId: string, status?: Status) {
  return request<Record<Status, Ticket[]> | Ticket[]>(`/projects/${projectId}/tickets`, {
    query: { status },
  })
}

export function updateTicketStatus(ticketId: string, status: Status) {
  return request<Ticket>(`/tickets/${ticketId}/status`, { method: 'PATCH', body: { status } })
}

// --- Tickets (P1) ---
//
// Nota: el contrato (docs/api-contract.md) describe `creatorId`/`actorId` como derivados del JWT,
// pero el backend aún no valida Authorization (ver comentarios en los schema.ts de apps/api) — por
// ahora estos campos se declaran explícitamente en el request, igual que hace el backend.

export interface TicketFilters {
  projectId?: string
  priority?: Priority
  assigneeId?: string
  tag?: string
  dueDateFrom?: string
  dueDateTo?: string
  page?: number
  pageSize?: number
}

export function getTickets(filters?: TicketFilters) {
  return request<Paginated<Ticket>>('/tickets', { query: filters })
}

export interface CreateTicketPayload {
  title: string
  description?: string
  projectId: string
  priority: Priority
  assigneeIds?: string[]
  tags?: string[]
  dueDate?: string
  creatorId: string
}

export function createTicket(payload: CreateTicketPayload) {
  return request<Ticket>('/tickets', { method: 'POST', body: payload })
}

export interface UpdateTicketPayload {
  actorId: string
  title?: string
  description?: string
  priority?: Priority
  assigneeIds?: string[]
  tags?: string[]
  dueDate?: string
}

export function updateTicket(ticketId: string, payload: UpdateTicketPayload) {
  return request<Ticket>(`/tickets/${ticketId}`, { method: 'PATCH', body: payload })
}

export function archiveTicket(ticketId: string, actorId: string) {
  return request<Ticket>(`/tickets/${ticketId}`, { method: 'DELETE', query: { actorId } })
}

export function addAssignee(ticketId: string, userId: string) {
  return request<Ticket>(`/tickets/${ticketId}/assignees`, { method: 'POST', body: { userId } })
}

// --- Projects (P1) ---

export interface CreateProjectPayload {
  name: string
  description?: string
  creatorId: string
}

export function createProject(payload: CreateProjectPayload) {
  return request<Project>('/projects', { method: 'POST', body: payload })
}

export function addProjectMember(projectId: string, userId: string, actorId: string) {
  return request<Project>(`/projects/${projectId}/members`, {
    method: 'POST',
    body: { userId, actorId },
  })
}
