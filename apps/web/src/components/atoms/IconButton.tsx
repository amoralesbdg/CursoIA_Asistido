import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label: string
  size?: 32 | 36
}

export function IconButton({ icon, label, size = 36, className = '', ...rest }: Props) {
  return (
    <button
      {...rest}
      type={rest.type ?? 'button'}
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={`grid place-items-center rounded-sm text-fg-2 hover:bg-canvas hover:text-fg ${className}`}
    >
      {icon}
    </button>
  )
}
