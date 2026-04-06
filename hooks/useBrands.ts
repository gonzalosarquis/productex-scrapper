'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import type { Brand } from '@/lib/types'

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requireSession = useCallback(async (): Promise<string | null> => {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      window.location.href = '/auth'
      return null
    }
    return session.access_token
  }, [])

  const fetchBrands = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await requireSession()
      if (!token) {
        return
      }

      const res = await fetch('/api/brands', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = (await res.json().catch(() => ({}))) as {
        brands?: Brand[]
        error?: string
      }

      if (!res.ok) {
        const msg =
          typeof json.error === 'string'
            ? json.error
            : 'Error al cargar marcas'
        setError(msg)
        toast.error(msg)
        return
      }

      setBrands(Array.isArray(json.brands) ? json.brands : [])
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Error al cargar marcas'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [requireSession])

  useEffect(() => {
    void fetchBrands()
  }, [fetchBrands])

  const updateBrand = useCallback(
    async (id: string, data: Partial<Brand>) => {
      setError(null)
      try {
        const token = await requireSession()
        if (!token) {
          return null
        }

        const res = await fetch(`/api/brands/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        const json = (await res.json().catch(() => ({}))) as {
          brand?: Brand
          error?: string
        }

        if (!res.ok) {
          const msg =
            typeof json.error === 'string'
              ? json.error
              : 'No se pudo actualizar la marca'
          setError(msg)
          toast.error(msg)
          return null
        }

        const updated = json.brand
        if (updated) {
          setBrands((prev) =>
            prev.map((b) => (b.id === id ? updated : b))
          )
        }
        return updated ?? null
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'No se pudo actualizar la marca'
        setError(msg)
        toast.error(msg)
        return null
      }
    },
    [requireSession]
  )

  const deleteBrand = useCallback(
    async (id: string) => {
      setError(null)
      try {
        const token = await requireSession()
        if (!token) {
          return false
        }

        const res = await fetch(`/api/brands/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })

        const json = (await res.json().catch(() => ({}))) as {
          error?: string
        }

        if (!res.ok) {
          const msg =
            typeof json.error === 'string'
              ? json.error
              : 'No se pudo eliminar la marca'
          setError(msg)
          toast.error(msg)
          return false
        }

        setBrands((prev) => prev.filter((b) => b.id !== id))
        return true
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'No se pudo eliminar la marca'
        setError(msg)
        toast.error(msg)
        return false
      }
    },
    [requireSession]
  )

  return {
    brands,
    loading,
    error,
    refetch: fetchBrands,
    updateBrand,
    deleteBrand,
  }
}
