import type { ReactNode } from 'react'

interface Props {
  variant?: 'neutral' | 'accent'
  children: ReactNode
}

const VARIANTS = {
  neutral: 'border border-subtle bg-canvas text-fg',
  accent: 'bg-action text-on-accent',
}

export function Badge({ variant = 'neutral', children }: Props) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-caption font-medium ${VARIANTS[variant]}`}>
      {children}
    </span>
  )
}
