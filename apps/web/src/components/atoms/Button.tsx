import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  fullWidth?: boolean
}

const VARIANTS = {
  primary: 'bg-action text-on-accent hover:bg-action-hover',
  secondary: 'border border-input bg-surface text-fg hover:bg-canvas',
  danger: 'border border-critical-fg bg-surface text-critical-fg hover:bg-canvas',
}

export function Button({ variant = 'primary', fullWidth = true, className = '', ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-sm px-4 text-body font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${fullWidth ? 'w-full' : ''} ${VARIANTS[variant]} ${className}`}
    />
  )
}
