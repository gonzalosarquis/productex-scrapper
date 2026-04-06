'use client'

import { useCallback, useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

import { useSearchTasks } from '@/hooks/useSearchTasks'
import type { SearchFormData } from '@/lib/types'

const PRESET_CATEGORIES = [
  { label: 'Clothing (Brand)', value: 'Clothing' },
  { label: 'Boutique', value: 'Boutique' },
  { label: 'Tienda de ropa', value: 'Tienda de ropa' },
  { label: 'Fashion Designer', value: 'Fashion Designer' },
  { label: 'Clothing Store', value: 'Clothing Store' },
  { label: 'Sportswear Store', value: 'Sportswear' },
  { label: 'Underwear/Lingerie', value: 'Underwear' },
  { label: 'Shopping & Retail', value: 'Shopping' },
] as const

type SearchFormProps = {
  onSearchComplete?: () => void
}

function ChipInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string
  values: string[]
  onChange: (next: string[]) => void
  placeholder?: string
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
  const [categories, setCategories] = useState<string[]>([])
  const [customCategoryInput, setCustomCategoryInput] = useState('')
  const [minFollowers, setMinFollowers] = useState('1000')
  const [maxFollowers, setMaxFollowers] = useState('')
  const [countries, setCountries] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [submitCooldown, setSubmitCooldown] = useState(false)

  const togglePreset = useCallback((value: string) => {
    setCategories((prev) =>
      prev.includes(value)
        ? prev.filter((x) => x !== value)
        : [...prev, value]
    )
  }, [])

  const addCustomCategory = useCallback(() => {
    const v = customCategoryInput.trim()
    if (!v) return
    setCategories((prev) => (prev.includes(v) ? prev : [...prev, v]))
    setCustomCategoryInput('')
  }, [customCategoryInput])

  const removeCategory = (v: string) => {
    setCategories((prev) => prev.filter((x) => x !== v))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const n = name.trim()
    if (!n) {
      toast.error('Nombre requerido')
      return
    }
    if (categories.some((c) => c.length > 50)) {
      toast.error('Categorías máximo 50 caracteres')
      return
    }

    const min = Number(minFollowers)
    if (!Number.isFinite(min) || min <= 0) {
      toast.error('Seguidores debe ser positivo')
      return
    }

    const maxRaw = maxFollowers.trim()
    if (maxRaw !== '') {
      const max = Number(maxRaw)
      if (!Number.isFinite(max) || max < min) {
        toast.error('Seguidores máximos debe ser mayor o igual al mínimo.')
        return
      }
    }

    setSubmitCooldown(true)
    setTimeout(() => setSubmitCooldown(false), 3000)

    const data: SearchFormData = {
      name: n,
      categories,
      countries,
      cities,
      min_followers: min,
      max_followers: maxFollowers.trim(),
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
          El scrape usa hashtags de moda en Argentina; las categorías filtran
          cuentas business de Instagram por rubro de negocio. Vacío = todas las
          categorías de moda predefinidas.
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
          placeholder="Ej. Marcas streetwear AR"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Categorías de Instagram (opcional)
        </label>
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          Elegí presets o agregá categorías personalizadas. Sin selección se
          aplican todas las categorías de moda predefinidas al filtrar.
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESET_CATEGORIES.map(({ label, value }) => {
            const selected = categories.includes(value)
            return (
              <button
                key={value}
                type="button"
                onClick={() => togglePreset(value)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  selected
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border-zinc-300 bg-transparent text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Categoría personalizada
          </label>
          <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-200 bg-zinc-50/80 p-2 dark:border-zinc-700 dark:bg-zinc-900/50">
            <div className="flex min-w-[12rem] flex-1 items-center gap-1">
              <input
                value={customCategoryInput}
                onChange={(e) => setCustomCategoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomCategory()
                  }
                }}
                placeholder="Ej. Moda infantil + Enter"
                className="min-w-0 flex-1 rounded-md border-0 bg-transparent px-2 py-1 text-sm outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={addCustomCategory}
                className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
                aria-label="Añadir categoría"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Seleccionadas ({categories.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-sm shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-600"
                >
                  {v}
                  <button
                    type="button"
                    onClick={() => removeCategory(v)}
                    className="rounded p-0.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    aria-label={`Quitar ${v}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="min-f"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Seguidores mínimos
          </label>
          <input
            id="min-f"
            type="number"
            min={1}
            value={minFollowers}
            onChange={(e) => setMinFollowers(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label
            htmlFor="max-f"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Seguidores máximos (opcional)
          </label>
          <input
            id="max-f"
            type="number"
            min={1}
            value={maxFollowers}
            onChange={(e) => setMaxFollowers(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
            placeholder="Vacío = sin límite"
          />
        </div>
      </div>

      <ChipInput
        label="Países"
        values={countries}
        onChange={setCountries}
        placeholder="Ej. Argentina"
      />
      <ChipInput
        label="Ciudades"
        values={cities}
        onChange={setCities}
        placeholder="Ej. Córdoba"
      />

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
