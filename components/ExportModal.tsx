'use client'

import { useMemo, useState } from 'react'
import { Download, X } from 'lucide-react'
import { toast } from 'sonner'

import type { Brand } from '@/lib/types'

export type ExportColumnKey = keyof Brand

const ALL_COLUMNS: { key: ExportColumnKey; label: string }[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'address', label: 'Dirección' },
  { key: 'city', label: 'Ciudad' },
  { key: 'rating', label: 'Rating' },
  { key: 'reviews_count', label: 'Reseñas' },
  { key: 'instagram_url', label: 'Instagram' },
  { key: 'website', label: 'Web' },
  { key: 'google_maps_url', label: 'Google Maps' },
  { key: 'category', label: 'Categoría' },
  { key: 'status', label: 'Estado' },
  { key: 'score', label: 'Score' },
  { key: 'notes', label: 'Notas' },
]

type ExportModalProps = {
  brands: Brand[]
  isOpen: boolean
  onClose: () => void
}

function getCell(brand: Brand, key: ExportColumnKey): string {
  const v = brand[key]
  if (v === null || v === undefined) return ''
  if (typeof v === 'boolean') return v ? 'sí' : 'no'
  return String(v)
}

function toCsv(rows: Brand[], keys: ExportColumnKey[]): string {
  const header = keys.map((k) => ALL_COLUMNS.find((c) => c.key === k)?.label ?? k)
  const lines = [header.join(',')]
  for (const b of rows) {
    const line = keys.map((k) => {
      const cell = getCell(b, k)
      const escaped = `"${cell.replace(/"/g, '""')}"`
      return escaped
    })
    lines.push(line.join(','))
  }
  return lines.join('\n')
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportModal({ brands, isOpen, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv')
  const [selected, setSelected] = useState<Set<ExportColumnKey>>(
    () => new Set(ALL_COLUMNS.map((c) => c.key))
  )

  const keys = useMemo(() => ALL_COLUMNS.filter((c) => selected.has(c.key)), [selected])

  function toggle(key: ExportColumnKey) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleExport() {
    if (keys.length === 0) {
      toast.error('Selecciona al menos una columna')
      return
    }
    const cols = keys.map((c) => c.key)

    try {
      if (format === 'csv') {
        const csv = toCsv(brands, cols)
        downloadBlob(
          `productex-brands-${Date.now()}.csv`,
          csv,
          'text/csv;charset=utf-8'
        )
      } else {
        const payload = brands.map((b) => {
          const row: Record<string, unknown> = {}
          for (const k of cols) {
            row[k as string] = b[k as keyof Brand]
          }
          return row
        })
        downloadBlob(
          `productex-brands-${Date.now()}.json`,
          JSON.stringify(payload, null, 2),
          'application/json'
        )
      }
      toast.success('Archivo descargado')
      onClose()
    } catch {
      toast.error('No se pudo exportar')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 my-8 w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-950"
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Exportar tiendas
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {brands.length} registro{brands.length === 1 ? '' : 's'}
        </p>

        <div className="mt-4">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Formato
          </span>
          <div className="mt-2 flex gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
              <input
                type="radio"
                name="fmt"
                checked={format === 'csv'}
                onChange={() => setFormat('csv')}
              />
              CSV
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
              <input
                type="radio"
                name="fmt"
                checked={format === 'json'}
                onChange={() => setFormat('json')}
              />
              JSON
            </label>
          </div>
        </div>

        <div className="mt-4 max-h-48 overflow-y-auto rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
          <p className="mb-2 text-xs font-medium uppercase text-zinc-500">Columnas</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {ALL_COLUMNS.map((c) => (
              <label
                key={c.key}
                className="flex cursor-pointer items-center gap-2 text-zinc-800 dark:text-zinc-200"
              >
                <input
                  type="checkbox"
                  checked={selected.has(c.key)}
                  onChange={() => toggle(c.key)}
                />
                {c.label}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            <Download className="h-4 w-4" />
            Descargar
          </button>
        </div>
      </div>
    </div>
  )
}
