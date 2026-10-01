import { useMemo } from 'react'
import { users } from '../mocks'
import type { User } from '../mocks/types'

export function useUsersById(): Map<string, User> {
  return useMemo(() => new Map(users.map((u) => [u.id, u])), [])
}
