'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Eye, Loader2, Pencil, Trash2 } from 'lucide-react'

export type ColumnDef<T> = {
  key: string
  label: string
  render: (row: T) => ReactNode
  className?: string
}

type VirtualTableProps<T> = {
  data: T[]
  columns: ColumnDef<T>[]
  onView: (row: T) => void
  onEdit: (row: T) => void
  onDelete: (row: T) => void
  loading?: boolean
  emptyMessage: string
  getRowId: (row: T) => string
}

const PAGE = 50

export function VirtualTable<T>({
  data,
  columns,
  onView,
  onEdit,
  onDelete,
  loading,
  emptyMessage,
  getRowId,
}: VirtualTableProps<T>) {
  const [page, setPage] = useState(0)

  const { rows, totalPages, safePage, showPagination } = useMemo(() => {
    const usePagination = data.length > PAGE
    const totalPages = Math.max(1, Math.ceil(data.length / PAGE))
    const safePage = Math.min(page, totalPages - 1)
    const start = safePage * PAGE
    const rows = usePagination
      ? data.slice(start, start + PAGE)
      : data
    return {
      rows,
      totalPages,
      safePage,
      showPagination: usePagination,
    }
  }, [data, page])

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(data.length / PAGE))
    setPage((p) => Math.min(p, Math.max(0, totalPages - 1)))
  }, [data.length])

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3">
              <div className="h-4 flex-1 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-4 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-4 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 border-t border-zinc-200 py-4 dark:border-zinc-800">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 py-12 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`whitespace-nowrap px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300 ${c.className ?? ''}`}
                >
                  {c.label}
                </th>
              ))}
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((row) => (
              <tr
                key={getRowId(row)}
                className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-3 text-zinc-800 dark:text-zinc-200 ${c.className ?? ''}`}
                  >
                    {c.render(row)}
                  </td>
                ))}
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onView(row)}
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      title="Ver"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(row)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800">
          <span className="text-zinc-500">
            Página {safePage + 1} de {totalPages} · {data.length} filas
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 font-medium hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 font-medium hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
