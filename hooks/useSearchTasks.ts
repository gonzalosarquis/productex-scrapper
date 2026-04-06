'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import type { ApifyRunStatus } from '@/lib/apify'
import { createClient } from '@/lib/supabase/client'
import type { SearchFormData, SearchTask } from '@/lib/types'

export function useSearchTasks() {
  const [tasks, setTasks] = useState<SearchTask[]>([])
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

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await requireSession()
      if (!token) {
        return
      }

      const res = await fetch('/api/search', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = (await res.json().catch(() => ({}))) as {
        tasks?: SearchTask[]
        error?: string
      }

      if (!res.ok) {
        const msg =
          typeof json.error === 'string'
            ? json.error
            : 'Error al cargar búsquedas'
        setError(msg)
        toast.error(msg)
        return
      }

      setTasks(Array.isArray(json.tasks) ? json.tasks : [])
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Error al cargar búsquedas'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [requireSession])

  const startSearch = useCallback(
    async (data: SearchFormData) => {
      setLoading(true)
      setError(null)
      try {
        const token = await requireSession()
        if (!token) {
          return
        }

        const maxRaw = data.max_followers.trim()
        const max_followers =
          maxRaw === '' ? null : Number(maxRaw)
        if (max_followers !== null && Number.isNaN(max_followers)) {
          const msg = 'Máximo de seguidores inválido'
          setError(msg)
          toast.error(msg)
          return
        }

        const res = await fetch('/api/search', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: data.name,
            keywords: data.keywords,
            countries: data.countries,
            cities: data.cities,
            min_followers: data.min_followers,
            max_followers,
          }),
        })

        const json = (await res.json().catch(() => ({}))) as {
          task?: SearchTask
          error?: string
        }

        if (!res.ok) {
          const msg =
            typeof json.error === 'string'
              ? json.error
              : 'No se pudo iniciar la búsqueda'
          setError(msg)
          toast.error(msg)
          if (json.task) {
            setTasks((prev) => mergeTask(prev, json.task as SearchTask))
          }
          return
        }

        if (json.task) {
          setTasks((prev) => mergeTask(prev, json.task as SearchTask))
        }
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'No se pudo iniciar la búsqueda'
        setError(msg)
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    },
    [requireSession]
  )

  const getSearchStatus = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)
      try {
        const token = await requireSession()
        if (!token) {
          return null
        }

        const res = await fetch(
          `/api/search/${encodeURIComponent(id)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        const json = (await res.json().catch(() => ({}))) as {
          task?: SearchTask
          status?: ApifyRunStatus | null
          error?: string
        }

        if (!res.ok) {
          const msg =
            typeof json.error === 'string'
              ? json.error
              : 'Error al obtener el estado de la búsqueda'
          setError(msg)
          toast.error(msg)
          return null
        }

        if (json.task) {
          setTasks((prev) => mergeTask(prev, json.task as SearchTask))
        }

        return {
          task: json.task as SearchTask,
          status: json.status ?? null,
        }
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : 'Error al obtener el estado de la búsqueda'
        setError(msg)
        toast.error(msg)
        return null
      } finally {
        setLoading(false)
      }
    },
    [requireSession]
  )

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    startSearch,
    getSearchStatus,
  }
}

function mergeTask(prev: SearchTask[], task: SearchTask): SearchTask[] {
  const idx = prev.findIndex((t) => t.id === task.id)
  if (idx < 0) {
    return [task, ...prev]
  }
  const next = [...prev]
  next[idx] = task
  return next
}
