'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Loader2, MapPin, Phone, Star, X } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/Badge'
import type { Brand } from '@/lib/types'

/** Formato general: dígitos, espacios y símbolos típicos de teléfono */
const PHONE_RE = /^[+()\d][\d\s().-]{7,}$/

const STATUS_OPTIONS: Brand['status'][] = [
  'pending',
  'contacted',
  'interested',
  'rejected',
  'client',
]

type BrandModalProps = {
  brand: Brand | null
  isOpen: boolean
  readOnly?: boolean
  onClose: () => void
  onSave: (id: string, data: Partial<Brand>) => Promise<unknown>
}

export function BrandModal({
  brand,
  isOpen,
  readOnly,
  onClose,
  onSave,
}: BrandModalProps) {
  const [status, setStatus] = useState<Brand['status']>('pending')
  const [notes, setNotes] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!brand) return
    setStatus(brand.status)
    setNotes(brand.notes ?? '')
    setPhone(brand.phone ?? '')
  }, [brand])

  if (!isOpen || !brand) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (readOnly || !brand) return
    const ph = phone.trim()

    if (ph && !PHONE_RE.test(ph)) {
      toast.error('Teléfono inválido')
      return
    }

    setSaving(true)
    try {
      await onSave(brand.id, {
        status,
        notes: notes.trim() || null,
        phone: ph || null,
      })
      toast.success('Tienda actualizada')
      onClose()
    } catch {
      toast.error('No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const ratingStars =
    brand.rating != null
      ? `${'⭐'.repeat(Math.min(5, Math.round(brand.rating)))} ${brand.rating.toFixed(1)}`
      : '—'

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
        className="relative z-10 my-8 w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-950"
      >
        <div className="flex items-start justify-between gap-2 border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {brand.name}
            </h2>
            {brand.category && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {brand.category}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge status={brand.status}>{brand.status}</Badge>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/50">
            <Star className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {ratingStars}
              </p>
              <p className="text-xs text-zinc-500">
                {brand.reviews_count != null
                  ? `${brand.reviews_count} reseñas`
                  : 'Sin datos de reseñas'}
              </p>
            </div>
          </div>

          {(brand.address || brand.city) && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              <p className="text-zinc-700 dark:text-zinc-300">
                {[brand.address, brand.city].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
          )}

          {brand.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-zinc-400" />
              <a
                href={`tel:${brand.phone.replace(/\s/g, '')}`}
                className="text-sky-600 hover:underline dark:text-sky-400"
              >
                {brand.phone}
              </a>
            </div>
          )}

          {brand.instagram_url && (
            <p>
              <a
                href={brand.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="text-pink-600 hover:underline dark:text-pink-400"
              >
                Instagram →
              </a>
            </p>
          )}

          {brand.website && (
            <p>
              <a
                href={brand.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sky-600 hover:underline dark:text-sky-400"
              >
                Sitio web
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </p>
          )}

          {brand.google_maps_url && (
            <p>
              <a
                href={brand.google_maps_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sky-600 hover:underline dark:text-sky-400"
              >
                Abrir en Google Maps
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Estado
            </label>
            <select
              value={status}
              disabled={readOnly}
              onChange={(e) => setStatus(e.target.value as Brand['status'])}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Notas
            </label>
            <textarea
              value={notes}
              disabled={readOnly}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Teléfono (editable)
            </label>
            <input
              value={phone}
              disabled={readOnly}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-200"
            >
              {readOnly ? 'Cerrar' : 'Cancelar'}
            </button>
            {!readOnly && (
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
