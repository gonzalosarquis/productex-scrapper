'use client'

import { useCallback, useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'

import { Badge } from '@/components/Badge'
import { BrandModal } from '@/components/BrandModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { ExportModal } from '@/components/ExportModal'
import { VirtualTable, type ColumnDef } from '@/components/VirtualTable'
import { useBrands } from '@/hooks/useBrands'
import type { Brand } from '@/lib/types'

export function BrandsList() {
  const { brands, loading, updateBrand, deleteBrand } = useBrands()

  const [usernameQ, setUsernameQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [countryQ, setCountryQ] = useState('')
  const [minFollowers, setMinFollowers] = useState('')
  const [onlyWithEmail, setOnlyWithEmail] = useState(false)

  const [brandModal, setBrandModal] = useState<{
    brand: Brand
    readOnly: boolean
  } | null>(null)
  const [deleteBrandRow, setDeleteBrandRow] = useState<Brand | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const filtered = useMemo(() => {
    const minF = minFollowers.trim() === '' ? null : Number(minFollowers)
    return brands.filter((b) => {
      if (
        usernameQ &&
        !b.username.toLowerCase().includes(usernameQ.trim().toLowerCase())
      ) {
        return false
      }
      if (statusFilter && b.status !== statusFilter) return false
      if (
        countryQ &&
        !(b.country ?? '').toLowerCase().includes(countryQ.trim().toLowerCase())
      ) {
        return false
      }
      if (minF !== null && (!Number.isFinite(minF) || b.followers < minF)) {
        return false
      }
      if (onlyWithEmail && !b.email) return false
      return true
    })
  }, [brands, usernameQ, statusFilter, countryQ, minFollowers, onlyWithEmail])

  const columns: ColumnDef<Brand>[] = useMemo(
    () => [
      {
        key: 'username',
        label: 'Usuario',
        render: (b) => (
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            @{b.username}
          </span>
        ),
      },
      {
        key: 'followers',
        label: 'Seguidores',
        render: (b) => (
          <span className="tabular-nums">{b.followers.toLocaleString()}</span>
        ),
      },
      {
        key: 'score',
        label: 'Score',
        render: (b) => <span className="tabular-nums">{b.score}</span>,
      },
      {
        key: 'status',
        label: 'Estado',
        render: (b) => <Badge status={b.status}>{b.status}</Badge>,
      },
      {
        key: 'email',
        label: 'Email',
        render: (b) => (
          <span className="max-w-[180px] truncate text-zinc-600 dark:text-zinc-400">
            {b.email ?? '—'}
          </span>
        ),
      },
      {
        key: 'country',
        label: 'País',
        render: (b) => b.country ?? '—',
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
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Usuario
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={usernameQ}
                onChange={(e) => setUsernameQ(e.target.value)}
                placeholder="Buscar…"
                className="w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-3 text-sm dark:border-zinc-600 dark:bg-zinc-900"
              />
            </div>
          </div>
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-zinc-500">
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
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              País
            </label>
            <input
              value={countryQ}
              onChange={(e) => setCountryQ(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
            />
          </div>
          <div className="w-28">
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Min. seguidores
            </label>
            <input
              type="number"
              min={0}
              value={minFollowers}
              onChange={(e) => setMinFollowers(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={onlyWithEmail}
              onChange={(e) => setOnlyWithEmail(e.target.checked)}
            />
            Con email
          </label>
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
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
        emptyMessage="No hay marcas que coincidan con los filtros."
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
        title="Eliminar marca"
        message={
          deleteBrandRow
            ? `¿Eliminar @${deleteBrandRow.username}? Esta acción no se puede deshacer.`
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
