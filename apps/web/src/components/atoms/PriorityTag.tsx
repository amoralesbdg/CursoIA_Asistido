import type { Priority } from '../../mocks/types'
import { PRIORITY_LABEL } from '../../mocks/types'

const COLOR: Record<Priority, string> = {
  high: 'var(--priority-high)',
  medium: 'var(--priority-medium)',
  low: 'var(--priority-low)',
}

export function PriorityTag({ priority }: { priority: Priority }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-subtle px-2 py-0.5 text-caption font-medium">
      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill={COLOR[priority]}>
        <path d="M5 3v18h2v-7h11l-3-4 3-4H7V3z" />
      </svg>
      {PRIORITY_LABEL[priority]}
    </span>
  )
}
