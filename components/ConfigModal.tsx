'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import type { ScraperConfig } from '@/lib/types'

type ConfigModalProps = {
  isOpen: boolean
  onClose: () => void
}

async function authFetch(path: string, init?: RequestInit) {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    window.location.href = '/auth'
    throw new Error('No session')
  }
  return fetch(path, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  })
}

export function ConfigModal({ isOpen, onClose }: ConfigModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [apify_token, setApifyToken] = useState('')
  const [actor_id, setActorId] = useState('apify/google-maps-scraper')
  const [max_items, setMaxItems] = useState(50)

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await authFetch('/api/config')
        const json = (await res.json()) as {
          config?: ScraperConfig | null
          error?: string
        }
        if (!res.ok) {
          toast.error(json.error ?? 'Error al cargar configuración')
          return
        }
        const c = json.config
        if (cancelled || !c) return
        setApifyToken(c.apify_token ?? '')
        setActorId(c.actor_id || 'apify/google-maps-scraper')
        setMaxItems(c.max_items ?? 50)
      } catch {
        toast.error('Error al cargar configuración')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [isOpen])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authFetch('/api/config', {
        method: 'POST',
        body: JSON.stringify({
          apify_token: apify_token.trim() || null,
          actor_id: actor_id.trim() || 'apify/google-maps-scraper',
          max_items: Number(max_items) || 50,
        }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) {
        toast.error(json.error ?? 'No se pudo guardar')
        return
      }
      toast.success('Configuración guardada')
      onClose()
    } catch {
      toast.error('No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-950"
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Configuración Apify
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                API token (Apify)
              </label>
              <div className="relative flex gap-2">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={apify_token}
                  onChange={(e) => setApifyToken(e.target.value)}
                  autoComplete="off"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                  placeholder="apify_api_…"
                />
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  aria-label={showToken ? 'Ocultar' : 'Mostrar'}
                >
                  {showToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Actor ID
              </label>
              <input
                value={actor_id}
                onChange={(e) => setActorId(e.target.value)}
                autoComplete="off"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Resultados máximos por ciudad
              </label>
              <input
                type="number"
                min={1}
                value={max_items}
                onChange={(e) => setMaxItems(Number(e.target.value))}
                autoComplete="off"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
