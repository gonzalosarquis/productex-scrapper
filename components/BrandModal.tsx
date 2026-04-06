'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/Badge'
import type { Brand } from '@/lib/types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!brand) return
    setStatus(brand.status)
    setNotes(brand.notes ?? '')
    setEmail(brand.email ?? '')
    setPhone(brand.phone ?? '')
  }, [brand])

  if (!isOpen || !brand) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (readOnly || !brand) return
    const em = email.trim()
    const ph = phone.trim()

    if (em && !EMAIL_RE.test(em)) {
      toast.error('Email inválido')
      return
    }
    if (ph && !PHONE_RE.test(ph)) {
      toast.error('Teléfono inválido')
      return
    }

    setSaving(true)
    try {
      await onSave(brand.id, {
        status,
        notes: notes.trim() || null,
        email: em || null,
        phone: ph || null,
      })
      toast.success('Marca actualizada')
      onClose()
    } catch {
      toast.error('No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

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
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              @{brand.username}
            </h2>
            {brand.full_name && (
              <p className="text-sm text-zinc-500">{brand.full_name}</p>
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

        <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative h-24 w-24 shrink-0">
              {brand.profile_image ? (
                <Image
                  src={brand.profile_image}
                  alt=""
                  width={96}
                  height={96}
                  sizes="96px"
                  className="rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                  ?
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge status={brand.status}>{brand.status}</Badge>
                {brand.verified && (
                  <Badge variant="info">Verificado</Badge>
                )}
                {brand.is_business && (
                  <Badge variant="default">Business</Badge>
                )}
              </div>
              {brand.bio && (
                <p className="whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
                  {brand.bio}
                </p>
              )}
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-zinc-500">Seguidores</dt>
                  <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                    {brand.followers.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Engagement</dt>
                  <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                    {brand.engagement_rate != null
                      ? `${brand.engagement_rate.toFixed(2)}%`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Score</dt>
                  <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                    {brand.score}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Ubicación</dt>
                  <dd className="text-zinc-800 dark:text-zinc-200">
                    {[brand.city, brand.country].filter(Boolean).join(', ') || '—'}
                  </dd>
                </div>
              </dl>
              {brand.instagram_url && (
                <a
                  href={brand.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-600 hover:underline dark:text-sky-400"
                >
                  Ver en Instagram
                </a>
              )}
            </div>
          </div>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled={readOnly}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Teléfono
              </label>
              <input
                value={phone}
                disabled={readOnly}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900"
              />
            </div>
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
