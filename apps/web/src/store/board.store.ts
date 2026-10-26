import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient, QueryKey } from '@tanstack/react-query'
import { STATUSES } from '../mocks/types'
import type { Status, Ticket } from '../mocks/types'
import { getProjectTickets, updateTicketStatus } from '../lib/api'

type GroupedTickets = Record<Status, Ticket[]>

const EMPTY_GROUPED = Object.fromEntries(
  STATUSES.map(({ id }) => [id, [] as Ticket[]]),
) as GroupedTickets

function projectTicketsQueryKey(projectId: string) {
  return ['projectTickets', projectId] as const
}

export function useTicketsByStatus(projectId: string): GroupedTickets {
  const { data } = useQuery({
    queryKey: projectTicketsQueryKey(projectId),
    queryFn: () => getProjectTickets(projectId),
  })
  return data ?? EMPTY_GROUPED
}

function findCachedTicket(
  queryClient: QueryClient,
  ticketId: string,
): { queryKey: QueryKey; grouped: GroupedTickets; ticket: Ticket } | null {
  const cached = queryClient.getQueriesData<GroupedTickets>({ queryKey: ['projectTickets'] })
  for (const [queryKey, grouped] of cached) {
    if (!grouped) continue
    for (const list of Object.values(grouped)) {
      const ticket = list.find((t) => t.id === ticketId)
      if (ticket) return { queryKey, grouped, ticket }
    }
  }
  return null
}

function withTicketUpserted(grouped: GroupedTickets, ticket: Ticket): GroupedTickets {
  const next: GroupedTickets = { ...grouped }
  for (const status of Object.keys(next) as Status[]) {
    next[status] = next[status].filter((t) => t.id !== ticket.id)
  }
  next[ticket.status] = [...next[ticket.status], ticket]
  return next
}

interface MoveTicketVars {
  ticketId: string
  newStatus: Status
}

interface MoveTicketContext {
  queryKey: QueryKey
  previous: GroupedTickets
}

interface BoardState {
  moveTicket: (ticketId: string, newStatus: Status) => void
}

export function useBoardStore<T>(selector: (state: BoardState) => T): T {
  const queryClient = useQueryClient()

  const mutation = useMutation<Ticket, unknown, MoveTicketVars, MoveTicketContext | undefined>({
    mutationFn: ({ ticketId, newStatus }) => updateTicketStatus(ticketId, newStatus),

    onMutate: async ({ ticketId, newStatus }) => {
      const found = findCachedTicket(queryClient, ticketId)
      if (!found) return undefined

      const { queryKey, grouped, ticket } = found
      await queryClient.cancelQueries({ queryKey })

      queryClient.setQueryData<GroupedTickets>(
        queryKey,
        withTicketUpserted(grouped, { ...ticket, status: newStatus }),
      )

      return { queryKey, previous: grouped }
    },

    onError: (_err, _vars, context) => {
      if (context) queryClient.setQueryData(context.queryKey, context.previous)
    },

    onSuccess: (updatedTicket, _vars, context) => {
      const queryKey = context?.queryKey ?? projectTicketsQueryKey(updatedTicket.projectId)
      queryClient.setQueryData<GroupedTickets>(queryKey, (current) =>
        current ? withTicketUpserted(current, updatedTicket) : current,
      )
    },
  })

  const state: BoardState = {
    moveTicket: (ticketId, newStatus) => {
      const found = findCachedTicket(queryClient, ticketId)
      if (!found || found.ticket.status === newStatus) return
      mutation.mutate({ ticketId, newStatus })
    },
  }

  return selector(state)
}
