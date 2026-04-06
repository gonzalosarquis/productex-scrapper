'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import { Download, ExternalLink, Instagram, Search, Star } from 'lucide-react'

import { Badge } from '@/components/Badge'
import { BrandModal } from '@/components/BrandModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { ExportModal } from '@/components/ExportModal'
import { VirtualTable, type ColumnDef } from '@/components/VirtualTable'
import { useBrands } from '@/hooks/useBrands'
import type { Brand } from '@/lib/types'

function BrandsListInner() {
  const { brands, loading, updateBrand, deleteBrand } = useBrands()

  const [nameQ, setNameQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [cityQ, setCityQ] = useState('')
  const [minRating, setMinRating] = useState('')
  const [onlyWithInstagram, setOnlyWithInstagram] = useState(false)
  const [onlyWithPhone, setOnlyWithPhone] = useState(false)

  const [brandModal, setBrandModal] = useState<{
    brand: Brand
    readOnly: boolean
  } | null>(null)
  const [deleteBrandRow, setDeleteBrandRow] = useState<Brand | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const filtered = useMemo(() => {
    const minR = minRating.trim() === '' ? null : Number(minRating)
    return brands.filter((b) => {
      if (
        nameQ &&
        !b.name.toLowerCase().includes(nameQ.trim().toLowerCase())
      ) {
        return false
      }
      if (statusFilter && b.status !== statusFilter) return false
      if (
        cityQ &&
        !(b.city ?? '').toLowerCase().includes(cityQ.trim().toLowerCase())
      ) {
        return false
      }
      if (
        minR !== null &&
        (!Number.isFinite(minR) || (b.rating ?? 0) < minR)
      ) {
        return false
      }
      if (onlyWithInstagram && !b.instagram_url) return false
      if (onlyWithPhone && !b.phone) return false
      return true
    })
  }, [
    brands,
    nameQ,
    statusFilter,
    cityQ,
    minRating,
    onlyWithInstagram,
    onlyWithPhone,
  ])

  const columns: ColumnDef<Brand>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Nombre',
        render: (b) => (
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {b.google_maps_url ? (
              <a
                href={b.google_maps_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sky-600 hover:underline dark:text-sky-400"
              >
                {b.name}
                <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
              </a>
            ) : (
              b.name
            )}
          </span>
        ),
      },
      {
        key: 'phone',
        label: 'Teléfono',
        render: (b) => (
          <span className="tabular-nums text-zinc-700 dark:text-zinc-300">
            {b.phone ?? '—'}
          </span>
        ),
      },
      {
        key: 'city',
        label: 'Ciudad',
        render: (b) => b.city ?? '—',
      },
      {
        key: 'rating',
        label: 'Rating',
        render: (b) => (
          <span className="inline-flex items-center gap-0.5 tabular-nums">
            {b.rating != null ? (
              <>
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {b.rating.toFixed(1)}
              </>
            ) : (
              '—'
            )}
          </span>
        ),
      },
      {
        key: 'reviews',
        label: 'Reseñas',
        render: (b) => (
          <span className="tabular-nums">
            {b.reviews_count != null ? b.reviews_count : '—'}
          </span>
        ),
      },
      {
        key: 'instagram',
        label: 'Instagram',
        render: (b) =>
          b.instagram_url ? (
            <a
              href={b.instagram_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-pink-600 hover:text-pink-500 dark:text-pink-400"
              title="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
          ) : (
            '—'
          ),
      },
      {
        key: 'status',
        label: 'Estado',
        render: (b) => <Badge status={b.status}>{b.status}</Badge>,
      },
    ],
    []
  )

  const handleSave = useCallback(
    async (id: string, data: Partial<Brand>) => {
      const result = await updateBrand(id, data)
      if (!result) {
        throw new Error('update failed')
      }
    },
    [updateBrand]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px] flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Nombre
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={nameQ}
                onChange={(e) => setNameQ(e.target.value)}
                placeholder="Buscar…"
                className="w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-3 text-sm dark:border-zinc-600 dark:bg-zinc-900"
              />
            </div>
          </div>
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
            >
              <option value="">Todos</option>
              <option value="pending">pending</option>
              <option value="contacted">contacted</option>
              <option value="interested">interested</option>
              <option value="rejected">rejected</option>
              <option value="client">client</option>
            </select>
          </div>
          <div className="min-w-[120px] flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Ciudad
            </label>
            <input
              value={cityQ}
              onChange={(e) => setCityQ(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
            />
          </div>
          <div className="w-24">
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Rating mín.
            </label>
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={onlyWithInstagram}
              onChange={(e) => setOnlyWithInstagram(e.target.checked)}
            />
            Con Instagram
          </label>
          <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={onlyWithPhone}
              onChange={(e) => setOnlyWithPhone(e.target.checked)}
            />
            Con teléfono
          </label>
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      <VirtualTable<Brand>
        data={filtered}
        columns={columns}
        getRowId={(b) => b.id}
        loading={loading}
        emptyMessage="No hay tiendas que coincidan con los filtros."
        onView={(b) => setBrandModal({ brand: b, readOnly: true })}
        onEdit={(b) => setBrandModal({ brand: b, readOnly: false })}
        onDelete={(b) => setDeleteBrandRow(b)}
      />

      <BrandModal
        brand={brandModal?.brand ?? null}
        isOpen={!!brandModal}
        readOnly={brandModal?.readOnly}
        onClose={() => setBrandModal(null)}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={!!deleteBrandRow}
        title="Eliminar tienda"
        message={
          deleteBrandRow
            ? `¿Eliminar "${deleteBrandRow.name}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous
        onCancel={() => setDeleteBrandRow(null)}
        onConfirm={async () => {
          if (!deleteBrandRow) return
          await deleteBrand(deleteBrandRow.id)
          setDeleteBrandRow(null)
        }}
      />

      <ExportModal
        brands={filtered}
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
      />
    </div>
  )
}

export const BrandsList = memo(BrandsListInner)
