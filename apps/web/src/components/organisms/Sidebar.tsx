import type { ReactNode } from 'react'
import { Avatar } from '../atoms/Avatar'
import type { User } from '../../mocks/types'

interface SidebarItem {
  id: string
  label: string
  href?: string
  active?: boolean
  icon?: ReactNode
}

interface SidebarProps {
  items: SidebarItem[]
  user?: Pick<User, 'id' | 'name'>
  brand?: string
}

export function Sidebar({ items, user, brand = 'Mini Jira' }: SidebarProps) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-subtle bg-surface">
      <div className="flex items-center gap-2 px-4 py-4 text-title-sm font-semibold">
        <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-action text-on-accent">
          M
        </span>
        <span>{brand}</span>
      </div>

      <nav aria-label="Principal" className="flex flex-1 flex-col gap-1 px-2">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href ?? '#'}
            aria-current={item.active ? 'page' : undefined}
            className={`flex items-center gap-2 rounded-sm px-3 py-2 text-body font-medium ${
              item.active ? 'bg-canvas text-fg' : 'text-fg-2 hover:bg-canvas hover:text-fg'
            }`}
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>

      {user && (
        <div className="flex items-center gap-2 border-t border-subtle px-4 py-4 text-body-sm">
          <Avatar user={user} />
          <span>{user.name}</span>
        </div>
      )}
    </aside>
  )
}
