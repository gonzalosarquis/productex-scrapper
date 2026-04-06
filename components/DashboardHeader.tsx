'use client'

import type { User } from '@supabase/supabase-js'
import { LogOut, Menu, Settings } from 'lucide-react'

type DashboardHeaderProps = {
  user: User
  onConfigClick: () => void
  onLogout: () => void
  onMenuClick?: () => void
}

export function DashboardHeader({
  user,
  onConfigClick,
  onLogout,
  onMenuClick,
}: DashboardHeaderProps) {
  const label = user.email ?? user.user_metadata?.full_name ?? user.id

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex min-w-0 items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Productex Scrapper
          </p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onConfigClick}
          className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          title="Configuración"
          aria-label="Configuración"
        >
          <Settings className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
