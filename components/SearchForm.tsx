'use client'

import { useCallback, useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

import { useSearchTasks } from '@/hooks/useSearchTasks'
import type { SearchFormData } from '@/lib/types'

type SearchFormProps = {
  onSearchComplete?: () => void
}

function ChipInput({
  label,
  values,
  onChange,
  placeholder,
  hint,
}: {
  label: string
  values: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  hint?: string
}) {
  const [input, setInput] = useState('')

  const add = useCallback(() => {
    const v = input.trim()
    if (!v) return
    if (!values.includes(v)) onChange([...values, v])
    setInput('')
  }, [input, values, onChange])

  const remove = (v: string) => {
    onChange(values.filter((x) => x !== v))
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      {hint && (
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
      <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-200 bg-zinc-50/80 p-2 dark:border-zinc-700 dark:bg-zinc-900/50">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-sm shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-600"
          >
            {v}
            <button
              type="button"
              onClick={() => remove(v)}
              className="rounded p-0.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              aria-label={`Quitar ${v}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <div className="flex min-w-[12rem] flex-1 items-center gap-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                add()
              }
            }}
            placeholder={placeholder}
            className="min-w-0 flex-1 rounded-md border-0 bg-transparent px-2 py-1 text-sm outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={add}
            className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
            aria-label="Añadir"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function SearchForm({ onSearchComplete }: SearchFormProps) {
  const { startSearch, loading } = useSearchTasks()

  const [name, setName] = useState('')
  const [searchQuery, setSearchQuery] = useState('tienda de ropa')
  const [cities, setCities] = useState<string[]>([])
  const [minRating, setMinRating] = useState(3.5)
  const [maxResults, setMaxResults] = useState(20)
  const [submitCooldown, setSubmitCooldown] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const n = name.trim()
    if (!n) {
      toast.error('Nombre requerido')
      return
    }

    const sq = searchQuery.trim() || 'tienda de ropa'
    const mr = Math.min(100, Math.max(1, Math.round(maxResults)))

    setSubmitCooldown(true)
    setTimeout(() => setSubmitCooldown(false), 3000)

    const data: SearchFormData = {
      name: n,
      search_query: sq,
      cities,
      min_rating: minRating,
      max_results: mr,
    }

    await startSearch(data)
    onSearchComplete?.()
  }

  const disabled = loading || submitCooldown

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Nueva búsqueda
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Búsqueda en Google Maps vía Apify; encontrá tiendas de ropa y potenciales
          clientes wholesale.
        </p>
      </div>

      <div>
        <label
          htmlFor="search-name"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Nombre de la búsqueda
        </label>
        <input
          id="search-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900"
          placeholder="Ej. Tiendas CABA Q1"
        />
      </div>

      <div>
        <label
          htmlFor="biz-type"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Tipo de negocio
        </label>
        <input
          id="biz-type"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
          placeholder="ej: tienda de ropa, indumentaria, boutique"
        />
      </div>

      <ChipInput
        label="Ciudades"
        hint="Vacío = se usan las principales ciudades de Argentina (ver configuración del scraper)."
        values={cities}
        onChange={setCities}
        placeholder="ej: Buenos Aires"
      />

      <div>
        <label
          htmlFor="min-rating"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Rating mínimo de Google Maps: {minRating.toFixed(1)} ⭐
        </label>
        <input
          id="min-rating"
          type="range"
          min={0}
          max={5}
          step={0.5}
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
          className="w-full accent-zinc-900 dark:accent-zinc-100"
        />
        <div className="mt-1 flex justify-between text-xs text-zinc-500">
          <span>0</span>
          <span>5</span>
        </div>
      </div>

      <div>
        <label
          htmlFor="max-res"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Resultados máximos (por ciudad, máx. 100)
        </label>
        <input
          id="max-res"
          type="number"
          min={1}
          max={100}
          value={maxResults}
          onChange={(e) =>
            setMaxResults(Math.min(100, Math.max(1, Number(e.target.value) || 20)))
          }
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
        />
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Iniciar búsqueda
      </button>
    </form>
  )
}
