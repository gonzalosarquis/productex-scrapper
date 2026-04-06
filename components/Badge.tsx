'use client'

import type { ReactNode } from 'react'

export type BadgeVariant = 'success' | 'warning' | 'info' | 'danger' | 'default'

const variantClasses: Record<BadgeVariant, string> = {
  success:
    'bg-emerald-100 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300',
  warning:
    'bg-amber-100 text-amber-900 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-200',
  info: 'bg-sky-100 text-sky-900 ring-sky-600/20 dark:bg-sky-950/50 dark:text-sky-200',
  danger:
    'bg-red-100 text-red-800 ring-red-600/20 dark:bg-red-950/50 dark:text-red-200',
  default:
    'bg-zinc-100 text-zinc-700 ring-zinc-500/15 dark:bg-zinc-800 dark:text-zinc-300',
}

export function statusToVariant(status: string): BadgeVariant {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'contacted':
      return 'info'
    case 'interested':
      return 'success'
    case 'rejected':
    case 'failed':
      return 'danger'
    case 'completed':
    case 'client':
      return 'success'
    case 'running':
      return 'info'
    default:
      return 'default'
  }
}

type BadgeProps = {
  variant?: BadgeVariant
  status?: string
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'default', status, children, className = '' }: BadgeProps) {
  const v = status !== undefined ? statusToVariant(status) : variant
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${variantClasses[v]} ${className}`}
    >
      {children}
    </span>
  )
}
