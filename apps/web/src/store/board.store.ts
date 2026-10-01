import { useMemo } from 'react'
import { create } from 'zustand'
import { tickets as initialTickets } from '../mocks'
import { STATUSES } from '../mocks/types'
import type { Status, Ticket } from '../mocks/types'
import { simulatePatchStatus } from './simulateNetwork'

interface BoardState {
  tickets: Ticket[]
  moveTicket: (ticketId: string, newStatus: Status) => void
}

export const useBoardStore = create<BoardState>((set, get) => ({
  tickets: initialTickets,

  moveTicket: (ticketId, newStatus) => {
    const previousTickets = get().tickets
    const ticket = previousTickets.find((t) => t.id === ticketId)
    if (!ticket || ticket.status === newStatus) return

    set({
      tickets: previousTickets.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)),
    })

    simulatePatchStatus().catch(() => {
      set({ tickets: previousTickets })
    })
  },
}))

function groupByStatus(tickets: Ticket[]): Record<Status, Ticket[]> {
  const grouped = Object.fromEntries(STATUSES.map(({ id }) => [id, [] as Ticket[]])) as Record<
    Status,
    Ticket[]
  >
  for (const ticket of tickets) {
    grouped[ticket.status].push(ticket)
  }
  return grouped
}

export function useTicketsByStatus(projectId: string): Record<Status, Ticket[]> {
  const tickets = useBoardStore((state) => state.tickets)
  return useMemo(
    () => groupByStatus(tickets.filter((t) => t.projectId === projectId)),
    [tickets, projectId],
  )
}
