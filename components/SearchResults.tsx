'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Badge } from '@/components/Badge'
import { useSearchTasks } from '@/hooks/useSearchTasks'

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export function SearchResults() {
  const { tasks, loading, fetchTasks, getSearchStatus } = useSearchTasks()
  const tasksRef = useRef(tasks)
  tasksRef.current = tasks

  const initRef = useRef(false)
  const prevStatusRef = useRef<Record<string, string>>({})

  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true
      tasks.forEach((t) => {
        prevStatusRef.current[t.id] = t.status
      })
      return
    }
    for (const t of tasks) {
      const prev = prevStatusRef.current[t.id]
      if (prev && prev !== 'completed' && t.status === 'completed') {
        toast.success(`Búsqueda "${t.name}" completada`)
      }
      prevStatusRef.current[t.id] = t.status
    }
  }, [tasks])

  useEffect(() => {
    const interval = setInterval(() => {
      const cur = tasksRef.current
      const active = cur.filter(
        (t) => t.status === 'running' || t.status === 'pending'
      )
      if (active.length === 0) return
      void (async () => {
        for (const t of active) {
          await getSearchStatus(t.id)
        }
      })()
    }, 5000)

    return () => clearInterval(interval)
  }, [getSearchStatus])

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
        No hay búsquedas todavía.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
          <tr>
            <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
              Nombre
            </th>
            <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
              Estado
            </th>
            <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
              Marcas
            </th>
            <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
              Fecha
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {tasks.map((t) => (
            <tr key={t.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30">
              <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                {t.name}
              </td>
              <td className="px-4 py-3">
                <Badge status={t.status}>{t.status}</Badge>
              </td>
              <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-400">
                {t.brands_found}
              </td>
              <td className="px-4 py-3 text-zinc-500">
                {formatDate(t.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
