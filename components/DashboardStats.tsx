'use client'

import { useEffect } from 'react'
import { BarChart3, Loader2, Search, TrendingUp, Users } from 'lucide-react'

import { useBrands } from '@/hooks/useBrands'
import { useSearchTasks } from '@/hooks/useSearchTasks'

export function DashboardStats() {
  const { brands, loading: loadingBrands } = useBrands()
  const { tasks, loading: loadingTasks, fetchTasks } = useSearchTasks()

  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks])

  const loading = loadingBrands || loadingTasks

  const totalBrands = brands.length
  const contactedBrands = brands.filter((b) =>
    ['contacted', 'interested', 'client'].includes(b.status)
  ).length
  const interested = brands.filter((b) => b.status === 'interested').length
  const interestRate =
    totalBrands > 0 ? Math.round((interested / totalBrands) * 1000) / 10 : 0

  const activeSearches = tasks.filter(
    (t) => t.status === 'running' || t.status === 'pending'
  ).length

  const cards = [
    {
      label: 'Total Marcas',
      value: totalBrands,
      icon: Users,
      sub: 'en tu pipeline',
    },
    {
      label: 'Marcas Contactadas',
      value: contactedBrands,
      icon: TrendingUp,
      sub: 'contactadas o más',
    },
    {
      label: 'Tasa de Interés',
      value: `${interestRate}%`,
      icon: BarChart3,
      sub: 'marcas “interested”',
    },
    {
      label: 'Búsquedas Activas',
      value: activeSearches,
      icon: Search,
      sub: 'pending o running',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, sub }) => (
        <div
          key={label}
          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {label}
            </p>
            <Icon className="h-4 w-4 text-zinc-400" aria-hidden />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            ) : (
              <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {value}
              </p>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500">{sub}</p>
        </div>
      ))}
    </div>
  )
}
